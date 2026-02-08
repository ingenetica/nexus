import React from 'react'
import { Interaction } from '../../lib/types'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

interface CommentCardProps {
  interaction: Interaction
  onApprove?: (response: string) => void
  onDismiss?: () => void
}

export const CommentCard: React.FC<CommentCardProps> = ({ interaction, onApprove, onDismiss }) => {
  const [editedResponse, setEditedResponse] = React.useState(interaction.suggested_response || '')

  const statusVariant = {
    pending: 'warning' as const,
    approved: 'info' as const,
    dismissed: 'default' as const,
    responded: 'success' as const,
  }

  return (
    <div className="bg-nexus-surface rounded-lg border border-nexus-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant[interaction.response_status]}>
            {interaction.response_status}
          </Badge>
          <Badge>{interaction.type}</Badge>
        </div>
        <span className="text-[10px] text-nexus-text-secondary">
          {new Date(interaction.created_at).toLocaleString()}
        </span>
      </div>

      <div className="bg-nexus-bg rounded-lg p-3 border border-nexus-border">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-nexus-accent">{interaction.author_name}</span>
        </div>
        <p className="text-sm text-nexus-text-primary">{interaction.content}</p>
      </div>

      {interaction.suggested_response && interaction.response_status === 'pending' && (
        <div>
          <label className="text-xs font-medium text-nexus-text-secondary block mb-1">Suggested Response</label>
          <textarea
            value={editedResponse}
            onChange={e => setEditedResponse(e.target.value)}
            rows={3}
            className="w-full bg-nexus-surface-elevated border border-nexus-border rounded-lg px-3 py-2 text-sm text-nexus-text-primary focus:outline-none focus:border-nexus-primary resize-none"
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button size="sm" variant="ghost" onClick={onDismiss}>Dismiss</Button>
            <Button size="sm" onClick={() => onApprove?.(editedResponse)}>Approve & Send</Button>
          </div>
        </div>
      )}
    </div>
  )
}
