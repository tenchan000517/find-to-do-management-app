import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username') || 'twitterapi'; // デフォルトを確実に存在するアカウントに
    
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    
    console.log(`🔍 Getting User ID for: @${username}`);
    
    if (!bearerToken) {
      return NextResponse.json({
        success: false,
        error: 'TWITTER_BEARER_TOKEN環境変数が設定されていません'
      });
    }

    const response = await fetch(
      `https://api.twitter.com/2/users/by/username/${username}?user.fields=id,username,name,public_metrics,created_at,description,verified`,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const rateLimitInfo = {
      remaining: response.headers.get('x-rate-limit-remaining'),
      limit: response.headers.get('x-rate-limit-limit'),
      reset: response.headers.get('x-rate-limit-reset'),
    };

    console.log(`📊 User ID API Rate Limit:`, rateLimitInfo);

    if (!response.ok) {
      const errorText = await response.text();
      
      return NextResponse.json({
        success: false,
        error: `Twitter API Error: ${response.status} ${response.statusText}`,
        details: errorText,
        rateLimitInfo,
        suggestion: response.status === 429 
          ? 'Rate Limit到達。15分後に再試行してください。' 
          : 'ユーザー名を確認してください。'
      });
    }

    const userData = await response.json();
    
    console.log(`✅ User ID取得成功:`, {
      username: userData.data.username,
      userId: userData.data.id,
      name: userData.data.name
    });

    return NextResponse.json({
      success: true,
      message: `@${username} のユーザーID取得成功！`,
      data: {
        userId: userData.data.id,
        username: userData.data.username,
        name: userData.data.name,
        followers: userData.data.public_metrics?.followers_count,
        verified: userData.data.verified,
        createdAt: userData.data.created_at,
        description: userData.data.description
      },
      rateLimitInfo,
      envUpdate: {
        message: '.env.localに以下を追加してください：',
        line: `TWITTER_TEST_USER_ID=${userData.data.id}`
      }
    });

  } catch (error) {
    console.error('User ID取得エラー:', error);
    return NextResponse.json({
      success: false,
      error: 'ユーザーID取得でエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}