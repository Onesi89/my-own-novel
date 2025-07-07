# AI 프롬프트 최적화 및 비용 절감 로직 구현 계획

## 1. 코드베이스 분석 결과

### 현재 구조 분석
- **AI 제공자**: Claude (고비용), Gemini (저비용 기본), OpenAI (미구현)
- **토큰 관리**: 일일 50,000토큰 제한, 요청당 4,000토큰 제한
- **기존 최적화**: 기본적인 텍스트 압축 및 경로 데이터 압축
- **캐시 시스템**: **없음** (중요한 최적화 기회)
- **비용 계산**: Gemini $0.075/$0.30, Claude $3.00/$15.00 per 1M 토큰

### 주요 발견사항
1. **캐시 시스템 부재**: 동일한 요청에 대한 중복 API 호출
2. **제한적인 프롬프트 최적화**: 기본 텍스트 압축만 존재
3. **선택지 제한 없음**: 현재 AI가 무제한 선택지 생성 가능
4. **지능적 제공자 선택 없음**: 고정된 제공자 사용

## 2. 프롬프트 최적화 및 비용 절감 전략

### 2.1 캐시 시스템 구현
```typescript
// 계층화된 캐시 전략
interface CacheStrategy {
  // 1단계: 인메모리 캐시 (빠른 응답)
  memoryCache: Map<string, CachedResponse>
  
  // 2단계: 데이터베이스 캐시 (영구 보관)
  dbCache: SupabaseCache
  
  // 3단계: 의미론적 유사도 기반 캐시
  semanticCache: EmbeddingBasedCache
}
```

### 2.2 프롬프트 압축 전략
```typescript
interface PromptOptimization {
  // 동적 압축률 조정
  dynamicCompression: (content: string, targetTokens: number) => string
  
  // 핵심 정보 추출
  extractEssentials: (routes: RouteContext[]) => CompressedRoute[]
  
  // 컨텍스트 우선순위
  prioritizeContext: (routes: RouteContext[]) => PrioritizedRoute[]
}
```

### 2.3 선택지 제한 비즈니스 로직
```typescript
interface ChoiceLimit {
  maxChoices: 2 | 3  // PRD 요구사항: 2-3개로 제한
  choiceGeneration: 'structured' | 'guided'
  fallbackMechanism: boolean
}
```

## 3. 구현 모듈 설계

### 3.1 공통 모듈 인터페이스
```typescript
// /src/shared/lib/ai/optimization/
├── cache/
│   ├── index.ts                 // 캐시 팩토리
│   ├── memoryCache.ts          // 인메모리 캐시
│   ├── dbCache.ts              // 데이터베이스 캐시
│   └── semanticCache.ts        // 의미론적 캐시
├── compression/
│   ├── index.ts                // 압축 팩토리
│   ├── dynamicCompression.ts   // 동적 압축
│   ├── contextPriority.ts      // 컨텍스트 우선순위
│   └── tokenEstimator.ts       // 향상된 토큰 계산
├── choices/
│   ├── index.ts                // 선택지 제한 팩토리
│   ├── choiceLimiter.ts        // 선택지 수 제한
│   ├── structuredGeneration.ts // 구조화된 생성
│   └── qualityValidator.ts     // 품질 검증
└── costManager/
    ├── index.ts                // 비용 관리 팩토리
    ├── providerSelector.ts     // 지능적 제공자 선택
    ├── budgetTracker.ts        // 예산 추적
    └── costPredictor.ts        // 비용 예측
```

### 3.2 통합 인터페이스
```typescript
export interface OptimizedAIService {
  generateStory(params: {
    routes: RouteContext[]
    preferences: StoryPreferences
    optimizations?: {
      maxTokens?: number
      useCache?: boolean
      maxChoices?: number
      targetCost?: number
    }
  }): Promise<OptimizedAIResponse>
}

export interface OptimizedAIResponse extends AIResponse {
  optimization: {
    cacheHit: boolean
    tokensSaved: number
    costSaved: number
    compressionRatio: number
    choicesLimited: boolean
  }
}
```

## 4. 구현 단계별 로드맵

### Phase 1: 기반 시스템 구축 (1-2일)
1. **캐시 시스템 구현**
   - 인메모리 캐시 (LRU 방식)
   - 데이터베이스 캐시 테이블 생성
   - 캐시 키 생성 로직

2. **향상된 프롬프트 압축**
   - 동적 압축률 조정
   - 토큰 예측 정확도 향상
   - 컨텍스트 우선순위 로직

### Phase 2: 선택지 제한 로직 (1일)
1. **구조화된 선택지 생성**
   - 프롬프트 템플릿 수정
   - 선택지 수 강제 제한
   - 품질 검증 메커니즘

2. **Fallback 시스템**
   - AI 실패 시 기본 선택지 제공
   - 품질 저하 감지 및 대응

### Phase 3: 지능적 비용 관리 (1일)
1. **제공자 자동 선택**
   - 요청 복잡도 기반 선택
   - 비용 vs 품질 균형
   - 실시간 비용 추적

2. **예산 관리**
   - 사용자별 예산 할당
   - 우선순위 기반 요청 처리
   - 비용 경고 시스템

### Phase 4: 통합 및 테스트 (1일)
1. **모든 최적화 통합**
2. **A/B 테스트 준비**
3. **성능 벤치마크**
4. **문서화 완성**

## 5. 성능 목표

### 5.1 토큰 사용량 감소
- **목표**: 30% 이상 토큰 사용량 감소
- **측정**: 동일 입력 대비 토큰 수 비교
- **방법**: 캐시 히트율 + 압축률 + 선택지 제한

### 5.2 비용 절감
- **목표**: 월간 AI 비용 40% 감소
- **측정**: 캐시 효과 + 제공자 최적화 + 압축 효과
- **예상**: $100 → $60/월

### 5.3 품질 유지
- **목표**: 사용자 만족도 95% 유지
- **측정**: 생성된 소설 품질 평가
- **보장**: 압축 후에도 핵심 정보 보존

## 6. 검증 체크리스트

### 기술적 요구사항
- [ ] 캐시 시스템 구현 및 테스트
- [ ] 프롬프트 압축 30% 달성
- [ ] 선택지 2-3개 제한 적용
- [ ] 지능적 제공자 선택 로직
- [ ] 비용 추적 및 예측 시스템

### 품질 보증
- [ ] 기존 소설 품질 유지 확인
- [ ] 압축 전후 의미 보존 테스트
- [ ] 선택지 제한 후 사용자 경험 유지
- [ ] 에러 처리 및 Fallback 테스트

### 성능 최적화
- [ ] 캐시 히트율 60% 이상
- [ ] API 응답 시간 2초 이내 유지
- [ ] 메모리 사용량 모니터링
- [ ] 데이터베이스 쿼리 최적화

## 7. 위험 요소 및 완화 방안

### 기술적 위험
- **캐시 동기화 문제**: 버전 관리 및 TTL 설정
- **압축 품질 저하**: A/B 테스트로 임계점 찾기
- **메모리 부족**: LRU 캐시 크기 제한

### 비즈니스 위험
- **사용자 만족도 저하**: 점진적 롤아웃
- **비용 증가 가능성**: 예산 모니터링 강화
- **시스템 복잡도 증가**: 단계별 구현 및 테스트

## 8. 성공 지표

### 단기 지표 (1주일)
- 캐시 히트율 40% 이상
- 프롬프트 압축률 20% 이상
- 선택지 제한 100% 적용

### 중기 지표 (1개월)
- 토큰 사용량 30% 감소
- API 비용 40% 절감
- 응답 시간 50% 단축 (캐시 히트 시)

### 장기 지표 (3개월)
- 월간 운영 비용 $60 이하 유지
- 사용자 만족도 95% 이상
- 시스템 안정성 99.9% 이상

이 계획을 바탕으로 점진적이고 안전한 최적화를 진행하여 비용 절감과 성능 향상을 동시에 달성하겠습니다.