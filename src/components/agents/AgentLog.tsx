import React from 'react'
import { AgentLog as AgentLogType } from '../../lib/types'
import { Badge } from '../ui/Badge'

interface AgentLogViewProps {
  logs: AgentLogType[]
}

export const AgentLogView: React.FC<AgentLogViewProps> = ({ logs }) => {
  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-nexus-text-secondary text-sm">
        No agent activity yet
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {logs.map((log) => (
        <div key={log.id} className="bg-nexus-bg rounded-lg border border-nexus-border p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Badge variant={log.status === 'completed' ? 'success' : log.status === 'error' ? 'error' : 'warning'}>
                {log.agent}
              </Badge>
              <span className="text-xs text-nexus-text-primary font-medium">{log.action}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-nexus-text-secondary">
              <span>{log.duration_ms}ms</span>
              <span>${log.cost_usd.toFixed(4)}</span>
              <span>{new Date(log.created_at).toLocaleTimeString()}</span>
            </div>
          </div>
          {log.output && (
            <pre className="mt-1 text-[11px] text-nexus-text-secondary bg-nexus-surface-elevated rounded p-2 overflow-x-auto max-h-24">
              {log.output.substring(0, 500)}
            </pre>
          )}
        </div>
      ))}
    </div>
  )
}
