import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, imageIndex, style } = body

    if (!content || imageIndex === undefined) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    const imageTypes = ['封面图', '内容图 1', '内容图 2', '内容图 3', '内容图 4', '内容图 5', '内容图 6', '结尾图']
    const imageType = imageTypes[imageIndex] || `第${imageIndex + 1}张图`

    const styleDescriptions: Record<string, string> = {
      cute: '可爱甜美风，粉色系，少女心，萌系元素',
      fresh: '清新自然风，绿色系，简约干净',
      warm: '温暖治愈风，暖黄色系，温馨舒适',
      bold: '大胆撞色风，高饱和度，强对比',
      minimal: '极简高级风，黑白灰，性冷淡',
      retro: '复古怀旧风，老照片质感，怀旧色调',
      pop: '潮流活泼风，鲜艳色彩，年轻活力',
      notion: '知识卡片风，手绘线条，知识感',
      chalkboard: '黑板教学风，粉笔质感，教育感',
      'study-notes': '手写笔记风，真实手写照片，蓝笔红批注',
    }

    const prompt = `你是一位小红书配图提示词专家。请根据以下文案内容，生成第${imageIndex + 1}张配图（${imageType}）的 AI 绘画提示词。

## 文案内容
${content.substring(0, 2000)}

## 图片风格
${styleDescriptions[style] || style}

## 图片类型
${imageType}

## 各类型配图规则
- 封面图：吸引眼球，包含标题文字位置，强视觉冲击，文字醒目
- 内容图：展示核心要点、对比、步骤，信息清晰
- 结尾图：引导互动、关注、总结，温暖治愈

## 提示词格式
包含以下要素：
1. 主体描述（画面中心内容）
2. 场景描述（背景环境）
3. 色彩描述（主色调）
4. 构图描述（视角、布局）
5. 风格描述（${style}风格）
6. 文字描述（如果需要文字，说明文字内容和位置）

直接返回提示词文本，不要包含任何解释。`

    console.log('🤖 重新生成单个提示词:', { imageIndex, style })
    const result = await callAI(prompt, '你是小红书配图提示词专家，擅长生成精准的 AI 绘画提示词。')
    console.log('✅ 提示词生成成功')

    return NextResponse.json({
      success: true,
      prompt: result.trim(),
    })
  } catch (error) {
    console.error('Failed to generate prompt:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成提示词失败' },
      { status: 500 }
    )
  }
}
