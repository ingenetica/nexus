import { v4 as uuid } from 'uuid'
import { getDb } from '../database/index'
import { BaseAgent } from './base-agent'
import { CoordinatorAgent } from './coordinator'
import { NewsScoutAgent } from './news-scout'
import { ContentCreatorAgent } from './content-creator'
import { EngagementAgent } from './engagement'
import { AgentName, AgentResult, CoordinatorAction } from './types'
import { logger } from '../services/logger'

class AgentManager {
  private agents: Map<AgentName, BaseAgent> = new Map()
  private lastResult: Map<AgentName, AgentResult> = new Map()

  constructor() {
    this.agents.set('orion', new CoordinatorAgent())
    this.agents.set('scout', new NewsScoutAgent())
    this.agents.set('scribe', new ContentCreatorAgent())
    this.agents.set('echo', new EngagementAgent())
  }

  getAgent(name: AgentName): BaseAgent | undefined {
    return this.agents.get(name)
  }

  async invoke(agentName: AgentName, input: Record<string, unknown>): Promise<AgentResult> {
    const agent = this.agents.get(agentName)
    if (!agent) {
      return { success: false, output: null, duration_ms: 0, cost_usd: 0, error: `Unknown agent: ${agentName}` }
    }

    const logId = uuid()
    const db = getDb()

    logger.info('agent', `Invoking ${agentName}`, { input })

    // Log the invocation start
    db.prepare(`
      INSERT INTO agent_logs (id, agent, action, input, status, created_at)
      VALUES (?, ?, ?, ?, 'running', datetime('now'))
    `).run(logId, agentName, 'invoke', JSON.stringify(input))

    const result = await agent.invoke(input)

    // Store last result for persistent status
    this.lastResult.set(agentName, result)

    if (result.success) {
      logger.info('agent', `${agentName} completed in ${result.duration_ms}ms`)
    } else {
      logger.error('agent', `${agentName} failed: ${result.error}`)
    }

    // Update the log with results
    db.prepare(`
      UPDATE agent_logs SET output = ?, status = ?, duration_ms = ?, cost_usd = ?
      WHERE id = ?
    `).run(
      JSON.stringify(result.output),
      result.success ? 'completed' : 'error',
      result.duration_ms,
      result.cost_usd,
      logId
    )

    return result
  }

  cancel(agentName: AgentName): void {
    const agent = this.agents.get(agentName)
    agent?.cancel()
    this.lastResult.delete(agentName)
  }

  clearLastResult(agentName: AgentName): void {
    this.lastResult.delete(agentName)
  }

  getStates() {
    const db = getDb()
    return Array.from(this.agents.entries()).map(([name, agent]) => {
      const stats = db.prepare(`
        SELECT
          COUNT(*) as totalRuns,
          COALESCE(SUM(cost_usd), 0) as totalCost,
          MAX(created_at) as lastRun
        FROM agent_logs WHERE agent = ?
      `).get(name) as { totalRuns: number; totalCost: number; lastRun: string | null }

      const last = this.lastResult.get(name)
      let status: 'idle' | 'running' | 'error' | 'completed'
      if (agent.isRunning) {
        status = 'running'
      } else if (last) {
        status = last.success ? 'completed' : 'error'
      } else {
        status = 'idle'
      }

      return {
        name,
        displayName: agent.displayName,
        description: agent.description,
        status,
        error: last && !last.success ? last.error : null,
        lastRun: stats?.lastRun || null,
        totalRuns: stats?.totalRuns || 0,
        totalCost: stats?.totalCost || 0,
      }
    })
  }

  getLogs(agentName?: string, limit = 50) {
    const db = getDb()
    if (agentName) {
      return db.prepare(`
        SELECT * FROM agent_logs WHERE agent = ? ORDER BY created_at DESC LIMIT ?
      `).all(agentName, limit)
    }
    return db.prepare(`
      SELECT * FROM agent_logs ORDER BY created_at DESC LIMIT ?
    `).all(limit)
  }

  async runWorkflow(workflow: string, params: Record<string, unknown>): Promise<unknown> {
    switch (workflow) {
      case 'news-to-posts':
        return this.newsToPostsWorkflow(params)
      case 'score-articles':
        return this.scoreArticlesWorkflow(params)
      case 'generate-responses':
        return this.generateResponsesWorkflow(params)
      case 'custom':
        return this.invoke('orion', params)
      default:
        return { error: `Unknown workflow: ${workflow}` }
    }
  }

  private async newsToPostsWorkflow(params: Record<string, unknown>): Promise<unknown> {
    // Step 1: Ask coordinator
    const coordResult = await this.invoke('orion', {
      task: 'find_and_create_posts',
      ...params,
    })

    if (!coordResult.success) return coordResult

    const action = coordResult.output as CoordinatorAction

    // Step 2: Execute the coordinator's instructions
    if (action.action === 'invoke_scout') {
      const scoutResult = await this.invoke('scout', action.params)
      return scoutResult
    }

    return coordResult
  }

  private async scoreArticlesWorkflow(_params: Record<string, unknown>): Promise<unknown> {
    const db = getDb()
    const articles = db.prepare(`
      SELECT id, title, summary, url FROM articles ORDER BY scraped_at DESC LIMIT 20
    `).all()

    const result = await this.invoke('scout', { articles, task: 'score' })
    return result
  }

  private async generateResponsesWorkflow(_params: Record<string, unknown>): Promise<unknown> {
    const db = getDb()
    const pending = db.prepare(`
      SELECT id, content, author_name FROM interactions WHERE response_status = 'pending' LIMIT 10
    `).all()

    if ((pending as unknown[]).length === 0) {
      return { message: 'No pending interactions' }
    }

    const result = await this.invoke('echo', { comments: pending })
    return result
  }
}

// Singleton
let instance: AgentManager | null = null

export function getAgentManager(): AgentManager {
  if (!instance) {
    instance = new AgentManager()
  }
  return instance
}
