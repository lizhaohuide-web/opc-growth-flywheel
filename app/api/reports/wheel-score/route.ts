import { createClient } from '@/lib/supabase/server'
import { callAI } from '@/lib/ai/client'

interface DimensionScore {
  name: string
  score: number
  evidence: string
  suggestion: string
}

interface WheelScoreResponse {
  dimensions: DimensionScore[]
  updatedAt: string
}

export async function GET() {
  return calculateWheelScore()
}

export async function POST() {
  // 强制重新计算，忽略缓存
  return calculateWheelScore(true)
}

async function calculateWheelScore(forceRefresh = false) {
  try {
    const supabase = await createClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return Response.json({ error: '未授权访问' }, { status: 401 })
    }

    // 检查缓存（除非强制刷新）
    if (!forceRefresh) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('wheel_cache, wheel_cache_at')
        .eq('id', session.user.id)
        .single()

      const today = new Date().toISOString().split('T')[0]
      const cacheDate = profile?.wheel_cache_at ? new Date(profile.wheel_cache_at).toISOString().split('T')[0] : null

      if (profile?.wheel_cache && cacheDate === today) {
        return Response.json(profile.wheel_cache)
      }
    }

    // 获取用户最近30天的笔记
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: notes, error } = await supabase
      .from('notes')
      .select('content, created_at, tags')
      .eq('user_id', session.user.id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('获取笔记错误:', error)
      return Response.json({ error: '获取数据失败' }, { status: 500 })
    }

    // 准备笔记内容供AI分析
    const notesContent = notes?.map(note => ({
      content: note.content || '',
      createdAt: note.created_at,
      tags: note.tags || []
    })).filter(note => note.content.trim().length > 0) || []

    if (notesContent.length === 0) {
      // 如果没有笔记，则返回默认分数
      const defaultDimensions: DimensionScore[] = [
        { name: '事业发展', score: 5, evidence: '暂无相关笔记记录', suggestion: '开始记录与职业发展相关的想法和进展' },
        { name: '财务健康', score: 5, evidence: '暂无相关笔记记录', suggestion: '记录财务规划和投资心得' },
        { name: '身心健康', score: 5, evidence: '暂无相关笔记记录', suggestion: '记录健康习惯和心理状态' },
        { name: '亲密关系', score: 5, evidence: '暂无相关笔记记录', suggestion: '记录与家人朋友的互动和感受' },
        { name: '社交网络', score: 5, evidence: '暂无相关笔记记录', suggestion: '记录社交活动和人脉拓展' },
        { name: '学习成长', score: 5, evidence: '暂无相关笔记记录', suggestion: '开始记录学习心得和成长感悟' },
        { name: '创造表达', score: 5, evidence: '暂无相关笔记记录', suggestion: '记录创意想法和个人表达' },
        { name: '意义感知', score: 5, evidence: '暂无相关笔记记录', suggestion: '思考并记录人生价值观和目标' }
      ]
      
      // 计算完后保存缓存
      const result = { dimensions: defaultDimensions, updatedAt: new Date().toISOString() }
      try {
        await supabase
          .from('profiles')
          .update({ wheel_cache: result, wheel_cache_at: new Date().toISOString() })
          .eq('id', session.user.id)
      } catch (cacheError) {
        console.error('缓存写入失败:', cacheError)
        // 缓存写入失败不影响返回结果（容错）
      }

      return Response.json(result)
    }

    // 构建AI分析提示词
    const prompt = `
      请根据以下用户的笔记内容，对积极心理学PERMA模型扩展版的8个维度进行评分（1-10分）：
      
      1. 事业发展 — 职业技能、职场表现、行业影响力
      2. 财务健康 — 收入增长、投资理财、财务自由度
      3. 身心健康 — 运动习惯、睡眠质量、压力管理
      4. 亲密关系 — 家庭和谐、伴侣沟通、亲子互动
      5. 社交网络 — 人脉拓展、社群影响、合作关系
      6. 学习成长 — 知识深度、思维升级、新技能习得
      7. 创造表达 — 内容创作、艺术输出、个人品牌
      8. 意义感知 — 使命感、价值观、精神富足
      
      笔记内容：
      ${notesContent.slice(0, 20).map((note, index) => 
        `笔记${index + 1}: ${note.content.substring(0, 500)}`
      ).join('\n\n')}
      
      请严格按照以下JSON格式返回结果：
      {
        "dimensions": [
          {
            "name": "事业发展",
            "score": 7,
            "evidence": "笔记中提到...表明在事业发展方面...",
            "suggestion": "建议在该领域..."
          },
          {
            "name": "财务健康",
            "score": 6,
            "evidence": "笔记中提到...表明在财务健康方面...",
            "suggestion": "建议在该领域..."
          },
          {
            "name": "身心健康",
            "score": 8,
            "evidence": "笔记中提到...表明在身心健康方面...",
            "suggestion": "建议在该领域..."
          },
          {
            "name": "亲密关系",
            "score": 7,
            "evidence": "笔记中提到...表明在亲密关系方面...",
            "suggestion": "建议在该领域..."
          },
          {
            "name": "社交网络",
            "score": 5,
            "evidence": "笔记中提到...表明在社交网络方面...",
            "suggestion": "建议在该领域..."
          },
          {
            "name": "学习成长",
            "score": 9,
            "evidence": "笔记中提到...表明在学习成长方面...",
            "suggestion": "建议在该领域..."
          },
          {
            "name": "创造表达",
            "score": 6,
            "evidence": "笔记中提到...表明在创造表达方面...",
            "suggestion": "建议在该领域..."
          },
          {
            "name": "意义感知",
            "score": 7,
            "evidence": "笔记中提到...表明在意义感知方面...",
            "suggestion": "建议在该领域..."
          }
        ]
      }
      
      评分标准：
      - 1-2分：几乎没有相关内容或表现极差
      - 3-4分：有一些相关内容但表现较差
      - 5分：一般水平，有基本关注
      - 6-7分：表现良好，有一定投入
      - 8-9分：表现优秀，积极投入
      - 10分：表现卓越，高度投入
      
      证据部分需要引用笔记中的具体内容作为评分依据，建议部分要具体可行。
    `

    try {
      const aiResponse = await callAI(prompt)
      
      // 解析AI响应
      let parsedResponse: WheelScoreResponse
      try {
        // 尝试直接解析JSON
        parsedResponse = JSON.parse(aiResponse)
      } catch {
        // 如果直接解析失败，尝试从可能包含```json标记的文本中提取
        const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[1])
        } else {
          // 如果仍然失败，尝试寻找最接近的JSON结构
          const startIdx = aiResponse.indexOf('{')
          const endIdx = aiResponse.lastIndexOf('}') + 1
          if (startIdx !== -1 && endIdx > startIdx) {
            parsedResponse = JSON.parse(aiResponse.substring(startIdx, endIdx))
          } else {
            throw new Error('无法解析AI返回的JSON格式')
          }
        }
      }

      // 验证响应格式
      if (!parsedResponse.dimensions || !Array.isArray(parsedResponse.dimensions)) {
        throw new Error('AI返回的数据格式不正确')
      }

      // 确保所有维度都有值
      const expectedDimensions = [
        '事业发展', '财务健康', '身心健康', '亲密关系', 
        '社交网络', '学习成长', '创造表达', '意义感知'
      ]

      // 验证并补充缺失的维度
      for (const expectedDim of expectedDimensions) {
        const found = parsedResponse.dimensions.find(dim => dim.name === expectedDim)
        if (!found) {
          parsedResponse.dimensions.push({
            name: expectedDim,
            score: 5,
            evidence: '暂无相关笔记记录',
            suggestion: `开始记录与${expectedDim}相关的想法和进展`
          })
        }
      }

      // 计算完后保存缓存
      const result = { dimensions: parsedResponse.dimensions, updatedAt: new Date().toISOString() }
      try {
        await supabase
          .from('profiles')
          .update({ wheel_cache: result, wheel_cache_at: new Date().toISOString() })
          .eq('id', session.user.id)
      } catch (cacheError) {
        console.error('缓存写入失败:', cacheError)
        // 缓存写入失败不影响返回结果（容错）
      }

      return Response.json(result)
    } catch (aiError) {
      console.error('AI分析错误:', aiError)
      
      // 如果AI调用失败，返回默认值
      const fallbackDimensions: DimensionScore[] = [
        { name: '事业发展', score: 5, evidence: 'AI分析暂时不可用', suggestion: '继续记录笔记以获得更准确的分析' },
        { name: '财务健康', score: 5, evidence: 'AI分析暂时不可用', suggestion: '继续记录笔记以获得更准确的分析' },
        { name: '身心健康', score: 5, evidence: 'AI分析暂时不可用', suggestion: '继续记录笔记以获得更准确的分析' },
        { name: '亲密关系', score: 5, evidence: 'AI分析暂时不可用', suggestion: '继续记录笔记以获得更准确的分析' },
        { name: '社交网络', score: 5, evidence: 'AI分析暂时不可用', suggestion: '继续记录笔记以获得更准确的分析' },
        { name: '学习成长', score: 5, evidence: 'AI分析暂时不可用', suggestion: '继续记录笔记以获得更准确的分析' },
        { name: '创造表达', score: 5, evidence: 'AI分析暂时不可用', suggestion: '继续记录笔记以获得更准确的分析' },
        { name: '意义感知', score: 5, evidence: 'AI分析暂时不可用', suggestion: '继续记录笔记以获得更准确的分析' }
      ]
      
      // 计算完后保存缓存
      const result = { dimensions: fallbackDimensions, updatedAt: new Date().toISOString() }
      try {
        await supabase
          .from('profiles')
          .update({ wheel_cache: result, wheel_cache_at: new Date().toISOString() })
          .eq('id', session.user.id)
      } catch (cacheError) {
        console.error('缓存写入失败:', cacheError)
        // 缓存写入失败不影响返回结果（容错）
      }

      return Response.json(result)
    }
  } catch (error) {
    console.error('服务器错误:', error)
    return Response.json({ error: '内部服务器错误' }, { status: 500 })
  }
}