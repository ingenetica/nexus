import React, { useEffect, useState } from 'react'
import { Interaction } from '../../lib/types'
import { ipc } from '../../lib/ipc'
import { CommentCard } from '../interactions/CommentCard'
import { Button } from '../ui/Button'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import { Spinner } from '../ui/Spinner'
import { Badge } from '../ui/Badge'

export const InteractionsTab: React.FC = () => {
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(false)
  const [polling, setPolling] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  const loadInteractions = async () => {
    setLoading(true)
    const result = await ipc().getInteractions()
    if (result.success && result.data) {
      setInteractions(result.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadInteractions()
  }, [])

  const handlePoll = async () => {
    setPolling(true)
    await ipc().pollInteractions()
    await loadInteractions()
    setPolling(false)
  }

  const handleApprove = async (id: string, response: string) => {
    await ipc().respondToInteraction(id, response)
    await loadInteractions()
  }

  const handleDismiss = async (id: string) => {
    await ipc().dismissInteraction(id)
    await loadInteractions()
  }

  const filtered = filter === 'all'
    ? interactions
    : interactions.filter(i => i.response_status === filter)

  const counts = {
    all: interactions.length,
    pending: interactions.filter(i => i.response_status === 'pending').length,
    responded: interactions.filter(i => i.response_status === 'responded').length,
    dismissed: interactions.filter(i => i.response_status === 'dismissed').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-nexus-text-primary">Interactions</h1>
          <p className="text-sm text-nexus-text-secondary mt-1">Manage comments, reactions, and engagement</p>
        </div>
        <Button onClick={handlePoll} disabled={polling}>
          {polling ? <><Spinner size="sm" /> Polling...</> : 'Check for New'}
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {Object.entries(counts).map(([key, count]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`p-3 rounded-lg border text-center transition-all ${
              filter === key
                ? 'bg-nexus-primary/10 border-nexus-primary/30 shadow-glow-sm'
                : 'bg-nexus-surface border-nexus-border hover:border-nexus-primary/20'
            }`}
          >
            <span className="text-xl font-bold text-nexus-text-primary block">{count}</span>
            <span className="text-xs text-nexus-text-secondary capitalize">{key}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-nexus-text-secondary">
          <p className="text-lg mb-2">No interactions found</p>
          <p className="text-sm">Publish some posts and check back for engagement</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(interaction => (
            <CommentCard
              key={interaction.id}
              interaction={interaction}
              onApprove={(response) => handleApprove(interaction.id, response)}
              onDismiss={() => handleDismiss(interaction.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
