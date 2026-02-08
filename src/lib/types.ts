// ─── News ───
export interface NewsSource {
  id: string
  name: string
  url: string
  type: 'rss' | 'web'
  enabled: boolean
  created_at: string
}

export interface Article {
  id: string
  source_id: string
  title: string
  url: string
  summary: string
  content: string
  image_url: string | null
  relevance_score: number
  published_at: string
  scraped_at: string
  tags: string
  saved: boolean
}

// ─── Posts ───
export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed'
export type SocialPlatform = 'linkedin' | 'instagram' | 'facebook'

export interface Post {
  id: string
  article_id: string | null
  platform: SocialPlatform
  content: string
  hashtags: string
  status: PostStatus
  scheduled_at: string | null
  published_at: string | null
  external_id: string | null
  error: string | null
  created_at: string
}

// ─── Social Accounts ───
export interface SocialAccount {
  id: string
  platform: SocialPlatform
  name: string
  profile_url: string
  access_token_encrypted: string
  refresh_token_encrypted: string
  token_expires_at: string
  created_at: string
}

// ─── Interactions ───
export type InteractionType = 'comment' | 'reaction' | 'share'

export interface Interaction {
  id: string
  post_id: string
  external_id: string
  type: InteractionType
  author_name: string
  author_url: string
  content: string
  suggested_response: string | null
  response_status: 'pending' | 'approved' | 'dismissed' | 'responded'
  created_at: string
}

// ─── Agents ───
export type AgentName = 'orion' | 'scout' | 'scribe' | 'echo'
export type AgentStatus = 'idle' | 'running' | 'error' | 'completed'

export interface AgentLog {
  id: string
  agent: AgentName
  action: string
  input: string
  output: string
  status: AgentStatus
  duration_ms: number
  cost_usd: number
  created_at: string
}

export interface AgentState {
  name: AgentName
  displayName: string
  description?: string
  status: AgentStatus
  error?: string | null
  lastRun: string | null
  totalRuns: number
  totalCost: number
}

// ─── Personalities ───
export interface Personality {
  id: string
  name: string
  system_prompt: string
  tone: string
  style: string
  language: string
  length: string
  is_default: boolean
  created_at: string
}

// ─── Settings ───
export interface LLMConfig {
  model: string
  tone: string
  length: string
  style: string
  language: string
  hashtagCount: number
  maxBudget: number
  systemPrompt: string
  postTemplate: string
}

// ─── IPC ───
export interface IpcResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// ─── Tabs ───
export type TabId = 'news' | 'llm-config' | 'accounts' | 'publish' | 'interactions' | 'agents' | 'debug-log'

// ─── Debug Log ───
export type LogLevel = 'info' | 'warn' | 'error' | 'debug'
export type LogCategory = 'agent' | 'ipc' | 'db' | 'scheduler' | 'scraper' | 'system'

export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  category: LogCategory
  message: string
  data?: unknown
}
