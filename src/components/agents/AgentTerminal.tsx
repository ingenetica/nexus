import React, { useRef, useEffect } from 'react'

interface AgentTerminalProps {
  lines: string[]
  onClear: () => void
}

export const AgentTerminal: React.FC<AgentTerminalProps> = ({ lines, onClear }) => {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines.length])

  return (
    <div className="mt-3 border-t border-nexus-border pt-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wider text-nexus-text-secondary">Activity</span>
        {lines.length > 0 && (
          <button onClick={(e) => { e.stopPropagation(); onClear() }} className="text-[10px] text-nexus-text-secondary hover:text-nexus-text-primary">
            Clear
          </button>
        )}
      </div>
      <div className="bg-nexus-bg rounded border border-nexus-border h-24 overflow-auto font-mono text-[11px] p-2 text-nexus-text-secondary">
        {lines.length === 0 ? (
          <span className="opacity-50">No activity yet</span>
        ) : (
          lines.map((line, i) => (
            <div key={i} className={line.includes('Error') ? 'text-red-400' : line.includes('Completed') ? 'text-green-400' : ''}>
              {line}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
