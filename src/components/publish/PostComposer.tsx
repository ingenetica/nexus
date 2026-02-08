import React, { useState } from 'react'
import { SocialPlatform } from '../../lib/types'
import { Button } from '../ui/Button'
import { TextArea, Select } from '../ui/Input'

interface PostComposerProps {
  initialContent?: string
  initialHashtags?: string
  platform?: SocialPlatform
  onSave: (content: string, hashtags: string, platform?: SocialPlatform) => void
  onCancel?: () => void
}

const CHAR_LIMITS: Record<SocialPlatform, number> = {
  linkedin: 3000,
  instagram: 2200,
  facebook: 63206,
}

export const PostComposer: React.FC<PostComposerProps> = ({ initialContent = '', initialHashtags = '', platform: initialPlatform, onSave, onCancel }) => {
  const [content, setContent] = useState(initialContent)
  const [hashtags, setHashtags] = useState(initialHashtags)
  const [platform, setPlatform] = useState<SocialPlatform>(initialPlatform || 'linkedin')
  const charLimit = CHAR_LIMITS[platform]
  const remaining = charLimit - content.length

  return (
    <div className="space-y-3">
      <Select
        label="Platform"
        value={platform}
        onChange={e => setPlatform(e.target.value as SocialPlatform)}
        options={[
          { value: 'linkedin', label: 'LinkedIn' },
          { value: 'instagram', label: 'Instagram' },
          { value: 'facebook', label: 'Facebook' },
        ]}
      />
      <TextArea
        label="Post Content"
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={8}
        placeholder="Write your post content..."
      />
      <div className="flex items-center justify-between">
        <span className={`text-xs ${remaining < 100 ? 'text-red-400' : 'text-nexus-text-secondary'}`}>
          {remaining} characters remaining ({platform})
        </span>
      </div>
      <TextArea
        label="Hashtags"
        value={hashtags}
        onChange={e => setHashtags(e.target.value)}
        rows={2}
        placeholder="#AI #Technology #Innovation"
      />
      <div className="flex justify-end gap-2">
        {onCancel && <Button variant="ghost" onClick={onCancel}>Cancel</Button>}
        <Button onClick={() => onSave(content, hashtags, platform)} disabled={!content.trim()}>
          Save Draft
        </Button>
      </div>
    </div>
  )
}
