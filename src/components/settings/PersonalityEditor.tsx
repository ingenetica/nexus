import React, { useState } from 'react'
import { Personality } from '../../lib/types'
import { Button } from '../ui/Button'
import { Input, TextArea, Select } from '../ui/Input'

interface PersonalityEditorProps {
  personality?: Personality
  onSave: (data: Omit<Personality, 'id' | 'is_default' | 'created_at'>) => void
  onCancel: () => void
}

export const PersonalityEditor: React.FC<PersonalityEditorProps> = ({ personality, onSave, onCancel }) => {
  const [name, setName] = useState(personality?.name || '')
  const [systemPrompt, setSystemPrompt] = useState(personality?.system_prompt || '')
  const [tone, setTone] = useState(personality?.tone || 'professional')
  const [style, setStyle] = useState(personality?.style || 'informative')
  const [language, setLanguage] = useState(personality?.language || 'es')
  const [length, setLength] = useState(personality?.length || 'medium')

  const handleSave = () => {
    if (!name.trim() || !systemPrompt.trim()) return
    onSave({ name: name.trim(), system_prompt: systemPrompt.trim(), tone, style, language, length })
  }

  return (
    <div className="space-y-4">
      <Input
        label="Name"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="e.g. Tech Thought Leader"
      />
      <TextArea
        label="System Prompt"
        value={systemPrompt}
        onChange={e => setSystemPrompt(e.target.value)}
        rows={6}
        className="font-mono text-xs"
        placeholder="Instructions for the AI when generating content with this personality..."
      />
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Tone"
          value={tone}
          onChange={e => setTone(e.target.value)}
          options={[
            { value: 'professional', label: 'Professional' },
            { value: 'casual', label: 'Casual' },
            { value: 'technical', label: 'Technical' },
            { value: 'enthusiastic', label: 'Enthusiastic' },
            { value: 'thought-leader', label: 'Thought Leader' },
          ]}
        />
        <Select
          label="Style"
          value={style}
          onChange={e => setStyle(e.target.value)}
          options={[
            { value: 'informative', label: 'Informative' },
            { value: 'opinion', label: 'Opinion/Commentary' },
            { value: 'question', label: 'Question/Discussion' },
            { value: 'listicle', label: 'Listicle/Tips' },
          ]}
        />
        <Select
          label="Language"
          value={language}
          onChange={e => setLanguage(e.target.value)}
          options={[
            { value: 'en', label: 'English' },
            { value: 'es', label: 'Spanish' },
            { value: 'fr', label: 'French' },
            { value: 'de', label: 'German' },
            { value: 'pt', label: 'Portuguese' },
          ]}
        />
        <Select
          label="Length"
          value={length}
          onChange={e => setLength(e.target.value)}
          options={[
            { value: 'short', label: 'Short (< 500 chars)' },
            { value: 'medium', label: 'Medium (500-1500 chars)' },
            { value: 'long', label: 'Long (1500-3000 chars)' },
          ]}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave} disabled={!name.trim() || !systemPrompt.trim()}>
          {personality ? 'Update' : 'Create'} Personality
        </Button>
      </div>
    </div>
  )
}
