'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function WeeklyReportPage() {
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadReport() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const now = new Date()
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      weekStart.setHours(0, 0, 0, 0)

      const { data: notes } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', weekStart.toISOString())
        .order('created_at', { ascending: true })

      const allNotes = notes || []
      const totalNotes = allNotes.length
      const totalWords = allNotes.reduce((sum: number, n: any) => sum + (n.content?.length || 0), 0)

      const dailyMap: Record<string, { count: number; words: number }> = {}
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart)
        d.setDate(d.getDate() + i)
        const key = d.toLocaleDateString('zh-CN', { weekday: 'short' })
        dailyMap[key] = { count: 0, words: 0 }
      }
      allNotes.forEach((n: any) => {
        const d = new Date(n.created_at)
        const key = d.toLocaleDateString('zh-CN', { weekday: 'short' })
        if (dailyMap[key]) {
          dailyMap[key].count++
          dailyMap[key].words += n.content?.length || 0
        }
      })

      const chartData = Object.entries(dailyMap).map(([name, data]) => ({
        name, 笔记数：data.count, 字数：data.words
      }))

      const tagCount: Record<string, number> = {}
      allNotes.forEach((n: any) => {
        (n.tags || []).forEach((t: string) => { tagCount[t] = (tagCount[t] || 0) + 1 })
      })
      const topTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 5)

      setReport({
        totalNotes, totalWords, chartData, topTags,
        period: `${weekStart.toLocaleDateString('zh-CN')} ~ ${now.toLocaleDateString('zh-CN')}`
      })
      setLoading(false)
    }
    loadReport()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 mx-auto" style={{ borderBottom: '2px solid var(--accent)' }}></div>
          <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>生成周报中...</p>
        </div>
      </div>
    )
  }

  if (!report) return null

  return (
    <div className="container mx-auto px-4 py-8 animate-enter">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-display" style={{ color: 'var(--text-primary)' }}>📈 本周报告</h1>
        <Link href="/dashboard/reports/growth" style={{ color: 'var(--accent)' }}>
          ← 返回成长报告
        </Link>
      </div>

      <div className="card p-6 mb-6">
        <p style={{ color: 'var(--text-secondary)' }}>📅 {report.period}</p>
      </div>

      {/* 核心数据 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-6 text-center">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>笔记数量</p>
          <p className="text-3xl font-body mt-2" style={{ color: 'var(--accent)' }}>{report.totalNotes}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>篇</p>
        </div>
        <div className="card p-6 text-center">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>总字数</p>
          <p className="text-3xl font-body mt-2" style={{ color: 'var(--success)' }}>{report.totalWords.toLocaleString()}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>字</p>
        </div>
        <div className="card p-6 text-center">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>日均笔记</p>
          <p className="text-3xl font-body mt-2" style={{ color: 'var(--accent-light)' }}>{(report.totalNotes / 7).toFixed(1)}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>篇/天</p>
        </div>
        <div className="card p-6 text-center">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>热门标签</p>
          <p className="text-lg font-body mt-2" style={{ color: 'var(--warning)' }}>{report.topTags[0]?.[0] || '-'}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{report.topTags[0]?.[1] || 0} 次</p>
        </div>
      </div>

      {/* 知识积累曲线 */}
      <div className="card p-6 mb-8">
        <h2 className="text-lg font-display mb-4" style={{ color: 'var(--text-primary)' }}>📊 知识积累曲线</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={report.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="name" stroke="var(--text-secondary)" />
              <YAxis yAxisId="left" stroke="var(--text-secondary)" />
              <YAxis yAxisId="right" orientation="right" stroke="var(--text-secondary)" />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="笔记数" fill="var(--accent)" />
              <Bar yAxisId="right" dataKey="字数" fill="var(--success)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 标签分布 */}
      {report.topTags.length > 0 && (
        <div className="card p-6 mb-8">
          <h2 className="text-lg font-display mb-4" style={{ color: 'var(--text-primary)' }}>🏷️ 标签分布</h2>
          <div className="flex flex-wrap gap-2">
            {report.topTags.map(([tag, count]: [string, number]) => (
              <span
                key={tag}
                className="px-3 py-1.5 rounded-full text-sm font-medium"
                style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
              >
                #{tag} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 行动建议 */}
      <div
        className="rounded-xl p-6"
        style={{
          background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(168,85,247,0.1) 100%)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <h2 className="text-lg font-display mb-3" style={{ color: 'var(--text-primary)' }}>💡 行动建议</h2>
        <ul className="space-y-2" style={{ color: 'var(--text-primary)' }}>
          {report.totalNotes < 7 && <li>• 尝试每天记录一篇笔记，培养持续记录的习惯</li>}
          {report.totalNotes >= 7 && <li>• 👏 太棒了！本周每天都有记录，继续保持！</li>}
          {report.topTags[0] && <li>• 在「{report.topTags[0][0]}」领域继续深入学习</li>}
          {report.totalWords > 5000 && <li>• 你的写作量很棒，可以考虑用 AI 改写发布到社交平台</li>}
          {report.totalWords < 2000 && <li>• 试试写得更深入一些，每篇 300+ 字效果更好</li>}
        </ul>
      </div>
    </div>
  )
}
