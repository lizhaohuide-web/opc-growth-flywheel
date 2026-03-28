'use client'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'

export default function Header() {
  const { user, loading } = useUser()
  
  return (
    <header className="border-b bg-[var(--bg-card)]">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-[var(--text-primary)]">
            OPC 增长飞轮
          </Link>
          
          <nav className="flex items-center gap-4">
            {loading ? (
              <span className="text-[var(--text-secondary)]">加载中...</span>
            ) : user ? (
              <>
                <Link href="/dashboard" className="text-[var(--text-primary)] hover:text-[var(--text-primary)]">
                  仪表盘
                </Link>
                <Link href="/auth/logout" className="text-[var(--text-primary)] hover:text-[var(--text-primary)]">
                  退出
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-[var(--text-primary)] hover:text-[var(--text-primary)]">
                  登录
                </Link>
                <Link 
                  href="/auth/register" 
                  className="bg-[var(--accent)] text-white px-4 py-2 rounded-md hover:bg-[var(--accent-light)]"
                >
                  注册
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
