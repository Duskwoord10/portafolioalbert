import { Readable, Writable } from 'node:stream'

process.env.CMS_LAMBDA_MODE = 'true'
if (process.env.CMS_TOTP_KEY_PARAMETER) {
  const { readTotpKey } = await import('./aws/ssm-key.js')
  process.env.CMS_TOTP_ENCRYPTION_KEY = await readTotpKey(process.env.CMS_TOTP_KEY_PARAMETER)
}
const { route, handleError } = await import('./index.js')

class LambdaResponse extends Writable {
  constructor() { super(); this.statusCode=200; this.headers={}; this.chunks=[] }
  setHeader(name,value) { this.headers[name.toLowerCase()]=value }
  getHeader(name) { return this.headers[name.toLowerCase()] }
  writeHead(status,headers={}) {
    this.statusCode=status
    for (const [name,value] of Object.entries(headers)) this.setHeader(name,value)
    return this
  }
  _write(chunk,_encoding,callback) { this.chunks.push(Buffer.from(chunk));callback() }
}

export async function handler(event) {
  if (event.version !== '2.0') throw new Error('Se requiere API Gateway HTTP API payload 2.0.')
  const headers=Object.fromEntries(Object.entries(event.headers || {})
    .map(([name,value]) => [name.toLowerCase(),value]))
  if (event.cookies?.length) headers.cookie=event.cookies.join('; ')
  const body=event.body ? Buffer.from(event.body,event.isBase64Encoded ? 'base64' : 'utf8') : Buffer.alloc(0)
  const req=Readable.from(body.length ? [body] : [])
  req.method=event.requestContext?.http?.method || 'GET'
  req.url=event.rawPath + (event.rawQueryString ? `?${event.rawQueryString}` : '')
  req.headers=headers
  req.socket={ remoteAddress:event.requestContext?.http?.sourceIp || 'unknown' }
  const res=new LambdaResponse()
  const done=new Promise((resolve,reject) => { res.once('finish',resolve);res.once('error',reject) })
  try { await route(req,res) } catch (error) { handleError(res,error) }
  await done
  const output=Buffer.concat(res.chunks)
  const cookies=res.getHeader('set-cookie')
  delete res.headers['set-cookie']
  return { statusCode:res.statusCode,headers:res.headers,
    ...(cookies ? { cookies:Array.isArray(cookies) ? cookies : [cookies] } : {}),
    body:output.toString('utf8'),isBase64Encoded:false }
}
