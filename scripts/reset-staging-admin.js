import { randomUUID } from 'node:crypto'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb'
import { passwordHash } from '../server/password.js'

const table = 'albert-cms-staging-api-CmsTable-IRPMELF0742D'
const email = 'asanfle@methodicatechnology.com'
const origin = 'https://d34buqdfi1n3fd.cloudfront.net'
const result = { resetCommitted: false, loginStatus: null, sessionClosed: false }

async function readPassword() {
  if (process.stdin.isTTY) throw new Error('password_pipe_required')
  let input = ''
  for await (const chunk of process.stdin) {
    input += chunk.toString('utf8')
    if (input.length > 256) throw new Error('invalid_password_input')
  }
  if (!/^\S{28,128}\r?\n$/.test(input)) throw new Error('invalid_password_input')
  return input.replace(/\r?\n$/, '')
}

async function verifyLogin(password) {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await new Promise(resolve => setTimeout(resolve, attempt * 1500))
    const response = await fetch(`${origin}/api/login`, {
      method: 'POST', signal: AbortSignal.timeout(10000),
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, code: '' }),
    })
    result.loginStatus = response.status
    if (response.status !== 200) continue
    const body = await response.json()
    if (body.mfaConfigured) throw new Error('mfa_state_changed')
    const cookie = response.headers.get('set-cookie')?.split(';')[0]
    if (cookie && body.csrf) {
      const logout = await fetch(`${origin}/api/logout`, {
        method: 'POST', signal: AbortSignal.timeout(10000),
        headers: { Origin: origin, Cookie: cookie, 'X-CSRF-Token': body.csrf },
      })
      result.sessionClosed = logout.status === 200
    }
    return
  }
}

try {
  let password = await readPassword()
  if (process.env.AWS_PROFILE !== 'default' || process.env.AWS_REGION !== 'us-east-1')
    throw new Error('wrong_aws_environment')
  const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }))
  const guard = await client.send(new GetCommand({ TableName: table,
    Key: { pk: 'ADMIN#SINGLETON', sk: 'LOCK' }, ConsistentRead: true }))
  if (!guard.Item?.admin_id) throw new Error('admin_not_found')
  const key = { pk: `ADMIN#${guard.Item.admin_id}`, sk: 'PROFILE' }
  const profile = await client.send(new GetCommand({ TableName: table, Key: key, ConsistentRead: true }))
  const admin = profile.Item
  if (!admin || admin.id !== guard.Item.admin_id || admin.email !== email ||
      admin.gsi1pk !== `EMAIL#${email}` || admin.role !== 'superadmin' ||
      !/^[a-f0-9]{48}$/.test(admin.password_salt || '') ||
      !/^[a-f0-9]{128}$/.test(admin.password_hash || ''))
    throw new Error('admin_mismatch')
  if (admin.totp_secret && !admin.totp_secret.startsWith('pending:'))
    throw new Error('mfa_already_enabled')

  const credentials = passwordHash(password)
  const now = new Date().toISOString()
  const auditId = randomUUID()
  await client.send(new TransactWriteCommand({ TransactItems: [
    { Update: { TableName: table, Key: key,
      UpdateExpression: 'SET #hash=:hash,#salt=:salt,#updated=:date ADD #version :one',
      ConditionExpression: '#email=:email AND #index=:index AND #role=:role AND #hash=:previous AND #salt=:oldSalt AND (attribute_not_exists(#totp) OR begins_with(#totp,:pending))',
      ExpressionAttributeNames: { '#hash': 'password_hash', '#salt': 'password_salt',
        '#updated': 'updated_at', '#version': 'auth_version', '#email': 'email',
        '#index': 'gsi1pk', '#role': 'role', '#totp': 'totp_secret' },
      ExpressionAttributeValues: { ':hash': credentials.value, ':salt': credentials.salt,
        ':date': now, ':one': 1, ':email': email, ':index': `EMAIL#${email}`,
        ':role': 'superadmin', ':previous': admin.password_hash,
        ':oldSalt': admin.password_salt, ':pending': 'pending:' } } },
    { Put: { TableName: table, Item: { pk: `AUDIT#${auditId}`, sk: 'META', entity: 'audit',
      id: auditId, admin_id: admin.id, action: 'owner_password_reset_windows_vault',
      target: 'staging-admin', created_at: now }, ConditionExpression: 'attribute_not_exists(pk)' } },
  ] }))
  result.resetCommitted = true
  await verifyLogin(password)
  password = ''
  process.exitCode = result.loginStatus === 200 && result.sessionClosed ? 0 : 2
} catch (error) {
  result.error = result.resetCommitted ? 'verification_failed' :
    ['wrong_aws_environment', 'password_pipe_required', 'invalid_password_input',
      'admin_not_found', 'admin_mismatch', 'mfa_already_enabled'].includes(error.message) ?
      error.message : 'reset_failed'
  process.exitCode = 1
}

console.log(JSON.stringify(result))
