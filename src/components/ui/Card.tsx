import React from 'react'

interface CardProps {
  className?: string
  glow?: boolean
  children: React.ReactNode
}

export const Card: React.FC<CardProps> = ({ className = '', glow = false, children }) => {
  return (
    <div className={`bg-nexus-surface rounded-lg border border-nexus-border p-4 ${glow ? 'shadow-glow' : ''} ${className}`}>
      {children}
    </div>
  )
}

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`flex items-center justify-between mb-3 ${className}`}>{children}</div>
)

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-nexus-text-primary ${className}`}>{children}</h3>
)

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
)
