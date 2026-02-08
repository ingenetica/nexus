import React from 'react'
import { ipc } from '../lib/ipc'
import { ClaudeIcon } from './icons/SidebarIcons'

const isMac = window.nexus?.platform === 'darwin'

interface TitleBarProps {
  onToggleClaude: () => void
  claudeOpen: boolean
}

export const TitleBar: React.FC<TitleBarProps> = ({ onToggleClaude, claudeOpen }) => {
  return (
    <div className="flex items-center justify-between h-10 bg-nexus-surface border-b border-nexus-border select-none"
         style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
      <div className="flex items-center gap-2" style={{ paddingLeft: isMac ? 78 : 16 }}>
        <div className="w-3 h-3 rounded-full bg-nexus-primary shadow-glow-sm" />
        <span className="text-sm font-bold tracking-wider text-nexus-accent">NEXUS</span>
      </div>

      <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={onToggleClaude}
          className={`h-10 px-3 flex items-center gap-1.5 text-xs transition-colors ${
            claudeOpen
              ? 'text-nexus-accent bg-nexus-primary/10'
              : 'text-nexus-text-secondary hover:text-nexus-text-primary hover:bg-nexus-surface-elevated'
          }`}
          title="Toggle Claude Code panel"
        >
          <ClaudeIcon size={14} />
          <span className="font-medium">Claude</span>
        </button>

        {/* Only show custom window controls on non-macOS (macOS uses native traffic lights) */}
        {!isMac && (
          <>
            <button
              onClick={() => ipc().minimizeWindow()}
              className="w-12 h-10 flex items-center justify-center hover:bg-nexus-surface-elevated text-nexus-text-secondary hover:text-nexus-text-primary transition-colors"
            >
              <svg width="12" height="1" viewBox="0 0 12 1" fill="currentColor"><rect width="12" height="1"/></svg>
            </button>
            <button
              onClick={() => ipc().maximizeWindow()}
              className="w-12 h-10 flex items-center justify-center hover:bg-nexus-surface-elevated text-nexus-text-secondary hover:text-nexus-text-primary transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor"><rect x="0.5" y="0.5" width="9" height="9" strokeWidth="1"/></svg>
            </button>
            <button
              onClick={() => ipc().closeWindow()}
              className="w-12 h-10 flex items-center justify-center hover:bg-red-600 text-nexus-text-secondary hover:text-white transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2"><line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/></svg>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
