export type Plan = 'trial' | 'monthly' | 'yearly' | 'expired'

export const PLANS = {
  trial: { name: '免费试用', price: 0, days: 7, description: '7 天全功能体验' },
  monthly: { name: '月度会员', price: 79, days: 30, description: '全功能无限制' },
  yearly: { name: '年度会员', price: 399, days: 365, description: '全功能，最划算' },
  expired: { name: '已过期', price: 0, days: 0, description: '请续费使用' },
}

// 功能权限控制
export const FEATURE_LIMITS = {
  trial: { maxNotes: 20, aiSummary: true, aiGenerate: 5, weeklyReport: true, monthlyReport: false },
  monthly: { maxNotes: Infinity, aiSummary: true, aiGenerate: Infinity, weeklyReport: true, monthlyReport: true },
  yearly: { maxNotes: Infinity, aiSummary: true, aiGenerate: Infinity, weeklyReport: true, monthlyReport: true },
  expired: { maxNotes: 5, aiSummary: false, aiGenerate: 0, weeklyReport: false, monthlyReport: false },
}

export function isPlanActive(plan: Plan, endDate: string | null): boolean {
  if (!endDate) return false
  return new Date(endDate) > new Date()
}

export function getDaysRemaining(endDate: string | null): number {
  if (!endDate) return 0
  const diff = new Date(endDate).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}