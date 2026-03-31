'use client'

interface Props {
  children: React.ReactNode
}

export default function AIStudioLayout({ children }: Props) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {children}
    </div>
  )
}
