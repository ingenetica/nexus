import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { TextArea } from '../ui/Input'

interface PostComposerProps {
  initialContent?: string
  initialHashtags?: string
  onSave: (content: string, hashtags: string) => void
  onCancel?: () => void
}

export const PostComposer: React.FC<PostComposerProps> = ({ initialContent = '', initialHashtags = '', onSave, onCancel }) => {
  const [content, setContent] = useState(initialContent)
  const [hashtags, setHashtags] = useState(initialHashtags)
  const charLimit = 3000
  const remaining = charLimit - content.length

  return (
    <div className="space-y-3">
      <TextArea
        label="Post Content"
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={8}
        placeholder="Write your post content..."
      />
      <div className="flex items-center justify-between">
        <span className={`text-xs ${remaining < 100 ? 'text-red-400' : 'text-nexus-text-secondary'}`}>
          {remaining} characters remaining
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
        <Button onClick={() => onSave(content, hashtags)} disabled={!content.trim()}>
          Save Draft
        </Button>
      </div>
    </div>
  )
}
