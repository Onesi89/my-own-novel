/**
 * 소설 설정 모달 컴포넌트
 * FSD: features/story
 */

'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Button,
  Card,
  CardContent,
  Badge
} from '@/shared/ui'
import { StorySettings, StoryGenre, StoryStyle } from '@/shared/lib/story/types'
import { getGenreAnimation } from '@/shared/lib/story/animations'
import { Sparkles, User, Users, BookOpen, Wand2 } from 'lucide-react'

interface StorySettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (settings: StorySettings) => void
  routesCount: number
}

const GENRES: Array<{ key: StoryGenre; label: string; description: string; emoji: string }> = [
  { key: 'SF', label: 'SF', description: '미래와 과학기술이 어우러진 이야기', emoji: '🚀' },
  { key: 'romance', label: '로맨스', description: '설렘과 사랑이 가득한 이야기', emoji: '💕' },
  { key: 'comedy', label: '코미디', description: '유쾌하고 재미있는 이야기', emoji: '😄' },
  { key: 'mystery', label: '미스터리', description: '수수께끼와 추리가 있는 이야기', emoji: '🔍' },
  { key: 'drama', label: '드라마', description: '깊이 있고 감동적인 이야기', emoji: '🎭' },
  { key: 'adventure', label: '모험', description: '스릴 넘치는 모험 이야기', emoji: '⛰️' }
]

const STYLES: Array<{ key: StoryStyle; label: string; description: string; icon: any }> = [
  { 
    key: 'first_person', 
    label: '1인칭 시점', 
    description: '주인공의 시선으로 이야기를 경험해보세요', 
    icon: User 
  },
  { 
    key: 'third_person', 
    label: '3인칭 시점', 
    description: '객관적인 시선으로 이야기를 관찰해보세요', 
    icon: Users 
  }
]

export function StorySettingsModal({ isOpen, onClose, onConfirm, routesCount }: StorySettingsModalProps) {
  const [selectedGenre, setSelectedGenre] = useState<StoryGenre>('adventure')
  const [selectedStyle, setSelectedStyle] = useState<StoryStyle>('first_person')

  const handleConfirm = () => {
    onConfirm({
      genre: selectedGenre,
      style: selectedStyle
    })
    onClose()
  }

  const selectedGenreConfig = getGenreAnimation(selectedGenre)

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-[90vh] overflow-y-auto"
        style={{
          background: `linear-gradient(135deg, ${selectedGenreConfig.primaryColor}10, ${selectedGenreConfig.secondaryColor}10)`
        }}
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-purple-900">
            <Wand2 className="w-5 h-5" />
            소설 설정
          </SheetTitle>
          <SheetDescription className="text-purple-700">
            {routesCount}개의 장소를 바탕으로 인터랙티브 소설을 만들어보세요
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-8">
          {/* 장르 선택 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              장르 선택
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {GENRES.map((genre) => {
                const isSelected = selectedGenre === genre.key
                const config = getGenreAnimation(genre.key)
                
                return (
                  <motion.div
                    key={genre.key}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'ring-2 ring-purple-500 shadow-lg' 
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedGenre(genre.key)}
                      style={{
                        background: isSelected 
                          ? `linear-gradient(135deg, ${config.primaryColor}20, ${config.secondaryColor}20)`
                          : undefined
                      }}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl mb-2">{genre.emoji}</div>
                        <div className="font-medium text-gray-900 mb-1">{genre.label}</div>
                        <div className="text-xs text-gray-600 leading-relaxed">
                          {genre.description}
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-2"
                          >
                            <Badge 
                              variant="secondary" 
                              className="bg-purple-100 text-purple-800"
                            >
                              선택됨
                            </Badge>
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* 스타일 선택 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              서술 스타일
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STYLES.map((style) => {
                const isSelected = selectedStyle === style.key
                const Icon = style.icon
                
                return (
                  <motion.div
                    key={style.key}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'ring-2 ring-purple-500 shadow-lg bg-purple-50' 
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedStyle(style.key)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-full ${
                            isSelected ? 'bg-purple-100' : 'bg-gray-100'
                          }`}>
                            <Icon className={`w-6 h-6 ${
                              isSelected ? 'text-purple-600' : 'text-gray-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 mb-2">
                              {style.label}
                            </div>
                            <div className="text-sm text-gray-600 leading-relaxed">
                              {style.description}
                            </div>
                            {isSelected && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mt-3"
                              >
                                <Badge 
                                  variant="secondary" 
                                  className="bg-purple-100 text-purple-800"
                                >
                                  선택됨
                                </Badge>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* 설정 요약 및 시작 버튼 */}
          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
            <CardContent className="p-6">
              <h4 className="font-semibold text-purple-900 mb-4">설정 요약</h4>
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">장소 수:</span>
                  <Badge variant="outline" className="border-purple-200 text-purple-700">
                    {routesCount}개
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">장르:</span>
                  <Badge 
                    variant="secondary" 
                    className="bg-purple-100 text-purple-800"
                  >
                    {GENRES.find(g => g.key === selectedGenre)?.label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">서술 스타일:</span>
                  <Badge 
                    variant="secondary" 
                    className="bg-purple-100 text-purple-800"
                  >
                    {STYLES.find(s => s.key === selectedStyle)?.label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">예상 소요 시간:</span>
                  <Badge variant="outline" className="border-purple-200 text-purple-700">
                    {routesCount * 2}-{routesCount * 3}분
                  </Badge>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  취소
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  인터랙티브 소설 시작
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  )
}