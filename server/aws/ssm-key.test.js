import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readTotpKey } from './ssm-key.js'

test('SSM lee sólo el parámetro MFA del entorno solicitado y valida su contenido', async () => {
  const name = '/albert-cms/staging/totp-key'
  let command
  const client = { send: async input => {
    command = input
    return { Parameter: { Value: 'ab'.repeat(32) } }
  } }
  assert.equal(await readTotpKey(name, client), 'ab'.repeat(32))
  assert.deepEqual(command.input, { Name: name, WithDecryption: true })
  const production = '/albert-cms/production/totp-key'
  assert.equal(await readTotpKey(production, client, 'production'), 'ab'.repeat(32))
  await assert.rejects(readTotpKey(name, client, 'production'), /no válido/)
  await assert.rejects(readTotpKey(production, client, 'staging'), /no válido/)
  await assert.rejects(readTotpKey('/other-project/key', client), /no válido/)
  await assert.rejects(readTotpKey(name, { send: async () => ({ Parameter: { Value: '1234' } }) }), /clave válida/)
})
