import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai/client'

export async function POST(request: Request) {
  try {
    const { content } = await request.json()
    
    if (!content) {
      return NextResponse.json({ error: '内容为空' }, { status: 400 })
    }
    
    // 优化后的知识链接提示词
    const prompt = `你是一位专业的学习资源推荐专家。请根据以下内容，推荐 3-5 个相关的专业知识学习资源。

## 要求
1. **相关性**：资源必须与内容主题高度相关
2. **多样性**：包含书籍、文章、课程等不同类型
3. **实用性**：优先推荐实用性强、评价高的资源
4. **格式**：返回 JSON 数组

## 输出格式
[
  {
    "title": "资源标题",
    "type": "书籍/文章/课程/视频",
    "reason": "推荐理由（20 字以内）",
    "search": "搜索关键词"
  }
]

## 内容
${content.substring(0, 1000)}`

    console.log('📚 生成知识链接...')
    const result = await callAI(prompt, '你是一位专业的学习资源推荐专家，擅长根据内容推荐高质量学习资源。只返回 JSON 数组。')
    
    try {
      const links = JSON.parse(result.replace(/```json|```/g, '').trim())
      return NextResponse.json({ links: Array.isArray(links) ? links : [] })
    } catch {
      console.warn('⚠️ 知识链接解析失败')
      return NextResponse.json({ links: [] })
    }
  } catch (error) {
    console.error('知识链接 API 错误:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '生成失败',
      links: []
    }, { status: 500 })
  }
}
