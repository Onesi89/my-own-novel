/**
 * Job Status API Endpoint
 * Route: GET /api/jobs/[jobId]/status
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
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

    const { jobId } = await params

    if (!jobId) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 작업 ID입니다.'
      }, { status: 400 })
    }

    // 작업 상태 조회 (본인 작업만)
    const { data: job, error } = await supabase
      .from('generation_jobs')
      .select(`
        id,
        user_id,
        job_type,
        status,
        parameters,
        result,
        error_log,
        created_at,
        started_at,
        completed_at,
        updated_at
      `)
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()

    if (error || !job) {
      return NextResponse.json({
        success: false,
        error: '작업을 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // 진행률 계산
    let progress = 0
    if (job.status === 'pending') {
      progress = 0
    } else if (job.status === 'processing') {
      // 시작 시간 기반 진행률 계산 (최대 60초 예상)
      if (job.started_at) {
        const startTime = new Date(job.started_at).getTime()
        const now = Date.now()
        const elapsed = now - startTime
        progress = Math.min(80, Math.floor((elapsed / 60000) * 80)) // 최대 80%까지
      } else {
        progress = 10
      }
    } else if (job.status === 'completed') {
      progress = 100
    } else if (job.status === 'failed') {
      progress = 0
    }

    // 예상 완료 시간 계산
    let estimatedCompletion = null
    if (job.status === 'processing' && job.started_at) {
      const startTime = new Date(job.started_at).getTime()
      const now = Date.now()
      const elapsed = now - startTime
      const remaining = Math.max(0, 60000 - elapsed) // 최대 60초
      estimatedCompletion = new Date(now + remaining).toISOString()
    }

    return NextResponse.json({
      success: true,
      data: {
        id: job.id,
        storyId: job.result?.storyId || null,
        userId: job.user_id,
        status: job.status,
        progress,
        result: job.result,
        error: job.error_log?.error || null,
        estimatedCompletion,
        createdAt: job.created_at,
        startedAt: job.started_at,
        completedAt: job.completed_at,
        updatedAt: job.updated_at
      }
    })

  } catch (error) {
    console.error('Job status retrieval error:', error)
    
    return NextResponse.json({
      success: false,
      error: '작업 상태 조회 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}