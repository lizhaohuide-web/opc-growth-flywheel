'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import NoteSelector from '../components/NoteSelector'
import StyleSelector from '../components/StyleSelector'
import StepIndicator from '../components/StepIndicator'

interface Note {
  id: string
  title: string
  content: string
}

interface GeneratedCopy {
  titles: string[]
  summary: string
  content: string
  tags: string[]
}

interface Illustration {
  position: number
  paragraph: string
  prompt: string
  imageUrl?: string
  status: 'pending' | 'generating' | 'success' | 'error'
  error?: string
}

export default function WechatPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<string>('')
  const [generating, setGenerating] = useState(false)
  
  // 步骤 2 状态：生成的文案
  const [generatedCopy, setGeneratedCopy] = useState<GeneratedCopy | null>(null)
  const [selectedTitleIndex, setSelectedTitleIndex] = useState(0)
  
  // 步骤 3 状态：封面图
  const [coverImage, setCoverImage] = useState<string>('')
  const [generatingCover, setGeneratingCover] = useState(false)

  // 步骤 4 状态：配图
  const [illustrations, setIllustrations] = useState<Illustration[]>([])
  const [generatingIllustrations, setGeneratingIllustrations] = useState(false)
  const [selectedIllustrationCount, setSelectedIllustrationCount] = useState(3)

  // 步骤 5 状态：HTML 转换
  const [convertedHtml, setConvertedHtml] = useState<string>('')
  const [copyingHtml, setCopyingHtml] = useState(false)

  const steps = ['选择笔记', '选择风格', '生成文案', '生成封面', '生成配图', '预览保存']

  // 步骤 1: 生成文案
  const handleGenerateCopy = async () => {
    if (!selectedNote || !selectedStyle) return
    
    setGenerating(true)
    
    try {
      const response = await fetch('/api/ai-studio/wechat/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: selectedNote.id,
          style: selectedStyle,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setGeneratedCopy(data.data || {
          titles: ['AI 生成的标题'],
          summary: '',
          content: '生成内容失败',
          tags: ['公众号'],
        })
        setStep(2)
      } else {
        const error = await response.json()
        alert('生成失败：' + (error.error || '未知错误'))
      }
    } catch (error) {
      console.error('Generation failed:', error)
      alert('生成失败，请重试')
    } finally {
      setGenerating(false)
    }
  }

  // 重新生成文案
  const handleRegenerateCopy = async () => {
    if (!selectedNote || !selectedStyle) return
    
    setGenerating(true)
    try {
      const response = await fetch('/api/ai-studio/wechat/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: selectedNote.id,
          style: selectedStyle,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setGeneratedCopy(data.data || {
          titles: ['AI 生成的标题'],
          summary: '',
          content: '生成内容失败',
          tags: ['公众号'],
        })
      }
    } catch (error) {
      console.error('Regeneration failed:', error)
    } finally {
      setGenerating(false)
    }
  }

  // 步骤 2: 生成封面图
  const handleGenerateCover = async () => {
    if (!generatedCopy) return
    
    setGeneratingCover(true)
    
    try {
      const response = await fetch('/api/ai-studio/wechat/generate-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: generatedCopy.titles[selectedTitleIndex] || generatedCopy.titles[0],
          summary: generatedCopy.summary,
          style: selectedStyle,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setCoverImage(data.imageUrl || '')
        setStep(3)
      } else {
        const error = await response.json()
        alert('封面图生成失败：' + (error.error || '请重试'))
      }
    } catch (error) {
      console.error('Failed to generate cover:', error)
      alert('封面图生成失败，请重试')
    } finally {
      setGeneratingCover(false)
    }
  }

  // 步骤 3: 生成配图
  const handleGenerateIllustrations = async () => {
    if (!generatedCopy) return
    
    setGeneratingIllustrations(true)
    
    try {
      const response = await fetch('/api/ai-studio/wechat/generate-illustrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: generatedCopy.content,
          maxCount: selectedIllustrationCount,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setIllustrations(data.illustrations || [])
        setStep(4)
      } else {
        const error = await response.json()
        alert('配图生成失败：' + (error.error || '请重试'))
      }
    } catch (error) {
      console.error('Failed to generate illustrations:', error)
      alert('配图生成失败，请重试')
    } finally {
      setGeneratingIllustrations(false)
    }
  }

  // 生成单张配图
  const handleGenerateSingleIllustration = async (index: number) => {
    const illustration = illustrations[index]
    if (!illustration || !illustration.prompt) return
    
    const updated = [...illustrations]
    updated[index] = { ...illustration, status: 'generating' }
    setIllustrations(updated)
    
    try {
      const response = await fetch('/api/ai-studio/wechat/generate-illustration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: illustration.prompt,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        updated[index] = { 
          ...illustration, 
          imageUrl: data.imageUrl || '', 
          status: 'success' 
        }
      } else {
        const error = await response.json()
        updated[index] = { 
          ...illustration, 
          status: 'error',
          error: error.error || '生成失败' 
        }
      }
    } catch (error) {
      updated[index] = { 
        ...illustration, 
        status: 'error',
        error: '生成失败' 
      }
    }
    
    setIllustrations(updated)
  }

  // 重新生成所有配图
  const handleRegenerateIllustrations = async () => {
    await handleGenerateIllustrations()
  }

  // 复制 HTML
  const handleCopyHtml = async () => {
    if (!generatedCopy) return
    
    setCopyingHtml(true)
    
    try {
      const response = await fetch('/api/ai-studio/wechat/convert-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: generatedCopy.content,
          illustrations: illustrations.filter(ill => ill.status === 'success'),
          title: generatedCopy.titles[selectedTitleIndex],
          summary: generatedCopy.summary,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        await navigator.clipboard.writeText(data.contentHtml)
        alert('HTML 已复制到剪贴板！可以直接粘贴到公众号编辑器。')
      } else {
        alert('转换失败，请重试')
      }
    } catch (error) {
      console.error('Copy HTML failed:', error)
      alert('复制失败，请重试')
    } finally {
      setCopyingHtml(false)
    }
  }

  // 发布到公众号
  const handlePublishToWechat = () => {
    alert('公众号发布功能即将上线，目前请手动复制内容到公众号后台')
  }

  // 重新生成封面图
  const handleRegenerateCover = async () => {
    if (!generatedCopy) return
    
    setGeneratingCover(true)
    try {
      const response = await fetch('/api/ai-studio/wechat/generate-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: generatedCopy.titles[selectedTitleIndex] || generatedCopy.titles[0],
          summary: generatedCopy.summary,
          style: selectedStyle,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setCoverImage(data.imageUrl || '')
      }
    } catch (error) {
      console.error('Failed to regenerate cover:', error)
    } finally {
      setGeneratingCover(false)
    }
  }

  // 步骤 3: 保存
  const handleSave = async () => {
    if (!selectedNote || !generatedCopy) return
    
    try {
      const supabase = createClient()
      const { data: existingVersions } = await supabase
        .from('ai_versions')
        .select('version')
        .eq('note_id', selectedNote.id)
        .eq('platform', 'wechat')
        .order('version', { ascending: false })
        .limit(1)
      
      const nextVersion = (existingVersions && existingVersions.length > 0) 
        ? (existingVersions[0].version || 0) + 1 
        : 1
      
      const { data: user } = await supabase.auth.getUser()
      
      // 保存版本到数据库
      const { error: insertError } = await supabase.from('ai_versions').insert({
        note_id: selectedNote.id,
        platform: 'wechat',
        version: nextVersion,
        content: generatedCopy.content,
        style: selectedStyle,
        user_id: user.user?.id,
        // 使用 metadata 字段存储标题、摘要、封面图等信息
        metadata: {
          titles: generatedCopy.titles,
          selectedTitle: generatedCopy.titles[selectedTitleIndex],
          summary: generatedCopy.summary,
          tags: generatedCopy.tags,
          coverImage: coverImage,
          illustrations: illustrations,
        },
      })
      
      if (insertError) {
        console.error('保存失败:', insertError)
        throw insertError
      }
      
      alert('保存成功！')
      router.push('/dashboard/ai-studio')
    } catch (error) {
      console.error('Save failed:', error)
      alert('保存失败，请重试')
    }
  }

  return (
    <div className="max-w-4xl mx-auto animate-enter">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-sm mb-4 transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </button>
        
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">📝</span>
          <div>
            <h1 className="text-3xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>
              公众号改写
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              生成专业深度的公众号文章
            </p>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <StepIndicator steps={steps} currentStep={step} />

      {/* Step 0: Select Note */}
      {step === 0 && (
        <div className="card p-6 space-y-6">
          <NoteSelector
            selectedNoteId={selectedNote?.id}
            onSelectNote={(note) => {
              setSelectedNote(note)
              setStep(1)
            }}
            placeholder="点击选择一篇笔记..."
          />
          
          {selectedNote && (
            <div
              className="p-4 rounded-lg"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <h3 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                笔记预览
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {selectedNote.content.substring(0, 300)}...
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 1: Select Style */}
      {step === 1 && (
        <div className="card p-6 space-y-6">
          <StyleSelector
            selectedStyle={selectedStyle}
            onSelectStyle={setSelectedStyle}
            platform="wechat"
          />
          
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setStep(0)}
              className="px-6 py-2.5 rounded-lg font-medium transition-colors"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
              }}
            >
              上一步
            </button>
            <button
              onClick={handleGenerateCopy}
              disabled={!selectedStyle || generating}
              className="flex-1 px-6 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50"
              style={{
                background: selectedStyle ? '#07C160' : 'var(--bg-elevated)',
                color: selectedStyle ? '#fff' : 'var(--text-tertiary)',
              }}
            >
              {generating ? '生成中...' : '开始生成文案'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Generated Copy */}
      {step === 2 && generatedCopy && (
        <div className="space-y-6">
          {/* 标题选择 */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                推荐标题（点击选择）
              </h3>
              <button
                onClick={handleRegenerateCopy}
                disabled={generating}
                className="text-sm px-3 py-1.5 rounded-lg transition-colors"
                style={{
                  background: 'var(--accent-subtle)',
                  color: 'var(--accent)',
                }}
              >
                🔄 重新生成
              </button>
            </div>
            <div className="space-y-3">
              {generatedCopy.titles.map((title, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedTitleIndex === index ? 'ring-2 ring-[#07C160]' : ''
                  }`}
                  style={{
                    background: selectedTitleIndex === index ? '#07C16010' : 'var(--bg-primary)',
                    border: `1px solid ${selectedTitleIndex === index ? '#07C160' : 'var(--border-subtle)'}`,
                  }}
                  onClick={() => setSelectedTitleIndex(index)}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        selectedTitleIndex === index ? 'bg-[#07C160] text-white' : ''
                      }`}
                      style={{
                        background: selectedTitleIndex === index ? undefined : '#07C16020',
                        color: selectedTitleIndex === index ? undefined : '#07C160',
                      }}
                    >
                      {index + 1}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 摘要 */}
          <div className="card p-6">
            <h3 className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
              摘要（可编辑）
            </h3>
            <textarea
              value={generatedCopy.summary}
              onChange={(e) => setGeneratedCopy({ ...generatedCopy, summary: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-lg text-sm resize-none"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* 正文 */}
          <div className="card p-6">
            <h3 className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
              正文内容（可编辑）
            </h3>
            <textarea
              value={generatedCopy.content}
              onChange={(e) => setGeneratedCopy({ ...generatedCopy, content: e.target.value })}
              rows={15}
              className="w-full px-4 py-3 rounded-lg text-sm resize-none"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* 标签 */}
          <div className="card p-6">
            <h3 className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
              标签
            </h3>
            <div className="flex flex-wrap gap-2">
              {generatedCopy.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 rounded-full text-xs"
                  style={{
                    background: '#07C16020',
                    color: '#07C160',
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2.5 rounded-lg font-medium transition-colors"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
              }}
            >
              上一步
            </button>
            <button
              onClick={handleGenerateCover}
              disabled={generatingCover}
              className="flex-1 px-6 py-2.5 rounded-lg font-medium transition-all"
              style={{
                background: '#07C160',
                color: '#fff',
              }}
            >
              {generatingCover ? '生成中...' : '下一步：生成封面图'}
            </button>
          </div>
        </div>
      )}



      {/* Step 3: Generated Cover */}
      {step === 3 && coverImage && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                封面图（900x383px）
              </h3>
              <button
                onClick={handleRegenerateCover}
                disabled={generatingCover}
                className="text-sm px-3 py-1.5 rounded-lg transition-colors"
                style={{
                  background: 'var(--accent-subtle)',
                  color: 'var(--accent)',
                }}
              >
                🔄 重新生成
              </button>
            </div>
            <div
              className="aspect-[900/383] rounded-lg overflow-hidden"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <img src={coverImage} alt="封面图" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2.5 rounded-lg font-medium transition-colors"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
              }}
            >
              上一步
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex-1 px-6 py-2.5 rounded-lg font-medium transition-all"
              style={{
                background: '#07C160',
                color: '#fff',
              }}
            >
              下一步：生成配图 →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Generate Illustrations */}
      {step === 4 && generatedCopy && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                生成文章配图
              </h3>
              {illustrations.length > 0 && (
                <button
                  onClick={handleRegenerateIllustrations}
                  disabled={generatingIllustrations}
                  className="text-sm px-3 py-1.5 rounded-lg transition-colors"
                  style={{
                    background: 'var(--accent-subtle)',
                    color: 'var(--accent)',
                  }}
                >
                  🔄 重新生成
                </button>
              )}
            </div>
            
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              AI 将分析文章内容，为关键段落自动生成配图。您可以选择生成 1-5 张配图。
            </p>

            {/* 配图数量选择 */}
            <div className="mb-6">
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-primary)' }}>
                配图数量
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((count) => (
                  <button
                    key={count}
                    onClick={() => setSelectedIllustrationCount(count)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedIllustrationCount === count ? 'ring-2 ring-[#07C160]' : ''
                    }`}
                    style={{
                      background: selectedIllustrationCount === count ? '#07C160' : 'var(--bg-primary)',
                      color: selectedIllustrationCount === count ? '#fff' : 'var(--text-primary)',
                      border: selectedIllustrationCount === count ? '1px solid #07C160' : '1px solid var(--border-subtle)',
                    }}
                  >
                    {count}张
                  </button>
                ))}
              </div>
            </div>

            {illustrations.length === 0 ? (
              <button
                onClick={handleGenerateIllustrations}
                disabled={generatingIllustrations}
                className="w-full px-6 py-3 rounded-lg font-medium transition-all"
                style={{
                  background: '#07C160',
                  color: '#fff',
                }}
              >
                {generatingIllustrations ? '生成中...' : '✨ 开始生成配图'}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    已生成 {illustrations.length} 张配图提示词
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        // 生成所有配图
                        illustrations.forEach((_, idx) => {
                          if (illustrations[idx].status === 'pending') {
                            setTimeout(() => handleGenerateSingleIllustration(idx), idx * 500)
                          }
                        })
                      }}
                      disabled={generatingIllustrations}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{
                        background: 'var(--accent-subtle)',
                        color: 'var(--accent)',
                      }}
                    >
                      🎨 生成全部
                    </button>
                    <button
                      onClick={() => setStep(5)}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{
                        background: '#07C160',
                        color: '#fff',
                      }}
                    >
                      下一步：预览保存 →
                    </button>
                  </div>
                </div>

                {illustrations.map((illustration, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg"
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span
                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                        style={{
                          background: '#07C16020',
                          color: '#07C160',
                        }}
                      >
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                          {illustration.paragraph.substring(0, 100)}...
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          提示词：{illustration.prompt.substring(0, 150)}...
                        </p>
                      </div>
                    </div>

                    {illustration.status === 'pending' && (
                      <button
                        onClick={() => handleGenerateSingleIllustration(index)}
                        className="w-full px-4 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background: 'var(--accent-subtle)',
                          color: 'var(--accent)',
                        }}
                      >
                        🎨 生成此配图
                      </button>
                    )}

                    {illustration.status === 'generating' && (
                      <div className="flex items-center justify-center py-4">
                        <div className="w-6 h-6 border-2 rounded-full border-t-transparent animate-spin mr-2" style={{ borderColor: '#07C160', borderTopColor: 'transparent' }}></div>
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>生成中...</span>
                      </div>
                    )}

                    {illustration.status === 'success' && illustration.imageUrl && (
                      <div className="space-y-2">
                        <div className="aspect-[900/500] rounded-lg overflow-hidden">
                          <img src={illustration.imageUrl} alt="配图" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleGenerateSingleIllustration(index)}
                            className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                            style={{
                              background: 'var(--bg-elevated)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            🔄 重新生成
                          </button>
                        </div>
                      </div>
                    )}

                    {illustration.status === 'error' && (
                      <div className="text-sm" style={{ color: 'var(--error)' }}>
                        ❌ {illustration.error || '生成失败'}
                      </div>
                    )}
                  </div>
                ))}

                <button
                  onClick={() => setStep(5)}
                  className="w-full px-6 py-3 rounded-lg font-medium transition-all"
                  style={{
                    background: '#07C160',
                    color: '#fff',
                  }}
                >
                  下一步：预览保存 →
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setStep(3)}
              className="px-6 py-2.5 rounded-lg font-medium transition-colors"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
              }}
            >
              上一步
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Preview with Illustrations */}
      {step === 5 && generatedCopy && (
        <div className="space-y-6">
          {/* 封面图预览 */}
          {coverImage && (
            <div className="card p-6">
              <h3 className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
                封面图
              </h3>
              <div className="aspect-[900/383] rounded-lg overflow-hidden">
                <img src={coverImage} alt="封面图" className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          {/* 标题选择 */}
          <div className="card p-6">
            <h3 className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
              标题：{generatedCopy.titles[selectedTitleIndex] || generatedCopy.titles[0]}
            </h3>
          </div>

          {/* 正文预览（带配图插入功能） */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                正文预览
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyHtml}
                  disabled={copyingHtml}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-secondary)',
                    opacity: copyingHtml ? 0.5 : 1,
                  }}
                >
                  {copyingHtml ? '复制中...' : '📋 复制 HTML'}
                </button>
                <button
                  onClick={handlePublishToWechat}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: '#07C160',
                    color: '#fff',
                  }}
                >
                  📤 发布到公众号
                </button>
              </div>
            </div>

            <div
              className="prose max-w-none p-4 rounded-lg"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              {(() => {
                const paragraphs = generatedCopy.content.split(/\n\n+/)
                const successfulIllustrations = illustrations.filter(ill => ill.status === 'success')
                
                return paragraphs.map((paragraph, idx) => (
                  <div key={idx} className="mb-4">
                    <p className="text-sm leading-relaxed">{paragraph}</p>
                    
                    {/* 插入配图按钮 - 每个段落后 */}
                    {successfulIllustrations.length > 0 && (
                      <div className="mt-3 p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                        <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                          在此处插入配图：
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {successfulIllustrations.map((ill, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                // 在实际应用中，这里应该更新 generatedCopy.content
                                // 由于状态管理复杂，这里仅做演示
                                const newContent = [...paragraphs]
                                newContent[idx] = paragraph + `\n\n![配图](${ill.imageUrl})`
                                setGeneratedCopy({ ...generatedCopy, content: newContent.join('\n\n') })
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:shadow-md"
                              style={{
                                background: '#07C16020',
                                color: '#07C160',
                                border: '1px solid #07C16040',
                              }}
                            >
                              🖼️ 插入配图 {i + 1}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              })()}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setStep(4)}
              className="px-6 py-2.5 rounded-lg font-medium transition-colors"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
              }}
            >
              上一步
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-2.5 rounded-lg font-medium transition-all"
              style={{
                background: '#07C160',
                color: '#fff',
              }}
            >
              💾 保存并返回
            </button>
          </div>
        </div>
      )}

      {/* Loading State - 统一加载动画 */}
      {generating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            className="card p-8 text-center"
            style={{
              background: 'var(--bg-secondary)',
              maxWidth: '400px',
            }}
          >
            <div className="w-12 h-12 border-4 rounded-full border-t-transparent animate-spin mx-auto mb-4" style={{ borderColor: '#07C160', borderTopColor: 'transparent' }}></div>
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              正在生成...
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              AI 正在为你生成公众号文案
            </p>
          </div>
        </div>
      )}

      {/* Cover Generating State - 统一封面生成加载动画 */}
      {generatingCover && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            className="card p-8 text-center"
            style={{
              background: 'var(--bg-secondary)',
              maxWidth: '400px',
            }}
          >
            <div className="w-12 h-12 border-4 rounded-full border-t-transparent animate-spin mx-auto mb-4" style={{ borderColor: '#07C160', borderTopColor: 'transparent' }}></div>
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              正在生成...
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              AI 正在为你生成封面图
            </p>
          </div>
        </div>
      )}

      {/* Illustrations Generating State - 统一配图生成加载动画 */}
      {generatingIllustrations && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            className="card p-8 text-center"
            style={{
              background: 'var(--bg-secondary)',
              maxWidth: '400px',
            }}
          >
            <div className="w-12 h-12 border-4 rounded-full border-t-transparent animate-spin mx-auto mb-4" style={{ borderColor: '#07C160', borderTopColor: 'transparent' }}></div>
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              正在生成...
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              AI 正在为你生成文章配图
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
