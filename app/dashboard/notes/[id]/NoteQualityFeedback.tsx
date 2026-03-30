'use client'
import QualityFeedback from '@/components/notes/QualityFeedback'
import { useState, useEffect } from 'react'

interface NoteQualityFeedbackProps {
  noteId: string
  title: string
  content: string
}

interface CachedFeedback {
  scores: {
    structure: number
    depth: number
    examples: number
  }
  suggestions: string[]
  timestamp: number
  contentHash: string
}

export default function NoteQualityFeedback({
  noteId,
  title,
  content,
}: NoteQualityFeedbackProps) {
  const [cachedFeedback, setCachedFeedback] = useState<CachedFeedback | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [trigger, setTrigger] = useState(0)

  // 页面加载时检查缓存
  useEffect(() => {
    const cacheKey = `note-feedback-${noteId}`
    const cached = localStorage.getItem(cacheKey)
    
    if (cached) {
      try {
        const feedback: CachedFeedback = JSON.parse(cached)
        // 检查内容是否变化（简单哈希）
        const currentHash = content.substring(0, 100)
        if (feedback.contentHash === currentHash) {
          // 缓存有效，直接显示
          console.log('使用缓存的质量反馈')
          setCachedFeedback(feedback)
          setShowFeedback(true)
          return
        }
      } catch (e) {
        console.error('解析缓存失败:', e)
      }
    }
    
    // 没有有效缓存，显示手动触发按钮
    console.log('无有效缓存，等待手动触发')
  }, [noteId, content])

  const handleManualTrigger = () => {
    setTrigger(prev => prev + 1)
    setShowFeedback(true)
  }

  // 缓存反馈结果
  const handleFeedbackComplete = (feedback: any) => {
    const cacheKey = `note-feedback-${noteId}`
    const cacheData: CachedFeedback = {
      scores: feedback.scores,
      suggestions: feedback.suggestions,
      timestamp: Date.now(),
      contentHash: content.substring(0, 100),
    }
    localStorage.setItem(cacheKey, JSON.stringify(cacheData))
  }

  if (!showFeedback) {
    return (
      <div className="mt-6 p-4 rounded-lg border animate-enter"
        style={{ 
          background: 'var(--bg-elevated)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
              笔记质量反馈
            </span>
          </div>
          <button
            onClick={handleManualTrigger}
            className="text-sm px-3 py-1 rounded-md"
            style={{ 
              background: 'var(--accent)',
              color: 'white',
            }}
          >
            生成评分
          </button>
        </div>
      </div>
    )
  }

  return (
    <QualityFeedback
      noteId={noteId}
      title={title}
      content={content}
      trigger={trigger}
      onFeedbackComplete={handleFeedbackComplete}
    />
  )
}
