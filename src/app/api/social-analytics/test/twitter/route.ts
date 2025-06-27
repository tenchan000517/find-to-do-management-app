import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 環境変数の確認
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    
    if (!bearerToken) {
      return NextResponse.json({
        success: false,
        error: 'TWITTER_BEARER_TOKEN環境変数が設定されていません',
        instructions: [
          '1. Twitter Developer Portalでアプリを作成',
          '2. Bearer Tokenを取得',
          '3. .env.localファイルにTWITTER_BEARER_TOKEN=your_token_hereを追加'
        ]
      });
    }

    // Twitter API v2 - ユーザー情報取得テスト
    // ユーザー名から直接取得（IDより制限が緩い）
    const testUsername = process.env.TWITTER_TEST_USERNAME || 'TENCHAN_0517';
    console.log(`🎯 Twitter Test - Using Username: @${testUsername}`);
    
    const response = await fetch(
      `https://api.twitter.com/2/users/by/username/${testUsername}?user.fields=id,public_metrics,created_at,description,verified`,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Rate Limit情報を常に取得
    const rateLimitInfo = {
      remaining: response.headers.get('x-rate-limit-remaining'),
      limit: response.headers.get('x-rate-limit-limit'),
      reset: response.headers.get('x-rate-limit-reset'),
    };
    
    console.log(`📊 Twitter Test - User API Response:`, {
      status: response.status,
      statusText: response.statusText,
      rateLimitInfo
    });

    if (!response.ok) {
      const errorData = await response.text();
      
      return NextResponse.json({
        success: false,
        error: `Twitter API Error: ${response.status} ${response.statusText}`,
        details: errorData,
        rateLimitInfo,
        troubleshooting: [
          'Bearer Tokenが正しいか確認',
          'Twitter Developer Portalでアプリの権限を確認',
          'API利用制限に達していないか確認',
          `ユーザー名 (@${testUsername}) が正しいか確認`
        ]
      });
    }

    const userData = await response.json();

    // ユーザー情報が正常に取得できた場合のみツイート取得を実行
    let tweetsData = null;
    let tweetsError = null;
    
    if (userData.data && userData.data.id) {
      const userId = userData.data.id; // 取得したIDを使用
      try {
        const tweetsResponse = await fetch(
          `https://api.twitter.com/2/users/${userId}/tweets?max_results=5&tweet.fields=public_metrics,created_at,context_annotations`,
          {
            headers: {
              'Authorization': `Bearer ${bearerToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (tweetsResponse.ok) {
          tweetsData = await tweetsResponse.json();
        } else {
          const errorText = await tweetsResponse.text();
          tweetsError = `Tweets API Error: ${tweetsResponse.status} ${tweetsResponse.statusText} - ${errorText}`;
        }
      } catch (error) {
        tweetsError = `Tweets取得でエラー: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    } else {
      tweetsError = 'ユーザー情報が不完全なため、ツイート取得をスキップしました';
    }

    return NextResponse.json({
      success: true,
      message: 'Twitter API接続テスト成功！',
      data: {
        user: userData.data,
        tweets: tweetsData?.data || [],
        meta: tweetsData?.meta || {},
        tweetsError: tweetsError || null
      },
      rateLimitInfo,
      apiCallsSummary: {
        userInfoCall: '✅ 成功',
        tweetsCall: tweetsError ? `❌ ${tweetsError}` : '✅ 成功',
        totalApiCalls: tweetsError ? 1 : 2,
        rateLimitConsumed: tweetsError ? '1リクエスト' : '2リクエスト'
      },
      availableMetrics: {
        user: [
          'フォロワー数 (followers_count)',
          'フォロー数 (following_count)',
          'ツイート数 (tweet_count)',
          'いいね数 (like_count)'
        ],
        tweets: [
          'リツイート数 (retweet_count)',
          'いいね数 (like_count)',
          '返信数 (reply_count)',
          '引用ツイート数 (quote_count)',
          'インプレッション数 (impression_count) - 有料プランのみ'
        ]
      },
      nextSteps: [
        '実際のアカウントIDを設定',
        'より多くのツイートデータを取得',
        'アナリティクスメトリクスの取得（有料プランが必要）'
      ]
    });

  } catch (error) {
    console.error('Twitter API Test Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Twitter API接続テストでエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error',
      commonIssues: [
        'インターネット接続を確認',
        'Bearer Tokenの形式を確認',
        'Twitter APIの利用制限を確認'
      ]
    });
  }
}