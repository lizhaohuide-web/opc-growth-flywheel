import { NextRequest, NextResponse } from 'next/server'

const QWEN_API_KEY = process.env.QWEN_API_KEY || 'sk-sp-f18e0636b4c34b02a89167a2d5730758'
const QWEN_BASE_URL = 'https://coding.dashscope.aliyuncs.com/v1'
const QWEN_MODEL = 'qwen3.5-plus'

/**
 * POST /api/notes/auto-format
 * 
 * AI 智能排版笔记内容
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json(
        { error: '缺少内容' },
        { status: 400 }
      )
    }

    // 调用 AI 进行智能排版
    const response = await fetch(`${QWEN_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${QWEN_API_KEY}`,
      },
      body: JSON.stringify({
        model: QWEN_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a professional Markdown formatting expert. Format the content with proper headers, paragraphs, lists, and emphasis. Return only the formatted Markdown.'
          },
          {
            role: 'user',
            content: 'Format this content:\n\n' + content
          }
        ],
        temperature: 0.5,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`)
    }

    const data = await response.json()
    const formatted = data.choices?.[0]?.message?.content?.trim() || content

    return NextResponse.json({ formatted })
  } catch (error) {
    console.error('Auto-format API error:', error)
    
    // Fallback to basic formatting
    try {
      const body = await request.json()
      const { content } = body
      
      let formatted = content
      formatted = formatted.replace(/\n{3,}/g, '\n\n')
      formatted = formatted.replace(/([^\n])\n([-*+]\s)/g, '$1\n\n$2')
      formatted = formatted.trim() + '\n'
      
      return NextResponse.json({ formatted, note: 'AI failed, using basic formatting' })
    } catch {
      return NextResponse.json(
        { error: 'Formatting failed' },
        { status: 500 }
      )
    }
  }
}
