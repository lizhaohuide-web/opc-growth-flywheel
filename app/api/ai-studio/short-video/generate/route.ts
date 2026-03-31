import { createClient } from '@/lib/supabase/server'
import { callAI } from '@/lib/ai/unified-client'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { noteId, platform, videoType } = body

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

    const platformName = platform || '抖音'
    const typeName = videoType || '口播'

    const systemPrompt = `你是一位${platformName}短视频口播文案专家，精通短视频完播率算法。

## 短视频核心规则
- 前 3 秒完播率≥70%（黄金开头）
- 每 15 秒一个情绪转折点
- 信息密度适中，不要太密
- 口语化，适合朗读

## ${platformName}平台特点
${getPlatformDescription(platformName)}

## ${typeName}类型特点
${getTypeDescription(typeName)}

## 输出结构
{
  "title": "视频标题（20 字内，吸引点击）",
  "script": "完整口播文案（标注秒数和语气）",
  "scenes": ["分镜 1", "分镜 2", ...],
  "subtitles": "字幕文案（精简版，适合视频字幕）",
  "tags": ["#标签 1", "#标签 2", ...],
  "bgm": "BGM 建议",
  "coverSuggestion": "封面建议"
}

请直接输出 JSON 格式，不要其他解释。`

    const prompt = `${systemPrompt}

原始笔记内容：
标题：${note.title || '无标题'}
${note.content?.substring(0, 3000) || ''}

请生成${platformName}${typeName}短视频脚本：`
    
    console.log('🤖 [短视频] 开始生成:', { platform: platformName, type: typeName, noteId })
    const generatedContent = await callAI(prompt, { systemPrompt: '' })
    console.log('✅ [短视频] 生成成功')
    
    // 尝试解析 JSON
    let parsed
    try {
      // 清理可能的 Markdown 代码块标记
      const cleanContent = generatedContent
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim()
      
      // 提取 JSON 对象
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('未找到 JSON 格式')
      }
    } catch (e) {
      console.error('解析 JSON 失败:', e)
      // 如果解析失败，清理 JSON 标记后返回
      const cleanScript = generatedContent
        .replace(/^\{[\s\S]*\}$/, '') // 移除完整的 JSON 对象
        .replace(/["\[\]{}]/g, '') // 移除 JSON 符号
        .replace(/(title|script|scenes|subtitles|tags|bgm|coverSuggestion):/g, '') // 移除字段名
        .split('\n')
        .filter(line => line.trim())
        .join('\n')
        .trim()
      
      parsed = {
        title: 'AI 生成的标题',
        script: cleanScript || '请手动编辑脚本内容',
        scenes: [],
        subtitles: cleanScript.substring(0, 200) || '请手动编辑字幕',
        tags: ['#短视频', '#知识分享'],
        bgm: '轻快背景音乐',
        coverSuggestion: '标题大字 + 人物表情',
      }
    }
    
    return NextResponse.json({
      success: true,
      ...parsed,
    })
  } catch (error) {
    console.error('[短视频] 生成失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成失败，请稍后重试' },
      { status: 500 }
    )
  }
}

function getPlatformDescription(platform: string): string {
  const platforms: Record<string, string> = {
    '抖音': '抖音：节奏快、前 3 秒定生死、BGM 重要、适合 15-60 秒、年轻用户为主',
    '视频号': '视频号：社交推荐、熟人传播、适合 30-90 秒、中年用户较多、内容偏实用',
    'B 站': 'B 站：社区氛围浓、用户粘性高、适合 1-5 分钟、知识区/生活区热门、弹幕文化',
  }
  return platforms[platform] || platforms['抖音']
}

function getTypeDescription(type: string): string {
  const types: Record<string, string> = {
    '口播': '口播：一人面对镜头讲述，重点在文案和表达，适合知识分享、观点输出',
    'vlog': 'Vlog：记录日常生活，真实自然，适合旅行、探店、一天生活记录',
    '教程': '教程：分步骤教学，清晰易懂，适合技能教学、软件操作、手工 DIY',
    '故事': '故事：有情节有起伏，引人入胜，适合个人经历、案例分享、情景剧',
  }
  return types[type] || types['口播']
}
