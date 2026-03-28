import { callAIStream } from '@/lib/ai/stream'

export async function POST(request: Request) {
  const { prompt, systemPrompt } = await request.json()
  
  if (!prompt) {
    return new Response(JSON.stringify({ error: '提示词不能为空' }), { status: 400 })
  }

  const stream = callAIStream(prompt, systemPrompt)

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}