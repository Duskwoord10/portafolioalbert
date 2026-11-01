import test from 'node:test'
import assert from 'node:assert/strict'
import { createTranslationService } from './translation.js'

test('Amazon Translate service deduplicates identical text and preserves order', async () => {
  const calls=[]
  const service=createTranslationService({ send:async command => {
    calls.push(command.input)
    return { TranslatedText:`EN:${command.input.Text}` }
  } }, { cache:new Map() })
  assert.deepEqual(await service(['Hola','Mundo','Hola'],'es','en'),
    ['EN:Hola','EN:Mundo','EN:Hola'])
  assert.equal(calls.length,2)
  assert.equal(calls[0].SourceLanguageCode,'es')
  assert.equal(calls[0].TargetLanguageCode,'en')
})

test('translation cache reuses results within its lifetime', async () => {
  let clock=100
  let calls=0
  const service=createTranslationService({ send:async command => {
    calls+=1; return { TranslatedText:`EN:${command.input.Text}` }
  } }, { now:() => clock, cache:new Map() })
  await service(['Hola'],'es','en')
  await service(['Hola'],'es','en')
  assert.equal(calls,1)
  clock+=24*60*60*1000+1
  await service(['Hola'],'es','en')
  assert.equal(calls,2)
})

test('translation service rejects excessive or unsupported input', async () => {
  const service=createTranslationService({ send:async () => ({ TranslatedText:'x' }) }, { cache:new Map() })
  await assert.rejects(() => service(['Hola'],'es','fr'), { status:400 })
  await assert.rejects(() => service(['x'.repeat(1501)],'es','en'), { status:400 })
  await assert.rejects(() => service(Array(31).fill('x'),'es','en'), { status:400 })
})
