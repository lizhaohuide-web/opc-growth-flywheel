/**
 * new Claude AI API 客户端 (NovaAPI 中转站)
 * 格式：anthropic
 * 模型：claude-opus-4-6
 */

const API_KEY = process.env.NOVAI_CLAUDE_API_KEY
const BASE_URL = process.env.NOVAI_CLAUDE_BASE_URL || 'https://us.novaiapi.com/v1'
const MODEL = process.env.NOVAI_CLAUDE_MODEL || 'claude-opus-4-6'

export async function callNovaAIClaude(prompt: string, systemPrompt?: string): Promise<string> {
  console.log('🤖 new Claude 请求配置:', { 
    provider: 'NovaAPI (Claude)',
    baseUrl: BASE_URL,
    model: MODEL,
    hasApiKey: !!API_KEY,
    promptLength: prompt.length
  })
  
  if (!API_KEY) {
    throw new Error('NOVAI_CLAUDE_API_KEY 未配置！')
  }
  
  try {
    // Anthropic 格式
    const response = await fetch(`${BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        system: systemPrompt || '你是一个专业的 AI 助手。',
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    })
    
    console.log('📡 new Claude 响应状态:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ new Claude API 错误:', errorText)
      
      if (response.status === 401) {
        throw new Error('API Key 无效，请检查 NOVAI_CLAUDE_API_KEY 是否正确')
      } else if (response.status === 429) {
        throw new Error('请求频率超限，请稍后重试')
      } else if (response.status === 500) {
        throw new Error('API 服务器错误，请稍后重试')
      } else {
        throw new Error(`API 请求失败 (${response.status}): ${errorText}`)
      }
    }
    
    const data = await response.json()
    console.log('✅ new Claude 成功，长度:', data.content?.[0]?.text?.length || 0)
    
    return data.content?.[0]?.text || ''
  } catch (error) {
    console.error('❌ new Claude 调用失败:', error)
    throw error
  }
}
