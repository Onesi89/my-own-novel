-- ================================================
-- Update Timelines Schema for Google Takeout Data
-- ================================================
-- Google Takeout semanticSegments 데이터를 위한 스키마 개선
-- 머물고 떠나는 시각과 장소 정보를 구조화된 형태로 저장

-- ================================================
-- 1. 기존 timelines 테이블에 새로운 컬럼 추가
-- ================================================

-- 날짜 범위 정보 추가
ALTER TABLE timelines ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE timelines ADD COLUMN IF NOT EXISTS end_date DATE;

-- 처리된 위치 데이터 (정규화된 형태)
ALTER TABLE timelines ADD COLUMN IF NOT EXISTS processed_locations JSONB DEFAULT '[]';

-- 위치 개수 및 메타데이터
ALTER TABLE timelines ADD COLUMN IF NOT EXISTS location_count INTEGER DEFAULT 0;
ALTER TABLE timelines ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'unknown';
ALTER TABLE timelines ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 데이터 품질 정보
ALTER TABLE timelines ADD COLUMN IF NOT EXISTS data_quality JSONB DEFAULT '{}';

-- ================================================
-- 2. 새로운 장소 방문 정보 테이블 생성
-- ================================================

-- 장소 방문 세그먼트 정보 (semanticSegments 기반)
CREATE TABLE IF NOT EXISTS place_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timeline_id UUID NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 장소 정보
    place_name VARCHAR(200),
    place_address TEXT,
    place_id VARCHAR(100), -- Google Place ID
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    
    -- 방문 시간 정보
    arrival_time TIMESTAMP WITH TIME ZONE NOT NULL,
    departure_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER, -- 체류 시간 (분)
    
    -- 방문 유형 및 신뢰도
    visit_type VARCHAR(30) DEFAULT 'unknown', -- 'home', 'work', 'transit', 'leisure', 'unknown'
    confidence_level DECIMAL(3, 2) DEFAULT 0.0, -- 0.0 ~ 1.0
    
    -- 이동 정보
    travel_distance_meters INTEGER, -- 이전 장소에서의 이동 거리
    travel_duration_minutes INTEGER, -- 이동 시간
    travel_mode VARCHAR(30), -- 'walking', 'driving', 'transit', 'cycling', 'unknown'
    
    -- 메타데이터
    segment_type VARCHAR(30) DEFAULT 'place_visit', -- 'place_visit', 'activity_segment'
    raw_segment_data JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 3. 이동 경로 세그먼트 테이블 생성
-- ================================================

-- 이동 경로 정보 (timelinePath 기반)
CREATE TABLE IF NOT EXISTS movement_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timeline_id UUID NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 이동 시간 정보
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL,
    
    -- 경로 정보
    path_points JSONB NOT NULL, -- [{"lat": 37.123, "lng": 126.456, "time": "2024-01-01T10:00:00Z"}]
    total_distance_meters INTEGER DEFAULT 0,
    average_speed_kmh DECIMAL(5, 2) DEFAULT 0.0,
    
    -- 시작/종료 위치
    start_latitude DECIMAL(10, 8) NOT NULL,
    start_longitude DECIMAL(11, 8) NOT NULL,
    end_latitude DECIMAL(10, 8) NOT NULL,
    end_longitude DECIMAL(11, 8) NOT NULL,
    
    -- 이동 수단 및 신뢰도
    transport_mode VARCHAR(30) DEFAULT 'unknown',
    confidence_level DECIMAL(3, 2) DEFAULT 0.0,
    
    -- 메타데이터
    segment_type VARCHAR(30) DEFAULT 'movement_path',
    raw_segment_data JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 4. 인덱스 생성 (성능 최적화)
-- ================================================

-- timelines 새로운 컬럼 인덱스
CREATE INDEX IF NOT EXISTS idx_timelines_source ON timelines(source);
CREATE INDEX IF NOT EXISTS idx_timelines_date_range ON timelines(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_timelines_location_count ON timelines(location_count);

-- place_visits 인덱스
CREATE INDEX IF NOT EXISTS idx_place_visits_timeline ON place_visits(timeline_id);
CREATE INDEX IF NOT EXISTS idx_place_visits_user ON place_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_place_visits_time ON place_visits(arrival_time, departure_time);
CREATE INDEX IF NOT EXISTS idx_place_visits_location ON place_visits(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_place_visits_place_id ON place_visits(place_id);
CREATE INDEX IF NOT EXISTS idx_place_visits_type ON place_visits(visit_type);

-- movement_paths 인덱스
CREATE INDEX IF NOT EXISTS idx_movement_paths_timeline ON movement_paths(timeline_id);
CREATE INDEX IF NOT EXISTS idx_movement_paths_user ON movement_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_movement_paths_time ON movement_paths(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_movement_paths_location ON movement_paths(start_latitude, start_longitude);
CREATE INDEX IF NOT EXISTS idx_movement_paths_mode ON movement_paths(transport_mode);

-- ================================================
-- 5. 업데이트 트리거 추가
-- ================================================

-- place_visits 업데이트 트리거
CREATE TRIGGER update_place_visits_updated_at 
    BEFORE UPDATE ON place_visits 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- movement_paths 업데이트 트리거
CREATE TRIGGER update_movement_paths_updated_at 
    BEFORE UPDATE ON movement_paths 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 6. 제약 조건 추가
-- ================================================

-- timelines 제약 조건
ALTER TABLE timelines 
ADD CONSTRAINT check_timeline_source 
CHECK (source IN ('google_takeout', 'simulation', 'manual_input', 'unknown'));

-- place_visits 제약 조건
ALTER TABLE place_visits 
ADD CONSTRAINT check_visit_type 
CHECK (visit_type IN ('home', 'work', 'transit', 'leisure', 'shopping', 'dining', 'unknown'));

ALTER TABLE place_visits 
ADD CONSTRAINT check_confidence_level 
CHECK (confidence_level >= 0.0 AND confidence_level <= 1.0);

ALTER TABLE place_visits 
ADD CONSTRAINT check_duration_positive 
CHECK (duration_minutes IS NULL OR duration_minutes >= 0);

-- movement_paths 제약 조건
ALTER TABLE movement_paths 
ADD CONSTRAINT check_transport_mode 
CHECK (transport_mode IN ('walking', 'driving', 'transit', 'cycling', 'running', 'unknown'));

ALTER TABLE movement_paths 
ADD CONSTRAINT check_movement_confidence 
CHECK (confidence_level >= 0.0 AND confidence_level <= 1.0);

ALTER TABLE movement_paths 
ADD CONSTRAINT check_movement_duration 
CHECK (duration_minutes > 0);

-- 좌표 유효성 검사
ALTER TABLE place_visits 
ADD CONSTRAINT check_place_coordinates 
CHECK (latitude >= -90 AND latitude <= 90 AND longitude >= -180 AND longitude <= 180);

ALTER TABLE movement_paths 
ADD CONSTRAINT check_movement_coordinates 
CHECK (start_latitude >= -90 AND start_latitude <= 90 AND start_longitude >= -180 AND start_longitude <= 180 
   AND end_latitude >= -90 AND end_latitude <= 90 AND end_longitude >= -180 AND end_longitude <= 180);

-- ================================================
-- 7. 테이블 코멘트 추가
-- ================================================

COMMENT ON TABLE timelines IS 'Google Takeout 타임라인 원본 데이터 및 처리된 위치 정보';
COMMENT ON COLUMN timelines.processed_locations IS '정규화된 위치 데이터 배열 (TimelineLocation[])';
COMMENT ON COLUMN timelines.source IS '데이터 출처: google_takeout, simulation, manual_input';
COMMENT ON COLUMN timelines.data_quality IS '데이터 품질 정보: 정확도, 완성도, 신뢰도 등';

COMMENT ON TABLE place_visits IS 'Google Takeout semanticSegments 기반 장소 방문 정보';
COMMENT ON COLUMN place_visits.visit_type IS '방문 유형: home, work, transit, leisure, shopping, dining';
COMMENT ON COLUMN place_visits.confidence_level IS '장소 인식 신뢰도 (0.0 ~ 1.0)';
COMMENT ON COLUMN place_visits.duration_minutes IS '체류 시간 (분 단위)';

COMMENT ON TABLE movement_paths IS 'Google Takeout timelinePath 기반 이동 경로 정보';
COMMENT ON COLUMN movement_paths.path_points IS 'JSON 배열 형태의 경로 좌표 [{"lat": 37.123, "lng": 126.456, "time": "..."}]';
COMMENT ON COLUMN movement_paths.transport_mode IS '이동 수단: walking, driving, transit, cycling, running';

-- ================================================
-- Migration Complete - Enhanced Schema for Google Takeout Data
-- ================================================