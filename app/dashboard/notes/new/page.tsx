'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TagInput from '@/components/notes/TagInput'
import RichMarkdownEditor from '@/components/notes/RichMarkdownEditor'
import GuidedNoteForm from '@/components/notes/GuidedNoteForm'
import VoiceInput from '@/components/notes/VoiceInput'
import AutoFormat from '@/components/notes/AutoFormat'
import SmartHint from '@/components/notes/SmartHint'

export default function NewNotePage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [useGuided, setUseGuided] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      alert('请填写标题或内容')
      return
    }
    
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      alert('请先登录')
      setLoading(false)
      return
    }
    
    const { error } = await supabase
      .from('notes')
      .insert({ 
        user_id: user.id,
        title: title.trim() || '无标题笔记',
        content,
        tags
      })
    
    if (error) {
      alert(error.message)
    } else {
      // 清除生命之轮缓存，触发重新分析
      fetch('/api/reports/wheel-score', { method: 'POST' }).catch(() => {})
      router.push('/dashboard/notes')
    }
    setLoading(false)
  }
  
  if (useGuided) {
    return (
      <div className="py-8 animate-enter" style={{ background: 'var(--bg-secondary)', minHeight: '100vh' }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <button
              onClick={() => setUseGuided(false)}
              className="flex items-center gap-2"
              style={{ color: 'var(--accent)' }}
            >
              <span>←</span> 返回自由书写
            </button>
          </div>
          <GuidedNoteForm />
        </div>
      </div>
    )
  }
  
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-enter">
      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display" style={{ color: 'var(--text-primary)' }}>新建笔记</h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>记录今天的思考和成长</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setUseGuided(true)}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--border-accent)' }}
          >
            🎯 引导式模板
          </button>
          <Link
            href="/dashboard/notes"
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
          >
            取消
          </Link>
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-primary px-6 py-2"
          >
            {loading ? '保存中...' : '保存笔记'}
          </button>
        </div>
      </div>
      
      {/* 主要内容区 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左侧：编辑区 */}
        <div className="lg:col-span-3 space-y-6">
          {/* 标题输入 */}
          <div className="card p-6">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 text-lg rounded-lg focus:outline-none transition-colors"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
              placeholder="给笔记一个标题..."
              onFocus={e => (e.target as HTMLElement).style.borderColor = 'var(--border-accent)'}
              onBlur={e => (e.target as HTMLElement).style.borderColor = 'var(--border-subtle)'}
            />
          </div>
          
          {/* 标签输入 */}
          <div className="card p-6">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              标签
            </label>
            <TagInput tags={tags} onChange={setTags} />
            <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
              💡 按回车添加标签，例如：#成长 #学习 #工作复盘
            </p>
          </div>
          
          {/* Markdown 编辑器 */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                内容
              </label>
              <div className="flex items-center gap-2">
                <VoiceInput
                  onTranscript={(text) => setContent(content + (content ? '\n\n' : '') + text)}
                />
                <AutoFormat
                  content={content}
                  onFormatted={setContent}
                />
              </div>
            </div>
            <RichMarkdownEditor 
              value={content} 
              onChange={setContent}
              placeholder="使用 Markdown 记录你的思考，支持语音输入..."
            />
          </div>
        </div>
        
        {/* 右侧：工具栏 */}
        <div className="space-y-4">
          {/* 快速操作 */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>快速操作</h3>
            <div className="space-y-3">
              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full btn-primary py-2.5"
              >
                💾 保存笔记
              </button>
              <button
                onClick={() => setContent('')}
                className="w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
              >
                🗑️ 清空内容
              </button>
            </div>
          </div>
          
          {/* 引导式模板 */}
          <div
            className="rounded-xl p-6"
            style={{ background: 'var(--accent-subtle)', border: '1px solid var(--border-accent)' }}
          >
            <h3 className="font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <span>🎯</span> 引导式模板
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              使用专业模板，让记录更有条理
            </p>
            <button
              onClick={() => setUseGuided(true)}
              className="w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors"
              style={{ background: 'var(--bg-card)', color: 'var(--accent)', border: '1px solid var(--border-accent)' }}
            >
              选择模板
            </button>
            <div className="mt-4 space-y-2">
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>• KPT 工作复盘</div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>• CORNELL 学习笔记</div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>• ORID 焦点讨论</div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>• 每日感恩</div>
            </div>
          </div>
          
          {/* AI 智能提示 */}
          <div className="card p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <span>💡</span> AI 智能提示
            </h3>
            <SmartHint content={content} mode="free" />
          </div>
          
          {/* Markdown 语法提示 */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <span>📝</span> Markdown 语法
            </h3>
            <div className="space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <div className="flex items-center justify-between">
                <span># 标题</span>
                <code
                  className="px-2 py-1 rounded"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                >H1</code>
              </div>
              <div className="flex items-center justify-between">
                <span>**粗体**</span>
                <code
                  className="px-2 py-1 rounded"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                >bold</code>
              </div>
              <div className="flex items-center justify-between">
                <span>- 列表</span>
                <code
                  className="px-2 py-1 rounded"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                >list</code>
              </div>
              <div className="flex items-center justify-between">
                <span>[链接](url)</span>
                <code
                  className="px-2 py-1 rounded"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                >link</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
