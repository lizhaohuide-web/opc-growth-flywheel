'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface AIVersion {
  id: string
  note_id: string
  platform: string
  version: number
  content: string
  style?: string
  titles?: string
  image_urls?: string  // JSON string (legacy)
  image_prompts?: string  // JSON string (legacy)
  metadata?: {
    image_urls?: string[] | string
    image_prompts?: string[] | string
    titles?: string
    title?: string
    scenes?: string[] | string
    subtitles?: string[] | string
    tags?: string[] | string
    bgm?: string
    cover_url?: string
    summary?: string
    illustrations?: string[] | string
    format?: string
    duration?: string
    opening?: string
    outline?: string[] | string
    closing?: string
    [key: string]: unknown
  }
  created_at: string
}

interface Note {
  id: string
  title: string
}

const platformIcons: Record<string, string> = {
  wechat: '📝',
  xiaohongshu: '📕',
  moments: '💬',
  'short-video': '🎬',
  podcast: '🎙️',
  custom: '✨',
}

const platformNames: Record<string, string> = {
  wechat: '公众号',
  xiaohongshu: '小红书',
  moments: '朋友圈',
  'short-video': '短视频',
  podcast: '播客',
  custom: '自定义',
}

// Helper functions
function getImageUrls(version: AIVersion): string[] {
  let imageUrls: string[] = []
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
  return imageUrls
}

function downloadImage(url: string, filename: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
}

function parseTitleFromContent(content: string): string {
  const lines = content.split('\n')
  return lines[0]?.replace(/^[#*]+\s*/, '') || ''
}

function formatScenes(scenes: string[] | string): string {
  if (Array.isArray(scenes)) {
    return scenes.join('\n\n')
  }
  return scenes || ''
}

function formatSubtitles(subtitles: string[] | string): string {
  if (Array.isArray(subtitles)) {
    return subtitles.join('\n')
  }
  return subtitles || ''
}

function formatTags(tags: string[] | string): string {
  if (Array.isArray(tags)) {
    return tags.join(' ')
  }
  return tags || ''
}

function formatOutline(outline: string[] | string): string {
  if (Array.isArray(outline)) {
    return outline.map((item, i) => `${i + 1}. ${item}`).join('\n')
  }
  return outline || ''
}

// Section component
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const content = typeof children === 'string' ? children : String(children || '')
  if (!content.trim()) return null
  
  return (
    <div className="mb-6">
      <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
        {title}
      </h4>
      <div
        className="p-4 rounded-lg whitespace-pre-wrap"
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          {content}
        </p>
      </div>
    </div>
  )
}

// Image Section component
function ImageSection({
  title,
  imageUrls,
  onDownload,
}: {
  title: string
  imageUrls: string[]
  onDownload: (url: string, index: number) => void
}) {
  if (!imageUrls || imageUrls.length === 0) return null

  return (
    <div className="mb-6">
      <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
        {title}（{imageUrls.length}张）
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
            <a
              href={url}
              download={`image-${index + 1}.png`}
              className="block w-full text-center text-xs px-2 py-1 rounded transition-colors"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
              }}
              target="_blank"
              rel="noopener noreferrer"
            >
              ⬇️ 下载
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function VersionsPage() {
  const router = useRouter()
  const [versions, setVersions] = useState<AIVersion[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVersion, setSelectedVersion] = useState<AIVersion | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const supabase = createClient()
    
    try {
      // 获取笔记列表（用于显示标题）
      const { data: notesData } = await supabase
        .from('notes')
        .select('id, title')
        .order('created_at', { ascending: false })
      
      if (notesData) setNotes(notesData)
      
      // 获取所有 AI 版本
      const { data: versionsData } = await supabase
        .from('ai_versions')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (versionsData) setVersions(versionsData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getNoteTitle = (noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    return note?.title || '无标题笔记'
  }

  const handleViewVersion = (version: AIVersion) => {
    setSelectedVersion(version)
  }

  const handleDeleteVersion = async (versionId: string) => {
    if (!confirm('确定要删除这个生成记录吗？')) return
    
    setDeleting(versionId)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('ai_versions')
        .delete()
        .eq('id', versionId)
      
      if (error) throw error
      
      // 从列表中移除
      setVersions(versions.filter(v => v.id !== versionId))
      if (selectedVersion?.id === versionId) {
        setSelectedVersion(null)
      }
    } catch (error) {
      console.error('Delete failed:', error)
      alert('删除失败，请重试')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-enter">
          <div className="w-10 h-10 border-2 border-accent rounded-full border-t-transparent animate-spin mx-auto" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}></div>
          <p className="mt-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto animate-enter">
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
        
        <div className="flex items-center gap-3">
          <span className="text-4xl">📊</span>
          <div>
            <h1 className="text-3xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>
              生成历史
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              查看所有 AI 生成的内容版本
            </p>
          </div>
        </div>
      </div>

      {/* Versions List */}
      {versions.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">📝</div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            暂无生成记录
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>
            去 AI 工作室创建你的第一个版本吧
          </p>
          <Link
            href="/dashboard/ai-studio"
            className="inline-block px-6 py-3 rounded-lg font-medium"
            style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
          >
            前往 AI 工作室
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {versions.map((version, index) => (
            <div
              key={version.id}
              className="card p-6 transition-all hover:shadow-md cursor-pointer"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
              onClick={() => handleViewVersion(version)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">
                      {platformIcons[version.platform] || '📄'}
                    </span>
                    <div>
                      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {getNoteTitle(version.note_id)}
                      </h3>
                      <div className="flex items-center gap-2 text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                        <span>{platformNames[version.platform] || '未知平台'}</span>
                        <span>·</span>
                        <span>版本 {version.version}</span>
                        <span>·</span>
                        <span>{new Date(version.created_at).toLocaleDateString('zh-CN')}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                    {version.content?.substring(0, 150) || '无内容'}...
                  </p>
                  {(() => {
                    const imageUrls = getImageUrls(version)
                    
                    if (!imageUrls || imageUrls.length === 0) return null
                    
                    return (
                      <div className="flex gap-1 mt-2">
                        {imageUrls.slice(0, 3).map((url, i) => (
                          <div
                            key={i}
                            className="w-8 h-8 rounded bg-cover bg-center"
                            style={{ backgroundImage: `url(${url})` }}
                          />
                        ))}
                        {imageUrls.length > 3 && (
                          <div className="w-8 h-8 rounded flex items-center justify-center text-xs" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                            +{imageUrls.length - 3}
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
                <div className="ml-4 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteVersion(version.id)
                    }}
                    disabled={deleting === version.id}
                    className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-elevated)]"
                    style={{ color: 'var(--error)' }}
                    title="删除"
                  >
                    {deleting === version.id ? (
                      <span className="text-xs">...</span>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                  <div style={{ color: 'var(--text-tertiary)' }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Version Detail Modal */}
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
                    {platformNames[selectedVersion.platform]} · 版本 {selectedVersion.version} · {new Date(selectedVersion.created_at).toLocaleString('zh-CN')}
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
              {selectedVersion.style && (
                <div className="mb-6">
                  <span
                    className="text-xs px-3 py-1.5 rounded-full"
                    style={{
                      background: 'var(--accent-subtle)',
                      color: 'var(--accent)',
                    }}
                  >
                    🎨 {selectedVersion.style}
                  </span>
                </div>
              )}

              {/* 小红书 */}
              {selectedVersion.platform === 'xiaohongshu' && (
                <>
                  {(selectedVersion.metadata?.titles || selectedVersion.titles) && (
                    <Section title="📌 标题">
                      {selectedVersion.metadata?.titles || selectedVersion.titles}
                    </Section>
                  )}
                  <Section title="📝 文案">{selectedVersion.content}</Section>
                  <ImageSection
                    title="🖼️ 配图"
                    imageUrls={getImageUrls(selectedVersion)}
                    onDownload={(url, index) => downloadImage(url, `xiaohongshu-image-${index + 1}.png`)}
                  />
                </>
              )}

              {/* 短视频 */}
              {selectedVersion.platform === 'short-video' && (
                <>
                  {(selectedVersion.metadata?.title || parseTitleFromContent(selectedVersion.content)) && (
                    <Section title="📌 标题">
                      {selectedVersion.metadata?.title || parseTitleFromContent(selectedVersion.content)}
                    </Section>
                  )}
                  <Section title="📝 脚本">{selectedVersion.content}</Section>
                  {selectedVersion.metadata?.scenes && (
                    <Section title="🎬 分镜">{formatScenes(selectedVersion.metadata.scenes)}</Section>
                  )}
                  {selectedVersion.metadata?.subtitles && (
                    <Section title="🎞️ 字幕">{formatSubtitles(selectedVersion.metadata.subtitles)}</Section>
                  )}
                  {selectedVersion.metadata?.tags && (
                    <Section title="🏷️ 标签">{formatTags(selectedVersion.metadata.tags)}</Section>
                  )}
                  {selectedVersion.metadata?.bgm && (
                    <Section title="🎵 BGM 建议">{selectedVersion.metadata.bgm}</Section>
                  )}
                </>
              )}

              {/* 公众号 */}
              {selectedVersion.platform === 'wechat' && (
                <>
                  {(selectedVersion.metadata?.cover_url || (selectedVersion.metadata?.image_urls && getImageUrls(selectedVersion)[0])) && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                        🖼️ 封面图
                      </h4>
                      <div
                        className="rounded-lg overflow-hidden"
                        style={{
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <img
                          src={selectedVersion.metadata?.cover_url || getImageUrls(selectedVersion)[0]}
                          alt="封面图"
                          className="w-full h-48 object-cover"
                        />
                      </div>
                    </div>
                  )}
                  {(selectedVersion.metadata?.titles || selectedVersion.titles) && (
                    <Section title="📌 标题">
                      {selectedVersion.metadata?.titles || selectedVersion.titles}
                    </Section>
                  )}
                  {selectedVersion.metadata?.summary && (
                    <Section title="📝 摘要">{selectedVersion.metadata.summary}</Section>
                  )}
                  <Section title="📄 正文">{selectedVersion.content}</Section>
                  {selectedVersion.metadata?.illustrations && (
                    <ImageSection
                      title="🖼️ 配图"
                      imageUrls={Array.isArray(selectedVersion.metadata.illustrations) ? selectedVersion.metadata.illustrations : []}
                      onDownload={(url, index) => downloadImage(url, `wechat-image-${index + 1}.png`)}
                    />
                  )}
                </>
              )}

              {/* 朋友圈 */}
              {selectedVersion.platform === 'moments' && (
                <>
                  <Section title="📝 文案">{selectedVersion.content}</Section>
                  <ImageSection
                    title="🖼️ 配图"
                    imageUrls={getImageUrls(selectedVersion)}
                    onDownload={(url, index) => downloadImage(url, `moments-image-${index + 1}.png`)}
                  />
                </>
              )}

              {/* 播客 */}
              {selectedVersion.platform === 'podcast' && (
                <>
                  {selectedVersion.metadata?.title && (
                    <Section title="📌 标题">{selectedVersion.metadata.title}</Section>
                  )}
                  {selectedVersion.metadata?.format && (
                    <Section title="🎙️ 格式">{selectedVersion.metadata.format}</Section>
                  )}
                  {selectedVersion.metadata?.duration && (
                    <Section title="⏱️ 时长">{selectedVersion.metadata.duration}</Section>
                  )}
                  {selectedVersion.metadata?.opening && (
                    <Section title="🎬 开场白">{selectedVersion.metadata.opening}</Section>
                  )}
                  {selectedVersion.metadata?.outline && (
                    <Section title="📋 大纲">{formatOutline(selectedVersion.metadata.outline)}</Section>
                  )}
                  <Section title="📝 逐字稿">{selectedVersion.content}</Section>
                  {selectedVersion.metadata?.closing && (
                    <Section title="🔚 结语">{selectedVersion.metadata.closing}</Section>
                  )}
                </>
              )}

              {/* 自定义 */}
              {selectedVersion.platform === 'custom' && (
                <>
                  <Section title="📝 文案">{selectedVersion.content}</Section>
                  <ImageSection
                    title="🖼️ 配图"
                    imageUrls={getImageUrls(selectedVersion)}
                    onDownload={(url, index) => downloadImage(url, `custom-image-${index + 1}.png`)}
                  />
                </>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
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
                  📋 复制文案
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
                <button
                  onClick={() => handleDeleteVersion(selectedVersion.id)}
                  disabled={deleting === selectedVersion.id}
                  className="px-4 py-2.5 rounded-lg font-medium transition-colors"
                  style={{
                    background: 'rgba(248, 113, 113, 0.15)',
                    color: 'var(--error)',
                  }}
                >
                  {deleting === selectedVersion.id ? '删除中...' : '🗑️'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
