import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) return null
  
  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
  
  const stats = {
    totalNotes: notes?.length ?? 0,
    todayNotes: notes?.filter(n => 
      new Date(n.created_at).toDateString() === new Date().toDateString()
    ).length ?? 0,
    totalWords: notes?.reduce((sum, n) => sum + (n.content?.length || 0), 0) ?? 0
  }
  
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recentNotes = notes?.filter(n => new Date(n.created_at) >= sevenDaysAgo) || []
  
  const dailyStats: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    dailyStats[dateStr] = 0
  }
  recentNotes.forEach(note => {
    const date = new Date(note.created_at)
    const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    if (dailyStats[dateStr] !== undefined) {
      dailyStats[dateStr]++
    }
  })
  
  return (
    <div className="space-y-8 animate-enter">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-display" style={{ color: 'var(--text-primary)' }}>仪表盘</h1>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>欢迎回来，开始今天的成长记录吧！</p>
      </div>
      
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <div className="card p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>总笔记数</p>
              <p className="text-3xl md:text-4xl font-body mt-2" style={{ color: 'var(--accent)' }}>{stats.totalNotes}</p>
            </div>
            <div className="text-3xl md:text-4xl">📊</div>
          </div>
        </div>
        
        <div className="card p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>今日笔记</p>
              <p className="text-3xl md:text-4xl font-body mt-2" style={{ color: 'var(--success)' }}>{stats.todayNotes}</p>
            </div>
            <div className="text-3xl md:text-4xl">✅</div>
          </div>
        </div>
        
        <div className="card p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>总字数</p>
              <p className="text-3xl md:text-4xl font-body mt-2" style={{ color: 'var(--accent-light)' }}>{stats.totalWords.toLocaleString()}</p>
            </div>
            <div className="text-3xl md:text-4xl">✍️</div>
          </div>
        </div>
      </div>
      
      {/* 快速入口 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <Link href="/dashboard/notes/new"
          className="rounded-xl p-4 md:p-6 text-white hover:opacity-90 transition-opacity min-h-[100px]"
          style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg md:text-xl font-bold">📝 新建笔记</h3>
              <p className="mt-1 md:mt-2 text-xs md:text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>记录今天的学习和成长</p>
            </div>
            <div className="text-4xl md:text-5xl">✏️</div>
          </div>
        </Link>
        
        <Link href="/dashboard/ai-studio"
          className="rounded-xl p-4 md:p-6 text-white hover:opacity-90 transition-opacity min-h-[100px]"
          style={{ background: 'linear-gradient(135deg, #ff2442 0%, #ff6b7a 100%)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg md:text-xl font-bold">🎨 AI 工作室</h3>
              <p className="mt-1 md:mt-2 text-xs md:text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>一键改写为小红书/公众号</p>
            </div>
            <div className="text-4xl md:text-5xl">◈</div>
          </div>
        </Link>
        
        <Link href="/dashboard/notes/new?template=guided"
          className="rounded-xl p-4 md:p-6 text-white hover:opacity-90 transition-opacity min-h-[100px]"
          style={{ background: 'linear-gradient(135deg, #6b46c1 0%, #9333ea 100%)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg md:text-xl font-bold">🎯 引导式模板</h3>
              <p className="mt-1 md:mt-2 text-xs md:text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>使用 KPT、CORNELL 等模板</p>
            </div>
            <div className="text-4xl md:text-5xl">📋</div>
          </div>
        </Link>
      </div>
      
      {/* 最近笔记 */}
      <div className="card overflow-hidden">
        <div className="p-6" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display" style={{ color: 'var(--text-primary)' }}>最近笔记</h2>
            <Link href="/dashboard/notes" className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
              查看全部 →
            </Link>
          </div>
        </div>
        
        <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {notes && notes.length > 0 ? (
            notes.slice(0, 5).map(note => (
              <Link
                key={note.id}
                href={`/dashboard/notes/${note.id}`}
                className="p-6 transition-colors block hover:bg-[var(--bg-card-hover)]"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {note.title || '无标题'}
                    </h3>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(note.created_at).toLocaleDateString('zh-CN', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {note.tags.slice(0, 3).map((tag: string) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-1 rounded-full"
                            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ color: 'var(--text-tertiary)' }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">📝</div>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>还没有笔记，开始记录吧！</p>
              <Link href="/dashboard/notes/new" className="btn-primary inline-block">
                创建第一篇笔记
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* AI 功能入口 */}
      <div className="rounded-xl p-4 md:p-6" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--border-accent)' }}>
        <h2 className="text-lg md:text-xl font-display mb-4" style={{ color: 'var(--text-primary)' }}>🤖 AI 助手</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <Link
            href="/dashboard/ai-studio/xiaohongshu"
            className="card p-4 min-h-[80px] hover:opacity-90 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl flex-shrink-0">📕</div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm md:text-base" style={{ color: 'var(--text-primary)' }}>小红书改写</h3>
                <p className="text-xs md:text-sm" style={{ color: 'var(--text-secondary)' }}>生成文案 + 配图一键搞定</p>
              </div>
            </div>
          </Link>
          
          <Link
            href="/dashboard/ai-studio/wechat"
            className="card p-4 min-h-[80px] hover:opacity-90 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl flex-shrink-0">📱</div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm md:text-base" style={{ color: 'var(--text-primary)' }}>公众号改写</h3>
                <p className="text-xs md:text-sm" style={{ color: 'var(--text-secondary)' }}>AI 改写为公众号文章</p>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/reports/weekly" className="card p-4 min-h-[80px] hover:opacity-90 transition-opacity">
            <div className="flex items-center gap-3">
              <div className="text-3xl flex-shrink-0">📊</div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm md:text-base" style={{ color: 'var(--text-primary)' }}>周报生成</h3>
                <p className="text-xs md:text-sm" style={{ color: 'var(--text-secondary)' }}>AI 生成每周总结</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
