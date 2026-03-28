import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // 获取当前用户会话
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return Response.json({ error: '未授权访问' }, { status: 401 })
    }

    // 获取用户数据
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    
    if (notesError) {
      console.error('获取笔记数据错误:', notesError)
      return Response.json({ error: '获取数据失败' }, { status: 500 })
    }

    // 计算统计数据
    const totalNotes = notes?.length || 0
    const totalWords = notes?.reduce((sum, n) => sum + (n.content?.length || 0), 0) || 0
    
    // 计算连续天数
    let streak = 0
    if (notes && notes.length > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      let currentDate = today
      
      for (const note of notes) {
        const noteDate = new Date(note.created_at)
        noteDate.setHours(0, 0, 0, 0)
        
        const diffDays = Math.floor((currentDate.getTime() - noteDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (diffDays <= 1) {
          streak++
          currentDate = noteDate
        } else {
          break
        }
      }
    }

    return Response.json({
      totalNotes,
      totalWords,
      streak
    })
  } catch (error) {
    console.error('服务器错误:', error)
    return Response.json({ error: '内部服务器错误' }, { status: 500 })
  }
}