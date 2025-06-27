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

    // 複数のエンドポイントのRate Limit情報を取得
    const endpoints = [
      {
        name: 'users_lookup',
        url: 'https://api.twitter.com/2/users/783214?user.fields=public_metrics',
        description: '/users/{id} エンドポイント'
      },
      {
        name: 'users_by_username',
        url: 'https://api.twitter.com/2/users/by/username/X?user.fields=public_metrics',
        description: '/users/by/username/{username} エンドポイント'
      }
    ];

    const results: any = {
      success: true,
      timestamp: new Date().toISOString(),
      bearer_token_prefix: bearerToken.substring(0, 20) + '...',
      endpoints: {}
    };

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint.url, {
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Content-Type': 'application/json',
          },
        });

        // Rate Limit情報を詳細に取得
        const rateLimitInfo = {
          status: response.status,
          statusText: response.statusText,
          headers: {
            remaining: response.headers.get('x-rate-limit-remaining'),
            limit: response.headers.get('x-rate-limit-limit'),
            reset: response.headers.get('x-rate-limit-reset'),
            resource: response.headers.get('x-rate-limit-resource'),
          },
          responseOk: response.ok
        };

        // リセット時刻を変換
        if (rateLimitInfo.headers.reset) {
          const resetTime = new Date(parseInt(rateLimitInfo.headers.reset) * 1000);
          rateLimitInfo.headers.resetTimeJST = resetTime.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
          rateLimitInfo.headers.minutesUntilReset = Math.ceil((resetTime.getTime() - Date.now()) / 60000);
        }

        // レスポンスデータ（エラーの場合のみ）
        if (!response.ok) {
          const errorText = await response.text();
          rateLimitInfo.errorBody = errorText;
        } else {
          const data = await response.json();
          rateLimitInfo.successData = {
            userId: data.data?.id,
            username: data.data?.username,
            dataReceived: true
          };
        }

        results.endpoints[endpoint.name] = {
          description: endpoint.description,
          url: endpoint.url,
          rateLimitInfo
        };

      } catch (error) {
        results.endpoints[endpoint.name] = {
          description: endpoint.description,
          url: endpoint.url,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Debug Headers Error:', error);
    return NextResponse.json({
      success: false,
      error: 'デバッグ情報取得でエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}