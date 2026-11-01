import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash, randomBytes } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { DatabaseSync } from 'node:sqlite'

test('migración MFA exige copia coincidente y conserva datos en simulación', () => {
  const directory = mkdtempSync(join(tmpdir(), 'albert-mfa-migrate-'))
  try {
    const activePath = join(directory, 'active.sqlite')
    const backupDir = join(directory, 'backup')
    mkdirSync(backupDir)
    const database = new DatabaseSync(activePath)
    database.exec('CREATE TABLE admins (id TEXT PRIMARY KEY, totp_secret TEXT, updated_at TEXT)')
    database.prepare('INSERT INTO admins VALUES (?,?,?)').run('admin-1', 'JBSWY3DPEHPK3PXP', '2026-10-19')
    database.exec(`VACUUM INTO '${join(backupDir, 'cms.sqlite').replaceAll("'", "''")}'`)
    database.close()
    const backupFile = join(backupDir, 'cms.sqlite')
    writeFileSync(join(backupDir, 'manifest.json'), JSON.stringify({ files:[{ path:'cms.sqlite',
      sha256:createHash('sha256').update(readFileSync(backupFile)).digest('hex') }] }))
    const env = { ...process.env, CMS_DB_PATH:activePath,
      CMS_TOTP_ENCRYPTION_KEY:randomBytes(32).toString('hex') }
    const run = (...args) => spawnSync(process.execPath, ['server/migrate-totp.js', backupDir, ...args], {
      cwd:process.cwd(), env, encoding:'utf8',
    })
    assert.equal(run().status, 0)
    let inspect = new DatabaseSync(activePath, { readOnly:true })
    assert.equal(inspect.prepare('SELECT totp_secret FROM admins').get().totp_secret, 'JBSWY3DPEHPK3PXP')
    inspect.close()
    assert.equal(run('--apply').status, 0)
    inspect = new DatabaseSync(activePath)
    assert.match(inspect.prepare('SELECT totp_secret FROM admins').get().totp_secret, /^enc:v1:/)
    inspect.prepare('INSERT INTO admins VALUES (?,?,?)').run('admin-2', 'PLAINSECRET', '2026-10-19')
    inspect.close()
    assert.notEqual(run('--apply').status, 0)
    inspect = new DatabaseSync(activePath, { readOnly:true })
    assert.equal(inspect.prepare('SELECT totp_secret FROM admins WHERE id=?').get('admin-2').totp_secret,
      'PLAINSECRET')
    inspect.close()
  } finally { rmSync(directory, { recursive:true, force:true, maxRetries:5, retryDelay:100 }) }
})

test('la API de producción exige orígenes HTTPS y cookies seguras', () => {
  const directory = mkdtempSync(join(tmpdir(), 'albert-production-config-'))
  try {
    const env = { ...process.env, NODE_ENV:'production', CMS_DB_PATH:join(directory, 'cms.sqlite'),
      CMS_MEDIA_DIR:join(directory, 'media'), CMS_TOTP_ENCRYPTION_KEY:randomBytes(32).toString('hex'),
      CMS_PUBLIC_ORIGIN:'', CMS_ADMIN_ORIGIN:'', CMS_SECURE_COOKIES:'false' }
    const result = spawnSync(process.execPath, ['server/index.js'], { cwd:process.cwd(), env, encoding:'utf8' })
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /CMS_PUBLIC_ORIGIN/)
  } finally { rmSync(directory, { recursive:true, force:true, maxRetries:5, retryDelay:100 }) }
})
