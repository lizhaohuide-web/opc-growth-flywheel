import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // 获取当前用户会话
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return Response.json({ error: '未授权访问' }, { status: 401 })
    }

    // 获取过去6个月的数据
    const trends = []
    const today = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const endDate = new Date(today.getFullYear(), today.getMonth() - i, 0) // 月末
      const startDate = new Date(today.getFullYear(), today.getMonth() - i, 1) // 月初
      
      // 获取当月笔记
      const { data: notes, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
      
      if (error) {
        console.error('获取月度数据错误:', error)
        continue
      }
      
      const monthNotes = notes || []
      const monthWords = monthNotes.reduce((sum, n) => sum + (n.content?.length || 0), 0)
      const avgScore = monthNotes.length > 0 
        ? monthNotes.reduce((sum, n) => sum + (n.quality_score || 5), 0) / monthNotes.length
        : 5
      
      // 计算增长率（与上月比较）
      let growth = 0
      if (i < 5) { // 不是第一个月，可以与上月比较
        const prevMonthNotes = trends[trends.length - 1]?.notes || 1 // 避免除零
        growth = Math.round(((monthNotes.length - prevMonthNotes) / prevMonthNotes) * 100)
      }
      
      trends.push({
        period: `${startDate.getFullYear()}年${startDate.getMonth() + 1}月`,
        notes: monthNotes.length,
        words: monthWords,
        avgScore: parseFloat(avgScore.toFixed(1)),
        growth
      })
    }

    return Response.json(trends)
  } catch (error) {
    console.error('获取月度趋势错误:', error)
    return Response.json({ error: '内部服务器错误' }, { status: 500 })
  }
}