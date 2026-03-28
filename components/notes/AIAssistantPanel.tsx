'use client'
import { useState, useEffect } from 'react'

interface Props {
  noteId: string
  noteContent: string
  noteTitle: string
}

const platforms = [
  { id: 'wechat', name: '公众号文章', icon: '📱', desc: '深度长文' },
  { id: 'xiaohongshu', name: '小红书', icon: '📕', desc: '种草文案' },
  { id: 'short_video', name: '短视频口播', icon: '🎬', desc: '口播文案' },
  { id: 'weibo', name: '微博', icon: '🐦', desc: '系列推文' },
  { id: 'podcast', name: '播客脚本', icon: '🎙️', desc: '播客内容' },
]

export default function AIAssistantPanel({ noteId, noteContent, noteTitle }: Props) {
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [copied, setCopied] = useState(false)
  const [results, setResults] = useState<Record<string, string>>({})
  const [activePlatform, setActivePlatform] = useState<string | null>(null)
  const [loadingCache, setLoadingCache] = useState(true)

  useEffect(() => {
    fetch(`/api/notes/${noteId}/rewrites`)
      .then(r => r.json())
      .then(data => {
        if (data.rewrites && Object.keys(data.rewrites).length > 0) {
          setResults(data.rewrites)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingCache(false))
  }, [noteId])

  const handleGenerate = async (platform: string, force = false) => {
    if (results[platform] && !force) {
      setActivePlatform(platform)
      return
    }
    setActivePlatform(platform)
    setGenerating(true)
    setGenerateError('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: noteContent,
          title: noteTitle,
          platform,
          customPrompt: platform === 'custom' ? customPrompt : undefined
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '生成失败')
      
      setResults(prev => ({ ...prev, [platform]: data.result }))
      
      fetch(`/api/notes/${noteId}/rewrites`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, content: data.result })
      }).catch(() => {})
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : '生成失败')
    } finally {
      setGenerating(false)
    }
  }

  const activeName = [...platforms, { id: 'custom', name: '自定义', icon: '✨', desc: '' }]
    .find(p => p.id === activePlatform)?.name || ''

  const completedCount = Object.keys(results).length

  return (
    <details
      className="group rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(168,85,247,0.05) 50%, rgba(236,72,153,0.05) 100%)',
        border: '1px solid rgba(99,102,241,0.2)',
      }}
      open
    >
      <summary
        className="flex items-center justify-between p-6 cursor-pointer transition-colors"
        style={{ background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <h2 className="text-lg font-display" style={{ color: 'var(--text-primary)' }}>AI 助手</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              内容改写 · 知识推荐
              {completedCount > 0 && <span className="ml-2" style={{ color: 'var(--success)' }}>（已改写 {completedCount} 个平台）</span>}
            </p>
          </div>
        </div>
        <div className="transition-transform" style={{ color: 'var(--text-tertiary)' }}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </summary>
      
      <div className="px-6 pb-6">
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>📱 一键改写为多平台内容</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {platforms.map(platform => (
            <button
              key={platform.id}
              onClick={() => handleGenerate(platform.id)}
              disabled={generating}
              className="flex items-center gap-2 p-3 rounded-xl border transition-all text-left"
              style={activePlatform === platform.id
                ? {
                    background: 'var(--accent-subtle)',
                    border: '1px solid var(--border-accent)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  }
                : {
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                  }
              }
            >
              <span className="text-xl">{platform.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{platform.name}</div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{platform.desc}</div>
              </div>
              {results[platform.id] && (
                <span className="text-xs flex-shrink-0" style={{ color: 'var(--success)' }}>✓</span>
              )}
            </button>
          ))}
        </div>
        
        <div className="mt-4">
          <button
            onClick={() => setShowCustom(!showCustom)}
            className="text-sm font-medium transition-colors"
            style={{ color: 'var(--accent)' }}
          >
            ✨ 自定义提示词改写
          </button>
          {showCustom && (
            <div className="mt-2 flex gap-2">
              <input
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                placeholder="输入自定义改写要求..."
                className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
                onFocus={e => (e.target as HTMLElement).style.borderColor = 'var(--border-accent)'}
                onBlur={e => (e.target as HTMLElement).style.borderColor = 'var(--border-subtle)'}
              />
              <button
                onClick={() => handleGenerate('custom')}
                disabled={!customPrompt || generating}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                生成
              </button>
            </div>
          )}
        </div>
        
        {generating && (
          <div className="mt-4 p-4 card flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5" style={{ borderBottom: '2px solid var(--accent)' }}></div>
            <span className="text-sm" style={{ color: 'var(--accent)' }}>AI 正在改写为{activeName}格式...</span>
          </div>
        )}
        
        {activePlatform && results[activePlatform] && !generating && (
          <div className="mt-4 p-4 card">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>✅ {activeName}内容</h4>
              <button
                onClick={() => { navigator.clipboard.writeText(results[activePlatform]); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                className="text-xs px-3 py-1 rounded-lg transition-colors"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
              >
                {copied ? '已复制 ✓' : '复制'}
              </button>
            </div>
            <div
              className="text-sm max-h-96 overflow-y-auto"
              style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}
            >
              {results[activePlatform]}
            </div>
            <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => handleGenerate(activePlatform, true)}
                className="w-full py-2.5 rounded-lg font-medium text-sm transition-colors"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
              >
                🔄 重新改写
              </button>
            </div>
          </div>
        )}
        
        {generateError && (
          <div className="mt-4 p-3 rounded-xl text-sm" style={{ background: 'rgba(248,113,113,0.15)', color: 'var(--error)' }}>
            ❌ {generateError}
          </div>
        )}
      </div>
    </details>
  )
}
