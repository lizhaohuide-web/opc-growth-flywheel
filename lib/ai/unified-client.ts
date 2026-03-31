/**
 * 统一 AI 客户端 - 支持多 Provider
 * 
 * 用法:
 *   import { callAI, callAIStream } from '@/lib/ai/unified-client'
 *   
 *   // 默认使用 Qwen
 *   const result = await callAI(prompt, { systemPrompt: '...' })
 *   
 *   // 使用 Claude
 *   const result = await callAI(prompt, { provider: 'claude', systemPrompt: '...' })
 */

export type AIProvider = 'qwen' | 'claude'

interface AIConfig {
  apiKey: string | undefined
  baseUrl: string
  model: string
  format: 'openai' | 'anthropic'
}

interface CallAIOptions {
  provider?: AIProvider
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
}

function getProviderConfig(provider: AIProvider): AIConfig {
  switch (provider) {
    case 'claude':
      return {
        apiKey: process.env.NOVAI_CLAUDE_API_KEY,
        baseUrl: process.env.NOVAI_CLAUDE_BASE_URL || 'https://us.novaiapi.com/v1',
        model: process.env.NOVAI_CLAUDE_MODEL || 'claude-opus-4-6',
        format: 'anthropic',
      }
    case 'qwen':
    default:
      return {
        apiKey: process.env.AI_API_KEY || process.env.QWEN_API_KEY,
        baseUrl: process.env.AI_BASE_URL || 'https://coding.dashscope.aliyuncs.com/v1',
        model: process.env.AI_MODEL || 'qwen3.5-plus',
        format: 'openai',
      }
  }
}

/**
 * 调用 AI（非流式）
 */
export async function callAI(prompt: string, options: CallAIOptions = {}): Promise<string> {
  const { provider = 'qwen', systemPrompt, temperature = 0.7, maxTokens = 4096 } = options
  const config = getProviderConfig(provider)

  if (!config.apiKey) {
    throw new Error(`${provider} API Key 未配置`)
  }

  console.log(`🤖 [${provider}] 请求:`, { model: config.model, promptLen: prompt.length })

  if (config.format === 'anthropic') {
    return callAnthropic(config, prompt, { systemPrompt, temperature, maxTokens })
  } else {
    return callOpenAI(config, prompt, { systemPrompt, temperature, maxTokens })
  }
}

/**
 * 调用 AI（流式，仅 OpenAI 格式）
 */
export function callAIStream(prompt: string, options: CallAIOptions = {}): ReadableStream {
  const { provider = 'qwen', systemPrompt, temperature = 0.7, maxTokens = 2000 } = options
  const config = getProviderConfig(provider)

  return new ReadableStream({
    async start(controller) {
      try {
        if (!config.apiKey) {
          throw new Error(`${provider} API Key 未配置`)
        }

        const response = await fetch(`${config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: config.model,
            messages: [
              ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
              { role: 'user', content: prompt },
            ],
            temperature,
            max_tokens: maxTokens,
            stream: true,
            enable_thinking: false,
          }),
        })

        if (!response.ok) {
          const err = await response.text()
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: err })}\n\n`))
          controller.close()
          return
        }

        const reader = response.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()
              if (data === '[DONE]') {
                controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
                continue
              }
              try {
                const json = JSON.parse(data)
                const content = json.choices?.[0]?.delta?.content
                if (content) {
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`))
                }
              } catch {}
            }
          }
        }
        controller.close()
      } catch (error) {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: String(error) })}\n\n`))
        controller.close()
      }
    },
  })
}

// --- 内部实现 ---

async function callOpenAI(
  config: AIConfig,
  prompt: string,
  opts: { systemPrompt?: string; temperature: number; maxTokens: number }
): Promise<string> {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        ...(opts.systemPrompt ? [{ role: 'system', content: opts.systemPrompt }] : []),
        { role: 'user', content: prompt },
      ],
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
      enable_thinking: false,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ OpenAI API 错误:', response.status, errorText)
    if (response.status === 401) throw new Error('API Key 无效或已过期')
    if (response.status === 429) throw new Error('请求频率超限，请稍后重试')
    throw new Error(`API 错误 (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('AI 返回空响应')

  console.log(`✅ [qwen] 成功, 长度: ${content.length}`)
  return content
}

async function callAnthropic(
  config: AIConfig,
  prompt: string,
  opts: { systemPrompt?: string; temperature: number; maxTokens: number }
): Promise<string> {
  const response = await fetch(`${config.baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: opts.maxTokens,
      system: opts.systemPrompt || '你是一个专业的 AI 助手。',
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ Anthropic API 错误:', response.status, errorText)
    if (response.status === 401) throw new Error('API Key 无效')
    if (response.status === 429) throw new Error('请求频率超限，请稍后重试')
    throw new Error(`API 错误 (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  const content = data.content?.[0]?.text || ''
  if (!content) throw new Error('AI 返回空响应')

  console.log(`✅ [claude] 成功, 长度: ${content.length}`)
  return content
}
