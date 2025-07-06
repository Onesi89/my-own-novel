/**
 * Story Generation API Endpoint
 * Route: POST /api/stories/generate
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/supabase/server'
import { getAIProvider } from '@/shared/lib/ai'
import { 
  validateStoryPreferences, 
  validateRoutes,
  compressRouteData,
  calculateTokenCost,
  retryWithBackoff
} from '@/shared/lib/ai'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
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

    // 2. 요청 데이터 파싱 및 검증
    const body = await request.json()
    const { selectedRoutes, preferences, timelineId, aiProvider = 'gemini' } = body

    if (!selectedRoutes || !preferences) {
      return NextResponse.json({
        success: false,
        error: '필수 데이터가 누락되었습니다. (selectedRoutes, preferences)'
      }, { status: 400 })
    }

    // 3. 데이터 유효성 검사
    const routeValidation = validateRoutes(selectedRoutes)
    if (!routeValidation.isValid) {
      return NextResponse.json({
        success: false,
        error: `유효하지 않은 경로 데이터: ${routeValidation.errors.join(', ')}`
      }, { status: 400 })
    }

    const preferencesValidation = validateStoryPreferences(preferences)
    if (!preferencesValidation.isValid) {
      return NextResponse.json({
        success: false,
        error: `유효하지 않은 설정: ${preferencesValidation.errors.join(', ')}`
      }, { status: 400 })
    }

    // 4. 토큰 사용량 체크 (일일 제한)
    const today = new Date().toISOString().split('T')[0]
    const { data: todayUsage } = await supabase
      .from('ai_prompts')
      .select('token_usage')
      .gte('created_at', `${today}T00:00:00Z`)
      .lt('created_at', `${today}T23:59:59Z`)

    const dailyTokens = todayUsage?.reduce((sum, record) => sum + Number(record.token_usage), 0) || 0
    if (dailyTokens > 50000) { // 일일 5만 토큰 제한
      return NextResponse.json({
        success: false,
        error: '일일 소설 생성 한도를 초과했습니다. 내일 다시 시도해주세요.'
      }, { status: 429 })
    }

    // 5. 백그라운드 작업 생성
    const { data: jobData, error: jobError } = await supabase
      .from('generation_jobs')
      .insert({
        user_id: user.id,
        job_type: 'story_generation',
        status: 'pending',
        parameters: {
          routes: compressRouteData(selectedRoutes),
          preferences,
          requestTime: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (jobError) {
      console.error('Job creation error:', jobError)
      return NextResponse.json({
        success: false,
        error: '작업 생성에 실패했습니다.'
      }, { status: 500 })
    }

    // 6. 즉시 소설 생성 시도 (10초 제한)
    try {
      const aiProviderInstance = getAIProvider(aiProvider)
      
      // 6.1 백그라운드 작업 상태 업데이트
      await supabase
        .from('generation_jobs')
        .update({ 
          status: 'processing',
          started_at: new Date().toISOString()
        })
        .eq('id', jobData.id)

      // 6.2 AI 소설 생성 (재시도 로직 포함)
      const aiResponse = await retryWithBackoff(async () => {
        return await aiProviderInstance.generateStory({
          routes: selectedRoutes,
          preferences
        })
      }, 2, 1000)

      if (!aiResponse.success) {
        throw new Error(aiResponse.error || 'AI 소설 생성에 실패했습니다.')
      }
      
      console.log('AI Response success:', aiResponse.success)
      console.log('AI Response data:', aiResponse.data ? 'exists' : 'null')
      console.log('AI Response content length:', aiResponse.data?.content?.length || 0)
      console.log('AI Response content preview:', aiResponse.data?.content?.substring(0, 200) || 'No content')

      // 7. 생성된 소설 Supabase Storage에 저장
      const storyContent = aiResponse.data?.content || ''
      const storyTitle = storyContent.split('\n')[0].replace('#', '').trim() || '제목 없는 소설'
      
      // 파일명 생성 (안전한 파일명으로 변환)
      const safeFileName = storyTitle.replace(/[^a-zA-Z0-9가-힣\s]/g, '').trim().replace(/\s+/g, '_')
      const timestamp = Date.now()
      const fileName = `${safeFileName}_${timestamp}.md`
      const storagePath = `${user.id}/${fileName}`
      
      // Supabase Storage에 파일 업로드
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('my-own-novel')
        .upload(storagePath, storyContent, {
          contentType: 'text/markdown',
          upsert: false
        })
      
      if (uploadError) {
        console.error('Story file upload error:', uploadError)
        throw new Error(`파일 업로드에 실패했습니다: ${uploadError.message}`)
      }
      
      console.log('Story file uploaded to Supabase Storage:', {
        path: uploadData.path,
        size: storyContent.length,
        title: storyTitle
      })
      
      // 7.1 생성된 소설 DB 저장
      const storyInsertData: any = {
        user_id: user.id,
        title: storyTitle,
        genre: preferences.genre,
        file_path: storagePath,
        status: 'completed',
        metadata: {
          wordCount: aiResponse.data?.content.length || 0,
          estimatedReadTime: Math.ceil((aiResponse.data?.content.length || 0) / 350),
          genre: preferences.genre,
          style: preferences.style,
          tone: preferences.tone,
          locations: selectedRoutes,
          aiModel: aiProvider === 'claude' ? 'claude-3-5-sonnet' : 'gemini-1.5-flash-latest',
          generationTime: Date.now() - startTime
        },
        ai_choices: aiResponse.data?.choices || []
      }

      // timeline_id 처리 - 인터랙티브 스토리의 경우 임시 timeline 생성
      let finalTimelineId = timelineId
      
      if (!timelineId) {
        // 인터랙티브 스토리용 임시 timeline 생성
        const { data: tempTimeline, error: timelineError } = await supabase
          .from('timelines')
          .insert({
            user_id: user.id,
            timeline_date: new Date().toISOString().split('T')[0],
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date().toISOString().split('T')[0],
            raw_data: { 
              locations: selectedRoutes,
              source: 'interactive_story',
              type: 'interactive'
            },
            processed_locations: selectedRoutes,
            location_count: selectedRoutes.length,
            source: 'manual_input', // 유효한 source 값 사용
            metadata: {
              type: 'interactive',
              isInteractiveStory: true,
              routeCount: selectedRoutes.length,
              createdAt: new Date().toISOString(),
              title: `인터랙티브 스토리 - ${new Date().toLocaleDateString('ko-KR')}`
            },
            data_quality: {
              total_points: selectedRoutes.length,
              date_range_days: 1,
              is_simulation: false,
              is_interactive: true
            }
          })
          .select()
          .single()
          
        if (timelineError) {
          console.error('Timeline creation error:', timelineError)
          console.error('Timeline creation details:', {
            user_id: user.id,
            timeline_date: new Date().toISOString().split('T')[0],
            source: 'manual_input',
            location_count: selectedRoutes.length
          })
          throw new Error(`임시 타임라인 생성에 실패했습니다: ${timelineError.message || '알 수 없는 오류'}`)
        }
        
        finalTimelineId = tempTimeline.id
      }
      
      storyInsertData.timeline_id = finalTimelineId

      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .insert(storyInsertData)
        .select()
        .single()

      if (storyError) {
        console.error('Story save error:', storyError)
        throw new Error('소설 저장에 실패했습니다.')
      }

      // 8. AI 프롬프트 로그 저장
      if (aiResponse.tokenUsage) {
        const tokenCost = calculateTokenCost(aiResponse.tokenUsage, aiProvider)
        
        await supabase
          .from('ai_prompts')
          .insert({
            story_id: storyData.id,
            prompt_type: 'story',
            prompt_text: `Genre: ${preferences.genre}, Routes: ${selectedRoutes.length}`,
            response_data: {
              content: aiResponse.data?.content.substring(0, 1000), // 일부만 저장
              choices: aiResponse.data?.choices
            },
            token_usage: aiResponse.tokenUsage.total
          })
      }

      // 9. 백그라운드 작업 완료 처리
      await supabase
        .from('generation_jobs')
        .update({
          status: 'completed',
          result: { storyId: storyData.id },
          completed_at: new Date().toISOString()
        })
        .eq('id', jobData.id)

      console.log(`✅ 소설 생성 완료: ${storyData.id} (${Date.now() - startTime}ms)`)

      return NextResponse.json({
        success: true,
        data: {
          storyId: storyData.id,
          jobId: jobData.id,
          estimatedDuration: 0, // 즉시 완료
          story: {
            id: storyData.id,
            title: storyData.title,
            content: storyContent,
            file_path: storyData.file_path,
            metadata: storyData.metadata,
            choices: storyData.ai_choices
          }
        }
      })

    } catch (aiError) {
      // AI 생성 실패 시 백그라운드 작업으로 전환
      console.error('Immediate generation failed, falling back to background:', aiError)
      
      await supabase
        .from('generation_jobs')
        .update({
          status: 'failed',
          error_log: {
            error: aiError instanceof Error ? aiError.message : String(aiError),
            timestamp: new Date().toISOString()
          },
          completed_at: new Date().toISOString()
        })
        .eq('id', jobData.id)

      return NextResponse.json({
        success: false,
        error: '소설 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Story generation API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}