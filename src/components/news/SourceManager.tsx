import React, { useState } from 'react'
import { NewsSource } from '../../lib/types'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'

interface SourceManagerProps {
  sources: NewsSource[]
  onAdd: (source: Omit<NewsSource, 'id' | 'created_at'>) => void
  onDelete: (id: string) => void
  onToggle: (id: string, enabled: boolean) => void
}

export const SourceManager: React.FC<SourceManagerProps> = ({ sources, onAdd, onDelete, onToggle }) => {
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [type, setType] = useState<'rss' | 'web'>('rss')

  const handleAdd = () => {
    if (name && url) {
      onAdd({ name, url, type, enabled: true })
      setName('')
      setUrl('')
      setShowModal(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-nexus-text-primary">News Sources</h3>
        <Button size="sm" onClick={() => setShowModal(true)}>+ Add Source</Button>
      </div>
      <div className="space-y-1.5 max-h-60 overflow-y-auto">
        {sources.map((source) => (
          <div
            key={source.id}
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-nexus-surface-elevated border border-nexus-border"
          >
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggle(source.id, !source.enabled)}
                className={`w-3 h-3 rounded-full transition-colors ${source.enabled ? 'bg-green-500' : 'bg-nexus-border'}`}
              />
              <span className={`text-xs ${source.enabled ? 'text-nexus-text-primary' : 'text-nexus-text-secondary'}`}>
                {source.name}
              </span>
              <span className="text-[10px] text-nexus-text-secondary/50 uppercase">{source.type}</span>
            </div>
            <button
              onClick={() => onDelete(source.id)}
              className="text-nexus-text-secondary hover:text-red-400 transition-colors text-xs"
            >
              Remove
            </button>
          </div>
        ))}
        {sources.length === 0 && (
          <p className="text-xs text-nexus-text-secondary text-center py-4">No sources added yet</p>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add News Source">
        <div className="space-y-3">
          <Input label="Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. TechCrunch" />
          <Input label="URL" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={type === 'rss' ? 'primary' : 'secondary'}
              onClick={() => setType('rss')}
            >
              RSS Feed
            </Button>
            <Button
              size="sm"
              variant={type === 'web' ? 'primary' : 'secondary'}
              onClick={() => setType('web')}
            >
              Web Page
            </Button>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Source</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
