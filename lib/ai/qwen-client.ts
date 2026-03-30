/**
 * Qwen API Client (阿里云百炼 - 兼容 OpenAI 接口)
 * 
 * 使用方式：
 * const response = await qwen.chat.completions.create({
 *   model: 'qwen3.5-plus',
 *   messages: [...]
 * })
 */

const QWEN_API_KEY = process.env.QWEN_API_KEY || 'sk-sp-f18e0636b4c34b02a89167a2d5730758'
const QWEN_BASE_URL = 'https://coding.dashscope.aliyuncs.com/v1'
const QWEN_MODEL = 'qwen3.5-plus'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionOptions {
  messages: ChatMessage[]
  model?: string
  temperature?: number
  max_tokens?: number
}

export interface ChatCompletionResponse {
  id: string
  choices: Array<{
    message: ChatMessage
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

async function createChatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
  const response = await fetch(`${QWEN_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${QWEN_API_KEY}`,
    },
    body: JSON.stringify({
      model: options.model || QWEN_MODEL,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 500,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(`Qwen API Error: ${response.status} - ${error.message}`)
  }

  return response.json()
}

export const qwen = {
  chat: {
    completions: {
      create: createChatCompletion,
    },
  },
}

/**
 * 辅助函数：生成 AI 追问
 */
export async function generateAIQuestion(params: {
  templateName: string
  fieldName: string
  userAnswer: string
  previousAnswers?: Record<string, string>
}): Promise<string> {
  const { templateName, fieldName, userAnswer, previousAnswers = {} } = params

  const systemPrompt = `你是一位专业的思考教练，帮助用户深度思考。
你的任务是根据用户的回答，提出 1-2 个有深度的追问，引导用户思考得更深入、更具体。

追问原则：
1. 具体化：引导用户给出具体案例、细节、数据
2. 深度化：引导用户思考原因、影响、本质
3. 行动化：引导用户思考如何应用、下一步行动
4. 简洁：每个问题不超过 30 字
5. 温和：用启发式语气，不要像审问

格式：直接返回 1-2 个问题，用换行分隔，不要其他内容。`

  const contextPrompt = `模板：${templateName}
当前问题：${fieldName}
用户回答：${userAnswer}
${Object.keys(previousAnswers).length > 0 ? `之前的回答：\n${Object.entries(previousAnswers).map(([k, v]) => `${k}: ${v}`).join('\n')}` : ''}

请基于以上信息，提出 1-2 个追问：`

  try {
    const response = await qwen.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: contextPrompt },
      ],
      temperature: 0.8,
      max_tokens: 200,
    })

    return response.choices[0]?.message?.content?.trim() || ''
  } catch (error) {
    console.error('AI 追问生成失败:', error)
    return ''
  }
}

/**
 * 辅助函数：生成智能提示
 */
export async function generateSmartHint(params: {
  content: string
  mode: 'free' | 'guided'
}): Promise<string | null> {
  const { content, mode } = params

  // 先进行基础检测
  const issues: string[] = []

  if (content.length < 50) {
    issues.push('内容较短')
  }

  const vagueWords = ['很好', '不错', '学习了', '了解了', '还可以', '挺好的']
  if (vagueWords.some(word => content.includes(word))) {
    issues.push('包含泛化词汇')
  }

  const hasDetails = /\d+|具体 | 例如 | 比如 | 案例 | 实际/.test(content)
  if (!hasDetails) {
    issues.push('缺少具体细节')
  }

  if (issues.length === 0) {
    return null
  }

  const systemPrompt = `你是一位温和的写作助手。
检测到用户的内容有以下问题：${issues.join('、')}
请用一句话温和地提醒用户，引导他写得更具体、更深入。

要求：
1. 语气友好，不要批评
2. 给出具体建议
3. 不超过 40 字
4. 直接返回建议内容，不要其他格式`

  try {
    const response = await qwen.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `用户写的内容：\n${content.slice(0, 500)}` },
      ],
      temperature: 0.7,
      max_tokens: 100,
    })

    const suggestion = response.choices[0]?.message?.content?.trim() || ''
    return suggestion || null
  } catch (error) {
    console.error('智能提示生成失败:', error)
    return null
  }
}

/**
 * 辅助函数：生成质量反馈
 */
export async function generateQualityFeedback(params: {
  title: string
  content: string
  templateName?: string
}): Promise<{
  scores: {
    structure: number
    depth: number
    examples: number
  }
  suggestions: string[]
}> {
  const { title, content, templateName } = params

  const systemPrompt = `你是一位专业的笔记评审专家。
请从以下维度评估笔记质量：

1. 结构清晰度 (1-10 分)：是否有清晰的逻辑结构
2. 观点深度 (1-10 分)：是否有深度思考，而非表面描述
3. 案例支撑 (1-10 分)：是否有具体案例、数据、细节支撑观点

然后给出 2-3 条具体改进建议。

返回 JSON 格式：
{
  "scores": {
    "structure": 8,
    "depth": 6,
    "examples": 7
  },
  "suggestions": [
    "建议 1",
    "建议 2"
  ]
}`

  try {
    const response = await qwen.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `标题：${title}\n${templateName ? `模板：${templateName}\n` : ''}内容：\n${content.slice(0, 2000)}` 
        },
      ],
      temperature: 0.5,
      max_tokens: 400,
    })

    const rawContent = response.choices[0]?.message?.content?.trim() || '{}'
    
    // 尝试解析 JSON（可能包含 markdown 代码块）
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
    const jsonString = jsonMatch ? jsonMatch[0] : rawContent
    
    try {
      const result = JSON.parse(jsonString)
      return {
        scores: result.scores || { structure: 5, depth: 5, examples: 5 },
        suggestions: result.suggestions || [],
      }
    } catch {
      // 解析失败时返回默认值
      return {
        scores: { structure: 6, depth: 6, examples: 6 },
        suggestions: ['笔记已保存'],
      }
    }
  } catch (error) {
    console.error('质量反馈生成失败:', error)
    return {
      scores: { structure: 6, depth: 6, examples: 6 },
      suggestions: ['笔记已保存'],
    }
  }
}
