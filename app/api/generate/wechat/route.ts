import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai/client'

export async function POST(request: Request) {
  try {
    console.log('📨 公众号生成 API 收到请求')
    
    const { content, title } = await request.json()
    console.log('📝 请求数据:', { 
      title, 
      contentLength: content?.length 
    })
    
    if (!content) {
      console.error('❌ 内容为空')
      return NextResponse.json({ error: '笔记内容为空' }, { status: 400 })
    }
    
    // 调用 AI 生成公众号文章
    const prompt = `将以下笔记改写成微信公众号文章风格：
    
要求：
1. 标题吸引人，符合新媒体传播特点
2. 开头有吸引力的引子
3. 结构清晰，使用小标题
4. 语言生动，有金句
5. 结尾有总结和行动号召
6. 字数 1500-2000 字

笔记内容：
${title ? `标题：${title}\n` : ''}
${content.substring(0, 3000)}`

    console.log('🤖 开始调用 AI...')
    const article = await callAI(prompt, '你是一个专业的新媒体编辑，擅长将普通内容改写成爆款公众号文章。')
    console.log('✅ AI 调用成功，文章长度:', article?.length)
    
    if (!article) {
      console.error('❌ AI 返回空结果')
      return NextResponse.json({ error: 'AI 生成失败，返回空结果' }, { status: 500 })
    }
    
    return NextResponse.json({ article })
  } catch (error) {
    console.error('❌ 公众号生成 API 错误:', error)
    const errorMessage = error instanceof Error ? error.message : '服务器内部错误'
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}
