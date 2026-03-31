'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import NoteSelector from '../components/NoteSelector'
import StyleSelector from '../components/StyleSelector'
import VersionPreview from '../components/VersionPreview'
import StepIndicator from '../components/StepIndicator'

interface Note {
  id: string
  title: string
  content: string
}

export default function MomentsPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<string>('')
  const [generating, setGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<{
    content: string
  } | null>(null)

  const steps = ['选择笔记', '选择风格', '生成文案']

  const handleGenerate = async () => {
    if (!selectedNote || !selectedStyle) return
    
    setGenerating(true)
    
    try {
      const supabase = createClient()
      
      const response = await fetch('/api/ai-studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: selectedNote.id,
          platform: 'moments',
          style: selectedStyle,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setGeneratedContent(data)
        setStep(2)
        
        try {
          await supabase.from('ai_versions').insert({
            note_id: selectedNote.id,
            platform: 'moments',
            version: 1,
            content: data.content,
            style: selectedStyle,
          })
        } catch (e) {
          console.log('Failed to save version')
        }
      }
    } catch (error) {
      console.error('Generation failed:', error)
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!selectedNote || !generatedContent) return
    
    try {
      const supabase = createClient()
      await supabase.from('ai_versions').insert({
        note_id: selectedNote.id,
        platform: 'moments',
        version: 1,
        content: generatedContent.content,
        style: selectedStyle,
      })
      
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
          <span className="text-4xl">💬</span>
          <div>
            <h1 className="text-3xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>
              朋友圈改写
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              生成生活化朋友圈文案（50-150 字）
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
            platform="moments"
          />
          
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
                  <li>• 适合配 1-9 张图片</li>
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
                opacity: !selectedStyle || generating ? 0.5 : 1,
              }}
            >
              {generating ? '生成中...' : '开始生成'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview & Edit */}
      {step === 2 && generatedContent && (
        <div className="space-y-6">
          {/* Content Preview */}
          <VersionPreview
            title="朋友圈文案"
            content={generatedContent.content}
            platform="moments"
            version={1}
            onEdit={(newContent) => {
              setGeneratedContent({ ...generatedContent, content: newContent })
            }}
            onSave={handleSave}
          />

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
                  color: generatedContent.content.length >= 50 && generatedContent.content.length <= 150
                    ? 'var(--success)'
                    : 'var(--warning)',
                }}
              >
                {generatedContent.content.length} / 150 字
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
              onClick={handleSave}
              className="flex-1 px-6 py-2.5 rounded-lg font-medium transition-colors"
              style={{
                background: '#1aad19',
                color: 'white',
              }}
            >
              保存并发布
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
