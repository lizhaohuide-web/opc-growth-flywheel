import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai/unified-client'
import { createClient } from '@/lib/supabase/server'

/**
 * 公众号文案生成 API
 * 
 * 流程：
 * 1. 从数据库读取笔记内容
 * 2. 根据选择的风格改写为公众号格式
 * 3. 生成标题（3 个备选）+ 摘要 + 正文 + 标签
 */

// 公众号风格定义
const wechatStyles: Record<string, {
  name: string
  description: string
  systemPrompt: string
  promptTemplate: string
}> = {
  professional: {
    name: '专业深度',
    description: '权威、专业、有深度',
    systemPrompt: '你是一位资深公众号编辑，擅长撰写专业深度的行业分析文章。语言严谨、逻辑清晰、有权威性。',
    promptTemplate: `请将以下笔记改写成一篇专业深度的公众号文章。

## 要求
1. **标题**：生成 3 个备选标题，体现专业性和深度
2. **摘要**：100-200 字，概括核心观点
3. **正文结构**：
   - 开头：引入话题，说明重要性
   - 主体：分点论述，每部分有小标题
   - 结尾：总结观点，提出建议或展望
4. **语言风格**：专业、严谨、有深度，适当使用行业术语
5. **字数**：1500-2500 字
6. **格式**：使用 Markdown 格式，合理运用标题、列表、引用等

## 输出格式
请严格按照以下 JSON 格式输出：
{
  "titles": ["标题 1", "标题 2", "标题 3"],
  "summary": "摘要内容",
  "content": "正文内容（Markdown 格式）",
  "tags": ["标签 1", "标签 2", "标签 3"]
}`,
  },
  warm: {
    name: '温暖治愈',
    description: '亲切、温暖、有共鸣',
    systemPrompt: '你是一位温暖治愈系的公众号作者，擅长用亲切的语言讲述有温度的故事。',
    promptTemplate: `请将以下笔记改写成一篇温暖治愈的公众号文章。

## 要求
1. **标题**：生成 3 个备选标题，温暖有感染力
2. **摘要**：100-200 字，引发情感共鸣
3. **正文结构**：
   - 开头：用故事或场景引入
   - 主体：娓娓道来，有情感起伏
   - 结尾：温暖收尾，给读者力量
4. **语言风格**：亲切、温暖、有共鸣，像朋友聊天
5. **字数**：1200-2000 字
6. **格式**：使用 Markdown 格式

## 输出格式
请严格按照以下 JSON 格式输出：
{
  "titles": ["标题 1", "标题 2", "标题 3"],
  "summary": "摘要内容",
  "content": "正文内容（Markdown 格式）",
  "tags": ["标签 1", "标签 2", "标签 3"]
}`,
  },
  tech: {
    name: '科技感',
    description: '前沿、创新、未来感',
    systemPrompt: '你是一位科技类公众号主笔，关注前沿技术和创新趋势，语言富有未来感。',
    promptTemplate: `请将以下笔记改写成一篇科技感十足的公众号文章。

## 要求
1. **标题**：生成 3 个备选标题，突出前沿性和创新性
2. **摘要**：100-200 字，点明技术价值
3. **正文结构**：
   - 开头：技术背景或趋势引入
   - 主体：技术解析、应用场景、案例分析
   - 结尾：未来展望
4. **语言风格**：前沿、创新、有洞察力
5. **字数**：1500-2500 字
6. **格式**：使用 Markdown 格式

## 输出格式
请严格按照以下 JSON 格式输出：
{
  "titles": ["标题 1", "标题 2", "标题 3"],
  "summary": "摘要内容",
  "content": "正文内容（Markdown 格式）",
  "tags": ["标签 1", "标签 2", "标签 3"]
}`,
  },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { noteId, style = 'professional' } = body

    if (!noteId) {
      return NextResponse.json(
        { error: '缺少必要参数：noteId' },
        { status: 400 }
      )
    }

    const selectedStyle = wechatStyles[style] || wechatStyles.professional

    // 从数据库读取笔记
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('title, content')
      .eq('id', noteId)
      .single()

    if (noteError || !note) {
      console.error('笔记不存在:', noteError, 'noteId:', noteId)
      return NextResponse.json(
        { error: '笔记不存在' },
        { status: 404 }
      )
    }

    console.log('📝 开始生成公众号文案')
    console.log('🎨 风格:', selectedStyle.name)
    console.log('📄 笔记长度:', note.content?.length || 0, '字符')

    // 构建提示词
    const noteContent = note.content || ''
    const noteTitle = note.title || '无标题'
    
    const prompt = `${selectedStyle.promptTemplate}

## 原始笔记内容
**标题**：${noteTitle}

**内容**：
${noteContent.substring(0, 3000)}`

    // 调用 AI 生成
    const result = await callAI(prompt, {
      provider: 'qwen',
      systemPrompt: selectedStyle.systemPrompt,
      temperature: 0.7,
      maxTokens: 4096,
    })

    console.log('✅ AI 生成完成，长度:', result.length)

    // 解析 JSON 结果
    let parsedResult
    try {
      // 清理可能的 Markdown 代码块标记
      const cleanResult = result
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim()
      
      // 尝试提取 JSON 对象
      const jsonMatch = cleanResult.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('未找到 JSON 格式')
      }
    } catch (e) {
      console.error('解析 JSON 失败:', e)
      // 降级处理：将原始内容作为正文，不显示 JSON 标记
      const cleanContent = result
        .replace(/^\{[\s\S]*\}$/, '') // 移除完整的 JSON 对象
        .replace(/["\[\]{}]/g, '') // 移除 JSON 符号
        .replace(/(titles|summary|content|tags):/g, '') // 移除字段名
        .trim()
      
      parsedResult = {
        titles: [noteTitle || 'AI 生成的标题'],
        summary: cleanContent.substring(0, 200) || '请手动编辑摘要',
        content: cleanContent || result,
        tags: ['公众号', 'AI 生成'],
      }
    }

    // 确保字段完整
    const finalResult = {
      titles: parsedResult.titles || [noteTitle],
      summary: parsedResult.summary || '',
      content: parsedResult.content || result,
      tags: parsedResult.tags || ['公众号', 'AI 生成内容'],
    }

    console.log('✅ 文案生成成功')
    console.log('📝 标题数量:', finalResult.titles.length)
    console.log('📝 摘要长度:', finalResult.summary.length)
    console.log('📝 正文长度:', finalResult.content.length)

    return NextResponse.json({
      success: true,
      data: finalResult,
    })
  } catch (error) {
    console.error('公众号文案生成失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成失败，请稍后重试' },
      { status: 500 }
    )
  }
}
