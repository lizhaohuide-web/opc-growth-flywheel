import { createClient } from '@/lib/supabase/server'
import { callAI } from '@/lib/ai/unified-client'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { noteId, style } = body

    if (!noteId) {
      return NextResponse.json(
        { error: '缺少必要参数：noteId' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .eq('user_id', session.user.id)
      .single()

    if (noteError || !note) {
      return NextResponse.json(
        { error: '笔记不存在' },
        { status: 404 }
      )
    }

    const systemPrompt = `你是一位朋友圈文案专家，擅长把复杂内容变成轻松有趣的生活分享。

## 朋友圈核心规则
- 前 15 字决定停留率
- 生活化 > 营销感
- 真实情感 > 华丽辞藻
- 互动率 = 评论数/曝光数

## 朋友圈结构
[开头] 一句话吸引（15 字内，制造好奇/共鸣）
[正文] 2-3 句生活化表达（具体场景/感受）
[结尾] 互动引导或金句收尾

## 文案要求
- 50-150 字最佳
- emoji 2-4 个（自然点缀，不要堆砌）
- 口语化，像跟朋友聊天
- 去掉无用的标点符号
- 适合配 1-9 张图片

## 风格说明
${getStyleDescription(style)}

请根据以上规则，将以下笔记改写成朋友圈文案。`

    const prompt = `${systemPrompt}

原始笔记内容：
标题：${note.title || '无标题'}
${note.content?.substring(0, 3000) || ''}

请生成朋友圈文案（直接输出文案，不要解释）：`
    
    console.log('🤖 [朋友圈] 开始生成:', { style, noteId })
    const generatedContent = await callAI(prompt, { systemPrompt: '' })
    console.log('✅ [朋友圈] 生成成功，长度:', generatedContent?.length)
    
    return NextResponse.json({
      success: true,
      content: generatedContent,
    })
  } catch (error) {
    console.error('[朋友圈] 生成失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成失败，请稍后重试' },
      { status: 500 }
    )
  }
}

function getStyleDescription(style?: string): string {
  const styles: Record<string, string> = {
    '走心感悟': '走心感悟型：真诚分享内心感受，引发情感共鸣，适合深夜思考、成长感悟',
    '日常分享': '日常分享型：记录生活小确幸，轻松自然，适合美食、旅行、日常碎片',
    '鸡汤励志': '鸡汤励志型：正能量满满，鼓舞人心，适合早起打卡、健身、学习进步',
    '幽默段子': '幽默段子型：有趣好玩，让人会心一笑，适合吐槽、自嘲、生活趣事',
    '知识干货': '知识干货型：分享有价值信息，简洁有用，适合学习笔记、技能分享',
  }
  return styles[style || '日常分享'] || styles['日常分享']
}
