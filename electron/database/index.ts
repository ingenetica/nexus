import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import { SCHEMA } from './schema'
import { logger } from '../services/logger'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db

  const dbPath = path.join(app.getPath('userData'), 'nexus.db')
  db = new Database(dbPath)

  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL')
  db.pragma('busy_timeout = 5000')
  db.pragma('foreign_keys = ON')

  return db
}

export function initDatabase(): void {
  const database = getDb()

  // Run schema creation (all IF NOT EXISTS, so safe to re-run)
  database.exec(SCHEMA)

  // Migrations for existing databases
  try {
    database.exec('ALTER TABLE articles ADD COLUMN saved INTEGER NOT NULL DEFAULT 0')
  } catch {
    // Column already exists
  }

  // Seed default personality if table is empty
  const personalityCount = database.prepare('SELECT COUNT(*) as count FROM personalities').get() as { count: number }
  if (personalityCount.count === 0) {
    database.prepare(`
      INSERT INTO personalities (id, name, system_prompt, tone, style, language, length, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      'default-personality',
      'Tech Thought Leader',
      'Eres un referente tech que escribe posts de LinkedIn en español a partir de noticias tech en inglés. Tono formal pero no solemne, ligeramente ácido e irónico pero que no cae mal. Analizas las implicaciones reales, no solo resumes.',
      'thought-leader',
      'opinion',
      'es',
      'medium'
    )
  }

  logger.info('db', 'Database initialized', { path: path.join(app.getPath('userData'), 'nexus.db') })
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}
