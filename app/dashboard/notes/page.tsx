'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { getTagColor } from '@/lib/tag-colors'
import FavoriteButton from '@/components/notes/FavoriteButton'
import QualityScoreBadge from '@/components/notes/QualityScoreBadge'

async function extractKeywords(content: string): Promise<string[]> {
  const words = content
    .replace(/[^\w\s\u4e00-\u9fff]/g, '')
    .split(/\s+/)
    .filter(w => w.length >= 2 && w.length <= 6)
  
  const freq: Record<string, number> = {}
  words.forEach(w => {
    freq[w] = (freq[w] || 0) + 1
  })
  
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word)
}

export default function NotesPage() {
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [sortBy, setSortBy] = useState<'time' | 'quality'>('time')
  
  const [keyword, setKeyword] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [tag, setTag] = useState('')
  const [favOnly, setFavOnly] = useState(false)
  const [page, setPage] = useState(0)
  const pageSize = 10
  
  const supabase = createClient()
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUserId(session.user.id)
      }
    }
    getUser()
  }, [])
  
  useEffect(() => {
    const fetchNotes = async () => {
      if (!userId) return
      
      setLoading(true)
      
      let query = supabase.from('notes').select('*', { count: 'exact' })
        .eq('user_id', userId)
      
      if (sortBy === 'quality') {
        query = query.order('quality_score', { ascending: false, nullsFirst: false })
      } else {
        query = query.order('created_at', { ascending: false })
      }
      
      query = query.range(page * pageSize, (page + 1) * pageSize - 1)

      if (keyword) {
        query = query.or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%`)
      }
      if (dateFrom) {
        query = query.gte('created_at', dateFrom)
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo)
      }
      if (tag) {
        query = query.contains('tags', [tag])
      }
      if (favOnly) {
        query = query.eq('is_favorited', true)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('获取笔记失败:', error)
      } else {
        const notesWithKeywords = await Promise.all(
          (data || []).slice(0, 10).map(async note => {
            const keywords = note.tags?.length 
              ? note.tags 
              : await extractKeywords(note.content || '')
            return { ...note, keywords }
          })
        )
        
        const remainingNotes = (data || []).slice(10).map(note => ({
          ...note,
          keywords: note.tags || []
        }))
        
        setNotes([...notesWithKeywords, ...remainingNotes])
        setTotal(count || 0)
      }
      
      setLoading(false)
    }
    
    fetchNotes()
  }, [userId, keyword, dateFrom, dateTo, tag, favOnly, page, sortBy])
  
  const getAllTags = () => {
    const allTags: Set<string> = new Set()
    notes.forEach(note => {
      if (Array.isArray(note.tags)) {
        note.tags.forEach((tag: string) => allTags.add(tag))
      }
    })
    return Array.from(allTags).sort()
  }
  
  const totalPages = Math.ceil(total / pageSize)
  
  const handleRefresh = () => {
    setPage(0)
  }
  
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-enter">
      {/* 搜索筛选栏 */}
      <div className="card p-4 mb-6 sticky top-4 z-10">
        <div className="relative mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }}>🔍</span>
          <input
            type="text"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setPage(0)
            }}
            placeholder="搜索笔记标题或内容..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
            onFocus={e => (e.target as HTMLElement).style.borderColor = 'var(--border-accent)'}
            onBlur={e => (e.target as HTMLElement).style.borderColor = 'var(--border-subtle)'}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(0) }}
            className="px-3 py-1.5 rounded-lg text-xs focus:outline-none"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
          />
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>~</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(0) }}
            className="px-3 py-1.5 rounded-lg text-xs focus:outline-none"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
          />
          <select
            value={tag}
            onChange={(e) => { setTag(e.target.value); setPage(0) }}
            className="px-3 py-1.5 rounded-lg text-xs focus:outline-none appearance-none"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
          >
            <option value="">全部标签</option>
            {getAllTags().map((tagOption) => (
              <option key={tagOption} value={tagOption}>{tagOption}</option>
            ))}
          </select>
          <button
            onClick={() => { setFavOnly(!favOnly); setPage(0) }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={favOnly
              ? { background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--border-accent)' }
              : { background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }
            }
          >
            {favOnly ? '⭐ 收藏' : '☆ 收藏'}
          </button>
          
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{total} 篇</span>
            <button
              onClick={handleRefresh}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
            >
              刷新
            </button>
          </div>
        </div>
      </div>
      
      {/* 页面头部 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-display" style={{ color: 'var(--text-primary)' }}>我的笔记</h1>
          
          {/* 视图切换 */}
          <div className="flex items-center rounded-lg p-0.5" style={{ background: 'var(--bg-elevated)' }}>
            <button
              onClick={() => setViewMode('list')}
              className="p-1.5 rounded-md transition-all"
              style={viewMode === 'list'
                ? { background: 'var(--bg-card)', color: 'var(--accent)' }
                : { color: 'var(--text-tertiary)' }
              }
              title="列表视图"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className="p-1.5 rounded-md transition-all"
              style={viewMode === 'grid'
                ? { background: 'var(--bg-card)', color: 'var(--accent)' }
                : { color: 'var(--text-tertiary)' }
              }
              title="卡片视图"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            </button>
          </div>
          
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'time' | 'quality')}
            className="px-3 py-1.5 rounded-lg text-xs focus:outline-none"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
          >
            <option value="time">按时间</option>
            <option value="quality">按质量分</option>
          </select>
        </div>
        
        <Link href="/dashboard/notes/new" className="btn-primary px-5 py-2.5 text-sm">
          ✏️ 新建笔记
        </Link>
      </div>
      
      {/* 笔记列表 */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12" style={{ borderBottom: '2px solid var(--accent)' }}></div>
        </div>
      ) : notes && notes.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {notes.map(note => (
              <Link key={note.id} href={`/dashboard/notes/${note.id}`} className="card p-4 block">
                {note.quality_score != null && (
                  <div
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold mb-2"
                    style={
                      note.quality_score >= 8
                        ? { background: 'rgba(52,211,153,0.15)', color: 'var(--success)' }
                        : note.quality_score >= 5
                        ? { background: 'rgba(251,191,36,0.15)', color: 'var(--warning)' }
                        : { background: 'rgba(248,113,113,0.15)', color: 'var(--error)' }
                    }
                  >
                    {note.quality_score}分
                  </div>
                )}
                
                <h3 className="font-semibold text-sm mb-2 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                  {note.title || '无标题'}
                </h3>
                
                <p className="text-xs line-clamp-3 mb-3" style={{ color: 'var(--text-secondary)' }}>
                  {note.content?.substring(0, 100)}
                </p>
                
                <div className="flex flex-wrap gap-1 mb-2">
                  {(note.tags || []).slice(0, 3).map((tag: string) => (
                    <span key={tag} className="px-2 py-0.5 rounded text-xs"
                      style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>#{tag}</span>
                  ))}
                </div>
                
                <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  <span>{new Date(note.created_at).toLocaleDateString('zh-CN')}</span>
                  {note.is_favorited && <span>⭐</span>}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            {notes.map(note => (
              <div key={note.id} className="card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <Link href={`/dashboard/notes/${note.id}`} className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg mb-2 truncate" style={{ color: 'var(--text-primary)' }}>
                          {note.title || '无标题'}
                        </h3>
                        <p className="text-sm line-clamp-2 mb-3" style={{ color: 'var(--text-secondary)' }}>
                          {note.content?.substring(0, 150) || '无内容'}
                          {note.content && note.content.length > 150 && '...'}
                        </p>
                      </Link>
                      
                      <div className="flex-shrink-0 ml-4">
                        <QualityScoreBadge noteId={note.id} initialScore={note.quality_score} />
                      </div>
                    </div>
                    
                    {(note.keywords && note.keywords.length > 0) && (
                      <div className="flex flex-wrap gap-2">
                        {note.keywords.slice(0, 8).map((keyword: string, i: number) => (
                          <span
                            key={i}
                            className="text-xs px-3 py-1 rounded-full font-medium"
                            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--border-accent)' }}
                            title={note.tags?.includes(keyword) ? '标签' : 'AI 关键词'}
                          >
                            {note.tags?.includes(keyword) ? '#' : '🏷️'} {keyword}
                          </span>
                        ))}
                        {note.keywords.length > 8 && (
                          <span className="text-xs py-1" style={{ color: 'var(--text-tertiary)' }}>
                            +{note.keywords.length - 8}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0 text-right flex flex-col items-end gap-2">
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(note.created_at).toLocaleDateString('zh-CN', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(note.created_at).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    {note.keywords && note.keywords.length > 0 && (
                      <div className="mt-1 text-xs" style={{ color: 'var(--accent)' }}>
                        🤖 AI 已分析
                      </div>
                    )}
                    <FavoriteButton noteId={note.id} initialFavorited={!!note.is_favorited} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-display mb-2" style={{ color: 'var(--text-primary)' }}>还没有笔记</h3>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>开始记录你的第一篇笔记吧！</p>
          <Link href="/dashboard/notes/new" className="btn-primary inline-block">
            ✏️ 创建第一篇笔记
          </Link>
        </div>
      )}
      
      {/* 分页控件 */}
      {!loading && notes && notes.length > 0 && (
        <div className="mt-8 flex flex-col items-center">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(prev => Math.max(0, prev - 1))}
              disabled={page === 0}
              className="px-4 py-2 rounded-lg transition-colors"
              style={page === 0
                ? { background: 'var(--bg-elevated)', color: 'var(--text-tertiary)', cursor: 'not-allowed' }
                : { background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }
              }
            >
              上一页
            </button>
            
            <span className="mx-2" style={{ color: 'var(--text-secondary)' }}>
              第 {page + 1} 页，共 {totalPages} 页
            </span>
            
            <button
              onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
              disabled={page === totalPages - 1 || totalPages === 0}
              className="px-4 py-2 rounded-lg transition-colors"
              style={page === totalPages - 1 || totalPages === 0
                ? { background: 'var(--bg-elevated)', color: 'var(--text-tertiary)', cursor: 'not-allowed' }
                : { background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }
              }
            >
              下一页
            </button>
          </div>
          
          <div className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
            共 {total} 篇笔记，当前显示 {(page * pageSize) + 1}-{Math.min((page + 1) * pageSize, total)}
          </div>
        </div>
      )}
    </div>
  )
}
