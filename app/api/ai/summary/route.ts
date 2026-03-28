import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai/client'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { content, noteId, summary: providedSummary } = await request.json()
    
    let summary = providedSummary;
    
    // 如果没有提供摘要，则生成新的摘要
    if (!summary) {
      if (!content) {
        return NextResponse.json({ error: '内容为空' }, { status: 400 })
      }
      
      // 新的智能摘要提示词策略
      const prompt = `你是一位资深的知识管理专家和内容分析师。请对以下笔记进行深度分析。

## 分析维度
1. **核心洞察**（2-3 句）：这篇笔记最有价值的核心观点是什么？
2. **知识图谱**（3-5 个关键概念）：提取核心概念及其关联关系
3. **思维模型**：这篇内容涉及哪些思维模型？（如：第一性原理、飞轮效应、复利思维等）
4. **行动清单**：基于笔记内容，列出 2-3 个具体可执行的下一步行动
5. **延伸思考**：提出 1-2 个值得进一步探索的问题

## 输出格式（严格遵循）
💡 **核心洞察**
...

🔗 **知识图谱**
• 概念A → 概念B（关系说明）
• 概念C → 概念D（关系说明）

🧠 **思维模型**
• 模型名称：在本文中的体现

✅ **行动清单**
1. ...
2. ...

❓ **延伸思考**
• ...

## 笔记内容
${content.substring(0, 3000)}`

      console.log('📝 生成智能摘要...')
      summary = await callAI(prompt, '你是一位资深的知识管理专家和内容分析师，擅长深度分析和结构化总结。')
      
      if (!summary) {
        throw new Error('AI 返回空结果')
      }
      
      console.log('✅ 摘要生成成功，长度:', summary.length)
    } else {
      console.log('📝 使用提供的摘要，长度:', summary.length)
    }
    
    // 如果提供了 noteId，则尝试将摘要保存到数据库
    if (noteId) {
      try {
        const supabase = await createClient()
        
        const { error } = await supabase
          .from('notes')
          .update({
            ai_summary: summary,
            ai_summary_at: new Date().toISOString()
          })
          .eq('id', noteId)
        
        if (error) {
          console.warn('⚠️ 保存摘要到数据库失败:', error.message)
          // 保存失败不影响返回结果（容错）
        } else {
          console.log('💾 摘要已保存到数据库')
        }
      } catch (dbError) {
        console.warn('⚠️ 保存摘要到数据库出错:', dbError)
        // 保存失败不影响返回结果（容错）
      }
    }
    
    return NextResponse.json({ summary })
  } catch (error) {
    console.error('摘要 API 错误:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '生成失败' 
    }, { status: 500 })
  }
}
