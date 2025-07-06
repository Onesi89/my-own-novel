-- ================================================
-- Initial Schema Migration for StoryPath MVP
-- ================================================
-- Based on database.mdc MVP recommendations
-- Simplified schema excluding sharing, versioning, RLS, and triggers

-- ================================================
-- 1. Users Table - 사용자 기본 정보
-- ================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    google_id VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 2. OAuth Tokens Table - 인증 토큰 관리
-- ================================================
CREATE TABLE IF NOT EXISTS oauth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 3. Timelines Table - 구글 타임라인 원본 데이터 (MVP 간소화)
-- ================================================
CREATE TABLE IF NOT EXISTS timelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timeline_date DATE NOT NULL,
    raw_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 4. Stories Table - AI 생성 소설 (MVP 간소화)
-- ================================================
CREATE TABLE IF NOT EXISTS stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timeline_id UUID NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    genre VARCHAR(50) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(10) DEFAULT 'md',
    metadata JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'draft',
    ai_choices JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 5. AI Prompts Table - AI API 호출 로그 (ai_provider 제외)
-- ================================================
CREATE TABLE IF NOT EXISTS ai_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    prompt_type VARCHAR(50) NOT NULL,
    prompt_text TEXT NOT NULL,
    response_data JSONB NOT NULL,
    token_usage DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 6. Generation Jobs Table - 백그라운드 작업 관리 (story_id NULL 허용)
-- ================================================
CREATE TABLE IF NOT EXISTS generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE, -- NULL 허용
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    parameters JSONB DEFAULT '{}',
    result JSONB,
    error_log JSONB,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 7. Basic Indexes for Performance
-- ================================================

-- User indexes
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_google_id ON users(google_id);

-- OAuth token indexes
CREATE INDEX idx_oauth_user_provider ON oauth_tokens(user_id, provider);
CREATE INDEX idx_oauth_expires_at ON oauth_tokens(expires_at);

-- Timeline indexes
CREATE INDEX idx_timeline_user_date ON timelines(user_id, timeline_date);
CREATE INDEX idx_timeline_date ON timelines(timeline_date);

-- Story indexes
CREATE INDEX idx_story_user_created ON stories(user_id, created_at DESC);
CREATE INDEX idx_story_timeline ON stories(timeline_id);

-- AI prompt indexes
CREATE INDEX idx_ai_prompt_story ON ai_prompts(story_id);
CREATE INDEX idx_ai_prompt_type ON ai_prompts(prompt_type);
CREATE INDEX idx_ai_prompt_created ON ai_prompts(created_at DESC);

-- Generation job indexes
CREATE INDEX idx_generation_job_status ON generation_jobs(status);
CREATE INDEX idx_generation_job_user ON generation_jobs(user_id);
CREATE INDEX idx_generation_job_story ON generation_jobs(story_id);
CREATE INDEX idx_generation_job_created ON generation_jobs(created_at DESC);

-- ================================================
-- 8. Comments for Documentation
-- ================================================

COMMENT ON TABLE users IS 'MVP: 사용자 기본 정보, preferences 제외';
COMMENT ON TABLE oauth_tokens IS 'MVP: 구글 OAuth 토큰 관리';
COMMENT ON TABLE timelines IS 'MVP: 구글 타임라인 원본 데이터, processed_locations/location_count 제외';
COMMENT ON TABLE stories IS 'MVP: AI 생성 소설, 파일 경로 저장 방식 (file_path, file_type 컬럼 사용)';
COMMENT ON TABLE ai_prompts IS 'MVP: AI API 호출 로그, ai_provider 컬럼 제외 (단일 AI 제공자 사용)';
COMMENT ON TABLE generation_jobs IS 'MVP: 백그라운드 작업 관리, story_id는 NULL 허용';

-- ================================================
-- 9. Trigger Functions for updated_at Columns
-- ================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for all tables with updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oauth_tokens_updated_at 
    BEFORE UPDATE ON oauth_tokens 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timelines_updated_at 
    BEFORE UPDATE ON timelines 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stories_updated_at 
    BEFORE UPDATE ON stories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generation_jobs_updated_at 
    BEFORE UPDATE ON generation_jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 10. CHECK Constraints for Data Validation
-- ================================================

-- Stories status validation
ALTER TABLE stories 
ADD CONSTRAINT check_story_status 
CHECK (status IN ('draft', 'completed', 'archived'));

-- Stories file type validation
ALTER TABLE stories 
ADD CONSTRAINT check_file_type 
CHECK (file_type IN ('md', 'txt'));

-- Generation jobs status validation
ALTER TABLE generation_jobs 
ADD CONSTRAINT check_job_status 
CHECK (status IN ('pending', 'processing', 'completed', 'failed'));

-- Generation jobs type validation
ALTER TABLE generation_jobs 
ADD CONSTRAINT check_job_type 
CHECK (job_type IN ('story_generation', 'timeline_processing', 'ai_prompt'));

-- AI prompt type validation
ALTER TABLE ai_prompts 
ADD CONSTRAINT check_prompt_type 
CHECK (prompt_type IN ('story', 'choice', 'title', 'summary'));

-- Email format validation
ALTER TABLE users 
ADD CONSTRAINT check_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- ================================================
-- Migration Complete - MVP Simplified Version with Cursor Rules Compliance
-- ================================================