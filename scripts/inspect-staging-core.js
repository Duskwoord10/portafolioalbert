import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'

const table = 'albert-cms-staging-api-CmsTable-IRPMELF0742D'
const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }))
const digest = value => createHash('sha256').update(value || '').digest('hex').slice(0, 16)
const rows = []
let ExclusiveStartKey
do {
  const page = await client.send(new ScanCommand({ TableName: table, ConsistentRead: true,
    FilterExpression: '#entity = :content AND (#kind = :about OR #kind = :menu)',
    ExpressionAttributeNames: { '#entity': 'entity', '#kind': 'kind' },
    ExpressionAttributeValues: { ':content': 'content', ':about': 'about', ':menu': 'menu' },
    ExclusiveStartKey }))
  rows.push(...(page.Items || []))
  ExclusiveStartKey = page.LastEvaluatedKey
} while (ExclusiveStartKey)
const snapshot = []
for (const row of rows) {
  const revisions = []
  let next
  do {
    const page = await client.send(new QueryCommand({ TableName: table, ConsistentRead: true,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      ExpressionAttributeValues: { ':pk': row.pk, ':prefix': 'REV#' }, ExclusiveStartKey: next }))
    revisions.push(...(page.Items || []))
    next = page.LastEvaluatedKey
  } while (next)
  revisions.sort((a, b) => b.created_at.localeCompare(a.created_at))
  snapshot.push({ row, revisions })
  console.log(JSON.stringify({ kind: row.kind, slug: row.slug, id: row.id, status: row.status,
    title: row.title, updated_at: row.updated_at, version: row.version, data_hash: digest(row.data_json),
    revisions: revisions.slice(0, 8).map(r => ({ id: r.id, status: r.status,
      created_at: r.created_at, data_hash: digest(r.data_json), title: r.title })) }))
}
if (process.argv.includes('--backup')) {
  const dir = resolve('.cms-backups', `staging-core-${new Date().toISOString().replace(/[:.]/g, '-')}`)
  mkdirSync(dir, { recursive: true })
  writeFileSync(resolve(dir, 'about-menu-revisions.json'), JSON.stringify({ table, captured_at: new Date().toISOString(), snapshot }, null, 2))
  console.log(`Backup: ${dir}; registros=${snapshot.length}; revisiones=${snapshot.reduce((n, item) => n + item.revisions.length, 0)}`)
}
