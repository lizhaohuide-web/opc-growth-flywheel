'use client'

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center p-8 card max-w-md">
        <div className="text-5xl mb-4">😅</div>
        <h2 className="text-xl font-display mb-2" style={{ color: 'var(--text-primary)' }}>页面加载失败</h2>
        <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>{error.message}</p>
        <button
          onClick={reset}
          className="px-6 py-3 rounded-lg font-medium transition-colors"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          重试
        </button>
      </div>
    </div>
  )
}
