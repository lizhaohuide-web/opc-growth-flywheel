'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import BadgeDisplay from '@/components/milestones/BadgeDisplay'

interface Stats {
  totalNotes: number
  todayNotes: number
  totalWords: number
  avgScore: number
  streak: number
}

interface Badge {
  id: string
  name: string
  category: string
  icon: string
  description: string
  achieved: boolean
}

interface MonthlyTrend {
  period: string
  notes: number
  words: number
  avgScore: number
  growth: number
}

interface DimensionScore {
  name: string
  score: number
  evidence: string
  suggestion: string
}

export default function GrowthReportPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [aiScores, setAiScores] = useState<DimensionScore[]>([])
  const [radarData, setRadarData] = useState<any[]>([])
  const [badges, setBadges] = useState<Badge[]>([])
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/reports/growth-stats')
        if (res.ok) setStats(await res.json())
      } catch {}
    }

    const fetchBadges = async () => {
      try {
        const res = await fetch('/api/reports/badges')
        if (res.ok) setBadges(await res.json())
      } catch {}
    }

    const fetchTrends = async () => {
      try {
        const res = await fetch('/api/reports/monthly-trends')
        if (res.ok) setMonthlyTrends(await res.json())
      } catch {}
    }

    const fetchAiScores = async () => {
      try {
        const res = await fetch('/api/reports/wheel-score')
        if (res.ok) {
          const data = await res.json()
          setAiScores(data.dimensions)
          setRadarData(data.dimensions.map((dim: DimensionScore) => ({
            subject: dim.name, score: dim.score, fullMark: 10
          })))
        }
      } catch {}
    }

    Promise.all([fetchStats(), fetchBadges(), fetchTrends(), fetchAiScores()])
      .finally(() => setLoading(false))
  }, [])

  const handleRefresh = async () => {
    setLoading(true)
    try {
      await fetch('/api/reports/wheel-score', { method: 'POST' })
      const [statsRes, badgesRes, trendsRes, scoresRes] = await Promise.all([
        fetch('/api/reports/growth-stats'),
        fetch('/api/reports/badges'),
        fetch('/api/reports/monthly-trends'),
        fetch('/api/reports/wheel-score')
      ])
      if (statsRes.ok) setStats(await statsRes.json())
      if (badgesRes.ok) setBadges(await badgesRes.json())
      if (trendsRes.ok) setMonthlyTrends(await trendsRes.json())
      if (scoresRes.ok) {
        const data = await scoresRes.json()
        setAiScores(data.dimensions)
        setRadarData(data.dimensions.map((dim: DimensionScore) => ({
          subject: dim.name, score: dim.score, fullMark: 10
        })))
      }
    } catch (e) {
      console.error('刷新失败:', e)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-body" style={{ color: 'var(--text-primary)' }}>成长报告</h1>
          <Link href="/dashboard" style={{ color: 'var(--accent)' }}>← 返回仪表盘</Link>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)] mx-auto"></div>
            <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>正在加载成长报告...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-enter">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-body" style={{ color: 'var(--text-primary)' }}>🌱 成长报告</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="btn-ghost px-4 py-2 text-sm rounded-lg flex items-center gap-2"
          >
            🔄 重新分析
          </button>
          <Link href="/dashboard" style={{ color: 'var(--accent)' }}>← 返回仪表盘</Link>
        </div>
      </div>

      {/* 周报 / 月报 快捷入口 */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link
          href="/dashboard/reports/weekly"
          className="rounded-xl p-5 flex items-center gap-4 transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(96,165,250,0.15) 0%, rgba(96,165,250,0.05) 100%)',
            border: '1px solid var(--border-accent)',
          }}
        >
          <span className="text-3xl">📈</span>
          <div>
            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>本周报告</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>查看本周笔记统计和知识积累曲线</p>
          </div>
        </Link>
        <Link
          href="/dashboard/reports/monthly"
          className="rounded-xl p-5 flex items-center gap-4 transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(52,211,153,0.15) 0%, rgba(52,211,153,0.05) 100%)',
            border: '1px solid var(--border-accent)',
          }}
        >
          <span className="text-3xl">📅</span>
          <div>
            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>月度报告</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>查看月度总结和人生之轮评估</p>
          </div>
        </Link>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="card p-5 text-center">
          <div className="text-4xl mb-2">📊</div>
          <div className="text-4xl font-body" style={{ color: 'var(--info)' }}>{stats?.totalNotes || 0}</div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>总笔记数</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-4xl mb-2">📝</div>
          <div className="text-4xl font-body" style={{ color: 'var(--success)' }}>{(stats?.totalWords || 0).toLocaleString()}</div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>总字数</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-4xl mb-2">🔥</div>
          <div className="text-4xl font-body" style={{ color: 'var(--warning)' }}>{stats?.streak || 0}</div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>连续天数</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-4xl mb-2">⭐</div>
          <div className="text-4xl font-body" style={{ color: 'var(--accent)' }}>{stats?.avgScore || 0}</div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>平均质量</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-4xl mb-2">🏆</div>
          <div className="text-4xl font-body" style={{ color: 'var(--accent-light)' }}>{badges.filter(b => b.achieved).length}</div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>获得徽章</div>
        </div>
      </div>

      {/* 生命之轮 AI 评估 */}
      <div className="card mb-8 p-6">
        <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>💎 科学版生命之轮分析</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border-subtle)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} />
                <Radar
                  name="得分"
                  dataKey="score"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  fill="var(--accent)"
                  fillOpacity={0.3}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'var(--bg-card)', 
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                  itemStyle={{ color: 'var(--accent)' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            {aiScores.map((dim: DimensionScore, index: number) => (
              <div key={index} className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{dim.name}</span>
                  <span className="text-lg font-bold" style={{ color: dim.score >= 8 ? 'var(--success)' : dim.score >= 6 ? 'var(--warning)' : 'var(--error)' }}>
                    {dim.score}
                  </span>
                </div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <div className="mb-1">✓ {dim.evidence}</div>
                  <div className="text-[var(--accent)]">💡 {dim.suggestion}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 月度趋势 */}
      {monthlyTrends.length > 0 ? (
        <div className="card mb-8 p-6">
          <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>📈 月度趋势</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyTrends}>
              <XAxis dataKey="period" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ 
                  background: 'var(--bg-card)', 
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                labelStyle={{ color: 'var(--text-primary)' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar yAxisId="left" name="笔记数" dataKey="notes" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="left" name="字数" dataKey="words" fill="var(--info)" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" name="均分" type="monotone" dataKey="avgScore" stroke="var(--success)" strokeWidth={2} dot={{ r: 4 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="card mb-8 p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>暂无趋势数据</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>开始记录笔记，积累月度数据后这里会显示趋势图表</p>
        </div>
      )}

      {/* 成就徽章 */}
      <div className="card p-6">
        <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>🏅 成就徽章</h2>
        <BadgeDisplay badges={badges} />
      </div>
    </div>
  )
}
