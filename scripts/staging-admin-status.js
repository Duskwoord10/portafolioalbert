import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'

const table = process.env.CMS_DYNAMODB_TABLE
if (table !== 'albert-cms-staging-api-CmsTable-IRPMELF0742D')
  throw new Error('Tabla de staging no configurada.')
const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }))
const result = await client.send(new GetCommand({ TableName: table,
  Key: { pk: 'ADMIN#SINGLETON', sk: 'LOCK' }, ConsistentRead: true,
  ProjectionExpression: 'admin_id' }))
if (!result.Item) {
  console.log('Administrador permanente: pendiente')
} else {
  const profile = await client.send(new GetCommand({ TableName: table,
    Key: { pk: `ADMIN#${result.Item.admin_id}`, sk: 'PROFILE' }, ConsistentRead: true,
    ProjectionExpression: 'totp_secret' }))
  const mfaConfigured = !!profile.Item?.totp_secret && !profile.Item.totp_secret.startsWith('pending:')
  console.log(`Administrador permanente: creado; MFA: ${mfaConfigured ? 'activo' : 'pendiente'}`)
}
