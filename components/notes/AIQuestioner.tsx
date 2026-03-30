'use client'
import { useState, useEffect } from 'react'

interface AIQuestionerProps {
  templateName: string
  fieldName: string
  userAnswer: string
  previousAnswers?: Record<string, string>
  onQuestionGenerated?: (question: string) => void
}

export default function AIQuestioner({
  templateName,
  fieldName,
  userAnswer,
  previousAnswers = {},
  onQuestionGenerated,
}: AIQuestionerProps) {
  const [question, setQuestion] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [hasAsked, setHasAsked] = useState(false)

  // 当用户答案变化且长度足够时，触发 AI 追问
  useEffect(() => {
    // 答案长度超过 20 字才触发
    if (userAnswer.length < 20) {
      setQuestion('')
      return
    }

    // 避免重复触发
    if (hasAsked) {
      return
    }

    // 延迟 1 秒触发，避免用户还在输入时就请求
    const timer = setTimeout(() => {
      fetchQuestion()
    }, 1000)

    return () => clearTimeout(timer)
  }, [userAnswer])

  const fetchQuestion = async () => {
    if (loading) return

    setLoading(true)
    try {
      const response = await fetch('/api/notes/ai-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateName,
          fieldName,
          userAnswer,
          previousAnswers,
        }),
      })

      const data = await response.json()
      
      if (data.question) {
        setQuestion(data.question)
        setHasAsked(true)
        onQuestionGenerated?.(data.question)
      }
    } catch (error) {
      console.error('AI 追问获取失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!question && !loading) {
    return null
  }

  return (
    <div className="mt-3 p-3 rounded-lg border animate-enter"
      style={{ 
        background: 'var(--accent-subtle)',
        borderColor: 'var(--border-accent)',
      }}
    >
      <div className="flex items-start gap-2">
        <span className="text-lg">💡</span>
        <div className="flex-1">
          {loading ? (
            <div className="text-sm animate-pulse" style={{ color: 'var(--text-secondary)' }}>
              AI 思考中...
            </div>
          ) : (
            <>
              <div className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                深度追问：
              </div>
              <div className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                {expanded || question.length < 50 ? (
                  question.split('\n').map((q, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-xs opacity-50 mt-1">•</span>
                      <span>{q}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-start gap-2">
                    <span className="text-xs opacity-50 mt-1">•</span>
                    <span>{question}</span>
                  </div>
                )}
              </div>
              
              {question.length > 50 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-xs mt-2 font-medium"
                  style={{ color: 'var(--accent)' }}
                >
                  {expanded ? '收起' : '展开更多'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
