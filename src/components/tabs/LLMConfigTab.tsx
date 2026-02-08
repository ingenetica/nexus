import React, { useEffect, useState } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'
import { usePersonalityStore } from '../../stores/personalityStore'
import { PersonalityEditor } from '../settings/PersonalityEditor'
import { Button } from '../ui/Button'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import { TextArea, Select } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { Modal } from '../ui/Modal'
import { Personality, SocialPlatform } from '../../lib/types'

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'EN', es: 'ES', fr: 'FR', de: 'DE', pt: 'PT',
}

export const LLMConfigTab: React.FC = () => {
  const {
    llmConfig, dirty, loadLLMConfig, setLLMConfig, saveLLMConfig,
  } = useSettingsStore()

  const {
    personalities, platformAssignments, loading: personalitiesLoading,
    loadPersonalities, createPersonality, updatePersonality, deletePersonality,
    setDefaultPersonality, assignPlatform, loadPlatformAssignments,
  } = usePersonalityStore()

  const [editingPersonality, setEditingPersonality] = useState<Personality | null>(null)
  const [showNewPersonality, setShowNewPersonality] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    loadLLMConfig()
    loadPersonalities()
    loadPlatformAssignments()
  }, [])

  const allPlatforms: SocialPlatform[] = ['linkedin', 'instagram', 'facebook']

  const handleDeletePersonality = async (id: string) => {
    const err = await deletePersonality(id)
    if (err) setDeleteError(err)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-nexus-text-primary">LLM Configuration</h1>
          <p className="text-sm text-nexus-text-secondary mt-1">Configure AI agents, personalities, and content generation parameters</p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <Badge variant="warning">Unsaved changes</Badge>}
          <Button onClick={saveLLMConfig} disabled={!dirty}>Save Configuration</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generation Parameters</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <Select
                label="Model"
                value={llmConfig.model}
                onChange={e => setLLMConfig({ model: e.target.value })}
                options={[
                  { value: 'haiku', label: 'Claude Haiku (Fast)' },
                  { value: 'sonnet', label: 'Claude Sonnet (Balanced)' },
                  { value: 'opus', label: 'Claude Opus (Powerful)' },
                ]}
              />
              <div>
                <label className="text-xs font-medium text-nexus-text-secondary block mb-1.5">
                  Hashtag Count: {llmConfig.hashtagCount}
                </label>
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={llmConfig.hashtagCount}
                  onChange={e => setLLMConfig({ hashtagCount: Number(e.target.value) })}
                  className="w-full accent-nexus-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-nexus-text-secondary block mb-1.5">
                  Max Budget per Request: ${llmConfig.maxBudget.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0.01"
                  max="5.00"
                  step="0.01"
                  value={llmConfig.maxBudget}
                  onChange={e => setLLMConfig({ maxBudget: Number(e.target.value) })}
                  className="w-full accent-nexus-primary"
                />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle>Personalities</CardTitle>
                <Button size="sm" onClick={() => setShowNewPersonality(true)}>+ New</Button>
              </div>
            </CardHeader>
            <div className="space-y-2">
              {personalities.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-nexus-bg rounded-lg border border-nexus-border">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-nexus-text-primary truncate">{p.name}</span>
                      {p.is_default && <Badge variant="info">default</Badge>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-nexus-text-secondary capitalize">{p.tone}</span>
                      <span className="text-[10px] text-nexus-text-secondary">{LANGUAGE_LABELS[p.language] || p.language}</span>
                      <span className="text-[10px] text-nexus-text-secondary capitalize">{p.style}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!p.is_default && (
                      <Button size="sm" variant="ghost" onClick={() => setDefaultPersonality(p.id)}>
                        Set Default
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setEditingPersonality(p)}>Edit</Button>
                    {!p.is_default && (
                      <Button size="sm" variant="danger" onClick={() => handleDeletePersonality(p.id)}>Delete</Button>
                    )}
                  </div>
                </div>
              ))}
              {personalities.length === 0 && (
                <p className="text-xs text-nexus-text-secondary text-center py-4">No personalities yet</p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Assignments</CardTitle>
            </CardHeader>
            <p className="text-xs text-nexus-text-secondary mb-3">
              Assign a personality to each platform. Posts will be generated using the assigned personality's tone, style, and language.
            </p>
            <div className="space-y-3">
              {allPlatforms.map(platform => (
                <div key={platform} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-nexus-text-primary capitalize w-20">{platform}</span>
                  <select
                    value={platformAssignments[platform] || ''}
                    onChange={e => assignPlatform(platform, e.target.value)}
                    className="flex-1 bg-nexus-bg border border-nexus-border rounded-lg px-3 py-1.5 text-xs text-nexus-text-primary focus:outline-none focus:border-nexus-primary"
                  >
                    <option value="">Use default personality</option>
                    {personalities.map(p => (
                      <option key={p.id} value={p.id}>{p.name}{p.is_default ? ' (default)' : ''}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Prompt (Global Fallback)</CardTitle>
            </CardHeader>
            <TextArea
              value={llmConfig.systemPrompt}
              onChange={e => setLLMConfig({ systemPrompt: e.target.value })}
              rows={8}
              className="font-mono text-xs"
              placeholder="System prompt for the content creation agent..."
            />
            <p className="mt-2 text-[10px] text-nexus-text-secondary">
              Used when no personality is assigned. Personalities override this prompt.
            </p>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Post Template</CardTitle>
            </CardHeader>
            <TextArea
              value={llmConfig.postTemplate}
              onChange={e => setLLMConfig({ postTemplate: e.target.value })}
              rows={6}
              className="font-mono text-xs"
              placeholder="Template with {{summary}}, {{hashtags}}, etc."
            />
            <div className="mt-2 text-[10px] text-nexus-text-secondary">
              Available variables: {'{{summary}}'}, {'{{title}}'}, {'{{url}}'}, {'{{hashtags}}'}, {'{{source}}'}
            </div>
          </Card>
        </div>
      </div>

      <Modal open={showNewPersonality} onClose={() => setShowNewPersonality(false)} title="New Personality">
        <PersonalityEditor
          onSave={async (data) => {
            await createPersonality(data)
            setShowNewPersonality(false)
          }}
          onCancel={() => setShowNewPersonality(false)}
        />
      </Modal>

      <Modal open={!!editingPersonality} onClose={() => setEditingPersonality(null)} title="Edit Personality">
        {editingPersonality && (
          <PersonalityEditor
            personality={editingPersonality}
            onSave={async (data) => {
              await updatePersonality(editingPersonality.id, data)
              setEditingPersonality(null)
            }}
            onCancel={() => setEditingPersonality(null)}
          />
        )}
      </Modal>

      <Modal open={!!deleteError} onClose={() => setDeleteError(null)} title="Cannot Delete">
        <div className="space-y-4">
          <p className="text-sm text-red-400">{deleteError}</p>
          <Button size="sm" onClick={() => setDeleteError(null)}>Got it</Button>
        </div>
      </Modal>
    </div>
  )
}
