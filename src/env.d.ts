/// <reference types="vite/client" />

interface Keyword {
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

interface CategoryDefinition {
  id: string
  name: string
  description: string
  terms: string[]
}

interface LogRecord {
  id: string
  timestamp: string
  keyword_id: string
  keyword_term: string
  matched_text: string
  source: 'browser' | 'app' | 'keystroke'
  action_taken: string
  bypassed: boolean
  url?: string
  app_name?: string
}

interface Stats {
  totalToday: number
  totalAllTime: number
  last7Days: number
  topKeyword: { term: string; count: number } | null
  bySource: { source: string; count: number }[]
}

interface BigBrotherAuth {
  hasPin: () => Promise<boolean>
  setPin: (pin: string) => Promise<boolean>
  verifyPin: (pin: string) => Promise<boolean>
  removePin: (currentPin: string) => Promise<boolean>
  getMode: () => Promise<'personal' | 'managed'>
  setMode: (mode: 'personal' | 'managed') => Promise<boolean>
}

interface BigBrotherAPI {
  getKeywords: () => Promise<Keyword[]>
  getKeyword: (id: string) => Promise<Keyword>
  addKeyword: (keyword: Partial<Keyword>) => Promise<Keyword>
  removeKeyword: (id: string) => Promise<boolean>
  updateKeyword: (id: string, updates: Partial<Keyword>) => Promise<boolean>
  getCategories: () => Promise<CategoryDefinition[]>
  importCategory: (categoryId: string) => Promise<Keyword[]>
  getLogs: (filter?: { source?: string; startDate?: string; endDate?: string }) => Promise<LogRecord[]>
  getStats: () => Promise<Stats>
  clearLogs: () => Promise<number>
  getSettings: () => Promise<Record<string, string>>
  updateSettings: (key: string, value: string) => Promise<boolean>
  getSetting: (key: string) => Promise<string | null>
  auth: BigBrotherAuth
  onIntervention: (callback: (data: unknown) => void) => () => void
}

interface Window {
  bigBrother: BigBrotherAPI
}
