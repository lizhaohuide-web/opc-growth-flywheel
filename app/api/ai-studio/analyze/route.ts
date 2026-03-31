import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { platform, publicationId, metrics } = body

    if (!platform || !metrics) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // Analyze performance metrics and generate insights
    const analysis = analyzePerformance(platform, metrics)

    return NextResponse.json({
      success: true,
      analysis,
      message: '数据分析完成',
    })
  } catch (error) {
    console.error('Failed to analyze performance:', error)
    return NextResponse.json(
      { error: '分析失败，请稍后重试' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const noteId = searchParams.get('noteId')
    const platform = searchParams.get('platform')

    // TODO: Fetch feedback loops from database
    const feedbackLoops = [] // Placeholder

    return NextResponse.json({
      success: true,
      feedbackLoops,
    })
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
    return NextResponse.json(
      { error: '获取数据失败' },
      { status: 500 }
    )
  }
}

function analyzePerformance(platform: string, metrics: any) {
  const { views = 0, likes = 0, comments = 0, shares = 0, conversion = 0 } = metrics

  // Calculate engagement rates
  const likeRate = views > 0 ? (likes / views * 100).toFixed(2) : 0
  const commentRate = views > 0 ? (comments / views * 100).toFixed(2) : 0
  const shareRate = views > 0 ? (shares / views * 100).toFixed(2) : 0
  const totalEngagement = likes + comments + shares
  const engagementRate = views > 0 ? (totalEngagement / views * 100).toFixed(2) : 0

  // Generate insights based on platform benchmarks
  const insights = generateInsights(platform, {
    likeRate: parseFloat(likeRate),
    commentRate: parseFloat(commentRate),
    shareRate: parseFloat(shareRate),
    engagementRate: parseFloat(engagementRate),
  })

  // Score the performance (0-100)
  const performanceScore = calculateScore(platform, metrics)

  // Generate optimization suggestions
  const suggestions = generateSuggestions(platform, insights)

  return {
    metrics: {
      views,
      likes,
      comments,
      shares,
      conversion,
      totalEngagement,
    },
    rates: {
      likeRate: `${likeRate}%`,
      commentRate: `${commentRate}%`,
      shareRate: `${shareRate}%`,
      engagementRate: `${engagementRate}%`,
    },
    performanceScore,
    insights,
    suggestions,
    benchmarks: getBenchmarks(platform),
  }
}

function generateInsights(platform: string, rates: any): string[] {
  const insights: string[] = []

  if (platform === 'wechat') {
    if (rates.likeRate > 5) {
      insights.push('✅ 点赞率高于行业平均水平，内容质量得到认可')
    } else if (rates.likeRate < 2) {
      insights.push('⚠️ 点赞率偏低，建议优化标题和开头吸引力')
    }
    
    if (rates.shareRate > 3) {
      insights.push('✅ 分享率高，内容具有传播价值')
    }
  }

  if (platform === 'xiaohongshu') {
    if (rates.engagementRate > 10) {
      insights.push('✅ 互动率优秀，笔记受到用户欢迎')
    } else if (rates.engagementRate < 5) {
      insights.push('⚠️ 互动率有待提升，建议增加话题性和互动引导')
    }
    
    if (rates.commentRate > 2) {
      insights.push('✅ 评论活跃，话题引发讨论')
    }
  }

  if (platform === 'wechat_moments') {
    if (rates.likeRate > 15) {
      insights.push('✅ 朋友圈点赞率高，内容生活化、有共鸣')
    }
  }

  if (insights.length === 0) {
    insights.push('📊 数据表现中等，有优化空间')
  }

  return insights
}

function generateSuggestions(platform: string, insights: string[]): string[] {
  const suggestions: string[] = []

  // Generic suggestions based on common patterns
  suggestions.push('📝 优化标题：加入数字、疑问句、反差元素')
  suggestions.push('🎨 优化配图：提高视觉吸引力，符合平台调性')
  suggestions.push('⏰ 优化发布时间：根据目标用户活跃时段调整')
  suggestions.push('💬 增加互动引导：在文案中加入提问或互动话题')

  if (platform === 'wechat') {
    suggestions.push('📖 优化文章结构：小标题清晰，段落短小')
  }

  if (platform === 'xiaohongshu') {
    suggestions.push('🏷️ 优化标签：使用热门话题标签增加曝光')
    suggestions.push('📸 提升封面质量：3:4 比例，信息清晰')
  }

  return suggestions
}

function calculateScore(platform: string, metrics: any): number {
  const { views, likes, comments, shares } = metrics
  
  // Simple scoring algorithm (can be refined)
  const engagementWeight = platform === 'xiaohongshu' ? 0.5 : 0.3
  const viewWeight = 0.3
  const shareWeight = 0.2

  const engagementScore = Math.min(100, (likes + comments * 2 + shares * 3) / Math.max(views, 1) * 100)
  const viewScore = Math.min(100, views / 100)
  const shareScore = Math.min(100, shares * 10)

  const score = Math.round(
    engagementScore * engagementWeight +
    viewScore * viewWeight +
    shareScore * shareWeight
  )

  return Math.min(100, Math.max(0, score))
}

function getBenchmarks(platform: string): any {
  const benchmarks: Record<string, any> = {
    wechat: {
      avgOpenRate: '3-5%',
      avgLikeRate: '2-5%',
      avgShareRate: '1-3%',
      description: '公众号行业平均水平',
    },
    xiaohongshu: {
      avgEngagementRate: '5-10%',
      avgLikeRate: '3-8%',
      avgCommentRate: '1-3%',
      description: '小红书笔记平均水平',
    },
    wechat_moments: {
      avgLikeRate: '10-20%',
      avgCommentRate: '3-8%',
      description: '朋友圈平均水平',
    },
    short_video: {
      avgCompletionRate: '30-50%',
      avgLikeRate: '3-8%',
      avgShareRate: '1-3%',
      description: '短视频平均水平',
    },
  }

  return benchmarks[platform] || { description: '暂无基准数据' }
}
