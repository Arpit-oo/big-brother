import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import { SCHEMA } from './schema'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db
  const dbPath = path.join(app.getPath('userData'), 'big-brother.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(SCHEMA)
  return db
}

export function closeDb() {
  db?.close()
  db = null
}
