'use client'
import { useState } from 'react'

interface Props {
  tags: string[]
  onChange: (tags: string[]) => void
}

export default function TagInput({ tags, onChange }: Props) {
  const [input, setInput] = useState('')
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      if (!tags.includes(input.trim())) {
        onChange([...tags, input.trim()])
      }
      setInput('')
    }
  }
  
  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove))
  }
  
  return (
    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
        标签（按回车添加）
      </label>
      
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="font-bold"
              style={{ color: 'var(--accent)' }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full px-3 py-2 rounded-md focus:outline-none transition-colors"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
        placeholder="输入标签后按回车..."
        onFocus={e => (e.target as HTMLElement).style.borderColor = 'var(--border-accent)'}
        onBlur={e => (e.target as HTMLElement).style.borderColor = 'var(--border-subtle)'}
      />
    </div>
  )
}
