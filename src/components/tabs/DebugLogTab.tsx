import React, { useEffect, useRef } from 'react'
import { useLogStore } from '../../stores/logStore'
import { LogLevel, LogCategory } from '../../lib/types'
import { Button } from '../ui/Button'

const LEVELS: (LogLevel | 'all')[] = ['all', 'debug', 'info', 'warn', 'error']
const CATEGORIES: (LogCategory | 'all')[] = ['all', 'system', 'agent', 'ipc', 'db', 'scheduler', 'scraper']

const levelColors: Record<LogLevel, string> = {
  debug: 'text-gray-500',
  info: 'text-cyan-400',
  warn: 'text-yellow-400',
  error: 'text-red-400',
}

export const DebugLogTab: React.FC = () => {
  const {
    entries, filterLevel, filterCategory, paused,
    setFilterLevel, setFilterCategory, togglePaused, clear, init,
  } = useLogStore()

  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsub = init()
    return unsub
  }, [])

  useEffect(() => {
    if (!paused) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [entries.length, paused])

  const filtered = entries.filter((e) => {
    if (filterLevel !== 'all' && e.level !== filterLevel) return false
    if (filterCategory !== 'all' && e.category !== filterCategory) return false
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-nexus-text-primary">Debug Log</h1>
          <p className="text-sm text-nexus-text-secondary mt-1">Real-time system events</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant={paused ? 'primary' : 'ghost'} onClick={togglePaused}>
            {paused ? 'Resume' : 'Pause'}
          </Button>
          <Button size="sm" variant="ghost" onClick={clear}>Clear</Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="text-xs text-nexus-text-secondary mr-1">Level:</span>
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setFilterLevel(l)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                filterLevel === l
                  ? 'bg-nexus-primary/20 text-nexus-primary'
                  : 'text-nexus-text-secondary hover:text-nexus-text-primary hover:bg-nexus-surface-elevated'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-nexus-text-secondary mr-1">Category:</span>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilterCategory(c)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                filterCategory === c
                  ? 'bg-nexus-primary/20 text-nexus-primary'
                  : 'text-nexus-text-secondary hover:text-nexus-text-primary hover:bg-nexus-surface-elevated'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-nexus-bg border border-nexus-border rounded-lg overflow-hidden">
        <div className="h-[calc(100vh-260px)] overflow-auto font-mono text-xs p-3 space-y-0.5">
          {filtered.length === 0 ? (
            <div className="text-nexus-text-secondary text-center py-8">
              {entries.length === 0 ? 'Waiting for log entries...' : 'No entries match filters'}
            </div>
          ) : (
            filtered.map((entry) => (
              <div key={entry.id} className="flex gap-2 py-0.5 hover:bg-nexus-surface/30">
                <span className="text-nexus-text-secondary shrink-0 w-20">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
                <span className={`shrink-0 w-12 font-semibold uppercase ${levelColors[entry.level]}`}>
                  {entry.level}
                </span>
                <span className="shrink-0 w-20 text-nexus-accent">{entry.category}</span>
                <span className="text-nexus-text-primary">{entry.message}</span>
                {entry.data !== undefined && (
                  <span className="text-nexus-text-secondary truncate">
                    {typeof entry.data === 'string' ? entry.data : JSON.stringify(entry.data)}
                  </span>
                )}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  )
}
