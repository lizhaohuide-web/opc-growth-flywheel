import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    // 获取当前用户的笔记中的所有标签
    const { data: notes } = await supabase
      .from('notes')
      .select('tags')
      .eq('user_id', session.user.id)
    
    if (!notes) {
      return Response.json({ tags: [] })
    }
    
    // 提取所有唯一的标签
    const allTags = new Set<string>()
    notes.forEach(note => {
      if (Array.isArray(note.tags)) {
        note.tags.forEach(tag => allTags.add(tag))
      }
    })
    
    return Response.json({ tags: Array.from(allTags).sort() })
  } catch (error) {
    console.error('获取标签失败:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}