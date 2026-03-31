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

const podcastFormats = [
  { id: '独白', name: '独白', icon: '🎙️', desc: '单人讲述，深度内容' },
  { id: '对话', name: '对话', icon: '💬', desc: '双人互动，自然流畅' },
  { id: '访谈', name: '访谈', icon: '🎤', desc: '一问一答，嘉宾主导' },
]

const durations = [
  { id: '5 分钟', name: '5 分钟', desc: '约 800-1000 字' },
  { id: '10 分钟', name: '10 分钟', desc: '约 1500-1800 字' },
  { id: '20 分钟', name: '20 分钟', desc: '约 3000-3500 字' },
]

export default function PodcastPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [selectedFormat, setSelectedFormat] = useState<string>('对话')
  const [selectedDuration, setSelectedDuration] = useState<string>('10 分钟')
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<{
    title: string
    opening: string
    outline: string[]
    fullScript: string
    hostAScript: string
    hostBScript: string
    closing: string
    duration: string
    tags: string[]
  } | null>(null)

  const steps = ['选择配置', '选择笔记', '生成脚本']

  const handleGenerate = async () => {
    if (!selectedNote) return
    
    setGenerating(true)
    
    try {
      const response = await fetch('/api/ai-studio/podcast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: selectedNote.id,
          format: selectedFormat,
          duration: selectedDuration,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setGeneratedContent(data)
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

  const handleSave = async () => {
    if (!selectedNote || !generatedContent) return
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data: existingVersions } = await supabase
        .from('ai_versions')
        .select('version')
        .eq('note_id', selectedNote.id)
        .eq('platform', 'podcast')
        .order('version', { ascending: false })
        .limit(1)
      
      const nextVersion = (existingVersions && existingVersions.length > 0) 
        ? (existingVersions[0].version || 0) + 1 
        : 1
      
      await supabase.from('ai_versions').insert({
        note_id: selectedNote.id,
        platform: 'podcast',
        version: nextVersion,
        content: generatedContent.fullScript,
        user_id: user?.id,
        metadata: {
          format: selectedFormat,
          duration: selectedDuration,
          title: generatedContent.title,
          tags: generatedContent.tags,
        },
      })
      
      alert('保存成功！')
      router.push('/dashboard/ai-studio')
    } catch (error) {
      console.error('Save failed:', error)
      alert('保存失败，请重试')
    }
  }

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert(`${label}已复制到剪贴板！`)
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
          <span className="text-4xl">🎙️</span>
          <div>
            <h1 className="text-3xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>
              播客改写
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              生成专业播客脚本
            </p>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <StepIndicator steps={steps} currentStep={step} />

      {/* Step 0: Select Format & Duration */}
      {step === 0 && (
        <div className="card p-6 space-y-6">
          <div>
            <h3 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
              选择格式
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {podcastFormats.map(format => {
                const isSelected = selectedFormat === format.id
                
                return (
                  <button
                    key={format.id}
                    type="button"
                    onClick={() => setSelectedFormat(format.id)}
                    className="p-4 rounded-xl text-center transition-all"
                    style={{
                      background: isSelected ? '#9333ea15' : 'var(--bg-primary)',
                      border: isSelected ? '2px solid #9333ea' : '1px solid var(--border-subtle)',
                    }}
                  >
                    <span className="text-3xl block mb-2">{format.icon}</span>
                    <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {format.name}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {format.desc}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
              选择时长
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {durations.map(duration => {
                const isSelected = selectedDuration === duration.id
                
                return (
                  <button
                    key={duration.id}
                    type="button"
                    onClick={() => setSelectedDuration(duration.id)}
                    className="p-4 rounded-xl text-center transition-all"
                    style={{
                      background: isSelected ? '#9333ea15' : 'var(--bg-primary)',
                      border: isSelected ? '1px solid #9333ea' : '1px solid var(--border-subtle)',
                    }}
                  >
                    <div className="text-2xl mb-1">⏱️</div>
                    <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {duration.name}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {duration.desc}
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
                  播客脚本特点
                </h4>
                <ul className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                  <li>• Hook 在开头 30 秒（说明价值）</li>
                  <li>• 对话感强，自然流畅</li>
                  <li>• 包含开场、主体、结尾</li>
                  <li>• 标注语气变化和停顿</li>
                </ul>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setStep(1)}
            className="w-full px-6 py-3 rounded-lg font-medium transition-all"
            style={{
              background: '#9333ea',
              color: 'white',
            }}
          >
            下一步
          </button>
        </div>
      )}

      {/* Step 1: Select Note */}
      {step === 1 && (
        <div className="card p-6 space-y-6">
          <NoteSelector
            selectedNoteId={selectedNote?.id}
            onSelectNote={(note) => {
              setSelectedNote(note)
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
              disabled={!selectedNote || generating}
              className="flex-1 px-6 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50"
              style={{
                background: selectedNote ? '#9333ea' : 'var(--bg-elevated)',
                color: selectedNote ? 'white' : 'var(--text-tertiary)',
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
          {/* Title */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                📝 节目标题
              </h3>
              <button
                onClick={() => handleCopy(generatedContent.title, '标题')}
                className="text-sm px-3 py-1.5 rounded-lg transition-colors"
                style={{
                  background: 'var(--accent-subtle)',
                  color: 'var(--accent)',
                }}
              >
                📋 复制
              </button>
            </div>
            <input
              type="text"
              value={generatedContent.title}
              onChange={(e) => setGeneratedContent({ ...generatedContent, title: e.target.value })}
              className="w-full px-4 py-3 rounded-lg text-sm"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Opening */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                🎬 开场白（30 秒）
              </h3>
              <button
                onClick={() => handleCopy(generatedContent.opening, '开场白')}
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
              value={generatedContent.opening}
              onChange={(e) => setGeneratedContent({ ...generatedContent, opening: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 rounded-lg text-sm resize-none"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Outline */}
          {generatedContent.outline && generatedContent.outline.length > 0 && (
            <div className="card p-6">
              <h3 className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
                📋 大纲
              </h3>
              <div className="space-y-2">
                {generatedContent.outline.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg"
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                      style={{
                        background: 'var(--accent-subtle)',
                        color: 'var(--accent)',
                      }}
                    >
                      {index + 1}
                    </span>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Script */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                📄 完整逐字稿
              </h3>
              <button
                onClick={() => handleCopy(generatedContent.fullScript, '完整脚本')}
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
              value={generatedContent.fullScript}
              onChange={(e) => setGeneratedContent({ ...generatedContent, fullScript: e.target.value })}
              rows={16}
              className="w-full px-4 py-3 rounded-lg text-sm resize-none"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Host Scripts */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4">
              <h3 className="font-medium mb-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                🎙️ 主持人 A 台词
              </h3>
              <div
                className="p-3 rounded-lg max-h-48 overflow-y-auto text-xs"
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <p className="whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                  {generatedContent.hostAScript}
                </p>
              </div>
            </div>

            <div className="card p-4">
              <h3 className="font-medium mb-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                🎙️ 主持人 B 台词
              </h3>
              <div
                className="p-3 rounded-lg max-h-48 overflow-y-auto text-xs"
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <p className="whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                  {generatedContent.hostBScript}
                </p>
              </div>
            </div>
          </div>

          {/* Closing */}
          {generatedContent.closing && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  🎬 结语
                </h3>
                <button
                  onClick={() => handleCopy(generatedContent.closing, '结语')}
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
                value={generatedContent.closing}
                onChange={(e) => setGeneratedContent({ ...generatedContent, closing: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-lg text-sm resize-none"
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          )}

          {/* Duration & Tags */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4">
              <h3 className="font-medium mb-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                ⏱️ 预计时长
              </h3>
              <p className="text-sm" style={{ color: 'var(--accent)' }}>
                {generatedContent.duration || selectedDuration}
              </p>
            </div>
            {generatedContent.tags && generatedContent.tags.length > 0 && (
              <div className="card p-4">
                <h3 className="font-medium mb-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                  🏷️ 标签
                </h3>
                <div className="flex flex-wrap gap-1">
                  {generatedContent.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 rounded-full text-xs"
                      style={{
                        background: '#9333ea20',
                        color: '#9333ea',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
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
                background: '#9333ea',
                color: 'white',
              }}
            >
              保存
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
            <div className="w-12 h-12 border-4 border-purple-500 rounded-full border-t-transparent animate-spin mx-auto mb-4" style={{ borderColor: '#9333ea', borderTopColor: 'transparent' }}></div>
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              正在生成...
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              AI 正在为你生成{selectedFormat}播客脚本（{selectedDuration}）
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
