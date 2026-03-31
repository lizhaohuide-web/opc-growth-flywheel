import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai/unified-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { noteContent, customPrompt } = body

    if (!customPrompt) {
      return NextResponse.json(
        { error: '缺少必要参数：customPrompt' },
        { status: 400 }
      )
    }

    console.log('📝 自定义文案生成:', { 
      hasNoteContent: !!noteContent, 
      noteContentLen: noteContent?.length || 0,
      promptLen: customPrompt.length 
    })

    // 构建提示词
    let prompt = customPrompt
    
    // 如果有笔记内容，作为上下文添加
    if (noteContent && noteContent.trim()) {
      prompt = `请根据以下笔记内容进行创作：

---
${noteContent}
---

创作要求：
${customPrompt}`
    }

    // 调用 AI 生成
    const content = await callAI(prompt, {
      systemPrompt: '你是一个专业的内容创作助手，擅长根据用户需求改写、优化、创作各种风格的内容。请理解用户的创作意图，输出高质量的内容。',
      temperature: 0.7,
      maxTokens: 4096,
    })

    console.log('✅ 文案生成成功，长度:', content.length)

    return NextResponse.json({
      success: true,
      content: content,
    })
  } catch (error) {
    console.error('Failed to generate custom content:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成内容失败' },
      { status: 500 }
    )
  }
}
