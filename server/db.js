import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { PROFILE, CERTIFICATIONS, LINKS } from '../src/data.js'
import { articles } from '../src/pages/blogArticles.js'
import { ABOUT_SEED } from '../src/content/aboutSeed.js'
import { AWARD_SEEDS, COMPANY_SEED, EXPERIENCE_SEED, EDUCATION_SEED, EVENT_SEEDS, SKILL_SEEDS } from '../src/content/professionalSeed.js'

const dbPath = resolve(process.env.CMS_DB_PATH || '.cms-data/cms.sqlite')
mkdirSync(dirname(dbPath), { recursive: true })
export const db = new DatabaseSync(dbPath)
db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;')
db.exec(`
CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL, totp_secret TEXT, recovery_hash TEXT,
  auth_version INTEGER NOT NULL DEFAULT 0, role TEXT NOT NULL DEFAULT 'superadmin',
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY, admin_id TEXT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  csrf_token TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL,
  auth_version INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS content (
  id TEXT PRIMARY KEY, kind TEXT NOT NULL, slug TEXT NOT NULL, title TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('draft','published','archived','trash')),
  data_json TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0,
  published_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  UNIQUE(kind, slug)
);
CREATE TABLE IF NOT EXISTS seed_imports (
  source_key TEXT PRIMARY KEY, content_id TEXT NOT NULL REFERENCES content(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS content_listing ON content(kind,status,sort_order,updated_at);
CREATE TABLE IF NOT EXISTS revisions (
  id TEXT PRIMARY KEY, content_id TEXT NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  status TEXT NOT NULL, title TEXT NOT NULL, data_json TEXT NOT NULL,
  created_at TEXT NOT NULL, admin_id TEXT REFERENCES admins(id)
);
CREATE INDEX IF NOT EXISTS revision_history ON revisions(content_id,created_at DESC);
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY, filename TEXT NOT NULL, stored_name TEXT NOT NULL,
  mime TEXT NOT NULL, bytes INTEGER NOT NULL, access TEXT NOT NULL CHECK(access IN ('public','private')),
  alt TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, admin_id TEXT REFERENCES admins(id)
);
CREATE TABLE IF NOT EXISTS audit (
  id TEXT PRIMARY KEY, admin_id TEXT REFERENCES admins(id), action TEXT NOT NULL,
  target TEXT, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS pageviews (
  day TEXT NOT NULL, path TEXT NOT NULL, views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(day,path)
);
CREATE TABLE IF NOT EXISTS interactions (
  day TEXT NOT NULL, event TEXT NOT NULL, path TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(day,event,path)
);
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, subject TEXT NOT NULL,
  message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS messages_status ON messages(status,created_at DESC);
`)

if (!db.prepare('PRAGMA table_info(media)').all().some(column => column.name === 'deleted_at'))
  db.exec('ALTER TABLE media ADD COLUMN deleted_at TEXT')
if (!db.prepare('PRAGMA table_info(admins)').all().some(column => column.name === 'recovery_hash'))
  db.exec('ALTER TABLE admins ADD COLUMN recovery_hash TEXT')
if (!db.prepare('PRAGMA table_info(admins)').all().some(column => column.name === 'auth_version'))
  db.exec('ALTER TABLE admins ADD COLUMN auth_version INTEGER NOT NULL DEFAULT 0')
if (!db.prepare('PRAGMA table_info(admins)').all().some(column => column.name === 'email_recovery_hash'))
  db.exec('ALTER TABLE admins ADD COLUMN email_recovery_hash TEXT')
if (!db.prepare('PRAGMA table_info(admins)').all().some(column => column.name === 'email_recovery_expires_at'))
  db.exec('ALTER TABLE admins ADD COLUMN email_recovery_expires_at TEXT')
if (!db.prepare('PRAGMA table_info(sessions)').all().some(column => column.name === 'auth_version'))
  db.exec('ALTER TABLE sessions ADD COLUMN auth_version INTEGER NOT NULL DEFAULT 0')

const count = db.prepare('SELECT COUNT(*) AS total FROM content').get().total
if (count === 0) {
  const now = new Date().toISOString()
  const add = db.prepare(`INSERT INTO content
    (id,kind,slug,title,status,data_json,sort_order,published_at,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?)`)
  db.exec('BEGIN')
  try {
    articles.forEach((article, index) => add.run(randomUUID(), 'blog', article.slug, article.title,
      'published', JSON.stringify(article), index, now, now, now))
    CERTIFICATIONS.forEach((cert, index) => add.run(randomUUID(), 'certification',
      cert.id.toLowerCase(), cert.title, 'published',
      JSON.stringify(cert), index, now, now, now))
    add.run(randomUUID(), 'home', 'inicio', PROFILE.name, 'published',
      JSON.stringify({ name: PROFILE.name, title: PROFILE.title, summary: PROFILE.summary,
        photo: PROFILE.photo, linkedin: LINKS.linkedin, youtube: LINKS.youtube,
        instagram: LINKS.instagram, github: LINKS.github }), 0, now, now, now)
    db.exec('COMMIT')
  } catch (error) { db.exec('ROLLBACK'); throw error }
}

function seedPublished(kind, record, data = record.data) {
  const sourceKey = `${kind}:${record.slug}`
  const imported = db.prepare('SELECT content_id FROM seed_imports WHERE source_key=?').get(sourceKey)
  if (imported) return imported.content_id
  const existing = db.prepare('SELECT id FROM content WHERE kind=? AND slug=?').get(kind, record.slug)
  if (existing) {
    db.prepare('INSERT INTO seed_imports (source_key,content_id) VALUES (?,?)').run(sourceKey, existing.id)
    return existing.id
  }
  const id = randomUUID(), now = new Date().toISOString()
  db.prepare(`INSERT INTO content
    (id,kind,slug,title,status,data_json,sort_order,published_at,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?)`).run(id, kind, record.slug, record.title,
    'published', JSON.stringify(data), record.sort_order ?? 0, now, now, now)
  db.prepare('INSERT INTO seed_imports (source_key,content_id) VALUES (?,?)').run(sourceKey, id)
  return id
}

seedPublished('about', { title:'Sobre mí', slug:'sobre-mi', data:ABOUT_SEED })
const seededCompanyId = seedPublished('company', COMPANY_SEED)
seedPublished('experience', EXPERIENCE_SEED, { ...EXPERIENCE_SEED.data, companyId: seededCompanyId })
seedPublished('education', EDUCATION_SEED)
EVENT_SEEDS.forEach(record => seedPublished('event', record))
AWARD_SEEDS.forEach(record => seedPublished('award', record))
SKILL_SEEDS.forEach(record => seedPublished('skill', record))

// Corrige únicamente una importación temprana del prototipo antes de crear administradores.
// La credencial en progreso ya aparecía públicamente en el portafolio original.
if (db.prepare('SELECT COUNT(*) AS total FROM admins').get().total === 0) {
  const imported = db.prepare('SELECT id,status,data_json FROM content WHERE kind=? AND slug=?')
    .get('certification', 'dop-c02')
  if (imported?.status === 'draft' && JSON.parse(imported.data_json).inProgress === true)
    db.prepare('UPDATE content SET status=?,published_at=? WHERE id=?')
      .run('published', new Date().toISOString(), imported.id)
}
