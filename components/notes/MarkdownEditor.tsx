'use client'
import { marked } from 'marked'

interface Props {
  value: string
  onChange: (value: string) => void
}

export default function MarkdownEditor({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 h-full min-h-[400px]">
      <div className="flex flex-col">
        <label className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>编辑</label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 w-full px-3 py-2 rounded-md focus:outline-none font-mono text-sm transition-colors"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
          placeholder="使用 Markdown 语法..."
          onFocus={e => (e.target as HTMLElement).style.borderColor = 'var(--border-accent)'}
          onBlur={e => (e.target as HTMLElement).style.borderColor = 'var(--border-subtle)'}
        />
      </div>
      
      <div className="flex flex-col">
        <label className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>预览</label>
        <div
          className="flex-1 w-full rounded-md p-4 overflow-auto max-w-none"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
          dangerouslySetInnerHTML={{ __html: marked(value) }}
        />
      </div>
    </div>
  )
}
