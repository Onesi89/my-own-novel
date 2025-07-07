/**
 * Story Reader Page
 * Route: /stories/[storyId]
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/supabase/server'
import { StoryReaderOriginal } from '@/app/stories/[storyId]/StoryReaderOriginal'

interface PageProps {
  params: Promise<{ storyId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { storyId } = await params
  
  try {
    const supabase = await createClient()
    const { data: story } = await supabase
      .from('stories')
      .select('title')
      .eq('id', storyId)
      .single()
    
    return {
      title: story?.title || '소설 읽기',
      description: `${story?.title || '소설'}을 읽어보세요`
    }
  } catch {
    return {
      title: '소설 읽기',
      description: '소설을 읽어보세요'
    }
  }
}

export default async function StoryPage({ params }: PageProps) {
  const { storyId } = await params
  
  // 스토리 존재 여부 확인 (인증은 layout에서 이미 처리됨)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    notFound() // 이론적으로 layout에서 이미 막혔어야 하지만 안전장치
  }
  const { data: story } = await supabase
    .from('stories')
    .select('id, user_id')
    .eq('id', storyId)
    .eq('user_id', user.id)
    .single()
  
  if (!story) {
    notFound()
  }
  
  return <StoryReaderOriginal storyId={storyId} />
}