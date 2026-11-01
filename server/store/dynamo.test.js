import test from 'node:test'
import assert from 'node:assert/strict'

process.env.CMS_DYNAMODB_TABLE='cms-test'
const { store,setDynamoClientForTests } = await import('./dynamo.js')

test('DynamoDB publica con revisión y guarda condicional de URL',async () => {
  const items=new Map()
  const itemKey=value => `${value.pk}\0${value.sk}`
  const client={ async send(command) {
    const input=command.input
    if (command.constructor.name === 'GetCommand') return { Item:items.get(itemKey(input.Key)) }
    if (command.constructor.name === 'QueryCommand') {
      const partition=input.ExpressionAttributeValues[':pk'] || input.ExpressionAttributeValues[':kind']
      const matched=[...items.values()].filter(row => input.IndexName === 'gsi1' ?
        row.gsi1pk === partition : row.pk === partition &&
        row.sk.startsWith(input.ExpressionAttributeValues[':prefix'] || ''))
      return { Items:matched,Count:matched.length }
    }
    if (command.constructor.name === 'TransactWriteCommand') {
      for (const action of input.TransactItems) {
        const put=action.Put,del=action.Delete
        if (action.Update) continue
        const prior=items.get(itemKey(put?.Item || del?.Key))
        const condition=put?.ConditionExpression || del?.ConditionExpression
        const fail=condition === 'attribute_not_exists(pk)' && prior ||
          condition === 'attribute_exists(pk) AND attribute_not_exists(version)' && (!prior || prior.version) ||
          condition === 'version = :previous' && prior?.version !== put.ExpressionAttributeValues[':previous'] ||
          condition === 'content_id = :id' && prior?.content_id !== del.ExpressionAttributeValues[':id']
        if (fail) throw Object.assign(new Error('transaction cancelled'),{
          name:'TransactionCanceledException',CancellationReasons:[{ Code:'ConditionalCheckFailed' }] })
      }
      for (const action of input.TransactItems) {
        if (action.Put) items.set(itemKey(action.Put.Item),action.Put.Item)
        if (action.Delete) items.delete(itemKey(action.Delete.Key))
        if (action.Update) {
          const update=action.Update,prior=items.get(itemKey(update.Key)) || update.Key
          items.set(itemKey(update.Key),{ ...prior,
            views:(prior.views || 0)+1,entity:'pageviews',day:update.ExpressionAttributeValues[':day'],
            path:update.ExpressionAttributeValues[':path'] })
        }
      }
      return {}
    }
    throw new Error(`Comando inesperado: ${command.constructor.name}`)
  } }
  setDynamoClientForTests(client)
  const draft=await store.saveContent('project',null,{ title:'Proyecto real',slug:'proyecto-real',
    status:'draft',dataJson:'{"summary":"Ejemplo de prueba"}',sortOrder:0 },'admin-test')
  assert.equal((await store.publicContent('project','proyecto-real')).length,0)
  const published=await store.saveContent('project',draft.id,{ title:draft.title,slug:draft.slug,
    status:'published',dataJson:draft.data_json,sortOrder:0 },'admin-test')
  assert.equal(published.version,2)
  assert.equal((await store.publicContent('project','proyecto-real'))[0].id,draft.id)
  assert.equal((await store.revisions(draft.id)).length,1)
  assert.equal((await store.contentCounts()).project,1)
  await assert.rejects(() => store.saveContent('project',null,{ title:'Colisión',slug:'proyecto-real',
    status:'published',dataJson:'{}',sortOrder:0 },'admin-test'),{ status:409 })
  const eventId='123e4567-e89b-12d3-a456-426614174000'
  assert.equal(await store.pageview('2026-10-20','/proyectos',eventId),true)
  assert.equal(await store.pageview('2026-10-20','/proyectos',eventId),false)
  assert.equal(items.get('ANALYTICS#2026-10-20\0PAGE#/proyectos').views,1)
})
