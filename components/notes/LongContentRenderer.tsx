'use client'
import { marked } from 'marked'
import ExpandButton from './ExpandButton'

export default function LongContentRenderer({ 
  previewContent, 
  fullContent, 
  isLong 
}: { 
  previewContent: string
  fullContent: string
  isLong: boolean
}) {
  return (
    <div>
      <div
        id="note-content"
        className="prose max-w-none
          prose-headings:font-bold
          prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
          prose-p:leading-relaxed
          prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm
          prose-pre:p-4
          prose-ul:list-disc prose-ol:list-decimal
          prose-li:my-1
          prose-blockquote:border-l-4 prose-blockquote:pl-4
          prose-img:rounded-lg"
        style={{
          '--tw-prose-body': 'var(--text-primary)',
          '--tw-prose-headings': 'var(--text-primary)',
          '--tw-prose-links': 'var(--accent)',
          '--tw-prose-code': 'var(--text-primary)',
          '--tw-prose-pre-bg': 'var(--bg-elevated)',
          '--tw-prose-pre-code': 'var(--text-primary)',
          '--tw-prose-blockquote': 'var(--text-secondary)',
          '--tw-prose-quotes': 'var(--text-primary)',
          '--tw-prose-hr': 'var(--border-subtle)',
          '--tw-prose-th-borders': 'var(--border-subtle)',
          '--tw-prose-td-borders': 'var(--border-subtle)',
        } as React.CSSProperties}
        dangerouslySetInnerHTML={{ __html: marked(previewContent) }}
      />
      
      {isLong && (
        <div className="mt-6 text-center">
          <ExpandButton fullContent={fullContent} />
        </div>
      )}
    </div>
  )
}
