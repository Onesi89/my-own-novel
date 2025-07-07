# 개발/프로덕션 환경 설정 가이드

## 🔧 Supabase 설정

### Authentication URL 설정
Supabase Dashboard → Authentication → URL Configuration에서:

**Site URL**: 
- `http://localhost:3000` (개발용)
- `https://your-app.vercel.app` (프로덕션용)

**Redirect URLs** (둘 다 추가):
- `http://localhost:3000/auth/callback` 
- `https://your-app.vercel.app/auth/callback`

## 🔧 Google OAuth 설정

### Google Cloud Console에서:
1. **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `https://your-app.vercel.app`

2. **Authorized redirect URIs**:
   - `http://localhost:3000/auth/callback`
   - `https://your-app.vercel.app/auth/callback`

## 🛠️ 개발 환경 설정

### 1. 환경 변수 파일 우선순위
```
.env.development (개발용)
.env.production (프로덕션용)  
.env.local (공통/로컬 오버라이드)
```

### 2. 개발 모드 실행
```bash
pnpm dev  # .env.development 자동 로드
```

### 3. 프로덕션 빌드
```bash
pnpm build  # .env.production 자동 로드
```

## 📁 파일 구조
```
.env.development     # 개발 전용 설정
.env.production      # 프로덕션 전용 설정  
.env.local          # 로컬 오버라이드 (gitignore)
.env.example        # 설정 템플릿
```

## 🚀 권장 방법

### Option A: 별도 프로젝트 (권장)
- 개발용 Supabase 프로젝트 생성
- 완전히 분리된 환경
- 안전한 테스트

### Option B: 동일 프로젝트  
- URL 다중 설정으로 해결
- 간단하지만 데이터 공유됨
- 테스트 시 주의 필요