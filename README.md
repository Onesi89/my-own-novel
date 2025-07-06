# 🚗📖 AI 소설 생성 서비스

구글 타임라인 데이터를 활용해 사용자의 이동 경로를 AI가 서사 구조로 변환하여 개인화된 인터랙티브 소설을 생성하는 웹 서비스입니다.

## ✨ 주요 기능

- 🗺️ **Google Timeline 연동**: 실제 이동 경로를 소설의 배경으로 활용
- 🤖 **AI 스토리 생성**: Gemini AI가 개인화된 소설 창작
- 🎭 **장르 선택**: SF, 로맨스, 코미디, 미스터리, 드라마, 어드벤처
- 🔀 **인터랙티브 선택지**: 사용자 선택에 따른 스토리 분기
- 📱 **반응형 디자인**: 모바일 우선 설계
- 🔗 **SNS 공유**: 생성된 소설 간편 공유

## 🚀 배포

### Vercel 무료 배포
이 프로젝트는 Vercel에 무료로 배포할 수 있습니다.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/username/my-novel-app)

**📖 상세한 배포 가이드**: [DEPLOYMENT.md](./DEPLOYMENT.md)

### 환경 변수 설정
배포 전 필수 환경 변수들을 설정해야 합니다:

```bash
# .env.local 파일 생성
cp .env.example .env.local
```

필요한 API 키들:
- 🗄️ **Supabase**: 데이터베이스 및 인증
- 🔐 **Google OAuth**: 소셜 로그인
- 🗺️ **Google Maps**: 지도 및 장소 정보
- 🤖 **Gemini AI**: 소설 생성

## 💻 로컬 개발

### 1. 설치
```bash
git clone https://github.com/username/my-novel-app.git
cd my-novel-app
npm install
```

### 2. 환경 변수 설정
```bash
cp .env.example .env.local
# .env.local 파일을 열어 실제 API 키들로 수정
```

### 3. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 4. 빌드 테스트
```bash
npm run build
npm run start
```

## 기본 포함 라이브러리

- [Next.js](https://nextjs.org)
- [React](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)
- [ESLint](https://eslint.org)
- [Prettier](https://prettier.io)
- [Shadcn UI](https://ui.shadcn.com)
- [Lucide Icon](https://lucide.dev)
- [date-fns](https://date-fns.org)
- [react-use](https://github.com/streamich/react-use)
- [es-toolkit](https://github.com/toss/es-toolkit)
- [Zod](https://zod.dev)
- [React Query](https://tanstack.com/query/latest)
- [React Hook Form](https://react-hook-form.com)
- [TS Pattern](https://github.com/gvergnaud/ts-pattern)

## 사용 가능한 명령어

한글버전 사용

```sh
easynext lang ko
```

최신버전으로 업데이트

```sh
npm i -g @easynext/cli@latest
# or
yarn add -g @easynext/cli@latest
# or
pnpm add -g @easynext/cli@latest
```

Supabase 설정

```sh
easynext supabase
```

Next-Auth 설정

```sh
easynext auth

# ID,PW 로그인
easynext auth idpw
# 카카오 로그인
easynext auth kakao
```

유용한 서비스 연동

```sh
# Google Analytics
easynext gtag

# Microsoft Clarity
easynext clarity

# ChannelIO
easynext channelio

# Sentry
easynext sentry

# Google Adsense
easynext adsense
```
