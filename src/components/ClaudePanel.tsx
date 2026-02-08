import React, { useState, useEffect, useRef } from 'react'
import { ipc } from '../lib/ipc'
import { Button } from './ui/Button'
import { Spinner } from './ui/Spinner'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ClaudePanelProps {
  onClose: () => void
}

export const ClaudePanel: React.FC<ClaudePanelProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [currentResponse, setCurrentResponse] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const unsub = ipc().onClaudeStream((data) => {
      if (data.type === 'done') {
        setStreaming(false)
        setCurrentResponse((prev) => {
          if (prev) {
            setMessages((msgs) => [...msgs, { role: 'assistant', content: prev }])
          }
          return ''
        })
      } else if (data.type === 'error') {
        setStreaming(false)
        setCurrentResponse('')
        setMessages((msgs) => [...msgs, { role: 'system', content: `Error: ${data.error}` }])
      } else if (data.type === 'text' && data.content) {
        setCurrentResponse((prev) => prev + data.content)
      } else if (data.type === 'content_block_delta' || data.type === 'assistant') {
        // Handle stream-json format
        const text = data.content || ''
        if (text) {
          setCurrentResponse((prev) => prev + text)
        }
      } else if (typeof data === 'object' && 'result' in (data as Record<string, unknown>)) {
        // Handle final result
        const result = (data as Record<string, unknown>).result
        if (typeof result === 'string') {
          setCurrentResponse((prev) => prev + result)
        }
      }
    })
    return unsub
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, currentResponse])

  const send = async () => {
    const text = input.trim()
    if (!text || streaming) return

    setMessages((msgs) => [...msgs, { role: 'user', content: text }])
    setInput('')
    setStreaming(true)
    setCurrentResponse('')

    await ipc().claudeSend(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const handleReset = async () => {
    await ipc().claudeReset()
    setMessages([])
    setCurrentResponse('')
    setStreaming(false)
  }

  return (
    <div className="w-96 bg-nexus-surface border-l border-nexus-border flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-nexus-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-nexus-accent" />
          <span className="text-sm font-semibold text-nexus-text-primary">Claude Code</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleReset}
            className="px-2 py-1 text-[10px] text-nexus-text-secondary hover:text-nexus-text-primary rounded hover:bg-nexus-surface-elevated"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-nexus-surface-elevated text-nexus-text-secondary hover:text-nexus-text-primary"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="1" y1="1" x2="9" y2="9" /><line x1="9" y1="1" x2="1" y2="9" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {messages.length === 0 && !currentResponse && (
          <div className="text-center py-8 text-nexus-text-secondary">
            <p className="text-sm">Ask Claude anything about your Nexus project.</p>
            <p className="text-xs mt-1 opacity-60">Messages use your local Claude CLI.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-sm rounded-lg px-3 py-2 ${
              msg.role === 'user'
                ? 'bg-nexus-primary/10 text-nexus-text-primary ml-6'
                : msg.role === 'system'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'bg-nexus-surface-elevated text-nexus-text-primary mr-6'
            }`}
          >
            <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed">{msg.content}</pre>
          </div>
        ))}

        {currentResponse && (
          <div className="bg-nexus-surface-elevated text-nexus-text-primary rounded-lg px-3 py-2 mr-6">
            <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed">{currentResponse}</pre>
          </div>
        )}

        {streaming && !currentResponse && (
          <div className="flex items-center gap-2 text-nexus-text-secondary text-xs">
            <Spinner size="sm" />
            <span>Thinking...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-nexus-border">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Claude..."
            rows={2}
            className="flex-1 bg-nexus-bg border border-nexus-border rounded-lg px-3 py-2 text-xs text-nexus-text-primary placeholder-nexus-text-secondary/50 resize-none focus:outline-none focus:border-nexus-primary/50"
          />
          <Button size="sm" onClick={send} disabled={streaming || !input.trim()}>
            {streaming ? <Spinner size="sm" /> : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  )
}
