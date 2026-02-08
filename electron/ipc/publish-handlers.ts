import { ipcMain } from 'electron'
import { v4 as uuid } from 'uuid'
import { getDb } from '../database/index'
import { getLinkedInClient } from '../services/linkedin'
import { getInstagramClient } from '../services/instagram'
import { getFacebookClient } from '../services/facebook'

export function registerPublishHandlers(): void {
  ipcMain.handle('publish:getPosts', (_event, status?: string) => {
    try {
      const db = getDb()
      let query = 'SELECT * FROM posts'
      const params: unknown[] = []

      if (status) {
        query += ' WHERE status = ?'
        params.push(status)
      }

      query += ' ORDER BY created_at DESC'
      const posts = db.prepare(query).all(...params)
      return { success: true, data: posts }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('publish:createPost', (_event, post: Record<string, unknown>) => {
    try {
      const db = getDb()
      const id = uuid()
      db.prepare(`
        INSERT INTO posts (id, article_id, platform, content, hashtags, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        id,
        post.article_id || null,
        post.platform || 'linkedin',
        post.content || '',
        post.hashtags || '',
        post.status || 'draft'
      )
      const created = db.prepare('SELECT * FROM posts WHERE id = ?').get(id)
      return { success: true, data: created }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('publish:updatePost', (_event, id: string, updates: Record<string, unknown>) => {
    try {
      const db = getDb()
      // Use a safe mapping — column names are never derived from user input
      const SAFE_COLUMNS: Record<string, string> = {
        content: 'content', hashtags: 'hashtags', status: 'status',
        scheduled_at: 'scheduled_at', published_at: 'published_at',
        external_id: 'external_id', error: 'error',
      }
      const fields: string[] = []
      const values: unknown[] = []

      for (const [key, val] of Object.entries(updates)) {
        const col = SAFE_COLUMNS[key]
        if (col) {
          fields.push(`${col} = ?`)
          values.push(val)
        }
      }

      if (fields.length > 0) {
        values.push(id)
        db.prepare(`UPDATE posts SET ${fields.join(', ')} WHERE id = ?`).run(...values)
      }

      const updated = db.prepare('SELECT * FROM posts WHERE id = ?').get(id)
      return { success: true, data: updated }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('publish:deletePost', (_event, id: string) => {
    try {
      const db = getDb()
      db.prepare('DELETE FROM posts WHERE id = ?').run(id)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('publish:publishPost', async (_event, id: string) => {
    try {
      const db = getDb()
      const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id) as {
        id: string; content: string; hashtags: string; platform: string; article_id: string | null
      } | undefined

      if (!post) return { success: false, error: 'Post not found' }

      db.prepare('UPDATE posts SET status = ? WHERE id = ?').run('publishing', id)

      const fullContent = post.hashtags
        ? `${post.content}\n\n${post.hashtags}`
        : post.content

      // Get article image for Instagram
      let imageUrl: string | undefined
      if (post.article_id) {
        const article = db.prepare('SELECT image_url FROM articles WHERE id = ?').get(post.article_id) as { image_url?: string } | undefined
        if (article?.image_url) imageUrl = article.image_url
      }

      // Route to correct platform client
      const clientMap: Record<string, () => import('../services/social-base').SocialPlatform> = {
        linkedin: () => getLinkedInClient(),
        instagram: () => getInstagramClient(),
        facebook: () => getFacebookClient(),
      }

      const getClient = clientMap[post.platform]
      if (!getClient) {
        db.prepare('UPDATE posts SET status = ?, error = ? WHERE id = ?').run('failed', `Unknown platform: ${post.platform}`, id)
        return { success: false, error: `Unknown platform: ${post.platform}` }
      }

      const client = getClient()
      const result = await client.publish(fullContent, { imageUrl })

      if (result.success) {
        db.prepare('UPDATE posts SET status = ?, published_at = datetime(?), external_id = ? WHERE id = ?')
          .run('published', new Date().toISOString(), result.externalId || null, id)
      } else {
        db.prepare('UPDATE posts SET status = ?, error = ? WHERE id = ?')
          .run('failed', result.error || 'Unknown error', id)
      }

      const updated = db.prepare('SELECT * FROM posts WHERE id = ?').get(id)
      return { success: true, data: updated }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('publish:schedulePost', (_event, id: string, scheduledAt: string) => {
    try {
      const db = getDb()
      db.prepare('UPDATE posts SET status = ?, scheduled_at = ? WHERE id = ?')
        .run('scheduled', scheduledAt, id)
      const updated = db.prepare('SELECT * FROM posts WHERE id = ?').get(id)
      return { success: true, data: updated }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('publish:getAccounts', () => {
    try {
      const db = getDb()
      const accounts = db.prepare('SELECT id, platform, name, profile_url, token_expires_at, created_at FROM social_accounts').all()
      return { success: true, data: accounts }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('publish:connectLinkedIn', async () => {
    try {
      const client = getLinkedInClient()
      await client.connect()
      const db = getDb()
      const account = db.prepare('SELECT id, platform, name, profile_url, token_expires_at, created_at FROM social_accounts WHERE platform = ? ORDER BY created_at DESC LIMIT 1').get('linkedin')
      return { success: true, data: account }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('publish:connectInstagram', async () => {
    try {
      const client = getInstagramClient()
      await client.connect()
      const db = getDb()
      const account = db.prepare('SELECT id, platform, name, profile_url, token_expires_at, created_at FROM social_accounts WHERE platform = ? ORDER BY created_at DESC LIMIT 1').get('instagram')
      return { success: true, data: account }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('publish:connectFacebook', async () => {
    try {
      const client = getFacebookClient()
      await client.connect()
      const db = getDb()
      const account = db.prepare('SELECT id, platform, name, profile_url, token_expires_at, created_at FROM social_accounts WHERE platform = ? ORDER BY created_at DESC LIMIT 1').get('facebook')
      return { success: true, data: account }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('publish:disconnectAccount', (_event, id: string) => {
    try {
      const db = getDb()
      db.prepare('DELETE FROM social_accounts WHERE id = ?').run(id)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })
}
