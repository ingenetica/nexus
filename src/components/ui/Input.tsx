import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-nexus-text-secondary">{label}</label>}
      <input
        className={`bg-nexus-surface-elevated border border-nexus-border rounded-lg px-3 py-2 text-sm text-nexus-text-primary placeholder-nexus-text-secondary/50 focus:outline-none focus:border-nexus-primary focus:ring-1 focus:ring-nexus-primary/30 transition-colors ${className}`}
        {...props}
      />
    </div>
  )
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export const TextArea: React.FC<TextAreaProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-nexus-text-secondary">{label}</label>}
      <textarea
        className={`bg-nexus-surface-elevated border border-nexus-border rounded-lg px-3 py-2 text-sm text-nexus-text-primary placeholder-nexus-text-secondary/50 focus:outline-none focus:border-nexus-primary focus:ring-1 focus:ring-nexus-primary/30 transition-colors resize-none ${className}`}
        {...props}
      />
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

export const Select: React.FC<SelectProps> = ({ label, options, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-nexus-text-secondary">{label}</label>}
      <select
        className={`bg-nexus-surface-elevated border border-nexus-border rounded-lg px-3 py-2 text-sm text-nexus-text-primary focus:outline-none focus:border-nexus-primary focus:ring-1 focus:ring-nexus-primary/30 transition-colors ${className}`}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
