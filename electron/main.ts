import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { createTray } from './tray'

let mainWindow: BrowserWindow | null = null
let isQuitting = false

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Big Brother',
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // In dev, load the Vite dev server URL; in prod, load the built file
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Open DevTools in development
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools()
  }

  // Minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('before-quit', () => {
  isQuitting = true
})

app.whenReady().then(() => {
  createWindow()

  if (mainWindow) {
    createTray(mainWindow)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  // Do not quit when tray is active — window is just hidden
})

// --- IPC Handlers (stubs for now, will be implemented in later tasks) ---

// Keywords
ipcMain.handle('get-keywords', async () => {
  return []
})

ipcMain.handle('add-keyword', async (_event, keyword: string) => {
  return { success: true, keyword }
})

ipcMain.handle('remove-keyword', async (_event, keyword: string) => {
  return { success: true, keyword }
})

// Logs
ipcMain.handle('get-logs', async () => {
  return []
})

// Settings
ipcMain.handle('get-settings', async () => {
  return {
    monitorKeystrokes: true,
    monitorBrowser: true,
    monitorApps: true,
    interventionType: 'alert',
  }
})

ipcMain.handle('update-settings', async (_event, settings: Record<string, unknown>) => {
  return { success: true, settings }
})
