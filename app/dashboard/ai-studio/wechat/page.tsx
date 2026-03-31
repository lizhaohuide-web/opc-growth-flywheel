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

export default function WechatPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<string>('')
  const [generating, setGenerating] = useState(false)
  
  // 步骤 3 状态
  const [generatedCopy, setGeneratedCopy] = useState<{
    titles: string[]
    content: string
  } | null>(null)
  
  // 步骤 4 状态
  const [coverImage, setCoverImage] = useState<string>('')
  const [innerImages, setInnerImages] = useState<string[]>([])

  const steps = ['选择笔记', '选择风格', '生成文案', '生成配图']

  const handleGenerateCopy = async () => {
    if (!selectedNote || !selectedStyle) return
    
    setGenerating(true)
    
    try {
      const response = await fetch('/api/ai-studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: selectedNote.id,
          platform: 'wechat',
          style: selectedStyle,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setGeneratedCopy({
          titles: [
            'AI 生成的标题 1',
            'AI 生成的标题 2',
            'AI 生成的标题 3',
          ],
          content: data.version?.content || '生成内容失败',
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

  const handleGenerateImages = async () => {
    setGenerating(true)
    
    try {
      // 调用 API 生成配图
      const response = await fetch('/api/ai-studio/wechat/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: selectedNote?.id,
          content: generatedCopy?.content,
          type: 'cover',
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setCoverImage(data.imageUrl || '')
        setInnerImages(data.innerImages || [])
        setStep(3)
      }
    } catch (error) {
      console.error('Failed to generate images:', error)
    } finally {
      setGenerating(false)
    }
  }

  const handlePublish = async () => {
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
      
      // 保存版本
      await supabase.from('ai_versions').insert({
        note_id: selectedNote.id,
        platform: 'wechat',
        version: nextVersion,
        content: generatedCopy.content,
        style: selectedStyle,
        user_id: user.user?.id,
      })
      
      // TODO: 调用公众号 API 发布
      // await fetch('/api/ai-studio/wechat/publish', {...})
      
      alert('发布成功！')
      router.push('/dashboard/ai-studio')
    } catch (error) {
      console.error('Publish failed:', error)
      alert('发布失败，请重试')
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

      {/* Step 1: Select Note */}
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
                {selectedNote.content.substring(0, 200)}...
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select Style */}
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

      {/* Step 3: Generated Copy */}
      {step === 2 && generatedCopy && (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
              推荐标题（点击选择）
            </h3>
            <div className="space-y-3">
              {generatedCopy.titles.map((title, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg cursor-pointer transition-all hover:shadow-md"
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                  }}
                  onClick={() => {
                    // 可以选择标题逻辑
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                      style={{
                        background: '#07C16020',
                        color: '#07C160',
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

          <div className="card p-6">
            <h3 className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
              正文内容（可编辑）
            </h3>
            <textarea
              value={generatedCopy.content}
              onChange={(e) => setGeneratedCopy({ ...generatedCopy, content: e.target.value })}
              rows={12}
              className="w-full px-4 py-3 rounded-lg text-sm resize-none"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
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
              onClick={handleGenerateImages}
              disabled={generating}
              className="flex-1 px-6 py-2.5 rounded-lg font-medium transition-all"
              style={{
                background: '#07C160',
                color: '#fff',
              }}
            >
              {generating ? '生成中...' : '下一步：生成配图'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Generated Images */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
              封面图（900x383px）
            </h3>
            <div
              className="aspect-[900/383] rounded-lg flex items-center justify-center"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {coverImage ? (
                <img src={coverImage} alt="封面图" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <div className="text-center">
                  <div className="text-4xl mb-2">🖼️</div>
                  <span style={{ color: 'var(--text-tertiary)' }}>封面图预览</span>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
              配图（可选）
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {innerImages.map((img, index) => (
                <div
                  key={index}
                  className="aspect-video rounded-lg flex items-center justify-center"
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {img ? (
                    <img src={img} alt={`配图${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <span style={{ color: 'var(--text-tertiary)' }}>配图{index + 1}</span>
                  )}
                </div>
              ))}
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
              onClick={handlePublish}
              className="flex-1 px-6 py-2.5 rounded-lg font-medium transition-all"
              style={{
                background: '#07C160',
                color: '#fff',
              }}
            >
              📤 发布到公众号
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
