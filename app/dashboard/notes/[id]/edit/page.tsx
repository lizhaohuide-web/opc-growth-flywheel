'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import TagInput from '@/components/notes/TagInput'
import RichMarkdownEditor from '@/components/notes/RichMarkdownEditor'

export default function EditNotePage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  
  // 处理图片上传
  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '上传失败')
    }
    
    const data = await response.json()
    return data.url
  }

  useEffect(() => {
    const fetchNote = async () => {
      const { data } = await supabase
        .from('notes')
        .select('*')
        .eq('id', params.id)
        .single()
      
      if (data) {
        setTitle(data.title)
        setContent(data.content)
        setTags(data.tags || [])
      }
      setLoading(false)
    }
    fetchNote()
  }, [params.id, supabase])
  
  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('notes')
      .update({ 
        title, 
        content, 
        tags,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
    
    if (error) {
      alert(error.message)
    } else {
      // 清除生命之轮缓存，触发重新分析
      fetch('/api/reports/wheel-score', { method: 'POST' }).catch(() => {})
      // 跳转到笔记详情页（质量反馈在详情页显示）
      router.push(`/dashboard/notes/${params.id}`)
    }
    setSaving(false)
  }
  
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10" style={{ borderBottom: '2px solid var(--accent)' }}></div>
    </div>
  )
  
  return (
    <div className="container mx-auto px-4 py-8 animate-enter">
      <h1 className="text-3xl font-display mb-8" style={{ color: 'var(--text-primary)' }}>编辑笔记</h1>
      
      <div className="card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-md transition-colors"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
            onFocus={e => (e.target as HTMLElement).style.borderColor = 'var(--border-accent)'}
            onBlur={e => (e.target as HTMLElement).style.borderColor = 'var(--border-subtle)'}
          />
        </div>
        
        <TagInput tags={tags} onChange={setTags} />
        
        <RichMarkdownEditor 
          value={content} 
          onChange={setContent}
          placeholder="使用 Markdown 记录你的思考..."
        />
        
        <div className="flex gap-4">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? '保存中...' : '保存'}
          </button>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  )
}
