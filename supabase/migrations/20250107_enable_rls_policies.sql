-- ================================================
-- Row Level Security (RLS) 정책 설정
-- 생성일: 2025-01-07
-- 목적: 사용자별 데이터 접근 제어 및 보안 강화
-- ================================================

-- ================================================
-- 1. Users 테이블 RLS 설정
-- ================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 정보만 읽기 가능
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- 사용자는 자신의 정보만 업데이트 가능
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- 새 사용자 생성 (회원가입 시)
CREATE POLICY "Enable insert for authenticated users" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ================================================
-- 2. OAuth Tokens 테이블 RLS 설정
-- ================================================
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 토큰만 접근 가능
CREATE POLICY "Users can manage own tokens" ON oauth_tokens
    FOR ALL USING (
        auth.uid() = user_id
    );

-- ================================================
-- 3. Timelines 테이블 RLS 설정
-- ================================================
ALTER TABLE timelines ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 타임라인만 접근 가능
CREATE POLICY "Users can manage own timelines" ON timelines
    FOR ALL USING (
        auth.uid() = user_id
    );

-- ================================================
-- 4. Stories 테이블 RLS 설정
-- ================================================
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 소설만 접근 가능
CREATE POLICY "Users can manage own stories" ON stories
    FOR ALL USING (
        auth.uid() = user_id
    );

-- ================================================
-- 5. AI Prompts 테이블 RLS 설정
-- ================================================
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 소설에 연관된 AI 프롬프트만 접근 가능
CREATE POLICY "Users can manage prompts for own stories" ON ai_prompts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM stories 
            WHERE stories.id = ai_prompts.story_id 
            AND stories.user_id = auth.uid()
        )
    );

-- ================================================
-- 6. Generation Jobs 테이블 RLS 설정
-- ================================================
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 작업만 접근 가능
CREATE POLICY "Users can manage own generation jobs" ON generation_jobs
    FOR ALL USING (
        auth.uid() = user_id
    );

-- ================================================
-- 7. 시스템 레벨 정책 (관리자용)
-- ================================================

-- 시스템 관리를 위한 서비스 롤 정책 (필요시 활성화)
-- CREATE POLICY "Service role bypass" ON users
--     FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ================================================
-- 8. 정책 검증을 위한 함수들
-- ================================================

-- 사용자 인증 상태 확인 함수
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용자 소유권 확인 함수
CREATE OR REPLACE FUNCTION is_owner(resource_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() = resource_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- 9. 코멘트 추가
-- ================================================

COMMENT ON POLICY "Users can view own profile" ON users IS '사용자는 자신의 프로필만 조회 가능';
COMMENT ON POLICY "Users can update own profile" ON users IS '사용자는 자신의 프로필만 수정 가능';
COMMENT ON POLICY "Enable insert for authenticated users" ON users IS '인증된 사용자의 계정 생성 허용';

COMMENT ON POLICY "Users can manage own tokens" ON oauth_tokens IS '사용자는 자신의 OAuth 토큰만 관리 가능';
COMMENT ON POLICY "Users can manage own timelines" ON timelines IS '사용자는 자신의 타임라인만 관리 가능';
COMMENT ON POLICY "Users can manage own stories" ON stories IS '사용자는 자신의 소설만 관리 가능';
COMMENT ON POLICY "Users can manage prompts for own stories" ON ai_prompts IS '사용자는 자신의 소설 관련 AI 프롬프트만 관리 가능';
COMMENT ON POLICY "Users can manage own generation jobs" ON generation_jobs IS '사용자는 자신의 생성 작업만 관리 가능';

-- ================================================
-- RLS 정책 설정 완료
-- ================================================