/**
 * Stories List API Endpoint
 * Route: GET /api/stories
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: '인증이 필요합니다. 로그인 후 다시 시도해주세요.'
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')

    // 유효성 검사
    if (page < 1 || limit < 1 || limit > 50) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 페이지 매개변수입니다.'
      }, { status: 400 })
    }

    // 쿼리 구성
    let query = supabase
      .from('stories')
      .select(`
        id,
        title,
        genre,
        status,
        metadata,
        created_at,
        updated_at
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // 상태 필터링
    if (status && ['draft', 'completed', 'archived'].includes(status)) {
      query = query.eq('status', status)
    }

    // 페이지네이션
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: stories, error, count } = await query

    if (error) {
      console.error('Stories list error:', error)
      return NextResponse.json({
        success: false,
        error: '스토리 목록을 불러올 수 없습니다.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        stories: stories || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Stories list error:', error)
    
    return NextResponse.json({
      success: false,
      error: '스토리 목록 조회 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}