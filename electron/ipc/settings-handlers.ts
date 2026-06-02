import { ipcMain } from 'electron';
import { getDb } from '../db/database';

export function registerSettingsHandlers() {
  ipcMain.handle('settings:get', () => {
    const db = getDb();
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return settings;
  });

  ipcMain.handle('settings:update', (_event, key: string, value: string) => {
    const db = getDb();
    db.prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?"
    ).run(key, value);
    return true;
  });

  ipcMain.handle('settings:get-one', (_event, key: string) => {
    const db = getDb();
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
    return row?.value ?? null;
  });
}
