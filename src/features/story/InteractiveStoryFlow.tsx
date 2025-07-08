/**
 * 인터랙티브 소설 플로우 컴포넌트
 * FSD: features/story
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  StorySettings, 
  StoryQuestion, 
  StoryProgress, 
  InteractiveStorySession 
} from '@/shared/lib/story/types'
import { StoryChoiceScreen } from './StoryChoiceScreen'
import { Button, Card, CardContent } from '@/shared/ui'
import { ArrowLeft, BookOpen, CheckCircle, Sparkles } from 'lucide-react'
import { getAIService } from '@/shared/lib/ai/aiService'

interface InteractiveStoryFlowProps {
  routes: any[] // RouteContext[]
  settings: StorySettings
  onComplete: (session: InteractiveStorySession) => void
  onBack: () => void
}

// 임시 목업 데이터 생성 함수
const generateMockQuestion = (
  locationIndex: number, 
  locationName: string, 
  settings: StorySettings
): StoryQuestion => {
  const questionTemplates = {
    SF: [
      "이 장소에서 미래의 기술 흔적을 발견했습니다. 어떻게 하시겠습니까?",
      "알 수 없는 에너지 신호가 감지됩니다. 어떤 행동을 취하시겠습니까?",
      "시간 왜곡 현상이 일어나고 있습니다. 어떻게 대응하시겠습니까?"
    ],
    romance: [
      "이곳에서 특별한 사람과의 추억이 떠오릅니다. 어떻게 하시겠습니까?",
      "운명적인 만남이 기다리고 있는 것 같습니다. 어떤 선택을 하시겠습니까?",
      "마음을 전할 완벽한 순간이 찾아왔습니다. 어떻게 하시겠습니까?"
    ],
    comedy: [
      "우스꽝스러운 상황에 놓였습니다. 어떻게 대처하시겠습니까?",
      "재미있는 일이 벌어질 것 같습니다. 어떤 행동을 취하시겠습니까?",
      "웃음이 터질 만한 상황입니다. 어떻게 하시겠습니까?"
    ],
    mystery: [
      "수상한 단서를 발견했습니다. 어떻게 조사하시겠습니까?",
      "미스터리한 사건의 실마리가 보입니다. 어떤 방법을 선택하시겠습니까?",
      "의문스러운 일이 일어났습니다. 어떻게 해결하시겠습니까?"
    ],
    drama: [
      "인생의 중요한 갈림길에 서 있습니다. 어떤 결정을 내리시겠습니까?",
      "감동적인 순간이 다가왔습니다. 어떻게 반응하시겠습니까?",
      "깊은 성찰이 필요한 상황입니다. 어떤 선택을 하시겠습니까?"
    ],
    adventure: [
      "모험이 시작될 것 같습니다. 어떤 길을 선택하시겠습니까?",
      "스릴 넘치는 상황에 직면했습니다. 어떻게 행동하시겠습니까?",
      "새로운 도전이 기다리고 있습니다. 어떤 방법을 택하시겠습니까?"
    ]
  }

  const choiceTemplates = {
    SF: [
      { text: "첨단 장비로 분석하기", description: "과학적 접근으로 해결" },
      { text: "직감을 믿고 행동하기", description: "본능적인 판단으로 결정" },
      { text: "동료와 상의하기", description: "팀워크로 문제 해결" },
      { text: "신중하게 관찰하기", description: "충분한 정보 수집 후 판단" }
    ],
    romance: [
      { text: "솔직하게 마음 표현하기", description: "진실한 감정을 전달" },
      { text: "은은하게 힌트 주기", description: "섬세한 접근으로 다가가기" },
      { text: "시간을 두고 기다리기", description: "완벽한 타이밍 기다리기" },
      { text: "행동으로 보여주기", description: "말보다는 실천으로 표현" }
    ],
    comedy: [
      { text: "유머러스하게 대응하기", description: "웃음으로 상황 전환" },
      { text: "진지하게 반응하기", description: "의외의 반전 만들기" },
      { text: "엉뚱한 행동하기", description: "예상치 못한 선택" },
      { text: "주변 반응 살피기", description: "분위기 파악 후 행동" }
    ],
    mystery: [
      { text: "증거를 수집하기", description: "체계적인 조사 진행" },
      { text: "관련자 추궁하기", description: "직접적인 접근 방법" },
      { text: "숨어서 관찰하기", description: "은밀한 정보 수집" },
      { text: "전문가 도움 요청하기", description: "전문적인 분석 의뢰" }
    ],
    drama: [
      { text: "마음에 따라 결정하기", description: "감정적 판단 우선" },
      { text: "현실적으로 판단하기", description: "이성적 분석 기반 결정" },
      { text: "모든 것을 고려하기", description: "신중한 종합 판단" },
      { text: "과감하게 선택하기", description: "용기 있는 결단" }
    ],
    adventure: [
      { text: "도전적인 길 선택하기", description: "위험하지만 흥미진진한 선택" },
      { text: "안전한 길 찾기", description: "확실하고 안정적인 방법" },
      { text: "새로운 방법 시도하기", description: "창의적이고 독특한 접근" },
      { text: "경험에 의존하기", description: "과거 경험을 바탕으로 판단" }
    ]
  }

  const templates = questionTemplates[settings.genre]
  const choices = choiceTemplates[settings.genre]
  
  const questionText = templates[locationIndex % templates.length]
  const selectedChoices = choices
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((choice, index) => ({
      id: `choice_${locationIndex}_${index}`,
      text: choice.text,
      description: choice.description
    }))

  return {
    id: `question_${locationIndex}`,
    locationId: `location_${locationIndex}`,
    question: questionText,
    choices: selectedChoices,
    context: `${locationName}에서의 선택이 이야기의 흐름을 결정합니다.`
  }
}

export function InteractiveStoryFlow({ 
  routes, 
  settings, 
  onComplete, 
  onBack 
}: InteractiveStoryFlowProps) {
  const router = useRouter()
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0)
  const [progress, setProgress] = useState<StoryProgress>({
    currentLocationIndex: 0,
    completedChoices: {},
    generatedSections: {}
  })
  const [currentQuestion, setCurrentQuestion] = useState<StoryQuestion | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [aiService] = useState(() => getAIService())
  const [previousChoices, setPreviousChoices] = useState<Array<{ question: string; choice: string }>>([])

  // 현재 질문 생성
  useEffect(() => {
    if (currentLocationIndex < routes.length && !isCompleted) {
      setIsLoading(true)
      
      const generateQuestion = async () => {
        try {
          const route = routes[currentLocationIndex]
          console.log('🎯 [InteractiveStoryFlow] 질문 생성 시도:', {
            currentLocationIndex,
            route: route.address || route.customInfo?.customName,
            settings: settings.genre
          })
          
          // AI 서비스를 통한 질문 생성 시도
          const question = await aiService.generateInteractiveQuestion(
            route,
            settings,
            currentLocationIndex,
            previousChoices
          )
          
          console.log('✅ [InteractiveStoryFlow] AI 질문 생성 성공:', {
            questionId: question.id,
            choicesCount: question.choices.length,
            question: question.question.substring(0, 100) + '...'
          })
          
          setCurrentQuestion(question)
        } catch (error) {
          console.error('❌ [InteractiveStoryFlow] 질문 생성 실패:', error)
          // 실패 시 목업 데이터 사용
          const route = routes[currentLocationIndex]
          const locationName = route.customInfo?.customName || route.address || `장소 ${currentLocationIndex + 1}`
          const question = generateMockQuestion(currentLocationIndex, locationName, settings)
          
          console.log('🔄 [InteractiveStoryFlow] 목업 질문 사용:', {
            questionId: question.id,
            choicesCount: question.choices.length,
            question: question.question.substring(0, 100) + '...'
          })
          
          setCurrentQuestion(question)
        } finally {
          setIsLoading(false)
        }
      }

      generateQuestion()
    }
  }, [currentLocationIndex, routes, settings, isCompleted, aiService, previousChoices])

  const handleChoiceSelect = async (choiceId: string) => {
    if (!currentQuestion) return

    setIsLoading(true)

    // 선택된 선택지 찾기
    const selectedChoice = currentQuestion.choices.find(choice => choice.id === choiceId)
    if (selectedChoice) {
      // 이전 선택들에 추가
      setPreviousChoices(prev => [
        ...prev,
        {
          question: currentQuestion.question,
          choice: selectedChoice.text
        }
      ])
    }

    // 선택 저장
    const newProgress = {
      ...progress,
      completedChoices: {
        ...progress.completedChoices,
        [currentQuestion.id]: choiceId
      }
    }
    setProgress(newProgress)

    // 다음 장소로 이동 또는 완료
    if (currentLocationIndex < routes.length - 1) {
      setCurrentLocationIndex(prev => prev + 1)
    } else {
      // 모든 장소 완료
      setIsCompleted(true)
      setIsLoading(false)
      
      // 세션 데이터 생성
      const session: InteractiveStorySession = {
        id: `session_${Date.now()}`,
        settings,
        routes,
        progress: newProgress,
        status: 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      setTimeout(() => {
        onComplete(session)
      }, 2000)
    }
  }

  const handleSkip = () => {
    if (currentLocationIndex < routes.length - 1) {
      setCurrentLocationIndex(prev => prev + 1)
    } else {
      setIsCompleted(true)
    }
  }

  if (isCompleted) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-md w-full mx-auto"
          >
            <Card className="text-center shadow-xl">
              <CardContent className="p-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", bounce: 0.5 }}
                  className="mb-6"
                >
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <h2 className="text-2xl font-bold text-purple-900 mb-3">
                    인터랙티브 소설 완성!
                  </h2>
                  <p className="text-purple-700 mb-6">
                    모든 선택을 마쳤습니다. 이제 당신만의 특별한 소설이 완성됩니다.
                  </p>
                  
                  <div className="space-y-3 mb-6 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>장소 수:</span>
                      <span className="font-medium">{routes.length}개</span>
                    </div>
                    <div className="flex justify-between">
                      <span>선택 수:</span>
                      <span className="font-medium">{Object.keys(progress.completedChoices).length}개</span>
                    </div>
                    <div className="flex justify-between">
                      <span>장르:</span>
                      <span className="font-medium">{settings.genre}</span>
                    </div>
                  </div>
                  
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="mb-4"
                  >
                    <Sparkles className="w-8 h-8 text-purple-600 mx-auto" />
                  </motion.div>
                  
                  <p className="text-sm text-gray-500">
                    소설 생성 중... 잠시만 기다려주세요.
                  </p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  if (!currentQuestion) {
    console.log('⏳ [InteractiveStoryFlow] currentQuestion이 null입니다:', {
      currentLocationIndex,
      routesLength: routes.length,
      isCompleted,
      isLoading
    })
    
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-8 h-8 text-purple-600" />
        </motion.div>
      </div>
    )
  }

  const route = routes[currentLocationIndex]
  const locationName = route.customInfo?.customName || route.address || `장소 ${currentLocationIndex + 1}`

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* 뒤로가기 버튼 */}
      <div className="absolute top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="bg-white/80 backdrop-blur-sm hover:bg-white/90"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          설정으로 돌아가기
        </Button>
      </div>

      <AnimatePresence mode="wait">
        <StoryChoiceScreen
          key={currentQuestion.id}
          question={currentQuestion}
          settings={settings}
          currentLocationIndex={currentLocationIndex}
          totalLocations={routes.length}
          locationName={locationName}
          isLoading={isLoading}
          onChoiceSelect={handleChoiceSelect}
          onSkip={handleSkip}
        />
      </AnimatePresence>
    </div>
  )
}