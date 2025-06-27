interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class TwitterCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 15 * 60 * 1000; // 15分（Rate Limitリセット間隔）

  private generateKey(endpoint: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${endpoint}_${paramString}`;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  // 有効期限切れのエントリを削除
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // キャッシュ統計
  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.values());
    const validEntries = entries.filter(entry => now <= entry.expiresAt);
    
    return {
      totalEntries: this.cache.size,
      validEntries: validEntries.length,
      expiredEntries: entries.length - validEntries.length,
      memoryUsage: JSON.stringify(Array.from(this.cache)).length,
    };
  }
}

// シングルトンインスタンス
const twitterCache = new TwitterCacheService();

export default twitterCache;
export { TwitterCacheService };