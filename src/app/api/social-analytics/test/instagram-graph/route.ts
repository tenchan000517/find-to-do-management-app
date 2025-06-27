import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Instagram Graph API用の環境変数
    const accessToken = process.env.INSTAGRAM_GRAPH_ACCESS_TOKEN;
    const instagramBusinessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    
    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: 'INSTAGRAM_GRAPH_ACCESS_TOKEN環境変数が設定されていません',
        setupInstructions: {
          step1: 'Meta for Developersでアプリを作成',
          step2: 'Instagram Graph API製品を追加',
          step3: 'Instagramビジネスアカウントに変更',
          step4: 'Facebookページと連携',
          step5: 'アクセストークンを取得',
          step6: '.env.localに以下を追加',
          envVars: [
            'INSTAGRAM_GRAPH_ACCESS_TOKEN=your_access_token',
            'INSTAGRAM_BUSINESS_ACCOUNT_ID=your_business_account_id'
          ]
        }
      });
    }

    const results: any = {
      success: true,
      message: 'Instagram Graph API接続テスト',
      tests: {},
      availableEndpoints: []
    };

    // Test 1: ビジネスアカウント情報取得
    try {
      const accountResponse = await fetch(
        `https://graph.facebook.com/v17.0/me/accounts?access_token=${accessToken}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (accountResponse.ok) {
        const accountData = await accountResponse.json();
        results.tests.facebookPages = {
          success: true,
          data: accountData.data,
          note: 'Facebookページ一覧取得成功'
        };
      } else {
        const errorData = await accountResponse.text();
        results.tests.facebookPages = {
          success: false,
          error: `Facebook Pages API Error: ${accountResponse.status}`,
          details: errorData
        };
      }
    } catch (error) {
      results.tests.facebookPages = {
        success: false,
        error: 'Facebook Pages API接続エラー',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test 2: Instagram Business Account取得（PageIDが必要）
    if (results.tests.facebookPages.success && results.tests.facebookPages.data?.length > 0) {
      const pageId = results.tests.facebookPages.data[0].id;
      
      try {
        const igAccountResponse = await fetch(
          `https://graph.facebook.com/v17.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          }
        );

        if (igAccountResponse.ok) {
          const igAccountData = await igAccountResponse.json();
          results.tests.instagramAccount = {
            success: true,
            data: igAccountData,
            note: 'Instagramビジネスアカウント情報取得成功'
          };

          // Test 3: Instagram Account詳細情報
          if (igAccountData.instagram_business_account) {
            const igBusinessId = igAccountData.instagram_business_account.id;
            
            const detailResponse = await fetch(
              `https://graph.facebook.com/v17.0/${igBusinessId}?fields=id,username,name,followers_count,follows_count,media_count,profile_picture_url&access_token=${accessToken}`,
              {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
              }
            );

            if (detailResponse.ok) {
              const detailData = await detailResponse.json();
              results.tests.accountDetails = {
                success: true,
                data: detailData,
                note: 'Instagramアカウント詳細取得成功'
              };
            }
          }
        } else {
          const errorData = await igAccountResponse.text();
          results.tests.instagramAccount = {
            success: false,
            error: `Instagram Account API Error: ${igAccountResponse.status}`,
            details: errorData
          };
        }
      } catch (error) {
        results.tests.instagramAccount = {
          success: false,
          error: 'Instagram Account API接続エラー',
          details: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // 利用可能なエンドポイント情報
    results.availableEndpoints = [
      {
        endpoint: '/me/accounts',
        description: 'Facebookページ一覧取得',
        requiredScope: 'pages_read_engagement'
      },
      {
        endpoint: '/{page-id}?fields=instagram_business_account',
        description: 'Instagramビジネスアカウント取得',
        requiredScope: 'pages_read_engagement'
      },
      {
        endpoint: '/{ig-business-id}',
        description: 'Instagramアカウント詳細',
        fields: 'id,username,name,followers_count,follows_count,media_count',
        requiredScope: 'instagram_basic'
      },
      {
        endpoint: '/{ig-business-id}/media',
        description: 'Instagram投稿一覧',
        fields: 'id,caption,media_type,media_url,permalink,timestamp',
        requiredScope: 'instagram_basic'
      },
      {
        endpoint: '/{ig-business-id}/insights',
        description: 'Instagramインサイト',
        metrics: 'impressions,reach,profile_views,follower_count',
        requiredScope: 'read_insights'
      }
    ];

    results.nextSteps = [
      'Instagramアカウントをビジネスアカウントに変更',
      'Facebookページと連携',
      '適切なスコープでアクセストークンを取得',
      'INSTAGRAM_BUSINESS_ACCOUNT_IDを環境変数に設定'
    ];

    return NextResponse.json(results);

  } catch (error) {
    console.error('Instagram Graph API Test Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Instagram Graph API接続テストでエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error',
      documentation: 'https://developers.facebook.com/docs/instagram-api/'
    });
  }
}