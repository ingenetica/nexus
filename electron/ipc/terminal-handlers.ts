import { ipcMain, BrowserWindow } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import { logger } from '../services/logger'

let claudeProcess: ChildProcess | null = null
let sessionId: string | null = null

function broadcast(channel: string, data: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(channel, data)
  }
}

function killClaude(): void {
  if (claudeProcess) {
    claudeProcess.kill('SIGTERM')
    claudeProcess = null
    sessionId = null
  }
}

export function registerTerminalHandlers(): void {
  ipcMain.handle('claude:send', async (_event, message: string) => {
    try {
      // If no existing process, spawn one
      if (!claudeProcess) {
        const args = [
          '-p', message,
          '--print',
          '--output-format', 'stream-json',
        ]

        if (sessionId) {
          args.push('--continue', sessionId)
        }

        logger.info('system', 'Spawning Claude Code', { args })

        claudeProcess = spawn('claude', args, {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env },
        })

        let fullOutput = ''

        claudeProcess.stdout?.on('data', (data: Buffer) => {
          const text = data.toString()
          fullOutput += text

          // Try to parse each line as JSON (stream-json format)
          const lines = text.split('\n').filter(Boolean)
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line)
              broadcast('claude:stream', parsed)

              // Capture session ID if present
              if (parsed.session_id) {
                sessionId = parsed.session_id
              }
            } catch {
              // Non-JSON line, send as raw text
              broadcast('claude:stream', { type: 'text', content: line })
            }
          }
        })

        claudeProcess.stderr?.on('data', (data: Buffer) => {
          const text = data.toString()
          logger.warn('system', 'Claude stderr', { text })
          broadcast('claude:stream', { type: 'error', error: text })
        })

        claudeProcess.on('close', (code) => {
          logger.info('system', 'Claude process exited', { code })
          broadcast('claude:stream', { type: 'done', code })
          claudeProcess = null
        })

        claudeProcess.on('error', (err) => {
          logger.error('system', 'Claude process error', { error: err.message })
          broadcast('claude:stream', { type: 'error', error: `Failed to spawn claude: ${err.message}` })
          claudeProcess = null
        })

        return { success: true }
      } else {
        // Process already running, write to stdin
        claudeProcess.stdin?.write(message + '\n')
        return { success: true }
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      logger.error('system', 'Claude send error', { error })
      return { success: false, error }
    }
  })

  ipcMain.handle('claude:kill', async () => {
    killClaude()
    return { success: true }
  })

  ipcMain.handle('claude:reset', async () => {
    killClaude()
    sessionId = null
    return { success: true }
  })
}
