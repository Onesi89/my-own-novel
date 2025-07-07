/**
 * 데이터베이스 캐시 구현 (Supabase)
 * FSD: shared/lib/ai/optimization/cache
 */

import { createClient } from '@/supabase/server'
import { CacheStrategy, CachedResponse, CacheStats } from '../types'
import { createHash } from 'crypto'

interface DbCacheConfig {
  ttl: number  // hours
}

export class DbCache implements CacheStrategy {
  constructor(private config: DbCacheConfig) {}

  async get(key: string): Promise<CachedResponse | null> {
    try {
      const supabase = await createClient()
      const hashedKey = this.hashKey(key)
      
      const { data, error } = await supabase
        .from('ai_cache')
        .select('*')
        .eq('cache_key', hashedKey)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) {
        return null
      }

      // 히트 카운트 업데이트
      await supabase
        .from('ai_cache')
        .update({ 
          hit_count: data.hit_count + 1,
          last_accessed: new Date().toISOString()
        })
        .eq('id', data.id)

      return {
        content: data.content,
        choices: data.choices || [],
        tokenUsage: data.token_usage,
        timestamp: new Date(data.created_at).getTime(),
        provider: data.provider,
        quality: data.quality || 1.0
      }
    } catch (error) {
      console.error('DB Cache get error:', error)
      return null
    }
  }

  async set(key: string, value: CachedResponse, ttl?: number): Promise<void> {
    try {
      const supabase = await createClient()
      const hashedKey = this.hashKey(key)
      const finalTtl = ttl || (this.config.ttl * 60 * 60 * 1000) // hours to ms
      const expiresAt = new Date(Date.now() + finalTtl)

      await supabase
        .from('ai_cache')
        .insert({
          cache_key: hashedKey,
          original_key: key.length > 500 ? key.substring(0, 500) + '...' : key,
          content: value.content,
          choices: value.choices,
          token_usage: value.tokenUsage,
          provider: value.provider,
          quality: value.quality || 1.0,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
          last_accessed: new Date().toISOString(),
          hit_count: 0
        })

      // 만료된 캐시 정리 (백그라운드)
      this.cleanupExpired().catch(console.error)
    } catch (error) {
      console.error('DB Cache set error:', error)
      // 캐시 설정 실패는 silent fail (기능에 영향 없음)
    }
  }

  async clear(): Promise<void> {
    try {
      const supabase = await createClient()
      await supabase
        .from('ai_cache')
        .delete()
        .neq('id', 0) // delete all
    } catch (error) {
      console.error('DB Cache clear error:', error)
    }
  }

  async getStats(): Promise<CacheStats> {
    try {
      const supabase = await createClient()
      
      // 전체 캐시 엔트리 수
      const { count: totalCount } = await supabase
        .from('ai_cache')
        .select('*', { count: 'exact', head: true })
        .gte('expires_at', new Date().toISOString())

      // 히트 통계
      const { data: hitData } = await supabase
        .from('ai_cache')
        .select('hit_count')
        .gte('expires_at', new Date().toISOString())

      const totalHits = hitData?.reduce((sum, row) => sum + row.hit_count, 0) || 0
      const totalRequests = totalHits + (totalCount || 0) // 근사치

      return {
        hits: totalHits,
        misses: Math.max(0, totalRequests - totalHits),
        hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
        size: totalCount || 0
      }
    } catch (error) {
      console.error('DB Cache stats error:', error)
      return {
        hits: 0,
        misses: 0,
        hitRate: 0,
        size: 0
      }
    }
  }

  private hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex')
  }

  private async cleanupExpired(): Promise<void> {
    try {
      const supabase = await createClient()
      await supabase
        .from('ai_cache')
        .delete()
        .lt('expires_at', new Date().toISOString())
    } catch (error) {
      console.error('DB Cache cleanup error:', error)
    }
  }
}