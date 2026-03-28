import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai/client'

export async function POST(request: Request) {
  try {
    console.log('📨 小红书生成 API 收到请求')
    
    const body = await request.json()
    console.log('📝 请求体:', JSON.stringify(body, null, 2))
    
    const { content, title } = body
    
    if (!content) {
      console.error('❌ 内容为空')
      return NextResponse.json({ error: '笔记内容为空' }, { status: 400 })
    }
    
    // 调用 AI 生成小红书文案
    const prompt = `将以下笔记改写成小红书风格文案：
    
要求：
1. 标题包含 emoji，吸引眼球（20 字以内）
2. 正文轻松活泼，有亲和力
3. 使用 emoji 点缀（每段 2-3 个）
4. 分点说明，清晰易读
5. 结尾添加相关话题标签（5-8 个）
6. 总字数 300-500 字

笔记内容：
${title ? `标题：${title}\n` : ''}
${content.substring(0, 2000)}`

    console.log('🤖 开始调用 AI，prompt 长度:', prompt.length)
    const result = await callAI(prompt, '你是小红书爆款文案专家，擅长创作高互动率的种草内容。')
    console.log('✅ AI 调用成功，结果长度:', result?.length)
    
    if (!result) {
      console.error('❌ AI 返回空结果')
      return NextResponse.json({ error: 'AI 生成失败，返回空结果' }, { status: 500 })
    }
    
    return NextResponse.json({ result })
  } catch (error) {
    console.error('❌ 小红书生成 API 错误:', error)
    console.error('错误堆栈:', error instanceof Error ? error.stack : 'N/A')
    
    const errorMessage = error instanceof Error ? error.message : '服务器内部错误'
    const errorDetails = process.env.NODE_ENV === 'development' ? {
      stack: error instanceof Error ? error.stack : undefined,
      error: String(error)
    } : undefined
    
    return NextResponse.json({ 
      error: errorMessage,
      ...errorDetails
    }, { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
