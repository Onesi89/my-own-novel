/**
 * My Stories API Endpoint
 * Route: GET /api/stories/my-stories
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // 1. 사용자 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: '인증이 필요합니다. 로그인 후 다시 시도해주세요.'
      }, { status: 401 })
    }

    // 2. 사용자의 소설 목록 가져오기
    const { data: stories, error: storiesError } = await supabase
      .from('stories')
      .select(`
        id,
        title,
        genre,
        status,
        file_path,
        file_type,
        metadata,
        created_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (storiesError) {
      console.error('Stories fetch error:', storiesError)
      return NextResponse.json({
        success: false,
        error: '소설 목록을 가져오는데 실패했습니다.'
      }, { status: 500 })
    }

    // 3. 응답 반환
    return NextResponse.json({
      success: true,
      stories: stories || []
    })

  } catch (error) {
    console.error('My stories API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}