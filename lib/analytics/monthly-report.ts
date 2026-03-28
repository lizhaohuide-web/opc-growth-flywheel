import { createClient } from '@/lib/supabase/server'
import { callAI } from '@/lib/ai/client'

export interface MonthlyReport {
  period: string
  stats: {
    totalNotes: number
    totalWords: number
    avgQualityScore: number
    bestNote: {
      id: string
      title: string
      content: string
      createdAt: string
      qualityScore: number
    } | null
  }
  trends: {
    weeks: Array<{ week: string; notes: number; words: number }>
    monthlyGrowth: number
  }
  wheelComparison: {
    current: Array<{ name: string; score: number }>
    previous: Array<{ name: string; score: number }> | null
  }
  contentStats: {
    generatedContents: number
    platformsUsed: string[]
  }
  aiAnalysis: string
  nextMonthGoals: string[]
}

export async function generateMonthlyReport(userId: string): Promise<MonthlyReport> {
  const supabase = await createClient()
  
  // 计算月份范围
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  
  // 获取本月笔记
  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())
    .lte('created_at', endOfMonth.toISOString())
    .order('created_at', { ascending: false })
  
  const period = `${startOfMonth.toLocaleDateString('zh-CN')} - ${endOfMonth.toLocaleDateString('zh-CN')}`
  
  // 统计数据
  const totalNotes = notes?.length || 0
  const totalWords = notes?.reduce((sum, n) => sum + (n.content?.length || 0), 0) || 0
  const avgQualityScore = notes && notes.length > 0 
    ? notes.reduce((sum, n) => sum + (n.quality_score || 5), 0) / notes.length
    : 5
  
  // 找到最佳笔记
  const bestNote = notes?.sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0))[0] || null
  
  // 按周统计趋势
  const weeks: Array<{ week: string; notes: number; words: number }> = []
  const weekStart = new Date(startOfMonth)
  
  while (weekStart <= endOfMonth) {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    
    const weekNotes = notes?.filter(note => {
      const noteDate = new Date(note.created_at)
      return noteDate >= weekStart && noteDate <= weekEnd
    }) || []
    
    weeks.push({
      week: `${weekStart.toLocaleDateString('zh-CN')} - ${weekEnd.toLocaleDateString('zh-CN')}`,
      notes: weekNotes.length,
      words: weekNotes.reduce((sum, n) => sum + (n.content?.length || 0), 0)
    })
    
    weekStart.setDate(weekStart.getDate() + 7)
  }
  
  // 计算月度增长率
  const prevMonthStart = new Date(startOfMonth)
  prevMonthStart.setMonth(startOfMonth.getMonth() - 1)
  const prevMonthEnd = new Date(endOfMonth)
  prevMonthEnd.setMonth(endOfMonth.getMonth() - 1)
  
  const { count: prevMonthNotes } = await supabase
    .from('notes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', prevMonthStart.toISOString())
    .lte('created_at', prevMonthEnd.toISOString())
  
  const prevTotal = prevMonthNotes || 0
  const monthlyGrowth = prevTotal > 0 
    ? Math.round(((totalNotes - prevTotal) / prevTotal) * 100) 
    : totalNotes > 0 ? 100 : 0
  
  // 获取生命之轮数据对比
  const { data: assessments } = await supabase
    .from('wheel_assessments') // 假设存在评估记录表
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())
    .order('created_at', { ascending: false })
    .limit(2) // 最近两次评估
  
  const currentWheel = assessments && assessments.length > 0 ? 
    assessments[0].dimensions.map((d) => ({ name: d.name, score: d.score })) : []
  const previousWheel = assessments && assessments.length > 1 ? 
    assessments[1].dimensions.map((d) => ({ name: d.name, score: d.score })) : null
  
  // 获取内容生成统计
  const { data: generatedContents } = await supabase
    .from('generated_contents') // 假设存在生成内容记录表
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())
    .lte('created_at', endOfMonth.toISOString())
  
  const platformsUsed = [...new Set(generatedContents?.map((gc) => gc.platform) || [])]
  
  // 生成AI分析
  const aiAnalysis = await generateAIAnalysis(notes || [], currentWheel)
  
  // 生成下月目标
  const nextMonthGoals = await generateNextMonthGoals(notes || [], currentWheel)
  
  return {
    period,
    stats: {
      totalNotes,
      totalWords,
      avgQualityScore,
      bestNote: bestNote ? {
        id: bestNote.id,
        title: bestNote.title || '未命名笔记',
        content: bestNote.content?.substring(0, 100) + '...' || '',
        createdAt: bestNote.created_at,
        qualityScore: bestNote.quality_score || 5
      } : null
    },
    trends: {
      weeks,
      monthlyGrowth
    },
    wheelComparison: {
      current: currentWheel,
      previous: previousWheel
    },
    contentStats: {
      generatedContents: generatedContents?.length || 0,
      platformsUsed
    },
    aiAnalysis,
    nextMonthGoals
  }
}

async function generateAIAnalysis(notes: Array<{ title?: string; content?: string; quality_score?: number }>, currentWheel: Array<{ name: string; score: number }>): Promise<string> {
  if (notes.length === 0) {
    return '本月暂无笔记记录，建议开始记录以获得更全面的成长分析。'
  }
  
  // 选择最有代表性的几篇笔记
  const sampleNotes = notes
    .sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0))
    .slice(0, 5)
    .map((note, index) => 
      `笔记${index + 1}: ${note.title || '无标题'} - ${note.content?.substring(0, 300) || ''}`
    )
    .join('\n\n')
  
  const wheelScores = currentWheel.map(w => `${w.name}:${w.score}`).join(', ')
  
  const prompt = `
    请基于以下用户本月的笔记内容和生命之轮评估结果，生成一份深度成长分析报告（约500字）：
    
    笔记样本：
    ${sampleNotes}
    
    生命之轮评估：
    ${wheelScores}
    
    请从以下几个方面进行分析：
    1. 本月成长亮点
    2. 各维度发展情况
    3. 需要关注的领域
    4. 未来发展方向建议
    
    请用中文撰写，语言积极正面，具有启发性。
  `
  
  try {
    const aiResponse = await callAI(prompt)
    return aiResponse
  } catch (error) {
    console.error('AI分析生成错误:', error)
    return 'AI分析暂时不可用，系统将为您生成基础月报。'
  }
}

async function generateNextMonthGoals(notes: Array<{ title?: string; content?: string; quality_score?: number }>, currentWheel: Array<{ name: string; score: number }>): Promise<string[]> {
  if (notes.length === 0 && currentWheel.length === 0) {
    return [
      '开始养成每日记录笔记的习惯',
      '设定个人发展目标',
      '定期进行自我评估'
    ]
  }
  
  const lowestDimension = currentWheel.length > 0 
    ? currentWheel.reduce((lowest, current) => 
        current.score < lowest.score ? current : lowest, 
        currentWheel[0]
      ) 
    : null
  
  const prompt = `
    基于以下用户本月的表现和评估结果，请提供3-5个具体的下月目标建议：
    
    最低分维度：${lowestDimension ? `${lowestDimension.name}(${lowestDimension.score})` : '暂无评估'}
    
    笔记数量：${notes.length}
    
    请提供具体的、可衡量的目标建议，格式如下：
    ["目标1", "目标2", "目标3"]
  `
  
  try {
    const aiResponse = await callAI(prompt)
    
    let parsedResponse: string[]
    try {
      // 尝试解析AI返回的数组
      parsedResponse = JSON.parse(aiResponse)
    } catch {
      // 如果不是JSON格式，尝试提取列表
      const matches = aiResponse.match(/\[(.*?)\]/)
      if (matches) {
        try {
          parsedResponse = JSON.parse(matches[0])
        } catch {
          // 如果还是失败，分割字符串
          parsedResponse = aiResponse.replace(/[\[\]"]/g, '').split(',').map(s => s.trim()).filter(s => s)
        }
      } else {
        parsedResponse = [
          '继续坚持记录笔记的习惯',
          '关注最低分维度的改善',
          '尝试新的学习方法'
        ]
      }
    }
    
    return parsedResponse.length > 0 ? parsedResponse : [
      '继续坚持记录笔记的习惯',
      '关注最低分维度的改善',
      '尝试新的学习方法'
    ]
  } catch (error) {
    console.error('目标建议生成错误:', error)
    return [
      '继续坚持记录笔记的习惯',
      '关注最低分维度的改善',
      '尝试新的学习方法'
    ]
  }
}