'use client'

import { useState } from 'react'

interface VersionPreviewProps {
  title?: string
  content: string
  platform?: string
  version?: number
  isEditing?: boolean
  onEdit?: (content: string) => void
  onSave?: () => void
  showActions?: boolean
}

export default function VersionPreview({
  title,
  content,
  platform,
  version,
  isEditing = false,
  onEdit,
  onSave,
  showActions = true,
}: VersionPreviewProps) {
  const [editContent, setEditContent] = useState(content)
  const [isEditMode, setIsEditMode] = useState(isEditing)

  const handleSave = () => {
    onEdit?.(editContent)
    setIsEditMode(false)
    onSave?.()
  }

  const platformIcons: Record<string, string> = {
    wechat: '📝',
    xiaohongshu: '📕',
    moments: '💬',
    'short-video': '🎬',
    podcast: '🎙️',
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-primary)',
        }}
      >
        <div className="flex items-center gap-2">
          {platform && <span className="text-lg">{platformIcons[platform] || '📄'}</span>}
          <div>
            {title && <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{title}</div>}
            {version && (
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                版本 {version}
              </div>
            )}
          </div>
        </div>
        
        {showActions && (
          <div className="flex items-center gap-2">
            {isEditMode ? (
              <>
                <button
                  onClick={() => setIsEditMode(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    background: 'var(--accent)',
                    color: 'var(--bg-primary)',
                  }}
                >
                  保存
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditMode(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)',
                }}
              >
                ✏️ 编辑
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {isEditMode ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full min-h-[200px] p-3 rounded-lg text-sm resize-y"
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
            }}
          />
        ) : (
          <div
            className="text-sm whitespace-pre-wrap"
            style={{
              color: 'var(--text-primary)',
              lineHeight: '1.7',
            }}
          >
            {content}
          </div>
        )}
      </div>
    </div>
  )
}
