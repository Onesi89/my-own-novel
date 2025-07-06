/**
 * 장소별 선택지 화면 컴포넌트
 * FSD: features/story
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Card, 
  CardContent, 
  Button,
  Badge
} from '@/shared/ui'
import { StoryQuestion, StoryChoice, StorySettings } from '@/shared/lib/story/types'
import { getGenreAnimation } from '@/shared/lib/story/animations'
import { 
  MapPin, 
  Clock, 
  ChevronRight, 
  Sparkles,
  MessageCircle 
} from 'lucide-react'

interface StoryChoiceScreenProps {
  question: StoryQuestion
  settings: StorySettings
  currentLocationIndex: number
  totalLocations: number
  locationName: string
  isLoading?: boolean
  onChoiceSelect: (choiceId: string) => void
  onSkip?: () => void
}

// 장르별 배경 패턴 컴포넌트들
const BackgroundPatterns = {
  particles: ({ color }: { color: string }) => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full opacity-20"
          style={{ backgroundColor: color }}
          initial={{ 
            x: Math.random() * window.innerWidth, 
            y: Math.random() * window.innerHeight,
            scale: 0 
          }}
          animate={{ 
            scale: [0, 1, 0],
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight
          }}
          transition={{ 
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            delay: Math.random() * 2
          }}
        />
      ))}
    </div>
  ),
  
  waves: ({ color }: { color: string }) => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border-2 opacity-10"
          style={{ borderColor: color }}
          initial={{ scale: 0 }}
          animate={{ scale: [0, 2, 0] }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            delay: i * 1.3
          }}
        />
      ))}
    </div>
  ),
  
  geometric: ({ color }: { color: string }) => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-16 h-16 border opacity-5"
          style={{ 
            borderColor: color,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`
          }}
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  ),
  
  organic: ({ color }: { color: string }) => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full opacity-5"
          style={{ 
            backgroundColor: color,
            width: Math.random() * 200 + 100,
            height: Math.random() * 200 + 100,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`
          }}
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, Math.random() * 50 - 25, 0],
            y: [0, Math.random() * 50 - 25, 0]
          }}
          transition={{ 
            duration: Math.random() * 5 + 5,
            repeat: Infinity
          }}
        />
      ))}
    </div>
  ),
  
  minimal: ({ color }: { color: string }) => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute inset-0 opacity-5"
        style={{ 
          background: `linear-gradient(45deg, transparent 49%, ${color} 49%, ${color} 51%, transparent 51%)`
        }}
        animate={{ backgroundPosition: ['0 0', '20px 20px'] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
    </div>
  )
}

export function StoryChoiceScreen({
  question,
  settings,
  currentLocationIndex,
  totalLocations,
  locationName,
  isLoading = false,
  onChoiceSelect,
  onSkip
}: StoryChoiceScreenProps) {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  
  const genreConfig = getGenreAnimation(settings.genre)
  const progress = ((currentLocationIndex + 1) / totalLocations) * 100
  
  const BackgroundPattern = BackgroundPatterns[genreConfig.backgroundPattern]

  const handleChoiceClick = async (choiceId: string) => {
    if (isAnimating || isLoading) return
    
    setSelectedChoiceId(choiceId)
    setIsAnimating(true)
    
    // 애니메이션 후 선택 처리
    setTimeout(() => {
      onChoiceSelect(choiceId)
      setIsAnimating(false)
      setSelectedChoiceId(null)
    }, genreConfig.duration * 1000)
  }

  return (
    <motion.div 
      className="min-h-screen relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${genreConfig.primaryColor}15, ${genreConfig.secondaryColor}15)`
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <BackgroundPattern color={genreConfig.primaryColor} />
      
      {/* 헤더 */}
      <div className="relative z-10 p-4 pb-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <Badge 
              variant="outline" 
              className="border-purple-200 text-purple-700"
            >
              {currentLocationIndex + 1} / {totalLocations}
            </Badge>
            <Badge 
              variant="secondary" 
              className="bg-purple-100 text-purple-800"
            >
              {settings.genre}
            </Badge>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${genreConfig.primaryColor}, ${genreConfig.secondaryColor})`
              }}
            />
          </div>
          
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 mb-2"
          >
            <MapPin className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-bold text-purple-900">{locationName}</h2>
          </motion.div>
        </div>
      </div>

      {/* 질문 섹션 */}
      <div className="relative z-10 px-4 pb-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="mb-8 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div 
                    className="p-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: `${genreConfig.primaryColor}20` }}
                  >
                    <MessageCircle 
                      className="w-6 h-6"
                      style={{ color: genreConfig.primaryColor }}
                    />
                  </div>
                  <div className="flex-1">
                    <motion.p 
                      className="text-lg leading-relaxed text-gray-800"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.8 }}
                    >
                      {question.question}
                    </motion.p>
                    {question.context && (
                      <motion.p 
                        className="text-sm text-gray-600 mt-3 italic"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                      >
                        {question.context}
                      </motion.p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 선택지 */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {question.choices.map((choice, index) => {
                const isSelected = selectedChoiceId === choice.id
                
                return (
                  <motion.div
                    key={choice.id}
                    initial={{ 
                      x: genreConfig.transitionType === 'slide' ? -50 : 0,
                      y: genreConfig.transitionType === 'slide' ? 0 : 20,
                      opacity: 0,
                      scale: genreConfig.transitionType === 'scale' ? 0.8 : 1,
                      rotate: genreConfig.transitionType === 'rotate' ? -10 : 0
                    }}
                    animate={{ 
                      x: 0, 
                      y: 0, 
                      opacity: 1, 
                      scale: 1, 
                      rotate: 0 
                    }}
                    exit={{
                      x: genreConfig.transitionType === 'slide' ? 50 : 0,
                      y: genreConfig.transitionType === 'slide' ? 0 : -20,
                      opacity: 0,
                      scale: genreConfig.transitionType === 'scale' ? 1.2 : 1,
                      rotate: genreConfig.transitionType === 'rotate' ? 10 : 0
                    }}
                    transition={{ 
                      delay: 0.8 + index * 0.1,
                      duration: genreConfig.duration,
                      type: genreConfig.transitionType === 'bounce' ? 'spring' : 'tween',
                      bounce: genreConfig.transitionType === 'bounce' ? 0.4 : 0
                    }}
                    whileHover={{ 
                      scale: 1.02, 
                      y: -2,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'ring-2 shadow-xl' 
                          : 'hover:shadow-lg'
                      } ${isLoading || isAnimating ? 'pointer-events-none' : ''}`}
                      style={{
                        borderColor: isSelected ? genreConfig.primaryColor : undefined,
                        background: isSelected 
                          ? `linear-gradient(135deg, ${genreConfig.primaryColor}10, ${genreConfig.secondaryColor}10)`
                          : undefined
                      }}
                      onClick={() => handleChoiceClick(choice.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 mb-1">
                              {choice.text}
                            </div>
                            {choice.description && (
                              <div className="text-sm text-gray-600">
                                {choice.description}
                              </div>
                            )}
                          </div>
                          <ChevronRight 
                            className={`w-5 h-5 transition-colors ${
                              isSelected ? 'text-purple-600' : 'text-gray-400'
                            }`}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* 스킵 버튼 (옵션) */}
          {onSkip && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-8 text-center"
            >
              <Button
                variant="ghost"
                onClick={onSkip}
                disabled={isLoading || isAnimating}
                className="text-gray-500 hover:text-gray-700"
              >
                <Clock className="w-4 h-4 mr-2" />
                이 장소 건너뛰기
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* 로딩 오버레이 */}
      <AnimatePresence>
        {(isLoading || isAnimating) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm z-20 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-lg p-6 shadow-xl"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles 
                    className="w-6 h-6"
                    style={{ color: genreConfig.primaryColor }}
                  />
                </motion.div>
                <span className="text-gray-700">
                  {isAnimating ? '선택 처리 중...' : '다음 질문 생성 중...'}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}