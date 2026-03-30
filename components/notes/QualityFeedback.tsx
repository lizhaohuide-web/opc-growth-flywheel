'use client'
import { useState, useEffect } from 'react'

interface QualityFeedbackProps {
  noteId: string
  title: string
  content: string
  templateName?: string
  trigger?: number // 用于外部触发刷新
  onFeedbackComplete?: (feedback: any) => void
}

interface FeedbackScores {
  structure: number
  depth: number
  examples: number
}

export default function QualityFeedback({
  noteId,
  title,
  content,
  templateName,
  trigger,
  onFeedbackComplete,
}: QualityFeedbackProps) {
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{
    scores: FeedbackScores
    suggestions: string[]
  } | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (trigger) {
      fetchFeedback()
    }
  }, [trigger])

  const fetchFeedback = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/notes/${noteId}/quality-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          templateName,
        }),
      })

      const data = await response.json()
      setFeedback(data)
      
      // 回调通知缓存
      if (onFeedbackComplete) {
        onFeedbackComplete(data)
      }
    } catch (error) {
      console.error('质量反馈获取失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 8) return '优秀'
    if (score >= 6) return '良好'
    return '待改进'
  }

  if (!feedback && !loading) {
    return null
  }

  return (
    <div 
      className="mt-6 p-4 rounded-lg border animate-enter"
      style={{ 
        background: 'var(--bg-elevated)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <span>📊</span> 笔记质量反馈
        </h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm"
          style={{ color: 'var(--accent)' }}
        >
          {expanded ? '收起' : '展开'}
        </button>
      </div>

      {loading ? (
        <div className="text-sm animate-pulse" style={{ color: 'var(--text-secondary)' }}>
          AI 评审中...
        </div>
      ) : feedback ? (
        <div className="space-y-4">
          {/* 评分 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>结构清晰</div>
              <div className={`text-2xl font-bold ${getScoreColor(feedback.scores.structure)}`}>
                {feedback.scores.structure}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {getScoreLabel(feedback.scores.structure)}
              </div>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>观点深度</div>
              <div className={`text-2xl font-bold ${getScoreColor(feedback.scores.depth)}`}>
                {feedback.scores.depth}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {getScoreLabel(feedback.scores.depth)}
              </div>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>案例支撑</div>
              <div className={`text-2xl font-bold ${getScoreColor(feedback.scores.examples)}`}>
                {feedback.scores.examples}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {getScoreLabel(feedback.scores.examples)}
              </div>
            </div>
          </div>

          {/* 建议 */}
          {(expanded || feedback.suggestions.length <= 2) && feedback.suggestions.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <span>💡</span> 改进建议
              </div>
              <ul className="space-y-1">
                {feedback.suggestions.map((suggestion, i) => (
                  <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <span className="text-xs opacity-50 mt-1">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 平均分 */}
          <div className="pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center justify-between">
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                综合评分
              </div>
              <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {Math.round((feedback.scores.structure + feedback.scores.depth + feedback.scores.examples) / 3)}/10
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
