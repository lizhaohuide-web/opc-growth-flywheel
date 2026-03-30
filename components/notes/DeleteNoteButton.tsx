'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  noteId: string
}

export default function DeleteNoteButton({ noteId }: Props) {
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  
  const handleDelete = async () => {
    if (deleting) return // 防止重复点击
    
    if (!confirm('确定要删除这篇笔记吗？此操作不可恢复。')) return
    
    setDeleting(true)
    
    try {
      // 乐观更新：先跳转，后台删除
      router.push('/dashboard/notes')
      
      const { error } = await supabase.from('notes').delete().eq('id', noteId)
      
      if (error) {
        throw error
      }
    } catch (error) {
      console.error('删除失败:', error)
      alert(`删除失败：${error instanceof Error ? error.message : '未知错误'}`)
      // 失败后返回上一页（可选）
      router.back()
    } finally {
      setDeleting(false)
    }
  }
  
  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-[var(--error)] hover:text-red-800 px-4 py-2 border border-red-200 rounded-md hover:bg-[rgba(248,113,113,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {deleting ? '删除中...' : '删除'}
    </button>
  )
}
