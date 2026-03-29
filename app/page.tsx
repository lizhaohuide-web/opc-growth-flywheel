import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-24 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 30% 20%, var(--accent) 0%, transparent 50%),
                           radial-gradient(circle at 70% 80%, var(--accent) 0%, transparent 50%)`
        }}></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10 animate-enter">
          <div className="mb-8">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase" 
              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--border-accent)' }}>
              One Person Company
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-display font-bold mb-6 tracking-tight">
            <span className="text-gradient">OPC</span> 增长飞轮
          </h1>
          <p className="text-xl sm:text-2xl mb-4 font-light" style={{ color: 'var(--text-primary)' }}>
            把思考变成收入
          </p>
          <p className="text-sm sm:text-base mb-12 max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            记录每日成长，AI 智能摘要，一键生成多平台内容，追踪成长轨迹
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="btn-primary px-8 py-4 text-base rounded-xl glow-accent">
              免费注册
            </Link>
            <Link href="/auth/login" className="btn-ghost px-8 py-4 text-base rounded-xl">
              登录
            </Link>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-24" style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-center mb-4">核心功能</h2>
          <p className="text-sm sm:text-base text-center mb-16" style={{ color: 'var(--text-tertiary)' }}>成长看得见 · 内容能变现 · 提升更高效</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '✦', title: '今日笔记', desc: 'Markdown 编辑器 + 18 种引导模板，让记录更简单' },
              { icon: '◈', title: '内容变形器', desc: '一键生成公众号、小红书、短视频文案，多平台分发' },
              { icon: '↗', title: '成长分析', desc: 'AI 质量评分 + 人生之轮 + 周月报，让成长看得见' },
            ].map((f, i) => (
              <div key={i} className="card p-6 sm:p-8 text-center group animate-enter" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="text-3xl sm:text-4xl mb-4 text-gradient">{f.icon}</div>
                <h3 className="text-base sm:text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
                <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          background: `linear-gradient(135deg, var(--accent) 0%, transparent 60%)`
        }}></div>
        <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
          <h2 className="text-2xl sm:text-3xl font-display font-bold mb-6">
            开始你的成长之旅
          </h2>
          <p className="text-sm sm:text-lg mb-10" style={{ color: 'var(--text-secondary)' }}>
            每天 10 分钟，记录思考，生成内容，建立个人影响力
          </p>
          <Link href="/auth/register" className="btn-primary px-10 py-4 rounded-xl text-base glow-accent inline-block">
            立即开始 — 免费使用
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="max-w-6xl mx-auto px-4 text-center text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <p>© 2026 OPC 增长飞轮 — One Person Company Growth Engine</p>
          <p className="mt-2">构建于 Next.js + Supabase + AI</p>
        </div>
      </footer>
    </div>
  )
}
