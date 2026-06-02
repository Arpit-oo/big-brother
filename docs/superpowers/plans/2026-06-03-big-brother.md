# Big Brother — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Windows desktop app that monitors browser activity, app windows, and keystrokes for configurable keywords, then fires user-defined interventions (close tab, play media, fullscreen overlay, redirect).

**Architecture:** Electron main process handles system tray, auto-start, window monitoring, and keystroke hooks. A companion browser extension (Manifest V3, works on Chrome/Edge/Firefox/Brave) monitors URLs, search queries, and page content, communicating with the Electron app via native messaging. React dashboard for keyword management, logs, and settings. SQLite (via better-sqlite3) for persistent storage.

**Tech Stack:** Electron 33+, React 19, Vite, TypeScript, better-sqlite3, uiohook-napi (keyboard hooks), Tailwind CSS, shadcn/ui

---

## Phase 1: Electron Shell + System Tray + Auto-Start

### Task 1.1: Initialize Electron + Vite + React Project

**Files:**
- Create: `package.json`
- Create: `electron/main.ts`
- Create: `electron/preload.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `electron-builder.json5`

- [ ] **Step 1: Scaffold project**

```bash
cd C:\code\big-brother
npm create @anthropic-ai/electron-vite@latest . -- --template react-ts
```

If that doesn't exist, manual scaffold:

```bash
npm init -y
npm install electron electron-builder --save-dev
npm install react react-dom
npm install @vitejs/plugin-react vite --save-dev
npm install typescript @types/react @types/react-dom --save-dev
```

- [ ] **Step 2: Create `electron/main.ts`**

```typescript
import { app, BrowserWindow } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
```

- [ ] **Step 3: Create `electron/preload.ts`**

```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('bigBrother', {
  getKeywords: () => ipcRenderer.invoke('keywords:list'),
  addKeyword: (keyword: any) => ipcRenderer.invoke('keywords:add', keyword),
  removeKeyword: (id: string) => ipcRenderer.invoke('keywords:remove', id),
  getLogs: (filter?: any) => ipcRenderer.invoke('logs:list', filter),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings: any) => ipcRenderer.invoke('settings:update', settings),
  onIntervention: (callback: (data: any) => void) => {
    ipcRenderer.on('intervention:triggered', (_event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('intervention:triggered');
  },
});
```

- [ ] **Step 4: Create minimal `src/App.tsx`**

```tsx
export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
      <h1 className="text-4xl font-bold">Big Brother</h1>
      <p className="text-zinc-400 mt-2">Watching. Always.</p>
    </div>
  );
}
```

- [ ] **Step 5: Create `src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 6: Configure Vite for Electron**

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
```

- [ ] **Step 7: Add npm scripts to `package.json`**

Add these scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "electron:dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\"",
    "electron:build": "npm run build && electron-builder"
  }
}
```

```bash
npm install concurrently wait-on --save-dev
```

- [ ] **Step 8: Run and verify window opens**

```bash
npm run electron:dev
```

Expected: Electron window opens showing "Big Brother" title on dark background.

- [ ] **Step 9: Commit**

```bash
git init
git add -A
git commit -m "feat: scaffold Electron + Vite + React project"
```

---

### Task 1.2: System Tray Integration

**Files:**
- Create: `electron/tray.ts`
- Modify: `electron/main.ts`
- Create: `assets/icon.png` (placeholder 256x256)

- [ ] **Step 1: Create tray module**

```typescript
// electron/tray.ts
import { Tray, Menu, nativeImage, BrowserWindow, app } from 'electron';
import path from 'path';

let tray: Tray | null = null;

export function createTray(mainWindow: BrowserWindow) {
  const iconPath = path.join(__dirname, '../assets/icon.png');
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });

  tray = new Tray(icon);
  tray.setToolTip('Big Brother — Monitoring Active');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Dashboard',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      },
    },
    {
      label: 'Monitoring',
      type: 'checkbox',
      checked: true,
      click: (menuItem) => {
        mainWindow.webContents.send('monitoring:toggled', menuItem.checked);
      },
    },
    { type: 'separator' },
    {
      label: 'Quit Big Brother',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  return tray;
}
```

- [ ] **Step 2: Create placeholder icon**

```bash
npm install --save-dev sharp
```

Create a script `scripts/generate-icon.ts`:
```typescript
import sharp from 'sharp';

const svg = `<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
  <rect width="256" height="256" rx="32" fill="#18181b"/>
  <circle cx="128" cy="110" r="50" fill="none" stroke="#ef4444" stroke-width="8"/>
  <circle cx="128" cy="110" r="12" fill="#ef4444"/>
  <rect x="88" y="180" width="80" height="12" rx="6" fill="#ef4444"/>
</svg>`;

sharp(Buffer.from(svg)).png().toFile('assets/icon.png');
```

```bash
mkdir assets
npx tsx scripts/generate-icon.ts
```

- [ ] **Step 3: Integrate tray into main process**

Update `electron/main.ts` — add to imports and after window creation:

```typescript
import { createTray } from './tray';

// After createWindow(), inside app.whenReady():
createTray(mainWindow!);

// Change window-all-closed behavior — minimize to tray instead of quitting
mainWindow.on('close', (event) => {
  event.preventDefault();
  mainWindow?.hide();
});
```

- [ ] **Step 4: Run and verify tray icon appears**

```bash
npm run electron:dev
```

Expected: Tray icon visible. Right-click shows menu. Close window hides to tray. Double-click tray restores window.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add system tray with minimize-to-tray behavior"
```

---

### Task 1.3: Auto-Start with Windows

**Files:**
- Modify: `electron/main.ts`

- [ ] **Step 1: Add auto-start logic**

Add to `electron/main.ts`:

```typescript
import { app } from 'electron';

app.setLoginItemSettings({
  openAtLogin: true,
  path: app.getPath('exe'),
  args: ['--hidden'],
});

// In createWindow(), check if launched hidden:
const startHidden = process.argv.includes('--hidden');

// Modify ready-to-show:
mainWindow.once('ready-to-show', () => {
  if (!startHidden) {
    mainWindow?.show();
  }
});
```

- [ ] **Step 2: Test auto-start registration**

```bash
npm run electron:dev -- --hidden
```

Expected: App starts but window stays hidden. Tray icon visible. Double-click tray opens window.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: auto-start with Windows, support --hidden launch"
```

---

### Task 1.4: SQLite Database Setup

**Files:**
- Create: `electron/db/database.ts`
- Create: `electron/db/schema.ts`
- Create: `electron/db/migrations.ts`

- [ ] **Step 1: Install better-sqlite3**

```bash
npm install better-sqlite3
npm install @types/better-sqlite3 --save-dev
npm install electron-rebuild --save-dev
npx electron-rebuild -f -w better-sqlite3
```

- [ ] **Step 2: Create schema**

```typescript
// electron/db/schema.ts
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
```

- [ ] **Step 3: Create database module**

```typescript
// electron/db/database.ts
import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { SCHEMA } from './schema';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dbPath = path.join(app.getPath('userData'), 'big-brother.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);

  return db;
}

export function closeDb() {
  db?.close();
  db = null;
}
```

- [ ] **Step 4: Seed default settings**

```typescript
// electron/db/migrations.ts
import { getDb } from './database';

const DEFAULT_SETTINGS: Record<string, string> = {
  'auth.mode': 'personal',
  'auth.pin_hash': '',
  'monitoring.enabled': 'true',
  'monitoring.browsers': 'true',
  'monitoring.apps': 'true',
  'monitoring.keystrokes': 'true',
  'ui.stealth_mode': 'false',
  'ui.start_hidden': 'false',
};

export function seedDefaults() {
  const db = getDb();
  const insert = db.prepare(
    'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
  );

  const tx = db.transaction(() => {
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      insert.run(key, value);
    }
  });

  tx();
}
```

- [ ] **Step 5: Initialize DB on app start**

Add to `electron/main.ts` in `app.whenReady()`:

```typescript
import { getDb, closeDb } from './db/database';
import { seedDefaults } from './db/migrations';

// Inside app.whenReady():
getDb();
seedDefaults();

// On quit:
app.on('before-quit', () => {
  closeDb();
});
```

- [ ] **Step 6: Run and verify DB created**

```bash
npm run electron:dev
```

Check that `big-brother.db` exists in `%APPDATA%/big-brother/`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: SQLite database with keywords, logs, and settings tables"
```

---

## Phase 2: Keyword Engine + Fuzzy Matching

### Task 2.1: Keyword CRUD via IPC

**Files:**
- Create: `electron/services/keyword-service.ts`
- Create: `electron/ipc/keyword-handlers.ts`
- Modify: `electron/main.ts`

- [ ] **Step 1: Create keyword service**

```typescript
// electron/services/keyword-service.ts
import { getDb } from '../db/database';
import { randomUUID } from 'crypto';

export interface Keyword {
  id: string;
  term: string;
  category: string;
  match_mode: 'exact' | 'contains' | 'smart' | 'regex';
  action_type: 'close_tab' | 'close_and_media' | 'close_and_redirect' | 'overlay';
  action_config: Record<string, any>;
  bypass_mode: 'none' | 'soft' | 'cooldown' | 'password';
  bypass_cooldown_seconds: number;
  enabled: boolean;
}

export function listKeywords(): Keyword[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM keywords ORDER BY created_at DESC').all() as any[];
  return rows.map(deserializeKeyword);
}

export function addKeyword(input: Omit<Keyword, 'id'>): Keyword {
  const db = getDb();
  const id = randomUUID();
  db.prepare(`
    INSERT INTO keywords (id, term, category, match_mode, action_type, action_config, bypass_mode, bypass_cooldown_seconds, enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, input.term, input.category, input.match_mode,
    input.action_type, JSON.stringify(input.action_config),
    input.bypass_mode, input.bypass_cooldown_seconds,
    input.enabled ? 1 : 0
  );
  return { ...input, id };
}

export function removeKeyword(id: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM keywords WHERE id = ?').run(id);
  return result.changes > 0;
}

export function updateKeyword(id: string, updates: Partial<Keyword>): boolean {
  const db = getDb();
  const fields: string[] = [];
  const values: any[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (key === 'id') continue;
    if (key === 'action_config') {
      fields.push('action_config = ?');
      values.push(JSON.stringify(value));
    } else if (key === 'enabled') {
      fields.push('enabled = ?');
      values.push(value ? 1 : 0);
    } else {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  fields.push("updated_at = datetime('now')");
  values.push(id);

  const result = db.prepare(
    `UPDATE keywords SET ${fields.join(', ')} WHERE id = ?`
  ).run(...values);

  return result.changes > 0;
}

function deserializeKeyword(row: any): Keyword {
  return {
    ...row,
    action_config: JSON.parse(row.action_config || '{}'),
    enabled: Boolean(row.enabled),
  };
}
```

- [ ] **Step 2: Create IPC handlers**

```typescript
// electron/ipc/keyword-handlers.ts
import { ipcMain } from 'electron';
import { listKeywords, addKeyword, removeKeyword, updateKeyword } from '../services/keyword-service';

export function registerKeywordHandlers() {
  ipcMain.handle('keywords:list', () => listKeywords());
  ipcMain.handle('keywords:add', (_event, keyword) => addKeyword(keyword));
  ipcMain.handle('keywords:remove', (_event, id) => removeKeyword(id));
  ipcMain.handle('keywords:update', (_event, id, updates) => updateKeyword(id, updates));
}
```

- [ ] **Step 3: Register handlers in main**

Add to `electron/main.ts`:

```typescript
import { registerKeywordHandlers } from './ipc/keyword-handlers';

// In app.whenReady(), after DB init:
registerKeywordHandlers();
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: keyword CRUD service with IPC handlers"
```

---

### Task 2.2: Smart Fuzzy Matcher

**Files:**
- Create: `electron/services/matcher.ts`
- Create: `electron/services/leetspeak-map.ts`

- [ ] **Step 1: Create leetspeak/unicode normalization map**

```typescript
// electron/services/leetspeak-map.ts
export const LEET_MAP: Record<string, string[]> = {
  a: ['4', '@', 'á', 'à', 'â', 'ä', 'ã', 'å', 'α', 'а'],
  b: ['8', '6', 'ß', 'β', 'б'],
  c: ['(', '{', '[', '<', '¢', 'ç', 'с'],
  d: ['|)', 'đ'],
  e: ['3', '€', 'è', 'é', 'ê', 'ë', 'е'],
  f: ['ph'],
  g: ['9', '6'],
  h: ['#'],
  i: ['1', '!', '|', 'í', 'ì', 'î', 'ï', 'і'],
  k: ['|<'],
  l: ['1', '|', 'ł'],
  m: ['nn'],
  n: ['ñ', 'η'],
  o: ['0', 'ø', 'ö', 'ó', 'ò', 'ô', 'õ', 'о', 'θ'],
  p: ['|*', 'р'],
  r: ['®', 'я'],
  s: ['5', '$', '§', 'ś', 'š'],
  t: ['7', '+', '†'],
  u: ['µ', 'ü', 'ú', 'ù', 'û', 'υ'],
  v: ['\\/', 'ν'],
  w: ['\\/\\/', 'ω', 'ш'],
  x: ['×', '%', 'х'],
  y: ['¥', 'у'],
  z: ['2', 'ž', 'ź'],
};

export function normalizeText(text: string): string {
  let normalized = text.toLowerCase();

  for (const [letter, variants] of Object.entries(LEET_MAP)) {
    for (const variant of variants) {
      normalized = normalized.replaceAll(variant.toLowerCase(), letter);
    }
  }

  normalized = normalized
    .replace(/[_\-.\s]+/g, '')
    .replace(/(.)\1{2,}/g, '$1$1');

  return normalized;
}
```

- [ ] **Step 2: Create matcher engine**

```typescript
// electron/services/matcher.ts
import { normalizeText } from './leetspeak-map';
import type { Keyword } from './keyword-service';

export interface MatchResult {
  keyword: Keyword;
  matchedText: string;
  confidence: number;
}

export function matchText(text: string, keywords: Keyword[]): MatchResult | null {
  const enabledKeywords = keywords.filter(k => k.enabled);

  for (const keyword of enabledKeywords) {
    const result = matchSingle(text, keyword);
    if (result) return result;
  }

  return null;
}

function matchSingle(text: string, keyword: Keyword): MatchResult | null {
  const term = keyword.term.toLowerCase();

  switch (keyword.match_mode) {
    case 'exact':
      if (text.toLowerCase() === term) {
        return { keyword, matchedText: text, confidence: 1.0 };
      }
      break;

    case 'contains':
      if (text.toLowerCase().includes(term)) {
        return { keyword, matchedText: text, confidence: 0.9 };
      }
      break;

    case 'smart':
      return smartMatch(text, keyword);

    case 'regex':
      try {
        const regex = new RegExp(keyword.term, 'i');
        if (regex.test(text)) {
          return { keyword, matchedText: text, confidence: 0.95 };
        }
      } catch {}
      break;
  }

  return null;
}

function smartMatch(text: string, keyword: Keyword): MatchResult | null {
  const term = keyword.term.toLowerCase();
  const lowerText = text.toLowerCase();

  if (lowerText.includes(term)) {
    return { keyword, matchedText: text, confidence: 1.0 };
  }

  const normalizedText = normalizeText(text);
  const normalizedTerm = normalizeText(term);

  if (normalizedText.includes(normalizedTerm)) {
    return { keyword, matchedText: text, confidence: 0.85 };
  }

  const textNoSpaces = lowerText.replace(/[\s\-_.]+/g, '');
  if (textNoSpaces.includes(term.replace(/[\s\-_.]+/g, ''))) {
    return { keyword, matchedText: text, confidence: 0.8 };
  }

  return null;
}
```

- [ ] **Step 3: Write test for matcher**

```bash
npm install vitest --save-dev
```

Create `tests/matcher.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { normalizeText } from '../electron/services/leetspeak-map';

describe('normalizeText', () => {
  it('normalizes leetspeak', () => {
    expect(normalizeText('p0rn')).toBe('porn');
    expect(normalizeText('pr0n')).toBe('pron');
    expect(normalizeText('p0rnhub')).toBe('pornhub');
  });

  it('normalizes unicode tricks', () => {
    expect(normalizeText('pörn')).toBe('porn');
    expect(normalizeText('gàmbling')).toBe('gambling');
  });

  it('strips separators', () => {
    expect(normalizeText('p-o-r-n')).toBe('porn');
    expect(normalizeText('p.o.r.n')).toBe('porn');
    expect(normalizeText('p_o_r_n')).toBe('porn');
  });

  it('collapses repeated chars', () => {
    expect(normalizeText('poooorn')).toBe('poorn');
  });
});
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run tests/matcher.test.ts
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: smart fuzzy keyword matcher with leetspeak normalization"
```

---

### Task 2.3: Pre-built Keyword Categories

**Files:**
- Create: `electron/services/categories.ts`

- [ ] **Step 1: Create category definitions**

```typescript
// electron/services/categories.ts
export interface CategoryDefinition {
  id: string;
  name: string;
  description: string;
  terms: string[];
}

export const BUILT_IN_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'adult',
    name: 'Adult Content',
    description: 'Pornographic and explicit adult content',
    terms: [
      'pornhub', 'xvideos', 'xhamster', 'xnxx', 'redtube', 'youporn',
      'brazzers', 'bangbros', 'realitykings', 'naughtyamerica',
      'chaturbate', 'stripchat', 'cam4', 'myfreecams', 'bongacams',
      'onlyfans', 'fansly', 'manyvids',
      'porn', 'hentai', 'xxx', 'nsfw', 'rule34',
      'spankbang', 'eporner', 'tnaflix', 'tube8',
      'motherless', 'heavy-r', 'efukt',
    ],
  },
  {
    id: 'gambling',
    name: 'Gambling',
    description: 'Online gambling and betting sites',
    terms: [
      'bet365', 'draftkings', 'fanduel', 'betway', 'pokerstars',
      'casino', 'slots', 'roulette', 'blackjack', 'sportsbet',
      'bovada', 'betonline', '888casino', 'betmgm', 'caesars',
      'gambling', 'sportsbetting', 'parlay',
    ],
  },
  {
    id: 'social_media',
    name: 'Social Media',
    description: 'Social media time-wasters',
    terms: [
      'instagram', 'tiktok', 'twitter', 'x.com', 'facebook',
      'reddit', 'snapchat', 'threads', 'tumblr', 'pinterest',
    ],
  },
  {
    id: 'gaming',
    name: 'Gaming',
    description: 'Gaming sites and platforms',
    terms: [
      'twitch', 'steam', 'epicgames', 'roblox', 'minecraft',
      'leagueoflegends', 'valorant', 'fortnite', 'apex',
    ],
  },
  {
    id: 'streaming',
    name: 'Streaming',
    description: 'Video streaming services',
    terms: [
      'netflix', 'youtube', 'hulu', 'disneyplus', 'hbomax',
      'primevideo', 'crunchyroll', 'peacock',
    ],
  },
  {
    id: 'self_harm',
    name: 'Self-Harm / Crisis',
    description: 'Content related to self-harm (redirects to crisis resources)',
    terms: [
      'suicide methods', 'how to kill myself', 'self harm',
      'cutting methods', 'overdose how to', 'want to die',
    ],
  },
];

export function getCategoryTerms(categoryId: string): string[] {
  return BUILT_IN_CATEGORIES.find(c => c.id === categoryId)?.terms ?? [];
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: built-in keyword categories (adult, gambling, social, gaming, streaming, crisis)"
```

---

## Phase 3: Browser Extension (Manifest V3)

### Task 3.1: Extension Scaffold

**Files:**
- Create: `extension/manifest.json`
- Create: `extension/background.ts`
- Create: `extension/content.ts`
- Create: `extension/native-messaging-host.json`

- [ ] **Step 1: Create manifest**

```json
{
  "manifest_version": 3,
  "name": "Big Brother Monitor",
  "version": "1.0.0",
  "description": "Companion extension for Big Brother desktop app",
  "permissions": [
    "tabs",
    "activeTab",
    "webNavigation",
    "nativeMessaging",
    "scripting"
  ],
  "host_permissions": ["<all_urls>"],
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ]
}
```

- [ ] **Step 2: Create background script**

```typescript
// extension/background.ts
let nativePort: chrome.runtime.Port | null = null;

function connectNative() {
  nativePort = chrome.runtime.connectNative('com.bigbrother.monitor');

  nativePort.onMessage.addListener((message) => {
    if (message.action === 'close_tab' && message.tabId) {
      chrome.tabs.remove(message.tabId);
    }
    if (message.action === 'redirect' && message.tabId && message.url) {
      chrome.tabs.update(message.tabId, { url: message.url });
    }
  });

  nativePort.onDisconnect.addListener(() => {
    nativePort = null;
    setTimeout(connectNative, 5000);
  });
}

connectNative();

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return;
  sendToNative({
    type: 'navigation',
    url: details.url,
    tabId: details.tabId,
  });
});

chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId !== 0) return;
  chrome.tabs.get(details.tabId, (tab) => {
    if (tab.title) {
      sendToNative({
        type: 'page_load',
        url: details.url,
        title: tab.title,
        tabId: details.tabId,
      });
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'search_query') {
    sendToNative({
      type: 'search',
      query: message.query,
      url: sender.tab?.url,
      tabId: sender.tab?.id,
    });
  }
});

function sendToNative(message: any) {
  if (nativePort) {
    nativePort.postMessage(message);
  }
}
```

- [ ] **Step 3: Create content script for search interception**

```typescript
// extension/content.ts
function interceptSearchInput() {
  const searchSelectors = [
    'input[name="q"]',           // Google
    'input[name="search_query"]', // YouTube
    'input[name="p"]',           // Yahoo
    '#sb_form_q',                // Bing
    'input[type="search"]',      // Generic
  ];

  for (const selector of searchSelectors) {
    const input = document.querySelector(selector) as HTMLInputElement;
    if (!input) continue;

    const handler = () => {
      if (input.value.length > 2) {
        chrome.runtime.sendMessage({
          type: 'search_query',
          query: input.value,
        });
      }
    };

    input.addEventListener('change', handler);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handler();
    });
  }
}

const observer = new MutationObserver(() => interceptSearchInput());
observer.observe(document.body, { childList: true, subtree: true });
interceptSearchInput();
```

- [ ] **Step 4: Create native messaging host manifest**

```json
{
  "name": "com.bigbrother.monitor",
  "description": "Big Brother native messaging host",
  "path": "C:\\Program Files\\Big Brother\\native-host.exe",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://EXTENSION_ID_HERE/"
  ]
}
```

This gets registered in Windows Registry during install. The Electron app handles the native messaging protocol.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: browser extension with URL monitoring and search interception"
```

---

### Task 3.2: Native Messaging Bridge in Electron

**Files:**
- Create: `electron/services/native-messaging.ts`
- Create: `electron/services/monitor-coordinator.ts`

- [ ] **Step 1: Create native messaging server**

```typescript
// electron/services/native-messaging.ts
import { EventEmitter } from 'events';
import net from 'net';

export interface BrowserEvent {
  type: 'navigation' | 'search' | 'page_load';
  url?: string;
  query?: string;
  title?: string;
  tabId?: number;
  browser?: string;
}

class NativeMessagingServer extends EventEmitter {
  private server: net.Server | null = null;
  private pipeName = '\\\\.\\pipe\\big-brother-native';

  start() {
    this.server = net.createServer((socket) => {
      let buffer = Buffer.alloc(0);

      socket.on('data', (data) => {
        buffer = Buffer.concat([buffer, data]);

        while (buffer.length >= 4) {
          const msgLength = buffer.readUInt32LE(0);
          if (buffer.length < 4 + msgLength) break;

          const msgStr = buffer.subarray(4, 4 + msgLength).toString('utf8');
          buffer = buffer.subarray(4 + msgLength);

          try {
            const message = JSON.parse(msgStr);
            this.emit('message', message as BrowserEvent);
          } catch {}
        }
      });
    });

    this.server.listen(this.pipeName);
  }

  sendToExtension(socket: net.Socket, message: any) {
    const msgStr = JSON.stringify(message);
    const msgBuf = Buffer.from(msgStr, 'utf8');
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32LE(msgBuf.length, 0);
    socket.write(Buffer.concat([lenBuf, msgBuf]));
  }

  stop() {
    this.server?.close();
  }
}

export const nativeMessaging = new NativeMessagingServer();
```

- [ ] **Step 2: Create monitor coordinator**

```typescript
// electron/services/monitor-coordinator.ts
import { EventEmitter } from 'events';
import { matchText, MatchResult } from './matcher';
import { listKeywords, Keyword } from './keyword-service';
import { logIntervention } from './log-service';

export interface MonitorEvent {
  source: 'browser_url' | 'browser_search' | 'browser_title' | 'app_title' | 'keystroke';
  text: string;
  detail?: string;
  tabId?: number;
}

class MonitorCoordinator extends EventEmitter {
  private keywords: Keyword[] = [];
  private enabled = true;

  refreshKeywords() {
    this.keywords = listKeywords();
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  check(event: MonitorEvent): MatchResult | null {
    if (!this.enabled) return null;

    const result = matchText(event.text, this.keywords);
    if (result) {
      logIntervention({
        keywordId: result.keyword.id,
        matchedText: event.text,
        source: event.source,
        sourceDetail: event.detail,
        actionTaken: result.keyword.action_type,
      });

      this.emit('match', { result, event });
    }

    return result;
  }
}

export const coordinator = new MonitorCoordinator();
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: native messaging bridge and monitor coordinator"
```

---

## Phase 4: Window + Keystroke Monitoring

### Task 4.1: Active Window Title Monitor

**Files:**
- Create: `electron/services/window-monitor.ts`

- [ ] **Step 1: Install dependencies**

```bash
npm install active-win
```

- [ ] **Step 2: Create window monitor**

```typescript
// electron/services/window-monitor.ts
import { coordinator } from './monitor-coordinator';

let intervalId: NodeJS.Timeout | null = null;
let lastTitle = '';

export async function startWindowMonitor(intervalMs = 1000) {
  const activeWin = await import('active-win');

  intervalId = setInterval(async () => {
    try {
      const win = await activeWin.default();
      if (!win || win.title === lastTitle) return;

      lastTitle = win.title;

      coordinator.check({
        source: 'app_title',
        text: win.title,
        detail: win.owner?.name,
      });
    } catch {}
  }, intervalMs);
}

export function stopWindowMonitor() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: active window title monitoring"
```

---

### Task 4.2: Keystroke Monitor

**Files:**
- Create: `electron/services/keystroke-monitor.ts`

- [ ] **Step 1: Install uiohook**

```bash
npm install uiohook-napi
```

- [ ] **Step 2: Create keystroke monitor**

```typescript
// electron/services/keystroke-monitor.ts
import { uIOhook, UiohookKey } from 'uiohook-napi';
import { coordinator } from './monitor-coordinator';

let buffer = '';
let flushTimeout: NodeJS.Timeout | null = null;
const FLUSH_DELAY_MS = 800;
const MAX_BUFFER = 200;

const KEY_MAP: Record<number, string> = {};
for (const [name, code] of Object.entries(UiohookKey)) {
  if (typeof code === 'number' && name.length === 1) {
    KEY_MAP[code] = name.toLowerCase();
  }
}

export function startKeystrokeMonitor() {
  uIOhook.on('keydown', (event) => {
    const char = KEY_MAP[event.keycode];
    if (!char) {
      if (event.keycode === UiohookKey.Space) buffer += ' ';
      if (event.keycode === UiohookKey.Enter) flushBuffer();
      return;
    }

    buffer += char;

    if (buffer.length > MAX_BUFFER) {
      buffer = buffer.slice(-MAX_BUFFER);
    }

    if (flushTimeout) clearTimeout(flushTimeout);
    flushTimeout = setTimeout(flushBuffer, FLUSH_DELAY_MS);
  });

  uIOhook.start();
}

function flushBuffer() {
  if (buffer.trim().length < 3) return;

  coordinator.check({
    source: 'keystroke',
    text: buffer.trim(),
  });

  buffer = '';
}

export function stopKeystrokeMonitor() {
  uIOhook.stop();
  buffer = '';
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: keystroke monitoring with buffer and flush"
```

---

## Phase 5: Intervention System

### Task 5.1: Intervention Executor

**Files:**
- Create: `electron/services/intervention.ts`
- Create: `electron/windows/overlay.html`

- [ ] **Step 1: Create intervention executor**

```typescript
// electron/services/intervention.ts
import { BrowserWindow, screen, shell } from 'electron';
import { MatchResult } from './matcher';
import { MonitorEvent } from './monitor-coordinator';
import path from 'path';

export async function executeIntervention(
  result: MatchResult,
  event: MonitorEvent,
  mainWindow: BrowserWindow
) {
  const { keyword } = result;
  const config = keyword.action_config;

  mainWindow.webContents.send('intervention:triggered', {
    keyword: keyword.term,
    matchedText: event.text,
    source: event.source,
    action: keyword.action_type,
    timestamp: new Date().toISOString(),
  });

  switch (keyword.action_type) {
    case 'close_tab':
      // Signal browser extension to close tab
      mainWindow.webContents.send('extension:close-tab', { tabId: event.tabId });
      break;

    case 'close_and_media':
      mainWindow.webContents.send('extension:close-tab', { tabId: event.tabId });
      if (config.mediaPath) {
        shell.openPath(config.mediaPath);
      }
      break;

    case 'close_and_redirect':
      if (config.redirectUrl && event.tabId) {
        mainWindow.webContents.send('extension:redirect', {
          tabId: event.tabId,
          url: config.redirectUrl,
        });
      }
      break;

    case 'overlay':
      showOverlay(keyword.bypass_mode, keyword.bypass_cooldown_seconds, config);
      break;
  }
}

function showOverlay(bypassMode: string, cooldownSeconds: number, config: any) {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  const overlay = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  const params = new URLSearchParams({
    bypassMode,
    cooldown: String(cooldownSeconds),
    message: config.overlayMessage || 'Big Brother is watching.',
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    overlay.loadURL(`${process.env.VITE_DEV_SERVER_URL}#/overlay?${params}`);
  } else {
    overlay.loadFile(path.join(__dirname, '../dist/index.html'), {
      hash: `/overlay?${params}`,
    });
  }

  overlay.setAlwaysOnTop(true, 'screen-saver');

  if (bypassMode === 'cooldown') {
    setTimeout(() => {
      overlay.close();
    }, cooldownSeconds * 1000);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: intervention executor with tab close, media, redirect, and overlay"
```

---

### Task 5.2: Fullscreen Overlay UI

**Files:**
- Create: `src/pages/Overlay.tsx`

- [ ] **Step 1: Create overlay component**

```tsx
// src/pages/Overlay.tsx
import { useEffect, useState } from 'react';

export default function Overlay() {
  const params = new URLSearchParams(window.location.hash.split('?')[1]);
  const bypassMode = params.get('bypassMode') || 'cooldown';
  const cooldown = parseInt(params.get('cooldown') || '30', 10);
  const message = params.get('message') || 'Big Brother is watching.';

  const [remaining, setRemaining] = useState(cooldown);
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (bypassMode !== 'cooldown') return;
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(interval);
          window.close();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [bypassMode, cooldown]);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999]">
      <div className="text-center max-w-2xl mx-auto p-12">
        <div className="text-red-500 text-8xl mb-8">👁</div>
        <h1 className="text-white text-5xl font-bold mb-4">BLOCKED</h1>
        <p className="text-zinc-400 text-xl mb-12">{message}</p>

        {bypassMode === 'cooldown' && (
          <div className="space-y-4">
            <div className="text-zinc-500 text-lg">
              This screen will close in
            </div>
            <div className="text-red-500 text-7xl font-mono font-bold">
              {remaining}s
            </div>
          </div>
        )}

        {bypassMode === 'soft' && (
          <button
            onClick={() => window.close()}
            className="mt-8 px-8 py-3 bg-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-700 text-sm"
          >
            I understand, let me continue (logged)
          </button>
        )}

        {bypassMode === 'password' && (
          <div className="mt-8 space-y-4">
            <input
              type="password"
              placeholder="Enter PIN to dismiss"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="px-6 py-3 bg-zinc-900 border border-zinc-700 text-white rounded-lg text-center text-lg w-64"
              autoFocus
            />
            <button
              onClick={() => {
                window.bigBrother?.verifyPin(pin).then((ok: boolean) => {
                  if (ok) window.close();
                });
              }}
              className="block mx-auto px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500"
            >
              Unlock
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: fullscreen overlay UI with cooldown, soft dismiss, and password modes"
```

---

## Phase 6: Dashboard UI

### Task 6.1: Install Tailwind + shadcn/ui

- [ ] **Step 1: Install and configure**

```bash
npm install tailwindcss @tailwindcss/vite --save-dev
npx shadcn@latest init
```

Configure with zinc theme, dark mode.

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add Tailwind CSS and shadcn/ui"
```

---

### Task 6.2: Dashboard Layout + Keyword Management Page

**Files:**
- Create: `src/pages/Dashboard.tsx`
- Create: `src/pages/Keywords.tsx`
- Create: `src/pages/Logs.tsx`
- Create: `src/pages/Settings.tsx`
- Create: `src/components/Sidebar.tsx`
- Create: `src/components/AddKeywordDialog.tsx`

*(Full UI code for each component will be written during implementation — follows standard React + shadcn/ui patterns with the large dialog sizes per CLAUDE.md rules)*

- [ ] **Step 1-8: Build each component, test in browser, commit**

Each page gets its own commit. Dashboard shows stats (total blocks today, top keyword, monitoring status). Keywords page has table + add/edit/delete with large dialogs. Logs page shows filterable intervention history. Settings page manages auth mode, monitored apps, startup behavior.

---

## Phase 7: Auth System

### Task 7.1: PIN/Password Auth

**Files:**
- Create: `electron/services/auth-service.ts`
- Create: `src/pages/LockScreen.tsx`

- [ ] **Step 1: Create auth service**

```typescript
// electron/services/auth-service.ts
import { createHash } from 'crypto';
import { getDb } from '../db/database';

function hashPin(pin: string): string {
  return createHash('sha256').update(pin).digest('hex');
}

export function setPin(pin: string) {
  const db = getDb();
  db.prepare("UPDATE settings SET value = ? WHERE key = 'auth.pin_hash'")
    .run(hashPin(pin));
}

export function verifyPin(pin: string): boolean {
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = 'auth.pin_hash'")
    .get() as any;
  if (!row?.value) return true;
  return row.value === hashPin(pin);
}

export function hasPin(): boolean {
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = 'auth.pin_hash'")
    .get() as any;
  return Boolean(row?.value);
}

export function getAuthMode(): 'personal' | 'managed' {
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = 'auth.mode'")
    .get() as any;
  return (row?.value as any) || 'personal';
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: PIN/password auth service with personal and managed modes"
```

---

## Phase 8: Log Service + Integration Wiring

### Task 8.1: Log Service

**Files:**
- Create: `electron/services/log-service.ts`

- [ ] **Step 1: Create log service**

```typescript
// electron/services/log-service.ts
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

export function logIntervention(entry: LogEntry) {
  const db = getDb();
  db.prepare(`
    INSERT INTO logs (id, keyword_id, matched_text, source, source_detail, action_taken, bypassed)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    randomUUID(), entry.keywordId, entry.matchedText,
    entry.source, entry.sourceDetail || null,
    entry.actionTaken, entry.bypassed ? 1 : 0
  );
}

export function getLogs(filter?: { limit?: number; keywordId?: string; source?: string }) {
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

  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY l.timestamp DESC';
  query += ` LIMIT ${filter?.limit || 100}`;

  return db.prepare(query).all(...params);
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

  return { totalToday, topKeyword, totalAllTime };
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: log service with filtering and dashboard stats"
```

---

### Task 8.2: Wire Everything in Main Process

**Files:**
- Modify: `electron/main.ts`

- [ ] **Step 1: Full main process integration**

Connect all services: DB init → keyword load → start monitors → listen for matches → execute interventions → log results. Register all IPC handlers.

- [ ] **Step 2: Test end-to-end**

1. Launch app
2. Add keyword "test123" via dashboard
3. Type "test123" somewhere
4. Verify intervention fires
5. Check logs page shows entry

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: wire all services together in main process"
```

---

## Build Order (Test After Each)

| Phase | What | Test |
|-------|------|------|
| 1.1 | Electron shell opens | Window renders |
| 1.2 | System tray | Tray icon, minimize/restore |
| 1.3 | Auto-start | `--hidden` flag works |
| 1.4 | SQLite DB | DB file created, tables exist |
| 2.1 | Keyword CRUD | Add/list/remove via IPC |
| 2.2 | Fuzzy matcher | Unit tests pass |
| 2.3 | Categories | Import built-in lists |
| 3.1 | Browser extension | Extension loads in Chrome |
| 3.2 | Native messaging | Extension talks to Electron |
| 4.1 | Window monitor | Title changes detected |
| 4.2 | Keystroke monitor | Keystrokes buffered + matched |
| 5.1 | Interventions | Tab closes, media plays, overlay shows |
| 5.2 | Overlay UI | Cooldown timer, PIN entry work |
| 6.1 | Tailwind + shadcn | Styles render |
| 6.2 | Dashboard | Full UI with keyword management |
| 7.1 | Auth | PIN set/verify, managed mode locks settings |
| 8.1 | Logs | Filterable log view with stats |
| 8.2 | Full integration | End-to-end keyword → intervention → log |
