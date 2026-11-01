import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm'

export async function readTotpKey(name, client = new SSMClient({}),
  environment = process.env.CMS_ENVIRONMENT || 'staging') {
  const parsed = /^\/albert-cms\/(staging|production)\/[a-zA-Z0-9/_-]+$/.exec(name || '')
  if (!parsed || parsed[1] !== environment)
    throw new Error('Nombre de parámetro MFA no válido.')
  const result = await client.send(new GetParameterCommand({ Name: name, WithDecryption: true }))
  const key = result.Parameter?.Value
  if (!/^[a-f0-9]{64}$/i.test(key || ''))
    throw new Error('El parámetro de cifrado MFA no contiene una clave válida.')
  return key
}
