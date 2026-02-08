import { ipcMain } from 'electron'
import { getAgentManager } from '../agents/agent-manager'
import { AgentName } from '../agents/types'

export function registerAgentHandlers(): void {
  ipcMain.handle('agents:getStates', () => {
    try {
      const manager = getAgentManager()
      const states = manager.getStates()
      return { success: true, data: states }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('agents:getLogs', (_event, agent?: string, limit?: number) => {
    try {
      const manager = getAgentManager()
      const logs = manager.getLogs(agent, limit)
      return { success: true, data: logs }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('agents:invoke', async (_event, agent: string, input: Record<string, unknown>) => {
    try {
      const manager = getAgentManager()
      const result = await manager.invoke(agent as AgentName, input)
      return { success: result.success, data: result.output, error: result.error }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('agents:cancel', (_event, agent: string) => {
    try {
      const manager = getAgentManager()
      manager.cancel(agent as AgentName)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('agents:runWorkflow', async (_event, workflow: string, params: Record<string, unknown>) => {
    try {
      const manager = getAgentManager()
      const result = await manager.runWorkflow(workflow, params)
      return { success: true, data: result }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })
}
