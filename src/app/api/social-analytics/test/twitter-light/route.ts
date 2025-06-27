import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    
    if (!bearerToken) {
      return NextResponse.json({
        success: false,
        error: 'TWITTER_BEARER_TOKEN環境変数が設定されていません'
      });
    }

    // 軽量テスト: 1回のAPIコールのみ
    const testUserId = process.env.TWITTER_TEST_USER_ID || '783214'; // @X
    
    const response = await fetch(
      `https://api.twitter.com/2/users/${testUserId}?user.fields=public_metrics,created_at,description,verified`,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Rate Limit情報を取得
    const rateLimitInfo = {
      remaining: response.headers.get('x-rate-limit-remaining'),
      limit: response.headers.get('x-rate-limit-limit'),
      reset: response.headers.get('x-rate-limit-reset'),
      endpoint: '/users/{id}',
    };

    const resetTime = rateLimitInfo.reset 
      ? new Date(parseInt(rateLimitInfo.reset) * 1000)
      : null;

    if (!response.ok) {
      const errorData = await response.text();
      
      return NextResponse.json({
        success: false,
        error: `Twitter API Error: ${response.status} ${response.statusText}`,
        details: errorData,
        rateLimitInfo: {
          ...rateLimitInfo,
          resetTimeJST: resetTime?.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
          minutesUntilReset: resetTime ? Math.ceil((resetTime.getTime() - Date.now()) / 60000) : null,
        },
        troubleshooting: [
          'Bearer Tokenが正しいか確認',
          'ユーザーID (783214) が存在するか確認',
          'API利用制限に達していないか確認'
        ]
      });
    }

    const userData = await response.json();

    return NextResponse.json({
      success: true,
      message: '軽量Twitter API接続テスト成功！',
      data: {
        user: userData.data,
        testUserId,
      },
      rateLimitInfo: {
        ...rateLimitInfo,
        resetTimeJST: resetTime?.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
        minutesUntilReset: resetTime ? Math.ceil((resetTime.getTime() - Date.now()) / 60000) : null,
      },
      apiCallsSummary: {
        totalApiCalls: 1,
        endpoint: `/users/${testUserId}`,
        rateLimitConsumed: '1リクエスト（軽量テスト）',
        recommendation: 'この軽量テストでRate Limit使用量を節約'
      },
      nextSteps: [
        'Rate Limitに問題がなければフルテストを実行',
        '実際のユーザーIDを設定してテスト',
        'ツイートデータが必要な場合は /test/twitter を使用'
      ]
    });

  } catch (error) {
    console.error('Twitter Light Test Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Twitter軽量接続テストでエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}