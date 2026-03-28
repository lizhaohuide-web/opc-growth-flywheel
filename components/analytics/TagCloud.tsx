'use client'

interface Props {
  tags: Array<{ tag: string; count: number }>
}

export default function TagCloud({ tags }: Props) {
  if (!tags || tags.length === 0) {
    return <p style={{ color: 'var(--text-secondary)' }}>暂无标签</p>
  }
  
  const maxCount = Math.max(...tags.map(t => t.count))
  
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(tag => {
        const size = 12 + (tag.count / maxCount) * 12
        return (
          <span
            key={tag.tag}
            className="px-3 py-1 rounded-full cursor-pointer transition-colors"
            style={{
              fontSize: `${size}px`,
              background: 'var(--accent)',
              color: '#fff',
            }}
          >
            {tag.tag} ({tag.count})
          </span>
        )
      })}
    </div>
  )
}
