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

  // 检查 AI 摘要功能权限
  const checkResult = await checkFeature(user.id, 'aiSummary');
  if (!checkResult.allowed) {
    return new Response(
      JSON.stringify({ 
        error: checkResult.message || '此功能需要订阅会员', 
        upgradeUrl: '/dashboard/subscription' 
      }), 
      { status: 403 }
    )
  }

  const { content, noteId } = await request.json()
  
  if (!content) {
    return new Response(JSON.stringify({ error: '内容为空' }), { status: 400 })
  }

  const prompt = `你是一位资深的知识管理专家和内容分析师。请对以下笔记进行深度分析。

## 分析维度
1. **核心洞察**（2-3 句）：这篇笔记最有价值的核心观点是什么？
2. **知识图谱**（3-5 个关键概念）：提取核心概念及其关联关系
3. **思维模型**：这篇内容涉及哪些思维模型？
4. **行动清单**：基于笔记内容，列出 2-3 个具体可执行的下一步行动
5. **延伸思考**：提出 1-2 个值得进一步探索的问题

## 输出格式（严格遵循）
💡 **核心洞察**
...

🔗 **知识图谱**
• 概念A → 概念B（关系说明）

🧠 **思维模型**
• 模型名称：在本文中的体现

✅ **行动清单**
1. ...
2. ...

❓ **延伸思考**
• ...

## 笔记内容
${content.substring(0, 3000)}`

  const stream = callAIStream(prompt, '你是一位资深的知识管理专家和内容分析师。')

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}