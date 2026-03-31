import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }
    
    const { data: notes, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return NextResponse.json({ notes: notes || [] })
  } catch (error) {
    console.error('获取笔记列表失败:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '服务器错误'
    }, { status: 500 })
  }
}
