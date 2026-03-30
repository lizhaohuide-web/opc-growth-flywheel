'use client'
import { useState } from 'react'

interface AutoFormatProps {
  content: string
  onFormatted: (formatted: string) => void
}

export default function AutoFormat({ content, onFormatted }: AutoFormatProps) {
  const [formatting, setFormatting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFormat = async () => {
    if (!content) {
      setError('没有内容需要排版')
      return
    }

    setFormatting(true)
    setError(null)
    
    try {
      console.log('开始自动排版，内容长度:', content.length)
      
      const response = await fetch('/api/notes/auto-format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      console.log('排版响应状态:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('排版结果:', data)
      
      if (data.formatted) {
        onFormatted(data.formatted)
      } else if (data.error) {
        setError(data.error)
      }
    } catch (error) {
      console.error('自动排版失败:', error)
      setError(`排版失败：${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setFormatting(false)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleFormat}
        disabled={formatting || !content}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        style={{ 
          background: 'var(--bg-elevated)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {formatting ? (
          <>
            <span className="animate-spin">⚙️</span>
            <span>排版中...</span>
          </>
        ) : (
          <>
            <span>✨</span>
            <span>自动排版</span>
          </>
        )}
      </button>
      
      {error && (
        <div className="absolute top-full right-0 mt-2 px-3 py-2 rounded-lg text-xs bg-red-500 text-white z-50">
          {error}
        </div>
      )}
    </div>
  )
}
