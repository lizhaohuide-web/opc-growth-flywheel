'use client'
import { useState } from 'react'

interface Props {
  noteId: string
  showDescription?: boolean
  compact?: boolean
}

export default function ContentGenerateButton({ noteId, showDescription, compact }: Props) {
  const [showOptions, setShowOptions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [showCustomPrompt, setShowCustomPrompt] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [showResultModal, setShowResultModal] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStatus, setGenerationStatus] = useState('')

  const platforms = [
    { id: 'wechat', name: '公众号文章', icon: '📱', description: '1500-2000 字深度文章' },
    { id: 'xiaohongshu', name: '小红书文案', icon: '📕', description: '300-500 字种草文案 + emoji' },
    { id: 'short_video', name: '短视频口播', icon: '🎬', description: '60-90 秒口播文案 + 拍摄建议' },
    { id: 'weibo', name: '微博线程', icon: '🐦', description: '5-10 条系列微博' },
    { id: 'podcast', name: '播客脚本', icon: '🎙️', description: '10-15 分钟播客脚本' },
  ]

  const handleGenerate = async (platform: string, customPromptValue?: string) => {
    if (!platform) return
    
    setLoading(true)
    setIsGenerating(true)
    setGenerationStatus('AI 正在生成内容...')
    setShowResultModal(true)
    setGeneratedContent('')
    
    try {
      const noteRes = await fetch(`/api/notes/${noteId}`)
      const noteData = await noteRes.json()
      const noteContent = noteData.content || ''
      
      if (!noteContent) {
        throw new Error('笔记内容为空')
      }
      
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: noteContent, 
          title: noteData.title || '',
          platform: platform === 'custom' ? undefined : platform,
          customPrompt: platform === 'custom' ? customPromptValue : undefined
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '内容生成失败')
      setGeneratedContent(data.result)
      setGenerationStatus('✅ 生成完成')
    } catch (error) {
      console.error('❌ 内容生成失败:', error)
      setGeneratedContent(`生成失败：${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
      setIsGenerating(false)
      setShowOptions(false)
      setShowCustomPrompt(false)
    }
  }

  const handleCustomSubmit = () => {
    if (customPrompt.trim()) {
      handleGenerate('custom', customPrompt.trim())
    }
  }

  const handleCopy = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent)
      alert('已复制到剪贴板')
    }
  }

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowOptions(!showOptions)}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
          title="内容生成"
        >
          <span className="text-xl">📱</span>
        </button>
        
        {showOptions && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowOptions(false)} />
            <div
              className="fixed top-20 right-4 md:right-auto md:left-1/2 md:-translate-x-1/2 w-[90vw] max-w-md card z-50 overflow-hidden max-h-[60vh] overflow-y-auto"
            >
              <div
                className="p-4 sticky top-0 flex items-center justify-between"
                style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}
              >
                <div>
                  <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>选择生成平台</h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>AI 将自动改写为对应格式</p>
                </div>
                <button onClick={() => setShowOptions(false)} className="p-1" style={{ color: 'var(--text-tertiary)' }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-2 space-y-1">
                {platforms.map(platform => (
                  <button
                    key={platform.id}
                    onClick={() => { setSelectedPlatform(platform.id); handleGenerate(platform.id); }}
                    disabled={loading}
                    className="w-full text-left p-3 rounded-lg transition-colors disabled:opacity-50"
                    style={{ color: 'var(--text-primary)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xl">{platform.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{platform.name}</div>
                        <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{platform.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
                
                <div className="pt-2 mt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    onClick={() => setShowCustomPrompt(!showCustomPrompt)}
                    className="w-full text-left p-3 rounded-lg transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xl">💬</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">自定义提示词</div>
                        <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>输入自定义指令生成内容</div>
                      </div>
                    </div>
                  </button>
                  
                  {showCustomPrompt && (
                    <div className="p-3 rounded-lg mt-2" style={{ background: 'var(--bg-elevated)' }}>
                      <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="请输入您希望 AI 执行的具体指令..."
                        className="w-full p-3 rounded-lg text-sm resize-none focus:outline-none"
                        rows={3}
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-primary)',
                        }}
                        onFocus={e => (e.target as HTMLElement).style.borderColor = 'var(--border-accent)'}
                        onBlur={e => (e.target as HTMLElement).style.borderColor = 'var(--border-subtle)'}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={handleCustomSubmit}
                          disabled={!customPrompt.trim()}
                          className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                          style={{ background: 'var(--accent)', color: '#fff' }}
                        >
                          生成
                        </button>
                        <button
                          onClick={() => setShowCustomPrompt(false)}
                          className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                          style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div
                className="p-4 sticky bottom-0"
                style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-subtle)' }}
              >
                <button
                  onClick={() => setShowOptions(false)}
                  className="w-full text-sm py-2 rounded-lg transition-colors"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
                >
                  取消
                </button>
              </div>
            </div>
          </>
        )}
        
        {showResultModal && (
          <>
            <div className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.6)' }} />
            <div
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-4xl max-h-[80vh] card z-50 overflow-hidden flex flex-col"
            >
              <div
                className="p-4 flex items-center justify-between"
                style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}
              >
                <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>AI 内容生成</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{generationStatus}</span>
                  <button onClick={() => setShowResultModal(false)} className="p-1" style={{ color: 'var(--text-tertiary)' }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto p-4">
                {isGenerating ? (
                  <div className="h-64 flex flex-col items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
                    <div className="animate-spin rounded-full h-12 w-12 mb-4" style={{ borderBottom: '2px solid var(--accent)' }}></div>
                    <p>AI 正在创作中...</p>
                    <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>内容将实时显示</p>
                  </div>
                ) : generatedContent ? (
                  <div
                    className="rounded-lg p-4 h-64 overflow-y-auto text-sm relative"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {generatedContent}
                    {isGenerating && (
                      <span className="inline-block w-2 h-5 ml-1 align-middle animate-blink" style={{ background: 'var(--text-primary)' }}></span>
                    )}
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
                    <p>正在生成内容...</p>
                  </div>
                )}
              </div>
              
              <div
                className="p-4 flex justify-end gap-2"
                style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-subtle)' }}
              >
                {generatedContent && !isGenerating && (
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{ background: 'var(--accent)', color: '#fff' }}
                  >
                    📋 复制内容
                  </button>
                )}
                <button
                  onClick={() => setShowResultModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
                >
                  关闭
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="col-span-1 relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={loading}
        className="w-full rounded-lg p-4 transition-all disabled:opacity-50"
        style={{
          background: 'var(--bg-card)',
          border: '2px solid var(--border-accent)',
          color: 'var(--text-primary)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="text-3xl">📱</div>
          <div className="text-left">
            <h3 className="font-semibold">内容生成</h3>
            {showDescription && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>多平台智能改写</p>}
          </div>
        </div>
        {loading && (
          <div className="mt-3 text-sm" style={{ color: 'var(--accent)' }}>
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4" style={{ borderBottom: '2px solid var(--accent)' }}></div>
              正在生成...
            </div>
          </div>
        )}
      </button>
      
      {showOptions && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowOptions(false)} />
          <div
            className="fixed top-20 right-4 md:right-auto md:left-1/2 md:-translate-x-1/2 w-[90vw] max-w-md card z-50 overflow-hidden max-h-[60vh] overflow-y-auto"
          >
            <div
              className="p-4 sticky top-0 flex items-center justify-between"
              style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}
            >
              <div>
                <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>选择生成平台</h3>
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>AI 将自动改写为对应格式</p>
              </div>
              <button onClick={() => setShowOptions(false)} className="p-1" style={{ color: 'var(--text-tertiary)' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-2 space-y-1">
              {platforms.map(platform => (
                <button
                  key={platform.id}
                  onClick={() => { setSelectedPlatform(platform.id); handleGenerate(platform.id); }}
                  disabled={loading}
                  className="w-full text-left p-3 rounded-lg transition-colors disabled:opacity-50"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xl">{platform.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{platform.name}</div>
                      <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{platform.description}</div>
                    </div>
                  </div>
                </button>
              ))}
              
              <div className="pt-2 mt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={() => setShowCustomPrompt(!showCustomPrompt)}
                  className="w-full text-left p-3 rounded-lg transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xl">💬</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">自定义提示词</div>
                      <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>输入自定义指令生成内容</div>
                    </div>
                  </div>
                </button>
                
                {showCustomPrompt && (
                  <div className="p-3 rounded-lg mt-2" style={{ background: 'var(--bg-elevated)' }}>
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="请输入您希望 AI 执行的具体指令..."
                      className="w-full p-3 rounded-lg text-sm resize-none focus:outline-none"
                      rows={3}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                      onFocus={e => (e.target as HTMLElement).style.borderColor = 'var(--border-accent)'}
                      onBlur={e => (e.target as HTMLElement).style.borderColor = 'var(--border-subtle)'}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleCustomSubmit}
                        disabled={!customPrompt.trim()}
                        className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        style={{ background: 'var(--accent)', color: '#fff' }}
                      >
                        生成
                      </button>
                      <button
                        onClick={() => setShowCustomPrompt(false)}
                        className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div
              className="p-4 sticky bottom-0"
              style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-subtle)' }}
            >
              <button
                onClick={() => setShowOptions(false)}
                className="w-full text-sm py-2 rounded-lg transition-colors"
                style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
              >
                取消
              </button>
            </div>
          </div>
        </>
      )}
      
      {showResultModal && (
        <>
          <div className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.6)' }} />
          <div
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-4xl max-h-[80vh] card z-50 overflow-hidden flex flex-col"
          >
            <div
              className="p-4 flex items-center justify-between"
              style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}
            >
              <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>AI 内容生成</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{generationStatus}</span>
                <button onClick={() => setShowResultModal(false)} className="p-1" style={{ color: 'var(--text-tertiary)' }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              {isGenerating ? (
                <div className="h-64 flex flex-col items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
                  <div className="animate-spin rounded-full h-12 w-12 mb-4" style={{ borderBottom: '2px solid var(--accent)' }}></div>
                  <p>AI 正在创作中...</p>
                  <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>内容将实时显示</p>
                </div>
              ) : generatedContent ? (
                <div
                  className="rounded-lg p-4 h-64 overflow-y-auto text-sm relative"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {generatedContent}
                  {isGenerating && (
                    <span className="inline-block w-2 h-5 ml-1 align-middle animate-blink" style={{ background: 'var(--text-primary)' }}></span>
                  )}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
                  <p>正在生成内容...</p>
                </div>
              )}
            </div>
            
            <div
              className="p-4 flex justify-end gap-2"
              style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-subtle)' }}
            >
              {generatedContent && !isGenerating && (
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
                  📋 复制内容
                </button>
              )}
              <button
                onClick={() => setShowResultModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
              >
                关闭
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
