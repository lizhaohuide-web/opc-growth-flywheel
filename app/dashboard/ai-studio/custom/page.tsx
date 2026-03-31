'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import NoteSelector from '../components/NoteSelector'
import StepIndicator from '../components/StepIndicator'

interface Note {
  id: string
  title: string
  content: string
}

interface GeneratedResult {
  content: string
  imageUrls: string[]
}

export default function CustomPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [generating, setGenerating] = useState(false)
  
  // 步骤 1: 自定义文案改写
  const [customPrompt, setCustomPrompt] = useState('')
  const [generatedCopy, setGeneratedCopy] = useState<string>('')
  
  // 步骤 2: 图片生成设置
  const [imagePrompt, setImagePrompt] = useState('')
  const [imageCount, setImageCount] = useState(4)
  const [imageRatio, setImageRatio] = useState('3:4')
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [imageProgress, setImageProgress] = useState(0)
  const [generatingImages, setGeneratingImages] = useState(false)

  const steps = ['选择笔记', '自定义文案', '图片生成', '完成保存']

  // 步骤 0: 生成自定义文案
  const handleGenerateCopy = async () => {
    if (!customPrompt) {
      alert('请输入自定义提示词')
      return
    }
    
    setGenerating(true)
    
    try {
      const response = await fetch('/api/ai-studio/custom/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteContent: selectedNote?.content || '',
          customPrompt: customPrompt,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setGeneratedCopy(data.content || '生成内容失败')
        setStep(1)
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

  // 步骤 1: 生成图片
  const handleGenerateImages = async () => {
    if (!imagePrompt) {
      alert('请输入图片生成提示词')
      return
    }
    
    setGeneratingImages(true)
    setImageProgress(0)
    setStep(2)
    
    const images: string[] = []
    let failedCount = 0
    const failedIndexes: number[] = []
    
    try {
      for (let i = 0; i < imageCount; i++) {
        try {
          const response = await fetch('/api/ai-studio/xiaohongshu/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: imagePrompt,
              index: i,
              ratio: imageRatio,
            }),
          })
          
          if (response.ok) {
            const data = await response.json()
            const imageUrl = data.imageUrl || ''
            if (imageUrl) {
              images.push(imageUrl)
            } else {
              images.push('')
              failedCount++
              failedIndexes.push(i)
            }
          } else {
            images.push('')
            failedCount++
            failedIndexes.push(i)
          }
        } catch (error) {
          console.error(`生成第${i + 1}张图片失败:`, error)
          images.push('')
          failedCount++
          failedIndexes.push(i)
        }
        
        setImageProgress(Math.round(((i + 1) / imageCount) * 100))
      }
      
      setGeneratedImages(images)
      setTimeout(() => setStep(3), 800)
      
      if (failedCount > 0) {
        setTimeout(() => {
          alert(`已生成 ${imageCount - failedCount}/${imageCount} 张图片\n失败：${failedCount}张`)
        }, 1000)
      }
    } catch (error) {
      console.error('Failed to generate images:', error)
      setTimeout(() => setStep(3), 800)
      alert('生成图片过程中出错')
    } finally {
      setGeneratingImages(false)
    }
  }

  // 重新生成单张图片
  const handleRegenerateImage = async (index: number) => {
    setGenerating(true)
    try {
      const response = await fetch('/api/ai-studio/xiaohongshu/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          index: index,
          ratio: imageRatio,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        const newImages = [...generatedImages]
        newImages[index] = data.imageUrl || ''
        setGeneratedImages(newImages)
      } else {
        const error = await response.json()
        alert(`重新生成失败：${error.error || '请重试'}`)
      }
    } catch (error) {
      console.error('Failed to regenerate image:', error)
      alert('重新生成失败，请重试')
    } finally {
      setGenerating(false)
    }
  }

  // 保存
  const handleSave = async () => {
    if (!generatedCopy) return
    
    try {
      const supabase = createClient()
      
      // 获取下一个版本号
      const { data: existingVersions } = await supabase
        .from('ai_versions')
        .select('version')
        .eq('note_id', selectedNote?.id || 'custom')
        .eq('platform', 'custom')
        .order('version', { ascending: false })
        .limit(1)
      
      const nextVersion = (existingVersions && existingVersions.length > 0) 
        ? (existingVersions[0].version || 0) + 1 
        : 1
      
      const { data: user } = await supabase.auth.getUser()
      
      // 保存到数据库
      await supabase.from('ai_versions').insert({
        note_id: selectedNote?.id || 'custom',
        platform: 'custom',
        version: nextVersion,
        content: generatedCopy,
        user_id: user.user?.id,
        metadata: {
          image_urls: generatedImages,
          custom_prompt: customPrompt,
          image_prompt: imagePrompt,
        },
      })
      
      alert('保存成功！')
      router.push('/dashboard/ai-studio')
    } catch (error) {
      console.error('Save failed:', error)
      alert('保存失败，请重试')
    }
  }

  // 显示功能开发中提示
  const showComingSoon = (feature: string) => {
    alert(`${feature}功能开发中，敬请期待`)
  }

  return (
    <div className="max-w-4xl mx-auto animate-enter">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-sm transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </button>
        </div>
        
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">✨</span>
          <div>
            <h1 className="text-3xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>
              自定义创作
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              自由输入提示词，改写笔记或生成图片
            </p>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <StepIndicator steps={steps} currentStep={step} />

      {/* Step 0: 选择笔记 + 自定义提示词 */}
      {step === 0 && (
        <div className="card p-6 space-y-6">
          {/* 选择笔记（可选） */}
          <div>
            <h3 className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
              选择笔记（可选）
            </h3>
            <NoteSelector
              selectedNoteId={selectedNote?.id}
              onSelectNote={setSelectedNote}
              placeholder="不选择则直接输入提示词..."
            />
          </div>
          
          {/* 笔记预览 */}
          {selectedNote && (
            <div
              className="p-6 rounded-lg"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  笔记预览
                </h3>
                <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                  {selectedNote.content.length} 字
                </span>
              </div>
              <div className="prose prose-sm max-w-none" style={{ color: 'var(--text-secondary)' }}>
                <p className="whitespace-pre-wrap leading-relaxed">
                  {selectedNote.content}
                </p>
              </div>
            </div>
          )}

          {/* 自定义提示词 */}
          <div>
            <h3 className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
              自定义提示词
            </h3>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={6}
              placeholder="请输入你的创作指令，例如：&#10;- 帮我把这篇笔记改写成小红书风格&#10;- 提取文章要点，生成 5 个标题&#10;- 用幽默的语气重写这段内容&#10;- ..."
              className="w-full px-4 py-3 rounded-lg text-sm resize-none"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
            {selectedNote && (
              <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                💡 提示：已选择笔记内容将作为上下文提供给 AI
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            {selectedNote && (
              <button
                onClick={() => setSelectedNote(null)}
                className="px-4 md:px-6 py-3 rounded-lg font-medium transition-colors min-h-[44px]"
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)',
                }}
              >
                重新选择
              </button>
            )}
            <button
              onClick={handleGenerateCopy}
              disabled={!customPrompt || generating}
              className="flex-1 px-4 md:px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 min-h-[44px]"
              style={{
                background: customPrompt ? 'var(--accent)' : 'var(--bg-elevated)',
                color: customPrompt ? 'var(--bg-primary)' : 'var(--text-tertiary)',
              }}
            >
              {generating ? '生成中...' : '生成文案'}
            </button>
          </div>
        </div>
      )}

      {/* Step 1: 显示生成的文案 + 图片生成设置 */}
      {step === 1 && (
        <div className="space-y-6">
          {/* 文案编辑 */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                生成文案（可编辑）
              </h3>
              <button
                onClick={() => setStep(0)}
                className="text-sm px-3 py-1.5 rounded-lg transition-colors"
                style={{
                  background: 'var(--accent-subtle)',
                  color: 'var(--accent)',
                }}
              >
                🔄 重新生成
              </button>
            </div>
            
            <textarea
              value={generatedCopy}
              onChange={(e) => setGeneratedCopy(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 rounded-lg text-sm resize-none"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* 图片生成设置 */}
          <div className="card p-6">
            <h3 className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
              图片生成
            </h3>
            
            {/* 图片提示词 */}
            <div className="mb-4">
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                图片生成提示词
              </label>
              <textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                rows={3}
                placeholder="描述你想要生成的图片，例如：一个温馨的书桌场景，有笔记本电脑、咖啡杯和绿植，自然光线，极简风格"
                className="w-full px-4 py-3 rounded-lg text-sm resize-none"
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* 图片数量 */}
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                数量
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[1, 2, 3, 4, 5, 6].map(count => (
                  <button
                    key={count}
                    onClick={() => setImageCount(count)}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px] ${imageCount === count ? 'ring-2 ring-[var(--accent)]' : ''}`}
                    style={{
                      background: imageCount === count ? 'var(--accent)' : 'var(--bg-primary)',
                      color: imageCount === count ? 'var(--bg-primary)' : 'var(--text-primary)',
                      border: `1px solid ${imageCount === count ? 'var(--accent)' : 'var(--border-subtle)'}`,
                    }}
                  >
                    {count}张
                  </button>
                ))}
              </div>
            </div>

            {/* 图片比例 */}
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                比例
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {[
                  { id: '3:4', name: '3:4' },
                  { id: '1:1', name: '1:1' },
                  { id: '4:3', name: '4:3' },
                  { id: '9:16', name: '9:16' },
                  { id: '16:9', name: '16:9' },
                ].map(ratio => (
                  <button
                    key={ratio.id}
                    onClick={() => setImageRatio(ratio.id)}
                    className={`p-3 rounded-lg transition-all min-h-[44px] ${imageRatio === ratio.id ? 'ring-2 ring-[var(--accent)]' : ''}`}
                    style={{
                      background: imageRatio === ratio.id ? 'var(--accent-subtle)' : 'var(--bg-primary)',
                      border: `1px solid ${imageRatio === ratio.id ? 'var(--accent)' : 'var(--border-subtle)'}`,
                    }}
                  >
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {ratio.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* 音频/视频生成按钮（未开发） */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => showComingSoon('音频生成')}
                disabled
                className="px-4 py-3 rounded-lg font-medium transition-all min-h-[44px] opacity-50 cursor-not-allowed"
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-tertiary)',
                }}
              >
                🎵 音频生成
              </button>
              <button
                onClick={() => showComingSoon('视频生成')}
                disabled
                className="px-4 py-3 rounded-lg font-medium transition-all min-h-[44px] opacity-50 cursor-not-allowed"
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-tertiary)',
                }}
              >
                🎬 视频生成
              </button>
            </div>

            <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                onClick={() => setStep(0)}
                className="px-4 md:px-6 py-3 rounded-lg font-medium transition-colors min-h-[44px]"
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)',
                }}
              >
                上一步
              </button>
              <button
                onClick={handleGenerateImages}
                disabled={!imagePrompt || generating}
                className="flex-1 px-4 md:px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 min-h-[44px]"
                style={{
                  background: imagePrompt ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: imagePrompt ? 'var(--bg-primary)' : 'var(--text-tertiary)',
                }}
              >
                生成图片
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: 生成图片进度 */}
      {step === 2 && (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-6">🎨</div>
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            正在生成图片
          </h3>
          <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
            AI 正在精心绘制中，请耐心等待...
          </p>
          
          {/* 进度条 */}
          <div className="max-w-md mx-auto mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>生成进度</span>
              <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>{imageProgress}%</span>
            </div>
            <div
              className="h-3 rounded-full overflow-hidden"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${imageProgress}%`,
                  background: 'linear-gradient(90deg, var(--accent), var(--accent))',
                }}
              />
            </div>
          </div>
          
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            正在生成第 {Math.ceil((imageProgress / 100) * imageCount)} / {imageCount} 张图片
          </p>
        </div>
      )}

      {/* Step 3: 展示生成的图片 */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="card p-6 text-center">
            <div className="text-5xl mb-4">✨</div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              图片生成完成
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              已生成 {generatedImages.length} 张配图
            </p>
            
            {/* 图片预览 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 mb-6">
              {generatedImages.map((img, index) => (
                <div key={index} className="space-y-2">
                  <div
                    className="aspect-square rounded-lg overflow-hidden"
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {img ? (
                      <img src={img} alt={`图${index + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span style={{ color: 'var(--text-tertiary)' }}>图{index + 1}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRegenerateImage(index)}
                    disabled={generating}
                    className="w-full text-xs px-2 py-2 rounded-lg transition-all hover:shadow-md flex items-center justify-center gap-1 disabled:opacity-50 min-h-[44px]"
                    style={{
                      background: 'var(--bg-primary)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {generating ? (
                      <>
                        <span className="w-3 h-3 border border-current rounded-full border-t-transparent animate-spin"></span>
                        生成中...
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        重新生成
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setStep(1)}
              className="px-4 md:px-6 py-3 rounded-lg font-medium transition-colors min-h-[44px]"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
              }}
            >
              上一步
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 md:px-6 py-3 rounded-lg font-medium transition-all min-h-[44px]"
              style={{
                background: 'var(--accent)',
                color: 'var(--bg-primary)',
              }}
            >
              保存并返回
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {generating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            className="card p-8 text-center"
            style={{
              background: 'var(--bg-secondary)',
              maxWidth: '400px',
            }}
          >
            <div className="w-12 h-12 border-4 rounded-full border-t-transparent animate-spin mx-auto mb-4" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}></div>
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              正在生成...
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              AI 正在为你生成内容
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
