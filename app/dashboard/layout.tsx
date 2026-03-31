'use client'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'
import LogoutButton from '@/components/auth/LogoutButton'

interface Props {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: Props) {
  const pathname = usePathname()
  const { user, loading } = useUser()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  
  useEffect(() => {
    async function fetchSubscriptionStatus() {
      if (user) {
        try {
          const res = await fetch('/api/subscription/status')
          const data = await res.json()
          setSubscriptionStatus(data)
        } catch (error) {
          console.error('获取订阅状态失败:', error)
        } finally {
          setSubscriptionLoading(false)
        }
      }
    }
    fetchSubscriptionStatus()
  }, [user])

  const navItems = [
    { href: '/dashboard', label: '仪表盘', icon: '◆' },
    { href: '/dashboard/notes', label: '笔记', icon: '▦' },
    { href: '/dashboard/notes/new', label: '创作', icon: '✦' },
    { href: '/dashboard/ai-studio', label: 'AI 工作室', icon: '◈' },
    { href: '/dashboard/reports/growth', label: '成长', icon: '↗' },
    { 
      href: '/dashboard/subscription', 
      label: '订阅', 
      icon: '◇',
      badge: subscriptionStatus && !subscriptionStatus.isActive && subscriptionStatus.plan !== 'expired' 
        ? '试用' 
        : subscriptionStatus && subscriptionStatus.plan === 'expired' 
          ? '过期' 
          : null
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center animate-enter">
          <div className="w-8 h-8 border-2 border-accent rounded-full border-t-transparent animate-spin mx-auto" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}></div>
          <p className="mt-4" style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      {/* 侧边导航 - 桌面 */}
      <aside className="hidden md:flex md:flex-col md:w-60 md:fixed md:inset-y-0" style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-subtle)' }}>
        {/* 顶部金色装饰线 */}
        <div style={{ height: '2px', background: 'linear-gradient(90deg, var(--accent), transparent)' }}></div>
        
        <div className="flex items-center h-16 flex-shrink-0 px-6">
          <Link href="/dashboard" className="font-display text-lg tracking-tight" style={{ color: 'var(--text-primary)' }}>
            <span className="text-gradient">OPC</span>
            <span style={{ color: 'var(--text-tertiary)', fontWeight: 400, marginLeft: '0.5rem', fontSize: '0.875rem', fontFamily: 'var(--font-body)' }}>增长飞轮</span>
          </Link>
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item, i) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group relative"
                style={{
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--accent-subtle)' : 'transparent',
                }}
              >
                {/* 激活指示器 */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full" style={{ background: 'var(--accent)' }}></div>
                )}
                <span className="w-6 text-center mr-3 text-sm" style={{ 
                  color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
                  fontFamily: 'var(--font-body)'
                }}>
                  {item.icon}
                </span>
                <span className="text-sm font-medium flex-1">{item.label}</span>
                {item.badge && (
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{
                    background: item.badge === '过期' ? 'rgba(248,113,113,0.15)' : 'var(--accent-subtle)',
                    color: item.badge === '过期' ? 'var(--error)' : 'var(--accent)',
                    fontSize: '0.7rem',
                  }}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="px-4 py-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center justify-between">
            <div className="text-xs truncate mr-2" style={{ color: 'var(--text-tertiary)' }}>
              {user?.email}
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* 移动端顶部栏 */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 z-50" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ height: '1px', background: 'linear-gradient(90deg, var(--accent), transparent)' }}></div>
        <div className="flex items-center justify-between h-full px-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-display text-sm" style={{ color: 'var(--text-primary)' }}>
            <span className="text-gradient">OPC</span>
          </span>
          <div className="w-9"></div>
        </div>

        {/* 移动端抽屉 */}
        {sidebarOpen && (
          <>
            <div className="fixed inset-0 top-14 bg-black/60 backdrop-blur-sm z-40" onClick={() => setSidebarOpen(false)}></div>
            <div className="absolute top-14 left-0 bottom-0 w-64 z-50 animate-enter" style={{ background: 'var(--bg-secondary)', position: 'fixed', borderRight: '1px solid var(--border-subtle)' }}>
              <nav className="p-4 space-y-1">
                {navItems.map(item => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center px-3 py-3 rounded-lg transition-all relative"
                      style={{
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        background: isActive ? 'var(--accent-subtle)' : 'transparent',
                      }}
                    >
                      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full" style={{ background: 'var(--accent)' }}></div>}
                      <span className="w-6 text-center mr-3 text-sm" style={{ color: isActive ? 'var(--accent)' : 'var(--text-tertiary)' }}>{item.icon}</span>
                      <span className="text-sm font-medium flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{
                          background: item.badge === '过期' ? 'rgba(248,113,113,0.15)' : 'var(--accent-subtle)',
                          color: item.badge === '过期' ? 'var(--error)' : 'var(--accent)',
                        }}>{item.badge}</span>
                      )}
                    </Link>
                  )
                })}
                <div className="pt-4 mt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <div className="px-3 text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>{user?.email}</div>
                  <LogoutButton />
                </div>
              </nav>
            </div>
          </>
        )}
      </div>

      {/* 主内容区 */}
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 bg-noise" style={{ minHeight: '100vh' }}>
        <div className="p-5 md:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
