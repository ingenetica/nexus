import { Article, NewsSource, Post, Interaction, AgentLog, AgentState, LLMConfig, IpcResult, SocialAccount, LogEntry } from './types'

declare global {
  interface Window {
    nexus: NexusAPI
  }
}

export interface NexusAPI {
  // News
  getSources(): Promise<IpcResult<NewsSource[]>>
  addSource(source: Omit<NewsSource, 'id' | 'created_at'>): Promise<IpcResult<NewsSource>>
  deleteSource(id: string): Promise<IpcResult<void>>
  toggleSource(id: string, enabled: boolean): Promise<IpcResult<void>>
  fetchArticles(sourceId?: string): Promise<IpcResult<Article[]>>
  getArticles(filters?: { search?: string; sourceId?: string; minScore?: number; savedOnly?: boolean }): Promise<IpcResult<Article[]>>
  scrapeSource(sourceId: string): Promise<IpcResult<number>>
  toggleSaved(id: string): Promise<IpcResult<Article>>
  generatePost(articleId: string): Promise<IpcResult<{ content: string; hashtags: string; articleId: string }>>

  // Posts
  getPosts(status?: string): Promise<IpcResult<Post[]>>
  createPost(post: Partial<Post>): Promise<IpcResult<Post>>
  updatePost(id: string, updates: Partial<Post>): Promise<IpcResult<Post>>
  deletePost(id: string): Promise<IpcResult<void>>
  publishPost(id: string): Promise<IpcResult<Post>>
  schedulePost(id: string, scheduledAt: string): Promise<IpcResult<Post>>

  // Social Accounts
  getAccounts(): Promise<IpcResult<SocialAccount[]>>
  connectLinkedIn(): Promise<IpcResult<SocialAccount>>
  disconnectAccount(id: string): Promise<IpcResult<void>>

  // Interactions
  getInteractions(postId?: string): Promise<IpcResult<Interaction[]>>
  respondToInteraction(id: string, response: string): Promise<IpcResult<void>>
  dismissInteraction(id: string): Promise<IpcResult<void>>
  pollInteractions(): Promise<IpcResult<number>>

  // Agents
  getAgentStates(): Promise<IpcResult<AgentState[]>>
  getAgentLogs(agent?: string, limit?: number): Promise<IpcResult<AgentLog[]>>
  invokeAgent(agent: string, input: Record<string, unknown>): Promise<IpcResult<unknown>>
  cancelAgent(agent: string): Promise<IpcResult<void>>
  runWorkflow(workflow: string, params: Record<string, unknown>): Promise<IpcResult<unknown>>

  // Settings
  getSetting(key: string): Promise<IpcResult<string>>
  setSetting(key: string, value: string): Promise<IpcResult<void>>
  getLLMConfig(): Promise<IpcResult<LLMConfig>>
  setLLMConfig(config: LLMConfig): Promise<IpcResult<void>>
  getLinkedInConfig(): Promise<IpcResult<{ clientId: string; clientSecret: string }>>
  setLinkedInConfig(config: { clientId: string; clientSecret: string }): Promise<IpcResult<void>>

  // Debug Log
  onLogEntry(callback: (entry: LogEntry) => void): () => void

  // Claude Code
  claudeSend(message: string): Promise<IpcResult<void>>
  claudeKill(): Promise<IpcResult<void>>
  claudeReset(): Promise<IpcResult<void>>
  onClaudeStream(callback: (data: { type: string; content?: string; error?: string }) => void): () => void

  // Window
  minimizeWindow(): void
  maximizeWindow(): void
  closeWindow(): void

  // Platform
  platform: string
}

// Helper to call IPC with error handling
export const ipc = (): NexusAPI => window.nexus
