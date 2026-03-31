'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import NoteSelector from '../components/NoteSelector'
import StepIndicator from '../components/StepIndicator'

interface Note {
  id: string
  title: string
  content: string
}

const xhsStyles = [
  { id: 'cute', name: '可爱甜美风', icon: '🎀' },
  { id: 'fresh', name: '清新自然风', icon: '🌿' },
  { id: 'warm', name: '温暖治愈风', icon: '☀️' },
  { id: 'bold', name: '大胆撞色风', icon: '🎨' },
  { id: 'minimal', name: '极简高级风', icon: '✨' },
  { id: 'retro', name: '复古怀旧风', icon: '📼' },
  { id: 'pop', name: '潮流活泼风', icon: '🌈' },
  { id: 'notion', name: '知识卡片风', icon: '📝' },
  { id: 'chalkboard', name: '黑板教学风', icon: '🖼️' },
  { id: 'study-notes', name: '手写笔记风', icon: '✏️' },
]

const imageLayouts = [
  { id: 'sparse', name: '稀疏简约', desc: '1-2 个重点' },
  { id: 'balanced', name: '平衡标准', desc: '3-4 个重点' },
  { id: 'dense', name: '密集信息', desc: '5-8 个重点' },
  { id: 'list', name: '列表清单', desc: '枚举排名' },
  { id: 'comparison', name: '对比对照', desc: '前后对比' },
  { id: 'flow', name: '流程步骤', desc: '时间线/步骤' },
]

export default function XiaohongshuPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [generating, setGenerating] = useState(false)
  
  // 从缓存加载数据（如果有）
  const getCachedData = () => {
    if (typeof window === 'undefined') return null
    const cached = localStorage.getItem('xiaohongshu_draft')
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch (e) {
        return null
      }
    }
    return null
  }
  
  const cachedData = getCachedData()
  
  // 步骤 1: 生成的文案
  const [generatedCopy, setGeneratedCopy] = useState<{
    title: string
    content: string
    tags: string[]
  } | null>(cachedData?.generatedCopy || null)
  
  // 步骤 2: 配图设置
  const [imageCount, setImageCount] = useState(cachedData?.imageCount || 4)
  const [imageStyle, setImageStyle] = useState(cachedData?.imageStyle || 'cute')
  const [imageLayout, setImageLayout] = useState(cachedData?.imageLayout || 'balanced')
  const [imageRatio, setImageRatio] = useState(cachedData?.imageRatio || '3:4')
  const [useClaude, setUseClaude] = useState(false) // 是否使用 new Claude
  
  // 步骤 3: 生成的提示词
  const [imagePrompts, setImagePrompts] = useState(cachedData?.imagePrompts || [])
  const [promptLanguage, setPromptLanguage] = useState<'zh' | 'en'>(cachedData?.promptLanguage || 'zh')
  const [translating, setTranslating] = useState(false)
  
  // 步骤 4: 生成图片进度
  const [imageProgress, setImageProgress] = useState(0)
  const [generatingImages, setGeneratingImages] = useState(false)
  
  
  // 步骤 5: 生成的图片
  const [generatedImages, setGeneratedImages] = useState(cachedData?.generatedImages || [])

  const steps = ['选择笔记', '生成文案', '配图设置', '生成提示词', '生成图片', '完成发布']

  // 保存到缓存
  const saveToCache = () => {
    if (typeof window === 'undefined') return
    const cacheData = {
      selectedNote: selectedNote ? { id: selectedNote.id, title: selectedNote.title } : null,
      generatedCopy,
      imageCount,
      imageStyle,
      imageLayout,
      imageRatio,
      imagePrompts,
      generatedImages,
      promptLanguage,
      timestamp: Date.now(),
    }
    localStorage.setItem('xiaohongshu_draft', JSON.stringify(cacheData))
  }

  // 翻译提示词
  const handleTranslatePrompts = async () => {
    setTranslating(true)
    try {
      const targetLang = promptLanguage === 'en' ? 'zh' : 'en'
      const response = await fetch('/api/ai-studio/translate-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompts: imagePrompts,
          targetLang,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setImagePrompts(data.translatedPrompts)
        setPromptLanguage(targetLang)
        saveToCache()
      } else {
        const error = await response.json()
        alert(`翻译失败：${error.error || '请重试'}`)
      }
    } catch (error) {
      console.error('Translation failed:', error)
      alert('翻译失败，请重试')
    } finally {
      setTranslating(false)
    }
  }

  // 清除缓存
  const clearCache = () => {
    if (typeof window === 'undefined') return
    localStorage.removeItem('xiaohongshu_draft')
  }

  // 每次状态变化时自动保存缓存
  useEffect(() => {
    saveToCache()
  }, [selectedNote, generatedCopy, imageCount, imageStyle, imageLayout, imageRatio, imagePrompts, generatedImages])

  // 步骤 0: 生成文案
  const handleGenerateCopy = async () => {
    if (!selectedNote) return
    
    setGenerating(true)
    
    try {
      const response = await fetch('/api/ai-studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: selectedNote.id,
          platform: 'xiaohongshu',
          style: 'default',
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        const fullContent = data.content || '生成内容失败'
        
        // 解析标题和正文
        let title = 'AI 生成的标题'
        let content = fullContent
        
        // 多种标题解析规则
        const lines = fullContent.split('\n')
        
        // 规则 1: 第一行包含"标题："
        if (lines[0] && lines[0].includes('标题：')) {
          title = lines[0].replace('标题：', '').trim()
          content = lines.slice(1).join('\n').trim()
        }
        // 规则 2: Markdown 标题格式 # 标题
        else if (lines[0] && lines[0].startsWith('#')) {
          title = lines[0].replace(/^#+\s*/, '').trim()
          content = lines.slice(1).join('\n').trim()
        }
        // 规则 3: 第一行较短且包含 emoji（小红书标题特点）
        else if (lines[0] && lines[0].length < 50 && lines[0].match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/u)) {
          title = lines[0].trim()
          content = lines.slice(1).join('\n').trim()
        }
        // 规则 4: 前 3 行内寻找包含 emoji 的短句
        else {
          for (let i = 0; i < Math.min(3, lines.length); i++) {
            const line = lines[i].trim()
            if (line.length > 0 && line.length < 50) {
              title = line
              content = [...lines.slice(0, i), ...lines.slice(i + 1)].join('\n').trim()
              break
            }
          }
        }
        
        console.log('解析结果:', { title, contentLength: content.length })
        
        setGeneratedCopy({
          title,
          content,
          tags: ['#AI 生成内容', '#学习笔记', '#成长'],
        })
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

  // 重新生成文案
  const handleRegenerateCopy = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/ai-studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: selectedNote?.id,
          platform: 'xiaohongshu',
          style: 'default',
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setGeneratedCopy({
          title: 'AI 生成的标题',
          content: data.content || '生成内容失败',
          tags: ['#AI 生成内容', '#学习笔记', '#成长'],
        })
      }
    } catch (error) {
      console.error('Regeneration failed:', error)
    } finally {
      setGenerating(false)
    }
  }

  // 步骤 2: 生成提示词
  const handleGeneratePrompts = async () => {
    if (!selectedNote || !generatedCopy || !imageStyle || !imageLayout) return
    
    setGenerating(true)
    
    try {
      const response = await fetch('/api/ai-studio/xiaohongshu/generate-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: selectedNote.id,  // 传递 noteId，让 API 从数据库读取完整文案
          title: generatedCopy.title,
          imageCount,
          style: imageStyle,
          layout: imageLayout,
          ratio: imageRatio,
          useClaude: useClaude,  // 是否使用 new Claude
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setImagePrompts(data.prompts || Array(imageCount).fill('生成提示词...'))
        setStep(3)
      } else {
        const error = await response.json()
        alert(`生成提示词失败：${error.error || '请重试'}`)
      }
    } catch (error) {
      console.error('Failed to generate prompts:', error)
      alert('生成提示词失败：' + (error instanceof Error ? error.message : '请重试'))
    } finally {
      setGenerating(false)
    }
  }

  // 重新生成单个提示词
  const handleRegeneratePrompt = async (index: number) => {
    setGenerating(true)
    try {
      const response = await fetch('/api/ai-studio/xiaohongshu/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: generatedCopy?.content,
          imageIndex: index,
          style: imageStyle,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        const newPrompts = [...imagePrompts]
        newPrompts[index] = data.prompt || imagePrompts[index]
        setImagePrompts(newPrompts)
      }
    } catch (error) {
      console.error('Failed to regenerate prompt:', error)
    } finally {
      setGenerating(false)
    }
  }

  // 步骤 3: 生成图片（带进度条）
  const handleGenerateImages = async () => {
    setGeneratingImages(true)
    setImageProgress(0)
    setStep(4)  // 先跳转到进度页面
    
    const images: string[] = []
    let failedCount = 0 // 失败计数
    const failedIndexes: number[] = [] // 失败的图片索引
    
    try {
      for (let i = 0; i < imagePrompts.length; i++) {
        const prompt = imagePrompts[i]
        
        try {
          const response = await fetch('/api/ai-studio/xiaohongshu/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: prompt,
              style: imageStyle,
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
      
      // 无论成功失败，都跳转到图片预览页面（步骤 5）
      setTimeout(() => setStep(5), 800)
      
      // 显示结果提示
      if (failedCount > 0) {
        setTimeout(() => {
          alert(`已生成 ${imagePrompts.length - failedCount}/${imagePrompts.length} 张图片\n失败：${failedCount}张（第${failedIndexes.map(i => i + 1).join('、')}张）\n\n可以点击失败的图片重新生成`)
        }, 1000)
      }
    } catch (error) {
      console.error('Failed to generate images:', error)
      // 即使出错也跳转，让用户可以看到已生成的图片
      setTimeout(() => setStep(5), 800)
      alert('生成图片过程中出错，已生成的图片可以查看，失败的可以重新生成')
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
          prompt: imagePrompts[index],
          style: imageStyle,
          index: index,
          ratio: imageRatio,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        const newImages = [...generatedImages]
        newImages[index] = data.imageUrl || ''
        setGeneratedImages(newImages)
        // 保存缓存
        saveToCache()
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
    if (!selectedNote || !generatedCopy) return
    
    try {
      const supabase = createClient()
      const { data: existingVersions } = await supabase
        .from('ai_versions')
        .select('version')
        .eq('note_id', selectedNote.id)
        .eq('platform', 'xiaohongshu')
        .order('version', { ascending: false })
        .limit(1)
      
      const nextVersion = (existingVersions && existingVersions.length > 0) 
        ? (existingVersions[0].version || 0) + 1 
        : 1
      
      const { data: user } = await supabase.auth.getUser()
      
      // 保存文案和图片到数据库
      await supabase.from('ai_versions').insert({
        note_id: selectedNote.id,
        platform: 'xiaohongshu',
        version: nextVersion,
        content: generatedCopy.content,
        style: imageStyle,
        user_id: user.user?.id,
        // 使用 metadata 字段存储图片和标题
        metadata: {
          titles: generatedCopy.title,
          image_urls: generatedImages,
          image_prompts: imagePrompts,
        },
      })
      
      // 保存成功后清除缓存
      clearCache()
      
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
          {(generatedCopy || generatedImages.length > 0) && (
            <button
              onClick={() => {
                if (confirm('确定要清除当前改写草稿吗？')) {
                  clearCache()
                  setGeneratedCopy(null)
                  setGeneratedImages([])
                  setImagePrompts([])
                  setStep(0)
                }
              }}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
              }}
            >
              清除草稿
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">📕</span>
          <div>
            <h1 className="text-3xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>
              小红书改写
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              生成种草力满满的笔记
            </p>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <StepIndicator steps={steps} currentStep={step} />

      {/* Step 0: 选择笔记并预览 */}
      {step === 0 && (
        <div className="card p-6 space-y-6">
          <div>
            <h3 className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
              选择笔记
            </h3>
            <NoteSelector
              selectedNoteId={selectedNote?.id}
              onSelectNote={setSelectedNote}
              placeholder="点击选择一篇笔记..."
            />
          </div>
          
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

          <div className="flex gap-3 pt-4">
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
            <button
              onClick={handleGenerateCopy}
              disabled={!selectedNote || generating}
              className="flex-1 px-4 md:px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 min-h-[44px]"
              style={{
                background: selectedNote ? '#ff2442' : 'var(--bg-elevated)',
                color: selectedNote ? '#fff' : 'var(--text-tertiary)',
              }}
            >
              {generating ? '生成中...' : '生成文案'}
            </button>
          </div>
        </div>
      )}

      {/* Step 1: 显示生成的文案 */}
      {step === 1 && generatedCopy && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                生成文案
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
            
            <div className="space-y-4">
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                  标题
                </label>
                <input
                  type="text"
                  value={generatedCopy.title}
                  onChange={(e) => setGeneratedCopy({ ...generatedCopy, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg text-sm"
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                  正文
                </label>
                <textarea
                  value={generatedCopy.content}
                  onChange={(e) => setGeneratedCopy({ ...generatedCopy, content: e.target.value })}
                  rows={10}
                  className="w-full px-4 py-3 rounded-lg text-sm resize-none"
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              
              <div>
                <label className="text-xs mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                  标签
                </label>
                <div className="flex flex-wrap gap-2">
                  {generatedCopy.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 rounded-full text-xs"
                      style={{
                        background: '#ff244220',
                        color: '#ff2442',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
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
              onClick={() => setStep(2)}
              className="flex-1 px-4 md:px-6 py-3 rounded-lg font-medium transition-all min-h-[44px]"
              style={{
                background: '#ff2442',
                color: '#fff',
              }}
            >
              下一步：配图设置
            </button>
          </div>
        </div>
      )}

      {/* Step 2: 配图设置 */}
      {step === 2 && (
        <div className="card p-5">
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            配图设置
          </h3>
          
          {/* AI 模型选择 */}
          <div className="mb-4 p-4 rounded-lg" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--border-accent)' }}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                🤖 AI 模型
              </h4>
              <span className="text-xs px-2 py-1 rounded" style={{ 
                background: useClaude ? 'var(--accent)' : 'var(--bg-elevated)',
                color: useClaude ? 'var(--bg-primary)' : 'var(--text-secondary)'
              }}>
                {useClaude ? 'new Claude' : 'Qwen'}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setUseClaude(false)}
                className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${!useClaude ? 'ring-2 ring-[var(--accent)]' : ''}`}
                style={{
                  background: !useClaude ? 'var(--accent)' : 'var(--bg-primary)',
                  color: !useClaude ? 'var(--bg-primary)' : 'var(--text-primary)',
                }}
              >
                Qwen
              </button>
              <button
                onClick={() => setUseClaude(true)}
                className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${useClaude ? 'ring-2 ring-[var(--accent)]' : ''}`}
                style={{
                  background: useClaude ? 'var(--accent)' : 'var(--bg-primary)',
                  color: useClaude ? 'var(--bg-primary)' : 'var(--text-primary)',
                }}
              >
                new Claude ⭐
              </button>
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
              {useClaude 
                ? '✨ 提示词质量更高，风格更统一' 
                : '💡 速度快，适合快速生成'}
            </p>
          </div>
          
          {/* 配图数量 */}
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              数量
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[3, 4, 5, 6, 7, 8].map(count => (
                <button
                  key={count}
                  onClick={() => setImageCount(count)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px] ${imageCount === count ? 'ring-2 ring-[#ff2442]' : ''}`}
                  style={{
                    background: imageCount === count ? '#ff2442' : 'var(--bg-primary)',
                    color: imageCount === count ? '#fff' : 'var(--text-primary)',
                    border: `1px solid ${imageCount === count ? '#ff2442' : 'var(--border-subtle)'}`,
                  }}
                >
                  {count}张
                </button>
              ))}
            </div>
          </div>

          {/* 图片风格 */}
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              风格
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {xhsStyles.map(style => (
                <button
                  key={style.id}
                  onClick={() => setImageStyle(style.id)}
                  className={`p-3 rounded-lg transition-all min-h-[60px] ${imageStyle === style.id ? 'ring-2 ring-[#ff2442]' : ''}`}
                  style={{
                    background: imageStyle === style.id ? '#ff244215' : 'var(--bg-primary)',
                    border: `1px solid ${imageStyle === style.id ? '#ff2442' : 'var(--border-subtle)'}`,
                  }}
                >
                  <span className="text-xl block mb-1">{style.icon}</span>
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {style.name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* 图片布局 */}
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              布局
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {imageLayouts.map(layout => (
                <button
                  key={layout.id}
                  onClick={() => setImageLayout(layout.id)}
                  className={`p-3 rounded-lg transition-all min-h-[52px] ${imageLayout === layout.id ? 'ring-2 ring-[#ff2442]' : ''}`}
                  style={{
                    background: imageLayout === layout.id ? '#ff244215' : 'var(--bg-primary)',
                    border: `1px solid ${imageLayout === layout.id ? '#ff2442' : 'var(--border-subtle)'}`,
                  }}
                >
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {layout.name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* 图片比例 */}
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              比例
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { id: '3:4', name: '3:4' },
                { id: '1:1', name: '1:1' },
                { id: '4:3', name: '4:3' },
                { id: '9:16', name: '9:16' },
                { id: '16:9', name: '16:9' },
                { id: '2:3', name: '2:3' },
              ].map(ratio => (
                <button
                  key={ratio.id}
                  onClick={() => setImageRatio(ratio.id)}
                  className={`p-3 rounded-lg transition-all min-h-[44px] ${imageRatio === ratio.id ? 'ring-2 ring-[#ff2442]' : ''}`}
                  style={{
                    background: imageRatio === ratio.id ? '#ff244215' : 'var(--bg-primary)',
                    border: `1px solid ${imageRatio === ratio.id ? '#ff2442' : 'var(--border-subtle)'}`,
                  }}
                >
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {ratio.name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <button
              onClick={() => setStep(1)}
              className="px-4 md:px-5 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px]"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
              }}
            >
              上一步
            </button>
            <button
              onClick={handleGeneratePrompts}
              disabled={generating}
              className="flex-1 px-4 md:px-5 py-3 rounded-lg text-sm font-medium transition-all min-h-[44px]"
              style={{
                background: '#ff2442',
                color: '#fff',
              }}
            >
              {generating ? '生成中...' : '生成提示词'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: 显示和编辑提示词 */}
      {step === 3 && imagePrompts.length > 0 && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  配图提示词（可编辑）
                </h3>
                <button
                  onClick={handleTranslatePrompts}
                  disabled={translating || imagePrompts.length === 0}
                  className="text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 flex items-center gap-1"
                  style={{
                    background: 'var(--accent-subtle)',
                    color: 'var(--accent)',
                    border: '1px solid var(--accent)',
                  }}
                  title={promptLanguage === 'en' ? '翻译成中文' : 'Translate to English'}
                >
                  {translating ? (
                    <>
                      <span className="w-3 h-3 border border-current rounded-full border-t-transparent animate-spin"></span>
                      翻译中...
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                      {promptLanguage === 'en' ? '中译' : 'EN'}
                    </>
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                  {promptLanguage === 'en' ? '英文' : '中文'}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  共{imagePrompts.length}张图
                </span>
              </div>
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
                      className="text-xs px-2 py-1 rounded-lg transition-all hover:shadow-md flex items-center gap-1"
                      style={{
                        background: 'var(--bg-primary)',
                        color: 'var(--accent)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      重生成
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
              onClick={() => setStep(2)}
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
              className="flex-1 px-4 md:px-6 py-3 rounded-lg font-medium transition-all min-h-[44px]"
              style={{
                background: '#ff2442',
                color: '#fff',
              }}
            >
              确认生图
            </button>
          </div>
        </div>
      )}

      {/* Step 4: 生成图片进度 */}
      {step === 4 && (
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
                  background: 'linear-gradient(90deg, #ff2442, #ff6b7a)',
                }}
              />
            </div>
          </div>
          
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            正在生成第 {Math.ceil((imageProgress / 100) * imagePrompts.length)} / {imagePrompts.length} 张图片
          </p>
        </div>
      )}

      {/* Step 5: 展示生成的图片 */}
      {step === 5 && (
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
              onClick={() => setStep(3)}
              className="px-4 md:px-6 py-3 rounded-lg font-medium transition-colors min-h-[44px]"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
              }}
            >
              上一步
            </button>
            <button
              onClick={() => setStep(6)}
              className="flex-1 px-4 md:px-6 py-3 rounded-lg font-medium transition-all min-h-[44px]"
              style={{
                background: '#ff2442',
                color: '#fff',
              }}
            >
              下一步：完成发布
            </button>
          </div>
        </div>
      )}

      {/* Step 6: 完成发布预览 */}
      {step === 6 && (
        <div className="space-y-6">
          <div className="card p-6 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              内容已生成
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              标题 + 文案 + {generatedImages.length} 张配图
            </p>
            
            {/* 文案预览 */}
            <div
              className="text-left p-4 rounded-lg mb-6"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <h4 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {generatedCopy?.title}
              </h4>
              <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                {generatedCopy?.content}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {generatedCopy?.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 rounded-full text-xs"
                    style={{
                      background: '#ff244220',
                      color: '#ff2442',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            {/* 图片缩略图 */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {generatedImages.map((img, index) => (
                <div
                  key={index}
                  className="aspect-square rounded overflow-hidden"
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {img ? (
                    <img src={img} alt={`图${index + 1}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      图{index + 1}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setStep(5)}
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
                background: '#ff2442',
                color: '#fff',
              }}
            >
              保存并返回
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
            <div className="w-12 h-12 border-4 rounded-full border-t-transparent animate-spin mx-auto mb-4" style={{ borderColor: '#ff2442', borderTopColor: 'transparent' }}></div>
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              正在生成...
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              AI 正在为你生成小红书文案
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
