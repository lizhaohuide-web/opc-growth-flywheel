import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }
    
    const { data: note, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single()
    
    if (error || !note) {
      return NextResponse.json({ error: '笔记不存在' }, { status: 404 })
    }
    
    return NextResponse.json({ note })
  } catch (error) {
    console.error('获取笔记失败:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '服务器错误'
    }, { status: 500 })
  }
}
