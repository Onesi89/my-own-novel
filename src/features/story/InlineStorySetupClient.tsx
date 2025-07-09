/**
 * InlineStorySetupClient - 정적 라우터용 클라이언트 컴포넌트
 * 소설 설정 선택 후 인터랙티브 스토리로 라우팅
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { StorySettings, StoryGenre, StoryStyle } from '@/shared/lib/story/types'
import { getGenreAnimation } from '@/shared/lib/story/animations'
import { Button } from '@/shared/ui'
import { ArrowLeft } from 'lucide-react'
import { useSelectedRoutes, useStoryActions } from '@/shared/lib/store/storyProgressStore'

// 임시로 애니메이션 제거 (성능 테스트용)
const motion = {
  div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}

const AnimatePresence = ({ children, mode, ...props }: { children: React.ReactNode; mode?: string }) => <>{children}</>

// 타이핑 효과 훅
const useTypewriter = (text: string, speed: number = 50) => {
  const [displayText, setDisplayText] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    setDisplayText('')
    setIsComplete(false)
    let i = 0
    
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.slice(0, i + 1))
        i++
      } else {
        setIsComplete(true)
        clearInterval(timer)
      }
    }, speed)

    return () => clearInterval(timer)
  }, [text, speed])

  return { displayText, isComplete }
}

const GENRES: Array<{ key: StoryGenre; label: string; description: string }> = [
  { key: 'SF', label: 'SF', description: '미래와 과학기술이 어우러진 이야기' },
  { key: 'romance', label: '로맨스', description: '설렘과 사랑이 가득한 이야기' },
  { key: 'comedy', label: '코미디', description: '유쾌하고 재미있는 이야기' },
  { key: 'mystery', label: '미스터리', description: '추리와 긴장감이 넘치는 이야기' },
  { key: 'drama', label: '드라마', description: '감동적이고 깊이 있는 이야기' },
  { key: 'adventure', label: '모험', description: '스릴 넘치는 모험과 여행 이야기' },
  { key: 'horror', label: '공포', description: '오싹하고 무서운 이야기' },
  { key: 'fantasy', label: '판타지', description: '마법과 환상의 세계 이야기' }
]

const STYLES: Array<{ key: StoryStyle; label: string; description: string }> = [
  { key: 'first_person', label: '1인칭', description: '주인공의 시점에서 들려주는 이야기' },
  { key: 'third_person', label: '3인칭', description: '관찰자의 시점에서 들려주는 이야기' }
]

export function InlineStorySetupClient() {
  console.log(">>>> InlineStorySetupClient 시작", performance.now())
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<'genre' | 'style' | 'confirm'>('genre')
  const [selectedGenre, setSelectedGenre] = useState<StoryGenre | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<StoryStyle | null>(null)
  const [isCreatingStory, setIsCreatingStory] = useState(false)
  
  // Zustand store hooks
  const selectedRoutes = useSelectedRoutes()
  const { setStoryId, setStorySettings } = useStoryActions()

  const selectedGenreData = GENRES.find(g => g.key === selectedGenre)
  const selectedStyleData = STYLES.find(s => s.key === selectedStyle)

  const { displayText: genreText, isComplete: genreComplete } = useTypewriter(
    selectedGenreData?.description || '', 30
  )
  const { displayText: styleText, isComplete: styleComplete } = useTypewriter(
    selectedStyleData?.description || '', 30
  )

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
      // 에러 처리 - 사용자에게 알림
      alert('스토리 생성 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsCreatingStory(false)
    }
  }

  // 선택된 경로 확인 - 클라이언트 사이드 렌더링으로 즉시 처리
  useEffect(() => {
    console.log(">>>> useEffect selectedRoutes 확인", selectedRoutes?.length, performance.now())
    
    if (!selectedRoutes || selectedRoutes.length === 0) {
      console.log(">>>> 경로가 없어서 redirect", performance.now())
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
      // 경로 선택 페이지로 이동
      router.replace('/create-story')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* 배경 애니메이션 */}
      <motion.div
        className="absolute inset-0 opacity-5"
        animate={selectedGenre ? (getGenreAnimation(selectedGenre) as any) : {}}
        transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
      />

      {/* 뒤로가기 버튼 */}
      <motion.button
        onClick={handleBack}
        className="absolute top-8 left-8 flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ArrowLeft size={20} />
        <span>뒤로가기</span>
      </motion.button>

      {/* 메인 컨텐츠 */}
      <div className="max-w-4xl w-full">
        <AnimatePresence mode="wait">
          {currentStep === 'genre' && (
            <motion.div
              key="genre"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0 }}
              className="text-center"
            >
              <h1 className="text-4xl font-bold text-gray-800 mb-4">
                어떤 장르의 소설을 만들고 싶으세요?
              </h1>
              <p className="text-lg text-gray-600 mb-12">
                장르를 선택하면 그에 맞는 스타일로 소설이 생성됩니다
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {GENRES.map((genre) => (
                  <motion.button
                    key={genre.key}
                    onClick={() => handleGenreSelect(genre.key)}
                    className={`p-6 rounded-xl border-2 transition-all duration-300 relative z-20 ${
                      selectedGenre === genre.key
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="font-semibold text-lg mb-2">{genre.label}</div>
                    <div className="text-sm text-gray-600">{genre.description}</div>
                  </motion.button>
                ))}
              </div>

              {selectedGenre && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <p className="text-lg text-gray-700 mb-4">
                    {genreText}
                  </p>
                  {genreComplete && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <p className="text-sm text-gray-500">자동으로 다음 단계로 넘어갑니다...</p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {currentStep === 'style' && (
            <motion.div
              key="style"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0 }}
              className="text-center"
            >
              <h1 className="text-4xl font-bold text-gray-800 mb-4">
                어떤 시점으로 이야기를 들려드릴까요?
              </h1>
              <p className="text-lg text-gray-600 mb-12">
                선택한 시점에 따라 독자의 몰입도가 달라집니다
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
                {STYLES.map((style) => (
                  <motion.button
                    key={style.key}
                    onClick={() => handleStyleSelect(style.key)}
                    className={`p-8 rounded-xl border-2 transition-all duration-300 relative z-20 ${
                      selectedStyle === style.key
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="font-semibold text-xl mb-3">{style.label}</div>
                    <div className="text-gray-600">{style.description}</div>
                  </motion.button>
                ))}
              </div>

              {selectedStyle && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <p className="text-lg text-gray-700 mb-4">
                    {styleText}
                  </p>
                  {styleComplete && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <p className="text-sm text-gray-500">자동으로 다음 단계로 넘어갑니다...</p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {currentStep === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0 }}
              className="text-center"
            >
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

              <Button
                onClick={handleComplete}
                className="px-8 py-3 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                disabled={!selectedGenre || !selectedStyle || isCreatingStory}
              >
                {isCreatingStory ? '스토리 생성 중...' : '인터랙티브 소설 시작하기'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}