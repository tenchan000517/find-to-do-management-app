import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 環境変数の確認
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    
    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: 'INSTAGRAM_ACCESS_TOKEN環境変数が設定されていません',
        instructions: [
          '1. Meta for Developersでアプリを作成',
          '2. Instagram Basic Display製品を追加',
          '3. アクセストークンを取得（OAuth2フロー）',
          '4. .env.localファイルにINSTAGRAM_ACCESS_TOKEN=your_token_hereを追加'
        ],
        authFlow: {
          step1: 'https://api.instagram.com/oauth/authorize?client_id={app_id}&redirect_uri={redirect_uri}&scope=user_profile,user_media&response_type=code',
          step2: 'コードを使ってアクセストークンを取得',
          step3: '長期間有効なトークンに交換（60日間有効）'
        }
      });
    }

    // Instagram Basic Display API - ユーザープロフィール取得
    const profileResponse = await fetch(
      `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${accessToken}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!profileResponse.ok) {
      const errorData = await profileResponse.text();
      return NextResponse.json({
        success: false,
        error: `Instagram API Error: ${profileResponse.status} ${profileResponse.statusText}`,
        details: errorData,
        troubleshooting: [
          'アクセストークンが正しいか確認',
          'トークンの有効期限を確認（60日間）',
          'アプリの権限設定を確認',
          'Instagram Basic Display製品が有効か確認'
        ]
      });
    }

    const userProfile = await profileResponse.json();

    // Instagram Basic Display API - メディア取得（最新5件）
    const mediaResponse = await fetch(
      `https://graph.instagram.com/me/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp&limit=5&access_token=${accessToken}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    let mediaData = null;
    if (mediaResponse.ok) {
      mediaData = await mediaResponse.json();
    }

    // Instagram Graph API（ビジネスアカウント用）のインサイトは別途実装が必要
    const businessApiNote = {
      note: "より詳細なインサイト（リーチ、インプレッション、エンゲージメント）を取得するには",
      requirements: [
        "Instagramビジネスアカウントまたはクリエイターアカウント",
        "Facebookページとの連携",
        "Instagram Graph APIの使用",
        "より高度な権限の取得"
      ]
    };

    return NextResponse.json({
      success: true,
      message: 'Instagram Basic Display API接続テスト成功！',
      data: {
        profile: userProfile,
        media: mediaData?.data || [],
        paging: mediaData?.paging || null
      },
      availableMetrics: {
        basicDisplay: [
          'ユーザーID (id)',
          'ユーザー名 (username)',
          'アカウントタイプ (account_type)',
          'メディア数 (media_count)',
          '投稿データ（画像、動画、キャプション、投稿日時）'
        ],
        businessInsights: [
          'リーチ数（Instagram Graph API必要）',
          'インプレッション数（Instagram Graph API必要）',
          'エンゲージメント数（Instagram Graph API必要）',
          'フォロワー数の推移（Instagram Graph API必要）'
        ]
      },
      limitations: {
        basicDisplay: [
          'フォロワー数は取得不可',
          'いいね数・コメント数は取得不可',
          'インサイトデータは取得不可',
          'リーチ・インプレッションは取得不可'
        ]
      },
      businessApiNote,
      nextSteps: [
        'Instagramビジネスアカウントに変更',
        'Facebookページとの連携',
        'Instagram Graph APIの実装',
        'より詳細なインサイトデータの取得'
      ]
    });

  } catch (error) {
    console.error('Instagram API Test Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Instagram API接続テストでエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error',
      commonIssues: [
        'インターネット接続を確認',
        'アクセストークンの形式を確認',
        'トークンの有効期限を確認（60日間）',
        'Instagram Basic Display製品の設定を確認'
      ]
    });
  }
}