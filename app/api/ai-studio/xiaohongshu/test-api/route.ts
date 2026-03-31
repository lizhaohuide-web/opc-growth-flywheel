import { NextResponse } from 'next/server'

const DASHSCOPE_API_KEY = 'sk-18407568fd404754a3d18b93781e3db3'
const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1'

export async function GET() {
  try {
    console.log('测试通义千问图像生成 API (qwen-image-2.0-pro)...')
    
    // 测试 API 连接
    const response = await fetch(`${DASHSCOPE_BASE_URL}/services/aigc/multimodal-generation/generation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-image-2.0-pro',
        input: {
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: '一只可爱的小猫，卡通风格，粉色背景，高质量',
                },
              ],
            },
          ],
        },
        parameters: {
          size: '1024*1024',
          n: 1,
        },
      }),
    })

    console.log('API 响应状态:', response.status)

    // 获取原始响应文本
    const responseText = await response.text()
    console.log('API 原始响应:', responseText.substring(0, 500))
    
    // 尝试解析 JSON
    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      return NextResponse.json({
        success: false,
        status: response.status,
        error: '响应不是有效 JSON',
        responseText: responseText.substring(0, 500),
        message: 'API 返回格式错误，可能是 HTML 错误或认证失败',
      })
    }
    
    console.log('API 响应数据:', data)

    if (!response.ok) {
      const errorMessage = data.output?.text || data.message?.message || data.message || 'API 调用失败'
      return NextResponse.json({
        success: false,
        status: response.status,
        error: errorMessage,
        message: 'API 调用失败，请检查 API Key 或余额',
      })
    }
    
    // 解析图片 URL
    const imageUrl = data.output?.choices?.[0]?.message?.content?.[0]?.image?.url
    
    if (imageUrl) {
      return NextResponse.json({
        success: true,
        imageUrl,
        message: 'API 调用成功',
      })
    } else {
      return NextResponse.json({
        success: false,
        message: '未返回图片 URL',
        data,
      })
    }
  } catch (error) {
    console.error('测试失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      message: 'API 测试失败',
    })
  }
}
