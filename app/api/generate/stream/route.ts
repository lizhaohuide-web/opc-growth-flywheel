import { callAIStream } from '@/lib/ai/stream'
import { createClient } from '@/lib/supabase/server'
import { checkFeature } from '@/lib/subscription/check'

export async function POST(request: Request) {
  const supabase = await createClient();
  
  // 获取用户会话
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return new Response(JSON.stringify({ error: '未登录用户' }), { status: 401 })
  }

  // 检查 AI 生成功能权限
  const checkResult = await checkFeature(user.id, 'aiGenerate');
  if (!checkResult.allowed) {
    return new Response(
      JSON.stringify({ 
        error: checkResult.message || '此功能需要订阅会员', 
        upgradeUrl: '/dashboard/subscription' 
      }), 
      { status: 403 }
    )
  }

  try {
    const { content, prompt: userPrompt, noteId, title } = await request.json()
    
    if (!content) {
      return new Response(JSON.stringify({ error: '内容为空' }), { status: 400 })
    }

    // 如果用户提供了自定义提示词，则合并使用
    let finalPrompt = '';
    if (userPrompt) {
      const titleLine = title ? `标题：${title}\n` : '';
      finalPrompt = `${userPrompt}\n\n以下是参考内容：\n\n${titleLine}${content.substring(0, 3000)}`
    } else {
      finalPrompt = `请基于以下内容生成相关内容：\n\n${content.substring(0, 3000)}`
    }

    const stream = callAIStream(finalPrompt)

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })
  } catch (error) {
    console.error('❌ 流式内容生成 API 错误:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : '生成失败' }), 
      { status: 500 }
    )
  }
}