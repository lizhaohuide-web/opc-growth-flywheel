import { createClient } from '@/lib/supabase/server'
import { callAI } from '@/lib/ai/unified-client'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { noteId, format, duration } = body

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

    const formatName = format || '对话'
    const durationName = duration || '10 分钟'

    const systemPrompt = `你是一位专业播客制作人，擅长创作有深度、有温度、有节奏感的播客脚本。

## 播客核心规则
- Hook 在开头 30 秒（说明价值，预告精彩点）
- 一致性胜过完美（保持固定风格）
- 对话感强，自然流畅
- 标注语气变化和停顿

## ${formatName}格式特点
${getFormatDescription(formatName)}

## ${durationName}时长结构
${getDurationStructure(durationName)}

## 输出结构
{
  "title": "节目标题（吸引点击）",
  "opening": "开场白（30 秒内）",
  "outline": ["大纲要点 1", "大纲要点 2", ...],
  "fullScript": "完整逐字稿（包含主持人 A/B 台词）",
  "hostAScript": "主持人 A 完整台词",
  "hostBScript": "主持人 B 完整台词",
  "closing": "结语（30 秒）",
  "duration": "预计时长",
  "tags": ["#标签 1", "#标签 2", ...]
}

请直接输出 JSON 格式，不要其他解释。`

    const prompt = `${systemPrompt}

原始笔记内容：
标题：${note.title || '无标题'}
${note.content?.substring(0, 3000) || ''}

请生成${formatName}播客脚本（${durationName}）：`
    
    console.log('🤖 [播客] 开始生成:', { format: formatName, duration: durationName, noteId })
    const generatedContent = await callAI(prompt, { systemPrompt: '' })
    console.log('✅ [播客] 生成成功')
    
    // 尝试解析 JSON
    let parsed
    try {
      const cleanContent = generatedContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
      parsed = JSON.parse(cleanContent)
    } catch (e) {
      parsed = {
        title: 'AI 生成的播客',
        opening: '欢迎收听本期节目...',
        outline: ['引入话题', '核心内容', '总结升华'],
        fullScript: generatedContent,
        hostAScript: generatedContent,
        hostBScript: '',
        closing: '感谢收听...',
        duration: durationName,
        tags: ['#播客', '#知识分享'],
      }
    }
    
    return NextResponse.json({
      success: true,
      ...parsed,
    })
  } catch (error) {
    console.error('[播客] 生成失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成失败，请稍后重试' },
      { status: 500 }
    )
  }
}

function getFormatDescription(format: string): string {
  const formats: Record<string, string> = {
    '独白': '独白：单人讲述，适合深度内容、个人分享、观点输出，需要较强的表达能力',
    '对话': '对话：双人互动，自然流畅，像朋友聊天，适合大多数话题，听众代入感强',
    '访谈': '访谈：一问一答，嘉宾主导，适合邀请专家、达人、有故事的人',
  }
  return formats[format] || formats['对话']
}

function getDurationStructure(duration: string): string {
  const structures: Record<string, string> = {
    '5 分钟': '5 分钟结构：开场 30 秒 + 引入 1 分钟 + 主体 3 分钟 + 结尾 30 秒（约 800-1000 字）',
    '10 分钟': '10 分钟结构：开场 30 秒 + 引入 2 分钟 + 主体 6-7 分钟 + 结尾 30 秒（约 1500-1800 字）',
    '20 分钟': '20 分钟结构：开场 30 秒 + 引入 3 分钟 + 主体 15 分钟（3-4 个段落）+ 结尾 1 分钟（约 3000-3500 字）',
  }
  return structures[duration] || structures['10 分钟']
}
