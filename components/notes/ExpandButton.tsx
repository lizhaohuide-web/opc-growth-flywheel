'use client'
import { marked } from 'marked'

export default function ExpandButton({ fullContent }: { fullContent: string }) {
  const handleExpand = () => {
    const contentDiv = document.getElementById('note-content')
    if (contentDiv) {
      contentDiv.innerHTML = marked(fullContent)
    }
    const expandBtn = document.getElementById('expand-btn')
    if (expandBtn) expandBtn.remove()
  }
  
  return (
    <button
      id="expand-btn"
      onClick={handleExpand}
      className="px-6 py-2.5 text-sm font-medium rounded-lg transition-colors"
      style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--border-accent)' }}
    >
      展开全文 ↓
    </button>
  )
}
