# 🚀 Vercel 배포 체크리스트

배포 전 필수 확인사항들을 체크하세요.

## ✅ 배포 전 체크리스트

### 📋 코드 준비
- [ ] 최신 코드가 GitHub에 푸시됨
- [ ] 로컬에서 `npm run build` 테스트 완료
- [ ] 모든 TypeScript 에러 해결
- [ ] ESLint 경고 최소화

### 🔑 API 키 준비
- [ ] **Supabase**: URL, Anon Key, Service Role Key
- [ ] **Google OAuth**: Client ID, Client Secret
- [ ] **Google Maps**: API Key (Places API 활성화)
- [ ] **Gemini AI**: API Key
- [ ] **NextAuth**: Secret Key (랜덤 문자열)

### 🌐 외부 서비스 설정
- [ ] **Google Cloud Console**: OAuth 리디렉션 URL 추가
  ```
  https://your-app.vercel.app/api/auth/callback/google
  ```
- [ ] **Supabase**: RLS 정책 확인
- [ ] **Google Maps API**: 도메인 제한 설정

## 🎯 Vercel 배포 단계

### 1단계: 프로젝트 생성
```bash
1. Vercel 대시보드 접속
2. "New Project" 클릭
3. GitHub 저장소 선택
4. "Import" 클릭
```

### 2단계: 환경변수 설정
다음 환경변수들을 **모두** 설정하세요:

#### 필수 환경변수
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
NEXT_PUBLIC_GOOGLE_MAP_KEY=AIzaSy...
GEMINI_API_KEY=AIzaSy...
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=복잡한-랜덤-문자열
STORIES_BASE_PATH=./stories
```

#### 선택 환경변수
```env
ANTHROPIC_API_KEY=sk-ant-... (백업용)
```

### 3단계: 배포 설정
- **Framework**: Next.js (자동 감지)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 4단계: 첫 배포
```bash
1. "Deploy" 클릭
2. 빌드 로그 확인
3. 배포 완료 대기 (약 2-3분)
```

## 🔍 배포 후 테스트

### 기본 기능 테스트
- [ ] 홈페이지 정상 로딩
- [ ] Google 로그인 기능
- [ ] 대시보드 접근
- [ ] 소설 생성 플로우
- [ ] 소설 뷰어 페이지
- [ ] 모바일 반응형 확인

### 성능 확인
- [ ] Lighthouse 점수 확인
- [ ] 페이지 로딩 속도 측정
- [ ] API 응답 시간 확인

## ⚠️ 주의사항

### 비용 관리
- **Vercel 무료 플랜 한도**:
  - 대역폭: 월 100GB
  - 함수 실행: 월 1,000초
  - 빌드: 월 6,000분

### 보안
- **환경변수 노출 금지**: `.env.local` 파일은 절대 커밋하지 마세요
- **CORS 설정**: 필요시 API 라우트에서 CORS 헤더 설정
- **Rate Limiting**: AI API 호출량 모니터링

### 모니터링
- **Vercel Analytics** 활성화
- **Error Tracking** 설정
- **Performance Monitoring** 확인

## 🆘 트러블슈팅

### 빌드 실패
```bash
# 로컬에서 빌드 테스트
npm run build

# Vercel 빌드 로그 확인
vercel logs
```

### 환경변수 문제
- **확인 방법**: Vercel 대시보드 → Project Settings → Environment Variables
- **재배포**: 환경변수 변경 후 재배포 필요

### 함수 타임아웃
- **기본 제한**: 10초 (무료 플랜)
- **해결책**: AI API 호출 최적화 또는 Pro 플랜 업그레이드

### Google OAuth 문제
- **리디렉션 URL**: 정확한 도메인 설정 확인
- **Scope 권한**: 필요한 권한만 요청

## ✅ 배포 완료

### 성공 확인
- [ ] 사이트 정상 접속: `https://your-app.vercel.app`
- [ ] 모든 기능 테스트 완료
- [ ] 성능 지표 확인
- [ ] 에러 모니터링 설정

### 다음 단계
1. **커스텀 도메인 연결** (선택사항)
2. **SEO 최적화**
3. **사용자 피드백 수집**
4. **기능 개선 및 업데이트**

---

🎉 **축하합니다!** AI 소설 생성 서비스가 성공적으로 배포되었습니다!