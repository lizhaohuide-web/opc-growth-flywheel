import { createClient } from '@/lib/supabase/server'
import { callAI } from '@/lib/ai/client'

export interface WeeklyReport {
  period: string
  totalNotes: number
  totalWords: number
  topTags: Array<{ tag: string; count: number }>
  summary: string
  dailyBreakdown: Array<{ date: string; count: number; wordCount: number }>
  insights: {
    focusArea: string
    nextWeekSuggestions: string[]
    knowledgeCurve: {
      dates: string[]
      counts: number[]
      wordCounts: number[]
    }
    modelStats: Array<{ name: string; count: number }>
    weekOverWeekComparison: {
      noteChange: number
      wordChange: number
      qualityChange: number
    }
  }
}

export async function generateWeeklyReport(userId: string): Promise<WeeklyReport> {
  const supabase = await createClient()
  
  // 计算日期范围
  const today = new Date()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(today.getDate() - 7)
  
  // 获取最近 7 天的笔记
  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: true })
  
  const period = `${sevenDaysAgo.toLocaleDateString('zh-CN')} - ${today.toLocaleDateString('zh-CN')}`
  
  // 统计总笔记数和总字数
  const totalNotes = notes?.length ?? 0
  const totalWords = notes?.reduce((sum, n) => sum + (n.content?.length || 0), 0) ?? 0
  
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
    .slice(0, 5)
  
  // 按日期分组（包含字数统计）
  const dailyBreakdown: Array<{ date: string; count: number; wordCount: number }> = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(sevenDaysAgo)
    date.setDate(sevenDaysAgo.getDate() + (6 - i))
    const dateStr = date.toLocaleDateString('zh-CN', { weekday: 'short', month: 'short', day: 'numeric' })
    const dailyNotes = notes?.filter(n => 
      new Date(n.created_at).toDateString() === date.toDateString()
    ) || []
    const dailyWordCount = dailyNotes.reduce((sum, n) => sum + (n.content?.length || 0), 0)
    dailyBreakdown.push({ 
      date: dateStr, 
      count: dailyNotes.length, 
      wordCount: dailyWordCount 
    })
  }
  
  // 获取上周数据用于对比
  const fourteenDaysAgo = new Date(today)
  fourteenDaysAgo.setDate(today.getDate() - 14)
  const { data: lastWeekNotes } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', fourteenDaysAgo.toISOString())
    .lt('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: true })
  
  const lastWeekTotalNotes = lastWeekNotes?.length ?? 0
  const lastWeekTotalWords = lastWeekNotes?.reduce((sum, n) => sum + (n.content?.length || 0), 0) ?? 0
  
  // 计算环比变化
  const noteChange = totalNotes - lastWeekTotalNotes
  const wordChange = totalWords - lastWeekTotalWords
  
  // 获取笔记质量评分（假设有quality_score字段）
  const avgQualityThisWeek = notes && notes.length > 0 
    ? notes.reduce((sum, n) => sum + (n.quality_score || 5), 0) / notes.length
    : 5
  const avgQualityLastWeek = lastWeekNotes && lastWeekNotes.length > 0 
    ? lastWeekNotes.reduce((sum, n) => sum + (n.quality_score || 5), 0) / lastWeekNotes.length
    : 5
  const qualityChange = parseFloat((avgQualityThisWeek - avgQualityLastWeek).toFixed(2))
  
  // 生成AI驱动的洞察
  const insights = await generateInsights(notes || [], topTags)
  
  // 生成 AI 摘要
  const summary = generateSummary(totalNotes, totalWords, topTags)
  
  return {
    period,
    totalNotes,
    totalWords,
    topTags,
    summary,
    dailyBreakdown,
    insights: {
      focusArea: insights.focusArea,
      nextWeekSuggestions: insights.nextWeekSuggestions,
      knowledgeCurve: {
        dates: dailyBreakdown.map(d => d.date),
        counts: dailyBreakdown.map(d => d.count),
        wordCounts: dailyBreakdown.map(d => d.wordCount)
      },
      modelStats: insights.modelStats,
      weekOverWeekComparison: {
        noteChange,
        wordChange,
        qualityChange
      }
    }
  }
}

async function generateInsights(notes: Array<{ content?: string; tags?: string[]; quality_score?: number }>, topTags: Array<{ tag: string; count: number }>): Promise<{
  focusArea: string
  nextWeekSuggestions: string[]
  modelStats: Array<{ name: string; count: number }>
}> {
  if (notes.length === 0) {
    return {
      focusArea: '暂无数据',
      nextWeekSuggestions: ['开始记录笔记以获得个性化建议'],
      modelStats: []
    }
  }
  
  // 提取笔记内容用于AI分析
  const sampleNotes = notes.slice(0, 10).map((note, index) => 
    `笔记${index + 1}: ${note.content?.substring(0, 300) || ''}`
  ).join('\n\n')
  
  const prompt = `
    分析以下用户本周的笔记内容，提供成长方向洞察和建议：
    
    笔记样本：
    ${sampleNotes}
    
    热门标签：${topTags.map(t => t.tag).join(', ')}
    
    请按照以下JSON格式返回分析结果：
    {
      "focusArea": "本周成长重心，如：技能提升、健康管理、人际关系等",
      "nextWeekSuggestions": ["下周建议关注的方向1", "下周建议关注的方向2", "下周建议关注的方向3"],
      "modelStats": [
        {"name": "思维模型名称1", "count": 出现次数},
        {"name": "思维模型名称2", "count": 出现次数}
      ]
    }
    
    注意：如果笔记内容不足或无法识别特定主题，请提供通用的积极建议。
  `
  
  try {
    const aiResponse = await callAI(prompt)
    
    let parsedResponse: { focusArea?: string; nextWeekSuggestions?: string[]; modelStats?: Array<{ name: string; count: number }> }
    try {
      // 尝试直接解析JSON
      parsedResponse = JSON.parse(aiResponse)
    } catch {
      // 如果直接解析失败，尝试从可能包含```json标记的文本中提取
      const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[1])
      } else {
        // 如果仍然失败，返回默认值
        return {
          focusArea: '综合发展',
          nextWeekSuggestions: ['继续保持记录习惯', '深化当前关注领域的学习', '尝试新的思维角度'],
          modelStats: []
        }
      }
    }
    
    return {
      focusArea: parsedResponse.focusArea || '综合发展',
      nextWeekSuggestions: parsedResponse.nextWeekSuggestions || [
        '继续保持记录习惯', 
        '深化当前关注领域的学习', 
        '尝试新的思维角度'
      ],
      modelStats: parsedResponse.modelStats || []
    }
  } catch (error) {
    console.error('AI洞察生成错误:', error)
    return {
      focusArea: '综合发展',
      nextWeekSuggestions: ['继续保持记录习惯', '深化当前关注领域的学习', '尝试新的思维角度'],
      modelStats: []
    }
  }
}

function generateSummary(totalNotes: number, totalWords: number, topTags: Array<{ tag: string; count: number }>): string {
  if (totalNotes === 0) {
    return '本周还没有记录笔记，开始你的成长之旅吧！'
  }
  
  let summary = `本周共记录了 ${totalNotes} 篇笔记，累计 ${totalWords.toLocaleString()} 字。`
  
  if (topTags.length > 0) {
    const topTag = topTags[0]
    summary += ` 最关注的领域是「${topTag.tag}」（${topTag.count} 次）。`
  }
  
  if (totalNotes >= 7) {
    summary += ' 保持了优秀的每日记录习惯！'
  } else if (totalNotes >= 3) {
    summary += ' 继续保持，争取每天记录！'
  }
  
  return summary
}
