import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { createTray } from './tray'
import { getDb, closeDb } from './db/database'
import { seedDefaults } from './db/migrations'
import { registerKeywordHandlers } from './ipc/keyword-handlers'
import { registerLogHandlers } from './ipc/log-handlers'
import { registerAuthHandlers } from './ipc/auth-handlers'

let mainWindow: BrowserWindow | null = null
let isQuitting = false
const startHidden = process.argv.includes('--hidden')

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    title: 'Big Brother',
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.once('ready-to-show', () => {
    if (!startHidden) {
      mainWindow?.show()
    }
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
  closeDb()
})

app.whenReady().then(() => {
  // Auto-start with Windows (production only)
  if (app.isPackaged) {
    app.setLoginItemSettings({
      openAtLogin: true,
      path: app.getPath('exe'),
      args: ['--hidden'],
    })
  }

  // Initialize database and seed defaults
  getDb()
  seedDefaults()

  // Register IPC handlers
  registerKeywordHandlers()
  registerLogHandlers()
  registerAuthHandlers()

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

