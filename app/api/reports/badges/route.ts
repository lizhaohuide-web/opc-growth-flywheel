import { checkBadges } from '@/lib/milestones/tracker'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // 获取当前用户会话
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return Response.json({ error: '未授权访问' }, { status: 401 })
    }

    // 获取徽章数据
    const badges = await checkBadges(session.user.id)

    return Response.json(badges)
  } catch (error) {
    console.error('获取徽章数据错误:', error)
    return Response.json({ error: '内部服务器错误' }, { status: 500 })
  }
}