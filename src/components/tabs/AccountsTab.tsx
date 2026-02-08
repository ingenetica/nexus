import React, { useEffect, useState } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'
import { usePublishStore } from '../../stores/publishStore'
import { Button } from '../ui/Button'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { Modal } from '../ui/Modal'
import { SocialPlatform } from '../../lib/types'

const PLATFORM_COLORS: Record<SocialPlatform, string> = {
  linkedin: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  instagram: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  facebook: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
}

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  linkedin: 'in',
  instagram: 'IG',
  facebook: 'FB',
}

export const AccountsTab: React.FC = () => {
  const {
    linkedInConfig, linkedInDirty, loadLinkedInConfig, setLinkedInConfig, saveLinkedInConfig,
    facebookConfig, facebookDirty, loadFacebookConfig, setFacebookConfig, saveFacebookConfig,
  } = useSettingsStore()

  const {
    accounts, loadAccounts,
    connectLinkedIn, connectInstagram, connectFacebook, disconnectAccount,
  } = usePublishStore()

  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    loadLinkedInConfig()
    loadFacebookConfig()
    loadAccounts()
  }, [])

  const hasAccount = (platform: SocialPlatform) => accounts.some(a => a.platform === platform)

  const handleConnect = async (platform: SocialPlatform) => {
    try {
      if (platform === 'linkedin') {
        if (!linkedInConfig.clientId || !linkedInConfig.clientSecret) {
          setConnectionError('LinkedIn credentials not configured. Enter your Client ID and Client Secret above, then try again.')
          return
        }
        await connectLinkedIn()
      } else if (platform === 'instagram') {
        if (!facebookConfig.appId || !facebookConfig.appSecret) {
          setConnectionError('Facebook/Instagram credentials not configured. Enter your App ID and App Secret above, then try again.')
          return
        }
        await connectInstagram()
      } else if (platform === 'facebook') {
        if (!facebookConfig.appId || !facebookConfig.appSecret) {
          setConnectionError('Facebook credentials not configured. Enter your App ID and App Secret above, then try again.')
          return
        }
        await connectFacebook()
      }
    } catch (err) {
      setConnectionError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-nexus-text-primary">Accounts</h1>
        <p className="text-sm text-nexus-text-secondary mt-1">Manage API credentials and connected social media accounts</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>LinkedIn Credentials</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <p className="text-xs text-nexus-text-secondary">
                Configure your LinkedIn OAuth app credentials. Create an app at the LinkedIn Developer Portal.
              </p>
              <Input
                label="Client ID"
                value={linkedInConfig.clientId}
                onChange={e => setLinkedInConfig({ clientId: e.target.value })}
                placeholder="Enter LinkedIn Client ID"
              />
              <Input
                label="Client Secret"
                type="password"
                value={linkedInConfig.clientSecret}
                onChange={e => setLinkedInConfig({ clientSecret: e.target.value })}
                placeholder="Enter LinkedIn Client Secret"
              />
              <div className="flex items-center gap-2">
                {linkedInDirty && <Badge variant="warning">Unsaved</Badge>}
                <Button size="sm" onClick={saveLinkedInConfig} disabled={!linkedInDirty}>
                  Save Credentials
                </Button>
              </div>
              <div className="pt-2 border-t border-nexus-border">
                <p className="text-[10px] text-nexus-text-secondary mb-2">
                  Redirect URI: <code className="bg-nexus-bg px-1 rounded">http://localhost:19847/callback</code>
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Facebook / Instagram Credentials</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <p className="text-xs text-nexus-text-secondary">
                These credentials are used for both Facebook and Instagram. Create a Facebook App at the Meta Developer Portal.
              </p>
              <Input
                label="App ID"
                value={facebookConfig.appId}
                onChange={e => setFacebookConfig({ appId: e.target.value })}
                placeholder="Enter Facebook App ID"
              />
              <Input
                label="App Secret"
                type="password"
                value={facebookConfig.appSecret}
                onChange={e => setFacebookConfig({ appSecret: e.target.value })}
                placeholder="Enter Facebook App Secret"
              />
              <div className="flex items-center gap-2">
                {facebookDirty && <Badge variant="warning">Unsaved</Badge>}
                <Button size="sm" onClick={saveFacebookConfig} disabled={!facebookDirty}>
                  Save Credentials
                </Button>
              </div>
              <div className="pt-2 border-t border-nexus-border">
                <p className="text-[10px] text-nexus-text-secondary mb-1">
                  Instagram redirect URI: <code className="bg-nexus-bg px-1 rounded">http://localhost:19848/callback</code>
                </p>
                <p className="text-[10px] text-nexus-text-secondary">
                  Facebook redirect URI: <code className="bg-nexus-bg px-1 rounded">http://localhost:19849/callback</code>
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
            </CardHeader>
            {accounts.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-nexus-text-secondary mb-1">No accounts connected</p>
                <p className="text-xs text-nexus-text-secondary">Configure your credentials first, then connect your accounts below.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {accounts.map(acc => (
                  <div key={acc.id} className="flex items-center justify-between p-3 bg-nexus-bg rounded-lg border border-nexus-border">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-[10px] font-bold ${PLATFORM_COLORS[acc.platform] || ''}`}>
                        {PLATFORM_LABELS[acc.platform] || acc.platform}
                      </span>
                      <div>
                        <span className="text-sm text-nexus-text-primary font-medium block">{acc.name}</span>
                        <span className="text-[10px] text-nexus-text-secondary capitalize">{acc.platform}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="danger" onClick={() => disconnectAccount(acc.id)}>
                      Disconnect
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connect Account</CardTitle>
            </CardHeader>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-nexus-bg rounded-lg border border-nexus-border">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-[10px] font-bold ${PLATFORM_COLORS.linkedin}`}>in</span>
                  <div>
                    <span className="text-sm text-nexus-text-primary font-medium">LinkedIn</span>
                    <span className="text-[10px] text-nexus-text-secondary block">Professional networking</span>
                  </div>
                </div>
                {hasAccount('linkedin') ? (
                  <Badge variant="success">Connected</Badge>
                ) : (
                  <Button size="sm" onClick={() => handleConnect('linkedin')}>Connect</Button>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-nexus-bg rounded-lg border border-nexus-border">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-[10px] font-bold ${PLATFORM_COLORS.instagram}`}>IG</span>
                  <div>
                    <span className="text-sm text-nexus-text-primary font-medium">Instagram</span>
                    <span className="text-[10px] text-nexus-text-secondary block">Visual content (requires image)</span>
                  </div>
                </div>
                {hasAccount('instagram') ? (
                  <Badge variant="success">Connected</Badge>
                ) : (
                  <Button size="sm" onClick={() => handleConnect('instagram')}>Connect</Button>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-nexus-bg rounded-lg border border-nexus-border">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-[10px] font-bold ${PLATFORM_COLORS.facebook}`}>FB</span>
                  <div>
                    <span className="text-sm text-nexus-text-primary font-medium">Facebook</span>
                    <span className="text-[10px] text-nexus-text-secondary block">Page posts</span>
                  </div>
                </div>
                {hasAccount('facebook') ? (
                  <Badge variant="success">Connected</Badge>
                ) : (
                  <Button size="sm" onClick={() => handleConnect('facebook')}>Connect</Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal open={!!connectionError} onClose={() => setConnectionError(null)} title="Connection Failed">
        <div className="space-y-4">
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{connectionError}</p>
          </div>
          <Button size="sm" onClick={() => setConnectionError(null)}>Got it</Button>
        </div>
      </Modal>
    </div>
  )
}
