'use client'
import MDEditor from '@uiw/react-md-editor'
import SmartHint from './SmartHint'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function RichMarkdownEditor({ 
  value, 
  onChange,
  placeholder = '开始记录你的思考...' 
}: Props) {
  return (
    <div data-color-mode="light">
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || '')}
        commands={[]} // 移除所有工具栏按钮
        preview="edit" // 只显示编辑模式
        height={500}
        enableScroll={true}
        hideToolbar={true} // 隐藏工具栏
        visibleDragbar={false}
        textareaProps={{
          placeholder,
        }}
        style={{
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
        }}
      />

      {/* 底部状态栏 */}
      <div 
        className="flex items-center justify-between px-3 py-2 text-xs mt-2 rounded-lg"
        style={{ background: 'var(--bg-elevated)', color: 'var(--text-tertiary)' }}
      >
        <div className="flex items-center gap-4">
          <span>📝 {value.length} 字符</span>
          <span>📄 {value.split('\n').length} 行</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="opacity-50">Markdown</span>
        </div>
      </div>

      {/* AI 智能提示 - 移动端显示 */}
      <div className="mt-4 lg:hidden">
        <SmartHint content={value} mode="free" />
      </div>
    </div>
  )
}
