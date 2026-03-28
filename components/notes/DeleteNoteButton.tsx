'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  noteId: string
}

export default function DeleteNoteButton({ noteId }: Props) {
  const supabase = createClient()
  const router = useRouter()
  
  const handleDelete = async () => {
    if (!confirm('确定要删除这篇笔记吗？此操作不可恢复。')) return
    
    const { error } = await supabase.from('notes').delete().eq('id', noteId)
    
    if (error) {
      alert(error.message)
    } else {
      router.push('/dashboard/notes')
    }
  }
  
  return (
    <button
      onClick={handleDelete}
      className="text-[var(--error)] hover:text-red-800 px-4 py-2 border border-red-200 rounded-md hover:bg-[rgba(248,113,113,0.1)]"
    >
      删除
    </button>
  )
}
