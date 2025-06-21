interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RequestRecord {
  timestamp: number;
  count: number;
}

export class RateLimiter {
  private requests: Map<string, RequestRecord[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = { maxRequests: 60, windowMs: 60000 }) {
    this.config = config;
  }

  public async checkLimit(key: string): Promise<boolean> {
    const now = Date.now();
    const records = this.requests.get(key) || [];
    
    // Remove old records outside the window
    const validRecords = records.filter(
      record => now - record.timestamp < this.config.windowMs
    );

    // Count requests in the current window
    const requestCount = validRecords.reduce((sum, record) => sum + record.count, 0);

    if (requestCount >= this.config.maxRequests) {
      return false; // Rate limit exceeded
    }

    // Add new request
    validRecords.push({ timestamp: now, count: 1 });
    this.requests.set(key, validRecords);

    return true; // Request allowed
  }

  public getRemainingRequests(key: string): number {
    const now = Date.now();
    const records = this.requests.get(key) || [];
    
    const validRecords = records.filter(
      record => now - record.timestamp < this.config.windowMs
    );

    const requestCount = validRecords.reduce((sum, record) => sum + record.count, 0);
    return Math.max(0, this.config.maxRequests - requestCount);
  }

  public getResetTime(key: string): number {
    const records = this.requests.get(key) || [];
    if (records.length === 0) return 0;

    const oldestRecord = records[0];
    return oldestRecord.timestamp + this.config.windowMs;
  }
}

// Singleton instances for different services
export const ga4RateLimiter = new RateLimiter({
  maxRequests: 100, // GA4 has generous limits
  windowMs: 60000, // 1 minute
});

export const searchConsoleRateLimiter = new RateLimiter({
  maxRequests: 60, // Search Console is more restrictive
  windowMs: 60000, // 1 minute
});

// Retry with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Check if it's a rate limit error
      if (error instanceof Error && error.message.includes('429')) {
        const delay = initialDelay * Math.pow(2, i);
        console.log(`Rate limit hit, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error; // Re-throw non-rate limit errors
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}