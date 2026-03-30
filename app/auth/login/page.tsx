'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-noise" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-md w-full mx-4 animate-enter">
        {/* 卡片 */}
        <div className="rounded-2xl p-8 space-y-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          {/* 标题区 */}
          <div className="text-center space-y-2">
            <h1 className="font-display text-3xl tracking-tight">
              <span className="text-gradient">OPC</span>
            </h1>
            <h2 className="text-xl font-display" style={{ color: 'var(--text-primary)' }}>
              增长飞轮
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>成长看得见</p>
          </div>
          
          <form className="space-y-5" onSubmit={handleLogin}>
            {error && (
              <div className="px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--error)', border: '1px solid rgba(248,113,113,0.2)' }}>
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  邮箱
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--border-accent)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                  placeholder="your@email.com"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  密码
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--border-accent)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登录中...' : '登录'}
            </button>
            
            <div className="text-center">
              <Link 
                href="/auth/forgot-password" 
                className="text-sm transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
              >
                忘记密码？
              </Link>
            </div>
          </form>
          
          <div className="text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
            还没有账号？{' '}
            <Link href="/auth/register" className="transition-colors" style={{ color: 'var(--accent)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-light)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--accent)')}
            >
              注册
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
