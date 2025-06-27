import { NextRequest, NextResponse } from 'next/server';
import TwitterApiService from '@/lib/services/twitter-api-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || '783214'; // デフォルトは@X
    const days = parseInt(searchParams.get('days') || '30');

    const twitterService = new TwitterApiService();
    
    // 警告: Rate Limit消費の多いフル分析
    const analytics = await twitterService.getAnalytics(userId, days);

    return NextResponse.json({
      success: true,
      data: analytics,
      metadata: {
        generatedAt: new Date().toISOString(),
        userId,
        period: days,
        warning: 'このエンドポイントはRate Limitを多く消費します',
        rateLimitUsed: {
          userInfo: '1回 (/users/{id})',
          tweets: '1回 (/users/{id}/tweets) - 75回/15分制限'
        }
      },
    });

  } catch (error) {
    console.error('Twitter Full Analytics API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      code: 'TWITTER_FULL_API_ERROR',
      suggestion: '軽量版（/api/social-analytics/test/twitter-light）の使用を検討してください'
    }, { status: 500 });
  }
}