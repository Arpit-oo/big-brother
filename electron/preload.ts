import { contextBridge, ipcRenderer } from 'electron'

export interface BigBrotherAPI {
  getKeywords: () => Promise<string[]>
  addKeyword: (keyword: string) => Promise<{ success: boolean; keyword: string }>
  removeKeyword: (keyword: string) => Promise<{ success: boolean; keyword: string }>
  getLogs: () => Promise<unknown[]>
  getSettings: () => Promise<Record<string, unknown>>
  updateSettings: (settings: Record<string, unknown>) => Promise<{ success: boolean; settings: Record<string, unknown> }>
  onIntervention: (callback: (data: unknown) => void) => () => void
}

contextBridge.exposeInMainWorld('bigBrother', {
  getKeywords: () => ipcRenderer.invoke('get-keywords'),
  addKeyword: (keyword: string) => ipcRenderer.invoke('add-keyword', keyword),
  removeKeyword: (keyword: string) => ipcRenderer.invoke('remove-keyword', keyword),
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
