'use client'
import { useState, useEffect, useCallback } from 'react'

interface SmartHintProps {
  content: string
  mode?: 'free' | 'guided'
  onChange?: (newContent: string) => void
}

export default function SmartHint({
  content,
  mode = 'free',
  onChange,
}: SmartHintProps) {
  const [hint, setHint] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [enabled, setEnabled] = useState(() => {
    // 从 localStorage 读取用户偏好
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smart-hint-enabled')
      return saved !== 'false' // 默认开启
    }
    return true
  })
  const [dismissedForSession, setDismissedForSession] = useState(false)

  // 保存用户偏好
  useEffect(() => {
    localStorage.setItem('smart-hint-enabled', String(enabled))
  }, [enabled])

  // 检测内容变化，生成提示
  useEffect(() => {
    if (!enabled || !content || content.length < 30) {
      setHint(null)
      return
    }

    // 本次会话已关闭，不再显示
    if (dismissedForSession) {
      return
    }

    // 延迟 3 秒触发，避免频繁请求
    const timer = setTimeout(() => {
      fetchHint()
    }, 3000)

    return () => clearTimeout(timer)
  }, [content, enabled, dismissedForSession])

  const fetchHint = async () => {
    if (loading) return

    setLoading(true)
    try {
      const response = await fetch('/api/notes/smart-hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          mode,
        }),
      })

      const data = await response.json()
      
      if (data.hint) {
        setHint(data.hint)
      }
    } catch (error) {
      console.error('智能提示获取失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = useCallback(() => {
    setDismissedForSession(true)
    setHint(null)
  }, [])

  const handleDisable = useCallback(() => {
    setEnabled(false)
    setHint(null)
  }, [])

  const handleApply = useCallback(() => {
    // 智能提示不提供一键应用，仅作为启发
    setDismissedForSession(true)
    setHint(null)
  }, [])

  if (!enabled && !hint) {
    return (
      <div className="mt-2 text-xs text-right">
        <button
          onClick={() => setEnabled(true)}
          className="text-[var(--accent)] hover:underline"
        >
          💡 开启智能提示
        </button>
      </div>
    )
  }

  if (!hint && !loading) {
    return (
      <div className="mt-2 text-xs text-right">
        <button
          onClick={handleDisable}
          className="text-[var(--text-tertiary)] hover:underline"
        >
          关闭智能提示
        </button>
      </div>
    )
  }

  return (
    <div className="mt-2">
      {loading ? (
        <div className="text-sm animate-pulse" style={{ color: 'var(--text-secondary)' }}>
          AI 分析中...
        </div>
      ) : (
        hint && (
          <div className="space-y-2">
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {hint}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleApply}
                className="text-xs font-medium"
                style={{ color: 'var(--accent)' }}
              >
                知道了
              </button>
              <button
                onClick={handleDismiss}
                className="text-xs"
                style={{ color: 'var(--text-tertiary)' }}
              >
                本次忽略
              </button>
              <button
                onClick={handleDisable}
                className="text-xs"
                style={{ color: 'var(--text-tertiary)' }}
              >
                关闭功能
              </button>
            </div>
          </div>
        )
      )}
    </div>
  )
}
