import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

test('migración AWS valida medio respaldado y rechaza alteraciones antes de escribir', () => {
  const root=mkdtempSync(join(tmpdir(),'cms-aws-migrate-'))
  try {
    const backup=join(root,'backups','snapshot'), exportDir=join(root,'export')
    mkdirSync(join(backup,'media'),{ recursive:true }); mkdirSync(exportDir)
    const bytes=Buffer.from('89504e470d0a1a0a','hex'), name='123e4567-e89b-12d3-a456-426614174000.png'
    writeFileSync(join(backup,'media',name),bytes)
    writeFileSync(join(backup,'manifest.json'),JSON.stringify({ files:[
      { path:`media/${name}`,sha256:sha256(bytes) }] }))
    const record={ pk:'MEDIA#123e4567-e89b-12d3-a456-426614174000',sk:'META',entity:'media',
      attributes:{ id:'123e4567-e89b-12d3-a456-426614174000',stored_name:name,mime:'image/png',
        bytes:bytes.length,created_at:'2026-10-20T00:00:00.000Z' } }
    const jsonl=JSON.stringify(record)+'\n'
    writeFileSync(join(exportDir,'items.jsonl'),jsonl)
    writeFileSync(join(exportDir,'manifest.json'),JSON.stringify({ format:1,sourceBackup:'snapshot',
      items:1,sha256:sha256(jsonl) }))
    const run=() => spawnSync(process.execPath,['server/aws/migrate.js',exportDir],{
      cwd:process.cwd(),env:{ ...process.env,CMS_BACKUP_DIR:join(root,'backups') },encoding:'utf8' })
    const valid=run()
    assert.equal(valid.status,0,valid.stderr)
    assert.equal(JSON.parse(valid.stdout).media,1)
    writeFileSync(join(backup,'media',name),Buffer.from('altered'))
    const altered=run()
    assert.notEqual(altered.status,0)
    assert.match(altered.stderr,/alterado/)
    assert.notDeepEqual(readFileSync(join(backup,'media',name)),bytes)
  } finally { rmSync(root,{ recursive:true,force:true }) }
})
