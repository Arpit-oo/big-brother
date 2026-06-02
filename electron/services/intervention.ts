import { BrowserWindow, screen, shell } from 'electron'
import path from 'path'

export interface InterventionContext {
  keywordTerm: string
  matchedText: string
  source: string
  actionType: 'close_tab' | 'close_and_media' | 'close_and_redirect' | 'overlay'
  actionConfig: Record<string, any>
  bypassMode: 'none' | 'soft' | 'cooldown' | 'password'
  bypassCooldownSeconds: number
  tabId?: number
}

let overlayWindow: BrowserWindow | null = null

export function executeIntervention(
  context: InterventionContext,
  mainWindow: BrowserWindow
) {
  // Notify renderer about the intervention (for logs/dashboard)
  mainWindow.webContents.send('intervention:triggered', {
    keyword: context.keywordTerm,
    matchedText: context.matchedText,
    source: context.source,
    action: context.actionType,
    timestamp: new Date().toISOString(),
  })

  switch (context.actionType) {
    case 'close_tab':
      closeTab(mainWindow, context.tabId)
      break

    case 'close_and_media':
      closeTab(mainWindow, context.tabId)
      if (context.actionConfig.mediaPath) {
        shell.openPath(context.actionConfig.mediaPath)
      }
      break

    case 'close_and_redirect':
      if (context.actionConfig.redirectUrl && context.tabId) {
        redirectTab(mainWindow, context.tabId, context.actionConfig.redirectUrl)
      } else if (context.actionConfig.redirectUrl) {
        shell.openExternal(context.actionConfig.redirectUrl)
      }
      break

    case 'overlay':
      showOverlay(context)
      break
  }
}

function closeTab(mainWindow: BrowserWindow, tabId?: number) {
  if (tabId) {
    // Send to native messaging -> extension to close the tab
    mainWindow.webContents.send('extension:command', {
      action: 'close_tab',
      tabId,
    })
  }
}

function redirectTab(mainWindow: BrowserWindow, tabId: number, url: string) {
  mainWindow.webContents.send('extension:command', {
    action: 'redirect',
    tabId,
    url,
  })
}

function showOverlay(context: InterventionContext) {
  // Close existing overlay if any
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.close()
  }

  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.size

  overlayWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    fullscreen: true,
    closable: context.bypassMode !== 'none',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const params = new URLSearchParams({
    bypassMode: context.bypassMode,
    cooldown: String(context.bypassCooldownSeconds),
    message: context.actionConfig.overlayMessage || 'Big Brother is watching.',
    keyword: context.keywordTerm,
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    overlayWindow.loadURL(`${process.env.ELECTRON_RENDERER_URL}#/overlay?${params}`)
  } else {
    overlayWindow.loadFile(path.join(__dirname, '../renderer/index.html'), {
      hash: `/overlay?${params}`,
    })
  }

  overlayWindow.setAlwaysOnTop(true, 'screen-saver')

  // Auto-close for cooldown mode
  if (context.bypassMode === 'cooldown') {
    setTimeout(() => {
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.close()
        overlayWindow = null
      }
    }, context.bypassCooldownSeconds * 1000)
  }

  overlayWindow.on('closed', () => {
    overlayWindow = null
  })
}

export function closeOverlay() {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.close()
    overlayWindow = null
  }
}
