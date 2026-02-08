import React, { useState } from 'react'
import { TitleBar } from './TitleBar'
import { Sidebar } from './Sidebar'
import { TabId } from '../lib/types'
import { NewsTab } from './tabs/NewsTab'
import { LLMConfigTab } from './tabs/LLMConfigTab'
import { AccountsTab } from './tabs/AccountsTab'
import { PublishTab } from './tabs/PublishTab'
import { InteractionsTab } from './tabs/InteractionsTab'
import { AgentDashboardTab } from './tabs/AgentDashboardTab'
import { DebugLogTab } from './tabs/DebugLogTab'
import { ClaudePanel } from './ClaudePanel'

const TAB_COMPONENTS: Record<TabId, React.FC> = {
  'news': NewsTab,
  'llm-config': LLMConfigTab,
  'accounts': AccountsTab,
  'publish': PublishTab,
  'interactions': InteractionsTab,
  'agents': AgentDashboardTab,
  'debug-log': DebugLogTab,
}

export const Layout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('news')
  const [claudeOpen, setClaudeOpen] = useState(false)
  const ActiveComponent = TAB_COMPONENTS[activeTab]

  return (
    <div className="h-screen flex flex-col bg-nexus-bg">
      <TitleBar onToggleClaude={() => setClaudeOpen((o) => !o)} claudeOpen={claudeOpen} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 overflow-auto p-6">
          <ActiveComponent />
        </main>
        {claudeOpen && <ClaudePanel onClose={() => setClaudeOpen(false)} />}
      </div>
    </div>
  )
}
