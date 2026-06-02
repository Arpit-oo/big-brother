import { createHash, randomBytes } from 'crypto';
import { getDb } from '../db/database';

function hashPin(pin: string, salt: string): string {
  return createHash('sha256').update(pin + salt).digest('hex');
}

export function setPin(pin: string): void {
  const db = getDb();
  const salt = randomBytes(16).toString('hex');
  const hash = hashPin(pin, salt);

  const upsert = db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?"
  );

  db.transaction(() => {
    upsert.run('auth.pin_hash', hash, hash);
    upsert.run('auth.pin_salt', salt, salt);
  })();
}

export function verifyPin(pin: string): boolean {
  const db = getDb();
  const hashRow = db.prepare("SELECT value FROM settings WHERE key = 'auth.pin_hash'").get() as any;
  const saltRow = db.prepare("SELECT value FROM settings WHERE key = 'auth.pin_salt'").get() as any;

  if (!hashRow?.value || !saltRow?.value) return true; // No PIN set = always valid

  return hashRow.value === hashPin(pin, saltRow.value);
}

export function hasPin(): boolean {
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = 'auth.pin_hash'").get() as any;
  return Boolean(row?.value);
}

export function removePin(currentPin: string): boolean {
  if (!verifyPin(currentPin)) return false;

  const db = getDb();
  const upsert = db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?"
  );

  db.transaction(() => {
    upsert.run('auth.pin_hash', '', '');
    upsert.run('auth.pin_salt', '', '');
  })();

  return true;
}

export function getAuthMode(): 'personal' | 'managed' {
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = 'auth.mode'").get() as any;
  return (row?.value as 'personal' | 'managed') || 'personal';
}

export function setAuthMode(mode: 'personal' | 'managed'): void {
  const db = getDb();
  db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?"
  ).run('auth.mode', mode, mode);
}
