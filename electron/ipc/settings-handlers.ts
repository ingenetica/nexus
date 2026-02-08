import { ipcMain, safeStorage } from 'electron'
import { getDb } from '../database/index'

export const DEFAULT_LLM_CONFIG = {
  model: 'sonnet',
  tone: 'thought-leader',
  length: 'medium',
  style: 'opinion',
  language: 'es',
  hashtagCount: 5,
  maxBudget: 0.5,
  systemPrompt: 'Eres un referente tech que escribe posts de LinkedIn en español a partir de noticias tech en inglés. Tono formal pero no solemne, ligeramente ácido e irónico pero que no cae mal. Analizas las implicaciones reales, no solo resumes.',
  postTemplate: '{{summary}}\n\n{{hashtags}}',
}

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', (_event, key: string) => {
    try {
      const db = getDb()
      const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
      return { success: true, data: row?.value || null }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('settings:set', (_event, key: string, value: string) => {
    try {
      const db = getDb()
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('settings:getLLMConfig', () => {
    try {
      const db = getDb()
      const row = db.prepare("SELECT value FROM settings WHERE key = 'llm_config'").get() as { value: string } | undefined

      if (row?.value) {
        return { success: true, data: JSON.parse(row.value) }
      }
      return { success: true, data: DEFAULT_LLM_CONFIG }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('settings:setLLMConfig', (_event, config: Record<string, unknown>) => {
    try {
      const db = getDb()
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('llm_config', ?)").run(JSON.stringify(config))
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // LinkedIn Config
  ipcMain.handle('settings:getLinkedInConfig', () => {
    try {
      const db = getDb()
      const row = db.prepare("SELECT value FROM settings WHERE key = 'linkedin_config'").get() as { value: string } | undefined
      if (row?.value) {
        const encrypted = JSON.parse(row.value) as { clientId: string; clientSecret: string }
        const clientId = safeStorage.isEncryptionAvailable()
          ? safeStorage.decryptString(Buffer.from(encrypted.clientId, 'base64'))
          : encrypted.clientId
        const clientSecret = safeStorage.isEncryptionAvailable()
          ? safeStorage.decryptString(Buffer.from(encrypted.clientSecret, 'base64'))
          : encrypted.clientSecret
        return { success: true, data: { clientId, clientSecret } }
      }
      return { success: true, data: { clientId: '', clientSecret: '' } }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('settings:setLinkedInConfig', (_event, config: { clientId: string; clientSecret: string }) => {
    try {
      const db = getDb()
      const encryptedId = safeStorage.isEncryptionAvailable()
        ? safeStorage.encryptString(config.clientId).toString('base64')
        : config.clientId
      const encryptedSecret = safeStorage.isEncryptionAvailable()
        ? safeStorage.encryptString(config.clientSecret).toString('base64')
        : config.clientSecret
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('linkedin_config', ?)").run(
        JSON.stringify({ clientId: encryptedId, clientSecret: encryptedSecret })
      )
      // Reset LinkedIn client so it picks up new credentials
      const { resetLinkedInClient } = require('../services/linkedin')
      resetLinkedInClient()
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // Interactions
  ipcMain.handle('interactions:get', (_event, postId?: string) => {
    try {
      const db = getDb()
      let query = 'SELECT * FROM interactions'
      const params: unknown[] = []
      if (postId) {
        query += ' WHERE post_id = ?'
        params.push(postId)
      }
      query += ' ORDER BY created_at DESC'
      const interactions = db.prepare(query).all(...params)
      return { success: true, data: interactions }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('interactions:respond', (_event, id: string, response: string) => {
    try {
      const db = getDb()
      db.prepare("UPDATE interactions SET response_status = 'responded', suggested_response = ? WHERE id = ?").run(response, id)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('interactions:dismiss', (_event, id: string) => {
    try {
      const db = getDb()
      db.prepare("UPDATE interactions SET response_status = 'dismissed' WHERE id = ?").run(id)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('interactions:poll', async () => {
    try {
      // Would poll LinkedIn for new interactions on published posts
      // For now, returns 0
      return { success: true, data: 0 }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })
}
