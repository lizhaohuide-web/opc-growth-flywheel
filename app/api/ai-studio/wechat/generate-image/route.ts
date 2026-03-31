import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, style = '专业' } = body

    if (!title) {
      return NextResponse.json(
        { error: '缺少标题参数' },
        { status: 400 }
      )
    }

    // Generate image prompt based on article content
    const imagePrompt = generateImagePrompt(title, content, style)

    // TODO: Call actual image generation API (通义万相/Midjourney/DALL-E 3)
    // For now, return the prompt and a placeholder
    const generatedImage = {
      prompt: imagePrompt,
      url: '/placeholder-wechat-cover.jpg', // Replace with actual generated image
      width: 900,
      height: 383, // 公众号封面标准尺寸
    }

    return NextResponse.json({
      success: true,
      image: generatedImage,
      message: '配图生成成功',
    })
  } catch (error) {
    console.error('Failed to generate WeChat image:', error)
    return NextResponse.json(
      { error: '配图生成失败，请稍后重试' },
      { status: 500 }
    )
  }
}

function generateImagePrompt(title: string, content: string, style: string): string {
  const stylePrompts: Record<string, string> = {
    '专业': '专业商务风格，简洁大气，适合科技/财经/职场类文章',
    '温暖': '温暖治愈风格，柔和色调，适合情感/生活/成长类文章',
    '科技感': '未来科技风格，冷色调，适合 AI/科技/创新类文章',
  }

  return `为公众号文章生成封面图：
  
文章标题：${title}

核心内容：${content.substring(0, 100)}...

风格要求：${stylePrompts[style] || stylePrompts['专业']}

尺寸要求：900x383px（公众号封面标准）

设计要点：
- 突出标题文字（留白区域）
- 视觉焦点明确
- 适合手机端浏览
- 符合微信公众号规范`
}
