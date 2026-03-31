import { NextRequest, NextResponse } from 'next/server'

// Simulated database (replace with actual database calls)
const versions: any[] = []

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const noteId = searchParams.get('noteId')
    const platform = searchParams.get('platform')

    let filteredVersions = versions

    if (noteId) {
      filteredVersions = filteredVersions.filter(v => v.note_id === noteId)
    }

    if (platform) {
      filteredVersions = filteredVersions.filter(v => v.platform === platform)
    }

    // Sort by created_at descending
    filteredVersions.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return NextResponse.json({
      success: true,
      versions: filteredVersions,
    })
  } catch (error) {
    console.error('Failed to fetch versions:', error)
    return NextResponse.json(
      { error: '获取版本列表失败' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const versionId = searchParams.get('id')

    if (!versionId) {
      return NextResponse.json(
        { error: '缺少版本 ID' },
        { status: 400 }
      )
    }

    const index = versions.findIndex(v => v.id === versionId)
    
    if (index === -1) {
      return NextResponse.json(
        { error: '版本不存在' },
        { status: 404 }
      )
    }

    versions.splice(index, 1)

    return NextResponse.json({
      success: true,
      message: '版本已删除',
    })
  } catch (error) {
    console.error('Failed to delete version:', error)
    return NextResponse.json(
      { error: '删除失败' },
      { status: 500 }
    )
  }
}
