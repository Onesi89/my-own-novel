/**
 * 인라인 소설 설정 플로우 컴포넌트
 * FSD: features/story
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StorySettings, StoryGenre, StoryStyle } from '@/shared/lib/story/types'
import { getGenreAnimation } from '@/shared/lib/story/animations'
import { Button } from '@/shared/ui'
import { ArrowLeft } from 'lucide-react'

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

interface InlineStorySetupProps {
  routesCount: number
  onComplete: (settings: StorySettings) => void
  onBack: () => void
}

const GENRES: Array<{ key: StoryGenre; label: string; description: string }> = [
  { key: 'SF', label: 'SF', description: '미래와 과학기술이 어우러진 이야기' },
  { key: 'romance', label: '로맨스', description: '설렘과 사랑이 가득한 이야기' },
  { key: 'comedy', label: '코미디', description: '유쾌하고 재미있는 이야기' },
  { key: 'mystery', label: '미스터리', description: '수수께끼와 추리가 있는 이야기' },
  { key: 'drama', label: '드라마', description: '깊이 있고 감동적인 이야기' },
  { key: 'adventure', label: '모험', description: '스릴 넘치는 모험 이야기' }
]

const STYLES: Array<{ key: StoryStyle; label: string; description: string }> = [
  { 
    key: 'first_person', 
    label: '1인칭 시점', 
    description: '주인공의 시선으로 이야기를 경험합니다' 
  },
  { 
    key: 'third_person', 
    label: '3인칭 시점', 
    description: '객관적인 시선으로 이야기를 관찰합니다' 
  }
]

export function InlineStorySetup({ routesCount, onComplete, onBack }: InlineStorySetupProps) {
  const [step, setStep] = useState<'genre' | 'style' | 'start'>('genre')
  const [selectedGenre, setSelectedGenre] = useState<StoryGenre | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<StoryStyle | null>(null)
  const [showChoices, setShowChoices] = useState(false)
  const [showSubtitle, setShowSubtitle] = useState(false)
  const [selectedCard, setSelectedCard] = useState<string | null>(null)

  // 타이핑 효과
  const genreQuestion = "이 소설의 장르는 무엇입니까?"
  const styleQuestion = "원하시는 서술 스타일은 무엇입니까?"
  const startMessage = "이제 소설이 시작됩니다"
  
  const genreTypewriter = useTypewriter(step === 'genre' ? genreQuestion : '', 80)
  const styleTypewriter = useTypewriter(step === 'style' ? styleQuestion : '', 80)
  const startTypewriter = useTypewriter(step === 'start' ? startMessage : '', 100)

  // 타이핑 완료 후 선택지 표시
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (step === 'genre' && genreTypewriter.isComplete) {
      timer = setTimeout(() => {
        setShowSubtitle(true)
        setTimeout(() => setShowChoices(true), 400)
      }, 800)
    } else if (step === 'style' && styleTypewriter.isComplete) {
      timer = setTimeout(() => {
        setShowSubtitle(true)
        setTimeout(() => setShowChoices(true), 400)
      }, 800)
    }
    return () => clearTimeout(timer)
  }, [step, genreTypewriter.isComplete, styleTypewriter.isComplete])

  const handleGenreSelect = (genre: StoryGenre) => {
    setSelectedGenre(genre)
    setSelectedCard(genre)
    setShowChoices(false)
    
    setTimeout(() => {
      setStep('style')
      setShowSubtitle(false)
      setSelectedCard(null)
      setTimeout(() => {
        setShowSubtitle(true)
        setTimeout(() => setShowChoices(true), 400)
      }, 800)
    }, 1200)
  }

  // 선택된 장르에 따른 색상 가져오기
  const genreColors = selectedGenre ? getGenreAnimation(selectedGenre) : null

  const handleStyleSelect = (style: StoryStyle) => {
    setSelectedStyle(style)
    setSelectedCard(style)
    setShowChoices(false)
    
    setTimeout(() => {
      setStep('start')
      setShowSubtitle(false)
      setSelectedCard(null)
      setTimeout(() => {
        onComplete({
          genre: selectedGenre!,
          style
        })
      }, 2000)
    }, 1200)
  }

  return (
    <motion.div 
      className="min-h-screen relative overflow-hidden"
      style={{
        background: genreColors ? 
          `linear-gradient(135deg, ${genreColors.primaryColor}08, #f8fafc)` :
          'linear-gradient(135deg, #f1f5f9, #f8fafc)'
      }}
      animate={{
        background: genreColors ? 
          `linear-gradient(135deg, ${genreColors.primaryColor}08, #f8fafc)` :
          'linear-gradient(135deg, #f1f5f9, #f8fafc)'
      }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
    >
      {/* 배경 효과 */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(0,0,0,0.02),transparent_70%)]" />
        <motion.div
          className="absolute inset-0"
          style={{
            background: genreColors ? 
              `linear-gradient(45deg, transparent 50%, ${genreColors.primaryColor}05 70%, transparent 90%)` :
              `linear-gradient(45deg, transparent 50%, rgba(0,0,0,0.02) 70%, transparent 90%)`
          }}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%']
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      </div>

      {/* 뒤로가기 버튼 */}
      <div className="absolute top-6 left-6 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 border border-gray-200 bg-white/80 backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          여정 종료
        </Button>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
        <div className="max-w-4xl w-full text-center">
          <AnimatePresence mode="wait">
            {step === 'genre' && (
              <motion.div
                key="genre"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
              >
                <motion.h1 
                  className="text-4xl md:text-6xl font-light mb-8 tracking-wide text-gray-800 min-h-[4rem]"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {genreTypewriter.displayText}
                  {!genreTypewriter.isComplete && (
                    <motion.span
                      className="inline-block"
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      |
                    </motion.span>
                  )}
                </motion.h1>
                
                {/* 선택된 장르 표시 */}
                <AnimatePresence>
                  {selectedGenre && (
                    <motion.div
                      key={`selected-genre-${selectedGenre}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.6 }}
                      className="mb-8"
                    >
                      <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/90 border border-gray-200 rounded-full shadow-sm backdrop-blur-sm">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getGenreAnimation(selectedGenre).primaryColor }}></div>
                        <span className="text-lg font-medium text-gray-800">
                          {GENRES.find(g => g.key === selectedGenre)?.label} 선택됨
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <AnimatePresence>
                  {showSubtitle && (
                    <motion.p 
                      key="genre-subtitle"
                      className="text-lg md:text-xl text-gray-600 mb-16 font-light"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      transition={{ duration: 0.8 }}
                    >
                      {routesCount}개의 장소를 바탕으로 어떤 이야기를 만들어드릴까요?
                    </motion.p>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {showChoices && (
                    <motion.div 
                      key="genre-choices"
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      {GENRES.map((genre, index) => {
                        const isSelected = selectedCard === genre.key
                        const isOtherSelected = selectedCard && selectedCard !== genre.key
                        const genreAnimation = getGenreAnimation(genre.key)
                        
                        return (
                        <motion.button
                          key={`genre-${genre.key}-${index}`}
                          className={`p-8 border rounded-lg transition-all duration-300 text-left group ${
                            isSelected 
                              ? 'border-gray-300 shadow-lg bg-white relative z-10' 
                              : 'bg-white/80 border-gray-200 hover:bg-white hover:border-gray-300 hover:shadow-md'
                          }`}
                          style={{
                            background: isSelected 
                              ? `linear-gradient(135deg, ${genreAnimation.primaryColor}08, #ffffff)` 
                              : undefined
                          }}
                          onClick={() => handleGenreSelect(genre.key)}
                          initial={{ y: 30, opacity: 0 }}
                          animate={{ 
                            y: 0, 
                            opacity: isOtherSelected ? 0 : 1,
                            scale: isOtherSelected ? 0.8 : isSelected ? 1.05 : 1,
                            filter: isOtherSelected ? 'blur(4px)' : 'blur(0px)',
                            x: isSelected ? 'calc(50vw - 50%)' : 0
                          }}
                          exit={{ 
                            opacity: 0, 
                            scale: 0.8,
                            transition: { duration: 0.3 }
                          }}
                          transition={{ 
                            delay: index * 0.1, 
                            duration: 0.6,
                            opacity: { duration: isOtherSelected ? 0.5 : 0.6 },
                            scale: { duration: 0.5 },
                            filter: { duration: 0.5 },
                            x: { duration: 0.8, ease: "easeInOut" }
                          }}
                          whileHover={!selectedCard ? { scale: 1.02, y: -4 } : {}}
                          whileTap={{ scale: 0.98 }}
                        >
                          <h3 className="text-xl font-medium mb-3 text-gray-800 group-hover:text-gray-900">
                            {genre.label}
                          </h3>
                          <p className="text-gray-600 text-sm leading-relaxed group-hover:text-gray-700">
                            {genre.description}
                          </p>
                        </motion.button>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {step === 'style' && (
              <motion.div
                key="style"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
              >
                <motion.h1 
                  className="text-4xl md:text-6xl font-light mb-8 tracking-wide text-gray-800 min-h-[4rem]"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {styleTypewriter.displayText}
                  {!styleTypewriter.isComplete && (
                    <motion.span
                      className="inline-block"
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      |
                    </motion.span>
                  )}
                </motion.h1>
                
                {/* 선택된 장르와 스타일 표시 */}
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                  <AnimatePresence>
                    {selectedGenre && (
                      <motion.div
                        key={`style-selected-genre-${selectedGenre}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 border border-gray-200 rounded-full shadow-sm backdrop-blur-sm">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getGenreAnimation(selectedGenre).primaryColor }}></div>
                          <span className="text-sm font-medium text-gray-700">
                            {GENRES.find(g => g.key === selectedGenre)?.label}
                          </span>
                        </div>
                      </motion.div>
                    )}
                    {selectedStyle && (
                      <motion.div
                        key={`style-selected-style-${selectedStyle}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                      >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 border border-gray-200 rounded-full shadow-sm backdrop-blur-sm">
                          <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                          <span className="text-sm font-medium text-gray-700">
                            {STYLES.find(s => s.key === selectedStyle)?.label}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <AnimatePresence>
                  {showSubtitle && (
                    <motion.p 
                      key="style-subtitle"
                      className="text-lg md:text-xl text-gray-600 mb-16 font-light"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      transition={{ duration: 0.8 }}
                    >
                      어떤 시점에서 이야기를 들려드릴까요?
                    </motion.p>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {showChoices && (
                    <motion.div 
                      key="style-choices"
                      className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      {STYLES.map((style, index) => {
                        const isSelected = selectedCard === style.key
                        const isOtherSelected = selectedCard && selectedCard !== style.key
                        
                        return (
                        <motion.button
                          key={`style-${style.key}-${index}`}
                          className={`p-10 border rounded-lg transition-all duration-300 text-center group relative ${
                            isSelected 
                              ? 'border-gray-300 shadow-lg bg-white z-10' 
                              : 'bg-white/80 border-gray-200 hover:bg-white hover:border-gray-300 hover:shadow-md'
                          }`}
                          style={{
                            background: genreColors 
                              ? `linear-gradient(135deg, ${genreColors.primaryColor}06, #ffffff)` 
                              : undefined
                          }}
                          onClick={() => handleStyleSelect(style.key)}
                          initial={{ y: 30, opacity: 0 }}
                          animate={{ 
                            y: 0, 
                            opacity: isOtherSelected ? 0 : 1,
                            scale: isOtherSelected ? 0.8 : isSelected ? 1.05 : 1,
                            filter: isOtherSelected ? 'blur(4px)' : 'blur(0px)',
                            x: isSelected ? 'calc(50vw - 50%)' : 0
                          }}
                          exit={{ 
                            opacity: 0, 
                            scale: 0.8,
                            transition: { duration: 0.3 }
                          }}
                          transition={{ 
                            delay: index * 0.2, 
                            duration: 0.6,
                            opacity: { duration: isOtherSelected ? 0.5 : 0.6 },
                            scale: { duration: 0.5 },
                            filter: { duration: 0.5 },
                            x: { duration: 0.8, ease: "easeInOut" }
                          }}
                          whileHover={!selectedCard ? { 
                            scale: 1.02, 
                            y: -4
                          } : {}}
                          whileTap={{ scale: 0.98 }}
                        >
                          <h3 className="text-2xl font-medium mb-4 text-gray-800 group-hover:text-gray-900">
                            {style.label}
                          </h3>
                          <p className="text-gray-600 leading-relaxed group-hover:text-gray-700">
                            {style.description}
                          </p>
                        </motion.button>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {step === 'start' && (
              <motion.div
                key="start"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
              >
                <motion.h1 
                  className="text-4xl md:text-6xl font-light mb-8 tracking-wide text-gray-800 min-h-[4rem]"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 1 }}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {startTypewriter.displayText}
                  {!startTypewriter.isComplete && (
                    <motion.span
                      className="inline-block"
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      |
                    </motion.span>
                  )}
                </motion.h1>
                
                {/* 최종 선택사항 요약 */}
                <motion.div 
                  className="flex flex-wrap justify-center gap-4 mb-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                >
                  {selectedGenre && (
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/90 border border-gray-200 rounded-full shadow-md backdrop-blur-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getGenreAnimation(selectedGenre).primaryColor }}></div>
                      <span className="font-medium text-gray-800">
                        {GENRES.find(g => g.key === selectedGenre)?.label}
                      </span>
                    </div>
                  )}
                  {selectedStyle && (
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/90 border border-gray-200 rounded-full shadow-md backdrop-blur-sm">
                      <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                      <span className="font-medium text-gray-800">
                        {STYLES.find(s => s.key === selectedStyle)?.label}
                      </span>
                    </div>
                  )}
                </motion.div>
                
                <motion.div
                  className="flex items-center justify-center mt-16"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1, duration: 0.8 }}
                >
                  <motion.div
                    className="w-2 h-2 bg-gray-400 rounded-full mx-1"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-gray-400 rounded-full mx-1"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-gray-400 rounded-full mx-1"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}