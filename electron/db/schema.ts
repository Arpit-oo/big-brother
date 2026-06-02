export const SCHEMA = `
  CREATE TABLE IF NOT EXISTS keywords (
    id TEXT PRIMARY KEY,
    term TEXT NOT NULL,
    category TEXT DEFAULT 'custom',
    match_mode TEXT DEFAULT 'smart' CHECK(match_mode IN ('exact', 'contains', 'smart', 'regex')),
    action_type TEXT DEFAULT 'close_tab' CHECK(action_type IN ('close_tab', 'close_and_media', 'close_and_redirect', 'overlay')),
    action_config TEXT DEFAULT '{}',
    bypass_mode TEXT DEFAULT 'soft' CHECK(bypass_mode IN ('none', 'soft', 'cooldown', 'password')),
    bypass_cooldown_seconds INTEGER DEFAULT 30,
    enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    keyword_id TEXT,
    matched_text TEXT NOT NULL,
    source TEXT NOT NULL,
    source_detail TEXT,
    action_taken TEXT NOT NULL,
    bypassed INTEGER DEFAULT 0,
    timestamp TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (keyword_id) REFERENCES keywords(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
  CREATE INDEX IF NOT EXISTS idx_logs_keyword ON logs(keyword_id);
  CREATE INDEX IF NOT EXISTS idx_keywords_enabled ON keywords(enabled);
`;
