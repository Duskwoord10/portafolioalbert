import test from 'node:test'
import assert from 'node:assert/strict'
import { publicRequest, dedupedPublicRequest, cachedPublicRequest, clearPublicRequestCache, peekPublicRequest } from './publicRequests.js'

test('las lecturas públicas limitan picos y recuperan un 503 transitorio', async () => {
  let active = 0
  let peak = 0
  const attempts = new Map()
  const results = await Promise.all(Array.from({ length: 12 }, (_, id) => publicRequest(async () => {
    active += 1
    peak = Math.max(peak, active)
    await new Promise(resolve => setTimeout(resolve, 2))
    active -= 1
    const attempt = (attempts.get(id) || 0) + 1
    attempts.set(id, attempt)
    if (id === 3 && attempt === 1) throw Object.assign(new Error('Temporarily unavailable'), { status: 503 })
    return id
  })))
  assert.deepEqual(results, Array.from({ length: 12 }, (_, id) => id))
  assert.ok(peak <= 2)
  assert.equal(attempts.get(3), 2)
})

test('consultas simultáneas iguales comparten petición y la siguiente lectura consulta de nuevo', async () => {
  let calls = 0
  const fetchContent = async () => { calls += 1; await new Promise(resolve => setTimeout(resolve, 5)); return calls }
  const first = await Promise.all(Array.from({ length: 6 }, () =>
    dedupedPublicRequest('company', fetchContent)))
  assert.deepEqual(first, Array(6).fill(1))
  assert.equal(calls, 1)
  assert.equal(await dedupedPublicRequest('company', fetchContent), 2)
})

test('el contenido público queda disponible en memoria unos segundos para navegar sin esperar la API', async () => {
  clearPublicRequestCache()
  let calls = 0
  const fetchContent = async () => ++calls
  assert.equal(await cachedPublicRequest('home', fetchContent, 20), 1)
  assert.equal(await cachedPublicRequest('home', fetchContent, 20), 1)
  assert.equal(calls, 1)
  await new Promise(resolve => setTimeout(resolve, 25))
  assert.equal(await cachedPublicRequest('home', fetchContent, 20), 2)
  assert.equal(calls, 2)
  assert.equal(peekPublicRequest('home'), 2)
  clearPublicRequestCache()
})

test('la última lectura pública puede mostrarse mientras se revalida', async () => {
  clearPublicRequestCache()
  assert.equal(peekPublicRequest('about'), undefined)
  await cachedPublicRequest('about', async () => ({ title:'Perfil publicado' }))
  assert.deepEqual(peekPublicRequest('about'), { title:'Perfil publicado' })
  clearPublicRequestCache()
})
