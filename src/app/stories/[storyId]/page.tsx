/**
 * Story Reader Page
 * Route: /stories/[storyId]
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/supabase/server'
import { StoryReader } from './StoryReader'

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
  
  // 서버에서 사용자 인증 확인
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    notFound()
  }
  
  // 스토리 존재 여부 확인
  const { data: story } = await supabase
    .from('stories')
    .select('id, user_id')
    .eq('id', storyId)
    .eq('user_id', user.id)
    .single()
  
  if (!story) {
    notFound()
  }
  
  return <StoryReader storyId={storyId} />
}