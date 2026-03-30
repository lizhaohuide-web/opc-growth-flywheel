'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    })
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="max-w-md w-full space-y-8 p-8 bg-[var(--bg-card)] rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-[var(--text-primary)]">
            注册 OPC 增长飞轮
          </h2>
        </div>
        
        {success ? (
          <div className="bg-green-50 text-green-700 p-6 rounded">
            <div className="text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-bold mb-3">注册成功！</h3>
              <div className="space-y-2 text-sm">
                <p className="font-semibold">📧 请检查邮箱验证</p>
                <p className="text-[var(--text-secondary)]">验证邮件已发送到：<strong>{email}</strong></p>
                <p className="text-[var(--text-secondary)] text-xs mt-4">
                  💡 提示：如果没收到邮件，请检查垃圾邮件箱
                </p>
                <p className="text-[var(--text-secondary)] text-xs mt-2">
                  ⏱️ {loading ? '注册中...' : '3 秒后跳转到登录页...'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleRegister}>
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  姓名
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                  placeholder="张三"
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--border-accent)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
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
                  placeholder="your@email.com"
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--border-accent)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  密码（至少 8 位）
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                  placeholder="••••••••"
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--border-accent)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--accent)] hover:bg-[var(--accent-light)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)] disabled:opacity-50"
            >
              {loading ? '注册中...' : '注册'}
            </button>
          </form>
        )}
        
        <div className="text-center">
          <Link href="/auth/login" className="text-[var(--accent)] hover:text-[var(--accent)]">
            已有账号？登录
          </Link>
        </div>
      </div>
    </div>
  )
}
