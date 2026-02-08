import { getDb } from '../database/index'
import { getLinkedInClient } from './linkedin'
import { getInstagramClient } from './instagram'
import { getFacebookClient } from './facebook'
import { SocialPlatform } from './social-base'
import { logger } from './logger'

let intervalId: ReturnType<typeof setInterval> | null = null

export function startScheduler(): void {
  if (intervalId) return

  logger.info('scheduler', 'Started - checking every 60 seconds')

  intervalId = setInterval(async () => {
    await checkScheduledPosts()
  }, 60_000)

  // Also run immediately
  checkScheduledPosts()
}

export function stopScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

async function checkScheduledPosts(): Promise<void> {
  const db = getDb()

  const due = db.prepare(`
    SELECT * FROM posts
    WHERE status = 'scheduled' AND scheduled_at <= datetime('now')
    ORDER BY scheduled_at ASC
  `).all() as Array<{ id: string; content: string; hashtags: string; platform: string }>

  for (const post of due) {
    logger.info('scheduler', `Publishing scheduled post ${post.id}`)

    db.prepare('UPDATE posts SET status = ? WHERE id = ?').run('publishing', post.id)

    try {
      const fullContent = post.hashtags
        ? `${post.content}\n\n${post.hashtags}`
        : post.content

      // Get article image for Instagram
      let imageUrl: string | undefined
      const articleRow = db.prepare('SELECT image_url FROM articles a JOIN posts p ON p.article_id = a.id WHERE p.id = ?').get(post.id) as { image_url?: string } | undefined
      if (articleRow?.image_url) imageUrl = articleRow.image_url

      const clientMap: Record<string, () => SocialPlatform> = {
        linkedin: () => getLinkedInClient(),
        instagram: () => getInstagramClient(),
        facebook: () => getFacebookClient(),
      }

      const getClient = clientMap[post.platform]
      if (!getClient) {
        db.prepare('UPDATE posts SET status = ?, error = ? WHERE id = ?')
          .run('failed', `Unknown platform: ${post.platform}`, post.id)
        continue
      }

      const client = getClient()
      const result = await client.publish(fullContent, { imageUrl })

      if (result.success) {
        db.prepare('UPDATE posts SET status = ?, published_at = datetime(?), external_id = ? WHERE id = ?')
          .run('published', new Date().toISOString(), result.externalId || null, post.id)
        logger.info('scheduler', `Post ${post.id} published successfully to ${post.platform}`)
      } else {
        db.prepare('UPDATE posts SET status = ?, error = ? WHERE id = ?')
          .run('failed', result.error || 'Unknown error', post.id)
        logger.error('scheduler', `Post ${post.id} publish failed`, { error: result.error })
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      db.prepare('UPDATE posts SET status = ?, error = ? WHERE id = ?')
        .run('failed', errorMsg, post.id)
      logger.error('scheduler', `Post ${post.id} publish error`, { error: errorMsg })
    }
  }
}
