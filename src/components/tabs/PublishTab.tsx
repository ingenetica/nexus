import React, { useEffect, useState } from 'react'
import { usePublishStore } from '../../stores/publishStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { PostPreview } from '../publish/PostPreview'
import { PostComposer } from '../publish/PostComposer'
import { SchedulePicker } from '../publish/SchedulePicker'
import { Button } from '../ui/Button'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Modal } from '../ui/Modal'
import { Spinner } from '../ui/Spinner'
import { PostStatus } from '../../lib/types'

const statusFilters: { value: PostStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Drafts' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
  { value: 'failed', label: 'Failed' },
]

export const PublishTab: React.FC = () => {
  const {
    posts, accounts, loading, filterStatus,
    setFilterStatus, loadPosts, createPost, updatePost, deletePost,
    publishPost, schedulePost, loadAccounts, connectLinkedIn, disconnectAccount,
  } = usePublishStore()

  const { linkedInConfig, loadLinkedInConfig } = useSettingsStore()

  const [showComposer, setShowComposer] = useState(false)
  const [schedulePostId, setSchedulePostId] = useState<string | null>(null)
  const [linkedInError, setLinkedInError] = useState<string | null>(null)

  const handleConnectLinkedIn = async () => {
    // Pre-check: verify credentials are configured
    if (!linkedInConfig.clientId || !linkedInConfig.clientSecret) {
      setLinkedInError('LinkedIn credentials not configured. Go to LLM Config tab and enter your Client ID and Client Secret in the LinkedIn Credentials section.')
      return
    }
    try {
      await connectLinkedIn()
    } catch (err) {
      setLinkedInError(err instanceof Error ? err.message : String(err))
    }
  }

  useEffect(() => {
    loadPosts()
    loadAccounts()
    loadLinkedInConfig()
  }, [])

  useEffect(() => {
    loadPosts()
  }, [filterStatus])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-nexus-text-primary">Publishing</h1>
          <p className="text-sm text-nexus-text-secondary mt-1">Manage and publish social media posts</p>
        </div>
        <Button onClick={() => setShowComposer(true)}>+ New Post</Button>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Accounts</CardTitle>
            </CardHeader>
            {accounts.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-nexus-text-secondary mb-3">No accounts connected</p>
                <Button size="sm" onClick={handleConnectLinkedIn}>Connect LinkedIn</Button>
              </div>
            ) : (
              <div className="space-y-2">
                {accounts.map(acc => (
                  <div key={acc.id} className="flex items-center justify-between p-2 bg-nexus-bg rounded-lg border border-nexus-border">
                    <div>
                      <span className="text-xs text-nexus-text-primary font-medium">{acc.name}</span>
                      <span className="text-[10px] text-nexus-text-secondary block uppercase">{acc.platform}</span>
                    </div>
                    <button
                      onClick={() => disconnectAccount(acc.id)}
                      className="text-[10px] text-nexus-text-secondary hover:text-red-400"
                    >
                      Disconnect
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Filter</CardTitle>
            </CardHeader>
            <div className="space-y-1">
              {statusFilters.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilterStatus(f.value)}
                  className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${
                    filterStatus === f.value
                      ? 'bg-nexus-primary/10 text-nexus-primary'
                      : 'text-nexus-text-secondary hover:text-nexus-text-primary hover:bg-nexus-surface-elevated'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stats</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-nexus-bg rounded-lg p-2 border border-nexus-border">
                <span className="text-lg font-bold text-nexus-primary">{posts.filter(p => p.status === 'draft').length}</span>
                <span className="text-[10px] text-nexus-text-secondary block">Drafts</span>
              </div>
              <div className="bg-nexus-bg rounded-lg p-2 border border-nexus-border">
                <span className="text-lg font-bold text-nexus-accent">{posts.filter(p => p.status === 'scheduled').length}</span>
                <span className="text-[10px] text-nexus-text-secondary block">Scheduled</span>
              </div>
              <div className="bg-nexus-bg rounded-lg p-2 border border-nexus-border">
                <span className="text-lg font-bold text-green-400">{posts.filter(p => p.status === 'published').length}</span>
                <span className="text-[10px] text-nexus-text-secondary block">Published</span>
              </div>
              <div className="bg-nexus-bg rounded-lg p-2 border border-nexus-border">
                <span className="text-lg font-bold text-red-400">{posts.filter(p => p.status === 'failed').length}</span>
                <span className="text-[10px] text-nexus-text-secondary block">Failed</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="col-span-3">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Spinner size="lg" /></div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-nexus-text-secondary">
              <p className="text-lg mb-2">No posts yet</p>
              <p className="text-sm">Create a post from the News tab or compose one manually</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map(post => (
                <PostPreview
                  key={post.id}
                  post={post}
                  onEdit={() => { /* TODO: open editor */ }}
                  onPublish={() => publishPost(post.id)}
                  onSchedule={() => setSchedulePostId(post.id)}
                  onDelete={() => deletePost(post.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={showComposer} onClose={() => setShowComposer(false)} title="Compose Post">
        <PostComposer
          onSave={(content, hashtags) => {
            createPost({ platform: 'linkedin', content, hashtags, status: 'draft' })
            setShowComposer(false)
          }}
          onCancel={() => setShowComposer(false)}
        />
      </Modal>

      <Modal open={!!schedulePostId} onClose={() => setSchedulePostId(null)} title="Schedule Post">
        <SchedulePicker
          onSchedule={(dateTime) => {
            if (schedulePostId) {
              schedulePost(schedulePostId, dateTime)
              setSchedulePostId(null)
            }
          }}
          onCancel={() => setSchedulePostId(null)}
        />
      </Modal>

      <Modal open={!!linkedInError} onClose={() => setLinkedInError(null)} title="LinkedIn Connection Failed">
        <div className="space-y-4">
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{linkedInError}</p>
          </div>
          <div className="text-sm text-nexus-text-secondary space-y-2">
            <p className="font-medium text-nexus-text-primary">To configure LinkedIn OAuth:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Go to the LinkedIn Developer Portal and create an app</li>
              <li>Copy the Client ID and Client Secret</li>
              <li>Set the redirect URI to <code className="bg-nexus-bg px-1 rounded">http://localhost:19847/callback</code></li>
              <li>In Nexus, go to <strong>LLM Config</strong> tab and enter your credentials in the <strong>LinkedIn Credentials</strong> section</li>
            </ol>
          </div>
          <Button size="sm" onClick={() => setLinkedInError(null)}>Got it</Button>
        </div>
      </Modal>
    </div>
  )
}
