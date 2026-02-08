import React, { useState } from 'react'
import { AgentState, AgentName } from '../../lib/types'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Spinner'
import { AgentTerminal } from './AgentTerminal'

interface AgentCardProps {
  agent: AgentState
  isSelected: boolean
  onSelect: () => void
  onInvoke?: () => void
  onCancel?: () => void
  activityLines: string[]
  onClearActivity: () => void
}

const statusConfig = {
  idle: { variant: 'default' as const, label: 'Idle' },
  running: { variant: 'warning' as const, label: 'Running' },
  error: { variant: 'error' as const, label: 'Error' },
  completed: { variant: 'success' as const, label: 'Completed' },
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent, isSelected, onSelect, onInvoke, onCancel, activityLines, onClearActivity }) => {
  const config = statusConfig[agent.status]
  const [terminalOpen, setTerminalOpen] = useState(false)

  return (
    <div
      className={`bg-nexus-surface rounded-lg border p-4 cursor-pointer transition-all duration-200 ${
        isSelected ? 'border-nexus-primary shadow-glow' : 'border-nexus-border hover:border-nexus-primary/30'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-nexus-text-primary">{agent.displayName}</h3>
        <div className="flex items-center gap-2">
          {agent.status === 'running' && <Spinner size="sm" />}
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>
      </div>

      {agent.description && (
        <p className="text-[11px] text-nexus-text-secondary mb-2 leading-relaxed">{agent.description}</p>
      )}

      {agent.error && agent.status === 'error' && (
        <div className="mb-2 px-2 py-1.5 bg-red-500/10 border border-red-500/20 rounded text-[11px] text-red-400 break-all">
          {agent.error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 text-xs text-nexus-text-secondary">
        <div>
          <span className="block text-[10px] uppercase tracking-wider">Runs</span>
          <span className="text-nexus-text-primary font-medium">{agent.totalRuns}</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase tracking-wider">Cost</span>
          <span className="text-nexus-text-primary font-medium">${agent.totalCost.toFixed(4)}</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase tracking-wider">Last Run</span>
          <span className="text-nexus-text-primary font-medium">
            {agent.lastRun ? new Date(agent.lastRun).toLocaleTimeString() : 'Never'}
          </span>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        {agent.status === 'running' ? (
          <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); onCancel?.() }}>Cancel</Button>
        ) : (
          <Button size="sm" onClick={(e) => { e.stopPropagation(); onInvoke?.() }}>Invoke</Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => { e.stopPropagation(); setTerminalOpen(!terminalOpen) }}
        >
          {terminalOpen ? 'Hide Log' : 'Show Log'}
        </Button>
      </div>

      {terminalOpen && (
        <AgentTerminal lines={activityLines} onClear={onClearActivity} />
      )}
    </div>
  )
}
