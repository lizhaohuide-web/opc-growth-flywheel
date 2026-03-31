import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompts, targetLang } = body

    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return NextResponse.json(
        { error: '缺少必要参数：prompts' },
        { status: 400 }
      )
    }

    const sourceLang = targetLang === 'zh' ? '英文' : '中文'
    const targetLangName = targetLang === 'zh' ? '中文' : '英文'

    const systemPrompt = `你是一位专业的翻译专家，擅长 AI 绘画提示词的翻译。
请将提示词从${sourceLang}翻译成${targetLangName}，保持专业术语的准确性。`

    const userPrompt = `请将以下${prompts.length}条 AI 绘画提示词从${sourceLang}翻译成${targetLangName}：

## 原文
${prompts.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')}

## 翻译要求
1. 保持 AI 绘画提示词的专业格式
2. 保留关键术语（如 Hand-drawn, Portrait, Aspect Ratio 等）
3. 保持提示词的结构和层次
4. 翻译要准确、流畅、专业

## 输出格式
直接返回 JSON 数组，格式：
["翻译后的提示词 1", "翻译后的提示词 2", ...]

不要包含任何额外解释。`

    const result = await callAI(userPrompt, systemPrompt)

    // 解析翻译结果
    let translatedPrompts: string[] = []
    try {
      const jsonMatch = result.match(/\[([\s\S]*?)\]/)
      if (jsonMatch) {
        translatedPrompts = JSON.parse(jsonMatch[0])
      } else {
        // 如果不是 JSON 格式，按行分割
        translatedPrompts = result.split('\n').filter(line => line.trim().length > 0)
      }
    } catch (e) {
      console.error('解析翻译结果失败:', e)
      translatedPrompts = prompts // 返回原文
    }

    // 确保数量一致
    if (translatedPrompts.length !== prompts.length) {
      console.warn('翻译后数量不一致，使用原文')
      translatedPrompts = prompts
    }

    return NextResponse.json({
      success: true,
      translatedPrompts,
      sourceLang: targetLang === 'zh' ? 'en' : 'zh',
      targetLang,
    })
  } catch (error) {
    console.error('Translation failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '翻译失败' },
      { status: 500 }
    )
  }
}
