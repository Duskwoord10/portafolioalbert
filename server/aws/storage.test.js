import test from 'node:test'
import assert from 'node:assert/strict'
import { S3Client } from '@aws-sdk/client-s3'
import { createMediaStorage } from './storage.js'

test('S3 usa objeto privado y enlace de lectura temporal',async () => {
  const calls=[]
  const name='123e4567-e89b-12d3-a456-426614174000.png'
  const writer=createMediaStorage({ backend:'s3',bucket:'cms-test-bucket',
    client:{ send:async command => { calls.push(command.input);return {} } } })
  await writer.put(name,Buffer.from('file'),'image/png')
  assert.equal(calls[0].Key,`media/${name}`)
  assert.equal(calls[0].ServerSideEncryption,'AES256')
  assert.equal(calls[0].IfNoneMatch,'*')
  await assert.rejects(() => writer.put('../outside.png',Buffer.from('x'),'image/png'))
  const signer=new S3Client({ region:'us-east-1',credentials:{
    accessKeyId:'TESTKEY',secretAccessKey:'test-secret-for-offline-signing' } })
  const reader=createMediaStorage({ backend:'s3',bucket:'cms-test-bucket',client:signer })
  const object=await reader.get(name)
  assert.match(object.url,/X-Amz-Expires=60/)
  assert.match(object.url,/media%2F123e4567|media\/123e4567/)
  const pdf=await reader.get('123e4567-e89b-12d3-a456-426614174000.pdf')
  assert.match(pdf.url,/response-content-disposition=attachment/)
  signer.destroy()
})
