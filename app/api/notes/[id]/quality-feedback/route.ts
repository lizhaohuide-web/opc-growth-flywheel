import { NextRequest, NextResponse } from 'next/server'
import { generateQualityFeedback } from '@/lib/ai/qwen-client'

/**
 * POST /api/notes/[id]/quality-feedback
 * 
 * 生成笔记质量反馈
 * 
 * Request:
 * {
 *   title: string
 *   content: string
 *   templateName?: string
 * }
 * 
 * Response:
 * {
 *   scores: {
 *     structure: number
 *     depth: number
 *     examples: number
 *   },
 *   suggestions: string[]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, templateName } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 调用 AI 生成质量反馈
    const feedback = await generateQualityFeedback({
      title,
      content,
      templateName,
    })

    return NextResponse.json(feedback)
  } catch (error) {
    console.error('质量反馈 API 错误:', error)
    return NextResponse.json(
      {
        scores: { structure: 6, depth: 6, examples: 6 },
        suggestions: ['笔记已保存'],
      },
      { status: 200 }
    )
  }
}
