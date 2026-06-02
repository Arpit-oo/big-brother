import { contextBridge, ipcRenderer } from 'electron'

export interface BigBrotherAPI {
  getKeywords: () => Promise<unknown[]>
  getKeyword: (id: string) => Promise<unknown | null>
  addKeyword: (keyword: unknown) => Promise<unknown>
  removeKeyword: (id: string) => Promise<boolean>
  updateKeyword: (id: string, updates: unknown) => Promise<boolean>
  getCategories: () => Promise<unknown[]>
  importCategory: (categoryId: string) => Promise<unknown[]>
  getLogs: (filter?: unknown) => Promise<unknown[]>
  getStats: () => Promise<unknown>
  clearLogs: () => Promise<number>
  getSettings: () => Promise<Record<string, unknown>>
  updateSettings: (settings: Record<string, unknown>) => Promise<{ success: boolean; settings: Record<string, unknown> }>
  getSetting: (key: string) => Promise<string | null>
  onIntervention: (callback: (data: unknown) => void) => () => void
  auth: {
    hasPin: () => Promise<boolean>
    setPin: (pin: string) => Promise<boolean>
    verifyPin: (pin: string) => Promise<boolean>
    removePin: (currentPin: string) => Promise<boolean>
    getMode: () => Promise<string>
    setMode: (mode: string) => Promise<boolean>
  }
}

contextBridge.exposeInMainWorld('bigBrother', {
  getKeywords: () => ipcRenderer.invoke('keywords:list'),
  getKeyword: (id: string) => ipcRenderer.invoke('keywords:get', id),
  addKeyword: (keyword: unknown) => ipcRenderer.invoke('keywords:add', keyword),
  removeKeyword: (id: string) => ipcRenderer.invoke('keywords:remove', id),
  updateKeyword: (id: string, updates: unknown) => ipcRenderer.invoke('keywords:update', id, updates),
  getCategories: () => ipcRenderer.invoke('categories:list'),
  importCategory: (categoryId: string) => ipcRenderer.invoke('categories:import', categoryId),
  getLogs: (filter?: unknown) => ipcRenderer.invoke('logs:list', filter),
  getStats: () => ipcRenderer.invoke('logs:stats'),
  clearLogs: () => ipcRenderer.invoke('logs:clear'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings: Record<string, unknown>) => {
    const entries = Object.entries(settings)
    const promises = entries.map(([key, value]) =>
      ipcRenderer.invoke('settings:update', key, String(value))
    )
    return Promise.all(promises).then(() => ({ success: true, settings }))
  },
  getSetting: (key: string) => ipcRenderer.invoke('settings:get-one', key),
  onIntervention: (callback: (data: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data)
    ipcRenderer.on('intervention', handler)
    return () => {
      ipcRenderer.removeListener('intervention', handler)
    }
  },
  auth: {
    hasPin: () => ipcRenderer.invoke('auth:has-pin'),
    setPin: (pin: string) => ipcRenderer.invoke('auth:set-pin', pin),
    verifyPin: (pin: string) => ipcRenderer.invoke('auth:verify-pin', pin),
    removePin: (currentPin: string) => ipcRenderer.invoke('auth:remove-pin', currentPin),
    getMode: () => ipcRenderer.invoke('auth:get-mode'),
    setMode: (mode: string) => ipcRenderer.invoke('auth:set-mode', mode),
  },
} satisfies BigBrotherAPI)
