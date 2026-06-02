/// <reference types="vite/client" />

interface BigBrotherAPI {
  getKeywords: () => Promise<string[]>
  addKeyword: (keyword: string) => Promise<{ success: boolean; keyword: string }>
  removeKeyword: (keyword: string) => Promise<{ success: boolean; keyword: string }>
  getLogs: () => Promise<unknown[]>
  getSettings: () => Promise<Record<string, unknown>>
  updateSettings: (settings: Record<string, unknown>) => Promise<{ success: boolean; settings: Record<string, unknown> }>
  onIntervention: (callback: (data: unknown) => void) => () => void
}

interface Window {
  bigBrother: BigBrotherAPI
}
