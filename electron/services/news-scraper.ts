import RSSParser from 'rss-parser'
import * as cheerio from 'cheerio'
import { v4 as uuid } from 'uuid'
import { getDb } from '../database/index'
import { logger } from './logger'

const rssParser = new RSSParser()

export interface ScrapedArticle {
  title: string
  url: string
  summary: string
  content: string
  image_url: string | null
  published_at: string
  tags: string[]
}

export async function scrapeRSSFeed(feedUrl: string): Promise<ScrapedArticle[]> {
  try {
    const feed = await rssParser.parseURL(feedUrl)
    return (feed.items || []).map(item => ({
      title: item.title || 'Untitled',
      url: item.link || '',
      summary: stripHtml(item.contentSnippet || item.content || '').substring(0, 500),
      content: stripHtml(item.content || item.contentSnippet || ''),
      image_url: extractImageFromItem(item),
      published_at: item.isoDate || new Date().toISOString(),
      tags: extractCategories(item),
    }))
  } catch (err) {
    logger.error('scraper', `Failed to parse RSS feed ${feedUrl}`, { error: err instanceof Error ? err.message : String(err) })
    return []
  }
}

export async function scrapeWebPage(url: string): Promise<ScrapedArticle[]> {
  try {
    const response = await fetch(url)
    const html = await response.text()
    const $ = cheerio.load(html)

    const articles: ScrapedArticle[] = []

    // Try to find article-like elements
    $('article, .post, .entry, [class*="article"]').each((_, el) => {
      const $el = $(el)
      const title = $el.find('h1, h2, h3').first().text().trim()
      const link = $el.find('a').first().attr('href') || ''
      const summary = $el.find('p').first().text().trim().substring(0, 500)
      const img = $el.find('img').first().attr('src') || null

      if (title && link) {
        articles.push({
          title,
          url: link.startsWith('http') ? link : new URL(link, url).href,
          summary,
          content: summary,
          image_url: img,
          published_at: new Date().toISOString(),
          tags: [],
        })
      }
    })

    return articles
  } catch (err) {
    logger.error('scraper', `Failed to scrape web page ${url}`, { error: err instanceof Error ? err.message : String(err) })
    return []
  }
}

export async function scrapeSourceById(sourceId: string): Promise<number> {
  const db = getDb()
  const source = db.prepare('SELECT * FROM sources WHERE id = ?').get(sourceId) as {
    id: string; url: string; type: string
  } | undefined

  if (!source) return 0

  const articles = source.type === 'rss'
    ? await scrapeRSSFeed(source.url)
    : await scrapeWebPage(source.url)

  let inserted = 0
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO articles (id, source_id, title, url, summary, content, image_url, relevance_score, published_at, scraped_at, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
  `)

  for (const article of articles) {
    if (!article.url) continue
    try {
      const result = stmt.run(
        uuid(),
        sourceId,
        article.title,
        article.url,
        article.summary,
        article.content,
        article.image_url,
        0.5, // default score
        article.published_at,
        article.tags.join(',')
      )
      if (result.changes > 0) inserted++
    } catch {
      // Skip duplicates (UNIQUE constraint on url)
    }
  }

  logger.info('scraper', `Inserted ${inserted} articles from source ${sourceId}`)
  return inserted
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

function extractImageFromItem(item: Record<string, unknown>): string | null {
  // Check for media:content or enclosure
  const media = item['media:content'] as { $?: { url?: string } } | undefined
  if (media?.$?.url) return media.$.url

  const enclosure = item.enclosure as { url?: string } | undefined
  if (enclosure?.url) return enclosure.url

  // Try to extract from content
  const content = String(item.content || '')
  const match = content.match(/<img[^>]+src="([^"]+)"/)
  return match ? match[1] : null
}

function extractCategories(item: Record<string, unknown>): string[] {
  const categories = item.categories as string[] | undefined
  return categories || []
}
