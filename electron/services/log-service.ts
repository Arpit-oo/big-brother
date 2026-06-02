import { getDb } from '../db/database';
import { randomUUID } from 'crypto';

export interface LogEntry {
  keywordId: string;
  matchedText: string;
  source: string;
  sourceDetail?: string;
  actionTaken: string;
  bypassed?: boolean;
}

export interface LogRecord {
  id: string;
  keyword_id: string;
  keyword_term?: string;
  matched_text: string;
  source: string;
  source_detail: string | null;
  action_taken: string;
  bypassed: boolean;
  timestamp: string;
}

export function logIntervention(entry: LogEntry): string {
  const db = getDb();
  const id = randomUUID();
  db.prepare(`
    INSERT INTO logs (id, keyword_id, matched_text, source, source_detail, action_taken, bypassed)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, entry.keywordId, entry.matchedText,
    entry.source, entry.sourceDetail || null,
    entry.actionTaken, entry.bypassed ? 1 : 0
  );
  return id;
}

export function getLogs(filter?: {
  limit?: number;
  keywordId?: string;
  source?: string;
  startDate?: string;
  endDate?: string;
}): LogRecord[] {
  const db = getDb();
  let query = 'SELECT l.*, k.term as keyword_term FROM logs l LEFT JOIN keywords k ON l.keyword_id = k.id';
  const conditions: string[] = [];
  const params: any[] = [];

  if (filter?.keywordId) {
    conditions.push('l.keyword_id = ?');
    params.push(filter.keywordId);
  }
  if (filter?.source) {
    conditions.push('l.source = ?');
    params.push(filter.source);
  }
  if (filter?.startDate) {
    conditions.push('l.timestamp >= ?');
    params.push(filter.startDate);
  }
  if (filter?.endDate) {
    conditions.push('l.timestamp <= ?');
    params.push(filter.endDate);
  }

  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY l.timestamp DESC';
  query += ` LIMIT ${filter?.limit || 100}`;

  const rows = db.prepare(query).all(...params) as any[];
  return rows.map(row => ({
    ...row,
    bypassed: Boolean(row.bypassed),
  }));
}

export function getStats() {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  const totalToday = (db.prepare(
    "SELECT COUNT(*) as count FROM logs WHERE timestamp >= ?"
  ).get(today) as any).count;

  const topKeyword = db.prepare(`
    SELECT k.term, COUNT(*) as count FROM logs l
    JOIN keywords k ON l.keyword_id = k.id
    WHERE l.timestamp >= ?
    GROUP BY l.keyword_id ORDER BY count DESC LIMIT 1
  `).get(today) as any;

  const totalAllTime = (db.prepare(
    "SELECT COUNT(*) as count FROM logs"
  ).get() as any).count;

  const last7Days = (db.prepare(
    "SELECT COUNT(*) as count FROM logs WHERE timestamp >= datetime('now', '-7 days')"
  ).get() as any).count;

  const bySource = db.prepare(`
    SELECT source, COUNT(*) as count FROM logs
    WHERE timestamp >= ?
    GROUP BY source ORDER BY count DESC
  `).all(today) as any[];

  return { totalToday, topKeyword, totalAllTime, last7Days, bySource };
}

export function clearLogs(): number {
  const db = getDb();
  const result = db.prepare('DELETE FROM logs').run();
  return result.changes;
}
