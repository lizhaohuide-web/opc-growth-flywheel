'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import NoteSelector from '../components/NoteSelector'
import StepIndicator from '../components/StepIndicator'

interface Note {
  id: string
  title: string
  content: string
}

const momentsStyles = [
  { id: '走心感悟', name: '走心感悟', description: '真诚分享内心感受', icon: '💭' },
  { id: '日常分享', name: '日常分享', description: '记录生活小确幸', icon: '☕' },
  { id: '鸡汤励志', name: '鸡汤励志', description: '正能量满满', icon: '💪' },
  { id: '幽默段子', name: '幽默段子', description: '有趣好玩', icon: '😄' },
  { id: '知识干货', name: '知识干货', description: '分享有价值信息', icon: '📚' },
]

const imageStyles = [
  { id: '生活记录', name: '生活记录', description: '日常场景', icon: '📸' },
  { id: '文艺清新', name: '文艺清新', description: '清新自然', icon: '🌿' },
  { id: '温暖治愈', name: '温暖治愈', description: '温馨氛围', icon: '☀️' },
  { id: '简约高级', name: '简约高级', description: '极简风格', icon: '✨' },
  { id: '复古怀旧', name: '复古怀旧', description: '复古色调', icon: '📼' },
  { id: '活力多彩', name: '活力多彩', description: '鲜艳活泼', icon: '🌈' },
]

export default function MomentsPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<string>('')
  const [generating, setGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<string>('')
  
  // 配图相关状态
  const [imageCount, setImageCount] = useState(3)
  const [imageStyle, setImageStyle] = useState('生活记录')
  const [imagePrompts, setImagePrompts] = useState<string[]>([])
  const [generatingPrompts, setGeneratingPrompts] = useState(false)
  const [imageProgress, setImageProgress] = useState(0)
  const [generatingImages, setGeneratingImages] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])

  const steps = ['选择笔记', '选择风格', '生成文案', '配图设置', '生成提示词', '生成图片', '完成']

  const handleGenerate = async () => {
    if (!selectedNote || !selectedStyle) return
    
    setGenerating(true)
    
    try {
      const response = await fetch('/api/ai-studio/moments/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: selectedNote.id,
          style: selectedStyle,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setGeneratedContent(data.content)
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

  // 生成配图提示词
  const handleGeneratePrompts = async () => {
    if (!selectedNote || !generatedContent || !imageStyle) return
    
    setGeneratingPrompts(true)
    
    try {
      const response = await fetch('/api/ai-studio/moments/generate-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: selectedNote.id,
          content: generatedContent,
          imageCount,
          style: imageStyle,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setImagePrompts(data.prompts || Array(imageCount).fill('生成提示词...'))
        setStep(4)
      } else {
        const error = await response.json()
        alert(`生成提示词失败：${error.error || '请重试'}`)
      }
    } catch (error) {
      console.error('Failed to generate prompts:', error)
      alert('生成提示词失败，请重试')
    } finally {
      setGeneratingPrompts(false)
    }
  }

  // 重新生成单个提示词
  const handleRegeneratePrompt = async (index: number) => {
    setGeneratingPrompts(true)
    try {
      const response = await fetch('/api/ai-studio/moments/generate-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: selectedNote?.id,
          content: generatedContent,
          imageCount: 1,
          style: imageStyle,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        const newPrompts = [...imagePrompts]
        newPrompts[index] = data.prompts?.[0] || imagePrompts[index]
        setImagePrompts(newPrompts)
      }
    } catch (error) {
      console.error('Failed to regenerate prompt:', error)
    } finally {
      setGeneratingPrompts(false)
    }
  }

  // 生成图片（带进度条）
  const handleGenerateImages = async () => {
    setGeneratingImages(true)
    setImageProgress(0)
    setStep(5)  // 先跳转到进度页面
    
    const images: string[] = []
    let failedCount = 0
    const failedIndexes: number[] = []
    
    try {
      for (let i = 0; i < imagePrompts.length; i++) {
        const prompt = imagePrompts[i]
        
        try {
          const response = await fetch('/api/ai-studio/moments/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: prompt,
              style: imageStyle,
              index: i,
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
            console.error(`生成第${i + 1}张图片失败:`, await response.text())
          }
        } catch (error) {
          console.error(`生成第${i + 1}张图片失败:`, error)
          images.push('')
          failedCount++
          failedIndexes.push(i)
        }
        
        // 更新进度
        setImageProgress(Math.round(((i + 1) / imagePrompts.length) * 100))
      }
      
      setGeneratedImages(images)
      
      // 无论成功失败，都跳转到图片预览页面（步骤 6）
      setTimeout(() => setStep(6), 800)
      
      // 显示结果提示
      if (failedCount > 0) {
        setTimeout(() => {
          alert(`已生成 ${imagePrompts.length - failedCount}/${imagePrompts.length} 张图片\n失败：${failedCount}张（第${failedIndexes.map(i => i + 1).join('、')}张）\n\n可以点击失败的图片重新生成`)
        }, 1000)
      }
    } catch (error) {
      console.error('Failed to generate images:', error)
      setTimeout(() => setStep(6), 800)
      alert('生成图片过程中出错，已生成的图片可以查看，失败的可以重新生成')
    } finally {
      setGeneratingImages(false)
    }
  }

  // 重新生成单张图片
  const handleRegenerateImage = async (index: number) => {
    setGeneratingImages(true)
    try {
      const response = await fetch('/api/ai-studio/moments/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompts[index],
          style: imageStyle,
          index: index,
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
      setGeneratingImages(false)
    }
  }

  const handleSave = async () => {
    if (!selectedNote || !generatedContent) return
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      // 获取当前最大版本号
      const { data: existingVersions } = await supabase
        .from('ai_versions')
        .select('version')
        .eq('note_id', selectedNote.id)
        .eq('platform', 'moments')
        .order('version', { ascending: false })
        .limit(1)
      
      const nextVersion = (existingVersions && existingVersions.length > 0) 
        ? (existingVersions[0].version || 0) + 1 
        : 1
      
      await supabase.from('ai_versions').insert({
        note_id: selectedNote.id,
        platform: 'moments',
        version: nextVersion,
        content: generatedContent,
        style: selectedStyle,
        user_id: user?.id,
        metadata: {
          style: selectedStyle,
          image_urls: generatedImages.filter(Boolean),
          image_prompts: imagePrompts,
        },
      })
      
      alert('保存成功！')
      router.push('/dashboard/ai-studio')
    } catch (error) {
      console.error('Save failed:', error)
      alert('保存失败，请重试')
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedContent)
      alert('已复制到剪贴板！')
    } catch (error) {
      alert('复制失败，请手动复制')
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
          <span className="text-4xl">💬</span>
          <div>
            <h1 className="text-3xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>
              朋友圈改写
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              生成生活化朋友圈文案 + 配图
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
          <div>
            <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
              选择风格
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {momentsStyles.map(option => {
                const isSelected = selectedStyle === option.id
                
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedStyle(option.id)}
                    className="p-4 rounded-xl text-left transition-all"
                    style={{
                      background: isSelected ? 'var(--accent-subtle)' : 'var(--bg-primary)',
                      border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                    }}
                  >
                    <div className="text-2xl mb-2">{option.icon}</div>
                    <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {option.name}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {option.description}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
          
          <div
            className="p-4 rounded-lg"
            style={{
              background: 'var(--accent-subtle)',
              border: '1px solid var(--border-accent)',
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div>
                <h4 className="font-medium text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                  朋友圈文案特点
                </h4>
                <ul className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                  <li>• 简短精炼，50-150 字最佳</li>
                  <li>• 生活化语言，接地气</li>
                  <li>• 真实情感，引发共鸣</li>
                  <li>• emoji 2-4 个，自然点缀</li>
                </ul>
              </div>
            </div>
          </div>
          
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
              onClick={handleGenerate}
              disabled={!selectedStyle || generating}
              className="flex-1 px-6 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50"
              style={{
                background: selectedStyle ? '#1aad19' : 'var(--bg-elevated)',
                color: selectedStyle ? 'white' : 'var(--text-tertiary)',
              }}
            >
              {generating ? '生成中...' : '开始生成'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Preview & Edit */}
      {step === 2 && generatedContent && (
        <div className="space-y-6">
          {/* Content Preview */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                朋友圈文案
              </h3>
              <button
                onClick={handleCopy}
                className="text-sm px-3 py-1.5 rounded-lg transition-colors"
                style={{
                  background: 'var(--accent-subtle)',
                  color: 'var(--accent)',
                }}
              >
                📋 复制
              </button>
            </div>
            
            <textarea
              value={generatedContent}
              onChange={(e) => setGeneratedContent(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 rounded-lg text-sm resize-none"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Character Count */}
          <div
            className="card p-4"
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                字数统计
              </span>
              <span
                className="text-sm font-medium"
                style={{
                  color: generatedContent.length >= 50 && generatedContent.length <= 150
                    ? 'var(--success)'
                    : 'var(--warning)',
                }}
              >
                {generatedContent.length} / 150 字
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2.5 rounded-lg font-medium transition-colors"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
              }}
            >
              重新生成
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 px-6 py-2.5 rounded-lg font-medium transition-colors"
              style={{
                background: '#1aad19',
                color: 'white',
              }}
            >
              下一步：配图设置
            </button>
          </div>
        </div>
      )}

      {/* Step 3: 配图设置 */}
      {step === 3 && (
        <div className="card p-6 space-y-6">
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            配图设置
          </h3>
          
          {/* 配图数量 */}
          <div>
            <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
              配图数量（朋友圈最多 9 张）
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(count => (
                <button
                  key={count}
                  onClick={() => setImageCount(count)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${imageCount === count ? 'ring-2 ring-[#1aad19]' : ''}`}
                  style={{
                    background: imageCount === count ? '#1aad19' : 'var(--bg-primary)',
                    color: imageCount === count ? '#fff' : 'var(--text-primary)',
                    border: `1px solid ${imageCount === count ? '#1aad19' : 'var(--border-subtle)'}`,
                  }}
                >
                  {count}张
                </button>
              ))}
            </div>
          </div>

          {/* 图片风格 */}
          <div>
            <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
              配图风格
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {imageStyles.map(style => (
                <button
                  key={style.id}
                  onClick={() => setImageStyle(style.id)}
                  className={`p-4 rounded-xl transition-all ${imageStyle === style.id ? 'ring-2 ring-[#1aad19]' : ''}`}
                  style={{
                    background: imageStyle === style.id ? '#1aad1915' : 'var(--bg-primary)',
                    border: `1px solid ${imageStyle === style.id ? '#1aad19' : 'var(--border-subtle)'}`,
                  }}
                >
                  <div className="text-2xl mb-2">{style.icon}</div>
                  <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                    {style.name}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {style.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div
            className="p-4 rounded-lg"
            style={{
              background: 'var(--accent-subtle)',
              border: '1px solid var(--border-accent)',
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div>
                <h4 className="font-medium text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                  配图说明
                </h4>
                <ul className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                  <li>• 使用通义万相 AI 生成配图</li>
                  <li>• 图片尺寸：1024×1024（朋友圈方图）</li>
                  <li>• 支持单独重新生成失败的图片</li>
                  <li>• 生成时间约 10-20 秒/张</li>
                </ul>
              </div>
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
              onClick={handleGeneratePrompts}
              disabled={generatingPrompts}
              className="flex-1 px-6 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50"
              style={{
                background: '#1aad19',
                color: 'white',
              }}
            >
              {generatingPrompts ? '生成中...' : '生成提示词'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: 显示和编辑提示词 */}
      {step === 4 && imagePrompts.length > 0 && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                配图提示词（可编辑）
              </h3>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                共{imagePrompts.length}张图
              </span>
            </div>
            <div className="space-y-4">
              {imagePrompts.map((prompt, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      图{index + 1}
                    </label>
                    <button
                      onClick={() => handleRegeneratePrompt(index)}
                      className="text-xs px-2 py-1 rounded-lg transition-all flex items-center gap-1"
                      style={{
                        background: 'var(--bg-primary)',
                        color: 'var(--accent)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      🔄 重生成
                    </button>
                  </div>
                  <textarea
                    value={prompt}
                    onChange={(e) => {
                      const newPrompts = [...imagePrompts]
                      newPrompts[index] = e.target.value
                      setImagePrompts(newPrompts)
                    }}
                    rows={2}
                    className="w-full px-4 py-3 rounded-lg text-sm resize-none"
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              ))}
            </div>
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
            <button
              onClick={handleGenerateImages}
              className="flex-1 px-6 py-2.5 rounded-lg font-medium transition-all"
              style={{
                background: '#1aad19',
                color: 'white',
              }}
            >
              确认生图
            </button>
          </div>
        </div>
      )}

      {/* Step 5: 生成图片进度 */}
      {step === 5 && (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-6">🎨</div>
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            正在生成配图
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
                  background: 'linear-gradient(90deg, #1aad19, #4ade80)',
                }}
              />
            </div>
          </div>
          
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            正在生成第 {Math.ceil((imageProgress / 100) * imagePrompts.length)} / {imagePrompts.length} 张图片
          </p>
        </div>
      )}

      {/* Step 6: 展示生成的图片 */}
      {step === 6 && (
        <div className="space-y-6">
          <div className="card p-6 text-center">
            <div className="text-5xl mb-4">✨</div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              配图生成完成
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              已生成 {generatedImages.filter(Boolean).length}/{generatedImages.length} 张配图
            </p>
            
            {/* 图片预览 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
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
                      <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
                        <span className="text-sm">图{index + 1}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRegenerateImage(index)}
                    disabled={generatingImages}
                    className="w-full text-xs px-2 py-2 rounded-lg transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                    style={{
                      background: 'var(--bg-primary)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {generatingImages ? (
                      <>
                        <span className="w-3 h-3 border border-current rounded-full border-t-transparent animate-spin"></span>
                        生成中...
                      </>
                    ) : (
                      <>
                        🔄 重新生成
                      </>
                    )}
                  </button>
                </div>
              ))}
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
              onClick={() => setStep(7)}
              className="flex-1 px-6 py-2.5 rounded-lg font-medium transition-all"
              style={{
                background: '#1aad19',
                color: 'white',
              }}
            >
              下一步：完成
            </button>
          </div>
        </div>
      )}

      {/* Step 7: 完成预览 */}
      {step === 7 && (
        <div className="space-y-6">
          <div className="card p-6 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              内容已生成
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              文案 + {generatedImages.filter(Boolean).length} 张配图
            </p>
            
            {/* 文案预览 */}
            <div
              className="text-left p-4 rounded-lg mb-6"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                {generatedContent}
              </p>
            </div>
            
            {/* 图片缩略图 */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {generatedImages.filter(Boolean).map((img, index) => (
                <div
                  key={index}
                  className="aspect-square rounded overflow-hidden"
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <img src={img} alt={`图${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setStep(6)}
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
                background: '#1aad19',
                color: 'white',
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
            <div className="w-12 h-12 border-4 border-green-500 rounded-full border-t-transparent animate-spin mx-auto mb-4" style={{ borderColor: '#1aad19', borderTopColor: 'transparent' }}></div>
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              正在生成...
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              AI 正在为你生成朋友圈文案
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
