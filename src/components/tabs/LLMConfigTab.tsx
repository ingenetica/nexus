import React, { useEffect } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'
import { Button } from '../ui/Button'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import { Input, TextArea, Select } from '../ui/Input'
import { Badge } from '../ui/Badge'

export const LLMConfigTab: React.FC = () => {
  const {
    llmConfig, dirty, loadLLMConfig, setLLMConfig, saveLLMConfig,
    linkedInConfig, linkedInDirty, loadLinkedInConfig, setLinkedInConfig, saveLinkedInConfig,
  } = useSettingsStore()

  useEffect(() => {
    loadLLMConfig()
    loadLinkedInConfig()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-nexus-text-primary">LLM Configuration</h1>
          <p className="text-sm text-nexus-text-secondary mt-1">Configure AI agents and content generation parameters</p>
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
              <Select
                label="Tone"
                value={llmConfig.tone}
                onChange={e => setLLMConfig({ tone: e.target.value })}
                options={[
                  { value: 'professional', label: 'Professional' },
                  { value: 'casual', label: 'Casual' },
                  { value: 'technical', label: 'Technical' },
                  { value: 'enthusiastic', label: 'Enthusiastic' },
                  { value: 'thought-leader', label: 'Thought Leader' },
                ]}
              />
              <Select
                label="Length"
                value={llmConfig.length}
                onChange={e => setLLMConfig({ length: e.target.value })}
                options={[
                  { value: 'short', label: 'Short (< 500 chars)' },
                  { value: 'medium', label: 'Medium (500-1500 chars)' },
                  { value: 'long', label: 'Long (1500-3000 chars)' },
                ]}
              />
              <Select
                label="Style"
                value={llmConfig.style}
                onChange={e => setLLMConfig({ style: e.target.value })}
                options={[
                  { value: 'informative', label: 'Informative' },
                  { value: 'opinion', label: 'Opinion/Commentary' },
                  { value: 'question', label: 'Question/Discussion' },
                  { value: 'listicle', label: 'Listicle/Tips' },
                ]}
              />
              <Select
                label="Language"
                value={llmConfig.language}
                onChange={e => setLLMConfig({ language: e.target.value })}
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'es', label: 'Spanish' },
                  { value: 'fr', label: 'French' },
                  { value: 'de', label: 'German' },
                  { value: 'pt', label: 'Portuguese' },
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
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Prompt</CardTitle>
            </CardHeader>
            <TextArea
              value={llmConfig.systemPrompt}
              onChange={e => setLLMConfig({ systemPrompt: e.target.value })}
              rows={10}
              className="font-mono text-xs"
              placeholder="System prompt for the content creation agent..."
            />
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
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <div className="bg-nexus-bg rounded-lg p-3 border border-nexus-border">
              <p className="text-sm text-nexus-text-primary whitespace-pre-wrap">
                {llmConfig.postTemplate
                  .replace('{{summary}}', 'AI continues to transform how we work. New breakthroughs in reasoning models suggest that AI agents will become commonplace in software development by 2026.')
                  .replace('{{title}}', 'The Future of AI Agents')
                  .replace('{{url}}', 'https://example.com/article')
                  .replace('{{hashtags}}', '#AI #Technology #Innovation #FutureOfWork #Agents')
                  .replace('{{source}}', 'TechCrunch')}
              </p>
            </div>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>LinkedIn Credentials</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <p className="text-xs text-nexus-text-secondary">
                Configure your LinkedIn OAuth app credentials. Create an app at the LinkedIn Developer Portal.
              </p>
              <Input
                label="Client ID"
                value={linkedInConfig.clientId}
                onChange={e => setLinkedInConfig({ clientId: e.target.value })}
                placeholder="Enter LinkedIn Client ID"
              />
              <Input
                label="Client Secret"
                type="password"
                value={linkedInConfig.clientSecret}
                onChange={e => setLinkedInConfig({ clientSecret: e.target.value })}
                placeholder="Enter LinkedIn Client Secret"
              />
              <div className="flex items-center gap-2">
                {linkedInDirty && <Badge variant="warning">Unsaved</Badge>}
                <Button size="sm" onClick={saveLinkedInConfig} disabled={!linkedInDirty}>
                  Save Credentials
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
