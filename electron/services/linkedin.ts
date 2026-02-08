import { BrowserWindow, safeStorage } from 'electron'
import http from 'http'
import { URL } from 'url'
import { v4 as uuid } from 'uuid'
import { getDb } from '../database/index'
import { logger } from './logger'
import { SocialPlatform, PublishResult, SocialComment } from './social-base'

const CALLBACK_PORT = 19847
const CALLBACK_PATH = '/callback'

export class LinkedInClient extends SocialPlatform {
  private clientId: string
  private clientSecret: string
  private redirectUri: string

  constructor() {
    super()
    // Try to read credentials from DB first, fallback to env vars
    let dbClientId = ''
    let dbClientSecret = ''
    try {
      const db = getDb()
      const row = db.prepare("SELECT value FROM settings WHERE key = 'linkedin_config'").get() as { value: string } | undefined
      if (row?.value) {
        const encrypted = JSON.parse(row.value) as { clientId: string; clientSecret: string }
        dbClientId = safeStorage.isEncryptionAvailable()
          ? safeStorage.decryptString(Buffer.from(encrypted.clientId, 'base64'))
          : encrypted.clientId
        dbClientSecret = safeStorage.isEncryptionAvailable()
          ? safeStorage.decryptString(Buffer.from(encrypted.clientSecret, 'base64'))
          : encrypted.clientSecret
      }
    } catch {
      // DB not ready or decryption failed, fall through to env vars
    }
    this.clientId = dbClientId || process.env.LINKEDIN_CLIENT_ID || ''
    this.clientSecret = dbClientSecret || process.env.LINKEDIN_CLIENT_SECRET || ''
    this.redirectUri = process.env.LINKEDIN_REDIRECT_URI || `http://localhost:${CALLBACK_PORT}${CALLBACK_PATH}`
  }

  get name() { return 'linkedin' }

  isConnected(): boolean {
    const db = getDb()
    const account = db.prepare('SELECT id FROM social_accounts WHERE platform = ? LIMIT 1').get('linkedin')
    return !!account
  }

  async connect(): Promise<void> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('LinkedIn credentials not configured. Go to LLM Config to set your Client ID and Client Secret.')
    }

    const state = uuid()
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&state=${state}&scope=openid%20profile%20w_member_social`

    // Open auth URL in a new browser window
    const authWindow = new BrowserWindow({
      width: 600,
      height: 700,
      show: true,
      webPreferences: { nodeIntegration: false },
    })
    authWindow.loadURL(authUrl)

    // Start local server to receive callback
    const code = await this.waitForCallback(state)
    authWindow.close()

    // Exchange code for token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.statusText}`)
    }

    const tokens = await tokenResponse.json() as {
      access_token: string
      expires_in: number
      refresh_token?: string
    }

    // Get user profile
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const profile = await profileResponse.json() as { name?: string; sub?: string }

    // Encrypt and store tokens
    const db = getDb()
    const encryptedAccess = safeStorage.isEncryptionAvailable()
      ? safeStorage.encryptString(tokens.access_token).toString('base64')
      : tokens.access_token
    const encryptedRefresh = tokens.refresh_token && safeStorage.isEncryptionAvailable()
      ? safeStorage.encryptString(tokens.refresh_token).toString('base64')
      : tokens.refresh_token || ''

    db.prepare(`
      INSERT OR REPLACE INTO social_accounts (id, platform, name, profile_url, access_token_encrypted, refresh_token_encrypted, token_expires_at, created_at)
      VALUES (?, 'linkedin', ?, ?, ?, ?, datetime('now', '+' || ? || ' seconds'), datetime('now'))
    `).run(
      uuid(),
      profile.name || 'LinkedIn User',
      `https://linkedin.com/in/${profile.sub || ''}`,
      encryptedAccess,
      encryptedRefresh,
      tokens.expires_in
    )
  }

  async disconnect(): Promise<void> {
    const db = getDb()
    db.prepare('DELETE FROM social_accounts WHERE platform = ?').run('linkedin')
  }

  async publish(content: string): Promise<PublishResult> {
    const token = this.getAccessToken()
    if (!token) return { success: false, error: 'Not connected to LinkedIn' }

    try {
      // Get user URN
      const meResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const me = await meResponse.json() as { sub?: string }

      const postBody = {
        author: `urn:li:person:${me.sub}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: content },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }

      const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(postBody),
      })

      if (!response.ok) {
        const errText = await response.text()
        return { success: false, error: `LinkedIn API error: ${response.status} ${errText}` }
      }

      const result = await response.json() as { id?: string }
      return { success: true, externalId: result.id }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  }

  async getComments(postExternalId: string): Promise<SocialComment[]> {
    const token = this.getAccessToken()
    if (!token) return []

    try {
      const response = await fetch(
        `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(postExternalId)}/comments`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (!response.ok) return []
      const data = await response.json() as { elements?: Array<{
        id?: string
        actor?: string
        message?: { text?: string }
        created?: { time?: number }
      }> }

      return (data.elements || []).map(el => ({
        id: el.id || '',
        authorName: el.actor || 'Unknown',
        authorUrl: '',
        content: el.message?.text || '',
        createdAt: el.created?.time ? new Date(el.created.time).toISOString() : new Date().toISOString(),
      }))
    } catch {
      return []
    }
  }

  async replyToComment(commentId: string, text: string): Promise<PublishResult> {
    // LinkedIn reply API requires specific UGC post context
    const token = this.getAccessToken()
    if (!token) return { success: false, error: 'Not connected' }

    // Simplified - actual implementation would need the post URN
    return { success: false, error: 'Reply not yet implemented' }
  }

  private getAccessToken(): string | null {
    const db = getDb()
    const account = db.prepare('SELECT access_token_encrypted FROM social_accounts WHERE platform = ? LIMIT 1').get('linkedin') as {
      access_token_encrypted: string
    } | undefined

    if (!account) return null

    if (safeStorage.isEncryptionAvailable()) {
      try {
        return safeStorage.decryptString(Buffer.from(account.access_token_encrypted, 'base64'))
      } catch {
        return account.access_token_encrypted
      }
    }
    return account.access_token_encrypted
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

      server.listen(CALLBACK_PORT, () => {
        logger.info('ipc', `LinkedIn OAuth callback server listening on port ${CALLBACK_PORT}`)
      })

      // Timeout after 5 minutes
      setTimeout(() => {
        server.close()
        reject(new Error('OAuth timeout'))
      }, 300000)
    })
  }
}

let instance: LinkedInClient | null = null

export function getLinkedInClient(): LinkedInClient {
  if (!instance) {
    instance = new LinkedInClient()
  }
  return instance
}

export function resetLinkedInClient(): void {
  instance = null
}
