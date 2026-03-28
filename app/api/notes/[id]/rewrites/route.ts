import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET: 获取笔记的 AI 改写缓存
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notes')
    .select('ai_rewrites')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rewrites: data?.ai_rewrites || {} })
}

// PUT: 保存某个平台的改写结果
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { platform, content } = await request.json()

  if (!platform || !content) {
    return NextResponse.json({ error: '缺少参数' }, { status: 400 })
  }

  // 先读取现有数据
  const { data: note } = await supabase
    .from('notes')
    .select('ai_rewrites')
    .eq('id', params.id)
    .single()

  const rewrites = { ...(note?.ai_rewrites || {}), [platform]: content }

  const { error } = await supabase
    .from('notes')
    .update({ ai_rewrites: rewrites })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
