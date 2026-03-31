import { NextRequest, NextResponse } from 'next/server'

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, style, index } = body

    if (!prompt) {
      return NextResponse.json(
        { error: '缺少必要参数：prompt' },
        { status: 400 }
      )
    }

    console.log(`🎨 生成朋友圈配图 #${index + 1}:`, { style })

    // 朋友圈固定使用 1024*1024 方图
    const size = '1024*1024'
    
    // 调用通义千问图像生成 API (qwen-image-2.0-pro)
    // 添加重试逻辑
    let response
    let retryCount = 0
    const maxRetries = 3
    
    while (retryCount < maxRetries) {
      const res = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
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
            size: size,
            n: 1,
          },
        }),
      })
      response = res
      
      // 如果是速率限制错误，等待后重试
      if (response.status === 429 && retryCount < maxRetries - 1) {
        retryCount++
        console.log(`⏳ 速率限制，等待${retryCount * 2}秒后重试...`)
        await new Promise(resolve => setTimeout(resolve, retryCount * 2000))
      } else {
        break
      }
    }

    console.log('API 响应状态:', response!.status)

    // 获取原始响应
    const responseText = await response!.text()
    console.log('API 响应:', responseText.substring(0, 500))

    // 尝试解析 JSON
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
      const errorMessage = data.output?.text || data.message?.message || data.message || '生成图片失败'
      throw new Error(errorMessage)
    }
    
    // qwen-image-2.0-pro 返回格式：
    // { output: { choices: [{ message: { content: [{ type: 'image', image: 'url' }] } }] } }
    const imageUrl = data.output?.choices?.[0]?.message?.content?.[0]?.image ||
                     data.output?.choices?.[0]?.message?.content?.[0]?.image_url ||
                     data.output?.image
    
    if (imageUrl) {
      console.log(`朋友圈配图 #${index + 1}生成成功：${imageUrl}`)
      return NextResponse.json({
        success: true,
        imageUrl,
        index,
      })
    } else {
      console.error('未找到图片 URL:', data)
      throw new Error('未返回图片 URL')
    }
  } catch (error) {
    console.error('Failed to generate image:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成图片失败' },
      { status: 500 }
    )
  }
}
