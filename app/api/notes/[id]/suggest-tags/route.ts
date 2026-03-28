import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai/client'

export async function POST(request: Request) {
  try {
    const { content } = await request.json()
    
    if (!content) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 })
    }
    
    // 调用 AI 生成标签建议
    const prompt = `为以下内容建议 3-5 个标签，只返回 JSON 数组格式，例如：["成长", "学习", "工作"]\n\n${content.substring(0, 1000)}`
    const result = await callAI(prompt, '你是一个专业的内容分析助手，擅长提取关键词和标签。')
    
    if (!result) {
      return NextResponse.json({ tags: [] })
    }
    
    // 解析 AI 返回的 JSON
    try {
      const tags = JSON.parse(result.replace(/```json|```/g, '').trim())
      return NextResponse.json({ tags: Array.isArray(tags) ? tags : [] })
    } catch {
      // 如果解析失败，尝试从文本中提取
      const extracted = result.match(/["'](.*?)["']/g)?.map((s: string) => s.replace(/["']/g, '')) || []
      return NextResponse.json({ tags: extracted })
    }
  } catch (error) {
    console.error('Tag suggestion API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
