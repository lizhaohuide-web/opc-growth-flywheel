'use client'
import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const platforms = [
  { id: 'wechat', name: '公众号文章', icon: '📱', desc: '1500-2000 字深度文章' },
  { id: 'xiaohongshu', name: '小红书文案', icon: '📕', desc: '300-500 字种草文案' },
  { id: 'short_video', name: '短视频口播', icon: '🎬', desc: '60-90 秒口播文案' },
  { id: 'weibo', name: '微博线程', icon: '🐦', desc: '5-10 条系列推文' },
  { id: 'podcast', name: '播客脚本', icon: '🎙️', desc: '10-15 分钟对话脚本' },
]

export default function GeneratePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [platform, setPlatform] = useState(searchParams.get('platform') || 'wechat')
  const [useCustomPrompt, setUseCustomPrompt] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [noteTitle, setNoteTitle] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const supabase = createClient()
  
  useEffect(() => {
    const fetchNote = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setError('请先登录'); return }
        
        const { data: note, error } = await supabase
          .from('notes')
          .select('title, content')
          .eq('id', params.id)
          .eq('user_id', user.id)
          .single()
        
        if (error) throw error
        if (!note) { setError('笔记不存在'); return }
        
        setNoteTitle(note.title || '无标题')
        setNoteContent(note.content || '')
      } catch (err) {
        console.error('Failed to fetch note:', err)
        setError('无法加载笔记内容')
      } finally {
        setFetching(false)
      }
    }
    fetchNote()
  }, [])
  
  const handleGenerate = async () => {
    if (!noteContent.trim()) {
      setError('笔记内容为空，无法生成')
      return
    }
    
    setLoading(true)
    setError('')
    setResult('')
    
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: noteContent,
          title: noteTitle,
          platform,
          customPrompt: useCustomPrompt ? customPrompt : undefined
        })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '生成失败')
      setResult(data.result || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请重试')
    } finally {
      setLoading(false)
    }
  }
  
  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(result)
    alert('已复制到剪贴板')
  }
  
  if (fetching) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 mx-auto" style={{ borderBottom: '2px solid var(--accent)' }}></div>
          <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>加载笔记内容...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto px-4 py-8 animate-enter">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display" style={{ color: 'var(--text-primary)' }}>生成内容</h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>基于笔记：{noteTitle}</p>
        </div>
        <Link href={`/dashboard/notes/${params.id}`}
          className="flex items-center gap-2"
          style={{ color: 'var(--accent)' }}>
          <span>←</span> 返回笔记
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左侧：设置 */}
        <div className="card p-6 space-y-6">
          <div>
            <h2 className="text-lg font-display mb-4" style={{ color: 'var(--text-primary)' }}>选择平台</h2>
            <div className="space-y-2">
              {platforms.map(p => (
                <label
                  key={p.id}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                  style={{
                    background: platform === p.id ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                    border: platform === p.id ? '1px solid var(--border-accent)' : '1px solid var(--border-subtle)',
                  }}
                >
                  <input
                    type="radio"
                    name="platform"
                    value={p.id}
                    checked={platform === p.id}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-4 h-4"
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <div className="flex-1">
                    <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{p.icon} {p.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{p.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          
          <div className="pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-2 mb-3">
              <input 
                type="checkbox" 
                id="customPrompt" 
                checked={useCustomPrompt} 
                onChange={(e) => setUseCustomPrompt(e.target.checked)}
                className="w-4 h-4"
                style={{ accentColor: 'var(--accent)' }}
              />
              <label htmlFor="customPrompt" className="font-medium cursor-pointer" style={{ color: 'var(--text-primary)' }}>
                自定义提示词
              </label>
            </div>
            {useCustomPrompt && (
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="输入你的改写要求..."
                className="w-full px-3 py-2 rounded-lg focus:outline-none"
                rows={4}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
                onFocus={e => (e.target as HTMLElement).style.borderColor = 'var(--border-accent)'}
                onBlur={e => (e.target as HTMLElement).style.borderColor = 'var(--border-subtle)'}
              />
            )}
          </div>
          
          <button
            onClick={handleGenerate}
            disabled={loading || !noteContent}
            className="w-full btn-primary py-3 disabled:opacity-50"
          >
            {loading ? '生成中...' : '开始生成'}
          </button>
        </div>
        
        {/* 右侧：结果 */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-display" style={{ color: 'var(--text-primary)' }}>生成结果</h2>
            {result && (
              <button onClick={handleCopy} className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                📋 复制
              </button>
            )}
          </div>
          
          {error && (
            <div className="p-4 rounded-lg mb-4" style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--error)' }}>
              <p className="font-medium">❌ {error}</p>
            </div>
          )}
          
          {loading && (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 mx-auto mb-4" style={{ borderBottom: '2px solid var(--accent)' }}></div>
              <p style={{ color: 'var(--text-secondary)' }}>AI 正在创作中...</p>
              <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>通常需要 10-30 秒</p>
            </div>
          )}
          
          {result && (
            <div
              className="whitespace-pre-wrap text-sm p-4 rounded-lg max-h-96 overflow-y-auto"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {result}
            </div>
          )}
          
          {!result && !loading && !error && (
            <div className="text-center py-16" style={{ color: 'var(--text-secondary)' }}>
              <div className="text-6xl mb-4">✨</div>
              <p>选择平台后点击&#34;开始生成&#34;</p>
              {useCustomPrompt && <p className="text-sm mt-2">将使用自定义提示词进行改写</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
