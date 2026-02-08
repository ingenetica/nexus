import { create } from 'zustand'
import { AgentLog, AgentState, AgentName } from '../lib/types'
import { ipc } from '../lib/ipc'

export interface AgentActivity {
  agent: AgentName
  lines: string[]
}

interface AgentStoreState {
  agents: AgentState[]
  logs: AgentLog[]
  selectedAgent: AgentName | null
  loading: boolean
  agentActivity: Map<AgentName, string[]>
  setSelectedAgent: (agent: AgentName | null) => void
  loadAgentStates: () => Promise<void>
  loadLogs: (agent?: string, limit?: number) => Promise<void>
  invokeAgent: (agent: string, input: Record<string, unknown>) => Promise<unknown>
  cancelAgent: (agent: string) => Promise<void>
  runWorkflow: (workflow: string, params: Record<string, unknown>) => Promise<unknown>
  appendActivity: (agent: AgentName, line: string) => void
  clearActivity: (agent: AgentName) => void
}

export const useAgentStore = create<AgentStoreState>((set, get) => ({
  agents: [
    { name: 'orion', displayName: 'Orion (Coordinator)', status: 'idle', lastRun: null, totalRuns: 0, totalCost: 0 },
    { name: 'scout', displayName: 'Scout (News)', status: 'idle', lastRun: null, totalRuns: 0, totalCost: 0 },
    { name: 'scribe', displayName: 'Scribe (Content)', status: 'idle', lastRun: null, totalRuns: 0, totalCost: 0 },
    { name: 'echo', displayName: 'Echo (Engagement)', status: 'idle', lastRun: null, totalRuns: 0, totalCost: 0 },
  ],
  logs: [],
  selectedAgent: null,
  loading: false,
  agentActivity: new Map(),

  setSelectedAgent: (agent) => set({ selectedAgent: agent }),

  loadAgentStates: async () => {
    const result = await ipc().getAgentStates()
    if (result.success && result.data) {
      set({ agents: result.data })
    }
  },

  loadLogs: async (agent, limit = 50) => {
    set({ loading: true })
    const result = await ipc().getAgentLogs(agent, limit)
    if (result.success && result.data) {
      set({ logs: result.data })
    }
    set({ loading: false })
  },

  invokeAgent: async (agent, input) => {
    // Set running immediately
    set((state) => ({
      agents: state.agents.map(a =>
        a.name === agent ? { ...a, status: 'running' as const, error: null } : a
      )
    }))
    get().appendActivity(agent as AgentName, `[${new Date().toLocaleTimeString()}] Invoking ${agent}...`)

    try {
      const result = await ipc().invokeAgent(agent, input)

      if (result.success && result.data) {
        get().appendActivity(agent as AgentName, `[${new Date().toLocaleTimeString()}] Completed successfully`)
      } else if (result.error) {
        get().appendActivity(agent as AgentName, `[${new Date().toLocaleTimeString()}] Error: ${result.error}`)
      }

      await get().loadAgentStates()
      await get().loadLogs(get().selectedAgent || undefined)
      return result.data
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      get().appendActivity(agent as AgentName, `[${new Date().toLocaleTimeString()}] Error: ${errorMsg}`)

      // Update to error status
      set((state) => ({
        agents: state.agents.map(a =>
          a.name === agent ? { ...a, status: 'error' as const, error: errorMsg } : a
        )
      }))

      await get().loadAgentStates()
      return null
    }
  },

  cancelAgent: async (agent) => {
    await ipc().cancelAgent(agent)
    get().appendActivity(agent as AgentName, `[${new Date().toLocaleTimeString()}] Cancelled`)
    await get().loadAgentStates()
  },

  runWorkflow: async (workflow, params) => {
    const result = await ipc().runWorkflow(workflow, params)
    await get().loadAgentStates()
    await get().loadLogs()
    return result.data
  },

  appendActivity: (agent, line) => {
    set((state) => {
      const activity = new Map(state.agentActivity)
      const lines = [...(activity.get(agent) || []), line].slice(-100)
      activity.set(agent, lines)
      return { agentActivity: activity }
    })
  },

  clearActivity: (agent) => {
    set((state) => {
      const activity = new Map(state.agentActivity)
      activity.delete(agent)
      return { agentActivity: activity }
    })
  },
}))
