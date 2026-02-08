export type AgentName = 'orion' | 'scout' | 'scribe' | 'echo'

export interface AgentConfig {
  name: AgentName
  displayName: string
  description: string
  systemPrompt: string
  model: string
  maxBudget: number
  allowedTools: string[]
  outputSchema: Record<string, unknown>
}

export interface AgentInvocation {
  agent: AgentName
  input: Record<string, unknown>
  startedAt: number
}

export interface AgentResult {
  success: boolean
  output: unknown
  duration_ms: number
  cost_usd: number
  error?: string
}

// Orion coordinator output
export interface CoordinatorAction {
  action: 'invoke_scout' | 'invoke_scribe' | 'invoke_echo' | 'complete' | 'error'
  params: Record<string, unknown>
  reasoning: string
}

// Scout output
export interface ScoutOutput {
  articles: {
    title: string
    url: string
    summary: string
    score: number
    tags?: string[]
  }[]
}

// Scribe output
export interface ScribeOutput {
  post_content: string
  hashtags: string[]
}

// Echo output
export interface EchoOutput {
  responses: {
    id: string
    text: string
    tone: string
  }[]
}
