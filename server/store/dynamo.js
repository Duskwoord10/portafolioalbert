import { randomUUID } from 'node:crypto'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, ScanCommand,
  UpdateCommand, DeleteCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb'

const table = process.env.CMS_DYNAMODB_TABLE
if (!table) throw new Error('CMS_DYNAMODB_TABLE es obligatorio para DynamoDB.')
let client = DynamoDBDocumentClient.from(new DynamoDBClient({}), { marshallOptions:{ removeUndefinedValues:true } })
export function setDynamoClientForTests(fake) {
  if (process.env.NODE_ENV === 'production') throw new Error('No se permite sustituir el cliente DynamoDB en producción.')
  client=fake
}
const now = () => new Date().toISOString()
const key = (pk,sk='META') => ({ pk,sk })
const get = async (pk,sk='META') => (await client.send(new GetCommand({ TableName:table,
  Key:key(pk,sk), ConsistentRead:true }))).Item || null
const put = item => client.send(new PutCommand({ TableName:table, Item:item }))
async function collect(command, params) {
  const rows = []
  let next
  do {
    const page = await client.send(new command({ TableName:table, ...params,
      ...(next ? { ExclusiveStartKey:next } : {}) }))
    rows.push(...(page.Items || []))
    next = page.LastEvaluatedKey
  } while (next)
  return rows
}
const query = params => collect(QueryCommand,params)
const gsi = partition => query({ IndexName:'gsi1', KeyConditionExpression:'gsi1pk = :pk',
  ExpressionAttributeValues:{ ':pk':partition } })
const contentKey = id => `CONTENT#${id}`
const contentIndex = row => ({ gsi1pk:`KIND#${row.kind}`,
  gsi1sk:`${row.status}#${String(row.sort_order).padStart(12,'0')}#${row.updated_at}#${row.id}` })
const contentKinds = ['home','about','company','experience','project','certification','event','album','blog',
  'page','education','skill','award','cv','menu','setting']
const cursorKey = (cursor,kind,scope) => {
  if (!cursor) return undefined
  try { const value=JSON.parse(Buffer.from(cursor,'base64url').toString('utf8'))
    if (value.kind !== kind || value.scope !== scope || value.key?.gsi1pk !== `KIND#${kind}` ||
      !['pk','sk','gsi1pk','gsi1sk'].every(field => typeof value.key[field] === 'string')) throw new Error()
    return value.key
  } catch { throw Object.assign(new Error('Cursor inválido.'),{ status:400 }) }
}
const nextCursor = (key,kind,scope) => key ? Buffer.from(JSON.stringify({ kind,scope,key })).toString('base64url') : null
const byOrder = (a,b) => a.sort_order - b.sort_order || b.updated_at.localeCompare(a.updated_at)
const conflict = () => Object.assign(new Error('El contenido cambió o la URL ya existe.'), { status:409 })
const saveItem = async (row, prior, adminId) => {
  const operations = []
  if (!prior || prior.slug !== row.slug) operations.push({ Put:{ TableName:table,
    Item:{ ...key(`SLUG#${row.kind}#${row.slug}`,'LOCK'), entity:'slug_guard', content_id:row.id },
    ConditionExpression:'attribute_not_exists(pk)' } })
  if (prior && prior.slug !== row.slug) operations.push({ Delete:{ TableName:table,
    Key:key(`SLUG#${row.kind}#${prior.slug}`,'LOCK'), ConditionExpression:'content_id = :id',
    ExpressionAttributeValues:{ ':id':row.id } } })
  if (prior) {
    const revisionId=randomUUID(), createdAt=now()
    operations.push({ Put:{ TableName:table,
      Item:{ ...key(contentKey(prior.id),`REV#${createdAt}#${revisionId}`), entity:'revisions',
        id:revisionId,content_id:prior.id,status:prior.status,title:prior.title,data_json:prior.data_json,
        created_at:createdAt,admin_id:adminId }, ConditionExpression:'attribute_not_exists(pk)' } })
  }
  const version = (prior?.version || 0) + 1
  operations.push({ Put:{ TableName:table, Item:{ ...row, ...contentIndex(row), version },
    ConditionExpression:prior?.version ? 'version = :previous' :
      prior ? 'attribute_exists(pk) AND attribute_not_exists(version)' : 'attribute_not_exists(pk)',
    ...(prior?.version ? { ExpressionAttributeValues:{ ':previous':prior.version } } : {}) } })
  try { await client.send(new TransactWriteCommand({ TransactItems:operations })) }
  catch (error) { if (error.name === 'TransactionCanceledException') throw conflict(); throw error }
  return { ...row, ...contentIndex(row), version }
}
export const store = {
  async ready() { await client.config.region() },
  async rateLimit(scope,keyHash,limit,intervalMs,weight=1) {
    const window=Math.floor(Date.now()/intervalMs)
    const result=await client.send(new UpdateCommand({ TableName:table,
      Key:key(`RATE#${scope}#${keyHash}`,`WINDOW#${window}`),
      UpdateExpression:'ADD hits :weight SET #ttl=:ttl',
      ExpressionAttributeNames:{ '#ttl':'ttl' },
      ExpressionAttributeValues:{ ':weight':weight,':ttl':Math.ceil((window+2)*intervalMs/1000) },
      ReturnValues:'UPDATED_NEW' }))
    return Number(result.Attributes.hits) > limit
  },
  async audit(adminId,action,target) { const id=randomUUID(); await put({ ...key(`AUDIT#${id}`),
    entity:'audit', id,admin_id:adminId,action,target:target || null,created_at:now() }) },
  async session(tokenHash) {
    const row = await get(`SESSION#${tokenHash}`)
    if (!row || row.expires_at <= now()) return null
    const admin = await this.adminById(row.admin_id)
    return admin && (row.auth_version || 0) === (admin.auth_version || 0) ?
      { ...row,email:admin.email,role:admin.role,totp_secret:admin.totp_secret } : null
  },
  adminById(id) { return get(`ADMIN#${id}`,'PROFILE') },
  async adminByEmail(email) { const rows=await gsi(`EMAIL#${email}`); return rows[0] || null },
  async adminCount() { return (await get('ADMIN#SINGLETON','LOCK')) ? 1 :
    (await collect(ScanCommand,{ FilterExpression:'#entity=:entity',
      ExpressionAttributeNames:{ '#entity':'entity' },ExpressionAttributeValues:{ ':entity':'admins' } })).length },
  async createAdmin(row) {
    const existing=await this.adminCount()
    if (existing) throw conflict()
    await client.send(new TransactWriteCommand({ TransactItems:[
      { Put:{ TableName:table,Item:{ ...key('ADMIN#SINGLETON','LOCK'),entity:'admin_guard',admin_id:row.id },
        ConditionExpression:'attribute_not_exists(pk)' } },
      { Put:{ TableName:table,Item:{ ...key(`ADMIN#${row.id}`,'PROFILE'),entity:'admins',...row,
        gsi1pk:`EMAIL#${row.email}`,gsi1sk:`ADMIN#${row.id}` },ConditionExpression:'attribute_not_exists(pk)' } },
    ] }))
  },
  async createSession(row) { await client.send(new PutCommand({ TableName:table,
    Item:{ ...key(`SESSION#${row.token_hash}`), entity:'sessions',...row,
      gsi1pk:`SESSIONS#${row.admin_id}`,gsi1sk:`${row.created_at}#${row.token_hash}`,
      ttl:Math.ceil(new Date(row.expires_at).getTime()/1000) },
    ConditionExpression:'attribute_not_exists(pk)' })) },
  deleteSession(tokenHash) { return client.send(new DeleteCommand({ TableName:table,
    Key:key(`SESSION#${tokenHash}`) })) },
  setTotp(id,secret,updatedAt) { return client.send(new UpdateCommand({ TableName:table,
    Key:key(`ADMIN#${id}`,'PROFILE'),UpdateExpression:'SET totp_secret=:secret,updated_at=:date',
    ExpressionAttributeValues:{ ':secret':secret,':date':updatedAt },ConditionExpression:'attribute_exists(pk)' })) },
  setPassword(id,credentials,updatedAt) { return client.send(new UpdateCommand({ TableName:table,
    Key:key(`ADMIN#${id}`,'PROFILE'),UpdateExpression:'SET password_hash=:hash,password_salt=:salt,updated_at=:date',
    ExpressionAttributeValues:{ ':hash':credentials.value,':salt':credentials.salt,':date':updatedAt },
    ConditionExpression:'attribute_exists(pk)' })) },
  setRecoveryCode(id,codeHash,updatedAt) { return client.send(new UpdateCommand({ TableName:table,
    Key:key(`ADMIN#${id}`,'PROFILE'),UpdateExpression:'SET recovery_hash=:hash,updated_at=:date',
    ExpressionAttributeValues:{ ':hash':codeHash,':date':updatedAt },
    ConditionExpression:'attribute_exists(pk)' })) },
  setEmailRecoveryCode(id,codeHash,expiresAt,updatedAt) { return client.send(new UpdateCommand({ TableName:table,
    Key:key(`ADMIN#${id}`,'PROFILE'),
    UpdateExpression:'SET email_recovery_hash=:hash,email_recovery_expires_at=:expires,updated_at=:date',
    ExpressionAttributeValues:{ ':hash':codeHash,':expires':expiresAt,':date':updatedAt },
    ConditionExpression:'attribute_exists(pk)' })) },
  clearEmailRecoveryCode(id,codeHash) { return client.send(new UpdateCommand({ TableName:table,
    Key:key(`ADMIN#${id}`,'PROFILE'),
    UpdateExpression:'REMOVE email_recovery_hash,email_recovery_expires_at',
    ExpressionAttributeValues:{ ':hash':codeHash },ConditionExpression:'email_recovery_hash=:hash' })) },
  async recoverPasswordByEmail(id,codeHash,credentials,updatedAt) {
    try { await client.send(new UpdateCommand({ TableName:table,Key:key(`ADMIN#${id}`,'PROFILE'),
      UpdateExpression:'SET password_hash=:password,password_salt=:salt,updated_at=:date REMOVE email_recovery_hash,email_recovery_expires_at ADD auth_version :one',
      ExpressionAttributeValues:{ ':password':credentials.value,':salt':credentials.salt,
        ':date':updatedAt,':one':1,':hash':codeHash },
      ConditionExpression:'email_recovery_hash=:hash AND email_recovery_expires_at>:date' }))
      return true
    } catch (error) { if (error.name === 'ConditionalCheckFailedException') return false; throw error }
  },
  async recoverPassword(id,codeHash,credentials,updatedAt) {
    try { await client.send(new UpdateCommand({ TableName:table,Key:key(`ADMIN#${id}`,'PROFILE'),
      UpdateExpression:'SET password_hash=:password,password_salt=:salt,updated_at=:date REMOVE recovery_hash ADD auth_version :one',
      ExpressionAttributeValues:{ ':password':credentials.value,':salt':credentials.salt,
        ':date':updatedAt,':one':1,':hash':codeHash },
      ConditionExpression:'recovery_hash=:hash' }))
      return true
    } catch (error) { if (error.name === 'ConditionalCheckFailedException') return false; throw error }
  },
  async sessions(adminId,current) { const admin=await this.adminById(adminId)
    return (await gsi(`SESSIONS#${adminId}`))
    .filter(row => row.expires_at > now() && (row.auth_version || 0) === (admin?.auth_version || 0))
    .sort((a,b) => b.created_at.localeCompare(a.created_at))
    .map(row => ({ token_hash:row.token_hash,created_at:row.created_at,expires_at:row.expires_at,
      current:row.token_hash === current })) },
  async revokeOtherSessions(adminId,current) { for (const row of await gsi(`SESSIONS#${adminId}`))
    if (row.token_hash !== current) await this.deleteSession(row.token_hash) },
  async companyExists(id) { const row=await get(contentKey(id)); return row?.kind === 'company' && row.status !== 'trash' },
  async sitemapEntries() { const chunks=await Promise.all(['blog','page','project','event','album','experience']
    .map(kind => this.publicContent(kind))); return chunks.flat().map(({ kind,slug,updated_at }) => ({ kind,slug,updated_at })) },
  async pageview(day,path,eventId) {
    const update={ TableName:table,Key:key(`ANALYTICS#${day}`,`PAGE#${path}`),
      UpdateExpression:'ADD #views :one SET #day=:day,#path=:path,#entity=:entity',
      ExpressionAttributeNames:{ '#views':'views','#day':'day','#path':'path','#entity':'entity' },
      ExpressionAttributeValues:{ ':one':1,':day':day,':path':path,':entity':'pageviews' } }
    if (!eventId) return client.send(new UpdateCommand(update))
    try { await client.send(new TransactWriteCommand({ TransactItems:[
      { Put:{ TableName:table,Item:{ ...key(`DEDUP#${eventId}`,'PAGE'),
        ttl:Math.ceil(Date.now()/1000)+86400 },ConditionExpression:'attribute_not_exists(pk)' } },
      { Update:update },
    ] })) } catch(error) {
      if (error.name === 'TransactionCanceledException' &&
          error.CancellationReasons?.[0]?.Code === 'ConditionalCheckFailed') return false
      throw error
    }
    return true
  },
  async interaction(day,event,path,eventId) {
    const update={ TableName:table,Key:key(`ANALYTICS#${day}`,`EVENT#${event}#${path}`),
      UpdateExpression:'ADD #count :one SET #day=:day,#event=:event,#path=:path,#entity=:entity',
      ExpressionAttributeNames:{ '#count':'count','#day':'day','#event':'event','#path':'path','#entity':'entity' },
      ExpressionAttributeValues:{ ':one':1,':day':day,':event':event,':path':path,':entity':'interactions' } }
    if (!eventId) return client.send(new UpdateCommand(update))
    try { await client.send(new TransactWriteCommand({ TransactItems:[
      { Put:{ TableName:table,Item:{ ...key(`DEDUP#${eventId}`,'EVENT'),
        ttl:Math.ceil(Date.now()/1000)+86400 },ConditionExpression:'attribute_not_exists(pk)' } },
      { Update:update },
    ] })) } catch(error) {
      if (error.name === 'TransactionCanceledException' &&
          error.CancellationReasons?.[0]?.Code === 'ConditionalCheckFailed') return false
      throw error
    }
    return true
  },
  createMessage(row) { return client.send(new PutCommand({ TableName:table,
    Item:{ ...key(`MESSAGE#${row.id}`),entity:'messages',...row,gsi1pk:'MESSAGES',
      gsi1sk:`${row.created_at}#${row.id}` },ConditionExpression:'attribute_not_exists(pk)' })) },
  async messages() { return (await gsi('MESSAGES')).sort((a,b) => b.created_at.localeCompare(a.created_at)).slice(0,200) },
  async updateMessage(id,status) { try { await client.send(new UpdateCommand({ TableName:table,
    Key:key(`MESSAGE#${id}`),UpdateExpression:'SET #status=:status',
    ExpressionAttributeNames:{ '#status':'status' },ExpressionAttributeValues:{ ':status':status },
    ConditionExpression:'attribute_exists(pk)' })); return true }
    catch(error) { if(error.name === 'ConditionalCheckFailedException') return false; throw error } },
  async analytics(since) {
    const days=[], pages=new Map(), interactions=new Map()
    for (let date=new Date(`${since}T00:00:00Z`); date<=new Date(); date.setUTCDate(date.getUTCDate()+1)) {
      const day=date.toISOString().slice(0,10)
      const rows=await query({ KeyConditionExpression:'pk=:pk',ExpressionAttributeValues:{ ':pk':`ANALYTICS#${day}` } })
      let views=0
      for (const row of rows) {
        if (row.entity === 'pageviews') { views+=row.views; pages.set(row.path,(pages.get(row.path)||0)+row.views) }
        else if (row.entity === 'interactions') { const k=`${row.event}\0${row.path}`;
          interactions.set(k,(interactions.get(k)||0)+row.count) }
      }
      if (views) days.push({ day,views })
    }
    return { days,pages:[...pages].map(([path,views]) => ({ path,views })).sort((a,b)=>b.views-a.views).slice(0,30),
      interactions:[...interactions].map(([k,count]) => { const [event,path]=k.split('\0');return {event,path,count} })
        .sort((a,b)=>b.count-a.count).slice(0,30) }
  },
  async analyticsPath(since,path) {
    const days=[]
    for(let date=new Date(`${since}T00:00:00Z`);date<=new Date();date.setUTCDate(date.getUTCDate()+1)) {
      const day=date.toISOString().slice(0,10)
      const row=await get(`ANALYTICS#${day}`,`PAGE#${path}`)
      if(row?.views) days.push({ day,views:row.views })
    }
    return { views:days.reduce((total,row) => total+row.views,0),days }
  },
  async publicContent(kind,slug) {
    if (slug) { const owner=await get(`SLUG#${kind}#${slug}`,'LOCK');
      const row=owner && await get(contentKey(owner.content_id)); return row?.status === 'published' ? [row] : [] }
    return (await gsi(`KIND#${kind}`)).filter(row => row.status === 'published').sort(byOrder)
  },
  async publicContentPage(kind,limit,cursor) {
    const page=await client.send(new QueryCommand({ TableName:table,IndexName:'gsi1',
      KeyConditionExpression:'gsi1pk=:kind AND begins_with(gsi1sk,:status)',
      ExpressionAttributeValues:{ ':kind':`KIND#${kind}`,':status':'published#' },
      Limit:limit,ExclusiveStartKey:cursorKey(cursor,kind,'public') }))
    return { items:page.Items || [],nextCursor:nextCursor(page.LastEvaluatedKey,kind,'public') }
  },
  media(id) { return get(`MEDIA#${id}`) },
  async mediaList() { return (await gsi('MEDIA')).sort((a,b)=>b.created_at.localeCompare(a.created_at)) },
  async mediaPage(limit,cursor) {
    let start
    if (cursor) {
      try { const value=JSON.parse(Buffer.from(cursor,'base64url').toString('utf8'))
        if (value.scope !== 'media' || value.key?.gsi1pk !== 'MEDIA' ||
          !['pk','sk','gsi1pk','gsi1sk'].every(field => typeof value.key[field] === 'string')) throw new Error()
        start=value.key
      } catch { throw Object.assign(new Error('Cursor invÃ¡lido.'),{ status:400 }) }
    }
    const page=await client.send(new QueryCommand({ TableName:table,IndexName:'gsi1',
      KeyConditionExpression:'gsi1pk=:media',ExpressionAttributeValues:{ ':media':'MEDIA' },
      ScanIndexForward:false,Limit:limit,...(start ? { ExclusiveStartKey:start } : {}) }))
    return { items:page.Items || [],nextCursor:page.LastEvaluatedKey ?
      Buffer.from(JSON.stringify({ scope:'media',key:page.LastEvaluatedKey })).toString('base64url') : null }
  },
  createMedia(row) { return client.send(new PutCommand({ TableName:table,
    Item:{ ...key(`MEDIA#${row.id}`),entity:'media',...row,gsi1pk:'MEDIA',
      gsi1sk:`${row.created_at}#${row.id}` },ConditionExpression:'attribute_not_exists(pk)' })) },
  updateMedia(id,alt,access) { return client.send(new UpdateCommand({ TableName:table,
    Key:key(`MEDIA#${id}`),UpdateExpression:'SET alt=:alt,#access=:access',
    ExpressionAttributeNames:{ '#access':'access' },
    ExpressionAttributeValues:{ ':alt':alt,':access':access },ConditionExpression:'attribute_exists(pk)' })) },
  mediaTrash(id,deletedAt) { return client.send(new UpdateCommand({ TableName:table,
    Key:key(`MEDIA#${id}`),UpdateExpression:'SET deleted_at=:date',
    ExpressionAttributeValues:{ ':date':deletedAt },ConditionExpression:'attribute_exists(pk)' })) },
  mediaRestore(id) { return client.send(new UpdateCommand({ TableName:table,
    Key:key(`MEDIA#${id}`),UpdateExpression:'REMOVE deleted_at',ConditionExpression:'attribute_exists(pk)' })) },
  async mediaReferenced(id) { for(const kind of contentKinds) for(const row of await gsi(`KIND#${kind}`))
    if(row.status !== 'trash' && row.data_json?.includes(`/api/media/${id}`)) return true; return false },
  async revisions(id) { return (await query({ KeyConditionExpression:'pk=:pk AND begins_with(sk,:prefix)',
    ExpressionAttributeValues:{ ':pk':contentKey(id),':prefix':'REV#' } }))
    .sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0,30) },
  async revision(id,contentId) { return (await this.revisions(contentId)).find(row => row.id === id) || null },
  async content(kind,id) { const row=await get(contentKey(id)); return row?.kind === kind ? row : null },
  async contentList(kind) { return (await gsi(`KIND#${kind}`)).sort(byOrder).slice(0,200) },
  async contentCounts() { return Object.fromEntries(await Promise.all(contentKinds.map(async kind => {
    let count=0,next
    do { const page=await client.send(new QueryCommand({ TableName:table,IndexName:'gsi1',
      KeyConditionExpression:'gsi1pk=:kind',ExpressionAttributeValues:{ ':kind':`KIND#${kind}` },
      Select:'COUNT',...(next ? { ExclusiveStartKey:next } : {}) }))
      count+=page.Count || 0; next=page.LastEvaluatedKey
    } while(next)
    return [kind,count]
  }))) },
  async contentPage(kind,limit,cursor) {
    const page=await client.send(new QueryCommand({ TableName:table,IndexName:'gsi1',
      KeyConditionExpression:'gsi1pk=:kind',ExpressionAttributeValues:{ ':kind':`KIND#${kind}` },
      Limit:limit,ExclusiveStartKey:cursorKey(cursor,kind,'admin') }))
    return { items:page.Items || [],nextCursor:nextCursor(page.LastEvaluatedKey,kind,'admin') }
  },
  async slugOwner(kind,slug) { return (await get(`SLUG#${kind}#${slug}`,'LOCK'))?.content_id },
  async saveContent(kind,id,value,adminId) {
    const prior=id ? await this.content(kind,id) : null
    if (id && !prior) return null
    id ||= randomUUID()
    const timestamp=now()
    const row={ ...key(contentKey(id)),entity:'content',id,kind,slug:value.slug,title:value.title,
      status:value.status,data_json:value.dataJson,sort_order:value.sortOrder,
      published_at:value.status === 'published' ? prior?.published_at || timestamp : prior?.published_at || null,
      created_at:prior?.created_at || timestamp,updated_at:timestamp }
    return saveItem(row,prior,adminId)
  },
  async trashContent(kind,id,adminId) { const prior=await this.content(kind,id); if(!prior) return false
    const row={ ...prior,status:'trash',updated_at:now() }; await saveItem(row,prior,adminId); return true },
  async restoreContent(kind,id,revisionId,adminId) { const prior=await this.content(kind,id)
    const old=await this.revision(revisionId,id); if(!prior || !old) return false
    const row={ ...prior,title:old.title,data_json:old.data_json,status:'draft',updated_at:now() }
    await saveItem(row,prior,adminId); return true },
}
