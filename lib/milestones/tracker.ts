import { createClient } from '@/lib/supabase/server'

// 徽章类型定义
export interface Badge {
  id: string
  name: string
  category: string
  icon: string
  description: string
  achieved: boolean
  progress?: number
  target?: number
  earnedAt?: string
}

// 检查并更新成就徽章
export async function checkBadges(userId: string): Promise<Badge[]> {
  const supabase = await createClient()
  
  // 获取用户数据
  const { data: notes, error: notesError } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (notesError) {
    console.error('获取笔记数据错误:', notesError)
    return []
  }
  
  const totalNotes = notes?.length || 0
  const totalWords = notes?.reduce((sum, n) => sum + (n.content?.length || 0), 0) || 0
  
  // 计算连续天数
  const streak = calculateStreak(notes || [])
  
  // 获取最近30天的笔记用于更复杂的徽章检测
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentNotes = notes?.filter(note => new Date(note.created_at) >= thirtyDaysAgo) || []
  
  // 获取用户最近的评估记录用于成长相关徽章
  const { data: assessments } = await supabase
    .from('wheel_assessments') // 假设存在评估记录表
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10) // 获取最近10次评估
  
  // 获取最近3个月的月报记录
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const { data: monthlyReports } = await supabase
    .from('monthly_reports') // 假设存在月报记录表
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', threeMonthsAgo.toISOString())
    .order('created_at', { ascending: false })
  
  // 获取平台内容生成记录（假设存在相关内容表）
  const { data: generatedContents } = await supabase
    .from('generated_contents') // 假设存在生成内容记录表
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', thirtyDaysAgo.toISOString())
  
  // 所有徽章定义
  const allBadges: Badge[] = [
    // 写作成就
    {
      id: 'novice_writer',
      name: '初心者',
      category: 'writing',
      icon: '📝',
      description: '写下第 1 篇笔记',
      achieved: totalNotes >= 1,
      progress: totalNotes,
      target: 1
    },
    {
      id: 'weekly_consistency',
      name: '周更达人',
      category: 'writing',
      icon: '🗓️',
      description: '连续 7 天写笔记',
      achieved: streak >= 7,
      progress: streak,
      target: 7
    },
    {
      id: 'monthly_commitment',
      name: '月度坚持',
      category: 'writing',
      icon: '📆',
      description: '连续 30 天写笔记',
      achieved: streak >= 30,
      progress: streak,
      target: 30
    },
    {
      id: 'century_milestone',
      name: '百篇里程碑',
      category: 'writing',
      icon: '💯',
      description: '累计 100 篇笔记',
      achieved: totalNotes >= 100,
      progress: totalNotes,
      target: 100
    },
    {
      id: 'word_master',
      name: '万字作者',
      category: 'writing',
      icon: '✍️',
      description: '累计 1 万字',
      achieved: totalWords >= 10000,
      progress: totalWords,
      target: 10000
    },
    {
      id: 'literary_giant',
      name: '十万字大师',
      category: 'writing',
      icon: '📚',
      description: '累计 10 万字',
      achieved: totalWords >= 100000,
      progress: totalWords,
      target: 100000
    },
    
    // 深度思考
    {
      id: 'thinker',
      name: '思想者',
      category: 'thinking',
      icon: '💭',
      description: '单篇笔记超 500 字',
      achieved: (notes || []).some(note => (note.content?.length || 0) > 500),
      progress: (notes || []).filter(note => (note.content?.length || 0) > 500).length,
      target: 1
    },
    {
      id: 'deep_dive',
      name: '深度挖掘',
      category: 'thinking',
      icon: '🔍',
      description: '单篇笔记超 2000 字',
      achieved: (notes || []).some(note => (note.content?.length || 0) > 2000),
      progress: (notes || []).filter(note => (note.content?.length || 0) > 2000).length,
      target: 1
    },
    {
      id: 'quality_creator',
      name: '高质量创作者',
      category: 'thinking',
      icon: '⭐',
      description: '5 篇笔记质量评分 ≥ 8',
      achieved: (notes || []).filter(note => note.quality_score && note.quality_score >= 8).length >= 5,
      progress: (notes || []).filter(note => note.quality_score && note.quality_score >= 8).length,
      target: 5
    },
    {
      id: 'model_explorer',
      name: '思维建模师',
      category: 'thinking',
      icon: '🧩',
      description: 'AI 摘要中识别出 5 种不同思维模型',
      achieved: hasIdentifiedModels(notes || []), // 假设有检测模型的函数
      progress: getModelCount(notes || []), // 假设有计算模型数量的函数
      target: 5
    },
    
    // 成长达人
    {
      id: 'well_rounded',
      name: '全面发展',
      category: 'growth',
      icon: '🌈',
      description: '生命之轮 8 个维度都 ≥ 5 分',
      achieved: hasBalancedWheel(assessments || []),
      progress: getBalancedDimensions(assessments || []),
      target: 8
    },
    {
      id: 'breakthrough',
      name: '专注突破',
      category: 'growth',
      icon: '🚀',
      description: '任一维度从 ≤ 4 提升到 ≥ 7',
      achieved: hasSignificantImprovement(assessments || []),
      progress: getImprovedDimensions(assessments || []),
      target: 1
    },
    {
      id: 'consistent_progress',
      name: '持续进步',
      category: 'growth',
      icon: '📈',
      description: '连续 3 次评估总分上升',
      achieved: hasContinuousGrowth(assessments || []),
      progress: getGrowthStreak(assessments || []),
      target: 3
    },
    {
      id: 'accelerated_growth',
      name: '成长加速',
      category: 'growth',
      icon: '⚡',
      description: '月度笔记数环比增长 50%',
      achieved: hasAcceleratedGrowth(recentNotes, notes || []),
      progress: getGrowthRate(recentNotes, notes || []),
      target: 50
    },
    
    // 内容变现
    {
      id: 'content_creator',
      name: '内容创作者',
      category: 'content',
      icon: '🎬',
      description: '首次使用 AI 生成多平台内容',
      achieved: (generatedContents || []).length >= 1,
      progress: (generatedContents || []).length,
      target: 1
    },
    {
      id: 'matrix_operator',
      name: '矩阵操盘手',
      category: 'content',
      icon: '🔗',
      description: '用 3 个以上平台生成内容',
      achieved: getPlatformCount(generatedContents || []) >= 3,
      progress: getPlatformCount(generatedContents || []),
      target: 3
    },
    {
      id: 'high_output',
      name: '高产出者',
      category: 'content',
      icon: '🔥',
      description: '月生成 20 篇以上平台内容',
      achieved: (generatedContents || []).length >= 20,
      progress: (generatedContents || []).length,
      target: 20
    },
    
    // 特殊成就
    {
      id: 'early_bird',
      name: '早起鸟',
      category: 'special',
      icon: '🌅',
      description: '连续 7 天在早 8 点前写笔记',
      achieved: hasEarlyBirdPattern(notes || []),
      progress: getEarlyBirdDays(notes || []),
      target: 7
    },
    {
      id: 'night_owl',
      name: '夜猫子',
      category: 'special',
      icon: '🦉',
      description: '连续 7 天在晚 11 点后写笔记',
      achieved: hasNightOwlPattern(notes || []),
      progress: getNightOwlDays(notes || []),
      target: 7
    },
    {
      id: 'multi_recorder',
      name: '多元记录',
      category: 'special',
      icon: '🎨',
      description: '使用过 4 种以上笔记模板',
      achieved: getTemplateVariety(notes || []) >= 4,
      progress: getTemplateVariety(notes || []),
      target: 4
    },
    {
      id: 'reflection_master',
      name: '反思大师',
      category: 'special',
      icon: '🧘',
      description: '连续 7 天使用 KPT 模板',
      achieved: hasKPTPattern(notes || []),
      progress: getKPTDays(notes || []),
      target: 7
    },
    {
      id: 'inspiration_collector',
      name: '灵感收集者',
      category: 'special',
      icon: '✨',
      description: '单日写 3 篇以上笔记',
      achieved: hasHighOutputDay(notes || []),
      progress: getMaxDailyNotes(notes || []),
      target: 3
    },
    {
      id: 'quarter_reviewer',
      name: '季度回顾',
      category: 'special',
      icon: ' Quarterly',
      description: '连续 3 个月生成月报',
      achieved: (monthlyReports || []).length >= 3,
      progress: (monthlyReports || []).length,
      target: 3
    },
    {
      id: 'annual_summarizer',
      name: '年度总结',
      category: 'special',
      icon: '🏆',
      description: '生成年度成长报告',
      achieved: false, // 异步检查，暂时设为 false
      progress: 1,
      target: 1
    },
    {
      id: 'opc_pioneer',
      name: 'OPC先锋',
      category: 'special',
      icon: '🚀',
      description: '使用 OPC 增长飞轮超过 90 天',
      achieved: hasLongUsage(supabase, userId, 90),
      progress: await getUsageDays(supabase, userId),
      target: 90
    }
  ]
  
  return allBadges
}

// 辅助函数实现
function calculateStreak(notes: Array<{ created_at: string }>): number {
  if (notes.length === 0) return 0
  
  let streak = 0
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
  
  return streak
}

// 以下是一些辅助函数的占位实现，实际项目中需要完善
function hasIdentifiedModels(notes: Array<{ models?: string[] }>): boolean {
  // 假设在笔记中有模型识别字段
  return notes.some(note => note.models && note.models.length >= 5)
}

function getModelCount(notes: Array<{ models?: string[] }>): number {
  // 计算不同的思维模型数量
  const allModels = notes.flatMap(note => note.models || [])
  return [...new Set(allModels)].length
}

function hasBalancedWheel(assessments: unknown[]): boolean {
  // 检查最近一次评估是否8个维度都≥5
  if (assessments.length === 0) return false
  const latestAssessment = assessments[0]
  // 假设assessment有一个dimensions字段
  if (!latestAssessment.dimensions) return false
  return latestAssessment.dimensions.every((d: unknown) => d.score >= 5)
}

function getBalancedDimensions(assessments: unknown[]): number {
  if (assessments.length === 0) return 0
  const latestAssessment = assessments[0]
  if (!latestAssessment.dimensions) return 0
  return latestAssessment.dimensions.filter((d: unknown) => d.score >= 5).length
}

function hasSignificantImprovement(assessments: unknown[]): boolean {
  if (assessments.length < 2) return false
  const [current, previous] = assessments
  if (!current.dimensions || !previous.dimensions) return false
  
  // 检查是否有任一维度从≤4提升到≥7
  for (let i = 0; i < current.dimensions.length; i++) {
    const currScore = current.dimensions[i].score
    const prevScore = previous.dimensions[i].score
    if (prevScore <= 4 && currScore >= 7) {
      return true
    }
  }
  return false
}

function getImprovedDimensions(assessments: unknown[]): number {
  if (assessments.length < 2) return 0
  const [current, previous] = assessments
  if (!current.dimensions || !previous.dimensions) return 0
  
  let improvements = 0
  for (let i = 0; i < current.dimensions.length; i++) {
    const currScore = current.dimensions[i].score
    const prevScore = previous.dimensions[i].score
    if (prevScore <= 4 && currScore >= 7) {
      improvements++
    }
  }
  return improvements
}

function hasContinuousGrowth(assessments: unknown[]): boolean {
  if (assessments.length < 3) return false
  // 检查连续3次评估总分是否都在上升
  for (let i = 0; i < 2; i++) {
    const currentTotal = assessments[i].dimensions.reduce((sum: number, d: unknown) => sum + d.score, 0)
    const previousTotal = assessments[i + 1].dimensions.reduce((sum: number, d: unknown) => sum + d.score, 0)
    if (currentTotal <= previousTotal) {
      return false
    }
  }
  return true
}

function getGrowthStreak(assessments: unknown[]): number {
  if (assessments.length < 2) return 0
  let streak = 1
  for (let i = 0; i < assessments.length - 1; i++) {
    const currentTotal = assessments[i].dimensions.reduce((sum: number, d: unknown) => sum + d.score, 0)
    const previousTotal = assessments[i + 1].dimensions.reduce((sum: number, d: unknown) => sum + d.score, 0)
    if (currentTotal > previousTotal) {
      streak++
    } else {
      break
    }
  }
  return streak
}

function hasAcceleratedGrowth(recentNotes: unknown[], allNotes: unknown[]): boolean {
  if (recentNotes.length === 0 || allNotes.length === 0) return false
  
  // 计算最近一个月和上一个月的笔记数量
  const now = new Date()
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate())
  
  const lastMonthNotes = allNotes.filter((note: unknown) => 
    new Date(note.created_at) >= oneMonthAgo && new Date(note.created_at) < now
  )
  const prevMonthNotes = allNotes.filter((note: unknown) => 
    new Date(note.created_at) >= twoMonthsAgo && new Date(note.created_at) < oneMonthAgo
  )
  
  if (prevMonthNotes.length === 0) return lastMonthNotes.length > 0
  
  const growthRate = ((lastMonthNotes.length - prevMonthNotes.length) / prevMonthNotes.length) * 100
  return growthRate >= 50
}

function getGrowthRate(recentNotes: unknown[], allNotes: unknown[]): number {
  if (allNotes.length === 0) return 0
  
  const now = new Date()
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate())
  
  const lastMonthNotes = allNotes.filter((note: unknown) => 
    new Date(note.created_at) >= oneMonthAgo && new Date(note.created_at) < now
  )
  const prevMonthNotes = allNotes.filter((note: unknown) => 
    new Date(note.created_at) >= twoMonthsAgo && new Date(note.created_at) < oneMonthAgo
  )
  
  if (prevMonthNotes.length === 0) return lastMonthNotes.length > 0 ? 100 : 0
  
  return ((lastMonthNotes.length - prevMonthNotes.length) / prevMonthNotes.length) * 100
}

function getPlatformCount(contents: unknown[]): number {
  const platforms = new Set(contents.map(c => c.platform))
  return platforms.size
}

function hasEarlyBirdPattern(notes: unknown[]): boolean {
  // 检查是否有连续7天在早上8点前写笔记
  if (notes.length < 7) return false
  
  let earlyBirdCount = 0
  for (const note of notes) {
    const hour = new Date(note.created_at).getHours()
    if (hour < 8) {
      earlyBirdCount++
      if (earlyBirdCount >= 7) return true
    } else {
      earlyBirdCount = 0
    }
  }
  return false
}

function getEarlyBirdDays(notes: unknown[]): number {
  let maxEarlyBirdStreak = 0
  let currentStreak = 0
  
  for (const note of notes.reverse()) { // 从最早到最新
    const hour = new Date(note.created_at).getHours()
    if (hour < 8) {
      currentStreak++
      maxEarlyBirdStreak = Math.max(maxEarlyBirdStreak, currentStreak)
    } else {
      currentStreak = 0
    }
  }
  
  return maxEarlyBirdStreak
}

function hasNightOwlPattern(notes: unknown[]): boolean {
  // 检查是否有连续7天在晚上11点后写笔记
  if (notes.length < 7) return false
  
  let nightOwlCount = 0
  for (const note of notes) {
    const hour = new Date(note.created_at).getHours()
    if (hour >= 23) {
      nightOwlCount++
      if (nightOwlCount >= 7) return true
    } else {
      nightOwlCount = 0
    }
  }
  return false
}

function getNightOwlDays(notes: unknown[]): number {
  let maxNightOwlStreak = 0
  let currentStreak = 0
  
  for (const note of notes.reverse()) { // 从最早到最新
    const hour = new Date(note.created_at).getHours()
    if (hour >= 23) {
      currentStreak++
      maxNightOwlStreak = Math.max(maxNightOwlStreak, currentStreak)
    } else {
      currentStreak = 0
    }
  }
  
  return maxNightOwlStreak
}

function getTemplateVariety(notes: unknown[]): number {
  const templates = new Set(notes.map((note: unknown) => note.template || 'default'))
  return templates.size
}

function hasKPTPattern(notes: unknown[]): boolean {
  // 检查是否有连续7天使用KPT模板
  if (notes.length < 7) return false
  
  let kptCount = 0
  for (const note of notes) {
    if (note.template === 'KPT') {
      kptCount++
      if (kptCount >= 7) return true
    } else {
      kptCount = 0
    }
  }
  return false
}

function getKPTDays(notes: unknown[]): number {
  let maxKPTStreak = 0
  let currentStreak = 0
  
  for (const note of notes.reverse()) { // 从最早到最新
    if (note.template === 'KPT') {
      currentStreak++
      maxKPTStreak = Math.max(maxKPTStreak, currentStreak)
    } else {
      currentStreak = 0
    }
  }
  
  return maxKPTStreak
}

function hasHighOutputDay(notes: unknown[]): boolean {
  // 检查是否有某一天写了3篇以上笔记
  const notesByDate: Record<string, number> = {}
  for (const note of notes) {
    const date = new Date(note.created_at).toDateString()
    notesByDate[date] = (notesByDate[date] || 0) + 1
  }
  
  return Object.values(notesByDate).some(count => count >= 3)
}

function getMaxDailyNotes(notes: unknown[]): number {
  const notesByDate: Record<string, number> = {}
  for (const note of notes) {
    const date = new Date(note.created_at).toDateString()
    notesByDate[date] = (notesByDate[date] || 0) + 1
  }
  
  return Math.max(...Object.values(notesByDate), 0)
}

async function hasAnnualReport(supabase: unknown, userId: string): Promise<boolean> {
  // 检查是否有年度报告
  const { data } = await supabase
    .from('annual_reports')
    .select('*')
    .eq('user_id', userId)
    .limit(1)
  
  return !!(data && data.length > 0)
}

async function hasLongUsage(supabase: unknown, userId: string, days: number): Promise<boolean> {
  // 检查用户使用天数是否超过指定天数
  const { data: firstNote } = await supabase
    .from('notes')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
  
  if (!firstNote || firstNote.length === 0) return false
  
  const firstDate = new Date(firstNote[0].created_at)
  const today = new Date()
  const diffTime = Math.abs(today.getTime() - firstDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays >= days
}

async function getUsageDays(supabase: unknown, userId: string): Promise<number> {
  // 计算用户使用天数
  const { data: firstNote } = await supabase
    .from('notes')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
  
  if (!firstNote || firstNote.length === 0) return 0
  
  const firstDate = new Date(firstNote[0].created_at)
  const today = new Date()
  const diffTime = Math.abs(today.getTime() - firstDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}
