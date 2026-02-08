import React from 'react'
import { Article } from '../../lib/types'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Spinner'

interface NewsCardProps {
  article: Article
  generating?: boolean
  onCreatePost?: (article: Article) => void
  onToggleSaved?: (article: Article) => void
}

function isSafeImageUrl(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

export const NewsCard: React.FC<NewsCardProps> = ({ article, generating, onCreatePost, onToggleSaved }) => {
  const scoreVariant = article.relevance_score >= 0.7 ? 'success' :
    article.relevance_score >= 0.4 ? 'warning' : 'default'

  const tags = article.tags ? article.tags.split(',').filter(Boolean) : []

  return (
    <div className="bg-nexus-surface rounded-lg border border-nexus-border p-4 hover:border-nexus-primary/30 transition-all duration-200 group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-nexus-text-primary group-hover:text-nexus-accent transition-colors line-clamp-2">
            {article.title}
          </h3>
          <p className="mt-1.5 text-xs text-nexus-text-secondary line-clamp-3">
            {article.summary}
          </p>
        </div>
        {isSafeImageUrl(article.image_url) && (
          <img
            src={article.image_url!}
            alt=""
            className="w-20 h-20 rounded-lg object-cover flex-shrink-0 border border-nexus-border"
          />
        )}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={scoreVariant}>
            Score: {Math.round(article.relevance_score * 100)}%
          </Badge>
          {tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="info">{tag.trim()}</Badge>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-nexus-text-secondary">
            {new Date(article.published_at).toLocaleDateString()}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onToggleSaved?.(article)}
            className={article.saved ? 'text-nexus-accent' : ''}
          >
            {article.saved ? 'Saved' : 'Save'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onCreatePost?.(article)} disabled={generating}>
            {generating ? <><Spinner size="sm" /> Generating...</> : 'Create Post'}
          </Button>
        </div>
      </div>
    </div>
  )
}
