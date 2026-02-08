import { BrowserWindow, safeStorage } from 'electron'
import http from 'http'
import { URL } from 'url'
import { v4 as uuid } from 'uuid'
import { getDb } from '../database/index'
import { logger } from './logger'
import { SocialPlatform, PublishResult, PublishOptions, SocialComment } from './social-base'

const CALLBACK_PORT = 19849
const CALLBACK_PATH = '/callback'

export class FacebookClient extends SocialPlatform {
  private appId: string
  private appSecret: string
  private redirectUri: string

  constructor() {
    super()
    let dbAppId = ''
    let dbAppSecret = ''
    try {
      const db = getDb()
      const row = db.prepare("SELECT value FROM settings WHERE key = 'facebook_config'").get() as { value: string } | undefined
      if (row?.value && safeStorage.isEncryptionAvailable()) {
        const encrypted = JSON.parse(row.value) as { appId: string; appSecret: string }
        dbAppId = safeStorage.decryptString(Buffer.from(encrypted.appId, 'base64'))
        dbAppSecret = safeStorage.decryptString(Buffer.from(encrypted.appSecret, 'base64'))
      }
    } catch {
      // DB not ready or decryption failed
    }
    this.appId = dbAppId || process.env.FACEBOOK_APP_ID || ''
    this.appSecret = dbAppSecret || process.env.FACEBOOK_APP_SECRET || ''
    this.redirectUri = `http://localhost:${CALLBACK_PORT}${CALLBACK_PATH}`
  }

  get name() { return 'facebook' }

  isConnected(): boolean {
    const db = getDb()
    const account = db.prepare('SELECT id FROM social_accounts WHERE platform = ? LIMIT 1').get('facebook')
    return !!account
  }

  async connect(): Promise<void> {
    if (!this.appId || !this.appSecret) {
      throw new Error('Facebook credentials not configured. Go to LLM Config to set your App ID and App Secret.')
    }

    const state = uuid()
    const scopes = 'pages_manage_posts,pages_read_engagement'
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${this.appId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&state=${state}&scope=${scopes}&response_type=code`

    const authWindow = new BrowserWindow({
      width: 600,
      height: 700,
      show: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
      },
    })

    authWindow.webContents.on('will-navigate', (event, url) => {
      const parsed = new URL(url)
      const isFacebook = parsed.hostname.endsWith('facebook.com')
      const isCallback = parsed.hostname === 'localhost' && parsed.port === String(CALLBACK_PORT)
      if (!isFacebook && !isCallback) {
        event.preventDefault()
      }
    })

    authWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
    authWindow.loadURL(authUrl)

    const code = await this.waitForCallback(state)
    authWindow.close()

    // Exchange code for short-lived user token
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${this.appId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&client_secret=${this.appSecret}&code=${code}`
    const tokenResponse = await fetch(tokenUrl)
    if (!tokenResponse.ok) throw new Error(`Token exchange failed: ${tokenResponse.statusText}`)
    const tokenData = await tokenResponse.json() as { access_token: string }

    // Get pages
    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${tokenData.access_token}`)
    const pagesData = await pagesResponse.json() as { data?: Array<{ id: string; name: string; access_token: string }> }

    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error('No Facebook Pages found. You need a Facebook Page to publish.')
    }

    // Use the first page (could be extended to let user choose)
    const page = pagesData.data[0]

    // Exchange page token for long-lived page token
    const longLivedUrl = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${this.appId}&client_secret=${this.appSecret}&fb_exchange_token=${page.access_token}`
    const longLivedResponse = await fetch(longLivedUrl)
    let pageToken = page.access_token
    if (longLivedResponse.ok) {
      const longLivedData = await longLivedResponse.json() as { access_token: string }
      pageToken = longLivedData.access_token
    }

    // Store account
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('System keychain encryption is not available. Cannot securely store OAuth tokens.')
    }

    const db = getDb()
    const encryptedAccess = safeStorage.encryptString(pageToken).toString('base64')
    // Store page ID in profile_url for later use
    db.prepare(`
      INSERT OR REPLACE INTO social_accounts (id, platform, name, profile_url, access_token_encrypted, refresh_token_encrypted, token_expires_at, created_at)
      VALUES (?, 'facebook', ?, ?, ?, '', datetime('now', '+60 days'), datetime('now'))
    `).run(
      uuid(),
      page.name,
      page.id,
      encryptedAccess
    )

    logger.info('ipc', 'Facebook page connected', { pageId: page.id, pageName: page.name })
  }

  async disconnect(): Promise<void> {
    const db = getDb()
    db.prepare('DELETE FROM social_accounts WHERE platform = ?').run('facebook')
  }

  async publish(content: string, _options?: PublishOptions): Promise<PublishResult> {
    const accountData = this.getAccountData()
    if (!accountData) return { success: false, error: 'Not connected to Facebook' }

    const { token, pageId } = accountData

    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          access_token: token,
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        return { success: false, error: `Facebook API error: ${response.status} ${errText}` }
      }

      const result = await response.json() as { id?: string }
      return { success: true, externalId: result.id }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  }

  async getComments(postExternalId: string): Promise<SocialComment[]> {
    const accountData = this.getAccountData()
    if (!accountData) return []

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${postExternalId}/comments?access_token=${accountData.token}`
      )
      if (!response.ok) return []
      const data = await response.json() as { data?: Array<{ id: string; from?: { name?: string }; message?: string; created_time?: string }> }
      return (data.data || []).map(c => ({
        id: c.id,
        authorName: c.from?.name || 'Unknown',
        authorUrl: '',
        content: c.message || '',
        createdAt: c.created_time || new Date().toISOString(),
      }))
    } catch {
      return []
    }
  }

  async replyToComment(commentId: string, text: string): Promise<PublishResult> {
    const accountData = this.getAccountData()
    if (!accountData) return { success: false, error: 'Not connected' }

    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${commentId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, access_token: accountData.token }),
      })
      if (!response.ok) {
        const errText = await response.text()
        return { success: false, error: `Reply failed: ${errText}` }
      }
      const result = await response.json() as { id?: string }
      return { success: true, externalId: result.id }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  }

  private getAccountData(): { token: string; pageId: string } | null {
    const db = getDb()
    const account = db.prepare('SELECT access_token_encrypted, profile_url FROM social_accounts WHERE platform = ? LIMIT 1').get('facebook') as {
      access_token_encrypted: string
      profile_url: string
    } | undefined

    if (!account) return null
    if (!safeStorage.isEncryptionAvailable()) {
      logger.error('ipc', 'Cannot decrypt Facebook token: system encryption unavailable')
      return null
    }

    try {
      const token = safeStorage.decryptString(Buffer.from(account.access_token_encrypted, 'base64'))
      return { token, pageId: account.profile_url }
    } catch {
      logger.error('ipc', 'Failed to decrypt Facebook access token')
      return null
    }
  }

  private waitForCallback(expectedState: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const server = http.createServer((req, res) => {
        const url = new URL(req.url || '', `http://localhost:${CALLBACK_PORT}`)

        if (url.pathname === CALLBACK_PATH) {
          const code = url.searchParams.get('code')
          const state = url.searchParams.get('state')
          const error = url.searchParams.get('error')

          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.end('<html><body><h2>Authorization complete. You can close this window.</h2><script>window.close()</script></body></html>')

          server.close()

          if (error) {
            reject(new Error(`OAuth error: ${error}`))
          } else if (state !== expectedState) {
            reject(new Error('OAuth state mismatch'))
          } else if (code) {
            resolve(code)
          } else {
            reject(new Error('No authorization code received'))
          }
        }
      })

      server.listen(CALLBACK_PORT, '127.0.0.1', () => {
        logger.info('ipc', `Facebook OAuth callback server listening on 127.0.0.1:${CALLBACK_PORT}`)
      })

      setTimeout(() => {
        server.close()
        reject(new Error('OAuth timeout'))
      }, 300000)
    })
  }
}

let instance: FacebookClient | null = null

export function getFacebookClient(): FacebookClient {
  if (!instance) {
    instance = new FacebookClient()
  }
  return instance
}

export function resetFacebookClient(): void {
  instance = null
}
