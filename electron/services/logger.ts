import { BrowserWindow } from 'electron'
import fs from 'fs'
import path from 'path'
import { app } from 'electron'

export type LogLevel = 'info' | 'warn' | 'error' | 'debug'
export type LogCategory = 'agent' | 'ipc' | 'db' | 'scheduler' | 'scraper' | 'system'

interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  category: LogCategory
  message: string
  data?: unknown
}

let logCounter = 0
let logStream: fs.WriteStream | null = null

const MAX_LOG_SIZE = 10 * 1024 * 1024 // 10 MB

function getLogStream(): fs.WriteStream {
  if (!logStream) {
    const logPath = path.join(app.getPath('userData'), 'nexus-debug.log')
    // Rotate if log file exceeds max size
    try {
      const stat = fs.statSync(logPath)
      if (stat.size > MAX_LOG_SIZE) {
        const rotatedPath = logPath + '.old'
        try { fs.unlinkSync(rotatedPath) } catch {}
        fs.renameSync(logPath, rotatedPath)
      }
    } catch {
      // File doesn't exist yet, that's fine
    }
    logStream = fs.createWriteStream(logPath, { flags: 'a' })
  }
  return logStream
}

function broadcast(entry: LogEntry): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send('log:entry', entry)
  }
}

export function log(level: LogLevel, category: LogCategory, message: string, data?: unknown): void {
  const entry: LogEntry = {
    id: `log-${Date.now()}-${++logCounter}`,
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    data,
  }

  // Write to file
  const stream = getLogStream()
  const line = `[${entry.timestamp}] [${level.toUpperCase()}] [${category}] ${message}${data ? ' ' + JSON.stringify(data) : ''}\n`
  stream.write(line)

  // Broadcast to renderer
  broadcast(entry)

  // Also forward to console for dev
  const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
  consoleFn(`[${category}] ${message}`, data !== undefined ? data : '')
}

export const logger = {
  info: (category: LogCategory, message: string, data?: unknown) => log('info', category, message, data),
  warn: (category: LogCategory, message: string, data?: unknown) => log('warn', category, message, data),
  error: (category: LogCategory, message: string, data?: unknown) => log('error', category, message, data),
  debug: (category: LogCategory, message: string, data?: unknown) => log('debug', category, message, data),
}

export function closeLogger(): void {
  if (logStream) {
    logStream.end()
    logStream = null
  }
}
