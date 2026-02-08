import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // News
  getSources: () => ipcRenderer.invoke('news:getSources'),
  addSource: (source: Record<string, unknown>) => ipcRenderer.invoke('news:addSource', source),
  deleteSource: (id: string) => ipcRenderer.invoke('news:deleteSource', id),
  toggleSource: (id: string, enabled: boolean) => ipcRenderer.invoke('news:toggleSource', id, enabled),
  fetchArticles: (sourceId?: string) => ipcRenderer.invoke('news:getArticles', sourceId ? { sourceId } : undefined),
  getArticles: (filters?: Record<string, unknown>) => ipcRenderer.invoke('news:getArticles', filters),
  scrapeSource: (sourceId: string) => ipcRenderer.invoke('news:scrapeSource', sourceId),
  toggleSaved: (id: string) => ipcRenderer.invoke('news:toggleSaved', id),
  generatePost: (articleId: string) => ipcRenderer.invoke('news:generatePost', articleId),

  // Posts
  getPosts: (status?: string) => ipcRenderer.invoke('publish:getPosts', status),
  createPost: (post: Record<string, unknown>) => ipcRenderer.invoke('publish:createPost', post),
  updatePost: (id: string, updates: Record<string, unknown>) => ipcRenderer.invoke('publish:updatePost', id, updates),
  deletePost: (id: string) => ipcRenderer.invoke('publish:deletePost', id),
  publishPost: (id: string) => ipcRenderer.invoke('publish:publishPost', id),
  schedulePost: (id: string, scheduledAt: string) => ipcRenderer.invoke('publish:schedulePost', id, scheduledAt),

  // Social Accounts
  getAccounts: () => ipcRenderer.invoke('publish:getAccounts'),
  connectLinkedIn: () => ipcRenderer.invoke('publish:connectLinkedIn'),
  disconnectAccount: (id: string) => ipcRenderer.invoke('publish:disconnectAccount', id),

  // Interactions
  getInteractions: (postId?: string) => ipcRenderer.invoke('interactions:get', postId),
  respondToInteraction: (id: string, response: string) => ipcRenderer.invoke('interactions:respond', id, response),
  dismissInteraction: (id: string) => ipcRenderer.invoke('interactions:dismiss', id),
  pollInteractions: () => ipcRenderer.invoke('interactions:poll'),

  // Agents
  getAgentStates: () => ipcRenderer.invoke('agents:getStates'),
  getAgentLogs: (agent?: string, limit?: number) => ipcRenderer.invoke('agents:getLogs', agent, limit),
  invokeAgent: (agent: string, input: Record<string, unknown>) => ipcRenderer.invoke('agents:invoke', agent, input),
  cancelAgent: (agent: string) => ipcRenderer.invoke('agents:cancel', agent),
  runWorkflow: (workflow: string, params: Record<string, unknown>) => ipcRenderer.invoke('agents:runWorkflow', workflow, params),

  // Settings
  getSetting: (key: string) => ipcRenderer.invoke('settings:get', key),
  setSetting: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
  getLLMConfig: () => ipcRenderer.invoke('settings:getLLMConfig'),
  setLLMConfig: (config: Record<string, unknown>) => ipcRenderer.invoke('settings:setLLMConfig', config),
  getLinkedInConfig: () => ipcRenderer.invoke('settings:getLinkedInConfig'),
  setLinkedInConfig: (config: Record<string, unknown>) => ipcRenderer.invoke('settings:setLinkedInConfig', config),

  // Debug Log
  onLogEntry: (callback: (entry: unknown) => void) => {
    const handler = (_event: unknown, entry: unknown) => callback(entry)
    ipcRenderer.on('log:entry', handler as (...args: unknown[]) => void)
    return () => { ipcRenderer.removeListener('log:entry', handler as (...args: unknown[]) => void) }
  },

  // Claude Code
  claudeSend: (message: string) => ipcRenderer.invoke('claude:send', message),
  claudeKill: () => ipcRenderer.invoke('claude:kill'),
  claudeReset: () => ipcRenderer.invoke('claude:reset'),
  onClaudeStream: (callback: (data: unknown) => void) => {
    const handler = (_event: unknown, data: unknown) => callback(data)
    ipcRenderer.on('claude:stream', handler as (...args: unknown[]) => void)
    return () => { ipcRenderer.removeListener('claude:stream', handler as (...args: unknown[]) => void) }
  },

  // Window controls
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),

  // Platform info
  platform: process.platform,
}

contextBridge.exposeInMainWorld('nexus', api)
