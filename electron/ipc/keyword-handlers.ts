import { ipcMain } from 'electron'
import { listKeywords, addKeyword, removeKeyword, updateKeyword, getKeywordById } from '../services/keyword-service'

export function registerKeywordHandlers() {
  ipcMain.handle('keywords:list', () => listKeywords())
  ipcMain.handle('keywords:get', (_event, id: string) => getKeywordById(id))
  ipcMain.handle('keywords:add', (_event, keyword) => addKeyword(keyword))
  ipcMain.handle('keywords:remove', (_event, id: string) => removeKeyword(id))
  ipcMain.handle('keywords:update', (_event, id: string, updates) => updateKeyword(id, updates))
}
