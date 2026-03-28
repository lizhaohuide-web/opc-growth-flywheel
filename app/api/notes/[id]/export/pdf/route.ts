import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: note } = await supabase
      .from('notes')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single()
    
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }
    
    // 返回 HTML，用户可通过浏览器打印为 PDF
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${note.title || '笔记'} - OPC 增长飞轮</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.8;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    h1 {
      font-size: 2em;
      border-bottom: 2px solid #eee;
      padding-bottom: 0.5em;
    }
    .meta {
      color: #666;
      font-size: 0.9em;
      margin-bottom: 2em;
    }
    pre {
      background: #f5f5f5;
      padding: 1em;
      border-radius: 4px;
      overflow-x: auto;
    }
    blockquote {
      border-left: 4px solid #ddd;
      margin: 0;
      padding-left: 1em;
      color: #666;
    }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <h1>${note.title || '无标题'}</h1>
  <div class="meta">
    创建于 ${new Date(note.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
    ${note.tags?.length ? `| 标签：${note.tags.join(', ')}` : ''}
  </div>
  <div>${note.content.replace(/\n/g, '<br>')}</div>
  <script>
    // 自动打开打印对话框
    window.onload = () => setTimeout(() => window.print(), 500);
  </script>
</body>
</html>
`
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    })
  } catch (error) {
    console.error('PDF Export API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
