/**
 * Individual Story API Endpoint
 * Route: GET /api/stories/[storyId]
 * Route: DELETE /api/stories/[storyId]
 * Route: PATCH /api/stories/[storyId]/status
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: '인증이 필요합니다. 로그인 후 다시 시도해주세요.'
      }, { status: 401 })
    }

    const { storyId } = await params

    if (!storyId) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 스토리 ID입니다.'
      }, { status: 400 })
    }

    // 스토리 조회 (본인 스토리만)
    const { data: story, error } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .eq('user_id', user.id)
      .single()

    if (error || !story) {
      return NextResponse.json({
        success: false,
        error: '스토리를 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // Supabase Storage에서 파일 내용 읽기
    let content = ''
    if (story.file_path) {
      try {
        const { data, error: downloadError } = await supabase.storage
          .from('stories')  // 실제 bucket 이름으로 변경
          .download(story.file_path)
        
        if (downloadError) {
          console.error('Story file download error:', downloadError)
        } else {
          content = await data.text()
        }
      } catch (fileError) {
        console.error('Story file read error:', fileError)
        // 파일을 읽을 수 없어도 DB 정보는 반환
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...story,
        content
      }
    })

  } catch (error) {
    console.error('Story retrieval error:', error)
    
    return NextResponse.json({
      success: false,
      error: '스토리 조회 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: '인증이 필요합니다. 로그인 후 다시 시도해주세요.'
      }, { status: 401 })
    }

    const { storyId } = await params

    if (!storyId) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 스토리 ID입니다.'
      }, { status: 400 })
    }

    // 스토리 삭제 (본인 스토리만)
    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', storyId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Story deletion error:', error)
      return NextResponse.json({
        success: false,
        error: '스토리 삭제에 실패했습니다.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('Story deletion error:', error)
    
    return NextResponse.json({
      success: false,
      error: '스토리 삭제 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: '인증이 필요합니다. 로그인 후 다시 시도해주세요.'
      }, { status: 401 })
    }

    const { storyId } = await params
    const body = await request.json()
    const { status } = body

    if (!storyId) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 스토리 ID입니다.'
      }, { status: 400 })
    }

    if (!status || !['draft', 'completed', 'archived'].includes(status)) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 상태값입니다. (draft, completed, archived)'
      }, { status: 400 })
    }

    // 스토리 상태 업데이트 (본인 스토리만)
    const { error } = await supabase
      .from('stories')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', storyId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Story status update error:', error)
      return NextResponse.json({
        success: false,
        error: '스토리 상태 업데이트에 실패했습니다.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('Story status update error:', error)
    
    return NextResponse.json({
      success: false,
      error: '스토리 상태 업데이트 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}