import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, style = '专业对话' } = body

    if (!title) {
      return NextResponse.json(
        { error: '缺少标题参数' },
        { status: 400 }
      )
    }

    // Generate podcast script with dual-host dialogue
    const script = generatePodcastScript(title, content, style)

    return NextResponse.json({
      success: true,
      script,
      message: '播客脚本生成成功',
    })
  } catch (error) {
    console.error('Failed to generate podcast script:', error)
    return NextResponse.json(
      { error: '脚本生成失败，请稍后重试' },
      { status: 500 }
    )
  }
}

function generatePodcastScript(title: string, content: string, style: string) {
  return {
    title: `🎙️ ${title}`,
    style,
    estimatedDuration: '15-20 分钟',
    
    hosts: {
      hostA: {
        name: '主持人 A',
        role: '专业/理性',
        description: '负责输出专业观点和深度分析',
        voiceSuggestion: '沉稳男声/知性女声',
      },
      hostB: {
        name: '主持人 B',
        role: '好奇/提问',
        description: '代表听众提问，引导话题展开',
        voiceSuggestion: '活泼男声/温柔女声',
      },
    },

    structure: {
      opening: {
        duration: '0:00-1:00',
        content: [
          '[背景音乐渐入]',
          'A: 大家好，欢迎收听本期节目！我是 A。',
          'B: 我是 B，大家好！',
          `A: 今天我们要聊的话题是"${title}"。`,
          'B: 这个话题很有意思，我最近也一直在关注...',
          '[背景音乐渐弱]',
        ],
      },

      main: {
        duration: '1:00-15:00',
        segments: [
          {
            topic: '引入话题',
            duration: '1:00-3:00',
            dialogue: [
              'B: 说实话，我刚看到这个话题的时候，第一反应是...',
              'A: 哈哈，这很正常。其实从专业角度来看...',
              'B: 哦？那具体是怎么样的呢？',
              'A: 我们可以从这几个方面来看...',
            ],
          },
          {
            topic: '核心观点展开',
            duration: '3:00-8:00',
            dialogue: [
              'A: 首先，第一个关键点是...',
              'B: 这个点很有意思，能详细说说吗？',
              'A: 当然。举个例子...',
              'B: 原来如此，那第二个点呢？',
            ],
          },
          {
            topic: '案例讨论',
            duration: '8:00-12:00',
            dialogue: [
              'B: 我想到一个实际的例子...',
              'A: 对，这个案例很典型。它说明了...',
              'B: 所以你的意思是...',
              'A: 没错，核心就是...',
            ],
          },
          {
            topic: '深度分析',
            duration: '12:00-15:00',
            dialogue: [
              'A: 如果我们往深处想一层...',
              'B: 哇，这个角度我之前真没想过',
              'A: 这就是为什么...',
              'B: 今天真的涨知识了',
            ],
          },
        ],
      },

      closing: {
        duration: '15:00-16:00',
        content: [
          'A: 好的，今天的时间差不多了，我们来总结一下...',
          'B: 我今天的收获是...',
          'A: 非常好。如果大家对这个话题感兴趣...',
          'B: 记得订阅我们的节目，我们下期再见！',
          'A: 拜拜～',
          '[背景音乐渐强]',
        ],
      },
    },

    fullScript: `[完整播客脚本]

【开场】
A: 大家好，欢迎收听本期节目！我是 A。
B: 我是 B，大家好！
A: 今天我们要聊的话题是"${title}"。

【主体内容】
（基于以下内容展开对话）
${content.substring(0, 500)}...

【结尾】
A: 感谢大家的收听，我们下期再见！
B: 拜拜～`,

    productionNotes: {
      bgm: '轻松/专业的背景音乐',
      soundEffects: '转场音效、强调音效',
      recordingTips: [
        '保持自然对话节奏',
        '适当加入语气词和笑声',
        '注意语速适中，便于理解',
        '录制环境安静，减少噪音',
      ],
    },

    nextSteps: {
      audioGeneration: '调用 TTS API 生成双人对话音频（ElevenLabs/Azure TTS）',
      platforms: ['小宇宙', '苹果播客', '喜马拉雅', '网易云音乐'],
    },
  }
}
