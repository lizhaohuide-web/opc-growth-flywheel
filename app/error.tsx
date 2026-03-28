'use client'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="text-center p-8 bg-[var(--bg-card)] rounded-2xl shadow-lg max-w-md">
        <div className="text-5xl mb-4">😅</div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">出了点问题</h2>
        <p className="text-[var(--text-secondary)] mb-6 text-sm">{error.message || '页面加载失败'}</p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-light)] transition-colors font-medium"
        >
          重试
        </button>
      </div>
    </div>
  )
}
