import { InvokeCommand } from '@aws-sdk/client-lambda'

export const responseEvent = message => ({ version:'2.0', routeKey:'POST /', rawPath:'/',
  headers:{ 'content-type':'application/json' }, requestContext:{ http:{ method:'POST', path:'/' } },
  body:JSON.stringify({ message }), isBase64Encoded:false })

export function validateChatMessage(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return ''
  if (typeof input.message !== 'string' || input.message.length > 800) return ''
  return input.message.trim()
}

export function createChatbotService(client, functionArn) {
  return async function askChatbot(message) {
    if (!functionArn) throw Object.assign(new Error('Chatbot is not configured.'), { status:503 })
    const result = await client.send(new InvokeCommand({ FunctionName:functionArn,
      InvocationType:'RequestResponse', Payload:Buffer.from(JSON.stringify(responseEvent(message))) }))
    if (result.FunctionError || !result.Payload)
      throw Object.assign(new Error('Chatbot invocation failed.'), { status:502 })
    let response
    try { response = JSON.parse(Buffer.from(result.Payload).toString('utf8')) }
    catch { throw Object.assign(new Error('Chatbot returned an invalid response.'), { status:502 }) }
    if (response.statusCode !== 200 || typeof response.body !== 'string')
      throw Object.assign(new Error('Chatbot is temporarily unavailable.'), { status:503 })
    let payload
    try { payload = JSON.parse(response.body) }
    catch { throw Object.assign(new Error('Chatbot returned an invalid response.'), { status:502 }) }
    const answer = typeof payload.message === 'string' ? payload.message.trim().slice(0,4000) : ''
    if (!answer) throw Object.assign(new Error('Chatbot returned no answer.'), { status:502 })
    return answer
  }
}
