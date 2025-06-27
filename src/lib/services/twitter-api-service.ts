interface TwitterUserMetrics {
  followers_count: number;
  following_count: number;
  tweet_count: number;
  listed_count: number;
  like_count: number;
  media_count?: number;
}

interface TwitterUser {
  id: string;
  username: string;
  name: string;
  description?: string;
  verified?: boolean;
  created_at: string;
  public_metrics: TwitterUserMetrics;
}

interface TwitterTweetMetrics {
  retweet_count: number;
  reply_count: number;
  like_count: number;
  quote_count: number;
  bookmark_count: number;
  impression_count?: number;
}

interface TwitterTweet {
  id: string;
  text: string;
  created_at: string;
  public_metrics: TwitterTweetMetrics;
  context_annotations?: Array<{
    domain: { id: string; name: string; description: string };
    entity: { id: string; name: string };
  }>;
  edit_history_tweet_ids?: string[];
}

interface TwitterApiResponse<T> {
  data: T;
  meta?: {
    result_count: number;
    newest_id: string;
    oldest_id: string;
    next_token?: string;
  };
}

class TwitterApiService {
  private bearerToken: string;
  private baseUrl = 'https://api.twitter.com/2';

  constructor() {
    const token = process.env.TWITTER_BEARER_TOKEN;
    if (!token) {
      throw new Error('TWITTER_BEARER_TOKEN environment variable is required');
    }
    this.bearerToken = token;
  }

  private async makeRequest<T>(endpoint: string): Promise<TwitterApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.bearerToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // Rate Limit の詳細情報を含めて返す
      if (response.status === 429) {
        const resetTime = response.headers.get('x-rate-limit-reset');
        const remaining = response.headers.get('x-rate-limit-remaining');
        const limit = response.headers.get('x-rate-limit-limit');
        
        throw new Error(`Rate Limit Exceeded (429): ${limit}リクエスト/15分の制限に達しました。残り: ${remaining}。リセット時刻: ${resetTime ? new Date(parseInt(resetTime) * 1000).toLocaleString('ja-JP') : '不明'}`);
      }
      
      throw new Error(`Twitter API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async getUserByUsername(username: string): Promise<TwitterUser> {
    const response = await this.makeRequest<TwitterUser>(
      `/users/by/username/${username}?user.fields=public_metrics,created_at,description,verified`
    );
    return response.data;
  }

  async getUserById(userId: string): Promise<TwitterUser> {
    const response = await this.makeRequest<TwitterUser>(
      `/users/${userId}?user.fields=public_metrics,created_at,description,verified`
    );
    return response.data;
  }

  async getUserTweets(
    userId: string, 
    options: {
      maxResults?: number;
      startTime?: string;
      endTime?: string;
      paginationToken?: string;
    } = {}
  ): Promise<TwitterApiResponse<TwitterTweet[]>> {
    const params = new URLSearchParams({
      'tweet.fields': 'public_metrics,created_at,context_annotations',
      'max_results': (options.maxResults || 10).toString(),
    });

    if (options.startTime) params.append('start_time', options.startTime);
    if (options.endTime) params.append('end_time', options.endTime);
    if (options.paginationToken) params.append('pagination_token', options.paginationToken);

    return this.makeRequest<TwitterTweet[]>(`/users/${userId}/tweets?${params}`);
  }

  async getRecentTweets(
    userId: string,
    days: number = 30
  ): Promise<TwitterTweet[]> {
    const endTime = new Date().toISOString();
    const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const response = await this.getUserTweets(userId, {
      maxResults: 100,
      startTime,
      endTime,
    });

    return response.data || [];
  }

  calculateEngagementMetrics(tweets: TwitterTweet[]) {
    if (!tweets.length) return null;

    const totalMetrics = tweets.reduce(
      (acc, tweet) => {
        const metrics = tweet.public_metrics;
        return {
          totalTweets: acc.totalTweets + 1,
          totalImpressions: acc.totalImpressions + (metrics.impression_count || 0),
          totalEngagements: acc.totalEngagements + 
            metrics.like_count + 
            metrics.retweet_count + 
            metrics.reply_count + 
            metrics.quote_count,
          totalLikes: acc.totalLikes + metrics.like_count,
          totalRetweets: acc.totalRetweets + metrics.retweet_count,
          totalReplies: acc.totalReplies + metrics.reply_count,
          totalQuotes: acc.totalQuotes + metrics.quote_count,
          totalBookmarks: acc.totalBookmarks + metrics.bookmark_count,
        };
      },
      {
        totalTweets: 0,
        totalImpressions: 0,
        totalEngagements: 0,
        totalLikes: 0,
        totalRetweets: 0,
        totalReplies: 0,
        totalQuotes: 0,
        totalBookmarks: 0,
      }
    );

    const avgEngagementRate = totalMetrics.totalImpressions > 0 
      ? (totalMetrics.totalEngagements / totalMetrics.totalImpressions) * 100 
      : 0;

    return {
      ...totalMetrics,
      avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
      avgEngagementsPerTweet: Math.round(totalMetrics.totalEngagements / totalMetrics.totalTweets),
      avgImpressionsPerTweet: Math.round(totalMetrics.totalImpressions / totalMetrics.totalTweets),
    };
  }

  async getAnalytics(userId: string, days: number = 30) {
    try {
      const [user, tweets] = await Promise.all([
        this.getUserById(userId),
        this.getRecentTweets(userId, days),
      ]);

      const metrics = this.calculateEngagementMetrics(tweets);

      return {
        user,
        tweets,
        metrics,
        period: {
          days,
          startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Twitter Analytics Error:', error);
      throw error;
    }
  }
}

export default TwitterApiService;
export type { TwitterUser, TwitterTweet, TwitterUserMetrics, TwitterTweetMetrics };