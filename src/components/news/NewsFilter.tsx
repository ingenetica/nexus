import React from 'react'
import { Input } from '../ui/Input'
import { NewsSource } from '../../lib/types'

interface NewsFilterProps {
  searchQuery: string
  onSearchChange: (q: string) => void
  selectedSourceId: string | null
  onSourceChange: (id: string | null) => void
  minScore: number
  onMinScoreChange: (score: number) => void
  savedOnly: boolean
  onSavedOnlyChange: (saved: boolean) => void
  sources: NewsSource[]
}

export const NewsFilter: React.FC<NewsFilterProps> = ({
  searchQuery,
  onSearchChange,
  selectedSourceId,
  onSourceChange,
  minScore,
  onMinScoreChange,
  savedOnly,
  onSavedOnlyChange,
  sources,
}) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <Input
          placeholder="Search articles..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>
      <select
        value={selectedSourceId || ''}
        onChange={e => onSourceChange(e.target.value || null)}
        className="bg-nexus-surface-elevated border border-nexus-border rounded-lg px-3 py-2 text-sm text-nexus-text-primary focus:outline-none focus:border-nexus-primary"
      >
        <option value="">All Sources</option>
        {sources.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <button
        onClick={() => onSavedOnlyChange(!savedOnly)}
        className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
          savedOnly
            ? 'bg-nexus-accent/10 border-nexus-accent text-nexus-accent'
            : 'bg-nexus-surface-elevated border-nexus-border text-nexus-text-secondary hover:text-nexus-text-primary'
        }`}
      >
        Saved Only
      </button>
      <div className="flex items-center gap-2">
        <span className="text-xs text-nexus-text-secondary whitespace-nowrap">Min Score:</span>
        <input
          type="range"
          min="0"
          max="100"
          value={minScore * 100}
          onChange={e => onMinScoreChange(Number(e.target.value) / 100)}
          className="w-20 accent-nexus-primary"
        />
        <span className="text-xs text-nexus-accent w-8">{Math.round(minScore * 100)}%</span>
      </div>
    </div>
  )
}
