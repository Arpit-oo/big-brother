import { getDb } from './database'

const DEFAULT_SETTINGS: Record<string, string> = {
  'auth.mode': 'personal',
  'auth.pin_hash': '',
  'monitoring.enabled': 'true',
  'monitoring.browsers': 'true',
  'monitoring.apps': 'true',
  'monitoring.keystrokes': 'true',
  'ui.stealth_mode': 'false',
  'ui.start_hidden': 'false',
}

export function seedDefaults() {
  const db = getDb()
  const insert = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)')
  const tx = db.transaction(() => {
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      insert.run(key, value)
    }
  })
  tx()
}
