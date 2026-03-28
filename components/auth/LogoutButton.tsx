'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const supabase = createClient()
  const router = useRouter()
  
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }
  
  return (
    <button
      onClick={handleLogout}
      className="transition-colors"
      style={{ color: 'var(--text-secondary)' }}
    >
      退出
    </button>
  )
}
