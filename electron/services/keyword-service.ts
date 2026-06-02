import { getDb } from '../db/database'
import { randomUUID } from 'crypto'

export interface Keyword {
  id: string
  term: string
  category: string
  match_mode: 'exact' | 'contains' | 'smart' | 'regex'
  action_type: 'close_tab' | 'close_and_media' | 'close_and_redirect' | 'overlay'
  action_config: Record<string, any>
  bypass_mode: 'none' | 'soft' | 'cooldown' | 'password'
  bypass_cooldown_seconds: number
  enabled: boolean
}

export function listKeywords(): Keyword[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM keywords ORDER BY created_at DESC').all() as any[]
  return rows.map(deserializeKeyword)
}

export function addKeyword(input: Omit<Keyword, 'id'>): Keyword {
  const db = getDb()
  const id = randomUUID()
  db.prepare(`
    INSERT INTO keywords (id, term, category, match_mode, action_type, action_config, bypass_mode, bypass_cooldown_seconds, enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, input.term, input.category, input.match_mode,
    input.action_type, JSON.stringify(input.action_config),
    input.bypass_mode, input.bypass_cooldown_seconds,
    input.enabled ? 1 : 0
  )
  return { ...input, id }
}

export function removeKeyword(id: string): boolean {
  const db = getDb()
  const result = db.prepare('DELETE FROM keywords WHERE id = ?').run(id)
  return result.changes > 0
}

export function updateKeyword(id: string, updates: Partial<Keyword>): boolean {
  const db = getDb()
  const fields: string[] = []
  const values: any[] = []

  for (const [key, value] of Object.entries(updates)) {
    if (key === 'id') continue
    if (key === 'action_config') {
      fields.push('action_config = ?')
      values.push(JSON.stringify(value))
    } else if (key === 'enabled') {
      fields.push('enabled = ?')
      values.push(value ? 1 : 0)
    } else {
      fields.push(`${key} = ?`)
      values.push(value)
    }
  }

  if (fields.length === 0) return false

  fields.push("updated_at = datetime('now')")
  values.push(id)

  const result = db.prepare(
    `UPDATE keywords SET ${fields.join(', ')} WHERE id = ?`
  ).run(...values)

  return result.changes > 0
}

export function getKeywordById(id: string): Keyword | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM keywords WHERE id = ?').get(id) as any
  return row ? deserializeKeyword(row) : null
}

function deserializeKeyword(row: any): Keyword {
  return {
    ...row,
    action_config: JSON.parse(row.action_config || '{}'),
    enabled: Boolean(row.enabled),
  }
}
