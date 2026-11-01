import { randomBytes } from 'node:crypto'
import { PutParameterCommand, SSMClient } from '@aws-sdk/client-ssm'

if (process.env.AWS_PROFILE !== 'default' || process.env.AWS_REGION !== 'us-east-1' ||
    process.env.CMS_PRODUCTION_KEY_CREATE !== 'APPROVED')
  throw new Error('Perfil, región o autorización de creación no válidos.')

const name = '/albert-cms/production/totp-key'
const value = randomBytes(32).toString('hex')
const client = new SSMClient({ region:'us-east-1' })
await client.send(new PutParameterCommand({ Name:name,Value:value,Type:'SecureString',
  Tier:'Standard',Overwrite:false,KeyId:'alias/aws/ssm',
  Tags:[{ Key:'Project',Value:'AlbertSanfleCMS' },{ Key:'Environment',Value:'production' }] }))
console.log(`SSM SecureString creado: ${name} (el valor no se muestra).`)
