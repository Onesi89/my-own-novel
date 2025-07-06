/**
 * Auto Route Detector API
 * FSD: features/timeline/api
 * 
 * 구글 타임라인 데이터에서 자동으로 의미있는 경로를 탐지하는 API
 */

import type { TimelineLocation } from '../types'

interface DetectedRoute {
  id: string
  locations: TimelineLocation[]
  category: 'commute' | 'leisure' | 'business' | 'travel' | 'routine' | 'special'
  confidence: number
  storyPotential: number
  description: string
}

interface RoutePattern {
  type: 'daily' | 'weekly' | 'occasional'
  frequency: number
  locations: string[]
  timePattern: {
    startHour: number
    endHour: number
    days: number[]
  }
}

interface StoryHotspot {
  location: TimelineLocation
  score: number
  reasons: string[]
  suggestedEvents: string[]
}

export class AutoRouteDetector {
  private readonly MIN_DURATION = 15 // 최소 15분 체류
  private readonly MIN_DISTANCE = 0.1 // 최소 100m 이동
  private readonly STORY_KEYWORDS = [
    '카페', '레스토랑', '공원', '박물관', '영화관', '쇼핑몰',
    '병원', '학교', '도서관', '체육관', '미용실', '은행'
  ]

  /**
   * 타임라인 데이터에서 의미있는 경로들을 자동 탐지
   */
  async detectSignificantRoutes(
    timelineData: TimelineLocation[],
    options: {
      maxRoutes?: number
      includeRoutine?: boolean
      storyFocused?: boolean
    } = {}
  ): Promise<DetectedRoute[]> {
    const {
      maxRoutes = 10,
      includeRoutine = true,
      storyFocused = true
    } = options

    try {
      // 1. 데이터 전처리
      const cleanedData = this.preprocessData(timelineData)
      
      // 2. 장소 방문 패턴 분석
      const patterns = this.analyzeVisitPatterns(cleanedData)
      
      // 3. 경로 세그먼트 생성
      const segments = this.createRouteSegments(cleanedData)
      
      // 4. 스토리 잠재력 분석
      const storyScores = storyFocused 
        ? await this.analyzeStoryPotential(segments)
        : new Map()
      
      // 5. 카테고리별 분류
      const categorizedRoutes = this.categorizeRoutes(segments, patterns)
      
      // 6. 우선순위 계산 및 선별
      const rankedRoutes = this.rankRoutes(categorizedRoutes, storyScores, {
        includeRoutine,
        storyFocused
      })
      
      return rankedRoutes.slice(0, maxRoutes)
    } catch (error) {
      console.error('Route detection failed:', error)
      return []
    }
  }

  /**
   * 스토리 생성에 유리한 핫스팟 탐지
   */
  async detectStoryHotspots(timelineData: TimelineLocation[]): Promise<StoryHotspot[]> {
    const hotspots: StoryHotspot[] = []
    
    for (const location of timelineData) {
      const score = this.calculateStoryScore(location, timelineData)
      
      if (score > 0.6) {
        const reasons = this.getStoryReasons(location, timelineData)
        const events = this.suggestStoryEvents(location)
        
        hotspots.push({
          location,
          score,
          reasons,
          suggestedEvents: events
        })
      }
    }
    
    return hotspots.sort((a, b) => b.score - a.score)
  }

  /**
   * 일상 패턴에서 특별한 이벤트 탐지
   */
  detectAnomalies(timelineData: TimelineLocation[]): TimelineLocation[] {
    const patterns = this.analyzeVisitPatterns(timelineData)
    const anomalies: TimelineLocation[] = []
    
    for (const location of timelineData) {
      if (this.isAnomaly(location, patterns)) {
        anomalies.push(location)
      }
    }
    
    return anomalies
  }

  private preprocessData(data: TimelineLocation[]): TimelineLocation[] {
    return data
      .filter(location => {
        // 유효한 좌표와 충분한 체류 시간 필터링
        return location.latitude && location.longitude && 
               (location.duration || 0) >= this.MIN_DURATION
      })
      .map(location => ({
        ...location,
        // 좌표 정규화
        latitude: Math.abs(location.latitude) > 180 ? location.latitude / 1e7 : location.latitude,
        longitude: Math.abs(location.longitude) > 180 ? location.longitude / 1e7 : location.longitude
      }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }

  private analyzeVisitPatterns(data: TimelineLocation[]): Map<string, RoutePattern> {
    const patterns = new Map<string, RoutePattern>()
    const locationGroups = this.groupLocationsByProximity(data)
    
    for (const [key, locations] of locationGroups) {
      const visits = locations.map(l => new Date(l.timestamp))
      const frequency = visits.length
      
      if (frequency >= 3) { // 3회 이상 방문한 장소만 패턴으로 인식
        const pattern = this.calculateTimePattern(visits)
        
        patterns.set(key, {
          type: this.determinePatternType(frequency, visits),
          frequency,
          locations: locations.map(l => l.address || ''),
          timePattern: pattern
        })
      }
    }
    
    return patterns
  }

  private groupLocationsByProximity(data: TimelineLocation[]): Map<string, TimelineLocation[]> {
    const groups = new Map<string, TimelineLocation[]>()
    const PROXIMITY_THRESHOLD = 0.001 // 약 100m
    
    for (const location of data) {
      let foundGroup = false
      
      for (const [key, group] of groups) {
        const representative = group[0]
        const distance = this.calculateDistance(
          location.latitude, location.longitude,
          representative.latitude, representative.longitude
        )
        
        if (distance < PROXIMITY_THRESHOLD) {
          group.push(location)
          foundGroup = true
          break
        }
      }
      
      if (!foundGroup) {
        const key = `${location.latitude.toFixed(4)}_${location.longitude.toFixed(4)}`
        groups.set(key, [location])
      }
    }
    
    return groups
  }

  private createRouteSegments(data: TimelineLocation[]): TimelineLocation[][] {
    const segments: TimelineLocation[][] = []
    let currentSegment: TimelineLocation[] = []
    
    for (let i = 0; i < data.length; i++) {
      const location = data[i]
      const nextLocation = data[i + 1]
      
      currentSegment.push(location)
      
      // 세그먼트 분할 조건
      if (!nextLocation || this.shouldSplitSegment(location, nextLocation)) {
        if (currentSegment.length >= 2) {
          segments.push([...currentSegment])
        }
        currentSegment = []
      }
    }
    
    return segments
  }

  private shouldSplitSegment(current: TimelineLocation, next: TimelineLocation): boolean {
    const timeDiff = new Date(next.timestamp).getTime() - new Date(current.timestamp).getTime()
    const timeThreshold = 4 * 60 * 60 * 1000 // 4시간
    
    const distance = this.calculateDistance(
      current.latitude, current.longitude,
      next.latitude, next.longitude
    )
    const distanceThreshold = 5 // 5km
    
    return timeDiff > timeThreshold || distance > distanceThreshold
  }

  private async analyzeStoryPotential(segments: TimelineLocation[][]): Promise<Map<string, number>> {
    const scores = new Map<string, number>()
    
    for (const segment of segments) {
      for (const location of segment) {
        const score = this.calculateStoryScore(location, segment)
        scores.set(location.id, score)
      }
    }
    
    return scores
  }

  private calculateStoryScore(location: TimelineLocation, context: TimelineLocation[]): number {
    let score = 0
    
    // 1. 체류 시간 점수 (0-0.3)
    const duration = location.duration || 0
    score += Math.min(0.3, duration / (2 * 60)) // 2시간 = 만점
    
    // 2. 장소 유형 점수 (0-0.3)
    const address = location.address?.toLowerCase() || ''
    const hasKeyword = this.STORY_KEYWORDS.some(keyword => 
      address.includes(keyword.toLowerCase())
    )
    if (hasKeyword) score += 0.3
    
    // 3. 시간대 점수 (0-0.2)
    const hour = new Date(location.timestamp).getHours()
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20)) {
      score += 0.1 // 출퇴근 시간
    } else if (hour >= 10 && hour <= 22) {
      score += 0.2 // 활동 시간
    }
    
    // 4. 희귀성 점수 (0-0.2)
    const frequency = context.filter(l => 
      this.calculateDistance(l.latitude, l.longitude, location.latitude, location.longitude) < 0.1
    ).length
    score += Math.max(0, 0.2 - (frequency * 0.05))
    
    return Math.min(1, score)
  }

  private categorizeRoutes(segments: TimelineLocation[][], patterns: Map<string, RoutePattern>): DetectedRoute[] {
    const routes: DetectedRoute[] = []
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      if (segment.length < 2) continue
      
      const category = this.determineRouteCategory(segment, patterns)
      const confidence = this.calculateRouteConfidence(segment, patterns)
      const storyPotential = this.calculateSegmentStoryPotential(segment)
      
      routes.push({
        id: `route_${i}`,
        locations: segment,
        category,
        confidence,
        storyPotential,
        description: this.generateRouteDescription(segment, category)
      })
    }
    
    return routes
  }

  private determineRouteCategory(
    segment: TimelineLocation[], 
    patterns: Map<string, RoutePattern>
  ): DetectedRoute['category'] {
    const start = segment[0]
    const end = segment[segment.length - 1]
    const hour = new Date(start.timestamp).getHours()
    
    // 출퇴근 패턴 감지
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20)) {
      return 'commute'
    }
    
    // 주말 활동
    const dayOfWeek = new Date(start.timestamp).getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 'leisure'
    }
    
    // 비즈니스 시간대
    if (hour >= 9 && hour <= 17) {
      return 'business'
    }
    
    // 특별한 장소 방문
    const hasSpecialLocation = segment.some(location => {
      const address = location.address?.toLowerCase() || ''
      return this.STORY_KEYWORDS.some(keyword => 
        address.includes(keyword.toLowerCase())
      )
    })
    
    if (hasSpecialLocation) return 'special'
    
    return 'routine'
  }

  private calculateRouteConfidence(
    segment: TimelineLocation[], 
    patterns: Map<string, RoutePattern>
  ): number {
    let confidence = 0.5
    
    // 세그먼트 길이
    confidence += Math.min(0.2, segment.length * 0.05)
    
    // 총 체류 시간
    const totalDuration = segment.reduce((sum, l) => sum + (l.duration || 0), 0)
    confidence += Math.min(0.2, totalDuration / (3 * 60)) // 3시간 = 만점
    
    // 패턴 일치도
    const patternMatch = this.findMatchingPattern(segment, patterns)
    if (patternMatch) confidence += 0.1
    
    return Math.min(1, confidence)
  }

  private calculateSegmentStoryPotential(segment: TimelineLocation[]): number {
    return segment.reduce((sum, location) => {
      return sum + this.calculateStoryScore(location, segment)
    }, 0) / segment.length
  }

  private rankRoutes(
    routes: DetectedRoute[],
    storyScores: Map<string, number>,
    options: { includeRoutine: boolean; storyFocused: boolean }
  ): DetectedRoute[] {
    return routes
      .filter(route => {
        if (!options.includeRoutine && route.category === 'routine') {
          return false
        }
        return route.confidence > 0.3
      })
      .sort((a, b) => {
        if (options.storyFocused) {
          return b.storyPotential - a.storyPotential
        }
        return b.confidence - a.confidence
      })
  }

  private generateRouteDescription(segment: TimelineLocation[], category: DetectedRoute['category']): string {
    const start = segment[0]
    const end = segment[segment.length - 1]
    const startTime = new Date(start.timestamp).toLocaleTimeString('ko-KR', { 
      hour: '2-digit', minute: '2-digit' 
    })
    const endTime = new Date(end.timestamp).toLocaleTimeString('ko-KR', { 
      hour: '2-digit', minute: '2-digit' 
    })
    
    const descriptions = {
      commute: `${startTime}에 시작된 이동 경로`,
      leisure: `${startTime}-${endTime} 여가 활동`,
      business: `${startTime}-${endTime} 업무 관련 이동`,
      travel: `${startTime}에 시작된 여행 경로`,
      routine: `${startTime}의 일상 이동`,
      special: `${startTime}의 특별한 방문`
    }
    
    return descriptions[category]
  }

  private getStoryReasons(location: TimelineLocation, context: TimelineLocation[]): string[] {
    const reasons: string[] = []
    
    if ((location.duration || 0) > 60) {
      reasons.push('오랜 시간 머물렀던 장소')
    }
    
    const address = location.address?.toLowerCase() || ''
    if (this.STORY_KEYWORDS.some(keyword => address.includes(keyword.toLowerCase()))) {
      reasons.push('흥미로운 장소 유형')
    }
    
    const hour = new Date(location.timestamp).getHours()
    if (hour < 6 || hour > 23) {
      reasons.push('특별한 시간대')
    }
    
    return reasons
  }

  private suggestStoryEvents(location: TimelineLocation): string[] {
    const events: string[] = []
    const address = location.address?.toLowerCase() || ''
    
    if (address.includes('카페')) {
      events.push('우연한 만남', '중요한 대화', '영감의 순간')
    } else if (address.includes('공원')) {
      events.push('산책 중 발견', '자연과의 교감', '휴식의 시간')
    } else if (address.includes('쇼핑몰')) {
      events.push('특별한 구매', '사람들 관찰', '예상치 못한 발견')
    } else {
      events.push('새로운 경험', '의미있는 순간', '추억 만들기')
    }
    
    return events
  }

  private isAnomaly(location: TimelineLocation, patterns: Map<string, RoutePattern>): boolean {
    // 구현 생략 - 복잡한 패턴 분석 로직
    return false
  }

  private calculateTimePattern(visits: Date[]) {
    const hours = visits.map(v => v.getHours())
    const days = visits.map(v => v.getDay())
    
    return {
      startHour: Math.min(...hours),
      endHour: Math.max(...hours),
      days: [...new Set(days)]
    }
  }

  private determinePatternType(frequency: number, visits: Date[]): RoutePattern['type'] {
    const span = visits[visits.length - 1].getTime() - visits[0].getTime()
    const spanDays = span / (24 * 60 * 60 * 1000)
    
    if (frequency / spanDays > 0.8) return 'daily'
    if (frequency / (spanDays / 7) > 0.5) return 'weekly'
    return 'occasional'
  }

  private findMatchingPattern(segment: TimelineLocation[], patterns: Map<string, RoutePattern>) {
    // 구현 생략 - 패턴 매칭 로직
    return null
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }
}

// 싱글톤 인스턴스 내보내기
export const autoRouteDetector = new AutoRouteDetector()