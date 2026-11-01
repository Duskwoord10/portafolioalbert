import { randomUUID } from 'node:crypto'
import { db } from '../db.js'

const now = () => new Date().toISOString()
const pageOffset = cursor => {
  if (!cursor) return 0
  try { const value=JSON.parse(Buffer.from(cursor,'base64url').toString('utf8'))
    if (!Number.isSafeInteger(value.offset) || value.offset < 0) throw new Error()
    return value.offset
  } catch { throw Object.assign(new Error('Cursor inválido.'),{ status:400 }) }
}
const nextPage = (rows,offset,limit) => ({ items:rows.slice(0,limit),
  nextCursor:rows.length > limit ? Buffer.from(JSON.stringify({ offset:offset+limit })).toString('base64url') : null })
const transaction = fn => { db.exec('BEGIN IMMEDIATE'); try { const value=fn(); db.exec('COMMIT'); return value }
  catch (error) { db.exec('ROLLBACK'); throw error } }
const revision = (row, adminId) => db.prepare(`INSERT INTO revisions
  (id,content_id,status,title,data_json,created_at,admin_id) VALUES (?,?,?,?,?,?,?)`)
  .run(randomUUID(), row.id, row.status, row.title, row.data_json, now(), adminId)

export const store = {
  async ready(production) {
    if (production && db.prepare(`SELECT id FROM admins WHERE totp_secret IS NOT NULL
      AND totp_secret NOT LIKE 'enc:v1:%' AND totp_secret NOT LIKE 'pending:enc:v1:%' LIMIT 1`).get())
      throw new Error('Existen secretos MFA sin cifrar. Ejecuta security:migrate-totp con un respaldo verificado.')
  },
  audit(adminId, action, target) { db.prepare('INSERT INTO audit (id,admin_id,action,target,created_at) VALUES (?,?,?,?,?)')
    .run(randomUUID(), adminId, action, target || null, now()) },
  session(tokenHash) { return db.prepare(`SELECT s.*, a.email, a.role, a.totp_secret FROM sessions s
    JOIN admins a ON a.id=s.admin_id WHERE s.token_hash=? AND s.expires_at>?
    AND s.auth_version=a.auth_version`).get(tokenHash, now()) || null },
  adminByEmail(email) { return db.prepare('SELECT * FROM admins WHERE email=?').get(email) },
  adminById(id) { return db.prepare('SELECT * FROM admins WHERE id=?').get(id) },
  adminCount() { return db.prepare('SELECT COUNT(*) AS total FROM admins').get().total },
  createAdmin(row) { db.prepare(`INSERT INTO admins (id,email,password_hash,password_salt,role,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?)`).run(row.id,row.email,row.password_hash,row.password_salt,row.role,row.created_at,row.updated_at) },
  createSession(row) { db.prepare(`INSERT INTO sessions
    (token_hash,admin_id,csrf_token,expires_at,created_at,auth_version) VALUES (?,?,?,?,?,?)`)
    .run(row.token_hash,row.admin_id,row.csrf_token,row.expires_at,row.created_at,row.auth_version || 0) },
  deleteSession(tokenHash) { db.prepare('DELETE FROM sessions WHERE token_hash=?').run(tokenHash) },
  setTotp(id, secret, updatedAt) { db.prepare('UPDATE admins SET totp_secret=?,updated_at=? WHERE id=?')
    .run(secret,updatedAt,id) },
  setPassword(id, credentials, updatedAt) { db.prepare('UPDATE admins SET password_hash=?,password_salt=?,updated_at=? WHERE id=?')
    .run(credentials.value,credentials.salt,updatedAt,id) },
  setRecoveryCode(id,codeHash,updatedAt) { db.prepare('UPDATE admins SET recovery_hash=?,updated_at=? WHERE id=?')
    .run(codeHash,updatedAt,id) },
  setEmailRecoveryCode(id,codeHash,expiresAt,updatedAt) { db.prepare(`UPDATE admins SET
    email_recovery_hash=?,email_recovery_expires_at=?,updated_at=? WHERE id=?`)
    .run(codeHash,expiresAt,updatedAt,id) },
  clearEmailRecoveryCode(id,codeHash) { db.prepare(`UPDATE admins SET
    email_recovery_hash=NULL,email_recovery_expires_at=NULL WHERE id=? AND email_recovery_hash=?`)
    .run(id,codeHash) },
  recoverPasswordByEmail(id,codeHash,credentials,updatedAt) { return transaction(() => {
    const result=db.prepare(`UPDATE admins SET password_hash=?,password_salt=?,
      email_recovery_hash=NULL,email_recovery_expires_at=NULL,auth_version=auth_version+1,
      updated_at=? WHERE id=? AND email_recovery_hash=? AND email_recovery_expires_at>?`)
      .run(credentials.value,credentials.salt,updatedAt,id,codeHash,updatedAt)
    if (result.changes) db.prepare('DELETE FROM sessions WHERE admin_id=?').run(id)
    return result.changes > 0
  }) },
  recoverPassword(id,codeHash,credentials,updatedAt) { return transaction(() => {
    const result=db.prepare(`UPDATE admins SET password_hash=?,password_salt=?,recovery_hash=NULL,
      auth_version=auth_version+1,updated_at=? WHERE id=? AND recovery_hash=?`)
      .run(credentials.value,credentials.salt,updatedAt,id,codeHash)
    if (result.changes) db.prepare('DELETE FROM sessions WHERE admin_id=?').run(id)
    return result.changes > 0
  }) },
  sessions(adminId, current) { return db.prepare(`SELECT token_hash,created_at,expires_at FROM sessions
    WHERE admin_id=? AND expires_at>? ORDER BY created_at DESC`).all(adminId,now())
    .map(row => ({ ...row,current:row.token_hash === current })) },
  revokeOtherSessions(adminId, current) { db.prepare('DELETE FROM sessions WHERE admin_id=? AND token_hash<>?')
    .run(adminId,current) },
  companyExists(id) { return Boolean(db.prepare("SELECT id FROM content WHERE id=? AND kind='company' AND status<>'trash'").get(id)) },
  sitemapEntries() { return db.prepare(`SELECT kind,slug,updated_at FROM content WHERE status='published'
    AND kind IN ('blog','page','project','event','album','experience')`).all() },
  pageview(day,path) { db.prepare(`INSERT INTO pageviews (day,path,views) VALUES (?,?,1)
    ON CONFLICT(day,path) DO UPDATE SET views=views+1`).run(day,path) },
  interaction(day,event,path) { db.prepare(`INSERT INTO interactions (day,event,path,count) VALUES (?,?,?,1)
    ON CONFLICT(day,event,path) DO UPDATE SET count=count+1`).run(day,event,path) },
  createMessage(row) { db.prepare('INSERT INTO messages (id,name,email,subject,message,status,created_at) VALUES (?,?,?,?,?,?,?)')
    .run(row.id,row.name,row.email,row.subject,row.message,row.status,row.created_at) },
  messages() { return db.prepare('SELECT * FROM messages ORDER BY created_at DESC LIMIT 200').all() },
  updateMessage(id,status) { return db.prepare('UPDATE messages SET status=? WHERE id=?').run(status,id).changes > 0 },
  analytics(since) { return {
    days:db.prepare('SELECT day,SUM(views) AS views FROM pageviews WHERE day>=? GROUP BY day ORDER BY day').all(since),
    pages:db.prepare('SELECT path,SUM(views) AS views FROM pageviews WHERE day>=? GROUP BY path ORDER BY views DESC LIMIT 30').all(since),
    interactions:db.prepare('SELECT event,path,SUM(count) AS count FROM interactions WHERE day>=? GROUP BY event,path ORDER BY count DESC LIMIT 30').all(since),
  } },
  analyticsPath(since,path) { const days=db.prepare(`SELECT day,views FROM pageviews
    WHERE day>=? AND path=? ORDER BY day`).all(since,path)
    return { views:days.reduce((total,row) => total+row.views,0),days }
  },
  publicContent(kind,slug) { return slug ? db.prepare("SELECT * FROM content WHERE kind=? AND slug=? AND status='published'").all(kind,slug)
    : db.prepare("SELECT * FROM content WHERE kind=? AND status='published' ORDER BY sort_order,updated_at DESC").all(kind) },
  publicContentPage(kind,limit,cursor) { const offset=pageOffset(cursor)
    return nextPage(db.prepare(`SELECT * FROM content WHERE kind=? AND status='published'
      ORDER BY sort_order,updated_at DESC LIMIT ? OFFSET ?`).all(kind,limit+1,offset),offset,limit) },
  media(id) { return db.prepare('SELECT * FROM media WHERE id=?').get(id) },
  mediaList() { return db.prepare('SELECT id,filename,mime,bytes,access,alt,created_at,deleted_at FROM media ORDER BY created_at DESC').all() },
  mediaPage(limit,cursor) { const offset=pageOffset(cursor)
    return nextPage(db.prepare(`SELECT id,filename,mime,bytes,access,alt,created_at,deleted_at FROM media
      ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?`).all(limit+1,offset),offset,limit) },
  createMedia(row) { db.prepare(`INSERT INTO media (id,filename,stored_name,mime,bytes,access,alt,created_at,admin_id)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(row.id,row.filename,row.stored_name,row.mime,row.bytes,row.access,row.alt,row.created_at,row.admin_id) },
  updateMedia(id,alt,access) { db.prepare('UPDATE media SET alt=?,access=? WHERE id=?').run(alt,access,id) },
  mediaTrash(id,deletedAt) { db.prepare('UPDATE media SET deleted_at=? WHERE id=?').run(deletedAt,id) },
  mediaRestore(id) { db.prepare('UPDATE media SET deleted_at=NULL WHERE id=?').run(id) },
  mediaReferenced(id) { return Boolean(db.prepare("SELECT id FROM content WHERE status<>'trash' AND data_json LIKE ? LIMIT 1")
    .get(`%/api/media/${id}%`)) },
  revisions(id) { return db.prepare('SELECT * FROM revisions WHERE content_id=? ORDER BY created_at DESC LIMIT 30').all(id) },
  revision(id,contentId) { return db.prepare('SELECT * FROM revisions WHERE id=? AND content_id=?').get(id,contentId) },
  content(kind,id) { return db.prepare('SELECT * FROM content WHERE kind=? AND id=?').get(kind,id) },
  contentList(kind) { return db.prepare('SELECT * FROM content WHERE kind=? ORDER BY sort_order,updated_at DESC LIMIT 200').all(kind) },
  contentCounts() { return Object.fromEntries(db.prepare('SELECT kind,COUNT(*) AS count FROM content GROUP BY kind')
    .all().map(row => [row.kind,row.count])) },
  contentPage(kind,limit,cursor) { const offset=pageOffset(cursor)
    return nextPage(db.prepare(`SELECT * FROM content WHERE kind=? ORDER BY sort_order,updated_at DESC
      LIMIT ? OFFSET ?`).all(kind,limit+1,offset),offset,limit) },
  slugOwner(kind,slug) { return db.prepare('SELECT id FROM content WHERE kind=? AND slug=?').get(kind,slug)?.id },
  saveContent(kind,id,value,adminId) {
    return transaction(() => {
      const timestamp = now()
      if (id) {
        const row = this.content(kind,id)
        if (!row) return null
        revision(row,adminId)
        db.prepare(`UPDATE content SET slug=?,title=?,status=?,data_json=?,sort_order=?,
          published_at=CASE WHEN ?='published' THEN COALESCE(published_at,?) ELSE published_at END,
          updated_at=? WHERE id=?`).run(value.slug,value.title,value.status,value.dataJson,
          value.sortOrder,value.status,timestamp,timestamp,id)
      } else {
        id = randomUUID()
        db.prepare(`INSERT INTO content (id,kind,slug,title,status,data_json,sort_order,published_at,created_at,updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?)`).run(id,kind,value.slug,value.title,value.status,value.dataJson,
          value.sortOrder,value.status === 'published' ? timestamp : null,timestamp,timestamp)
      }
      return this.content(kind,id)
    })
  },
  trashContent(kind,id,adminId) {
    return transaction(() => { const row = this.content(kind,id)
      if (!row) return false
      revision(row,adminId)
      db.prepare("UPDATE content SET status='trash',updated_at=? WHERE id=?").run(now(),id)
      return true })
  },
  restoreContent(kind,id,revisionId,adminId) {
    return transaction(() => { const row = this.content(kind,id), old = this.revision(revisionId,id)
      if (!row || !old) return false
      revision(row,adminId)
      db.prepare("UPDATE content SET title=?,data_json=?,status='draft',updated_at=? WHERE id=?")
        .run(old.title,old.data_json,now(),id)
      return true })
  },
}
