import { ipcMain, BrowserWindow } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import { logger } from '../services/logger'
import { getClaudePath, getClaudeEnv } from '../services/claude-cli'

let claudeProcess: ChildProcess | null = null
let sessionId: string | null = null

function broadcast(channel: string, data: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, data)
    }
  }
}

function killClaude(): void {
  if (claudeProcess) {
    try {
      claudeProcess.kill('SIGTERM')
    } catch {
      // Process already dead
    }
    claudeProcess = null
  }
}

export function registerTerminalHandlers(): void {
  ipcMain.handle('claude:send', async (_event, message: string) => {
    try {
      // Kill any existing process first — --print mode is one-shot, not interactive
      killClaude()

      const claudePath = getClaudePath()
      const args = [
        '-p', message,
        '--print',
        '--output-format', 'text',
        '--max-turns', '3',
        '--allowedTools', '',
      ]

      if (sessionId) {
        args.push('--continue', sessionId)
      }

      logger.info('system', 'Spawning Claude Code', { claudePath, args: args.filter(a => a !== message) })

      claudeProcess = spawn(claudePath, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: getClaudeEnv(),
        detached: false,
      })

      let fullOutput = ''

      claudeProcess.stdout?.on('data', (data: Buffer) => {
        const chunk = data.toString()
        fullOutput += chunk
        broadcast('claude:stream', { type: 'text', content: chunk })
      })

      claudeProcess.stderr?.on('data', (data: Buffer) => {
        const text = data.toString()
        // Filter out non-error stderr (progress indicators, etc.)
        if (text.trim()) {
          logger.warn('system', 'Claude stderr', { text: text.substring(0, 200) })
        }
      })

      claudeProcess.on('close', (code, signal) => {
        logger.info('system', 'Claude process exited', { code, signal, outputLength: fullOutput.length })

        if (code === 0 && !fullOutput) {
          broadcast('claude:stream', { type: 'text', content: '(empty response)' })
        } else if (code !== 0 && code !== null) {
          broadcast('claude:stream', {
            type: 'error',
            error: `Claude exited with code ${code}${signal ? ` (${signal})` : ''}`,
          })
        }

        broadcast('claude:stream', { type: 'done', code })
        claudeProcess = null
      })

      claudeProcess.on('error', (err) => {
        logger.error('system', 'Claude process error', { error: err.message })
        broadcast('claude:stream', { type: 'error', error: `Failed to start Claude: ${err.message}` })
        claudeProcess = null
      })

      return { success: true }
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
