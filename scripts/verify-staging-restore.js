import { createHash } from 'node:crypto'
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'

const region = 'us-east-1'
const sourceTable = 'albert-cms-staging-api-CmsTable-IRPMELF0742D'
const restoredTable = 'albert-cms-staging-restore-20261021'
const sourceBucket = 'albert-cms-staging-api-cmsmedia-y63puile7rsz'
const restoredBucket = 'albert-cms-staging-restore-479324457361-20261021'
const ddb = new DynamoDBClient({ region })
const s3 = new S3Client({ region })
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

async function tableItems(table) {
  const items = new Map()
  let ExclusiveStartKey
  do {
    const page = await ddb.send(new ScanCommand({ TableName: table, ExclusiveStartKey,
      ConsistentRead: true }))
    for (const value of page.Items || []) {
      const item = unmarshall(value)
      const key = `${item.pk}\0${item.sk}`
      if (items.has(key)) throw new Error(`Clave duplicada en ${table}`)
      items.set(key, item)
    }
    ExclusiveStartKey = page.LastEvaluatedKey
  } while (ExclusiveStartKey)
  return items
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') return Object.fromEntries(
    Object.keys(value).sort().map(key => [key, canonical(value[key])]))
  return value
}

async function objectHashes(bucket) {
  const objects = new Map()
  let ContinuationToken
  do {
    const page = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: 'media/',
      ContinuationToken }))
    for (const entry of page.Contents || []) {
      const response = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: entry.Key }))
      objects.set(entry.Key, sha256(await response.Body.transformToByteArray()))
    }
    ContinuationToken = page.NextContinuationToken
  } while (ContinuationToken)
  return objects
}

const [sourceItems, restoredItems, sourceFiles, restoredFiles] = await Promise.all([
  tableItems(sourceTable), tableItems(restoredTable), objectHashes(sourceBucket), objectHashes(restoredBucket),
])
const durable = ([key]) => !key.startsWith('RATE#') && !key.startsWith('SESSION#')
const sourceDurable = new Map([...sourceItems].filter(durable))
const restoredDurable = new Map([...restoredItems].filter(durable))
const missingItems = [...sourceDurable.keys()].filter(key => !restoredDurable.has(key))
const extraItems = [...restoredDurable.keys()].filter(key => !sourceDurable.has(key))
const changedItems = [...sourceDurable.entries()].filter(([key, item]) => restoredDurable.has(key) &&
  sha256(JSON.stringify(canonical(item))) !== sha256(JSON.stringify(canonical(restoredDurable.get(key)))))
const missingFiles = [...sourceFiles.keys()].filter(key => !restoredFiles.has(key))
const extraFiles = [...restoredFiles.keys()].filter(key => !sourceFiles.has(key))
const changedFiles = [...sourceFiles.entries()].filter(([key, hash]) => restoredFiles.has(key) &&
  hash !== restoredFiles.get(key))
const missingItemEntities = Object.groupBy(missingItems, key => sourceDurable.get(key).entity ||
  sourceDurable.get(key).pk.split('#')[0])
const result = { sourceItems: sourceItems.size, restoredItems: restoredItems.size,
  sourceDurableItems: sourceDurable.size, restoredDurableItems: restoredDurable.size,
  missingItems: missingItems.length, extraItems: extraItems.length, changedItems: changedItems.length,
  missingItemEntities: Object.fromEntries(Object.entries(missingItemEntities).map(([entity, keys]) => [entity, keys.length])),
  sourceFiles: sourceFiles.size, restoredFiles: restoredFiles.size,
  missingFiles: missingFiles.length, extraFiles: extraFiles.length, changedFiles: changedFiles.length }
console.log(JSON.stringify(result))
if (missingItems.length || extraItems.length || changedItems.length || missingFiles.length ||
    extraFiles.length || changedFiles.length) process.exitCode = 1
