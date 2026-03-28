import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callAI } from '@/lib/ai/client'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 获取笔记内容
    const { data: note } = await supabase
      .from('notes')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single()
    
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }
    
    // 调用 AI 生成摘要
    const prompt = `请为以下笔记生成 100-200 字的摘要，要求简洁明了，突出核心观点：\n\n${note.content}`
    const summary = await callAI(prompt)
    
    if (!summary) {
      return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
    }
    
    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Summarize API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
