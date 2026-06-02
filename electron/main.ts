import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { createTray } from './tray'
import { getDb, closeDb } from './db/database'
import { seedDefaults } from './db/migrations'
import { registerKeywordHandlers } from './ipc/keyword-handlers'
import { registerLogHandlers } from './ipc/log-handlers'
import { registerAuthHandlers } from './ipc/auth-handlers'
import { registerSettingsHandlers } from './ipc/settings-handlers'
import { coordinator } from './services/monitor-coordinator'
import { nativeMessaging } from './services/native-messaging'
import { startWindowMonitor, stopWindowMonitor } from './services/window-monitor'
import { startKeystrokeMonitor, stopKeystrokeMonitor } from './services/keystroke-monitor'
import { executeIntervention, InterventionContext } from './services/intervention'

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
  stopWindowMonitor()
  stopKeystrokeMonitor()
  nativeMessaging.stop()
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
  registerSettingsHandlers()

  createWindow()

  if (mainWindow) {
    createTray(mainWindow)
  }

  // Load keywords into coordinator
  coordinator.refreshKeywords()
  console.log('[Big Brother] Keywords loaded:', coordinator.getKeywordCount())
  console.log('[Big Brother] Sample keywords:', coordinator.getSampleTerms())

  // Listen for keyword matches -> execute interventions
  coordinator.on('match', ({ result, event }) => {
    console.log('[Big Brother] MATCH:', result.keyword.term, 'in', event.source, ':', event.text)
    if (!mainWindow) return

    const context: InterventionContext = {
      keywordTerm: result.keyword.term,
      matchedText: event.text,
      source: event.source,
      actionType: result.keyword.action_type,
      actionConfig: result.keyword.action_config,
      bypassMode: result.keyword.bypass_mode,
      bypassCooldownSeconds: result.keyword.bypass_cooldown_seconds,
      tabId: event.tabId,
    }

    executeIntervention(context, mainWindow)
  })

  // Start native messaging server for browser extension
  nativeMessaging.start()

  // Route browser extension events to coordinator
  nativeMessaging.on('message', (browserEvent) => {
    if (browserEvent.type === 'navigation' || browserEvent.type === 'page_load') {
      coordinator.check({
        source: 'browser_url',
        text: browserEvent.url || '',
        detail: browserEvent.title,
        tabId: browserEvent.tabId,
      })
      if (browserEvent.title) {
        coordinator.check({
          source: 'browser_title',
          text: browserEvent.title,
          tabId: browserEvent.tabId,
        })
      }
    } else if (browserEvent.type === 'search') {
      coordinator.check({
        source: 'browser_search',
        text: browserEvent.query || '',
        tabId: browserEvent.tabId,
      })
    }
  })

  // Start window title monitor
  startWindowMonitor((title, processName) => {
    console.log('[Big Brother] Window title:', title, '(' + processName + ')')
    coordinator.check({
      source: 'app_title',
      text: title,
      detail: processName,
    })
  })
  console.log('[Big Brother] Window monitor started')

  // Start keystroke monitor
  try {
    startKeystrokeMonitor((text) => {
      console.log('[Big Brother] Keystroke flush:', text)
      coordinator.check({
        source: 'keystroke',
        text,
      })
    })
    console.log('[Big Brother] Keystroke monitor started')
  } catch (err) {
    console.error('[Big Brother] Keystroke monitor FAILED:', err)
  }

  // Listen for monitoring toggle from tray
  ipcMain.on('monitoring-toggled', (_event, enabled: boolean) => {
    coordinator.setEnabled(enabled)
  })

  // Refresh keywords when they change
  ipcMain.on('keywords:changed', () => {
    coordinator.refreshKeywords()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  // Do not quit when tray is active — window is just hidden
})

