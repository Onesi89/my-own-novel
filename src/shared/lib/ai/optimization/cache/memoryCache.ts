/**
 * 인메모리 캐시 구현 (LRU)
 * FSD: shared/lib/ai/optimization/cache
 */

import { CacheStrategy, CachedResponse, CacheStats } from '../types'

interface MemoryCacheConfig {
  ttl: number      // milliseconds
  maxSize: number  // number of entries
}

interface CacheEntry {
  value: CachedResponse
  expires: number
  accessed: number
}

export class MemoryCache implements CacheStrategy {
  private cache = new Map<string, CacheEntry>()
  private stats = {
    hits: 0,
    misses: 0,
    size: 0
  }

  constructor(private config: MemoryCacheConfig) {}

  async get(key: string): Promise<CachedResponse | null> {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.stats.misses++
      return null
    }
    
    // TTL 확인
    if (Date.now() > entry.expires) {
      this.cache.delete(key)
      this.stats.misses++
      this.stats.size--
      return null
    }
    
    // LRU 업데이트
    entry.accessed = Date.now()
    this.stats.hits++
    
    return entry.value
  }

  async set(key: string, value: CachedResponse, ttl?: number): Promise<void> {
    const finalTtl = ttl || this.config.ttl
    const expires = Date.now() + finalTtl
    
    // 공간 확보
    this.evictIfNeeded()
    
    this.cache.set(key, {
      value,
      expires,
      accessed: Date.now()
    })
    
    this.stats.size++
  }

  async clear(): Promise<void> {
    this.cache.clear()
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0
    }
  }

  async getStats(): Promise<CacheStats> {
    const total = this.stats.hits + this.stats.misses
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      size: this.stats.size
    }
  }

  private evictIfNeeded(): void {
    if (this.cache.size < this.config.maxSize) {
      return
    }

    // LRU 제거: 가장 오래전에 접근된 항목 찾기
    let oldestKey = ''
    let oldestTime = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessed < oldestTime) {
        oldestTime = entry.accessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      this.stats.size--
    }
  }

  // 테스트 및 디버깅용
  getSize(): number {
    return this.cache.size
  }

  // 만료된 엔트리 정리
  cleanup(): void {
    const now = Date.now()
    const toDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        toDelete.push(key)
      }
    }

    toDelete.forEach(key => {
      this.cache.delete(key)
      this.stats.size--
    })
  }
}