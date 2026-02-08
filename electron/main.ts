import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { initDatabase, closeDatabase, getDb } from './database/index'
import { registerAllHandlers } from './ipc/handlers'
import { startScheduler, stopScheduler } from './services/scheduler'
import { logger, closeLogger } from './services/logger'

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
  if (process.platform !== 'darwin') {
    app.quit()
  }
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
