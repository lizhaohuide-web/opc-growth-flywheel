'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import NoteSelector from '../components/NoteSelector'
import VersionPreview from '../components/VersionPreview'
import StepIndicator from '../components/StepIndicator'

interface Note {
  id: string
  title: string
  content: string
}

export default function PodcastPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<{
    hostAScript: string
    hostBScript: string
    fullScript: string
    duration?: string
  } | null>(null)
  const [generatingAudio, setGeneratingAudio] = useState(false)

  const steps = ['选择笔记', '生成脚本', '生成音频']

  const handleGenerate = async () => {
    if (!selectedNote) return
    
    setGenerating(true)
    
    try {
      const supabase = createClient()
      
      const response = await fetch('/api/ai-studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: selectedNote.id,
          platform: 'podcast',
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setGeneratedContent(data)
        setStep(2)
        
        try {
          await supabase.from('ai_versions').insert({
            note_id: selectedNote.id,
            platform: 'podcast',
            version: 1,
            content: data.fullScript,
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

  const handleGenerateAudio = async () => {
    if (!generatedContent) return
    
    setGeneratingAudio(true)
    
    try {
      // 调用 TTS API 生成音频
      const response = await fetch('/api/ai-studio/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: generatedContent.fullScript,
          platform: 'podcast',
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        alert('音频生成成功！')
        // 可以处理音频文件下载或播放
      }
    } catch (error) {
      console.error('Audio generation failed:', error)
      alert('音频生成失败，请重试')
    } finally {
      setGeneratingAudio(false)
    }
  }

  const handleSave = async () => {
    if (!selectedNote || !generatedContent) return
    
    try {
      const supabase = createClient()
      await supabase.from('ai_versions').insert({
        note_id: selectedNote.id,
        platform: 'podcast',
        version: 1,
        content: generatedContent.fullScript,
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
          <span className="text-4xl">🎙️</span>
          <div>
            <h1 className="text-3xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>
              播客改写
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              生成双人对话播客脚本
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
                  播客脚本特点
                </h4>
                <ul className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                  <li>• 双人对话形式，自然流畅</li>
                  <li>• 主持人 A + 主持人 B 互动</li>
                  <li>• 包含开场、主体、结尾</li>
                  <li>• 可选生成音频</li>
                </ul>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleGenerate}
            disabled={!selectedNote || generating}
            className="w-full px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50"
            style={{
              background: selectedNote ? '#9333ea' : 'var(--bg-elevated)',
              color: selectedNote ? 'white' : 'var(--text-tertiary)',
            }}
          >
            {generating ? '生成中...' : '开始生成脚本'}
          </button>
        </div>
      )}

      {/* Step 2 & 3: Preview Script & Generate Audio */}
      {(step === 2 || step === 1) && generatedContent && (
        <div className="space-y-6">
          {/* Full Script */}
          <VersionPreview
            title="完整播客脚本"
            content={generatedContent.fullScript}
            platform="podcast"
            version={1}
            onEdit={(newContent) => {
              setGeneratedContent({ ...generatedContent, fullScript: newContent })
            }}
            onSave={handleSave}
          />

          {/* Host A Script */}
          <div className="card p-6">
            <h3 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
              🎙️ 主持人 A 台词
            </h3>
            <div
              className="p-4 rounded-lg max-h-64 overflow-y-auto"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                {generatedContent.hostAScript}
              </p>
            </div>
          </div>

          {/* Host B Script */}
          <div className="card p-6">
            <h3 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
              🎙️ 主持人 B 台词
            </h3>
            <div
              className="p-4 rounded-lg max-h-64 overflow-y-auto"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                {generatedContent.hostBScript}
              </p>
            </div>
          </div>

          {/* Duration Estimate */}
          {generatedContent.duration && (
            <div
              className="card p-4"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  预计时长
                </span>
                <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                  ⏱️ {generatedContent.duration}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleGenerateAudio}
              disabled={generatingAudio}
              className="w-full px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50"
              style={{
                background: generatingAudio ? 'var(--bg-elevated)' : '#9333ea',
                color: generatingAudio ? 'var(--text-tertiary)' : 'white',
              }}
            >
              {generatingAudio ? '🎵 生成音频中...' : '🎵 生成音频'}
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="flex-1 px-6 py-2.5 rounded-lg font-medium transition-colors"
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
                  background: '#9333ea',
                  color: 'white',
                }}
              >
                保存
              </button>
            </div>
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
            <div className="w-12 h-12 border-4 border-purple-500 rounded-full border-t-transparent animate-spin mx-auto mb-4" style={{ borderColor: '#9333ea', borderTopColor: 'transparent' }}></div>
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              正在生成脚本...
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              AI 正在为你生成双人对话播客脚本
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
