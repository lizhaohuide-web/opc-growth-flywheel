'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
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
              忘记密码
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              输入邮箱，接收重置链接
            </p>
          </div>
          
          {success ? (
            <div className="space-y-6">
              <div className="p-4 rounded-lg text-center" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
                <div className="text-4xl mb-3">✅</div>
                <h3 className="font-bold mb-2" style={{ color: 'var(--success)' }}>邮件已发送</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  请检查邮箱 <strong>{email}</strong><br/>
                  点击邮件中的链接重置密码
                </p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setSuccess(false)
                    setEmail('')
                  }}
                  className="btn-ghost w-full"
                >
                  使用其他邮箱
                </button>
                <Link href="/auth/login" className="btn-primary w-full block text-center">
                  返回登录
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleResetRequest}>
              {error && (
                <div className="px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--error)', border: '1px solid rgba(248,113,113,0.2)' }}>
                  {error}
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  注册邮箱
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

              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                💡 提示：重置链接将发送到你的注册邮箱，请注意查收
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '发送中...' : '发送重置链接'}
              </button>
              
              <div className="text-center">
                <Link 
                  href="/auth/login" 
                  className="text-sm transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                >
                  ← 返回登录
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
