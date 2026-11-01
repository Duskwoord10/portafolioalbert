import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
export { checkPassword, passwordHash } from './password.js'

const keyText = process.env.CMS_TOTP_ENCRYPTION_KEY
if (process.env.NODE_ENV === 'production' && !keyText)
  throw new Error('CMS_TOTP_ENCRYPTION_KEY es obligatorio en producción.')
if (keyText && !/^[a-f0-9]{64}$/i.test(keyText))
  throw new Error('CMS_TOTP_ENCRYPTION_KEY debe tener 32 bytes hexadecimales.')
const totpKey = keyText ? Buffer.from(keyText, 'hex') : null

export function encryptTotp(secret) {
  if (!totpKey) return secret
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', totpKey, iv)
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()])
  return `enc:v1:${Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url')}`
}

export const hasTotpEncryptionKey = Boolean(totpKey)

export function decryptTotp(value) {
  if (!value?.startsWith('enc:v1:')) return value
  if (!totpKey) throw new Error('Falta la clave de cifrado MFA para leer los datos existentes.')
  const bytes = Buffer.from(value.slice(7), 'base64url')
  if (bytes.length < 28) throw new Error('Secreto MFA cifrado inválido.')
  const decipher = createDecipheriv('aes-256-gcm', totpKey, bytes.subarray(0, 12))
  decipher.setAuthTag(bytes.subarray(12, 28))
  return Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString('utf8')
}

export function readTotp(value) {
  return value?.startsWith('pending:') ? `pending:${decryptTotp(value.slice(8))}` : decryptTotp(value)
}

export const hash = value => createHash('sha256').update(value).digest('hex')
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
export function newTotpSecret() {
  const bytes = randomBytes(20)
  let bits = 0, value = 0, result = ''
  for (const byte of bytes) {
    value = (value << 8) | byte; bits += 8
    while (bits >= 5) { result += alphabet[(value >>> (bits -= 5)) & 31] }
  }
  return result
}
function decodeBase32(secret) {
  let bits = 0, value = 0
  const out = []
  for (const char of secret.replace(/\s|=/g, '').toUpperCase()) {
    const digit = alphabet.indexOf(char)
    if (digit < 0) throw new Error('Secreto MFA inválido')
    value = (value << 5) | digit; bits += 5
    if (bits >= 8) out.push((value >>> (bits -= 8)) & 255)
  }
  return Buffer.from(out)
}
export function verifyTotp(secret, code, now = Date.now()) {
  if (!/^\d{6}$/.test(String(code))) return false
  const key = decodeBase32(secret)
  const target = Buffer.from(String(code))
  for (let offset = -1; offset <= 1; offset++) {
    const counter = Buffer.alloc(8)
    counter.writeBigUInt64BE(BigInt(Math.floor(now / 30000) + offset))
    const digest = createHmac('sha1', key).update(counter).digest()
    const start = digest[digest.length - 1] & 15
    const number = (digest.readUInt32BE(start) & 0x7fffffff) % 1_000_000
    if (timingSafeEqual(Buffer.from(String(number).padStart(6, '0')), target)) return true
  }
  return false
}
