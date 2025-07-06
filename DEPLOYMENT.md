# 🚀 Vercel 배포 가이드

AI 소설 생성 서비스를 Vercel에 무료로 배포하는 상세 가이드입니다.

## 📋 배포 전 체크리스트

### 필수 준비사항
- [x] GitHub 계정
- [x] Vercel 계정 (GitHub로 가입 권장)
- [x] 모든 API 키 준비 (Supabase, Google, Gemini 등)

### 프로젝트 준비
- [x] Next.js 15.1.0 프로젝트
- [x] TypeScript 설정 완료
- [x] 환경변수 설정 파일 준비

## 🌐 Vercel 무료 플랜 정보

### 포함 사항
- ✅ **월 100GB 대역폭**
- ✅ **월 1,000 함수 실행 시간(초)**
- ✅ **무제한 정적 사이트**
- ✅ **SSL 인증서 자동 설정**
- ✅ **커스텀 도메인 연결**
- ✅ **GitHub 자동 배포**

### 제한사항
- ⚠️ **함수 실행 시간: 10초** (AI API 호출 고려 필요)
- ⚠️ **파일 크기: 50MB**
- ⚠️ **동시 빌드: 1개**

## 🚀 1단계: Vercel 계정 생성 및 연동

### 1.1 Vercel 가입
```bash
# 1. https://vercel.com 방문
# 2. "Sign up with GitHub" 클릭
# 3. GitHub 계정으로 로그인
# 4. Vercel 접근 권한 승인
```

### 1.2 Vercel CLI 설치 (선택사항)
```bash
npm i -g vercel
vercel login
```

## 📁 2단계: 프로젝트 GitHub 푸시

### 2.1 로컬 Git 저장소 초기화
```bash
# 프로젝트 루트에서 실행
git init
git add .
git commit -m "feat: initial commit for Vercel deployment"
```

### 2.2 GitHub 저장소 생성 및 푸시
```bash
# GitHub에서 새 저장소 생성 후
git remote add origin https://github.com/username/my-novel-app.git
git branch -M main
git push -u origin main
```

## ⚙️ 3단계: Vercel 프로젝트 생성

### 3.1 Import Project
1. **Vercel 대시보드** → **"New Project"** 클릭
2. **GitHub 저장소 선택** → 해당 저장소 **"Import"**
3. **프로젝트 설정**:
   - **Framework Preset**: Next.js (자동 감지)
   - **Build Command**: `npm run build` (기본값)
   - **Output Directory**: `.next` (기본값)
   - **Install Command**: `npm install` (기본값)

### 3.2 환경변수 설정
**⚠️ 중요: 모든 환경변수를 정확히 설정해야 합니다**

| 변수명 | 값 | 필수 | 설명 |
|--------|----|----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | ✅ | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | ✅ | Supabase 익명 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | ✅ | Supabase 서비스 롤 키 |
| `GOOGLE_CLIENT_ID` | `xxx.apps.googleusercontent.com` | ✅ | Google OAuth 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-xxx` | ✅ | Google OAuth 클라이언트 시크릿 |
| `NEXT_PUBLIC_GOOGLE_MAP_KEY` | `AIzaSy...` | ✅ | Google Maps API 키 |
| `GEMINI_API_KEY` | `AIzaSy...` | ✅ | Google Gemini API 키 |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | ⚠️ | Claude API 키 (백업용) |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | ✅ | 배포된 도메인 URL |
| `NEXTAUTH_SECRET` | `복잡한-랜덤-문자열` | ✅ | NextAuth 암호화 키 |
| `STORIES_BASE_PATH` | `./stories` | ✅ | 스토리 파일 저장 경로 |

### 3.3 환경변수 입력 방법
```bash
# Vercel 대시보드에서
1. Project Settings → Environment Variables
2. 각 변수 이름과 값 입력
3. Environment: Production, Preview, Development 모두 선택
4. "Save" 클릭
```

## 🔧 4단계: 배포 설정 최적화

### 4.1 vercel.json 설정 확인
프로젝트에 이미 포함된 `vercel.json` 설정:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "regions": ["icn1"],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

### 4.2 Google OAuth 리디렉션 URL 설정
1. **Google Cloud Console** → **Credentials** 이동
2. **OAuth 2.0 Client IDs** 편집
3. **Authorized redirect URIs** 추가:
   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```

## 🚀 5단계: 배포 실행

### 5.1 자동 배포
```bash
# GitHub에 푸시하면 자동 배포
git add .
git commit -m "feat: ready for production deployment"
git push origin main
```

### 5.2 수동 배포 (CLI)
```bash
# Vercel CLI 사용
vercel --prod
```

### 5.3 배포 상태 확인
1. **Vercel 대시보드** → **Deployments** 탭
2. **빌드 로그 확인**
3. **도메인 접속 테스트**

## 🌍 6단계: 커스텀 도메인 설정 (선택사항)

### 6.1 도메인 연결
1. **Project Settings** → **Domains**
2. **Add Domain** 클릭
3. **도메인 입력** (예: `mystory.app`)
4. **DNS 설정** (A record: `76.76.19.61`)

### 6.2 SSL 인증서
- **자동 설정**: Vercel이 자동으로 Let's Encrypt SSL 적용
- **확인**: `https://` 접속 테스트

## 🔄 7단계: CI/CD 자동화

### 7.1 GitHub Actions 설정 (선택사항)
```yaml
# .github/workflows/vercel.yml
name: Vercel Deployment
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
      - name: Build Project Artifacts
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### 7.2 자동 배포 브랜치 설정
- **Production**: `main` 브랜치
- **Preview**: 모든 Pull Request
- **Development**: 기타 브랜치

## 📊 8단계: 배포 후 확인사항

### 8.1 기능 테스트
- [ ] **홈페이지 로딩**
- [ ] **Google 로그인**
- [ ] **소설 생성 기능**
- [ ] **소설 뷰어**
- [ ] **선택지 인터랙션**
- [ ] **SNS 공유**

### 8.2 성능 모니터링
```bash
# Vercel Analytics 활성화
1. Project Settings → Analytics
2. Enable Web Analytics
3. 실시간 사용자 데이터 확인
```

### 8.3 오류 모니터링
- **Functions 탭**: API 에러 로그 확인
- **Speed Insights**: 성능 지표 확인

## 📱 9단계: 모바일 최적화

### 9.1 PWA 설정 (향후)
```javascript
// next.config.js PWA 설정 예시
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
})

module.exports = withPWA({
  // 기존 설정
})
```

## 💰 비용 관리

### 무료 플랜 한도 모니터링
- **대역폭**: 월 100GB (일반적으로 충분)
- **함수 실행**: 월 1,000초 (AI API 호출량 주의)
- **빌드 시간**: 월 6,000분 (충분)

### 비용 절약 팁
1. **이미지 최적화**: Next.js Image 컴포넌트 사용
2. **API 캐싱**: AI 응답 캐싱으로 비용 절약
3. **정적 생성**: ISR로 서버 부하 감소

## 🔧 트러블슈팅

### 빌드 오류
```bash
# 로그 확인
vercel logs your-deployment-url

# 로컬에서 빌드 테스트
npm run build
```

### 환경변수 문제
```bash
# 환경변수 확인
vercel env ls

# 환경변수 추가
vercel env add VARIABLE_NAME
```

### 함수 타임아웃
```javascript
// API 라우트에서 타임아웃 처리
export const maxDuration = 30; // 초
```

## 📞 지원 및 문의

### Vercel 지원
- **문서**: https://vercel.com/docs
- **커뮤니티**: https://github.com/vercel/vercel/discussions
- **Discord**: https://vercel.com/discord

### 프로젝트 지원
- **GitHub Issues**: 프로젝트 저장소에서 이슈 등록
- **문서**: README.md 참조

## 🌐 대안 배포 플랫폼

### Netlify
**특징**: 정적 사이트 중심, 무료 플랜 제공
```bash
# Netlify 배포
npm install -g netlify-cli
netlify init
netlify deploy --prod
```

**무료 플랜**:
- 월 100GB 대역폭
- 월 300분 빌드 시간
- 함수 125,000회 호출
- 10초 함수 실행 시간

### Cloudflare Pages
**특징**: 글로벌 CDN, 우수한 성능
```bash
# Cloudflare Pages 배포
npx wrangler pages publish .next
```

**무료 플랜**:
- 무제한 대역폭
- 월 500회 빌드
- 100,000회 요청/일
- Workers 함수 지원

### Railway
**특징**: 데이터베이스 포함, 백엔드 친화적
```bash
# Railway 배포
npm install -g @railway/cli
railway login
railway deploy
```

**무료 플랜** (2024년 기준):
- $5 월 크레딧
- 512MB RAM
- 1GB 디스크

## 📊 플랫폼 비교

| 플랫폼 | 무료 대역폭 | 함수 시간 | 빌드 시간 | 추천도 |
|--------|-------------|-----------|-----------|---------|
| **Vercel** | 100GB | 10초 | 6,000분 | ⭐⭐⭐⭐⭐ |
| **Netlify** | 100GB | 10초 | 300분 | ⭐⭐⭐⭐ |
| **Cloudflare** | 무제한 | 없음* | 500회 | ⭐⭐⭐ |
| **Railway** | 제한적 | 없음 | 제한적 | ⭐⭐ |

*Cloudflare Pages는 Workers 함수 별도 제한

## 🏆 Vercel 선택 이유

1. **Next.js 최적화**: Next.js 제작사에서 운영
2. **간편한 배포**: GitHub 푸시만으로 자동 배포
3. **무료 플랜**: 개인 프로젝트에 충분한 리소스
4. **한국 리전**: `icn1` 리전으로 빠른 속도
5. **풍부한 기능**: Analytics, Speed Insights 등

---

## 🎉 배포 완료!

축하합니다! 이제 AI 소설 생성 서비스가 전 세계에서 접근 가능합니다.

🔗 **배포된 사이트**: `https://your-app.vercel.app`

### 다음 단계
1. **사용자 피드백 수집**
2. **성능 모니터링**
3. **기능 개선 및 배포**
4. **도메인 구매 및 브랜딩**

### 성능 최적화 팁
- **이미지 최적화**: Next.js Image 컴포넌트 활용
- **코드 분할**: 동적 import로 번들 크기 최적화
- **캐싱 전략**: API 응답 캐싱으로 비용 절약
- **모니터링**: Vercel Analytics로 사용자 행동 분석