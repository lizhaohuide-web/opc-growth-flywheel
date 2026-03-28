'use client'
import { useState, useEffect } from 'react'

interface DimensionScore {
  name: string
  score: number
  evidence: string
  suggestion: string
}

interface Props {
  onSubmit?: (scores: Record<string, number>) => void
  initialScores?: Record<string, number>
  aiScores?: DimensionScore[]
}

// 科学版生命之轮维度（基于PERMA模型）
const dimensionMapping: Record<string, string> = {
  '事业发展': 'career',
  '财务健康': 'finance', 
  '身心健康': 'health',
  '亲密关系': 'family',
  '社交网络': 'social',
  '学习成长': 'growth',
  '创造表达': 'creativity',
  '意义感知': 'meaning'
}

const dimensionLabels = [
  { id: 'career', name: '事业发展', desc: '职业技能、职场表现、行业影响力' },
  { id: 'finance', name: '财务健康', desc: '收入增长、投资理财、财务自由度' },
  { id: 'health', name: '身心健康', desc: '运动习惯、睡眠质量、压力管理' },
  { id: 'family', name: '亲密关系', desc: '家庭和谐、伴侣沟通、亲子互动' },
  { id: 'social', name: '社交网络', desc: '人脉拓展、社群影响、合作关系' },
  { id: 'growth', name: '学习成长', desc: '知识深度、思维升级、新技能习得' },
  { id: 'creativity', name: '创造表达', desc: '内容创作、艺术输出、个人品牌' },
  { id: 'meaning', name: '意义感知', desc: '使命感、价值观、精神富足' }
]

export default function WheelOfLifeForm({ onSubmit, initialScores, aiScores }: Props) {
  const [scores, setScores] = useState<Record<string, number>>({
    career: initialScores?.career || 5,
    finance: initialScores?.finance || 5,
    health: initialScores?.health || 5,
    family: initialScores?.family || 5,
    social: initialScores?.social || 5,
    growth: initialScores?.growth || 5,
    creativity: initialScores?.creativity || 5,
    meaning: initialScores?.meaning || 5
  })
  
  const [aiResults, setAiResults] = useState<DimensionScore[]>(aiScores || [])
  const [loading, setLoading] = useState(false)
  const [showEvidence, setShowEvidence] = useState<Record<string, boolean>>({})
  const [previousScores, setPreviousScores] = useState<Record<string, number>>({})
  
  // 初始化时如果有AI评分则使用
  useEffect(() => {
    if (aiScores && aiScores.length > 0) {
      const aiScoreMap: Record<string, number> = {}
      aiScores.forEach(dim => {
        const id = dimensionMapping[dim.name]
        if (id) {
          aiScoreMap[id] = dim.score
        }
      })
      setScores(prev => ({ ...prev, ...aiScoreMap }))
      setAiResults(aiScores)
    }
  }, [aiScores])

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(scores)
    }
  }
  
  const handleAIScore = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/reports/wheel-score')
      if (response.ok) {
        const data = await response.json()
        setAiResults(data.dimensions)
        
        // 保存当前分数作为之前的分数用于比较
        setPreviousScores({ ...scores })
        
        // 更新分数为AI评分
        const aiScoreMap: Record<string, number> = {}
        data.dimensions.forEach((dim: DimensionScore) => {
          const id = dimensionMapping[dim.name]
          if (id) {
            aiScoreMap[id] = dim.score
          }
        })
        setScores(prev => ({ ...prev, ...aiScoreMap }))
      } else {
        console.error('获取AI评分失败:', response.statusText)
      }
    } catch (error) {
      console.error('获取AI评分错误:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const toggleEvidence = (dimensionId: string) => {
    setShowEvidence(prev => ({
      ...prev,
      [dimensionId]: !prev[dimensionId]
    }))
  }
  
  const getScoreChangeIndicator = (dimensionId: string) => {
    if (!previousScores[dimensionId]) return null
    const prevScore = previousScores[dimensionId]
    const currentScore = scores[dimensionId]
    
    if (prevScore < currentScore) {
      return <span className="text-[var(--success)] ml-1">↗️ +{currentScore - prevScore}</span>
    } else if (prevScore > currentScore) {
      return <span className="text-[var(--error)] ml-1">↘️ {currentScore - prevScore}</span>
    }
    return <span className="text-[var(--text-tertiary)] ml-1">→</span>
  }

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">科学版生命之轮评估</h2>
        <button
          onClick={handleAIScore}
          disabled={loading}
          className="btn-secondary px-4 py-2 rounded-lg text-sm flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
              AI分析中...
            </>
          ) : (
            <>
              <span>🤖</span>
              AI智能评分
            </>
          )}
        </button>
      </div>
      
      <p className="text-[var(--text-secondary)] mb-6">
        为每个维度打分（1-10 分），10 分表示非常满意，1 分表示非常不满意
      </p>
      
      <div className="space-y-8">
        {dimensionLabels.map(dim => {
          const aiResult = aiResults.find(r => r.name === dim.name)
          return (
            <div key={dim.id} className="border border-[var(--border-subtle)] rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <label className="text-sm font-medium text-[var(--text-primary)]">
                    {dim.name}
                  </label>
                  <p className="text-xs text-[var(--text-secondary)]">{dim.desc}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[var(--accent)]">
                    {scores[dim.id]}/10
                  </span>
                  {previousScores[dim.id] !== undefined && getScoreChangeIndicator(dim.id)}
                </div>
              </div>
              
              <input
                type="range"
                min="1"
                max="10"
                value={scores[dim.id]}
                onChange={(e) => setScores({...scores, [dim.id]: parseInt(e.target.value)})}
                className="w-full h-2 bg-[var(--bg-elevated)] rounded-lg appearance-none cursor-pointer mb-2"
              />
              <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                <span>1</span>
                <span>5</span>
                <span>10</span>
              </div>
              
              {aiResult && (
                <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-medium text-[var(--accent)]">AI分析结果</span>
                    <button 
                      onClick={() => toggleEvidence(dim.id)}
                      className="text-xs text-[var(--accent)] hover:text-[var(--accent)]"
                    >
                      {showEvidence[dim.id] ? '收起详情' : '查看详情'}
                    </button>
                  </div>
                  
                  {showEvidence[dim.id] && (
                    <div className="text-xs bg-[var(--bg-primary)] p-3 rounded mt-2">
                      <div className="mb-2">
                        <strong>评分依据:</strong> {aiResult.evidence}
                      </div>
                      <div>
                        <strong>改进建议:</strong> {aiResult.suggestion}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      <button
        onClick={handleSubmit}
        className="w-full btn-primary mt-6 py-3"
      >
        保存评估
      </button>
    </div>
  )
}
