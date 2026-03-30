import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: '没有文件' },
        { status: 400 }
      )
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: '只支持图片文件' },
        { status: 400 }
      )
    }

    // 验证文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: '文件大小不能超过 5MB' },
        { status: 400 }
      )
    }

    // 获取当前用户
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    // 生成文件名
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `note-images/${fileName}`

    // 上传到 Supabase Storage
    console.log('开始上传到 Supabase Storage:', filePath)
    const { data, error } = await supabase.storage
      .from('note-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Supabase Storage 上传失败:', error)
      
      // 如果是存储桶不存在，尝试创建（需要权限）或返回 Base64 方案
      if (error.message.includes('not found') || error.message.includes('Not found')) {
        console.log('存储桶不存在，降级到 Base64 方案')
        // 返回信号让前端使用 Base64
        return NextResponse.json({
          useBase64: true,
          note: '存储桶未配置，请使用 Base64 方式'
        })
      }
      
      return NextResponse.json(
        { error: '上传失败：' + error.message },
        { status: 500 }
      )
    }

    console.log('上传成功:', data)
    
    // 获取公开访问 URL
    const { data: { publicUrl } } = supabase.storage
      .from('note-images')
      .getPublicUrl(filePath)

    console.log('公开 URL:', publicUrl)

    return NextResponse.json({
      url: publicUrl,
      fileName: file.name,
      size: file.size,
    })
  } catch (error) {
    console.error('上传错误:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
