import { contextBridge, ipcRenderer } from 'electron'

export interface BigBrotherAPI {
  getKeywords: () => Promise<unknown[]>
  getKeyword: (id: string) => Promise<unknown | null>
  addKeyword: (keyword: unknown) => Promise<unknown>
  removeKeyword: (id: string) => Promise<boolean>
  updateKeyword: (id: string, updates: unknown) => Promise<boolean>
  getCategories: () => Promise<unknown[]>
  importCategory: (categoryId: string) => Promise<unknown[]>
  getLogs: () => Promise<unknown[]>
  getSettings: () => Promise<Record<string, unknown>>
  updateSettings: (settings: Record<string, unknown>) => Promise<{ success: boolean; settings: Record<string, unknown> }>
  onIntervention: (callback: (data: unknown) => void) => () => void
}

contextBridge.exposeInMainWorld('bigBrother', {
  getKeywords: () => ipcRenderer.invoke('keywords:list'),
  getKeyword: (id: string) => ipcRenderer.invoke('keywords:get', id),
  addKeyword: (keyword: unknown) => ipcRenderer.invoke('keywords:add', keyword),
  removeKeyword: (id: string) => ipcRenderer.invoke('keywords:remove', id),
  updateKeyword: (id: string, updates: unknown) => ipcRenderer.invoke('keywords:update', id, updates),
  getCategories: () => ipcRenderer.invoke('categories:list'),
  importCategory: (categoryId: string) => ipcRenderer.invoke('categories:import', categoryId),
  getLogs: () => ipcRenderer.invoke('get-logs'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings: Record<string, unknown>) =>
    ipcRenderer.invoke('update-settings', settings),
  onIntervention: (callback: (data: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data)
    ipcRenderer.on('intervention', handler)
    return () => {
      ipcRenderer.removeListener('intervention', handler)
    }
  },
} satisfies BigBrotherAPI)
