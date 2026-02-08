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
  generatePost: (articleId: string, platform?: string) => ipcRenderer.invoke('news:generatePost', articleId, platform),

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
  connectInstagram: () => ipcRenderer.invoke('publish:connectInstagram'),
  connectFacebook: () => ipcRenderer.invoke('publish:connectFacebook'),
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
  getFacebookConfig: () => ipcRenderer.invoke('settings:getFacebookConfig'),
  setFacebookConfig: (config: Record<string, unknown>) => ipcRenderer.invoke('settings:setFacebookConfig', config),

  // Personalities
  listPersonalities: () => ipcRenderer.invoke('personalities:list'),
  getPersonality: (id: string) => ipcRenderer.invoke('personalities:get', id),
  createPersonality: (data: Record<string, unknown>) => ipcRenderer.invoke('personalities:create', data),
  updatePersonality: (id: string, data: Record<string, unknown>) => ipcRenderer.invoke('personalities:update', id, data),
  deletePersonality: (id: string) => ipcRenderer.invoke('personalities:delete', id),
  setDefaultPersonality: (id: string) => ipcRenderer.invoke('personalities:setDefault', id),
  assignPlatformPersonality: (platform: string, personalityId: string) => ipcRenderer.invoke('personalities:assignPlatform', platform, personalityId),
  getPlatformAssignments: () => ipcRenderer.invoke('personalities:getPlatformAssignments'),

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
