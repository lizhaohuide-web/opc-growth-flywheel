import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import DeleteNoteButton from '@/components/notes/DeleteNoteButton'
import AISummaryButton from '@/components/notes/AISummaryButton'
import FavoriteButton from '@/components/notes/FavoriteButton'
import LongContentRenderer from '@/components/notes/LongContentRenderer'
import AIAssistantWrapper from '@/components/notes/AIAssistantWrapper'
import NoteQualityFeedback from './NoteQualityFeedback'

export default async function NotePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) return null
  
  const { data: note } = await supabase
    .from('notes')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .single()
  
  if (!note) notFound()
  
  const isLongContent = (note.content?.length || 0) > 800
  const previewContent = isLongContent ? note.content?.substring(0, 800) + '...' : note.content
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-enter">
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between mb-8">
        <Link 
          href="/dashboard/notes" 
          className="flex items-center gap-2 font-medium transition-colors"
          style={{ color: 'var(--accent)' }}
        >
          <span>←</span> 返回
        </Link>
        
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/ai-studio?noteId=${note.id}`}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
          >
            <span>◈</span> <span className="hidden sm:inline">AI 改写</span>
          </Link>
          <Link
            href={`/dashboard/notes/${note.id}/edit`}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
          >
            <span>✏️</span> <span className="hidden sm:inline">编辑</span>
          </Link>
          <FavoriteButton noteId={note.id} />
          <DeleteNoteButton noteId={note.id} />
        </div>
      </div>
      
      {/* 笔记卡片 */}
      <div className="card overflow-hidden mb-6">
        {/* 笔记头部 */}
        <div className="p-8 pb-6">
          <h1 className="text-3xl font-display mb-4" style={{ color: 'var(--text-primary)' }}>
            {note.title || '无标题'}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <span className="flex items-center gap-1.5">
              <span className="text-base">📅</span>
              {new Date(note.created_at).toLocaleDateString('zh-CN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-base">🕐</span>
              {new Date(note.created_at).toLocaleTimeString('zh-CN', { 
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            {note.tags && note.tags.length > 0 && (
              <div className="flex gap-2">
                {note.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* 笔记正文 */}
        <div className="px-8 pb-8">
          <LongContentRenderer 
            previewContent={previewContent} 
            fullContent={note.content || ''} 
            isLong={isLongContent} 
          />
        </div>
      </div>
      
      {/* 智能摘要 */}
      <div className="mb-6">
        <AISummaryButton 
          noteId={note.id} 
          noteContent={note.content} 
          existingSummary={note.ai_summary} 
        />
      </div>
      
      <AIAssistantWrapper noteId={note.id} noteContent={note.content || ''} noteTitle={note.title || ''} />
      
      {/* 质量反馈 */}
      <NoteQualityFeedback
        noteId={note.id}
        title={note.title || '无标题'}
        content={note.content || ''}
      />
    </div>
  )
}
