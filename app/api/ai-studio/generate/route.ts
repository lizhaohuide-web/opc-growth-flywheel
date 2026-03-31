import { createClient } from '@/lib/supabase/server'
import { callAI } from '@/lib/ai/client'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { noteId, platform, style } = body

    if (!noteId || !platform) {
      return NextResponse.json(
        { error: '缺少必要参数：noteId 和 platform' },
        { status: 400 }
      )
    }

    // 从数据库获取笔记
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
      console.error('笔记不存在:', noteError, 'noteId:', noteId)
      return NextResponse.json(
        { error: '笔记不存在' },
        { status: 404 }
      )
    }

    // 获取平台提示词
    const promptTemplate = getPlatformPrompt(platform, style)
    
    // 调用 AI 生成内容
    const systemPrompt = getSystemPrompt(platform)
    const prompt = `${promptTemplate}\n\n原始笔记内容：\n标题：${note.title || '无标题'}\n${note.content?.substring(0, 3000) || ''}`
    
    console.log('🤖 开始生成:', { platform, style, noteId })
    let generatedContent = await callAI(prompt, systemPrompt)
    console.log('✅ 生成成功，长度:', generatedContent?.length)
    
    // 清理 Markdown 格式符号，保留纯文本
    generatedContent = cleanMarkdownSymbols(generatedContent)

    // 只返回生成的内容，不保存到数据库（保存由前端在最后一步执行）
    return NextResponse.json({
      success: true,
      content: generatedContent,
    })
  } catch (error) {
    console.error('生成失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成失败，请稍后重试' },
      { status: 500 }
    )
  }
}

function getPlatformPrompt(platform: string, style?: string): string {
  const prompts: Record<string, string> = {
    wechat: `你是一位公众号爆款文案专家。请将以下笔记改写成公众号文章。

## 公众号核心规则
- 标题吸引力决定打开率
- 开头 3 句话决定读完率
- 价值密度 > 情感共鸣 > 信息量

## 文章结构
1. 标题：3 个备选（数字 + 痛点/反差 + 悬念/身份 + 利益）
2. 开头：制造共鸣/冲突/颠覆认知
3. 正文：分点论述，每段 3-5 行
4. 结尾：总结 + 行动号召 + 互动引导

## 要求
- 去掉无用的标点符号
- 语言口语化
- 多用加粗标记重点`,

    xiaohongshu: `你是一位小红书爆款文案专家。请将以下笔记改写成小红书文案。

## 小红书核心规则
- 标题 20 字内，含 emoji
- 正文 300-600 字，短句为主
- 第一人称日记体

## 结构
[开头] 痛点共鸣 + emoji
[经历] 具体故事/场景
[方法] 分点说明
[结果] 数据/变化展示
[互动] 提问引导评论

## 要求
- 去掉无用的标点符号
- 每段 2-3 句，多用 emoji
- 像闺蜜聊天`,

    wechat_moments: `你是一位朋友圈文案高手。请将以下笔记改写成朋友圈文案。

## 朋友圈核心规则
- 前 15 字决定停留
- 生活化 > 营销感
- 互动率 = 评论数/曝光数

## 结构
[开头] 一句话吸引（15 字内）
[正文] 2-3 句生活化表达
[结尾] 互动引导或金句

## 要求
- 50-150 字
- emoji 2-4 个
- 去掉无用的标点符号
- 口语化`,

    short_video: `你是一位短视频口播文案专家。请将以下笔记改写成 60-90 秒口播文案。

## 短视频核心规则
- 前 3 秒完播率≥70%
- 每 15 秒一个情绪转折点

## 结构
【0-3 秒】黄金开头（反常识/提问/数字冲击）
【3-15 秒】引出问题
【15-50 秒】核心内容（2-3 个要点）
【50-70 秒】总结升华
【70-90 秒】引导互动

## 要求
- 标注秒数和语气
- 口语化
- 去掉无用的标点符号`,

    podcast: `你是一位专业播客制作人。请将以下笔记改写成 10-15 分钟双人对话播客脚本。

## 播客结构
【开场音乐】10 秒
【开场白】30 秒
【引入】2 分钟（故事/新闻切入）
【主体】8-10 分钟（3-4 个段落）
【升华】1-2 分钟
【结尾】30 秒

## 角色
- 主持人 A：专业/理性
- 主持人 B：好奇/提问

## 要求
- 对话感强
- 标注语气变化
- 去掉无用的标点符号`,
  }

  return prompts[platform] || prompts.wechat
}

function getSystemPrompt(platform: string): string {
  const prompts: Record<string, string> = {
    wechat: '你是一位 10 万 + 公众号爆文操盘手，精通微信生态内容算法。',
    xiaohongshu: '你是小红书 CES 算法专家，深谙种草文案的底层逻辑。',
    wechat_moments: '你是朋友圈文案专家，擅长把复杂内容变成轻松有趣的生活分享。',
    short_video: '你是抖音/视频号口播文案专家，精通短视频完播率算法。',
    podcast: '你是播客制作人，擅长创作有深度、有温度、有节奏感的播客脚本。',
  }
  return prompts[platform] || '你是一个专业的内容改写助手。'
}

// 清理 Markdown 格式符号，保留纯文本
function cleanMarkdownSymbols(text: string): string {
  let cleaned = text
  
  // 移除粗体标记 **text** 和 __text__
  cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, '$1')
  cleaned = cleaned.replace(/__(.+?)__/g, '$1')
  
  // 移除斜体标记 *text* 和 _text_
  cleaned = cleaned.replace(/\*(.+?)\*/g, '$1')
  cleaned = cleaned.replace(/_(.+?)_/g, '$1')
  
  // 移除删除线标记 ~~text~~
  cleaned = cleaned.replace(/~~(.+?)~~/g, '$1')
  
  // 移除代码块标记 ```code```
  cleaned = cleaned.replace(/```[\s\S]*?```/g, (match) => {
    return match.replace(/```/g, '').trim()
  })
  
  // 移除行内代码标记 `code`
  cleaned = cleaned.replace(/`(.+?)`/g, '$1')
  
  // 移除标题标记 # 
  cleaned = cleaned.replace(/^#+\s+/gm, '')
  
  // 移除引用标记 >
  cleaned = cleaned.replace(/^>\s+/gm, '')
  
  // 移除列表标记 - * +
  cleaned = cleaned.replace(/^[\-\*\+]\s+/gm, '')
  
  // 移除数字列表标记 1. 2. 等
  cleaned = cleaned.replace(/^\d+\.\s+/gm, '')
  
  // 移除链接标记 [text](url)
  cleaned = cleaned.replace(/\[(.+?)\]\(.+?\)/g, '$1')
  
  // 移除图片标记 ![alt](url)
  cleaned = cleaned.replace(/!\[(.+?)\]\(.+?\)/g, '$1')
  
  // 移除多余的空行（超过 2 个连续空行）
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
  
  // 移除每行首尾的空格
  cleaned = cleaned.split('\n').map(line => line.trim()).join('\n')
  
  return cleaned.trim()
}
