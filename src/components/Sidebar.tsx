import React from 'react'
import { TABS } from '../lib/constants'
import { TabId } from '../lib/types'
import { SIDEBAR_ICONS } from './icons/SidebarIcons'

interface SidebarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="w-56 bg-nexus-surface border-r border-nexus-border flex flex-col">
      <nav className="flex-1 py-4">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = SIDEBAR_ICONS[tab.id]
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-nexus-primary/10 text-nexus-primary border-r-2 border-nexus-primary'
                  : 'text-nexus-text-secondary hover:text-nexus-text-primary hover:bg-nexus-surface-elevated'
              }`}
            >
              {Icon && <Icon size={18} />}
              <span className="font-medium">{tab.label}</span>
            </button>
          )
        })}
      </nav>
      <div className="p-4 border-t border-nexus-border">
        <div className="text-xs text-nexus-text-secondary">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>System Online</span>
          </div>
          <div className="mt-1 text-[10px] opacity-50">v1.0.0</div>
        </div>
      </div>
    </div>
  )
}
