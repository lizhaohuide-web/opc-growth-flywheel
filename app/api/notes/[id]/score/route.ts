import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callAI } from '@/lib/ai/client'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    // 获取笔记内容
    const { data: note } = await supabase
      .from('notes')
      .select('title, content, user_id')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single()
    
    if (!note) {
      return Response.json({ error: 'Note not found' }, { status: 404 })
    }
    
    // 构造AI评分提示词
    const prompt = `
      请对以下笔记进行质量评分，评估其对个人成长的价值：
      
      标题: ${note.title || '无标题'}
      内容: ${note.content || '无内容'}
      
      评分维度（0-10分制）：
      1. 内容深度 (0-3分): 分析的深度和见解程度
      2. 可行性 (0-3分): 提出的想法/建议是否具有实际可操作性
      3. 原创性 (0-2分): 内容的独创性和创新性
      4. 反思性 (0-2分): 是否包含深度反思和个人感悟
      
      注意：如果笔记内容为空白、无意义或纯复制粘贴，则总分应在0-2分之间。
      
      请严格按照以下JSON格式返回评分结果：
      {
        "score": number,
        "dimensions": {
          "depth": number,
          "feasibility": number,
          "originality": number,
          "reflection": number
        },
        "brief": "简短的评分理由概述"
      }
    `
    
    const aiResponse = await callAI(prompt)
    
    // 解析AI返回的JSON
    let parsedResponse
    try {
      // 尝试从响应中提取JSON部分
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```|```([\s\S]*?)```/)
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[2]) : aiResponse
      parsedResponse = JSON.parse(jsonString.trim())
    } catch (parseError) {
      console.error('解析AI评分响应失败:', parseError)
      console.log('原始AI响应:', aiResponse)
      
      // 如果解析失败，返回一个合理的默认值
      return Response.json({ 
        error: 'Failed to parse AI response',
        score: 0,
        dimensions: {
          depth: 0,
          feasibility: 0,
          originality: 0,
          reflection: 0
        },
        brief: '无法解析评分结果'
      }, { status: 500 })
    }
    
    // 更新数据库中的评分信息
    const { error } = await supabase
      .from('notes')
      .update({
        quality_score: parsedResponse.score,
        quality_dimensions: parsedResponse.dimensions,
      })
      .eq('id', params.id)
      .eq('user_id', session.user.id)
    
    if (error) {
      console.error('更新笔记评分失败:', error)
      return Response.json({ error: 'Failed to update note score' }, { status: 500 })
    }
    
    return Response.json(parsedResponse)
  } catch (error) {
    console.error('评分API错误:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}