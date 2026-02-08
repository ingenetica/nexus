import React from 'react'

interface ResponseSuggestionProps {
  suggestion: string
  onAccept: (text: string) => void
  onReject: () => void
}

export const ResponseSuggestion: React.FC<ResponseSuggestionProps> = ({ suggestion, onAccept, onReject }) => {
  const [text, setText] = React.useState(suggestion)

  return (
    <div className="bg-nexus-primary/5 border border-nexus-primary/20 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-nexus-primary animate-pulse" />
        <span className="text-xs font-medium text-nexus-accent">AI Suggested Response</span>
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={2}
        className="w-full bg-transparent border border-nexus-border rounded px-2 py-1 text-sm text-nexus-text-primary focus:outline-none focus:border-nexus-primary resize-none"
      />
      <div className="flex justify-end gap-2">
        <button onClick={onReject} className="text-xs text-nexus-text-secondary hover:text-red-400 transition-colors">
          Reject
        </button>
        <button onClick={() => onAccept(text)} className="text-xs text-nexus-accent hover:text-nexus-primary transition-colors font-medium">
          Accept
        </button>
      </div>
    </div>
  )
}
