/**
 * POST /api/stories/create
 * stories 테이블에 새 스토리 레코드를 생성하고 ID를 반환
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 요청 본문 파싱
    const body = await request.json()
    const { 
      title, 
      genre, 
      selectedRoutes, 
      settings,
      timelineId 
    } = body

    // 필수 필드 검증
    if (!title || !genre || !selectedRoutes || !settings) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 기본 타임라인 ID 생성 (임시)
    const defaultTimelineId = timelineId || crypto.randomUUID()

    // stories 테이블에 새 레코드 삽입
    const { data: storyData, error: insertError } = await supabase
      .from('stories')
      .insert({
        user_id: user.id,
        timeline_id: defaultTimelineId,
        title,
        genre,
        file_path: '/temp/placeholder.md', // 임시 파일 경로
        file_type: 'md',
        status: 'draft',
        metadata: {
          settings,
          selectedRoutes,
          created_from: 'interactive_story'
        },
        ai_choices: []
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Story insertion error:', insertError)
      return NextResponse.json(
        { error: '스토리 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 성공적으로 생성된 스토리 ID 반환
    return NextResponse.json({
      success: true,
      storyId: storyData.id,
      message: '스토리가 성공적으로 생성되었습니다.'
    })

  } catch (error) {
    console.error('Story creation error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}