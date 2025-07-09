/**
 * Story Setup Client Component
 * 최소한의 클라이언트 상태 관리만 담당
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { StorySettings, StoryGenre, StoryStyle } from '@/shared/lib/story/types'
import { Button } from '@/shared/ui'
import { useSelectedRoutes, useStoryActions } from '@/shared/lib/store/storyProgressStore'

interface StorySetupClientProps {
  genres: Array<{ key: StoryGenre; label: string; description: string }>
  styles: Array<{ key: StoryStyle; label: string; description: string }>
}

export function StorySetupClient({ genres, styles }: StorySetupClientProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<'genre' | 'style' | 'confirm'>('genre')
  const [selectedGenre, setSelectedGenre] = useState<StoryGenre | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<StoryStyle | null>(null)
  const [isCreatingStory, setIsCreatingStory] = useState(false)
  
  // Zustand store hooks
  const selectedRoutes = useSelectedRoutes()
  const { setStoryId, setStorySettings } = useStoryActions()

  const selectedGenreData = genres.find(g => g.key === selectedGenre)
  const selectedStyleData = styles.find(s => s.key === selectedStyle)

  const handleGenreSelect = (genre: StoryGenre) => {
    if (selectedGenre === genre) return
    setSelectedGenre(genre)
    setCurrentStep('style')
  }

  const handleStyleSelect = (style: StoryStyle) => {
    if (selectedStyle === style) return
    setSelectedStyle(style)
    setCurrentStep('confirm')
  }

  const handleComplete = async () => {
    if (!selectedGenre || !selectedStyle || !selectedRoutes) return

    const settings: StorySettings = {
      genre: selectedGenre,
      style: selectedStyle,
      tone: 'balanced',
      length: 5000
    }

    setIsCreatingStory(true)

    try {
      // 데이터베이스에 스토리 생성
      const response = await fetch('/api/stories/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `${selectedGenreData?.label} 소설`,
          genre: selectedGenre,
          selectedRoutes: selectedRoutes,
          settings: settings
        })
      })

      if (!response.ok) {
        throw new Error('스토리 생성 실패')
      }

      const result = await response.json()
      const storyId = result.storyId

      // 설정을 Zustand store에 저장
      setStorySettings(settings)
      setStoryId(storyId)
      
      // 인터랙티브 스토리로 라우팅 (첫 번째 단계)
      router.replace(`/create-story/${storyId}/1`)
    } catch (error) {
      console.error('스토리 생성 오류:', error)
      alert('스토리 생성 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsCreatingStory(false)
    }
  }

  // 선택된 경로 확인 - 클라이언트 사이드 렌더링으로 즉시 처리
  useEffect(() => {
    if (!selectedRoutes || selectedRoutes.length === 0) {
      router.replace('/create-story')
    }
  }, [selectedRoutes, router])

  const handleBack = () => {
    if (currentStep === 'style') {
      setCurrentStep('genre')
      setSelectedStyle(null)
    } else if (currentStep === 'confirm') {
      setCurrentStep('style')
    } else {
      router.replace('/create-story')
    }
  }

  if (currentStep === 'genre') {
    return (
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          어떤 장르의 소설을 만들고 싶으세요?
        </h1>
        <p className="text-lg text-gray-600 mb-12">
          장르를 선택하면 그에 맞는 스타일로 소설이 생성됩니다
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {genres.map((genre) => (
            <button
              key={genre.key}
              onClick={() => handleGenreSelect(genre.key)}
              className={`p-6 rounded-xl border-2 transition-all duration-300 relative z-20 ${
                selectedGenre === genre.key
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="font-semibold text-lg mb-2">{genre.label}</div>
              <div className="text-sm text-gray-600">{genre.description}</div>
            </button>
          ))}
        </div>

        {selectedGenre && (
          <div className="text-center">
            <p className="text-lg text-gray-700 mb-4">
              {selectedGenreData?.description}
            </p>
            <p className="text-sm text-gray-500">자동으로 다음 단계로 넘어갑니다...</p>
          </div>
        )}
      </div>
    )
  }

  if (currentStep === 'style') {
    return (
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          어떤 시점으로 이야기를 들려드릴까요?
        </h1>
        <p className="text-lg text-gray-600 mb-12">
          선택한 시점에 따라 독자의 몰입도가 달라집니다
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
          {styles.map((style) => (
            <button
              key={style.key}
              onClick={() => handleStyleSelect(style.key)}
              className={`p-8 rounded-xl border-2 transition-all duration-300 relative z-20 ${
                selectedStyle === style.key
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="font-semibold text-xl mb-3">{style.label}</div>
              <div className="text-gray-600">{style.description}</div>
            </button>
          ))}
        </div>

        {selectedStyle && (
          <div className="text-center">
            <p className="text-lg text-gray-700 mb-4">
              {selectedStyleData?.description}
            </p>
            <p className="text-sm text-gray-500">자동으로 다음 단계로 넘어갑니다...</p>
          </div>
        )}

        <Button
          onClick={handleBack}
          variant="outline"
          className="mt-4"
        >
          이전으로
        </Button>
      </div>
    )
  }

  if (currentStep === 'confirm') {
    return (
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          설정이 완료되었습니다!
        </h1>
        <p className="text-lg text-gray-600 mb-12">
          이제 인터랙티브 소설을 시작해보세요
        </p>

        <div className="bg-white rounded-xl p-8 shadow-lg max-w-md mx-auto mb-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">장르:</span>
              <span className="font-semibold text-blue-600">
                {selectedGenreData?.label}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">시점:</span>
              <span className="font-semibold text-blue-600">
                {selectedStyleData?.label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Button
            onClick={handleBack}
            variant="outline"
          >
            이전으로
          </Button>
          
          <Button
            onClick={handleComplete}
            className="px-8 py-3 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            disabled={!selectedGenre || !selectedStyle || isCreatingStory}
          >
            {isCreatingStory ? '스토리 생성 중...' : '인터랙티브 소설 시작하기'}
          </Button>
        </div>
      </div>
    )
  }

  return null
}