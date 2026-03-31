import { NextRequest, NextResponse } from 'next/server'

/**
 * 公众号文章配图生成 API
 * 
 * 分析文章内容，为关键段落生成配图提示词
 * 使用通义万相 qwen-image-2.0-pro 生成图片
 * 尺寸：900*500（公众号文中配图比例）
 */

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY
const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, maxCount = 3, positions = [] } = body

    if (!content) {
      return NextResponse.json(
        { error: '缺少必要参数：content' },
        { status: 400 }
      )
    }

    console.log('🎨 生成公众号文章配图')
    console.log('📝 文章长度:', content.length, '字符')
    console.log('🔢 最大配图数:', maxCount)

    // 如果没有指定位置，自动分析文章结构
    const illustrationPositions = positions.length > 0 
      ? positions.slice(0, maxCount)
      : await autoAnalyzePositions(content, maxCount)

    console.log('📍 确定配图位置:', illustrationPositions.length, '个')

    // 为每个位置生成配图提示词
    const illustrations: Array<{
      position: number
      paragraph: string
      prompt: string
      imageUrl?: string
      status: 'pending' | 'generating' | 'success' | 'error'
      error?: string
    }> = []

    for (let i = 0; i < illustrationPositions.length; i++) {
      const pos = illustrationPositions[i]
      console.log(`📝 生成第 ${i + 1}/${illustrationPositions.length} 个提示词`)
      
      try {
        // 生成配图提示词
        const prompt = await generateIllustrationPrompt(content, pos.paragraph, pos.context)
        console.log('📝 提示词生成完成，长度:', prompt.length)

        illustrations.push({
          position: pos.index,
          paragraph: pos.paragraph,
          prompt,
          status: 'pending',
        })
      } catch (error) {
        console.error('提示词生成失败:', error)
        illustrations.push({
          position: pos.index,
          paragraph: pos.paragraph,
          prompt: '',
          status: 'error',
          error: error instanceof Error ? error.message : '提示词生成失败',
        })
      }
    }

    return NextResponse.json({
      success: true,
      illustrations,
      total: illustrations.length,
    })
  } catch (error) {
    console.error('配图生成失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成配图失败' },
      { status: 500 }
    )
  }
}

/**
 * 生成单张配图（调用通义万相）
 */
export async function generateSingleIllustration(prompt: string) {
  try {
    console.log('🎨 调用通义万相生成图片:', prompt.substring(0, 50) + '...')

    let response
    let retryCount = 0
    const maxRetries = 3
    
    while (retryCount < maxRetries) {
      response = await fetch(`${DASHSCOPE_BASE_URL}/services/aigc/multimodal-generation/generation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen-image-2.0-pro',
          input: {
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: prompt,
                  },
                ],
              },
            ],
          },
          parameters: {
            size: '900*500',
            n: 1,
          },
        }),
      })
      
      if (response.status === 429 && retryCount < maxRetries - 1) {
        retryCount++
        console.log(`⏳ 速率限制，等待${retryCount * 2}秒后重试...`)
        await new Promise(resolve => setTimeout(resolve, retryCount * 2000))
      } else {
        break
      }
    }

    const responseText = await response.text()
    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      throw new Error('API 返回格式错误')
    }

    if (!response.ok) {
      const errorMessage = data.output?.text || data.message?.message || data.message || '生成失败'
      throw new Error(errorMessage)
    }
    
    const imageUrl = data.output?.choices?.[0]?.message?.content?.[0]?.image ||
                     data.output?.choices?.[0]?.message?.content?.[0]?.image_url ||
                     data.output?.image
    
    if (imageUrl) {
      console.log('✅ 配图生成成功:', imageUrl)
      return { success: true, imageUrl }
    } else {
      throw new Error('未返回图片 URL')
    }
  } catch (error) {
    console.error('配图生成失败:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '生成失败' 
    }
  }
}

/**
 * 自动分析文章结构，找出需要配图的位置
 */
async function autoAnalyzePositions(content: string, maxCount: number = 3): Promise<Array<{
  index: number
  paragraph: string
  context: string
}>> {
  // 按段落分割
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 20)
  
  const positions: Array<{
    index: number
    paragraph: string
    context: string
  }> = []

  // 选择关键段落（每隔 2-3 个段落，或包含重要关键词的段落）
  const importantKeywords = ['首先', '其次', '最后', '重要', '关键', '核心', '总结', '例如', '比如', '案例']
  
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i]
    const shouldIllustrate = 
      i % 3 === 0 || // 每隔 2 个段落
      importantKeywords.some(kw => paragraph.includes(kw)) || // 包含关键词
      i === 0 || // 第一段
      i === paragraphs.length - 1 // 最后一段

    if (shouldIllustrate && paragraph.trim().length > 30) {
      positions.push({
        index: i,
        paragraph: paragraph.trim(),
        context: paragraphs.slice(Math.max(0, i - 1), Math.min(paragraphs.length, i + 2)).join('\n'),
      })
    }
  }

  // 限制最多 maxCount 个配图
  return positions.slice(0, maxCount)
}

/**
 * 为段落生成配图提示词
 */
async function generateIllustrationPrompt(
  fullContent: string,
  paragraph: string,
  context: string
): Promise<string> {
  // 调用 AI 生成配图提示词
  const prompt = `请为以下公众号文章段落生成一张配图的提示词。

## 文章段落
${paragraph}

## 上下文
${context}

## 要求
1. **图片用途**: 公众号文章文中配图，帮助读者理解段落内容
2. **图片尺寸**: 900*500 像素（横版）
3. **风格**: 简洁、专业、有美感，符合公众号调性
4. **内容**: 
   - 提取段落的核心概念或关键信息
   - 用视觉化方式呈现（图表、场景、隐喻等）
   - 避免文字堆砌，以图形为主
5. **配色**: 和谐、舒适，适合阅读

## 输出格式
请直接输出配图提示词（英文，200-300 词），包含：
- 画面主体内容
- 视觉风格描述
- 配色方案
- 构图要求

不要输出其他解释文字。`

  try {
    const { callAI } = await import('@/lib/ai/unified-client')
    const result = await callAI(prompt, {
      provider: 'qwen',
      temperature: 0.7,
      maxTokens: 1024,
    })
    return result.trim()
  } catch (error) {
    // 降级：使用段落内容作为提示词
    return `Create a professional, elegant illustration for a WeChat article paragraph:

${paragraph.substring(0, 200)}

Style: Clean, modern, minimalist
Colors: Harmonious, professional
Composition: Balanced, with visual focus
Size: 900*500 pixels, landscape`
  }
}
