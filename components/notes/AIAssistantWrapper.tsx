'use client'
import AIAssistantPanel from './AIAssistantPanel'
import { useState, useEffect } from 'react'

interface Props {
  noteId: string
  noteContent: string
  noteTitle: string
}

export default function AIAssistantWrapper({ noteId, noteContent, noteTitle }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(168,85,247,0.05) 50%, rgba(236,72,153,0.05) 100%)',
          border: '1px solid rgba(99,102,241,0.2)',
        }}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🤖</span>
            <div>
              <h2 className="text-lg font-display" style={{ color: 'var(--text-primary)' }}>AI 助手</h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>内容改写 · 知识推荐</p>
            </div>
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
        </div>
      </div>
    )
  }

  return <AIAssistantPanel noteId={noteId} noteContent={noteContent} noteTitle={noteTitle} />
}
