# AI 제공자 설정 가이드

Gemini 1.5 Pro와 Claude 3.5 Sonnet을 사용하기 위한 환경 변수 설정 가이드입니다.

## 필요한 환경 변수

프로젝트 루트의 `.env.local` 파일에 다음 환경 변수를 추가하세요:

```bash
# Claude AI (Anthropic)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Gemini AI (Google)
GEMINI_API_KEY=your_gemini_api_key_here
```

## API 키 발급 방법

### 1. Gemini API 키 발급 (강력 추천 - 초저가)

1. [Google AI Studio](https://aistudio.google.com/)에 접속
2. Google 계정으로 로그인
3. "Get API Key" 버튼 클릭
4. 새 프로젝트를 생성하거나 기존 프로젝트 선택
5. API 키를 복사하여 `GEMINI_API_KEY`에 설정

**비용 정보 (Gemini 2.5 Flash):**
- Input: $0.075 per 1M tokens
- Output: $0.30 per 1M tokens
- 소설 1편당 약 $0.002-0.003 (Claude 대비 95% 절약!)

### 2. Claude API 키 발급 (고품질)

1. [Anthropic Console](https://console.anthropic.com/)에 접속
2. 계정 생성 및 로그인
3. "Create Key" 버튼 클릭
4. API 키를 복사하여 `ANTHROPIC_API_KEY`에 설정

**비용 정보:**
- Input: $3.00 per 1M tokens  
- Output: $15.00 per 1M tokens
- 소설 1편당 약 $0.10-0.15 (고품질, 비용 높음)

## 기본 설정

기본적으로 **Gemini 2.5 Flash**가 선택되어 있습니다. 이는 초저가 설정으로, Claude 대비 약 95% 저렴한 비용으로 빠르고 품질 좋은 소설을 생성할 수 있습니다.

## 사용법

1. 환경 변수 설정 후 애플리케이션 재시작
2. 소설 생성 모달에서 AI 제공자 선택
3. 비용과 품질을 고려하여 적절한 모델 선택

## 문제 해결

### API 키 인증 실패
- API 키가 올바르게 설정되었는지 확인
- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 서버 재시작 필요

### 비용 최적화 팁
- 기본값인 Gemini 사용 권장
- 중요한 소설은 Claude로 생성
- API 사용량 모니터링

## 보안 주의사항

⚠️ **중요**: API 키를 Git에 커밋하지 마세요!
- `.env.local` 파일은 이미 `.gitignore`에 포함되어 있습니다
- API 키가 노출되지 않도록 주의하세요