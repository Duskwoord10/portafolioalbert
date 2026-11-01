import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { createHash } from 'node:crypto'

const table = 'albert-cms-staging-api-CmsTable-IRPMELF0742D'
const expectedEmail = 'asanfle@methodicatechnology.com'
const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }))
const guard = await client.send(new GetCommand({ TableName: table,
  Key: { pk: 'ADMIN#SINGLETON', sk: 'LOCK' }, ConsistentRead: true,
  ProjectionExpression: 'admin_id' }))
const profile = guard.Item?.admin_id ? await client.send(new GetCommand({ TableName: table,
  Key: { pk: `ADMIN#${guard.Item.admin_id}`, sk: 'PROFILE' }, ConsistentRead: true })) : null
const admin = profile?.Item
const lookup = await client.send(new QueryCommand({ TableName: table, IndexName: 'gsi1',
  KeyConditionExpression: 'gsi1pk = :email', ExpressionAttributeValues: {
    ':email': `EMAIL#${expectedEmail}` }, Limit: 2 }))
const loginWindow = Math.floor(Date.now() / (15 * 60_000))
const hashedEmail = createHash('sha256').update(expectedEmail).digest('hex')
const attempts = await client.send(new GetCommand({ TableName: table,
  Key: { pk: `RATE#login#${hashedEmail}`, sk: `WINDOW#${loginWindow}` }, ConsistentRead: true,
  ProjectionExpression: 'hits' }))
const resetAudits = await client.send(new ScanCommand({ TableName: table,
  FilterExpression: '#action = :action', ExpressionAttributeNames: { '#action': 'action' },
  ExpressionAttributeValues: { ':action': 'owner_password_reset_offline' }, Select: 'COUNT' }))
const result = {
  guardExists: !!guard.Item,
  profileExists: !!admin,
  emailMatchesRequested: admin?.email === expectedEmail,
  emailNormalized: admin?.email === admin?.email?.trim().toLowerCase(),
  emailIndexMatches: admin?.gsi1pk === `EMAIL#${expectedEmail}`,
  emailLookupFindsProfile: (lookup.Items || []).some(item => item.id === guard.Item?.admin_id),
  roleIsSuperadmin: admin?.role === 'superadmin',
  activeField: admin?.active ?? null,
  mfaState: !admin?.totp_secret ? 'not-configured' :
    admin.totp_secret.startsWith('pending:') ? 'pending' : 'configured',
  passwordSaltFormatValid: typeof admin?.password_salt === 'string' &&
    /^[a-f0-9]{48}$/.test(admin.password_salt),
  passwordHashFormatValid: typeof admin?.password_hash === 'string' &&
    /^[a-f0-9]{128}$/.test(admin.password_hash),
  loginAttemptsThisWindow: Number(attempts.Item?.hits || 0),
  loginRateLimited: Number(attempts.Item?.hits || 0) >= 8,
  offlineResetAudits: resetAudits.Count || 0,
}
console.log(JSON.stringify(result))
if (Object.entries(result).some(([name, value]) => name.endsWith('Valid') && !value)) process.exitCode = 1
