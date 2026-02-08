import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { TextArea } from '../ui/Input'

interface AgentControlsProps {
  onRunWorkflow: (workflow: string, params: Record<string, unknown>) => void
}

export const AgentControls: React.FC<AgentControlsProps> = ({ onRunWorkflow }) => {
  const [customInput, setCustomInput] = useState('')

  const workflows = [
    { id: 'news-to-posts', label: 'News to Posts', description: 'Discover news and create social media posts' },
    { id: 'score-articles', label: 'Score Articles', description: 'Re-score existing articles by relevance' },
    { id: 'generate-responses', label: 'Generate Responses', description: 'Create responses for pending interactions' },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-nexus-text-primary mb-2">Quick Workflows</h3>
        <div className="grid grid-cols-1 gap-2">
          {workflows.map(w => (
            <button
              key={w.id}
              onClick={() => onRunWorkflow(w.id, {})}
              className="flex items-center justify-between p-3 bg-nexus-surface-elevated rounded-lg border border-nexus-border hover:border-nexus-primary/30 transition-all text-left"
            >
              <div>
                <span className="text-sm text-nexus-text-primary font-medium">{w.label}</span>
                <p className="text-xs text-nexus-text-secondary">{w.description}</p>
              </div>
              <svg className="w-4 h-4 text-nexus-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-nexus-text-primary mb-2">Custom Command</h3>
        <TextArea
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          rows={3}
          placeholder='e.g. {"topics": ["AI", "startups"], "count": 5}'
        />
        <div className="flex justify-end mt-2">
          <Button
            size="sm"
            onClick={() => {
              try {
                const params = customInput ? JSON.parse(customInput) : {}
                onRunWorkflow('custom', params)
              } catch {
                onRunWorkflow('custom', { raw: customInput })
              }
            }}
            disabled={!customInput.trim()}
          >
            Run Command
          </Button>
        </div>
      </div>
    </div>
  )
}
