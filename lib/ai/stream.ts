/**
 * 流式 AI 调用 - 返回 ReadableStream
 */
export function callAIStream(prompt: string, systemPrompt?: string): ReadableStream {
  const apiKey = process.env.AI_API_KEY
  const baseUrl = process.env.AI_BASE_URL || 'https://coding.dashscope.aliyuncs.com/v1'
  const model = process.env.AI_MODEL || 'qwen3.5-plus'

  return new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
            messages: [
              ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 2000,
            stream: true,
            enable_thinking: false
          })
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
    }
  })
}