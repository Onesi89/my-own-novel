/**
 * 복합 캐시 구현 (메모리 + DB)
 * FSD: shared/lib/ai/optimization/cache
 */

import { CacheStrategy, CachedResponse, CacheStats } from '../types'

export class CompositeCache implements CacheStrategy {
  constructor(private caches: CacheStrategy[]) {}

  async get(key: string): Promise<CachedResponse | null> {
    // 순서대로 캐시 검색 (메모리 -> DB)
    for (const cache of this.caches) {
      const result = await cache.get(key)
      if (result) {
        // 상위 캐시들에 결과 복사 (cache warming)
        await this.propagateToFasterCaches(key, result, cache)
        return result
      }
    }
    return null
  }

  async set(key: string, value: CachedResponse, ttl?: number): Promise<void> {
    // 모든 캐시에 저장
    await Promise.all(
      this.caches.map(cache => cache.set(key, value, ttl))
    )
  }

  async clear(): Promise<void> {
    await Promise.all(
      this.caches.map(cache => cache.clear())
    )
  }

  async getStats(): Promise<CacheStats> {
    const allStats = await Promise.all(
      this.caches.map(cache => cache.getStats())
    )

    // 통계 통합
    return allStats.reduce((combined, stats) => ({
      hits: combined.hits + stats.hits,
      misses: combined.misses + stats.misses,
      hitRate: (combined.hits + stats.hits) / (combined.hits + combined.misses + stats.hits + stats.misses),
      size: combined.size + stats.size
    }), { hits: 0, misses: 0, hitRate: 0, size: 0 })
  }

  private async propagateToFasterCaches(
    key: string, 
    value: CachedResponse, 
    sourceCache: CacheStrategy
  ): Promise<void> {
    const sourceIndex = this.caches.indexOf(sourceCache)
    if (sourceIndex === -1) return

    // 상위 캐시들에만 전파
    const fasterCaches = this.caches.slice(0, sourceIndex)
    await Promise.all(
      fasterCaches.map(cache => cache.set(key, value))
    )
  }
}