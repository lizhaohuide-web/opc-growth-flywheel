import { NextRequest, NextResponse } from 'next/server'

/**
 * 公众号封面图生成 API
 * 
 * 使用通义万相 qwen-image-2.0-pro
 * 尺寸：900*383（公众号封面比例）
 */

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY
const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, summary, style } = body

    if (!title) {
      return NextResponse.json(
        { error: '缺少必要参数：title' },
        { status: 400 }
      )
    }

    console.log('🎨 生成公众号封面图:', { title, style })

    // 构建封面图提示词
    const prompt = `创建一张微信公众号文章封面图，专业精美，有吸引力。

## 📝 画面内容
**文章标题**: ${title}
${summary ? `**文章摘要**: ${summary}` : ''}

## 🎨 视觉风格
${getStyleDescription(style || 'professional')}

## 📐 构图要求
- **图片尺寸**: 900*383 像素（微信公众号封面标准比例）
- **图片方向**: 横版 (Landscape)
- **质量**: 高质量，细节丰富，专业级
- **文字**: 标题文字清晰可读，位置合理

## ⭐ 核心原则
- 简洁大气，突出主题
- 色彩搭配和谐
- 有视觉焦点
- 适合移动端展示
- 避免过于复杂的细节
- 文字与背景对比明显`

    // 调用通义万相 API
    let response: Response | undefined
    let retryCount = 0
    const maxRetries = 3
    
    while (retryCount < maxRetries) {
      response = await fetch(`${DASHSCOPE_BASE_URL}/services/aigc/multimodal-generation/generation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen-image-2.0-pro',
          input: {
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: prompt,
                  },
                ],
              },
            ],
          },
          parameters: {
            size: '900*383',
            n: 1,
          },
        }),
      })
      
      // 如果是速率限制错误，等待后重试
      if (response!.status === 429 && retryCount < maxRetries - 1) {
        retryCount++
        console.log(`⏳ 速率限制，等待${retryCount * 2}秒后重试...`)
        await new Promise(resolve => setTimeout(resolve, retryCount * 2000))
      } else {
        break
      }
    }

    console.log('API 响应状态:', response!.status)

    const responseText = await response!.text()
    console.log('API 响应:', responseText.substring(0, 500))

    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.error('解析 JSON 失败:', e)
      return NextResponse.json(
        { error: 'API 返回格式错误', responseText: responseText.substring(0, 500) },
        { status: 500 }
      )
    }

    if (!response!.ok) {
      console.error('API 错误:', data)
      const errorMessage = data.output?.text || data.message?.message || data.message || '生成封面图失败'
      throw new Error(errorMessage)
    }
    
    // qwen-image-2.0-pro 返回格式
    const imageUrl = data.output?.choices?.[0]?.message?.content?.[0]?.image ||
                     data.output?.choices?.[0]?.message?.content?.[0]?.image_url ||
                     data.output?.image
    
    if (imageUrl) {
      console.log('✅ 封面图生成成功:', imageUrl)
      return NextResponse.json({
        success: true,
        imageUrl,
      })
    } else {
      console.error('未找到图片 URL:', data)
      throw new Error('未返回图片 URL')
    }
  } catch (error) {
    console.error('封面图生成失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成封面图失败' },
      { status: 500 }
    )
  }
}

function getStyleDescription(style: string): string {
  const styles: Record<string, string> = {
    professional: `**配色**: 深蓝色、灰色、白色，专业稳重
**元素**: 几何图形、线条、商务图标
**字体**: 简洁有力的无衬线字体
**氛围**: 专业、权威、可信赖`,
    
    warm: `**配色**: 暖黄色、橙色、米色，温暖柔和
**元素**: 阳光、光晕、温暖纹理
**字体**: 圆润温暖的手写体
**氛围**: 温暖、治愈、有亲和力`,
    
    tech: `**配色**: 蓝紫色、青色、黑色，科技感
**元素**: 电路板、数据流、未来感图形
**字体**: 现代科技字体
**氛围**: 前沿、创新、未来感`,
  }
  
  return styles[style] || styles.professional
}
