import { spawn, ChildProcess } from 'child_process'
import { AgentConfig, AgentResult } from './types'
import { getClaudePath, getClaudeEnv } from '../services/claude-cli'

export class BaseAgent {
  protected config: AgentConfig
  protected process: ChildProcess | null = null
  private abortController: AbortController | null = null

  constructor(config: AgentConfig) {
    this.config = config
  }

  get name() { return this.config.name }
  get displayName() { return this.config.displayName }
  get description() { return this.config.description }
  get isRunning() { return this.process !== null }

  async invoke(input: Record<string, unknown>): Promise<AgentResult> {
    if (this.process) {
      throw new Error(`Agent ${this.config.name} is already running`)
    }

    const startTime = Date.now()
    this.abortController = new AbortController()

    try {
      const output = await this.runClaude(JSON.stringify(input))
      const duration = Date.now() - startTime

      // Try to parse JSON output
      let parsed: unknown
      try {
        parsed = JSON.parse(output)
      } catch {
        parsed = { raw: output }
      }

      return {
        success: true,
        output: parsed,
        duration_ms: duration,
        cost_usd: 0, // Claude CLI doesn't report cost in output
      }
    } catch (err) {
      const duration = Date.now() - startTime
      return {
        success: false,
        output: null,
        duration_ms: duration,
        cost_usd: 0,
        error: err instanceof Error ? err.message : String(err),
      }
    } finally {
      this.process = null
      this.abortController = null
    }
  }

  cancel(): void {
    if (this.process) {
      this.process.kill('SIGTERM')
      this.process = null
    }
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }

  private runClaude(stdinData: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = [
        '--print',
        '--output-format', 'json',
        '--model', this.config.model,
        '--max-turns', '1',
      ]

      if (this.config.maxBudget > 0) {
        // Note: --max-budget-usd may not be supported in all claude CLI versions
      }

      // Always pass --allowedTools: empty string means no tools allowed
      args.push('--allowedTools', this.config.allowedTools.join(',') || '')

      // Use --append-system-prompt for the system prompt
      args.push('--append-system-prompt', this.config.systemPrompt)

      this.process = spawn(getClaudePath(), args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: getClaudeEnv(),
      })

      let stdout = ''
      let stderr = ''

      this.process.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString()
      })

      this.process.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString()
      })

      // Write input via stdin
      this.process.stdin?.write(stdinData)
      this.process.stdin?.end()

      this.process.on('close', (code) => {
        if (code === 0) {
          // Parse the JSON output from Claude CLI
          try {
            const jsonOutput = JSON.parse(stdout)
            // claude --print --output-format json returns { result: "..." }
            resolve(typeof jsonOutput.result === 'string' ? jsonOutput.result : JSON.stringify(jsonOutput))
          } catch {
            // If not valid JSON, return raw stdout
            resolve(stdout.trim())
          }
        } else {
          reject(new Error(`Claude CLI exited with code ${code}: ${stderr || stdout}`))
        }
      })

      this.process.on('error', (err) => {
        const hint = (err as NodeJS.ErrnoException).code === 'ENOENT'
          ? ' — Is "claude" installed and on your PATH? Run: npm install -g @anthropic-ai/claude-code'
          : ''
        reject(new Error(`Failed to spawn Claude CLI: ${err.message}${hint}`))
      })

      // Handle abort
      if (this.abortController) {
        this.abortController.signal.addEventListener('abort', () => {
          this.process?.kill('SIGTERM')
          reject(new Error('Agent invocation cancelled'))
        })
      }
    })
  }
}
