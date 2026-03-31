'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Note {
  id: string
  title: string
  content: string
  created_at: string
}

interface AIVersion {
  id: string
  note_id: string
  platform: string
  version: number
  content: string
  metadata?: {
    titles?: string
    image_urls?: string[]
  }
  created_at: string
}

interface PlatformCard {
  id: string
  name: string
  displayName: string
  icon: string
  color: string
  gradient: string
  features: string[]
  description: string
}

const platforms: PlatformCard[] = [
  {
    id: 'wechat',
    name: '公众号',
    displayName: '微信公众号',
    icon: '📝',
    color: '#07c160',
    gradient: 'linear-gradient(135deg, #07c160 0%, #06ad56 100%)',
    features: ['标题优化', '正文改写', '配图生成'],
    description: '专业深度文章，打造个人品牌',
  },
  {
    id: 'xiaohongshu',
    name: '小红书',
    displayName: '小红书',
    icon: '📕',
    color: '#ff2442',
    gradient: 'linear-gradient(135deg, #ff2442 0%, #ff6b7a 100%)',
    features: ['爆款标题', '文案改写', '标签推荐'],
    description: '精致生活方式，种草好物分享',
  },
  {
    id: 'moments',
    name: '朋友圈',
    displayName: '微信朋友圈',
    icon: '💬',
    color: '#1aad19',
    gradient: 'linear-gradient(135deg, #1aad19 0%, #07c160 100%)',
    features: ['生活化文案', '精简内容', '情感共鸣'],
    description: '记录生活点滴，分享成长感悟',
  },
  {
    id: 'short-video',
    name: '短视频',
    displayName: '抖音/视频号',
    icon: '🎬',
    color: '#fe2c55',
    gradient: 'linear-gradient(135deg, #fe2c55 0%, #ff6b8b 100%)',
    features: ['脚本创作', '分镜设计', '口播文案'],
    description: '短视频脚本，抓住黄金 3 秒',
  },
  {
    id: 'podcast',
    name: '播客',
    displayName: '播客/音频',
    icon: '🎙️',
    color: '#9333ea',
    gradient: 'linear-gradient(135deg, #9333ea 0%, #a855f7 100%)',
    features: ['对话脚本', '音频生成', '节目策划'],
    description: '双人对话播客，深度内容输出',
  },
]

export default function AIStudioPage() {
  const router = useRouter()
  const [recentVersions, setRecentVersions] = useState<AIVersion[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVersion, setSelectedVersion] = useState<AIVersion | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      
      try {
        // 获取笔记列表
        const { data: notesData } = await supabase
          .from('notes')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)
        
        if (notesData) setNotes(notesData)
        
        // 获取最近的 AI 版本
        try {
          const { data: versionsData } = await supabase
            .from('ai_versions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5)
          
          if (versionsData) setRecentVersions(versionsData)
        } catch (e) {
          console.log('AI versions table not ready yet')
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  const getNoteTitle = (noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    return note?.title || '无标题笔记'
  }

  const platformIcons: Record<string, string> = {
    wechat: '📝',
    xiaohongshu: '📕',
    moments: '💬',
    'short-video': '🎬',
    podcast: '🎙️',
  }

  return (
    <div className="space-y-8 animate-enter">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>
          🤖 AI 工作室
        </h1>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
          选择平台，将你的笔记转化为多平台内容
        </p>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platforms.map(platform => (
          <Link
            key={platform.id}
            href={`/dashboard/ai-studio/${platform.id}`}
            className="card overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {/* Card Header with Gradient */}
            <div
              className="p-6"
              style={{
                background: platform.gradient,
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">{platform.icon}</span>
                <div>
                  <h3 className="text-xl font-bold text-white">{platform.name}</h3>
                  <p className="text-white/80 text-sm">{platform.displayName}</p>
                </div>
              </div>
              <p className="text-white/90 text-sm">{platform.description}</p>
            </div>

            {/* Card Body */}
            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                {platform.features.map(feature => (
                  <span
                    key={feature}
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      background: platform.id === 'wechat' ? 'rgba(7, 193, 96, 0.1)' :
                                platform.id === 'xiaohongshu' ? 'rgba(255, 36, 66, 0.1)' :
                                platform.id === 'moments' ? 'rgba(26, 173, 25, 0.1)' :
                                platform.id === 'short-video' ? 'rgba(254, 44, 85, 0.1)' :
                                'rgba(147, 51, 234, 0.1)',
                      color: platform.id === 'wechat' ? '#07c160' :
                             platform.id === 'xiaohongshu' ? '#ff2442' :
                             platform.id === 'moments' ? '#1aad19' :
                             platform.id === 'short-video' ? '#fe2c55' :
                             '#9333ea',
                    }}
                  >
                    {feature}
                  </span>
                ))}
              </div>

              <div
                className="flex items-center text-sm font-medium"
                style={{ color: 'var(--accent)' }}
              >
                开始创作
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      {recentVersions.length > 0 && (
        <div className="card overflow-hidden">
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-primary)',
            }}
          >
            <h2 className="text-xl font-display" style={{ color: 'var(--text-primary)' }}>
              最近生成历史
            </h2>
            <Link
              href="/dashboard/ai-studio/versions"
              className="text-sm font-medium"
              style={{ color: 'var(--accent)' }}
            >
              查看全部 →
            </Link>
          </div>

          <div>
            {recentVersions.map((version, index) => (
              <div
                key={version.id}
                className="block p-6 transition-colors hover:bg-[var(--bg-card-hover)] cursor-pointer"
                style={{
                  borderBottom: index < recentVersions.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                }}
                onClick={() => setSelectedVersion(version)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">
                        {platformIcons[version.platform] || '📄'}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: 'var(--accent-subtle)',
                          color: 'var(--accent)',
                        }}
                      >
                        {platforms.find(p => p.id === version.platform)?.name || version.platform}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        版本 {version.version}
                      </span>
                    </div>
                    {(() => {
                      // 兼容新旧格式
                      let titles = ''
                      let imageUrls: string[] = []
                      
                      if (typeof version.metadata?.titles === 'string') {
                        titles = version.metadata.titles
                      }
                      
                      if (typeof version.metadata?.image_urls === 'string') {
                        try {
                          imageUrls = JSON.parse(version.metadata.image_urls)
                        } catch (e) {
                          imageUrls = []
                        }
                      } else if (Array.isArray(version.metadata?.image_urls)) {
                        imageUrls = version.metadata.image_urls
                      } else if (typeof version.image_urls === 'string') {
                        try {
                          imageUrls = JSON.parse(version.image_urls)
                        } catch (e) {
                          imageUrls = []
                        }
                      }
                      
                      return (
                        <>
                          {(titles || getNoteTitle(version.note_id)) && (
                            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                              {titles || getNoteTitle(version.note_id)}
                            </h3>
                          )}
                          <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                            {version.content.substring(0, 100)}...
                          </p>
                          {imageUrls.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {imageUrls.slice(0, 3).map((url, i) => (
                                <div
                                  key={i}
                                  className="w-10 h-10 rounded bg-cover bg-center"
                                  style={{ backgroundImage: `url(${url})` }}
                                />
                              ))}
                              {imageUrls.length > 3 && (
                                <div className="w-10 h-10 rounded flex items-center justify-center text-xs" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                                  +{imageUrls.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    {new Date(version.created_at).toLocaleDateString('zh-CN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Version Preview Modal */}
      {selectedVersion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedVersion(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[80vh] overflow-y-auto rounded-xl"
            style={{ background: 'var(--bg-secondary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="sticky top-0 px-6 py-4 flex items-center justify-between border-b"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {platformIcons[selectedVersion.platform] || '📄'}
                </span>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {getNoteTitle(selectedVersion.note_id)}
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {platforms.find(p => p.id === selectedVersion.platform)?.name} · 版本 {selectedVersion.version} · {new Date(selectedVersion.created_at).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVersion(null)}
                className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-elevated)]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* 标题 */}
              {selectedVersion.metadata?.titles && (
                <div className="mb-4">
                  <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                    {selectedVersion.metadata.titles}
                  </h3>
                </div>
              )}

              {/* 文案 */}
              <div className="mb-6">
                <div
                  className="p-6 rounded-lg whitespace-pre-wrap"
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    {selectedVersion.content}
                  </p>
                </div>
              </div>

              {/* 图片 */}
              {(() => {
                // 兼容新旧格式
                let imageUrls: string[] = []
                if (typeof selectedVersion.metadata?.image_urls === 'string') {
                  try {
                    imageUrls = JSON.parse(selectedVersion.metadata.image_urls)
                  } catch (e) {
                    imageUrls = []
                  }
                } else if (Array.isArray(selectedVersion.metadata?.image_urls)) {
                  imageUrls = selectedVersion.metadata.image_urls
                } else if (typeof selectedVersion.image_urls === 'string') {
                  try {
                    imageUrls = JSON.parse(selectedVersion.image_urls)
                  } catch (e) {
                    imageUrls = []
                  }
                }
                
                if (!imageUrls || imageUrls.length === 0) return null
                
                return (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                      配图（{imageUrls.length}张）
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {imageUrls.map((url, index) => (
                        <div key={index} className="space-y-2">
                          <div
                            className="aspect-square rounded-lg overflow-hidden"
                            style={{
                              background: 'var(--bg-primary)',
                              border: '1px solid var(--border-subtle)',
                            }}
                          >
                          {url ? (
                            <img src={url} alt={`图${index + 1}`} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              图{index + 1}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const link = document.createElement('a')
                            link.href = url
                            link.download = `image-${index + 1}.png`
                            link.click()
                          }}
                          className="block w-full text-center text-xs px-2 py-1.5 rounded-lg transition-all hover:shadow-md"
                          style={{
                            background: 'var(--bg-primary)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          <svg className="w-3.5 h-3.5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                      </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-6 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(selectedVersion.content)
                    alert('已复制到剪贴板 ✨')
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors"
                  style={{
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                  }}
                >
                  📋 复制内容
                </button>
                <button
                  onClick={() => {
                    router.push(`/dashboard/ai-studio/${selectedVersion.platform}`)
                    setSelectedVersion(null)
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-all"
                  style={{
                    background: 'var(--accent)',
                    color: 'var(--bg-primary)',
                  }}
                >
                  🔄 再次生成
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Start Guide */}
      <div
        className="rounded-xl p-6"
        style={{
          background: 'var(--accent-subtle)',
          border: '1px solid var(--border-accent)',
        }}
      >
        <h2 className="text-xl font-display mb-4" style={{ color: 'var(--text-primary)' }}>
          🚀 快速开始
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="p-4 rounded-lg"
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="text-2xl mb-2">1️⃣</div>
            <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>选择平台</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              点击上方卡片，选择要发布的平台
            </p>
          </div>
          <div
            className="p-4 rounded-lg"
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="text-2xl mb-2">2️⃣</div>
            <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>选择笔记</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              从你的笔记中选择要改写的内容
            </p>
          </div>
          <div
            className="p-4 rounded-lg"
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="text-2xl mb-2">3️⃣</div>
            <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>生成发布</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              AI 自动生成多版本文案，选择最佳方案发布
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
