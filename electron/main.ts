import { app, BrowserWindow, ipcMain, session } from 'electron'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { initDatabase, closeDatabase, getDb } from './database/index'
import { registerAllHandlers } from './ipc/handlers'
import { startScheduler, stopScheduler } from './services/scheduler'
import { logger, closeLogger } from './services/logger'

// --- Hot-reload cleanup: kill previous Electron process on dev restart ---
const pidFile = path.join(app.getPath('userData'), 'nexus-dev.pid')

function killPreviousInstance(): void {
  try {
    const oldPid = parseInt(fs.readFileSync(pidFile, 'utf-8').trim(), 10)
    if (oldPid && oldPid !== process.pid) {
      // Verify the process is still alive before sending signal
      try {
        process.kill(oldPid, 0) // signal 0 = existence check only
        process.kill(oldPid, 'SIGTERM')
      } catch {
        // Process doesn't exist or we lack permission — safe to ignore
      }
    }
  } catch {
    // No PID file or parse error — fine
  }
}

function writePidFile(): void {
  try {
    fs.writeFileSync(pidFile, String(process.pid))
  } catch {
    // Non-critical
  }
}

function removePidFile(): void {
  try {
    fs.unlinkSync(pidFile)
  } catch {
    // Already gone
  }
}

if (process.env.VITE_DEV_SERVER_URL) {
  killPreviousInstance()
  writePidFile()
}

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    frame: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 12 },
    backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  })

  // Window control handlers
  ipcMain.on('window:minimize', () => mainWindow?.minimize())
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })
  ipcMain.on('window:close', () => mainWindow?.close())

  // Restrict navigation to app origin only
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const devUrl = process.env.VITE_DEV_SERVER_URL
    if (devUrl && url.startsWith(devUrl)) return
    if (url.startsWith('file://')) return
    event.preventDefault()
  })

  // Block popup windows from main window
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  logger.info('system', 'Nexus starting up')

  // Security: set Content-Security-Policy
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; connect-src 'self' ws://localhost:*; font-src 'self'",
        ],
      },
    })
  })

  // Security: deny all permission requests (geolocation, notifications, etc.)
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false)
  })

  // Initialize database
  initDatabase()

  // Seed default sources if empty
  seedDefaultSources()

  // Register all IPC handlers
  registerAllHandlers()

  // Start post scheduler
  startScheduler()

  // Create window
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  stopScheduler()
  closeDatabase()
  closeLogger()
  removePidFile()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  removePidFile()
})

function seedDefaultSources(): void {
  const db = getDb()

  const count = (db.prepare('SELECT COUNT(*) as c FROM sources').get() as { c: number }).c
  if (count > 0) return

  const defaults = [
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', type: 'rss' },
    { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', type: 'rss' },
    { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', type: 'rss' },
    { name: 'Hacker News', url: 'https://hnrss.org/frontpage', type: 'rss' },
    { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/', type: 'rss' },
  ]

  const stmt = db.prepare('INSERT INTO sources (id, name, url, type, enabled) VALUES (?, ?, ?, ?, 1)')
  for (const src of defaults) {
    stmt.run(uuidv4(), src.name, src.url, src.type)
  }

  logger.info('db', 'Seeded default news sources')
}
