import { NextRequest, NextResponse } from 'next/server'

/**
 * 生成单张配图 API
 * 
 * 使用通义万相 qwen-image-2.0-pro 生成单张图片
 * 尺寸：900*500（公众号文中配图比例）
 */

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY
const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt } = body

    if (!prompt) {
      return NextResponse.json(
        { error: '缺少必要参数：prompt' },
        { status: 400 }
      )
    }

    console.log('🎨 生成单张配图')
    console.log('📝 提示词:', prompt.substring(0, 100) + '...')

    const result = await generateIllustration(prompt)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        imageUrl: result.imageUrl,
      })
    } else {
      return NextResponse.json(
        { error: result.error || '生成失败' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('配图生成失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成失败' },
      { status: 500 }
    )
  }
}

/**
 * 生成配图（调用通义万相）
 */
export async function generateIllustration(prompt: string): Promise<{
  success: boolean
  imageUrl?: string
  error?: string
}> {
  try {
    console.log('🎨 调用通义万相生成图片')

    let response
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
            size: '900*500',
            n: 1,
          },
        }),
      })
      
      if (response.status === 429 && retryCount < maxRetries - 1) {
        retryCount++
        console.log(`⏳ 速率限制，等待${retryCount * 2}秒后重试...`)
        await new Promise(resolve => setTimeout(resolve, retryCount * 2000))
      } else {
        break
      }
    }

    const responseText = await response.text()
    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      throw new Error('API 返回格式错误')
    }

    if (!response.ok) {
      const errorMessage = data.output?.text || data.message?.message || data.message || '生成失败'
      throw new Error(errorMessage)
    }
    
    const imageUrl = data.output?.choices?.[0]?.message?.content?.[0]?.image ||
                     data.output?.choices?.[0]?.message?.content?.[0]?.image_url ||
                     data.output?.image
    
    if (imageUrl) {
      console.log('✅ 配图生成成功:', imageUrl)
      return { success: true, imageUrl }
    } else {
      throw new Error('未返回图片 URL')
    }
  } catch (error) {
    console.error('配图生成失败:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '生成失败' 
    }
  }
}
