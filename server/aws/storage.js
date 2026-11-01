import { createReadStream, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const namePattern = /^[a-f0-9-]+\.(?:jpg|png|webp|avif|pdf)$/

export function createMediaStorage(options = {}) {
  const backend = options.backend || process.env.CMS_MEDIA_BACKEND || 'local'
  if (backend === 'local') {
    const directory = resolve(options.directory || process.env.CMS_MEDIA_DIR || '.cms-data/media')
    mkdirSync(directory, { recursive: true })
    return {
      async put(name, bytes) {
        if (!namePattern.test(name)) throw new Error('Nombre de archivo inválido.')
        writeFileSync(join(directory, name), bytes, { flag: 'wx' })
      },
      async get(name) {
        if (!namePattern.test(name) || !existsSync(join(directory, name))) return null
        return { stream: createReadStream(join(directory, name)) }
      },
    }
  }
  if (backend !== 's3') throw new Error(`CMS_MEDIA_BACKEND inválido: ${backend}`)
  const bucket = options.bucket || process.env.CMS_S3_BUCKET
  if (!bucket) throw new Error('CMS_S3_BUCKET es obligatorio para S3.')
  const client = options.client || new S3Client({})
  const key = name => {
    if (!namePattern.test(name)) throw new Error('Nombre de archivo inválido.')
    return `media/${name}`
  }
  return {
    async put(name, bytes, mime) {
      await client.send(new PutObjectCommand({ Bucket: bucket, Key: key(name), Body: bytes,
        ContentType: mime, ServerSideEncryption: 'AES256', IfNoneMatch: '*' }))
    },
    async get(name) {
      try {
        const url = await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key(name),
          ...(name.endsWith('.pdf') ? { ResponseContentDisposition:'attachment' } : {}) }),
          { expiresIn: 60 })
        return { url }
      } catch (error) {
        if (error.name === 'NoSuchKey' || error.name === 'NotFound') return null
        throw error
      }
    },
  }
}
