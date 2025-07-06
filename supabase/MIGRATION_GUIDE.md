# Supabase Migration Guide

## 개요
StoryPath MVP를 위한 Supabase 데이터베이스 스키마 마이그레이션 가이드입니다.

## 마이그레이션 파일
- `20250105120000_initial_schema.sql`: 초기 테이블 스키마 및 기본 설정 (MVP 간소화 버전)

## 사전 요구사항
1. Supabase 프로젝트 생성 완료
2. 환경변수 설정 완료 (.env.local)
3. Supabase CLI 설치 (선택사항)

## 마이그레이션 실행 방법

### 방법 1: Supabase CLI 사용 (권장)
```bash
# Supabase CLI 설치
npm install -g supabase

# 프로젝트 연결
supabase link --project-ref gsikvxkozeicptywjlff

# 마이그레이션 실행
supabase db push
```

### 방법 2: Supabase Dashboard 사용
1. Supabase 대시보드 (https://app.supabase.com) 접속
2. 프로젝트 선택: `gsikvxkozeicptywjlff`
3. SQL Editor로 이동
4. 마이그레이션 파일 내용을 복사 & 실행:
   - `20250105120000_initial_schema.sql` 실행

## 생성되는 테이블 구조

### MVP 핵심 테이블
1. **users** - 사용자 기본 정보
2. **oauth_tokens** - 구글 OAuth 토큰 관리
3. **timelines** - 구글 타임라인 원본 데이터
4. **stories** - AI 생성 소설 (파일 경로 저장 방식)
5. **ai_prompts** - AI API 호출 로그
6. **generation_jobs** - 백그라운드 작업 관리

### 제외된 MVP 기능 (향후 추가 예정)
- `story_versions` - 소설 버전 관리
- `story_shares` - 소설 공유 기능
- 고급 사용자 설정 (preferences)
- 위치 데이터 정규화 (processed_locations)

## MVP 특징
- **간소화된 스키마**: 보안 정책(RLS) 및 트리거 제외
- **기본 인덱스만 포함**: 필수 성능 최적화만 적용
- **파일 기반 저장**: 소설 내용은 파일로 저장, DB에는 경로만 저장
- **MVP 핵심 기능**: 사용자 관리, 타임라인, 소설 생성, AI 호출 로그

## 검증 방법
```sql
-- 테이블 생성 확인
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 기본 제약 조건 확인
SELECT conname, contype, conrelid::regclass 
FROM pg_constraint 
WHERE connamespace = 'public'::regnamespace;

-- 인덱스 확인
SELECT indexname, tablename, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```

## 트러블슈팅

### 일반적인 오류
1. **Permission Denied**: Service Role Key 확인
2. **Table Already Exists**: `DROP TABLE IF EXISTS` 또는 스키마 초기화
3. **Foreign Key Constraint**: 참조 테이블 생성 순서 확인

### 롤백 방법
```sql
-- 테이블 삭제 (순서 중요: 외래키 참조 역순)
DROP TABLE IF EXISTS ai_prompts;
DROP TABLE IF EXISTS generation_jobs;
DROP TABLE IF EXISTS stories;
DROP TABLE IF EXISTS timelines;
DROP TABLE IF EXISTS oauth_tokens;
DROP TABLE IF EXISTS users;
```

## 파일 저장 구조
소설 내용은 다음과 같은 구조로 저장됩니다:
```
stories/
├── {user_id}/
│   ├── {story_id}/
│   │   ├── story.md (또는 story.txt)
│   │   ├── metadata.json
│   │   └── ai_choices.json
│   └── ...
└── ...
```

## 다음 단계
1. 마이그레이션 실행 후 테이블 구조 확인
2. 파일 저장 디렉토리 생성 (`stories/` 폴더)
3. 기본 데이터 생성 테스트
4. 애플리케이션 연동 테스트

## 참고 문서
- [Supabase Migration Guide](https://supabase.com/docs/guides/cli/local-development)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [ERD.md](../ERD.md) - 전체 스키마 설계 문서