/**
 * 캐시 시스템 팩토리
 * FSD: shared/lib/ai/optimization/cache
 */

export { MemoryCache } from './memoryCache'
export { DbCache } from './dbCache'
export { CompositeCache } from './compositeCache'

import { MemoryCache } from './memoryCache'
import { DbCache } from './dbCache'
import { CompositeCache } from './compositeCache'
import { CacheStrategy } from '../types'

export interface CacheConfig {
  memory?: {
    enabled: boolean
    ttl: number
    maxSize: number
  }
  db?: {
    enabled: boolean
    ttl: number
  }
}

export function createCache(config: CacheConfig): CacheStrategy {
  const caches: CacheStrategy[] = []
  
  if (config.memory?.enabled) {
    caches.push(new MemoryCache({
      ttl: config.memory.ttl,
      maxSize: config.memory.maxSize
    }))
  }
  
  if (config.db?.enabled) {
    caches.push(new DbCache({
      ttl: config.db.ttl
    }))
  }
  
  if (caches.length === 0) {
    throw new Error('At least one cache must be enabled')
  }
  
  if (caches.length === 1) {
    return caches[0]
  }
  
  return new CompositeCache(caches)
}