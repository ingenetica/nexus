import { ipcMain } from 'electron'
import { v4 as uuid } from 'uuid'
import { spawn } from 'child_process'
import { getDb } from '../database/index'
import { DEFAULT_LLM_CONFIG } from './settings-handlers'
import { scrapeSourceById } from '../services/news-scraper'
import { logger } from '../services/logger'
import { getClaudePath, getClaudeEnv } from '../services/claude-cli'

export function registerNewsHandlers(): void {
  ipcMain.handle('news:getSources', () => {
    try {
      const db = getDb()
      const sources = db.prepare('SELECT * FROM sources ORDER BY name ASC').all()
      return { success: true, data: sources }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('news:addSource', (_event, source: { name: string; url: string; type: string; enabled: boolean }) => {
    try {
      const db = getDb()
      const id = uuid()
      db.prepare('INSERT INTO sources (id, name, url, type, enabled) VALUES (?, ?, ?, ?, ?)').run(
        id, source.name, source.url, source.type, source.enabled ? 1 : 0
      )
      const created = db.prepare('SELECT * FROM sources WHERE id = ?').get(id)
      return { success: true, data: created }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('news:deleteSource', (_event, id: string) => {
    try {
      const db = getDb()
      db.prepare('DELETE FROM sources WHERE id = ?').run(id)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('news:toggleSource', (_event, id: string, enabled: boolean) => {
    try {
      const db = getDb()
      db.prepare('UPDATE sources SET enabled = ? WHERE id = ?').run(enabled ? 1 : 0, id)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('news:getArticles', (_event, filters?: { search?: string; sourceId?: string; minScore?: number; savedOnly?: boolean }) => {
    try {
      const db = getDb()
      let query = 'SELECT * FROM articles WHERE 1=1'
      const params: unknown[] = []

      if (filters?.search) {
        query += ' AND (title LIKE ? OR summary LIKE ?)'
        params.push(`%${filters.search}%`, `%${filters.search}%`)
      }
      if (filters?.sourceId) {
        query += ' AND source_id = ?'
        params.push(filters.sourceId)
      }
      if (filters?.minScore) {
        query += ' AND relevance_score >= ?'
        params.push(filters.minScore)
      }
      if (filters?.savedOnly) {
        query += ' AND saved = 1'
      }

      query += ' ORDER BY scraped_at DESC LIMIT 100'

      const articles = db.prepare(query).all(...params)
      return { success: true, data: articles }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('news:toggleSaved', (_event, id: string) => {
    try {
      const db = getDb()
      db.prepare('UPDATE articles SET saved = CASE WHEN saved = 1 THEN 0 ELSE 1 END WHERE id = ?').run(id)
      const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(id)
      return { success: true, data: article }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('news:scrapeSource', async (_event, sourceId: string) => {
    try {
      const count = await scrapeSourceById(sourceId)
      return { success: true, data: count }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('news:generatePost', async (_event, articleId: string) => {
    try {
      const db = getDb()

      // Get the article
      const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(articleId) as {
        id: string; title: string; summary: string; url: string; tags: string
      } | undefined
      if (!article) {
        return { success: false, error: 'Article not found' }
      }

      // Get LLM config (from DB or defaults)
      const configRow = db.prepare("SELECT value FROM settings WHERE key = 'llm_config'").get() as { value: string } | undefined
      const config = configRow?.value ? JSON.parse(configRow.value) : DEFAULT_LLM_CONFIG

      // Build the prompt — include system instructions inline for robustness
      const systemPrompt = config.systemPrompt || DEFAULT_LLM_CONFIG.systemPrompt
      const userPrompt = [
        systemPrompt,
        '',
        `Write a ${config.length} LinkedIn post in ${config.language} based on this article:`,
        `Title: ${article.title}`,
        `Summary: ${article.summary}`,
        `URL: ${article.url}`,
        `Requirements: Tone: ${config.tone}, Style: ${config.style}, ${config.hashtagCount} hashtags.`,
        `Output ONLY the post text followed by the hashtags on a separate line. No explanations, no metadata.`,
      ].join('\n')

      // Map model config to claude CLI model names
      const modelMap: Record<string, string> = {
        haiku: 'haiku',
        sonnet: 'sonnet',
        opus: 'opus',
      }
      const model = modelMap[config.model] || 'sonnet'

      const claudePath = getClaudePath()
      logger.info('ipc', 'Generating post via Claude CLI', { articleId, model, claudePath })

      // Run claude CLI (one-shot with spawn)
      const result = await new Promise<string>((resolve, reject) => {
        const args = [
          '--print',
          '--output-format', 'text',
          '--model', model,
          '-p', userPrompt,
        ]

        const proc = spawn(claudePath, args, {
          stdio: ['ignore', 'pipe', 'pipe'],
          env: getClaudeEnv(),
        })

        let stdout = ''
        let stderr = ''

        proc.stdout.on('data', (data: Buffer) => { stdout += data.toString() })
        proc.stderr.on('data', (data: Buffer) => { stderr += data.toString() })

        proc.on('close', (code, signal) => {
          if (code === 0) {
            resolve(stdout.trim())
          } else {
            logger.error('ipc', 'Claude CLI error', {
              code, signal,
              stderr: stderr.substring(0, 500),
              stdout: stdout.substring(0, 200),
            })
            reject(new Error(stderr.trim() || `Claude CLI exited with code ${code}`))
          }
        })

        proc.on('error', (err) => {
          reject(new Error(`Failed to start Claude CLI: ${err.message}`))
        })

        // Safety timeout: 2 minutes
        setTimeout(() => {
          try { proc.kill() } catch {}
          reject(new Error('Claude CLI timed out after 2 minutes'))
        }, 120000)
      })

      // Parse result: split content from hashtags
      // Hashtags are typically on the last line(s) starting with #
      const lines = result.split('\n')
      const hashtagLines: string[] = []
      const contentLines: string[] = []

      // Walk from bottom, collect hashtag lines
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim()
        if (line && /^#\w/.test(line)) {
          hashtagLines.unshift(line)
        } else {
          contentLines.push(...lines.slice(0, i + 1))
          break
        }
      }

      const content = contentLines.join('\n').trim()
      const hashtags = hashtagLines.join(' ').trim()

      logger.info('ipc', 'Post generated successfully', { articleId, contentLength: content.length })

      return {
        success: true,
        data: { content: content || result, hashtags, articleId },
      }
    } catch (err) {
      logger.error('ipc', 'Post generation failed', { error: String(err) })
      return { success: false, error: String(err) }
    }
  })
}
