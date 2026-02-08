import { ipcMain, safeStorage } from 'electron'
import { v4 as uuid } from 'uuid'
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
  // Allowlist of keys readable via the generic getter.
  // Sensitive keys (linkedin_config) have dedicated encrypted handlers.
  const ALLOWED_READ_KEYS = ['llm_config', 'theme', 'notifications', 'scheduler_interval']

  ipcMain.handle('settings:get', (_event, key: string) => {
    try {
      if (!ALLOWED_READ_KEYS.includes(key)) {
        return { success: false, error: `Setting key "${key}" is not allowed via generic getter` }
      }
      const db = getDb()
      const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
      return { success: true, data: row?.value || null }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // Allowlist of keys that can be written via the generic settings:set handler.
  // Sensitive keys (linkedin_config) must use their dedicated encrypted handlers.
  const ALLOWED_SETTINGS_KEYS = ['llm_config', 'theme', 'notifications', 'scheduler_interval']

  ipcMain.handle('settings:set', (_event, key: string, value: string) => {
    try {
      if (!ALLOWED_SETTINGS_KEYS.includes(key)) {
        return { success: false, error: `Setting key "${key}" is not allowed via generic setter` }
      }
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
        if (!safeStorage.isEncryptionAvailable()) {
          return { success: false, error: 'System encryption unavailable. Cannot decrypt credentials.' }
        }
        const encrypted = JSON.parse(row.value) as { clientId: string; clientSecret: string }
        const clientId = safeStorage.decryptString(Buffer.from(encrypted.clientId, 'base64'))
        const clientSecret = safeStorage.decryptString(Buffer.from(encrypted.clientSecret, 'base64'))
        return { success: true, data: { clientId, clientSecret } }
      }
      return { success: true, data: { clientId: '', clientSecret: '' } }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('settings:setLinkedInConfig', (_event, config: { clientId: string; clientSecret: string }) => {
    try {
      if (!safeStorage.isEncryptionAvailable()) {
        return { success: false, error: 'System keychain encryption is not available. Cannot securely store credentials.' }
      }
      const db = getDb()
      const encryptedId = safeStorage.encryptString(config.clientId).toString('base64')
      const encryptedSecret = safeStorage.encryptString(config.clientSecret).toString('base64')
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

  // ─── Personalities ───
  ipcMain.handle('personalities:list', () => {
    try {
      const db = getDb()
      const personalities = db.prepare('SELECT * FROM personalities ORDER BY is_default DESC, name ASC').all()
      return { success: true, data: personalities }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('personalities:get', (_event, id: string) => {
    try {
      const db = getDb()
      const personality = db.prepare('SELECT * FROM personalities WHERE id = ?').get(id)
      if (!personality) return { success: false, error: 'Personality not found' }
      return { success: true, data: personality }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('personalities:create', (_event, data: {
    name: string; system_prompt: string; tone: string; style: string; language: string; length: string
  }) => {
    try {
      const db = getDb()
      const id = uuid()
      db.prepare(`
        INSERT INTO personalities (id, name, system_prompt, tone, style, language, length)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, data.name, data.system_prompt, data.tone, data.style, data.language, data.length)
      const created = db.prepare('SELECT * FROM personalities WHERE id = ?').get(id)
      return { success: true, data: created }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('personalities:update', (_event, id: string, data: {
    name?: string; system_prompt?: string; tone?: string; style?: string; language?: string; length?: string
  }) => {
    try {
      const db = getDb()
      const SAFE_COLUMNS: Record<string, string> = {
        name: 'name', system_prompt: 'system_prompt', tone: 'tone',
        style: 'style', language: 'language', length: 'length',
      }
      const fields: string[] = []
      const values: unknown[] = []
      for (const [key, val] of Object.entries(data)) {
        const col = SAFE_COLUMNS[key]
        if (col && val !== undefined) {
          fields.push(`${col} = ?`)
          values.push(val)
        }
      }
      if (fields.length > 0) {
        values.push(id)
        db.prepare(`UPDATE personalities SET ${fields.join(', ')} WHERE id = ?`).run(...values)
      }
      const updated = db.prepare('SELECT * FROM personalities WHERE id = ?').get(id)
      return { success: true, data: updated }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('personalities:delete', (_event, id: string) => {
    try {
      const db = getDb()
      const personality = db.prepare('SELECT is_default FROM personalities WHERE id = ?').get(id) as { is_default: number } | undefined
      if (!personality) return { success: false, error: 'Personality not found' }
      if (personality.is_default) return { success: false, error: 'Cannot delete the default personality' }
      db.prepare('DELETE FROM personalities WHERE id = ?').run(id)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('personalities:setDefault', (_event, id: string) => {
    try {
      const db = getDb()
      db.prepare('UPDATE personalities SET is_default = 0').run()
      db.prepare('UPDATE personalities SET is_default = 1 WHERE id = ?').run(id)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('personalities:assignPlatform', (_event, platform: string, personalityId: string) => {
    try {
      const db = getDb()
      const row = db.prepare("SELECT value FROM settings WHERE key = 'platform_personalities'").get() as { value: string } | undefined
      const assignments = row?.value ? JSON.parse(row.value) : {}
      assignments[platform] = personalityId
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('platform_personalities', ?)").run(JSON.stringify(assignments))
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('personalities:getPlatformAssignments', () => {
    try {
      const db = getDb()
      const row = db.prepare("SELECT value FROM settings WHERE key = 'platform_personalities'").get() as { value: string } | undefined
      const assignments = row?.value ? JSON.parse(row.value) : {}
      return { success: true, data: assignments }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // ─── Facebook Config (shared for FB + IG) ───
  ipcMain.handle('settings:getFacebookConfig', () => {
    try {
      const db = getDb()
      const row = db.prepare("SELECT value FROM settings WHERE key = 'facebook_config'").get() as { value: string } | undefined
      if (row?.value) {
        if (!safeStorage.isEncryptionAvailable()) {
          return { success: false, error: 'System encryption unavailable. Cannot decrypt credentials.' }
        }
        const encrypted = JSON.parse(row.value) as { appId: string; appSecret: string }
        const appId = safeStorage.decryptString(Buffer.from(encrypted.appId, 'base64'))
        const appSecret = safeStorage.decryptString(Buffer.from(encrypted.appSecret, 'base64'))
        return { success: true, data: { appId, appSecret } }
      }
      return { success: true, data: { appId: '', appSecret: '' } }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('settings:setFacebookConfig', (_event, config: { appId: string; appSecret: string }) => {
    try {
      if (!safeStorage.isEncryptionAvailable()) {
        return { success: false, error: 'System keychain encryption is not available. Cannot securely store credentials.' }
      }
      const db = getDb()
      const encryptedId = safeStorage.encryptString(config.appId).toString('base64')
      const encryptedSecret = safeStorage.encryptString(config.appSecret).toString('base64')
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('facebook_config', ?)").run(
        JSON.stringify({ appId: encryptedId, appSecret: encryptedSecret })
      )
      // Reset Facebook/Instagram clients so they pick up new credentials
      try {
        const { resetInstagramClient } = require('../services/instagram')
        const { resetFacebookClient } = require('../services/facebook')
        resetInstagramClient()
        resetFacebookClient()
      } catch {}
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })
}
