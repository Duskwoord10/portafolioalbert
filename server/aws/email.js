import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'
import { writeFile } from 'node:fs/promises'

const client = new SESv2Client({})

export async function sendPasswordRecovery(email, code) {
  const from = process.env.CMS_RECOVERY_FROM_EMAIL
  if (!from) throw new Error('El remitente de recuperación no está configurado.')
  if (process.env.NODE_ENV === 'test' && process.env.CMS_RECOVERY_TEST_OUTBOX) {
    await writeFile(process.env.CMS_RECOVERY_TEST_OUTBOX, JSON.stringify({ email, code }), { mode:0o600 })
    return
  }
  await client.send(new SendEmailCommand({
    FromEmailAddress: from,
    Destination: { ToAddresses: [email] },
    Content: { Simple: {
      Subject: { Data: 'Código de recuperación del CMS Albert Sanfle', Charset: 'UTF-8' },
      Body: { Text: { Charset: 'UTF-8', Data:
        `Solicitaste restablecer la contraseña del CMS Albert Sanfle.\n\n` +
        `Código de un solo uso: ${code}\n\n` +
        `Vence en 15 minutos. Si no hiciste esta solicitud, ignora este mensaje.\n` +
        `Si ya activaste MFA, también necesitarás tu aplicación autenticadora.\n` } },
    } },
  }))
}
