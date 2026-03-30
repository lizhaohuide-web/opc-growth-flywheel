import { NextRequest, NextResponse } from 'next/server'
import { generateAIQuestion } from '@/lib/ai/qwen-client'

/**
 * POST /api/notes/ai-question
 * 
 * 生成 AI 追问
 * 
 * Request:
 * {
 *   templateName: string
 *   fieldName: string
 *   userAnswer: string
 *   previousAnswers?: Record<string, string>
 * }
 * 
 * Response:
 * {
 *   question: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { templateName, fieldName, userAnswer, previousAnswers } = body

    if (!templateName || !fieldName || !userAnswer) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 调用 AI 生成追问
    const question = await generateAIQuestion({
      templateName,
      fieldName,
      userAnswer,
      previousAnswers,
    })

    if (!question) {
      return NextResponse.json(
        { question: '' },
        { status: 200 }
      )
    }

    return NextResponse.json({ question })
  } catch (error) {
    console.error('AI 追问 API 错误:', error)
    return NextResponse.json(
      { error: 'AI 追问生成失败' },
      { status: 500 }
    )
  }
}
