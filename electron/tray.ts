import { Tray, Menu, nativeImage, BrowserWindow, app } from 'electron'
import { join } from 'path'

let tray: Tray | null = null

export function createTray(mainWindow: BrowserWindow): Tray {
  // In dev, __dirname is out/main/. Go up two levels to reach project root.
  // In production, use app.getAppPath() which points to the app root.
  const iconPath = app.isPackaged
    ? join(process.resourcesPath, 'assets', 'icon.png')
    : join(app.getAppPath(), 'assets', 'icon.png')

  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })

  tray = new Tray(icon)
  tray.setToolTip('Big Brother — Monitoring Active')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Dashboard',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
      },
    },
    {
      label: 'Monitoring',
      type: 'checkbox',
      checked: true,
      click: (menuItem) => {
        mainWindow.webContents.send('monitoring-toggled', menuItem.checked)
      },
    },
    { type: 'separator' },
    {
      label: 'Quit Big Brother',
      click: () => {
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)

  tray.on('double-click', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  return tray
}
