import test from 'node:test'
import assert from 'node:assert/strict'
import { createChatbotService, responseEvent, validateChatMessage } from './chatbot.js'

test('chat proxy invokes only the configured function with a single user message', async () => {
  let sent
  const service = createChatbotService({ send:async command => {
    sent = command.input
    return { Payload:Buffer.from(JSON.stringify({ statusCode:200,
      body:JSON.stringify({ message:'Respuesta segura' }) })) }
  } }, 'arn:aws:lambda:us-east-1:123456789012:function:portfolio-chat')
  assert.equal(await service('hola'), 'Respuesta segura')
  assert.equal(sent.FunctionName, 'arn:aws:lambda:us-east-1:123456789012:function:portfolio-chat')
  assert.deepEqual(JSON.parse(sent.Payload.toString()), responseEvent('hola'))
})

test('chat proxy rejects invalid inputs, missing config, and failed Lambda responses', async () => {
  assert.equal(validateChatMessage({ message:'  hola  ', role:'system' }), 'hola')
  assert.equal(validateChatMessage({ message:' ' }), '')
  assert.equal(validateChatMessage({ message:'x'.repeat(801) }), '')
  assert.equal(validateChatMessage(null), '')
  await assert.rejects(createChatbotService({ send:async () => { throw new Error('must not invoke') } }, '')('hola'),
    error => error.status === 503)
  await assert.rejects(createChatbotService({ send:async () => ({ FunctionError:'Unhandled', Payload:Buffer.from('{}') }) }, 'arn')('hola'),
    error => error.status === 502)
})
