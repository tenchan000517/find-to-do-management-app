import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    
    console.log(`🔍 Rate Limit Check Started:`, {
      timestamp: new Date().toISOString(),
      bearerTokenPresent: !!bearerToken,
      bearerTokenPrefix: bearerToken ? bearerToken.substring(0, 20) + '...' : 'N/A'
    });
    
    if (!bearerToken) {
      return NextResponse.json({
        success: false,
        error: 'TWITTER_BEARER_TOKEN環境変数が設定されていません'
      });
    }

    // 軽量なエンドポイントでRate Limit情報を確認
    const testUrl = 'https://api.twitter.com/2/users/by/username/twitter';
    console.log(`🔍 Rate Limit Check URL: ${testUrl}`);
    
    const response = await fetch(testUrl, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Rate Limit情報を取得
    const rateLimitInfo = {
      remaining: response.headers.get('x-rate-limit-remaining'),
      limit: response.headers.get('x-rate-limit-limit'),
      reset: response.headers.get('x-rate-limit-reset'),
      resource: response.headers.get('x-rate-limit-resource'),
      status: response.status,
    };

    console.log(`📊 Rate Limit Check Headers:`, {
      status: response.status,
      statusText: response.statusText,
      rateLimitInfo,
      allHeaders: Object.fromEntries([...response.headers.entries()])
    });

    // リセット時刻を日本時間に変換
    const resetTime = rateLimitInfo.reset 
      ? new Date(parseInt(rateLimitInfo.reset) * 1000)
      : null;

    if (response.status === 429) {
      return NextResponse.json({
        success: false,
        error: 'Rate Limit Exceeded',
        rateLimitInfo: {
          ...rateLimitInfo,
          resetTimeJST: resetTime?.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
          minutesUntilReset: resetTime ? Math.ceil((resetTime.getTime() - Date.now()) / 60000) : null,
        }
      });
    }

    const userData = response.ok ? await response.json() : null;

    return NextResponse.json({
      success: true,
      message: 'Rate Limit確認完了',
      rateLimitInfo: {
        ...rateLimitInfo,
        resetTimeJST: resetTime?.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
        minutesUntilReset: resetTime ? Math.ceil((resetTime.getTime() - Date.now()) / 60000) : null,
      },
      testData: userData ? {
        username: userData.data?.username,
        id: userData.data?.id,
      } : null,
    });

  } catch (error) {
    console.error('Rate Limit Check Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Rate Limit確認でエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}