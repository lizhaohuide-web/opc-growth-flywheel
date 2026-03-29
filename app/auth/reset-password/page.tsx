'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    // 验证密码
    if (newPassword.length < 6) {
      setError('密码长度至少 6 位')
      setLoading(false)
      return
    }
    
    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致')
      setLoading(false)
      return
    }
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      
      // 3 秒后跳转到登录页
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
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
              重置密码
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              设置你的新密码
            </p>
          </div>
          
          {success ? (
            <div className="space-y-6">
              <div className="p-4 rounded-lg text-center" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
                <div className="text-4xl mb-3">✅</div>
                <h3 className="font-bold mb-2" style={{ color: 'var(--success)' }}>密码已重置</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  正在跳转到登录页...
                </p>
              </div>
              
              <Link href="/auth/login" className="btn-primary w-full block text-center">
                立即登录
              </Link>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleResetPassword}>
              {error && (
                <div className="px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--error)', border: '1px solid rgba(248,113,113,0.2)' }}>
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    新密码
                  </label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--border-accent)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                    placeholder="至少 6 位"
                  />
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    确认密码
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--border-accent)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                    placeholder="再次输入新密码"
                  />
                </div>
              </div>

              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                💡 密码要求：至少 6 位，建议使用大小写字母 + 数字的组合
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '重置中...' : '重置密码'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
