import { createClient } from '@/lib/supabase/server'
import { generateMonthlyReport } from '@/lib/analytics/monthly-report'

export async function GET() {
  try {
    // 从请求头获取用户信息（假设通过中间件或认证）
    const supabase = await createClient()
    
    // 获取当前用户会话
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return Response.json({ error: '未授权访问' }, { status: 401 })
    }

    try {
      const report = await generateMonthlyReport(session.user.id)
      
      return Response.json(report)
    } catch (error) {
      console.error('生成月报错误:', error)
      return Response.json({ error: '生成月报失败' }, { status: 500 })
    }
  } catch (error) {
    console.error('服务器错误:', error)
    return Response.json({ error: '内部服务器错误' }, { status: 500 })
  }
}