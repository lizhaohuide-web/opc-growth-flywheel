'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'

interface MonthlyReport {
  period: string
  stats: {
    totalNotes: number
    totalWords: number
    avgQualityScore: number
    bestNote: {
      id: string
      title: string
      content: string
      createdAt: string
      qualityScore: number
    } | null
  }
  trends: {
    weeks: Array<{ week: string; notes: number; words: number }>
    monthlyGrowth: number
  }
  wheelComparison: {
    current: Array<{ name: string; score: number }>
    previous: Array<{ name: string; score: number }> | null
  }
  contentStats: {
    generatedContents: number
    platformsUsed: string[]
  }
  aiAnalysis: string
  nextMonthGoals: string[]
}

export default function MonthlyReportPage() {
  const [report, setReport] = useState<MonthlyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch('/api/reports/monthly')
        if (!response.ok) {
          throw new Error('获取月报失败')
        }
        const data = await response.json()
        setReport(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '未知错误')
        console.error('获取月报错误:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-display" style={{ color: 'var(--text-primary)' }}>月度报告</h1>
          <Link href="/dashboard" style={{ color: 'var(--accent)' }}>← 返回仪表盘</Link>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 mx-auto" style={{ borderBottom: '2px solid var(--accent)' }}></div>
            <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>正在生成月度报告...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-display" style={{ color: 'var(--text-primary)' }}>月度报告</h1>
          <Link href="/dashboard" style={{ color: 'var(--accent)' }}>← 返回仪表盘</Link>
        </div>
        <div className="card p-6 text-center">
          <p style={{ color: 'var(--error)' }}>加载月报时出错：{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 rounded-lg"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-display" style={{ color: 'var(--text-primary)' }}>月度报告</h1>
          <Link href="/dashboard" style={{ color: 'var(--accent)' }}>← 返回仪表盘</Link>
        </div>
        <div className="card p-6 text-center">
          <p style={{ color: 'var(--text-secondary)' }}>暂无月度报告数据</p>
        </div>
      </div>
    )
  }

  const trendData = report.trends.weeks.map((week) => ({
    name: week.week.split(' - ')[0],
    笔记数：week.notes,
    字数：week.words
  }))

  const radarData = report.wheelComparison.current.map((dimension) => ({
    subject: dimension.name,
    本月：dimension.score,
    上月：report.wheelComparison.previous 
      ? report.wheelComparison.previous.find((prev) => prev.name === dimension.name)?.score || 0
      : 0
  }))

  return (
    <div className="container mx-auto px-4 py-8 animate-enter">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-display" style={{ color: 'var(--text-primary)' }}>月度报告</h1>
        <Link href="/dashboard" style={{ color: 'var(--accent)' }}>← 返回仪表盘</Link>
      </div>
      
      {/* 报告期间 */}
      <div className="card p-6 mb-8">
        <h2 className="text-lg font-display mb-2" style={{ color: 'var(--text-primary)' }}>📅 报告期间</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{report.period}</p>
      </div>
      
      {/* 月度统计总览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>笔记数量</h3>
          <p className="text-4xl font-body" style={{ color: 'var(--accent)' }}>{report.stats.totalNotes}</p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>篇</p>
        </div>
        <div className="card p-6">
          <h3 className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>总字数</h3>
          <p className="text-4xl font-body" style={{ color: 'var(--success)' }}>{report.stats.totalWords.toLocaleString()}</p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>字</p>
        </div>
        <div className="card p-6">
          <h3 className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>平均质量分</h3>
          <p className="text-4xl font-body" style={{ color: 'var(--accent-light)' }}>
            {typeof report.stats.avgQualityScore === 'number' 
              ? report.stats.avgQualityScore.toFixed(1) 
              : 'N/A'}
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>分</p>
        </div>
        <div className="card p-6">
          <h3 className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>月度增长</h3>
          <p
            className="text-4xl font-body"
            style={{ color: report.trends.monthlyGrowth >= 0 ? 'var(--success)' : 'var(--error)' }}
          >
            {report.trends.monthlyGrowth >= 0 ? '+' : ''}{report.trends.monthlyGrowth}%
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>环比</p>
        </div>
      </div>
      
      {/* 最佳笔记 */}
      {report.stats.bestNote && (
        <div className="card p-6 mb-8">
          <h2 className="text-lg font-display mb-4" style={{ color: 'var(--text-primary)' }}>🌟 本月最佳笔记</h2>
          <div
            className="p-4 rounded-lg"
            style={{
              background: 'rgba(251,191,36,0.1)',
              border: '1px solid rgba(251,191,36,0.2)',
            }}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{report.stats.bestNote.title}</h3>
              <span
                className="px-2 py-1 rounded-full text-sm"
                style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
              >
                质量分：{report.stats.bestNote.qualityScore}
              </span>
            </div>
            <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              {new Date(report.stats.bestNote.createdAt).toLocaleDateString('zh-CN')}
            </p>
            <p className="italic" style={{ color: 'var(--text-primary)' }}>&quot;{report.stats.bestNote.content}&quot;</p>
          </div>
        </div>
      )}
      
      {/* 月度成长趋势 */}
      <div className="card p-6 mb-8">
        <h2 className="text-lg font-display mb-4" style={{ color: 'var(--text-primary)' }}>📈 月度成长趋势（按周）</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="name" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="笔记数" stroke="var(--accent)" activeDot={{ r: 8 }} strokeWidth={2} />
              <Line type="monotone" dataKey="字数" stroke="var(--success)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* 能力雷达图月度对比 */}
      <div className="card p-6 mb-8">
        <h2 className="text-lg font-display mb-4" style={{ color: 'var(--text-primary)' }}>🔄 能力雷达图月度对比</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid stroke="var(--border-subtle)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
              <Radar name="本月" dataKey="本月" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.5} />
              {report.wheelComparison.previous && (
                <Radar name="上月" dataKey="上月" stroke="var(--warning)" fill="var(--warning)" fillOpacity={0.3} />
              )}
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {report.wheelComparison.previous 
              ? '蓝色为本月，黄色为上月对比' 
              : '本月生命之轮评估结果'}
          </p>
        </div>
      </div>
      
      {/* 内容变现统计 */}
      <div className="card p-6 mb-8">
        <h2 className="text-lg font-display mb-4" style={{ color: 'var(--text-primary)' }}>📱 内容变现统计</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className="p-4 rounded-lg"
            style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)' }}
          >
            <h3 className="font-semibold mb-2" style={{ color: 'var(--info)' }}>生成内容数量</h3>
            <p className="text-3xl font-display" style={{ color: 'var(--accent)' }}>{report.contentStats.generatedContents}</p>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>篇</p>
          </div>
          <div
            className="p-4 rounded-lg"
            style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)' }}
          >
            <h3 className="font-semibold mb-2" style={{ color: 'var(--accent)' }}>使用平台</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {report.contentStats.platformsUsed.length > 0 ? (
                report.contentStats.platformsUsed.map((platform: string, index: number) => (
                  <span 
                    key={index} 
                    className="px-3 py-1 rounded-full text-sm"
                    style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                  >
                    {platform}
                  </span>
                ))
              ) : (
                <span style={{ color: 'var(--text-tertiary)' }}>暂无数据</span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* AI 生成的月度成长报告 */}
      <div className="card p-6 mb-8">
        <h2 className="text-lg font-display mb-4" style={{ color: 'var(--text-primary)' }}>🤖 AI 月度成长分析</h2>
        <div
          className="p-6 rounded-lg"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
        >
          <p className="leading-relaxed" style={{ color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>{report.aiAnalysis}</p>
        </div>
      </div>
      
      {/* 下月目标建议 */}
      <div className="card p-6">
        <h2 className="text-lg font-display mb-4" style={{ color: 'var(--text-primary)' }}>🎯 下月目标建议</h2>
        <ul className="space-y-3">
          {report.nextMonthGoals.map((goal: string, index: number) => (
            <li 
              key={index} 
              className="flex items-start gap-3 p-3 rounded-lg"
              style={{
                background: 'rgba(52,211,153,0.1)',
                border: '1px solid rgba(52,211,153,0.2)',
              }}
            >
              <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
              <span style={{ color: 'var(--text-primary)' }}>{goal}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
