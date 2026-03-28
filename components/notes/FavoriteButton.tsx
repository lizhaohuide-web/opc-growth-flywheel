'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  noteId: string
  initialFavorited?: boolean
}

export default function FavoriteButton({ noteId, initialFavorited = false }: Props) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  
  useEffect(() => {
    setFavorited(initialFavorited)
  }, [initialFavorited])
  
  const handleToggleFavorite = async () => {
    if (loading) return
    
    setLoading(true)
    try {
      const newFavorited = !favorited
      const { error } = await supabase
        .from('notes')
        .update({ is_favorited: newFavorited })
        .eq('id', noteId)
      
      if (error) {
        console.error('更新收藏状态失败:', error)
        alert('更新收藏状态失败，请重试')
      } else {
        setFavorited(newFavorited)
      }
    } catch (error) {
      console.error('切换收藏状态时出错:', error)
      alert('操作失败，请重试')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <button
      onClick={handleToggleFavorite}
      disabled={loading}
      className="px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
      style={favorited 
        ? { background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--border-accent)' }
        : { background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }
      }
      title={favorited ? '取消收藏' : '收藏'}
    >
      <span>{favorited ? '★' : '☆'}</span>
      <span className="hidden sm:inline">{favorited ? '已收藏' : '收藏'}</span>
    </button>
  )
}
