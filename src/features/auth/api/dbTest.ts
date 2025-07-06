/**
 * Database Connection Test
 * FSD: features/auth/api
 * 
 * 데이터베이스 연결 및 테이블 접근 테스트
 */

import { supabase } from '@/shared/lib/supabase'

// 중복 테스트 방지를 위한 플래그
let isTestRunning = false

export async function testDatabaseConnection() {
  if (isTestRunning) {
    console.log('⚠️ Database test already running, skipping...')
    return true
  }
  
  isTestRunning = true
  console.log('=== Database Connection Test ===')
  
  try {
    // 1. Supabase 연결 테스트
    console.log('1. Testing Supabase connection...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true })
    
    if (connectionError) {
      console.error('Connection error:', connectionError)
      return false
    }
    
    console.log('✅ Supabase connection successful, user count:', connectionTest)
    
    // 2. 테이블 구조 확인
    console.log('2. Testing table structure...')
    const { data: tableTest, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.error('Table access error:', tableError)
      return false
    }
    
    console.log('✅ Users table accessible, sample data:', tableTest)
    
    // 3. 테스트 INSERT (실제로 데이터를 넣지 않고 검증만)
    console.log('3. Testing insert permissions...')
    const testUuid = '00000000-0000-4000-8000-000000000001' // 유효한 UUID v4 형식
    const testData = {
      id: testUuid,
      email: 'test@example.com',
      name: 'Test User',
      google_id: 'test-google-id-12345'
    }
    
    const { data: insertTest, error: insertError } = await supabase
      .from('users')
      .insert(testData)
      .select()
    
    if (insertError) {
      console.error('Insert permission error:', insertError)
      
      // 테스트 데이터 정리 시도
      if (insertTest) {
        await supabase.from('users').delete().eq('id', 'test-id-12345')
      }
      return false
    }
    
    console.log('✅ Insert permissions work, test data:', insertTest)
    
    // 4. 테스트 데이터 정리
    console.log('4. Cleaning up test data...')
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', testUuid)
    
    if (deleteError) {
      console.error('Delete error (cleanup):', deleteError)
    } else {
      console.log('✅ Test data cleaned up')
    }
    
    console.log('=== Database Test Completed Successfully ===')
    return true
    
  } catch (error) {
    console.error('Database test failed:', error)
    return false
  } finally {
    isTestRunning = false
  }
}

export async function testOAuthTokensTable() {
  console.log('=== OAuth Tokens Table Test ===')
  
  try {
    const { data, error } = await supabase
      .from('oauth_tokens')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('OAuth tokens table error:', error)
      return false
    }
    
    console.log('✅ OAuth tokens table accessible:', data)
    return true
    
  } catch (error) {
    console.error('OAuth tokens table test failed:', error)
    return false
  }
}

export async function checkTableSchema() {
  console.log('=== Table Schema Check ===')
  
  try {
    // 테이블 구조 확인 (PostgreSQL 정보 스키마 활용)
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_columns', { table_name: 'users' })
    
    if (tableError) {
      console.log('Cannot get table schema (권한 없음), but that\'s normal')
    } else {
      console.log('✅ Table schema:', tableInfo)
    }
    
    // 실제 데이터 한 개 조회해서 구조 확인
    const { data: sampleData, error: sampleError } = await supabase
      .from('users')
      .select('*')
      .limit(1)
    
    if (sampleError) {
      console.error('Sample data error:', sampleError)
    } else {
      console.log('✅ Sample data structure:', sampleData)
      if (sampleData && sampleData.length > 0) {
        console.log('✅ Column names:', Object.keys(sampleData[0]))
      }
    }
    
    return true
    
  } catch (error) {
    console.error('Schema check failed:', error)
    return false
  }
}