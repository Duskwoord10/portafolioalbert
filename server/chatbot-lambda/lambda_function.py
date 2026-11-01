# lambda_function.py

import base64
import json
import os
import re
import traceback
import unicodedata
from typing import Any, Dict, List, Optional

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

from data import (
    APP_NAME,
    SYSTEM_PROMPT,
    DEFAULT_ASSISTANT_MESSAGE,
    AGE_RESPONSE,
    CERTIFICATIONS_RESPONSE,
    CONTACT_RESPONSE,
    WHO_IS_ALBERT_RESPONSE,
)


AWS_REGION = os.environ.get("AWS_REGION", "us-east-1").strip() or "us-east-1"
KIMI_MODEL = os.environ.get("KIMI_MODEL", "moonshotai.kimi-k2.5").strip() or "moonshotai.kimi-k2.5"

REQUEST_TIMEOUT = int(os.environ.get("REQUEST_TIMEOUT", "45"))
MAX_HISTORY_MESSAGES = 1
MAX_USER_MESSAGE_CHARS = min(max(int(os.environ.get("MAX_USER_MESSAGE_CHARS", "800")), 1), 1200)
MAX_REQUEST_BODY_BYTES = 8192
MAX_RESPONSE_TOKENS = int(os.environ.get("MAX_RESPONSE_TOKENS", "700"))
MODEL_TEMPERATURE = float(os.environ.get("MODEL_TEMPERATURE", "0.3"))


# CORS se configura en la Function URL para evitar cabeceras duplicadas.
HEADERS = {
    "Content-Type": "application/json; charset=utf-8",
}


class RequestTooLargeError(ValueError):
    pass


bedrock = boto3.client(
    "bedrock-runtime",
    region_name=AWS_REGION,
    config=Config(
        read_timeout=REQUEST_TIMEOUT,
        connect_timeout=10,
        retries={"max_attempts": 2},
    ),
)


def build_response(status_code: int, payload: Any) -> Dict[str, Any]:
    if isinstance(payload, str):
        body = payload
    else:
        body = json.dumps(payload, ensure_ascii=False)

    return {
        "statusCode": status_code,
        "headers": HEADERS,
        "body": body,
    }


def extract_text(content: Any) -> str:
    if content is None:
        return ""

    if isinstance(content, str):
        return content.strip()

    if isinstance(content, list):
        parts = []

        for item in content:
            text = extract_text(item)

            if text:
                parts.append(text)

        return "\n".join(parts).strip()

    if isinstance(content, dict):
        for key in ("text", "content", "message", "value"):
            value = content.get(key)

            if isinstance(value, str) and value.strip():
                return value.strip()

        if content.get("type") == "text" and isinstance(content.get("text"), str):
            return content["text"].strip()

    return ""


def clean_user_text(text: str) -> str:
    text = unicodedata.normalize("NFKC", text or "")
    text = text.replace("\r\n", "\n").replace("\r", "\n").strip()
    text = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", text)
    text = re.sub(r"[ \t]{2,}", " ", text)

    if len(text) > MAX_USER_MESSAGE_CHARS:
        text = text[:MAX_USER_MESSAGE_CHARS].strip()

    return text


def normalize_role(role: Any) -> str:
    role = str(role or "user").strip().lower()

    if role in {"user", "assistant"}:
        return role

    return "user"


def normalize_messages(raw_messages: Any) -> List[Dict[str, str]]:
    normalized = []

    if not isinstance(raw_messages, list):
        return normalized

    for msg in raw_messages[-MAX_HISTORY_MESSAGES:]:
        if not isinstance(msg, dict):
            continue

        role = normalize_role(msg.get("role", "user"))
        text = clean_user_text(extract_text(msg.get("content", "")))

        if not text:
            continue

        normalized.append({
            "role": role,
            "content": text,
        })

    return normalized


def normalize_history(raw_history: Any) -> List[Dict[str, str]]:
    normalized = []

    if not isinstance(raw_history, list):
        return normalized

    for msg in raw_history[-MAX_HISTORY_MESSAGES:]:
        if not isinstance(msg, dict):
            continue

        role = normalize_role(msg.get("role", "user"))
        content = msg.get("content") if msg.get("content") is not None else msg.get("text", "")
        text = clean_user_text(extract_text(content))

        if not text:
            continue

        normalized.append({
            "role": role,
            "content": text,
        })

    return normalized


def ensure_alternating_roles(messages: List[Dict[str, str]]) -> List[Dict[str, str]]:
    if not messages:
        return []

    fixed = []

    for msg in messages:
        if not fixed:
            fixed.append(msg.copy())
            continue

        if msg["role"] == fixed[-1]["role"]:
            fixed[-1]["content"] = f'{fixed[-1]["content"]}\n{msg["content"]}'.strip()
        else:
            fixed.append(msg.copy())

    if fixed and fixed[0]["role"] != "user":
        fixed.insert(0, {
            "role": "user",
            "content": "Hola",
        })

    return fixed[-MAX_HISTORY_MESSAGES:]


def clean_model_reply(text: str) -> str:
    if not text:
        return ""

    text = unicodedata.normalize("NFKC", text)
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    replacements = {
        "•": "-",
        "●": "-",
        "▪": "-",
        "▫": "-",
        "◦": "-",
        "—": "-",
        "–": "-",
        "…": "...",
        "\u00a0": " ",
    }

    for old, new in replacements.items():
        text = text.replace(old, new)

    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"\*(.+?)\*", r"\1", text)
    text = re.sub(r"__(.+?)__", r"\1", text)
    text = re.sub(r"_(.+?)_", r"\1", text)
    text = re.sub(r"`(.+?)`", r"\1", text)
    text = re.sub(r"^\s*#{1,6}\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"[|¦┃▏▎▍▌▋▊▉█▐░▒▓■□◆◇○●]+", " ", text)
    text = re.sub(r"[!¡?¿]{4,}", "", text)
    text = re.sub(r"([!?.])\1{2,}", r"\1", text)
    text = re.sub(r"([,\-=])\1{2,}", r"\1", text)

    cleaned_lines = []

    for line in text.split("\n"):
        stripped = line.strip()

        if not stripped:
            cleaned_lines.append("")
            continue

        if re.fullmatch(r"[!?.\-_=+|/\\\s]+", stripped):
            continue

        symbol_count = len(
            re.findall(r"[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s,.;:()/%\-]", stripped)
        )

        if len(stripped) > 0 and symbol_count / max(len(stripped), 1) > 0.45:
            continue

        cleaned_lines.append(stripped)

    text = "\n".join(cleaned_lines)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"\s+\n", "\n", text)
    text = text.strip()

    if len(re.findall(r"[A-Za-zÁÉÍÓÚáéíóúÑñ]", text)) < 8:
        return ""

    return text


def safe_fallback(user_text: str = "") -> str:
    lower = (user_text or "").lower()

    if any(word in lower for word in ("edad", "años", "age", "old")):
        return AGE_RESPONSE

    if any(word in lower for word in (
        "certificacion",
        "certificación",
        "certificaciones",
        "certificate",
        "certifications",
    )):
        return CERTIFICATIONS_RESPONSE

    if any(word in lower for word in (
        "contacto",
        "linkedin",
        "web",
        "website",
        "contact",
    )):
        return CONTACT_RESPONSE

    if "who" in lower or "quién" in lower or "quien" in lower:
        return WHO_IS_ALBERT_RESPONSE

    return DEFAULT_ASSISTANT_MESSAGE


def build_bedrock_messages(messages: List[Dict[str, str]]) -> List[Dict[str, Any]]:
    return [
        {
            "role": msg["role"],
            "content": [
                {
                    "text": msg["content"],
                }
            ],
        }
        for msg in messages
    ]


def call_kimi(messages: List[Dict[str, str]]) -> str:
    messages = ensure_alternating_roles(messages)

    if not messages:
        return safe_fallback()

    response = bedrock.converse(
        modelId=KIMI_MODEL,
        system=[
            {
                "text": SYSTEM_PROMPT,
            }
        ],
        messages=build_bedrock_messages(messages),
        inferenceConfig={
            "maxTokens": MAX_RESPONSE_TOKENS,
            "temperature": MODEL_TEMPERATURE,
        },
    )

    content_blocks = response.get("output", {}).get("message", {}).get("content", [])

    raw_reply = "\n".join(
        block.get("text", "").strip()
        for block in content_blocks
        if isinstance(block, dict)
        and isinstance(block.get("text"), str)
        and block.get("text", "").strip()
    )

    reply = clean_model_reply(raw_reply)

    if reply:
        return reply

    last_user_message = next(
        (msg["content"] for msg in reversed(messages) if msg["role"] == "user"),
        "",
    )

    return safe_fallback(last_user_message)


def parse_body(event: Dict[str, Any]) -> Dict[str, Any]:
    body_raw = event.get("body")

    if body_raw is None or body_raw == "":
        return {}

    if isinstance(body_raw, str) and len(body_raw.encode("utf-8")) > MAX_REQUEST_BODY_BYTES:
        raise RequestTooLargeError()

    if event.get("isBase64Encoded"):
        body_raw = base64.b64decode(body_raw).decode("utf-8")

    if not isinstance(body_raw, str):
        raise ValueError("El cuerpo de la solicitud no es válido.")

    if len(body_raw.encode("utf-8")) > MAX_REQUEST_BODY_BYTES:
        raise RequestTooLargeError()

    return json.loads(body_raw)


def get_http_method(event: Dict[str, Any]) -> str:
    request_context = event.get("requestContext") or {}
    http_info = request_context.get("http") or {}

    return (
        event.get("httpMethod")
        or http_info.get("method")
        or "POST"
    ).upper()


def build_chat_messages(body: Dict[str, Any]) -> List[Dict[str, str]]:
    # Never trust role labels or assistant turns supplied by a public client.
    raw_message = body.get("message")
    if not isinstance(raw_message, str):
        return []

    message = clean_user_text(raw_message)
    if not message:
        return []

    return [{"role": "user", "content": message}]


def lambda_handler(event: Dict[str, Any], context: Optional[Any]) -> Dict[str, Any]:
    try:
        method = get_http_method(event)

        # La Function URL responde al preflight; este caso cubre invocaciones directas.
        if method == "OPTIONS":
            return {
                "statusCode": 200,
                "headers": HEADERS,
                "body": "",
            }

        if method == "GET":
            return build_response(200, {
                "ok": True,
                "assistant": APP_NAME,
                "message": "Asistente de Albert Sanfle operativo.",
            })

        if method != "POST":
            return build_response(405, {
                "ok": False,
                "error": "Método no permitido.",
            })

        try:
            body = parse_body(event)
        except RequestTooLargeError:
            return build_response(413, {
                "ok": False,
                "error": "La solicitud supera el tamano permitido.",
            })
        except json.JSONDecodeError:
            return build_response(400, {
                "ok": False,
                "error": "La solicitud no tiene un JSON válido.",
            })
        except Exception:
            return build_response(400, {
                "ok": False,
                "error": "No se pudo leer el cuerpo de la solicitud.",
            })

        if not isinstance(body, dict):
            return build_response(400, {
                "ok": False,
                "error": "La solicitud no tiene el formato esperado.",
            })

        messages = build_chat_messages(body)

        if not messages:
            return build_response(400, {
                "ok": False,
                "error": "Debes enviar un mensaje válido.",
            })

        reply = call_kimi(messages)

        return build_response(200, {
            "ok": True,
            "assistant": APP_NAME,
            "message": reply,
            "model": KIMI_MODEL,
        })

    except ClientError as error:
        error_code = error.response.get("Error", {}).get("Code", "Unknown")
        error_msg = error.response.get("Error", {}).get("Message", "")

        print(f"Bedrock ClientError [{error_code}]: {error_msg}")

        if error_code in {"AccessDeniedException", "UnauthorizedException"}:
            return build_response(403, {
                "ok": False,
                "error": "El modelo no está habilitado o el rol de Lambda no tiene permisos suficientes.",
            })

        if error_code == "ValidationException":
            return build_response(400, {
                "ok": False,
                "error": "Los datos enviados no son válidos para el modelo.",
            })

        if error_code in {"ThrottlingException", "TooManyRequestsException"}:
            return build_response(429, {
                "ok": False,
                "error": "Demasiadas solicitudes. Intenta nuevamente en unos segundos.",
            })

        return build_response(502, {
            "ok": False,
            "error": "No pude responder en este momento. Intenta nuevamente.",
        })

    except BotoCoreError as error:
        print(f"BotoCoreError: {str(error)}")

        return build_response(502, {
            "ok": False,
            "error": "No pude conectar correctamente con Amazon Bedrock.",
        })

    except Exception as error:
        print("Lambda error:", str(error))
        print(traceback.format_exc())

        return build_response(500, {
            "ok": False,
            "error": "Ocurrió un error interno. Intenta nuevamente.",
        })


handler = lambda_handler
