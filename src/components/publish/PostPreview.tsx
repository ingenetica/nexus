import React from 'react'
import { Post } from '../../lib/types'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

interface PostPreviewProps {
  post: Post
  onEdit?: () => void
  onPublish?: () => void
  onSchedule?: () => void
  onDelete?: () => void
}

const statusVariant = (status: string) => {
  switch (status) {
    case 'draft': return 'default' as const
    case 'scheduled': return 'info' as const
    case 'publishing': return 'warning' as const
    case 'published': return 'success' as const
    case 'failed': return 'error' as const
    default: return 'default' as const
  }
}

export const PostPreview: React.FC<PostPreviewProps> = ({ post, onEdit, onPublish, onSchedule, onDelete }) => {
  return (
    <div className="bg-nexus-surface rounded-lg border border-nexus-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant(post.status)}>{post.status}</Badge>
          <span className="text-xs text-nexus-text-secondary uppercase">{post.platform}</span>
        </div>
        <span className="text-[10px] text-nexus-text-secondary">
          {new Date(post.created_at).toLocaleString()}
        </span>
      </div>

      <div className="bg-nexus-bg rounded-lg p-3 border border-nexus-border">
        <p className="text-sm text-nexus-text-primary whitespace-pre-wrap">{post.content}</p>
        {post.hashtags && (
          <p className="mt-2 text-xs text-nexus-accent">{post.hashtags}</p>
        )}
      </div>

      {post.scheduled_at && (
        <p className="text-xs text-nexus-text-secondary">
          Scheduled: {new Date(post.scheduled_at).toLocaleString()}
        </p>
      )}
      {post.error && (
        <p className="text-xs text-red-400">Error: {post.error}</p>
      )}

      <div className="flex items-center gap-2 pt-1">
        {post.status === 'draft' && (
          <>
            {onEdit && <Button size="sm" variant="ghost" onClick={onEdit}>Edit</Button>}
            {onPublish && <Button size="sm" onClick={onPublish}>Publish Now</Button>}
            {onSchedule && <Button size="sm" variant="secondary" onClick={onSchedule}>Schedule</Button>}
          </>
        )}
        {post.status === 'failed' && onPublish && (
          <Button size="sm" onClick={onPublish}>Retry</Button>
        )}
        {onDelete && <Button size="sm" variant="danger" onClick={onDelete}>Delete</Button>}
      </div>
    </div>
  )
}
