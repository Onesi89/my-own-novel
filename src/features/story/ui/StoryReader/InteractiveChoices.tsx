/**
 * Interactive Choices Component
 * FSD: features/story/ui/StoryReader
 * 
 * AI 생성 질문과 선택지 처리
 */

'use client'

import React from 'react'
import { Loader2, Check } from 'lucide-react'
import { Button, Card, CardContent } from '@/shared/ui'
import { useStoryReader } from '../../context/StoryReaderContext'

export function InteractiveChoices() {
  const { state, handleChoiceSelect } = useStoryReader()
  const { story, sections, processingChoices } = state

  // AI 선택지가 있는지 확인
  if (!story.ai_choices || story.ai_choices.length === 0) {
    return null
  }

  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">
        이야기를 더 발전시켜보세요
      </h3>
      
      <div className="space-y-6">
        {story.ai_choices.map((choice: any) => {
          const isProcessing = processingChoices.has(choice.id)
          const isAnswered = sections.some(section => section.choiceId === choice.id)
          
          return (
            <Card key={choice.id} className="border border-gray-200">
              <CardContent className="p-6">
                <h4 className="font-medium text-gray-900 mb-4">
                  {choice.question}
                </h4>
                
                <div className="grid gap-3">
                  {choice.options?.map((option: any) => {
                    const isSelected = sections.some(
                      section => section.choiceId === choice.id && section.optionId === option.id
                    )
                    
                    return (
                      <Button
                        key={option.id}
                        variant={isSelected ? "default" : "outline"}
                        className={`justify-start text-left h-auto p-4 ${
                          isSelected ? 'bg-green-50 border-green-200 text-green-800' : ''
                        }`}
                        onClick={() => handleChoiceSelect(choice.id, option.id)}
                        disabled={isProcessing || isAnswered}
                      >
                        <div className="flex items-center gap-3 w-full">
                          {isProcessing && !isSelected && (
                            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                          )}
                          {isSelected && (
                            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                          )}
                          <span className="flex-1">{option.text}</span>
                        </div>
                      </Button>
                    )
                  })}
                </div>
                
                {isAnswered && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">
                      ✓ 이 선택지에 대한 이야기가 추가되었습니다.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {sections.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            💡 총 {sections.length}개의 추가 이야기가 생성되었습니다. 
            상단의 다운로드 버튼을 눌러 전체 이야기를 저장하세요.
          </p>
        </div>
      )}
    </div>
  )
}