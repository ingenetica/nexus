import React, { useEffect } from 'react'
import { useAgentStore } from '../../stores/agentStore'
import { AgentCard } from '../agents/AgentCard'
import { AgentLogView } from '../agents/AgentLog'
import { AgentControls } from '../agents/AgentControls'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import { AgentName } from '../../lib/types'

export const AgentDashboardTab: React.FC = () => {
  const {
    agents, logs, selectedAgent, agentActivity,
    setSelectedAgent, loadAgentStates, loadLogs,
    invokeAgent, cancelAgent, runWorkflow, clearActivity,
  } = useAgentStore()

  useEffect(() => {
    loadAgentStates()
    loadLogs()
  }, [])

  useEffect(() => {
    if (selectedAgent) {
      loadLogs(selectedAgent)
    } else {
      loadLogs()
    }
  }, [selectedAgent])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-nexus-text-primary">Agent Dashboard</h1>
        <p className="text-sm text-nexus-text-secondary mt-1">Monitor and control AI agents</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {agents.map(agent => (
          <AgentCard
            key={agent.name}
            agent={agent}
            isSelected={selectedAgent === agent.name}
            onSelect={() => setSelectedAgent(selectedAgent === agent.name ? null : agent.name)}
            onInvoke={() => invokeAgent(agent.name, {})}
            onCancel={() => cancelAgent(agent.name)}
            activityLines={agentActivity.get(agent.name as AgentName) || []}
            onClearActivity={() => clearActivity(agent.name)}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Workflows</CardTitle>
            </CardHeader>
            <AgentControls onRunWorkflow={runWorkflow} />
          </Card>
        </div>
        <div className="col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Activity Log {selectedAgent && <span className="text-xs text-nexus-accent ml-2">({selectedAgent})</span>}
              </CardTitle>
            </CardHeader>
            <AgentLogView logs={logs} />
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cost Summary</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-5 gap-4">
          {agents.map(agent => (
            <div key={agent.name} className="bg-nexus-bg rounded-lg p-3 border border-nexus-border text-center">
              <span className="text-xs text-nexus-text-secondary block mb-1">{agent.displayName.split(' ')[0]}</span>
              <span className="text-lg font-bold text-nexus-primary">${agent.totalCost.toFixed(4)}</span>
              <span className="text-[10px] text-nexus-text-secondary block">{agent.totalRuns} runs</span>
            </div>
          ))}
          <div className="bg-nexus-primary/5 rounded-lg p-3 border border-nexus-primary/30 text-center">
            <span className="text-xs text-nexus-text-secondary block mb-1">Total</span>
            <span className="text-lg font-bold text-nexus-accent">
              ${agents.reduce((sum, a) => sum + a.totalCost, 0).toFixed(4)}
            </span>
            <span className="text-[10px] text-nexus-text-secondary block">
              {agents.reduce((sum, a) => sum + a.totalRuns, 0)} runs
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}
