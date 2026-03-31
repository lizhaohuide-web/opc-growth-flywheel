import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { noteId, content, imageCount, style } = body

    if (!noteId || !content || !imageCount) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    console.log('📝 生成朋友圈配图提示词:', { noteId, imageCount, style })

    // 从数据库获取完整笔记内容
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: note } = await supabase
      .from('notes')
      .select('title, content')
      .eq('id', noteId)
      .single()

    const noteContent = note?.content || content

    // 调用通义千问生成图片提示词
    const promptMessages = `你是一位专业的朋友圈配图设计师。请根据以下笔记内容，生成${imageCount}个配图提示词。

笔记内容：
${noteContent}

文案风格：${style}

要求：
1. 每个提示词描述一个适合朋友圈的场景或画面
2. 朋友圈配图应该是生活化、自然、有温度的
3. 提示词要具体，包含画面主体、氛围、色调等细节
4. 适合 1024x1024 的方图构图
5. 返回格式：纯 JSON 数组，每个元素是一个提示词字符串

示例格式：
["提示词 1", "提示词 2", "提示词 3"]

请直接返回 JSON 数组，不要有其他文字。`

    let response
    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
      const res = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen-plus',
          input: {
            messages: [
              {
                role: 'user',
                content: promptMessages,
              },
            ],
          },
          parameters: {
            temperature: 0.7,
            max_tokens: 1000,
          },
        }),
      })
      response = res

      if (response!.status === 429 && retryCount < maxRetries - 1) {
        retryCount++
        console.log(`⏳ 速率限制，等待${retryCount * 2}秒后重试...`)
        await new Promise(resolve => setTimeout(resolve, retryCount * 2000))
      } else {
        break
      }
    }

    if (!response!.ok) {
      const errorText = await response!.text()
      console.error('API 错误:', errorText)
      throw new Error('生成提示词失败')
    }

    const data = await response!.json()
    const aiResponse = data.output?.text || data.output?.choices?.[0]?.message?.content

    if (!aiResponse) {
      throw new Error('AI 未返回内容')
    }

    console.log('AI 响应:', aiResponse.substring(0, 300))

    // 解析 JSON 数组
    let prompts: string[] = []
    try {
      // 尝试提取 JSON 数组
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        prompts = JSON.parse(jsonMatch[0])
      } else {
        // 如果不是 JSON 格式，按行分割
        prompts = aiResponse.split('\n').filter((line: string) => line.trim().length > 0).slice(0, imageCount)
      }
    } catch (e) {
      console.error('解析 JSON 失败:', e)
      // 返回默认提示词
      prompts = Array(imageCount).fill(`根据"${style}"风格，生成一张生活化、有温度的朋友圈配图，画面简洁自然，适合 1024x1024 方图`)
    }

    // 确保提示词数量正确
    if (prompts.length < imageCount) {
      const defaultPrompt = `根据"${style}"风格，生成一张生活化、有温度的朋友圈配图`
      while (prompts.length < imageCount) {
        prompts.push(defaultPrompt)
      }
    }
    prompts = prompts.slice(0, imageCount)

    console.log(`✅ 生成${prompts.length}个提示词`)

    return NextResponse.json({
      prompts,
    })
  } catch (error) {
    console.error('Failed to generate prompts:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成提示词失败' },
      { status: 500 }
    )
  }
}
