import { execFileSync } from 'child_process'
import { logger } from './logger'

let resolvedClaudePath: string | null = null

/**
 * Resolve the full path to the claude CLI binary.
 * Caches the result for subsequent calls.
 */
export function getClaudePath(): string {
  if (resolvedClaudePath) return resolvedClaudePath

  // Try common locations
  const candidates = [
    '/opt/homebrew/bin/claude',
    '/usr/local/bin/claude',
    `${process.env.HOME}/.local/bin/claude`,
    `${process.env.HOME}/.npm-global/bin/claude`,
  ]

  // Try `which claude` first
  try {
    const result = execFileSync('which', ['claude'], { encoding: 'utf-8', timeout: 5000 }).trim()
    if (result) {
      resolvedClaudePath = result
      logger.info('system', `Resolved claude CLI at: ${result}`)
      return result
    }
  } catch {
    // which failed, try candidates
  }

  for (const candidate of candidates) {
    try {
      execFileSync(candidate, ['--version'], { encoding: 'utf-8', timeout: 5000 })
      resolvedClaudePath = candidate
      logger.info('system', `Found claude CLI at: ${candidate}`)
      return candidate
    } catch {
      // not found, try next
    }
  }

  // Fallback to bare 'claude' and hope PATH is correct
  resolvedClaudePath = 'claude'
  logger.warn('system', 'Could not resolve claude CLI path, using bare "claude"')
  return 'claude'
}

/**
 * Get an env object with extended PATH for child processes.
 */
export function getClaudeEnv(): NodeJS.ProcessEnv {
  const extraPaths = ['/opt/homebrew/bin', '/usr/local/bin', `${process.env.HOME}/.local/bin`]
  const currentPath = process.env.PATH || ''
  const newPath = [...extraPaths, currentPath].join(':')
  return { ...process.env, PATH: newPath, TERM: 'dumb' }
}
