'use client'
import { useState, useRef, useEffect } from 'react'

interface Props {
  noteId: string
  noteContent: string
  existingSummary?: string | null
  showDescription?: boolean
  compact?: boolean
}

function parseSummaryModules(summary: string) {
  const modules = [
    { id: 'insight', icon: '💡', title: '核心洞察', content: '' },
    { id: 'graph', icon: '🔗', title: '知识图谱', content: '' },
    { id: 'model', icon: '🧠', title: '思维模型', content: '' },
    { id: 'action', icon: '✅', title: '行动清单', content: '' },
    { id: 'question', icon: '❓', title: '延伸思考', content: '' },
  ]
  const sections = summary.split(/(?=💡|🔗|🧠|✅|❓)/)
  sections.forEach(section => {
    const trimmed = section.trim()
    if (trimmed.startsWith('💡')) modules[0].content = trimmed.replace(/^💡\s*\*?\*?核心洞察\*?\*?\s*/, '').trim()
    else if (trimmed.startsWith('🔗')) modules[1].content = trimmed.replace(/^🔗\s*\*?\*?知识图谱\*?\*?\s*/, '').trim()
    else if (trimmed.startsWith('🧠')) modules[2].content = trimmed.replace(/^🧠\s*\*?\*?思维模型\*?\*?\s*/, '').trim()
    else if (trimmed.startsWith('✅')) modules[3].content = trimmed.replace(/^✅\s*\*?\*?行动清单\*?\*?\s*/, '').trim()
    else if (trimmed.startsWith('❓')) modules[4].content = trimmed.replace(/^❓\s*\*?\*?延伸思考\*?\*?\s*/, '').trim()
  })
  return modules.filter(m => m.content)
}

export default function AISummaryButton({ noteId, noteContent, existingSummary, showDescription, compact }: Props) {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [summary, setSummary] = useState(existingSummary || '')
  const [showResult, setShowResult] = useState(!!existingSummary)
  const [error, setError] = useState('')
  const [showFullSummary, setShowFullSummary] = useState(false)
  const [hoveredModule, setHoveredModule] = useState<string | null>(null)

  const modules = summary ? parseSummaryModules(summary) : []

  const handleGenerateSummary = async () => {
    setLoading(true)
    setProgress(10)
    setError('')
    setSummary('')
    setShowResult(false)
    try {
      setProgress(30)
      const response = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteContent.substring(0, 3000), noteId })
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '摘要生成失败')
      }
      const result = await response.json()
      setSummary(result.summary)
      setProgress(100)
      setShowResult(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请重试')
    } finally {
      setLoading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  if (compact) {
    return (
      <button
        onClick={handleGenerateSummary}
        disabled={loading}
        className="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
        title="智能摘要"
      >
        <span className="text-xl">🧠</span>
      </button>
    )
  }

  if (!showResult && !loading) {
    return (
      <div>
        <button
          onClick={handleGenerateSummary}
          className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            color: '#fff',
          }}
        >
          🧠 生成智能摘要
        </button>
        {error && (
          <div className="mt-3 p-3 rounded-xl text-sm" style={{ background: 'rgba(248,113,113,0.15)', color: 'var(--error)' }}>
            ❌ {error}
            <button onClick={handleGenerateSummary} className="ml-2 underline">重试</button>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="card p-4">
        <div className="flex items-center gap-2 text-sm mb-2" style={{ color: 'var(--accent)' }}>
          <div className="animate-pulse rounded-full h-3 w-3" style={{ background: 'var(--accent)' }}></div>
          <span>AI 正在分析...</span>
        </div>
        <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: 'var(--accent)' }}
          />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-hidden relative">
        <style jsx>{`
          @keyframes scroll-left {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-scroll {
            animation: scroll-left 20s linear infinite;
          }
          .animate-scroll:hover {
            animation-play-state: paused;
          }
        `}</style>
        <div className="animate-scroll flex gap-3 w-max">
          {[...modules, ...modules].map((mod, i) => (
            <div
              key={`${mod.id}-${i}`}
              onClick={() => setShowFullSummary(true)}
              onMouseEnter={() => setHoveredModule(mod.id)}
              onMouseLeave={() => setHoveredModule(null)}
              className="flex-shrink-0 w-40 p-3 card cursor-pointer transition-all relative group"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{mod.icon}</span>
                <h4 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{mod.title}</h4>
              </div>
              <p className="text-xs line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>{mod.content.substring(0, 50)}...</p>
              
              {hoveredModule === mod.id && i < modules.length && (
                <div
                  className="absolute left-0 top-full mt-2 z-30 w-64 p-4 card"
                  style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3)', border: '1px solid var(--border-accent)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{mod.icon}</span>
                    <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{mod.title}</h4>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {mod.content.substring(0, 200)}{mod.content.length > 200 ? '...' : ''}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showFullSummary && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowFullSummary(false)}
        >
          <div
            className="w-full sm:max-w-2xl max-h-[85vh] flex flex-col"
            style={{
              background: 'var(--bg-card)',
              borderTopLeftRadius: 'var(--radius-lg)',
              borderTopRightRadius: 'var(--radius-lg)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              className="sticky top-0 px-6 py-4 flex items-center justify-between flex-shrink-0"
              style={{
                background: 'var(--bg-card)',
                borderBottom: '1px solid var(--border-subtle)',
                borderTopLeftRadius: 'var(--radius-lg)',
                borderTopRightRadius: 'var(--radius-lg)',
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">🧠</span>
                <h3 className="text-lg font-display" style={{ color: 'var(--text-primary)' }}>智能摘要</h3>
              </div>
              <button
                onClick={() => setShowFullSummary(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {modules.map(mod => (
                <div key={mod.id} className="pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{mod.icon}</span>
                    <h4 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{mod.title}</h4>
                  </div>
                  <div className="text-sm leading-relaxed pl-8" style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{mod.content}</div>
                </div>
              ))}
            </div>
            
            <div
              className="sticky bottom-0 px-6 py-4 flex-shrink-0"
              style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-subtle)' }}
            >
              <button
                onClick={() => { setShowFullSummary(false); setShowResult(false); handleGenerateSummary() }}
                className="w-full py-3 rounded-xl font-medium text-sm transition-colors"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
              >
                🔄 重新生成摘要
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
