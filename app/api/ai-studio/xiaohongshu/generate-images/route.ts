import { NextRequest, NextResponse } from 'next/server'

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY
const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompts, style } = body

    if (!prompts || !Array.isArray(prompts)) {
      return NextResponse.json(
        { error: '缺少必要参数：prompts' },
        { status: 400 }
      )
    }

    console.log('🎨 开始生成图片:', { count: prompts.length, style })

    const images: string[] = []
    let firstImageUrl = ''

    // 依次生成每张图片
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i]
      console.log(`生成第${i + 1}张图片...`)

      try {
        // 调用通义万相 API
        const response = await fetch(`${DASHSCOPE_BASE_URL}/images/generations`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'wanx2.0',
            prompt: prompt,
            n: 1,
            size: '1024x1024',
            // 如果是第 2 张及以后的图片，使用第一张图作为参考
            ...(i > 0 && firstImageUrl ? { image: firstImageUrl } : {}),
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error(`通义万相 API 错误:`, errorData)
          throw new Error(errorData.message || '生成图片失败')
        }

        const data = await response.json()
        
        // 通义万相返回格式
        const imageUrl = data.data?.[0]?.url || data.images?.[0]?.url
        
        if (imageUrl) {
          if (i === 0) {
            firstImageUrl = imageUrl // 保存第一张图用于后续参考
          }
          images.push(imageUrl)
          console.log(`第${i + 1}张图片生成成功：${imageUrl}`)
        } else {
          console.warn(`第${i + 1}张图片未返回 URL，使用占位图`)
          images.push('') // 使用空字符串作为占位
        }
      } catch (error) {
        console.error(`第${i + 1}张图片生成失败:`, error)
        images.push('') // 失败时使用空字符串
      }
    }

    console.log('✅ 所有图片生成完成')

    return NextResponse.json({
      success: true,
      images,
    })
  } catch (error) {
    console.error('Failed to generate images:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成图片失败' },
      { status: 500 }
    )
  }
}
