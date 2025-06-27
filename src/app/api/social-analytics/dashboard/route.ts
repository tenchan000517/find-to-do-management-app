import { NextRequest, NextResponse } from 'next/server';
import TwitterApiService from '@/lib/services/twitter-api-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get('platform') || 'all'; // 'twitter', 'instagram', 'all'
    const days = parseInt(searchParams.get('days') || '30');
    
    // デフォルトアカウント（後で設定可能にする）
    const twitterUserId = searchParams.get('twitterUserId') || '783214'; // @X
    
    const results: any = {
      success: true,
      data: {},
      metadata: {
        generatedAt: new Date().toISOString(),
        platform,
        period: days,
      },
    };

    // Twitter データ取得（軽量版 - ユーザー情報のみ）
    if (platform === 'all' || platform === 'twitter') {
      try {
        const twitterService = new TwitterApiService();
        // Rate Limit節約のため、ユーザー情報のみ取得
        const user = await twitterService.getUserById(twitterUserId);
        
        results.data.twitter = {
          user,
          platform: 'twitter',
          note: 'ユーザー情報のみ（Rate Limit節約モード）',
          metrics: null, // ツイートデータは個別テストで取得
        };
      } catch (error) {
        console.error('Twitter API Error:', error);
        results.data.twitter = {
          error: error instanceof Error ? error.message : 'Twitter API Error',
          platform: 'twitter',
        };
      }
    }

    // Instagram データ取得（今後実装）
    if (platform === 'all' || platform === 'instagram') {
      results.data.instagram = {
        error: 'Instagram API未実装',
        platform: 'instagram',
        note: 'Instagram Graph APIまたはBasic Display APIの実装が必要',
      };
    }

    // 統合メトリクス計算
    const summary = calculateSummaryMetrics(results.data);
    results.data.summary = summary;

    return NextResponse.json(results);

  } catch (error) {
    console.error('Social Analytics Dashboard Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      code: 'DASHBOARD_API_ERROR',
    }, { status: 500 });
  }
}

function calculateSummaryMetrics(data: any) {
  const summary = {
    totalFollowers: 0,
    totalEngagements: 0,
    totalImpressions: 0,
    totalPosts: 0,
    platforms: [] as string[],
    avgEngagementRate: 0,
  };

  // Twitter メトリクス
  if (data.twitter && !data.twitter.error) {
    const twitter = data.twitter;
    summary.totalFollowers += twitter.user.public_metrics.followers_count;
    summary.totalPosts += twitter.user.public_metrics.tweet_count;
    summary.platforms.push('Twitter');
    
    if (twitter.metrics) {
      summary.totalEngagements += twitter.metrics.totalEngagements;
      summary.totalImpressions += twitter.metrics.totalImpressions;
    }
  }

  // Instagram メトリクス（今後追加）
  if (data.instagram && !data.instagram.error) {
    // Instagram データの処理
    summary.platforms.push('Instagram');
  }

  // 平均エンゲージメント率計算
  if (summary.totalImpressions > 0) {
    summary.avgEngagementRate = Math.round(
      (summary.totalEngagements / summary.totalImpressions) * 10000
    ) / 100;
  }

  return summary;
}