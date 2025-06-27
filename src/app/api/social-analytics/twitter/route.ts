import { NextRequest, NextResponse } from 'next/server';
import TwitterApiService from '@/lib/services/twitter-api-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || '783214'; // デフォルトは@X
    const days = parseInt(searchParams.get('days') || '30');

    const twitterService = new TwitterApiService();
    const analytics = await twitterService.getAnalytics(userId, days);

    return NextResponse.json({
      success: true,
      data: analytics,
      metadata: {
        generatedAt: new Date().toISOString(),
        userId,
        period: days,
      },
    });

  } catch (error) {
    console.error('Twitter Analytics API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      code: 'TWITTER_API_ERROR',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, username, days = 30 } = body;

    if (!userId && !username) {
      return NextResponse.json({
        success: false,
        error: 'userId または username が必要です',
        code: 'MISSING_IDENTIFIER',
      }, { status: 400 });
    }

    const twitterService = new TwitterApiService();
    
    let user;
    if (username) {
      user = await twitterService.getUserByUsername(username);
    } else {
      user = await twitterService.getUserById(userId);
    }

    const analytics = await twitterService.getAnalytics(user.id, days);

    return NextResponse.json({
      success: true,
      data: analytics,
      metadata: {
        generatedAt: new Date().toISOString(),
        userId: user.id,
        username: user.username,
        period: days,
      },
    });

  } catch (error) {
    console.error('Twitter Analytics API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      code: 'TWITTER_API_ERROR',
    }, { status: 500 });
  }
}