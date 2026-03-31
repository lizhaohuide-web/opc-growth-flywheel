import { NextRequest, NextResponse } from 'next/server'

/**
 * 公众号 HTML 转换 API
 * 
 * 将 Markdown 格式的文章内容转换为公众号兼容的 HTML 格式
 * 支持插入配图
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, illustrations = [], title, summary } = body

    if (!content) {
      return NextResponse.json(
        { error: '缺少必要参数：content' },
        { status: 400 }
      )
    }

    console.log('📝 转换公众号 HTML')

    // 将 Markdown 转换为 HTML
    const html = markdownToWechatHtml(content, illustrations)

    // 生成完整的 HTML 文档
    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || '公众号文章'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.75;
      color: #333;
      max-width: 677px;
      margin: 0 auto;
      padding: 20px;
    }
    
    h1, h2, h3, h4, h5, h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
      color: #000;
    }
    
    h1 {
      font-size: 24px;
      border-bottom: 2px solid #07C160;
      padding-bottom: 8px;
    }
    
    h2 {
      font-size: 20px;
      border-left: 4px solid #07C160;
      padding-left: 12px;
    }
    
    h3 {
      font-size: 18px;
    }
    
    p {
      margin-bottom: 16px;
      text-align: justify;
    }
    
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 20px auto;
      border-radius: 8px;
    }
    
    ul, ol {
      margin-bottom: 16px;
      padding-left: 24px;
    }
    
    li {
      margin-bottom: 8px;
    }
    
    blockquote {
      margin: 16px 0;
      padding: 12px 16px;
      background: #f6f8fa;
      border-left: 4px solid #07C160;
      border-radius: 4px;
      color: #666;
    }
    
    code {
      background: #f6f8fa;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 85%;
    }
    
    pre {
      background: #f6f8fa;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      margin-bottom: 16px;
    }
    
    pre code {
      background: none;
      padding: 0;
    }
    
    hr {
      height: 2px;
      border: none;
      background: #eaecef;
      margin: 24px 0;
    }
    
    strong {
      font-weight: 600;
      color: #07C160;
    }
    
    em {
      font-style: italic;
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>
    `.trim()

    return NextResponse.json({
      success: true,
      html: fullHtml,
      contentHtml: html,
    })
  } catch (error) {
    console.error('HTML 转换失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'HTML 转换失败' },
      { status: 500 }
    )
  }
}

/**
 * 将 Markdown 转换为公众号 HTML
 */
function markdownToWechatHtml(markdown: string, illustrations: Array<{
  position: number
  imageUrl?: string
}>): string {
  let html = markdown

  // 简单的 Markdown 转 HTML
  // 标题
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>')
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>')
  
  // 粗体
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  
  // 斜体
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  
  // 行内代码
  html = html.replace(/`(.*?)`/g, '<code>$1</code>')
  
  // 代码块
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
  
  // 引用
  html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
  
  // 无序列表
  html = html.replace(/^\s*[-*+]\s+(.*$)/gim, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
  
  // 有序列表
  html = html.replace(/^\s*\d+\.\s+(.*$)/gim, '<li>$1</li>')
  
  // 图片
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" />')
  
  // 链接
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
  
  // 分割线
  html = html.replace(/^---$/gim, '<hr />')
  
  // 段落
  html = html.replace(/\n\n+/g, '</p><p>')
  html = '<p>' + html + '</p>'
  
  // 清理多余的空段落
  html = html.replace(/<p><\/p>/g, '')
  html = html.replace(/<p>(<h[1-6]>)/g, '$1')
  html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1')
  html = html.replace(/<p>(<ul>)/g, '$1')
  html = html.replace(/(<\/ul>)<\/p>/g, '$1')
  html = html.replace(/<p>(<blockquote>)/g, '$1')
  html = html.replace(/(<\/blockquote>)<\/p>/g, '$1')
  html = html.replace(/<p>(<pre>)/g, '$1')
  html = html.replace(/(<\/pre>)<\/p>/g, '$1')
  html = html.replace(/<p>(<hr \/>)/g, '$1')

  return html
}
