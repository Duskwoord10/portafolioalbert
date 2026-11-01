import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const root=mkdtempSync(join(tmpdir(),'cms-lambda-'))
process.env.CMS_DB_PATH=join(root,'cms.sqlite')
process.env.CMS_MEDIA_DIR=join(root,'media')
process.env.CMS_DATA_BACKEND='sqlite'
const { handler } = await import('./lambda.js')
const { db } = await import('./db.js')
const event=(method,path,body) => ({ version:'2.0',rawPath:path,rawQueryString:'',
  requestContext:{ http:{ method,sourceIp:'127.0.0.1' } },
  headers:{ origin:'http://localhost:5173','content-type':'application/json' },
  ...(body ? { body:JSON.stringify(body) } : {}) })

test('Lambda HTTP API responde y protege las mutaciones',async t => {
  t.after(() => { db.close(); rmSync(root,{ recursive:true,force:true }) })
  const health=await handler(event('GET','/api/health'))
  assert.equal(health.statusCode,200)
  assert.deepEqual(JSON.parse(health.body),{ ok:true })
  const publicContent=await handler(event('GET','/api/public/blog'))
  assert.equal(publicContent.statusCode,200)
  assert.ok(JSON.parse(publicContent.body).length > 0)
  const badTranslation=await handler(event('POST','/api/public/translate',{
    texts:['Hola'],sourceLanguage:'es',targetLanguage:'fr' }))
  assert.equal(badTranslation.statusCode,400)
  const nonObjectTranslation=await handler({ ...event('POST','/api/public/translate'),body:'null' })
  assert.equal(nonObjectTranslation.statusCode,400)
  const chatDisabled=await handler(event('POST','/api/public/chat',{ message:'hola' }))
  assert.equal(chatDisabled.statusCode,503)
  const chatForeignOrigin=await handler({ ...event('POST','/api/public/chat',{ message:'hola' }),
    headers:{ origin:'https://attacker.example','content-type':'application/json' } })
  assert.equal(chatForeignOrigin.statusCode,403)
  const unauthorized=await handler(event('POST','/api/admin/project',{ title:'Prueba' }))
  assert.equal(unauthorized.statusCode,401)
  const sitemap=await handler(event('GET','/sitemap.xml'))
  assert.equal(sitemap.statusCode,200)
  assert.match(sitemap.body,/<urlset/)
})
