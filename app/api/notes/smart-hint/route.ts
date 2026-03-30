import { NextRequest, NextResponse } from 'next/server'
import { generateSmartHint } from '@/lib/ai/qwen-client'

/**
 * POST /api/notes/smart-hint
 * 
 * 生成智能提示
 * 
 * Request:
 * {
 *   content: string
 *   mode: 'free' | 'guided'
 * }
 * 
 * Response:
 * {
 *   hint: string | null
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, mode } = body

    if (!content) {
      return NextResponse.json(
        { error: '缺少内容' },
        { status: 400 }
      )
    }

    // 调用 AI 生成提示
    const hint = await generateSmartHint({
      content,
      mode: mode || 'free',
    })

    return NextResponse.json({ hint: hint || null })
  } catch (error) {
    console.error('智能提示 API 错误:', error)
    return NextResponse.json(
      { hint: null },
      { status: 200 }
    )
  }
}
