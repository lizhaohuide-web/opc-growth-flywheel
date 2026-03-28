/**
 * AI API 客户端 - 阿里云百炼 (兼容 OpenAI 接口)
 */

export async function callAI(prompt: string, systemPrompt?: string): Promise<string> {
  // 阿里云百炼配置（兼容 OpenAI 接口）
  const apiKey = 'sk-sp-f18e0636b4c34b02a89167a2d5730758'
  const baseUrl = 'https://coding.dashscope.aliyuncs.com/v1'
  const model = 'qwen3.5-plus'
  
  console.log('🤖 AI 请求配置:', { 
    provider: '阿里云百炼 (兼容 OpenAI)',
    baseUrl,
    model,
    hasApiKey: !!apiKey,
    promptLength: prompt.length
  })
  
  if (!apiKey) {
    throw new Error('AI_API_KEY 未配置！')
  }
  
  try {
    // 使用 OpenAI 兼容接口格式
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        enable_thinking: false
      })
    })
    
    console.log('📡 AI 响应状态:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ AI API 错误:', errorText)
      
      if (response.status === 401) {
        throw new Error('API Key 无效或已过期，请检查：\n1. API Key 是否正确\n2. 阿里云百炼是否已开通\n3. 账户是否有余额')
      } else if (response.status === 429) {
        throw new Error('API 请求超限，请稍后重试')
      } else {
        throw new Error(`AI API 错误 (${response.status}): ${errorText}`)
      }
    }
    
    const data = await response.json()
    console.log('📦 AI 响应:', JSON.stringify(data, null, 2))
    
    // OpenAI 兼容响应格式
    const content = data.choices?.[0]?.message?.content
    
    if (!content) {
      console.warn('⚠️ AI 返回空响应:', data)
      throw new Error('AI 返回空响应')
    }
    
    console.log('✅ AI 成功，长度:', content.length)
    return content
    
  } catch (error) {
    console.error('❌ AI 调用失败:', error)
    throw error
  }
}
