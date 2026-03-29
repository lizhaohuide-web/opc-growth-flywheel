'use client'
import { useState, useRef, useCallback } from 'react'
import MDEditor, { commands, getCommands, executeCommand, TextState } from '@uiw/react-md-editor'
import { useDropzone } from 'react-dropzone'

interface Props {
  value: string
  onChange: (value: string) => void
  onImageUpload?: (file: File) => Promise<string>
  placeholder?: string
}

export default function RichMarkdownEditor({ 
  value, 
  onChange, 
  onImageUpload,
  placeholder = '开始记录你的思考...' 
}: Props) {
  const [uploading, setUploading] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  // 处理图片上传
  const uploadImage = async (file: File): Promise<string> => {
    if (onImageUpload) {
      return await onImageUpload(file)
    }
    
    // 默认转为 Base64（小图片）
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        resolve(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    })
  }

  // 处理文件拖放
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file || !file.type.startsWith('image/')) return
    
    setUploading(true)
    try {
      const imageUrl = await uploadImage(file)
      const markdownImage = `\n![${file.name}](${imageUrl})\n`
      onChange(value + markdownImage)
    } catch (error) {
      console.error('图片上传失败:', error)
      alert('图片上传失败，请重试')
    } finally {
      setUploading(false)
    }
  }, [value, onChange, onImageUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    maxFiles: 1,
    multiple: false,
  })

  // 自定义工具栏命令
  const customCommands = [
    ...getCommands().filter(cmd => 
      cmd.name !== 'divider' && 
      cmd.name !== 'preview' && 
      cmd.name !== 'fullscreen'
    ),
    {
      name: 'image-upload',
      keyCommand: 'imageUpload',
      buttonProps: { 'aria-label': '上传图片' },
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
      ),
      execute: (state: TextState, api: any) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0]
          if (!file) return
          
          setUploading(true)
          try {
            const imageUrl = await uploadImage(file)
            const markdownImage = `![${file.name}](${imageUrl})`
            executeCommand({
              name: 'image',
              keyCommand: 'image',
              buttonProps: { 'aria-label': '插入图片' },
              icon: 'img',
              execute: (state: TextState, api: any) => {
                api.replaceSelection(markdownImage)
                return api.setState()
              }
            }, state, api)
          } catch (error) {
            console.error('图片上传失败:', error)
          } finally {
            setUploading(false)
          }
        }
        input.click()
        return api.setState()
      }
    },
    commands.divider,
    {
      name: 'word-count',
      keyCommand: 'wordCount',
      buttonProps: { 'aria-label': '字数统计' },
      icon: <span style={{ fontSize: '12px', fontWeight: 'bold' }}>ABC</span>,
      execute: () => {
        const words = value.trim().split(/\s+/).length
        const chars = value.length
        alert(`字数：${chars} 字符，${words} 单词`)
        return { ...value }
      }
    }
  ]

  return (
    <div 
      {...(uploading || isDragActive ? getRootProps() : {})}
      className="relative"
      data-color-mode="light"
    >
      <input {...getInputProps()} />
      
      {isDragActive && (
        <div 
          className="absolute inset-0 z-50 flex items-center justify-center rounded-lg border-2 border-dashed"
          style={{ 
            background: 'var(--accent-subtle)',
            borderColor: 'var(--accent)',
          }}
        >
          <div className="text-center">
            <div className="text-4xl mb-2">📷</div>
            <p className="font-medium" style={{ color: 'var(--accent)' }}>
              松开以上传图片
            </p>
          </div>
        </div>
      )}

      <MDEditor
        ref={editorRef}
        value={value}
        onChange={(val) => onChange(val || '')}
        commands={customCommands}
        preview="edit"
        height={500}
        enableScroll={true}
        hideToolbar={false}
        visibleDragbar={true}
        textareaProps={{
          placeholder,
        }}
        style={{
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
        }}
      />

      {uploading && (
        <div className="absolute top-2 right-2 px-3 py-1.5 text-xs rounded-md animate-pulse"
          style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}>
          📤 上传图片中...
        </div>
      )}

      {/* 底部状态栏 */}
      <div 
        className="flex items-center justify-between px-3 py-2 text-xs mt-2 rounded-lg"
        style={{ background: 'var(--bg-elevated)', color: 'var(--text-tertiary)' }}
      >
        <div className="flex items-center gap-4">
          <span>📝 {value.length} 字符</span>
          <span>📄 {value.split('\n').length} 行</span>
          <span>📖 {value.trim().split(/\s+/).filter(Boolean).length} 词</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="opacity-50">Markdown</span>
        </div>
      </div>
    </div>
  )
}
