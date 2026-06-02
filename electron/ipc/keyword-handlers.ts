import { ipcMain } from 'electron'
import { listKeywords, addKeyword, removeKeyword, updateKeyword, getKeywordById } from '../services/keyword-service'
import { getAllCategories, getCategoryTerms } from '../services/categories'

export function registerKeywordHandlers() {
  ipcMain.handle('keywords:list', () => listKeywords())
  ipcMain.handle('keywords:get', (_event, id: string) => getKeywordById(id))
  ipcMain.handle('keywords:add', (_event, keyword) => addKeyword(keyword))
  ipcMain.handle('keywords:remove', (_event, id: string) => removeKeyword(id))
  ipcMain.handle('keywords:update', (_event, id: string, updates) => updateKeyword(id, updates))

  ipcMain.handle('categories:list', () => getAllCategories())
  ipcMain.handle('categories:import', (_event, categoryId: string) => {
    const terms = getCategoryTerms(categoryId)
    const results = terms.map(term => addKeyword({
      term,
      category: categoryId,
      match_mode: 'smart',
      action_type: 'close_tab',
      action_config: {},
      bypass_mode: 'soft',
      bypass_cooldown_seconds: 30,
      enabled: true,
    }))
    return results
  })
}
