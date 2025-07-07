/**
 * Story Choices API Endpoint
 * Route: POST /api/stories/[storyId]/choices
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/supabase/server'
import { getAIProvider } from '@/shared/lib/ai'
import { sanitizeInput, sanitizeJson } from '@/shared/lib/validation/inputValidation'

export async function POST(
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
    const rawBody = await request.json()
    const body = sanitizeJson(rawBody)
    const { choiceId, selectedOption } = body
    
    // storyId 검증
    const sanitizedStoryId = sanitizeInput(storyId, 50)

    if (!storyId || !choiceId || !selectedOption) {
      return NextResponse.json({
        success: false,
        error: '필수 데이터가 누락되었습니다. (choiceId, selectedOption)'
      }, { status: 400 })
    }

    // 스토리 조회 (본인 스토리만)
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', sanitizedStoryId)
      .eq('user_id', user.id)
      .single()

    if (storyError || !story) {
      return NextResponse.json({
        success: false,
        error: '스토리를 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // 선택지 검증
    const choices = story.ai_choices || []
    const choice = choices.find((c: any) => c.id === choiceId)

    if (!choice) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 선택지입니다.'
      }, { status: 400 })
    }

    const option = choice.options?.find((o: any) => o.id === selectedOption)
    if (!option) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 선택 옵션입니다.'
      }, { status: 400 })
    }

    // Supabase Storage에서 현재 스토리 내용 읽기
    let currentContent = ''
    if (story.file_path) {
      try {
        const { data, error: downloadError } = await supabase.storage
          .from('stories')
          .download(story.file_path)
        
        if (downloadError) {
          console.error('Story file download error:', downloadError)
          currentContent = story.content || ''
        } else {
          currentContent = await data.text()
        }
      } catch (fileError) {
        console.error('Story file read error:', fileError)
        currentContent = story.content || ''
      }
    } else {
      currentContent = story.content || ''
    }

    // AI를 사용해 다음 섹션 생성
    const aiProvider = getAIProvider('gemini')
    
    const nextSectionResponse = await aiProvider.generateStorySection({
      storyId,
      currentContent,
      selectedChoice: {
        location: choice.location,
        question: choice.question,
        selectedOption: option.text,
        optionDescription: option.description
      },
      preferences: {
        genre: story.genre,
        style: story.metadata?.style || 'third_person',
        tone: story.metadata?.tone || 'light',
        length: 5000 // 짧은 섹션
      }
    })

    if (!nextSectionResponse.success) {
      return NextResponse.json({
        success: false,
        error: '다음 섹션 생성에 실패했습니다.'
      }, { status: 500 })
    }

    // 선택지 업데이트 (선택됨 표시)
    const updatedChoices = choices.map((c: any) => {
      if (c.id === choiceId) {
        return {
          ...c,
          selectedChoice: selectedOption,
          selectedAt: new Date().toISOString()
        }
      }
      return c
    })

    // 스토리 업데이트
    const { error: updateError } = await supabase
      .from('stories')
      .update({
        ai_choices: updatedChoices,
        updated_at: new Date().toISOString()
      })
      .eq('id', storyId)

    if (updateError) {
      console.error('Story choice update error:', updateError)
      return NextResponse.json({
        success: false,
        error: '선택지 업데이트에 실패했습니다.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        nextSection: nextSectionResponse.data?.content || '',
        choices: nextSectionResponse.data?.choices || []
      }
    })

  } catch (error) {
    console.error('Story choice submission error:', error)
    
    return NextResponse.json({
      success: false,
      error: '선택지 제출 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}