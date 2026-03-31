import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, style = 'talk', tier = 'basic' } = body

    if (!title) {
      return NextResponse.json(
        { error: '缺少标题参数' },
        { status: 400 }
      )
    }

    // Generate script based on tier and style
    const script = generateScript(title, content, style, tier)

    return NextResponse.json({
      success: true,
      script,
      tier,
      style,
      message: '脚本生成成功',
    })
  } catch (error) {
    console.error('Failed to generate short video script:', error)
    return NextResponse.json(
      { error: '脚本生成失败，请稍后重试' },
      { status: 500 }
    )
  }
}

function generateScript(title: string, content: string, style: string, tier: string) {
  const styleNames: Record<string, string> = {
    'talk': '口播',
    'entertainment': '娱乐',
    'sales': '带货',
  }

  const tierNames: Record<string, string> = {
    'basic': '基础',
    'advanced': '进阶',
    'pro': '高阶',
  }

  return {
    title: `【${styleNames[style]}风格】${title}`,
    duration: '60-90 秒',
    hook: `黄金 3 秒钩子：你知道吗？${title} 背后有一个让人惊讶的真相...`,
    
    body: [
      {
        timestamp: '0:03-0:15',
        type: 'point_1',
        content: `核心观点 1：${content.substring(0, 50)}...`,
        visual: '主讲人正面镜头 + 关键词字幕',
      },
      {
        timestamp: '0:15-0:30',
        type: 'point_2',
        content: '核心观点 2：展开说明...',
        visual: '案例/对比图展示',
      },
      {
        timestamp: '0:30-0:45',
        type: 'point_3',
        content: '核心观点 3：深入分析...',
        visual: '数据图表/动画演示',
      },
      {
        timestamp: '0:45-0:60',
        type: 'summary',
        content: '总结回顾 + 价值升华',
        visual: '要点清单 + 主讲人',
      },
    ],

    ending: {
      callToAction: '关注我，获取更多干货内容！',
      interaction: '评论区告诉我你的想法～',
      visual: '主讲人微笑 + 关注引导动画',
    },

    // Tier-specific features
    features: {
      basic: {
        description: '基础方案 - 人工拍摄剪辑',
        deliverables: ['分镜脚本', '提词器文本', '拍摄建议'],
      },
      advanced: {
        description: '进阶方案 - AI 音频 + B-roll 生成',
        deliverables: ['专属音频', 'B-roll 配图', '自动剪辑'],
        requires: ['声音模型训练', '素材生成'],
      },
      pro: {
        description: '高阶方案 - 数字人工作流',
        deliverables: ['数字人视频', '专业后期'],
        externalWorkflow: '跳转至数字人平台（硅基智能/HeyGen 等）',
      },
    },

    teleprompter: {
      fullText: `[完整提词器文本]

${title}

${content}

（这是模拟的脚本内容，实际实现需要调用 AI API 生成完整脚本）`,
      speed: '中等',
      fontSize: '大',
    },
  }
}
