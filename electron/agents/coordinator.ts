import { BaseAgent } from './base-agent'
import { AgentConfig } from './types'

const COORDINATOR_CONFIG: AgentConfig = {
  name: 'orion',
  displayName: 'Orion (Coordinator)',
  description: 'Orchestrates multi-agent workflows by decomposing tasks and delegating to Scout, Scribe, and Echo.',
  model: 'sonnet',
  maxBudget: 0.50,
  allowedTools: [],
  outputSchema: {},
  systemPrompt: `You are Orion, the coordinator agent for Nexus, a social media publishing system.
Your role is to decompose high-level tasks into specific agent invocations.

Available agents:
- scout: Discovers and scores news articles. Input: {topics: string[], count?: number}
- scribe: Rewrites articles as social media posts. Input: {article_title: string, article_summary: string, tone: string, length: string}
- echo: Generates responses to social media interactions. Input: {comments: [{id: string, content: string, author: string}]}

You MUST respond with valid JSON in this exact format:
{
  "action": "invoke_scout" | "invoke_scribe" | "invoke_echo" | "complete" | "error",
  "params": { ... },
  "reasoning": "Brief explanation of your decision"
}

Only output ONE action at a time. The system will call you again with the results.`,
}

export class CoordinatorAgent extends BaseAgent {
  constructor() {
    super(COORDINATOR_CONFIG)
  }
}
