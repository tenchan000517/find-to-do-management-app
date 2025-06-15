import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from "@prisma/client";

interface AICallOptions {
  userId?: string;
  maxRetries?: number;
  timeout?: number;
  useCache?: boolean;
  cacheKey?: string;
}

interface AICallResult {
  success: boolean;
  content?: string;
  error?: string;
  tokenUsed?: number;
  duration: number;
  fromCache?: boolean;
}

export class AICallManager {
  private genAI: GoogleGenerativeAI;
  private prisma: PrismaClient;
  private cache: Map<string, { content: string; timestamp: number }> = new Map();
  private rateLimiter: Map<string, number[]> = new Map();
  
  // Rate limits: 60 calls per minute, 1500 calls per day
  private readonly RATE_LIMIT_PER_MINUTE = 60;
  private readonly RATE_LIMIT_PER_DAY = 1500;
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.prisma = new PrismaClient();
  }

  /**
   * Main method to call Gemini AI with rate limiting, caching, and logging
   */
  async callGemini(
    prompt: string,
    callType: string,
    options: AICallOptions = {}
  ): Promise<AICallResult> {
    const startTime = Date.now();
    const { userId, maxRetries = 3, timeout = 30000, useCache = true, cacheKey } = options;

    try {
      // Check cache first
      if (useCache) {
        const cached = this.getFromCache(cacheKey || prompt);
        if (cached) {
          await this.logCall(callType, prompt, cached, 0, Date.now() - startTime, "success", undefined, userId);
          return {
            success: true,
            content: cached,
            duration: Date.now() - startTime,
            fromCache: true
          };
        }
      }

      // Check rate limits
      if (!this.checkRateLimit()) {
        const errorMsg = "Rate limit exceeded";
        await this.logCall(callType, prompt, null, 0, Date.now() - startTime, "rate_limited", errorMsg, userId);
        return {
          success: false,
          error: errorMsg,
          duration: Date.now() - startTime
        };
      }

      // Make AI call with retries
      let lastError: string | undefined;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await this.makeGeminiCall(prompt, timeout);
          
          // Cache successful result
          if (useCache && result.content) {
            this.setCache(cacheKey || prompt, result.content);
          }

          await this.logCall(callType, prompt, result.content, result.tokenUsed || 0, Date.now() - startTime, "success", undefined, userId);
          
          return {
            success: true,
            content: result.content,
            tokenUsed: result.tokenUsed,
            duration: Date.now() - startTime
          };
        } catch (error) {
          lastError = error instanceof Error ? error.message : "Unknown error";
          if (attempt === maxRetries) break;
          
          // Wait before retry (exponential backoff)
          await new Promise<void>(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }

      // Log failed call
      await this.logCall(callType, prompt, null, 0, Date.now() - startTime, "error", lastError, userId);
      
      return {
        success: false,
        error: lastError,
        duration: Date.now() - startTime
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      await this.logCall(callType, prompt, null, 0, Date.now() - startTime, "error", errorMsg, userId);
      
      return {
        success: false,
        error: errorMsg,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Make actual Gemini API call
   */
  private async makeGeminiCall(prompt: string, timeout: number): Promise<{ content: string; tokenUsed?: number }> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Request timeout")), timeout);
    });

    const apiCall = model.generateContent(prompt);
    
    const result = await Promise.race([apiCall, timeoutPromise]);
    const response = result.response;
    const text = response.text();

    return {
      content: text,
      tokenUsed: response.usageMetadata?.totalTokenCount || 0
    };
  }

  /**
   * Check if current request is within rate limits
   */
  private checkRateLimit(): boolean {
    const now = Date.now();
    const userKey = "global"; // For now, using global rate limiting
    
    if (!this.rateLimiter.has(userKey)) {
      this.rateLimiter.set(userKey, []);
    }

    const timestamps = this.rateLimiter.get(userKey)!;
    
    // Clean old timestamps
    const oneMinuteAgo = now - 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    const recentMinute = timestamps.filter(t => t > oneMinuteAgo);
    const recentDay = timestamps.filter(t => t > oneDayAgo);
    
    // Check limits
    if (recentMinute.length >= this.RATE_LIMIT_PER_MINUTE) {
      return false;
    }
    
    if (recentDay.length >= this.RATE_LIMIT_PER_DAY) {
      return false;
    }

    // Add current timestamp
    timestamps.push(now);
    this.rateLimiter.set(userKey, recentDay.concat([now]));
    
    return true;
  }

  /**
   * Get content from cache
   */
  private getFromCache(key: string): string | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.content;
  }

  /**
   * Store content in cache
   */
  private setCache(key: string, content: string): void {
    this.cache.set(key, {
      content,
      timestamp: Date.now()
    });
  }

  /**
   * Log AI call to database
   */
  private async logCall(
    callType: string,
    prompt: string,
    response: string | null,
    tokenUsed: number,
    duration: number,
    status: string,
    errorMessage?: string,
    userId?: string
  ): Promise<void> {
    try {
      await this.prisma.ai_call_logs.create({
        data: {
          callType,
          prompt: prompt.length > 1000 ? prompt.substring(0, 1000) + "..." : prompt,
          response: response && response.length > 2000 ? response.substring(0, 2000) + "..." : response,
          tokenUsed,
          duration,
          status,
          errorMessage,
          userId
        }
      });
    } catch (error) {
      console.error("Failed to log AI call:", error);
    }
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(days: number = 7): Promise<{
    totalCalls: number;
    successfulCalls: number;
    errorCalls: number;
    totalTokens: number;
    avgDuration: number;
    callsByType: Record<string, number>;
  }> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const logs = await this.prisma.ai_call_logs.findMany({
      where: {
        createdAt: {
          gte: since
        }
      }
    });

    const totalCalls = logs.length;
    const successfulCalls = logs.filter((log: { status: string }) => log.status === "success").length;
    const errorCalls = logs.filter((log: { status: string }) => log.status === "error").length;
    const totalTokens = logs.reduce((sum: number, log: { tokenUsed: number }) => sum + log.tokenUsed, 0);
    const avgDuration = totalCalls > 0 ? logs.reduce((sum: number, log: { duration: number }) => sum + log.duration, 0) / totalCalls : 0;
    
    const callsByType: Record<string, number> = {};
    logs.forEach((log: { callType: string }) => {
      callsByType[log.callType] = (callsByType[log.callType] || 0) + 1;
    });

    return {
      totalCalls,
      successfulCalls,
      errorCalls,
      totalTokens,
      avgDuration,
      callsByType
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// Export singleton instance
let aiCallManager: AICallManager | null = null;

export function getAICallManager(): AICallManager {
  if (!aiCallManager) {
    aiCallManager = new AICallManager();
  }
  return aiCallManager;
}