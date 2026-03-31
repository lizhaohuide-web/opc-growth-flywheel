'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Note {
  id: string
  title: string
  content: string
  created_at: string
  tags?: string[]
}

interface NoteSelectorProps {
  selectedNoteId?: string
  onSelectNote: (note: Note) => void
  placeholder?: string
}

export default function NoteSelector({ selectedNoteId, onSelectNote, placeholder = '选择一篇笔记...' }: NoteSelectorProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const fetchNotes = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setNotes(data)
      }
      setLoading(false)
    }
    
    fetchNotes()
  }, [])

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedNote = notes.find(n => n.id === selectedNoteId)

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
        选择笔记
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-xl text-left transition-all"
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          color: selectedNote ? 'var(--text-primary)' : 'var(--text-secondary)',
        }}
      >
        {selectedNote ? (
          <div>
            <div className="font-medium">{selectedNote.title || '无标题'}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              {new Date(selectedNote.created_at).toLocaleDateString('zh-CN')}
            </div>
          </div>
        ) : (
          placeholder
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div
            className="absolute z-20 w-full mt-2 rounded-xl shadow-lg overflow-hidden"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="p-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <input
                type="text"
                placeholder="搜索笔记..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
                autoFocus
              />
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center" style={{ color: 'var(--text-secondary)' }}>
                  加载中...
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="p-4 text-center" style={{ color: 'var(--text-tertiary)' }}>
                  没有找到笔记
                </div>
              ) : (
                filteredNotes.map(note => (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => {
                      onSelectNote(note)
                      setIsOpen(false)
                    }}
                    className="w-full p-3 text-left transition-colors hover:bg-[var(--bg-card-hover)]"
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {note.title || '无标题'}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {note.content.substring(0, 50)}...
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(note.created_at).toLocaleDateString('zh-CN')}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
