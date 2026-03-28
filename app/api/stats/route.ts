import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: notes } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', session.user.id)
    
    // 计算统计数据
    const stats = {
      totalNotes: notes?.length ?? 0,
      totalWords: notes?.reduce((sum, n) => sum + (n.content?.length || 0), 0) ?? 0,
      totalTags: notes?.reduce((sum, n) => sum + (n.tags?.length || 0), 0) ?? 0,
      averageNotesPerDay: notes?.length ? notes.length / 7 : 0 // 最近 7 天平均
    }
    
    // 热门标签统计
    const tagCount: Record<string, number> = {}
    notes?.forEach(note => {
      note.tags?.forEach((tag: string) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1
      })
    })
    
    const topTags = Object.entries(tagCount)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    
    return NextResponse.json({
      stats,
      topTags,
      period: 'last_7_days'
    })
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
