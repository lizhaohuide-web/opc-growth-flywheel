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

interface PlanOption {
  id: string
  name: string
  description: string
  icon: string
  features: string[]
  color: string
}

const plans: PlanOption[] = [
  {
    id: 'basic',
    name: '基础版',
    description: '快速生成短视频脚本',
    icon: '⚡',
    features: ['15-30 秒脚本', '简单分镜', '口播文案'],
    color: '#3b82f6',
  },
  {
    id: 'advanced',
    name: '进阶版',
    description: '完整短视频方案',
    icon: '🎯',
    features: ['30-60 秒脚本', '详细分镜', 'BGM 建议', '转场设计'],
    color: '#8b5cf6',
  },
  {
    id: 'pro',
    name: '高阶版',
    description: '专业级视频策划',
    icon: '🏆',
    features: ['60 秒 + 脚本', '完整分镜', 'BGM+ 音效', '转场 + 特效', '封面建议'],
    color: '#f59e0b',
  },
]

export default function ShortVideoPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<{
    script: string
    scenes: string[]
    bgm?: string
    coverSuggestion?: string
  } | null>(null)

  const steps = ['选择方案', '选择笔记', '生成脚本']

  const handleGenerate = async () => {
    if (!selectedNote || !selectedPlan) return
    
    setGenerating(true)
    
    try {
      const supabase = createClient()
      
      const response = await fetch('/api/ai-studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: selectedNote.id,
          platform: 'short-video',
          plan: selectedPlan,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setGeneratedContent(data)
        setStep(2)
        
        try {
          await supabase.from('ai_versions').insert({
            note_id: selectedNote.id,
            platform: 'short-video',
            version: 1,
            content: data.script,
            plan: selectedPlan,
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
        platform: 'short-video',
        version: 1,
        content: generatedContent.script,
        plan: selectedPlan,
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
          <span className="text-4xl">🎬</span>
          <div>
            <h1 className="text-3xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>
              短视频改写
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              生成抖音/视频号短视频脚本
            </p>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <StepIndicator steps={steps} currentStep={step} />

      {/* Step 1: Select Plan */}
      {step === 0 && (
        <div className="card p-6 space-y-4">
          <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
            选择制作方案
          </h3>
          
          <div className="grid grid-cols-1 gap-3">
            {plans.map(plan => {
              const isSelected = selectedPlan === plan.id
              
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  className="p-4 rounded-xl text-left transition-all"
                  style={{
                    background: isSelected ? `${plan.color}15` : 'var(--bg-primary)',
                    border: isSelected ? `2px solid ${plan.color}` : '1px solid var(--border-subtle)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{plan.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {plan.name}
                        </h4>
                        {isSelected && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: plan.color,
                              color: 'white',
                            }}
                          >
                            已选择
                          </span>
                        )}
                      </div>
                      <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                        {plan.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {plan.features.map(feature => (
                          <span
                            key={feature}
                            className="text-xs px-2 py-1 rounded"
                            style={{
                              background: 'var(--bg-elevated)',
                              color: 'var(--text-tertiary)',
                            }}
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
          
          <button
            onClick={() => selectedPlan && setStep(1)}
            disabled={!selectedPlan}
            className="w-full mt-4 px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50"
            style={{
              background: selectedPlan ? '#fe2c55' : 'var(--bg-elevated)',
              color: selectedPlan ? 'white' : 'var(--text-tertiary)',
            }}
          >
            下一步
          </button>
        </div>
      )}

      {/* Step 2: Select Note */}
      {step === 1 && (
        <div className="card p-6 space-y-6">
          <NoteSelector
            selectedNoteId={selectedNote?.id}
            onSelectNote={(note) => {
              setSelectedNote(note)
              setStep(2)
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

      {/* Step 3: Preview & Edit */}
      {step === 2 && generatedContent && (
        <div className="space-y-6">
          {/* Script */}
          <VersionPreview
            title="短视频脚本"
            content={generatedContent.script}
            platform="short-video"
            version={1}
            onEdit={(newContent) => {
              setGeneratedContent({ ...generatedContent, script: newContent })
            }}
            onSave={handleSave}
          />

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

          {/* BGM Suggestion */}
          {generatedContent.bgm && (
            <div className="card p-6">
              <h3 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                🎵 BGM 建议
              </h3>
              <div
                className="p-4 rounded-lg"
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {generatedContent.bgm}
                </p>
              </div>
            </div>
          )}

          {/* Cover Suggestion */}
          {generatedContent.coverSuggestion && (
            <div className="card p-6">
              <h3 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                🖼️ 封面建议
              </h3>
              <div
                className="p-4 rounded-lg"
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {generatedContent.coverSuggestion}
                </p>
              </div>
            </div>
          )}

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
              保存并使用
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
              AI 正在为你生成{plans.find(p => p.id === selectedPlan)?.name}脚本
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
