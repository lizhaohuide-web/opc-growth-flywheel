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

const platforms = [
  { id: '抖音', name: '抖音', icon: '🎵', desc: '节奏快，年轻用户' },
  { id: '视频号', name: '视频号', icon: '📹', desc: '社交推荐，熟人传播' },
  { id: 'B 站', name: 'B 站', icon: '📺', desc: '社区氛围，知识区' },
]

const videoTypes = [
  { id: '口播', name: '口播', icon: '🎤', desc: '一人讲述，知识分享' },
  { id: 'vlog', name: 'Vlog', icon: '📸', desc: '记录生活，真实自然' },
  { id: '教程', name: '教程', icon: '📚', desc: '分步教学，清晰易懂' },
  { id: '故事', name: '故事', icon: '📖', desc: '有情节，引人入胜' },
]

export default function ShortVideoPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [selectedPlatform, setSelectedPlatform] = useState<string>('抖音')
  const [selectedType, setSelectedType] = useState<string>('口播')
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<{
    title: string
    script: string
    scenes: string[]
    subtitles: string
    tags: string[]
    bgm: string
    coverSuggestion: string
  } | null>(null)

  const steps = ['选择平台', '选择笔记', '生成脚本']

  const handleGenerate = async () => {
    if (!selectedNote) return
    
    setGenerating(true)
    
    try {
      const response = await fetch('/api/ai-studio/short-video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: selectedNote.id,
          platform: selectedPlatform,
          videoType: selectedType,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        // API 返回 { success: true, title, script, ... }，需要提取内容字段
        setGeneratedContent({
          title: data.title || 'AI 生成的标题',
          script: data.script || '请手动编辑脚本内容',
          scenes: data.scenes || [],
          subtitles: data.subtitles || '',
          tags: data.tags || [],
          bgm: data.bgm || '',
          coverSuggestion: data.coverSuggestion || '',
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

  const handleSave = async () => {
    if (!selectedNote || !generatedContent) return
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data: existingVersions } = await supabase
        .from('ai_versions')
        .select('version')
        .eq('note_id', selectedNote.id)
        .eq('platform', 'short-video')
        .order('version', { ascending: false })
        .limit(1)
      
      const nextVersion = (existingVersions && existingVersions.length > 0) 
        ? (existingVersions[0].version || 0) + 1 
        : 1
      
      await supabase.from('ai_versions').insert({
        note_id: selectedNote.id,
        platform: 'short-video',
        version: nextVersion,
        content: generatedContent.script,
        user_id: user?.id,
        metadata: {
          platform: selectedPlatform,
          videoType: selectedType,
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
          <span className="text-4xl">🎬</span>
          <div>
            <h1 className="text-3xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>
              短视频改写
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              生成抖音/视频号/B 站短视频脚本
            </p>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <StepIndicator steps={steps} currentStep={step} />

      {/* Step 0: Select Platform & Type */}
      {step === 0 && (
        <div className="card p-6 space-y-6">
          <div>
            <h3 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
              选择平台
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {platforms.map(platform => {
                const isSelected = selectedPlatform === platform.id
                
                return (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => setSelectedPlatform(platform.id)}
                    className="p-4 rounded-xl text-center transition-all"
                    style={{
                      background: isSelected ? '#fe2c5515' : 'var(--bg-primary)',
                      border: isSelected ? '2px solid #fe2c55' : '1px solid var(--border-subtle)',
                    }}
                  >
                    <span className="text-3xl block mb-2">{platform.icon}</span>
                    <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {platform.name}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {platform.desc}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
              选择类型
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {videoTypes.map(type => {
                const isSelected = selectedType === type.id
                
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.id)}
                    className="p-4 rounded-xl text-center transition-all"
                    style={{
                      background: isSelected ? '#fe2c5515' : 'var(--bg-primary)',
                      border: isSelected ? '1px solid #fe2c55' : '1px solid var(--border-subtle)',
                    }}
                  >
                    <span className="text-2xl block mb-1">{type.icon}</span>
                    <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {type.name}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {type.desc}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
          
          <button
            onClick={() => setStep(1)}
            className="w-full px-6 py-3 rounded-lg font-medium transition-all"
            style={{
              background: '#fe2c55',
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
                background: selectedNote ? '#fe2c55' : 'var(--bg-elevated)',
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
                📝 视频标题
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

          {/* Script */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                🎤 口播脚本
              </h3>
              <button
                onClick={() => handleCopy(generatedContent.script, '脚本')}
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
              value={generatedContent.script}
              onChange={(e) => setGeneratedContent({ ...generatedContent, script: e.target.value })}
              rows={12}
              className="w-full px-4 py-3 rounded-lg text-sm resize-none"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Scenes */}
          {generatedContent.scenes && generatedContent.scenes.length > 0 && (
            <div className="card p-6">
              <h3 className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
                🎞️ 分镜设计
              </h3>
              <div className="space-y-3">
                {generatedContent.scenes.map((scene, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg"
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div className="flex items-start gap-3">
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
                        {scene}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subtitles */}
          {generatedContent.subtitles && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  🔤 字幕文案
                </h3>
                <button
                  onClick={() => handleCopy(generatedContent.subtitles, '字幕')}
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
                value={generatedContent.subtitles}
                onChange={(e) => setGeneratedContent({ ...generatedContent, subtitles: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-lg text-sm resize-none"
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          )}

          {/* Tags */}
          {generatedContent.tags && generatedContent.tags.length > 0 && (
            <div className="card p-6">
              <h3 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                🏷️ 推荐标签
              </h3>
              <div className="flex flex-wrap gap-2">
                {generatedContent.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 rounded-full text-xs"
                    style={{
                      background: '#fe2c5520',
                      color: '#fe2c55',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* BGM & Cover */}
          <div className="grid grid-cols-2 gap-4">
            {generatedContent.bgm && (
              <div className="card p-4">
                <h3 className="font-medium mb-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                  🎵 BGM 建议
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {generatedContent.bgm}
                </p>
              </div>
            )}
            {generatedContent.coverSuggestion && (
              <div className="card p-4">
                <h3 className="font-medium mb-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                  🖼️ 封面建议
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {generatedContent.coverSuggestion}
                </p>
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
                background: '#fe2c55',
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
            <div className="w-12 h-12 border-4 border-red-500 rounded-full border-t-transparent animate-spin mx-auto mb-4" style={{ borderColor: '#fe2c55', borderTopColor: 'transparent' }}></div>
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              正在生成...
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              AI 正在为你生成{selectedPlatform}{selectedType}脚本
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
