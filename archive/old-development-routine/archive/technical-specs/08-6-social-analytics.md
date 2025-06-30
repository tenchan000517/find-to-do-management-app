# SNS分析機能 マニュアル

## 概要

SNS分析機能は、AI駆動のソーシャルメディア統合分析システムです。Twitter、Instagram、Discord統合分析、ソーシャルリスニング、インフルエンサー分析、エンゲージメント最適化、ブランド監視など、包括的なソーシャルメディアマーケティング支援を提供します。

### 主要特徴
- **マルチプラットフォーム統合分析**（Twitter、Instagram、Discord）
- **AI エンゲージメント最適化エンジン**
- **リアルタイムソーシャルリスニング**
- **インフルエンサー効果測定**
- **ブランド評判監視システム**

---

## 目次

1. [システムアーキテクチャ](#システムアーキテクチャ)
2. [マルチプラットフォーム統合](#マルチプラットフォーム統合)
3. [エンゲージメント分析](#エンゲージメント分析)
4. [ソーシャルリスニング](#ソーシャルリスニング)
5. [インフルエンサー分析](#インフルエンサー分析)
6. [ブランド監視機能](#ブランド監視機能)
7. [コンテンツ最適化](#コンテンツ最適化)
8. [実装例](#実装例)
9. [AI最適化機能](#ai最適化機能)
10. [トラブルシューティング](#トラブルシューティング)

---

## システムアーキテクチャ

### 全体構成

```javascript
// SNS分析システムの構成
const SocialAnalyticsArchitecture = {
  // プラットフォーム統合
  platformIntegrations: {
    twitter: 'TwitterAnalyticsService',
    instagram: 'InstagramAnalyticsService',
    discord: 'DiscordAnalyticsService',
    universal: 'UniversalSocialAnalyzer'
  },
  
  // 分析エンジン
  analysisEngines: {
    engagement: 'EngagementAnalyzer',
    sentiment: 'SentimentAnalysisEngine',
    influence: 'InfluencerAnalyzer',
    brand: 'BrandMonitoringEngine',
    content: 'ContentOptimizationEngine'
  },
  
  // UI・ダッシュボード
  dashboardComponents: {
    socialDashboard: 'social-analytics/page.tsx',
    platformOverview: 'PlatformOverviewCards',
    engagementChart: 'EngagementTrendChart',
    sentimentMeter: 'SentimentMeter',
    influencerRanking: 'InfluencerRankingPanel',
    brandMonitor: 'BrandMonitoringDashboard'
  }
};

// SocialAnalyticsPage のメイン構造
export default function SocialAnalyticsPage() {
  const {
    socialData,
    engagementMetrics,
    sentimentAnalysis,
    influencerData,
    brandMetrics,
    loading,
    error,
    refreshData,
    analyzeEngagement,
    updateSettings
  } = useSocialAnalytics();

  return (
    <div className="min-h-screen bg-gray-50">
      <SocialAnalyticsHeader />
      <PlatformSummaryCards data={socialData?.summary} />
      <SocialAnalyticsGrid 
        engagement={engagementMetrics}
        sentiment={sentimentAnalysis}
        influencer={influencerData}
        brand={brandMetrics}
      />
      <EngagementTrendChart data={engagementMetrics} />
      <SocialInsightsPanel insights={socialData?.insights} />
    </div>
  );
}
```

### データフロー

```javascript
// SNS分析データフロー管理
const SocialDataFlow = {
  // データ収集
  dataCollection: {
    twitter: 'Twitter API v2 統合',
    instagram: 'Instagram Graph API',
    discord: 'Discord Bot API',
    webhooks: 'リアルタイムWebhook受信'
  },
  
  // 分析処理
  analysisProcessing: {
    textAnalysis: 'テキスト感情分析',
    engagementCalculation: 'エンゲージメント率計算',
    influenceScoring: 'インフルエンス度スコア算出',
    trendDetection: 'トレンド検出アルゴリズム',
    anomalyDetection: '異常値検出システム'
  },
  
  // 結果配信
  resultDelivery: {
    dashboardUpdates: 'リアルタイムダッシュボード更新',
    alerts: 'ブランド監視アラート',
    reports: 'SNS成果レポート',
    recommendations: 'コンテンツ最適化提案'
  }
};
```

---

## マルチプラットフォーム統合

### Twitter 分析サービス

```javascript
// Twitter分析サービス
class TwitterAnalyticsService {
  constructor(googleAI) {
    this.ai = googleAI;
    this.model = 'gemini-1.5-flash';
    this.twitterClient = new TwitterClient();
  }

  async analyzeTwitterMetrics(accountId) {
    try {
      // Twitterデータ取得
      const twitterData = await this.getTwitterData(accountId);
      
      // エンゲージメント分析
      const engagementAnalysis = await this.analyzeEngagement(twitterData);
      
      // トレンド分析
      const trendAnalysis = await this.analyzeTrends(twitterData);
      
      // AI インサイト生成
      const insights = await this.generateTwitterInsights(twitterData, engagementAnalysis);
      
      return {
        metrics: {
          followers: twitterData.followers,
          engagement: engagementAnalysis.overall,
          impressions: twitterData.impressions,
          clicks: twitterData.clicks
        },
        trends: trendAnalysis,
        insights,
        recommendations: insights.recommendations,
        updatedAt: new Date()
      };
      
    } catch (error) {
      console.error('Twitter分析エラー:', error);
      throw new Error('Twitter分析に失敗しました');
    }
  }

  async analyzeEngagement(twitterData) {
    const prompt = `
    以下のTwitterデータを分析し、エンゲージメントパフォーマンスを評価してください：

    ツイートデータ:
    ${JSON.stringify(twitterData.tweets.slice(0, 50), null, 2)}

    メトリクス:
    - フォロワー数: ${twitterData.followers}
    - 総インプレッション: ${twitterData.totalImpressions}
    - 総エンゲージメント: ${twitterData.totalEngagements}
    - 平均エンゲージメント率: ${twitterData.avgEngagementRate}%

    以下の観点から分析してください：
    1. エンゲージメント率の評価
    2. 高パフォーマンスツイートの特徴
    3. 投稿時間別のパフォーマンス
    4. ハッシュタグ効果分析
    5. コンテンツタイプ別分析

    JSON形式で回答してください：
    {
      "overall": {
        "score": "総合スコア（0-100）",
        "level": "レベル（低/中/高）",
        "trend": "トレンド（改善/維持/悪化）"
      },
      "topPerformers": ["高パフォーマンスツイートの特徴"],
      "timeAnalysis": "最適投稿時間分析",
      "hashtagEffects": "ハッシュタグ効果分析",
      "contentTypePerformance": "コンテンツタイプ別パフォーマンス",
      "recommendations": ["改善提案"]
    }
    `;

    const result = await this.ai.generateContent(prompt);
    return JSON.parse(result.response.text());
  }

  async getTwitterData(accountId) {
    // Twitter API v2 でデータ取得
    const [
      userMetrics,
      tweets,
      analytics
    ] = await Promise.all([
      this.twitterClient.getUserMetrics(accountId),
      this.twitterClient.getRecentTweets(accountId, 100),
      this.twitterClient.getAnalytics(accountId)
    ]);

    return {
      followers: userMetrics.public_metrics.followers_count,
      following: userMetrics.public_metrics.following_count,
      tweets: tweets.data.map(tweet => ({
        id: tweet.id,
        text: tweet.text,
        created_at: tweet.created_at,
        public_metrics: tweet.public_metrics,
        context_annotations: tweet.context_annotations || []
      })),
      totalImpressions: analytics.impressions,
      totalEngagements: analytics.engagements,
      avgEngagementRate: (analytics.engagements / analytics.impressions * 100).toFixed(2)
    };
  }
}
```

### Instagram 分析サービス

```javascript
// Instagram分析サービス
class InstagramAnalyticsService {
  constructor(googleAI) {
    this.ai = googleAI;
    this.model = 'gemini-1.5-flash';
    this.instagramClient = new InstagramClient();
  }

  async analyzeInstagramMetrics(accountId) {
    try {
      // Instagramデータ取得
      const instagramData = await this.getInstagramData(accountId);
      
      // ビジュアルコンテンツ分析
      const visualAnalysis = await this.analyzeVisualContent(instagramData);
      
      // ストーリー分析
      const storyAnalysis = await this.analyzeStories(instagramData);
      
      // AI インサイト生成
      const insights = await this.generateInstagramInsights(instagramData, visualAnalysis);
      
      return {
        metrics: {
          followers: instagramData.followers,
          engagement: visualAnalysis.overall,
          reach: instagramData.reach,
          impressions: instagramData.impressions
        },
        visualAnalysis,
        storyAnalysis,
        insights,
        recommendations: insights.recommendations,
        updatedAt: new Date()
      };
      
    } catch (error) {
      console.error('Instagram分析エラー:', error);
      throw new Error('Instagram分析に失敗しました');
    }
  }

  async analyzeVisualContent(instagramData) {
    const prompt = `
    以下のInstagramコンテンツデータを分析し、ビジュアルパフォーマンスを評価してください：

    投稿データ:
    ${JSON.stringify(instagramData.posts.slice(0, 30), null, 2)}

    メトリクス:
    - フォロワー数: ${instagramData.followers}
    - 平均いいね数: ${instagramData.avgLikes}
    - 平均コメント数: ${instagramData.avgComments}
    - リーチ率: ${instagramData.avgReachRate}%

    以下の観点から分析してください：
    1. ビジュアルコンテンツの効果
    2. 色彩・構図のパフォーマンス分析
    3. キャプションとビジュアルの相関
    4. ハッシュタグ戦略の効果
    5. 投稿形式別（写真/動画/カルーセル）の比較

    JSON形式で回答してください：
    {
      "overall": {
        "score": "総合スコア（0-100）",
        "level": "レベル（低/中/高）",
        "trend": "トレンド（改善/維持/悪化）"
      },
      "visualInsights": "ビジュアル分析の洞察",
      "colorAnalysis": "色彩分析結果",
      "captionEffectiveness": "キャプション効果分析",
      "hashtagStrategy": "ハッシュタグ戦略評価",
      "formatPerformance": "投稿形式別パフォーマンス",
      "recommendations": ["改善提案"]
    }
    `;

    const result = await this.ai.generateContent(prompt);
    return JSON.parse(result.response.text());
  }
}
```

### Discord 分析サービス

```javascript
// Discord分析サービス
class DiscordAnalyticsService {
  constructor(googleAI) {
    this.ai = googleAI;
    this.model = 'gemini-1.5-flash';
    this.discordClient = new DiscordClient();
  }

  async analyzeDiscordCommunity(serverId) {
    try {
      // Discordデータ取得
      const discordData = await this.getDiscordData(serverId);
      
      // コミュニティ活動分析
      const communityAnalysis = await this.analyzeCommunityActivity(discordData);
      
      // エンゲージメント分析
      const engagementAnalysis = await this.analyzeDiscordEngagement(discordData);
      
      // AI インサイト生成
      const insights = await this.generateDiscordInsights(discordData, communityAnalysis);
      
      return {
        metrics: {
          members: discordData.totalMembers,
          activeMembers: discordData.activeMembers,
          messageVolume: discordData.messageVolume,
          engagement: engagementAnalysis.overall
        },
        communityAnalysis,
        engagementAnalysis,
        insights,
        recommendations: insights.recommendations,
        updatedAt: new Date()
      };
      
    } catch (error) {
      console.error('Discord分析エラー:', error);
      throw new Error('Discord分析に失敗しました');
    }
  }

  async analyzeCommunityActivity(discordData) {
    const prompt = `
    以下のDiscordコミュニティデータを分析し、コミュニティ活動を評価してください：

    サーバー情報:
    - 総メンバー数: ${discordData.totalMembers}
    - アクティブメンバー: ${discordData.activeMembers}
    - チャンネル数: ${discordData.channels.length}

    活動データ:
    ${JSON.stringify(discordData.activityData, null, 2)}

    メッセージ分析:
    ${JSON.stringify(discordData.messageAnalysis, null, 2)}

    以下の観点から分析してください：
    1. コミュニティの健全性評価
    2. メンバーエンゲージメントレベル
    3. チャンネル別活動パターン
    4. 時間帯別活動分析
    5. コミュニティ成長ペース

    JSON形式で回答してください：
    {
      "healthScore": "コミュニティ健全性スコア（0-100）",
      "engagementLevel": "エンゲージメントレベル（低/中/高）",
      "channelPerformance": "チャンネル別パフォーマンス分析",
      "activityPatterns": "活動パターン分析",
      "growthAnalysis": "成長分析",
      "recommendations": ["改善提案"]
    }
    `;

    const result = await this.ai.generateContent(prompt);
    return JSON.parse(result.response.text());
  }
}
```

### 統合ダッシュボード

```javascript
// プラットフォーム統合表示コンポーネント
export function PlatformOverviewCards({ socialData }) {
  const platforms = ['twitter', 'instagram', 'discord'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {platforms.map((platform) => (
        <Card key={platform} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <PlatformIcon platform={platform} className="w-6 h-6" />
              <h3 className="text-lg font-semibold capitalize">{platform}</h3>
            </div>
            <Badge variant={getPerformanceBadgeVariant(socialData[platform]?.performance)}>
              {socialData[platform]?.performance || 'N/A'}
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">フォロワー</span>
              <span className="font-medium">
                {formatNumber(socialData[platform]?.followers)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">エンゲージメント率</span>
              <span className="font-medium">
                {socialData[platform]?.engagementRate}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">今月の成長</span>
              <span className={`font-medium ${
                socialData[platform]?.growth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {socialData[platform]?.growth >= 0 ? '+' : ''}
                {socialData[platform]?.growth}%
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">最終更新</span>
              <Button variant="outline" size="sm">
                詳細表示
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
```

---

## エンゲージメント分析

### エンゲージメント分析エンジン

```javascript
// エンゲージメント分析エンジン
class EngagementAnalyzer {
  constructor(googleAI) {
    this.ai = googleAI;
    this.model = 'gemini-1.5-flash';
  }

  async analyzeMultiPlatformEngagement(platformsData) {
    try {
      // 各プラットフォームの統合分析
      const crossPlatformAnalysis = await this.performCrossPlatformAnalysis(platformsData);
      
      // エンゲージメント最適化提案
      const optimizationSuggestions = await this.generateOptimizationSuggestions(crossPlatformAnalysis);
      
      // オーディエンス分析
      const audienceInsights = await this.analyzeAudienceEngagement(platformsData);
      
      return {
        crossPlatformMetrics: crossPlatformAnalysis.metrics,
        engagementTrends: crossPlatformAnalysis.trends,
        optimizationSuggestions,
        audienceInsights,
        recommendations: optimizationSuggestions.recommendations,
        updatedAt: new Date()
      };
      
    } catch (error) {
      console.error('エンゲージメント分析エラー:', error);
      throw new Error('エンゲージメント分析に失敗しました');
    }
  }

  async performCrossPlatformAnalysis(platformsData) {
    const prompt = `
    以下のマルチプラットフォームデータを分析し、統合エンゲージメント分析を実行してください：

    Twitter データ:
    ${JSON.stringify(platformsData.twitter, null, 2)}

    Instagram データ:
    ${JSON.stringify(platformsData.instagram, null, 2)}

    Discord データ:
    ${JSON.stringify(platformsData.discord, null, 2)}

    以下の観点から分析してください：
    1. プラットフォーム間のエンゲージメント比較
    2. オーディエンスの重複・固有性分析
    3. コンテンツタイプ別の効果分析
    4. 時間軸でのクロスプラットフォーム連携効果
    5. 統合戦略の最適化ポイント

    JSON形式で回答してください：
    {
      "metrics": {
        "overallEngagement": "統合エンゲージメント率",
        "platformComparison": "プラットフォーム別比較",
        "audienceOverlap": "オーディエンス重複分析"
      },
      "trends": {
        "engagementTrend": "エンゲージメントトレンド",
        "platformGrowth": "プラットフォーム別成長",
        "seasonality": "季節性分析"
      },
      "insights": ["重要な洞察"],
      "opportunities": ["改善機会"]
    }
    `;

    const result = await this.ai.generateContent(prompt);
    return JSON.parse(result.response.text());
  }
}
```

### エンゲージメントトレンドチャート

```javascript
// エンゲージメントトレンド表示
export function EngagementTrendChart({ engagementData }) {
  const [timeRange, setTimeRange] = React.useState('7d');
  const [platforms, setPlatforms] = React.useState(['twitter', 'instagram', 'discord']);

  const chartData = React.useMemo(() => {
    return engagementData?.trends?.filter(item => 
      platforms.includes(item.platform)
    ) || [];
  }, [engagementData, platforms]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">エンゲージメントトレンド</h3>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24時間</SelectItem>
              <SelectItem value="7d">7日間</SelectItem>
              <SelectItem value="30d">30日間</SelectItem>
              <SelectItem value="90d">90日間</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline">
            エクスポート
          </Button>
        </div>
      </div>

      {/* プラットフォーム選択 */}
      <div className="flex items-center space-x-4 mb-4">
        <span className="text-sm font-medium">表示プラットフォーム:</span>
        {['twitter', 'instagram', 'discord'].map((platform) => (
          <label key={platform} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={platforms.includes(platform)}
              onChange={(e) => {
                if (e.target.checked) {
                  setPlatforms([...platforms, platform]);
                } else {
                  setPlatforms(platforms.filter(p => p !== platform));
                }
              }}
              className="rounded"
            />
            <span className="text-sm capitalize">{platform}</span>
            <div className={`w-3 h-3 rounded-full bg-${getPlatformColor(platform)}-500`} />
          </label>
        ))}
      </div>

      {/* チャート */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => format(new Date(date), 'MM/dd')}
            />
            <YAxis 
              label={{ value: 'エンゲージメント率 (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              labelFormatter={(date) => format(new Date(date), 'yyyy/MM/dd HH:mm')}
              formatter={(value, name) => [`${value}%`, name]}
            />
            <Legend />
            {platforms.map((platform) => (
              <Line
                key={platform}
                type="monotone"
                dataKey={`${platform}_engagement`}
                stroke={getPlatformColor(platform, 'hex')}
                strokeWidth={2}
                dot={{ r: 3 }}
                name={platform.charAt(0).toUpperCase() + platform.slice(1)}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* トレンド分析サマリー */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="text-sm font-medium text-blue-800">平均エンゲージメント率</div>
          <div className="text-xl font-bold text-blue-900">
            {engagementData?.summary?.averageEngagement}%
          </div>
          <div className="text-xs text-blue-600">
            前期比: {engagementData?.summary?.engagementChange >= 0 ? '+' : ''}
            {engagementData?.summary?.engagementChange}%
          </div>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="text-sm font-medium text-green-800">最高パフォーマンス</div>
          <div className="text-xl font-bold text-green-900">
            {engagementData?.summary?.bestPlatform}
          </div>
          <div className="text-xs text-green-600">
            {engagementData?.summary?.bestEngagement}% エンゲージメント
          </div>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg">
          <div className="text-sm font-medium text-purple-800">改善機会</div>
          <div className="text-xl font-bold text-purple-900">
            {engagementData?.summary?.improvementPlatform}
          </div>
          <div className="text-xs text-purple-600">
            +{engagementData?.summary?.improvementPotential}% ポテンシャル
          </div>
        </div>
      </div>
    </Card>
  );
}
```

---

## ソーシャルリスニング

### リアルタイムソーシャルリスニングエンジン

```javascript
// ソーシャルリスニングエンジン
class SocialListeningEngine {
  constructor(googleAI) {
    this.ai = googleAI;
    this.model = 'gemini-1.5-flash';
    this.keywords = [];
    this.platforms = ['twitter', 'instagram', 'reddit', 'youtube'];
  }

  async startSocialListening(keywords, options = {}) {
    try {
      // キーワード設定
      this.keywords = keywords;
      
      // リスニング開始
      const listeningResults = await this.performSocialListening(keywords, options);
      
      // 感情分析
      const sentimentAnalysis = await this.analyzeSentiment(listeningResults);
      
      // トレンド検出
      const trendAnalysis = await this.detectTrends(listeningResults);
      
      // アラート生成
      const alerts = await this.generateAlerts(listeningResults, sentimentAnalysis);
      
      return {
        mentions: listeningResults.mentions,
        sentiment: sentimentAnalysis,
        trends: trendAnalysis,
        alerts,
        insights: await this.generateListeningInsights(listeningResults, sentimentAnalysis),
        updatedAt: new Date()
      };
      
    } catch (error) {
      console.error('ソーシャルリスニングエラー:', error);
      throw new Error('ソーシャルリスニングに失敗しました');
    }
  }

  async performSocialListening(keywords, options) {
    const mentions = [];
    
    // 各プラットフォームでキーワード検索
    for (const platform of this.platforms) {
      const platformMentions = await this.searchPlatform(platform, keywords, options);
      mentions.push(...platformMentions);
    }
    
    return {
      mentions: mentions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
      totalMentions: mentions.length,
      platformBreakdown: this.calculatePlatformBreakdown(mentions),
      timeRange: options.timeRange || '24h'
    };
  }

  async analyzeSentiment(listeningResults) {
    const prompt = `
    以下のソーシャルメディアメンションを分析し、感情分析を実行してください：

    メンション数: ${listeningResults.totalMentions}
    プラットフォーム分布: ${JSON.stringify(listeningResults.platformBreakdown)}

    メンションサンプル:
    ${JSON.stringify(listeningResults.mentions.slice(0, 50), null, 2)}

    以下の観点から分析してください：
    1. 全体的な感情傾向（ポジティブ/ネガティブ/ニュートラル）
    2. プラットフォーム別感情分析
    3. 時間軸での感情変化
    4. 主要なポジティブ・ネガティブ要因
    5. 緊急対応が必要な問題

    JSON形式で回答してください：
    {
      "overall": {
        "positive": "ポジティブ割合（%）",
        "negative": "ネガティブ割合（%）",
        "neutral": "ニュートラル割合（%）",
        "score": "感情スコア（-100～100）"
      },
      "platformSentiment": "プラットフォーム別感情分析",
      "timelineSentiment": "時系列感情変化",
      "keyThemes": {
        "positive": ["ポジティブテーマ"],
        "negative": ["ネガティブテーマ"]
      },
      "urgentIssues": ["緊急対応課題"],
      "opportunities": ["機会・チャンス"]
    }
    `;

    const result = await this.ai.generateContent(prompt);
    return JSON.parse(result.response.text());
  }

  async detectTrends(listeningResults) {
    // トレンド検出アルゴリズム
    const trends = await this.identifyEmergingTrends(listeningResults.mentions);
    
    return {
      emergingTrends: trends.emerging,
      decliningTrends: trends.declining,
      stableTrends: trends.stable,
      viralContent: trends.viral,
      trendingHashtags: trends.hashtags
    };
  }
}
```

### ソーシャルリスニングダッシュボード

```javascript
// ソーシャルリスニング表示コンポーネント
export function SocialListeningDashboard() {
  const [listeningData, setListeningData] = React.useState(null);
  const [keywords, setKeywords] = React.useState(['ブランド名', '競合']);
  const [isListening, setIsListening] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const startListening = async () => {
    try {
      setLoading(true);
      setIsListening(true);
      
      const response = await fetch('/api/social/listening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          keywords,
          options: { timeRange: '24h', includeSentiment: true }
        })
      });
      
      const data = await response.json();
      setListeningData(data);
      
    } catch (error) {
      console.error('リスニング開始エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const stopListening = () => {
    setIsListening(false);
  };

  return (
    <div className="space-y-6">
      {/* リスニング設定 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">ソーシャルリスニング</h3>
          <div className="flex items-center space-x-2">
            <Badge variant={isListening ? "default" : "secondary"}>
              {isListening ? 'リスニング中' : '停止中'}
            </Badge>
            {isListening ? (
              <Button onClick={stopListening} variant="destructive" size="sm">
                停止
              </Button>
            ) : (
              <Button onClick={startListening} disabled={loading} size="sm">
                {loading ? 'Starting...' : '開始'}
              </Button>
            )}
          </div>
        </div>

        {/* キーワード設定 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">監視キーワード</label>
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword, index) => (
              <Badge key={index} variant="outline" className="px-2 py-1">
                {keyword}
                <button
                  onClick={() => setKeywords(keywords.filter((_, i) => i !== index))}
                  className="ml-1 text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </Badge>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newKeyword = prompt('新しいキーワードを入力してください:');
                if (newKeyword) setKeywords([...keywords, newKeyword]);
              }}
            >
              + 追加
            </Button>
          </div>
        </div>
      </Card>

      {listeningData && (
        <>
          {/* 感情分析サマリー */}
          <Card className="p-6">
            <h4 className="text-lg font-semibold mb-4">感情分析</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">
                  {listeningData.sentiment.overall.positive}%
                </div>
                <div className="text-sm text-green-600">ポジティブ</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-700">
                  {listeningData.sentiment.overall.negative}%
                </div>
                <div className="text-sm text-red-600">ネガティブ</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-700">
                  {listeningData.sentiment.overall.neutral}%
                </div>
                <div className="text-sm text-gray-600">ニュートラル</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">
                  {listeningData.sentiment.overall.score}
                </div>
                <div className="text-sm text-blue-600">感情スコア</div>
              </div>
            </div>

            {/* 感情メーター */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">感情バランス</span>
                <span className="text-sm text-gray-500">
                  総メンション数: {listeningData.mentions.length}
                </span>
              </div>
              <div className="h-4 bg-red-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ 
                    width: `${listeningData.sentiment.overall.positive}%` 
                  }}
                />
              </div>
            </div>
          </Card>

          {/* メンション一覧 */}
          <Card className="p-6">
            <h4 className="text-lg font-semibold mb-4">最新メンション</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {listeningData.mentions.slice(0, 20).map((mention, index) => (
                <div 
                  key={index} 
                  className="p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <PlatformIcon platform={mention.platform} className="w-4 h-4" />
                      <span className="text-sm font-medium">{mention.author}</span>
                      <Badge 
                        variant={getSentimentVariant(mention.sentiment)}
                        className="text-xs"
                      >
                        {mention.sentiment}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(mention.created_at))}前
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{mention.text}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-3">
                      <span>👍 {mention.likes || 0}</span>
                      <span>🔄 {mention.retweets || 0}</span>
                      <span>💬 {mention.replies || 0}</span>
                    </div>
                    <a 
                      href={mention.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      元投稿を見る
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* アラート */}
          {listeningData.alerts.length > 0 && (
            <Card className="p-6 border-red-200 bg-red-50">
              <h4 className="text-lg font-semibold text-red-800 mb-4">
                緊急アラート
              </h4>
              <div className="space-y-2">
                {listeningData.alerts.map((alert, index) => (
                  <div key={index} className="flex items-center text-red-700">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    <span className="text-sm">{alert.message}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
```

---

## インフルエンサー分析

### インフルエンサー分析エンジン

```javascript
// インフルエンサー分析エンジン
class InfluencerAnalyzer {
  constructor(googleAI) {
    this.ai = googleAI;
    this.model = 'gemini-1.5-flash';
  }

  async analyzeInfluencers(campaignData) {
    try {
      // インフルエンサーデータ取得・分析
      const influencerData = await this.getInfluencerData(campaignData.influencers);
      
      // 効果測定
      const effectAnalysis = await this.measureInfluencerEffect(influencerData);
      
      // ROI分析
      const roiAnalysis = await this.calculateInfluencerROI(influencerData, campaignData);
      
      // 推奨インフルエンサー提案
      const recommendations = await this.generateInfluencerRecommendations(effectAnalysis);
      
      return {
        influencerMetrics: effectAnalysis.metrics,
        campaignPerformance: effectAnalysis.performance,
        roiAnalysis,
        recommendations,
        topPerformers: effectAnalysis.topPerformers,
        insights: await this.generateInfluencerInsights(effectAnalysis),
        updatedAt: new Date()
      };
      
    } catch (error) {
      console.error('インフルエンサー分析エラー:', error);
      throw new Error('インフルエンサー分析に失敗しました');
    }
  }

  async measureInfluencerEffect(influencerData) {
    const prompt = `
    以下のインフルエンサーキャンペーンデータを分析し、効果測定を実行してください：

    インフルエンサーデータ:
    ${JSON.stringify(influencerData, null, 2)}

    以下の観点から分析してください：
    1. インフルエンサー別パフォーマンス比較
    2. エンゲージメント率の質的分析
    3. オーディエンスの質・適合性評価
    4. コンテンツの効果性分析
    5. ブランドメッセージの伝達効果

    JSON形式で回答してください：
    {
      "metrics": {
        "totalReach": "総リーチ数",
        "avgEngagementRate": "平均エンゲージメント率",
        "qualityScore": "オーディエンス品質スコア"
      },
      "performance": {
        "topPerformers": ["トップパフォーマー"],
        "underPerformers": ["改善が必要なインフルエンサー"],
        "contentAnalysis": "コンテンツ効果分析"
      },
      "audienceInsights": "オーディエンス分析の洞察",
      "recommendations": ["改善提案"]
    }
    `;

    const result = await this.ai.generateContent(prompt);
    return JSON.parse(result.response.text());
  }

  async calculateInfluencerROI(influencerData, campaignData) {
    const totalInvestment = campaignData.budget;
    const totalRevenue = campaignData.attributedRevenue || 0;
    const directROI = ((totalRevenue - totalInvestment) / totalInvestment) * 100;

    // インフルエンサー別ROI計算
    const influencerROI = influencerData.map(influencer => {
      const investment = influencer.cost;
      const revenue = influencer.attributedRevenue || 0;
      const roi = ((revenue - investment) / investment) * 100;
      
      return {
        name: influencer.name,
        investment,
        revenue,
        roi,
        costPerEngagement: investment / (influencer.engagements || 1),
        costPerReach: investment / (influencer.reach || 1)
      };
    });

    return {
      campaign: {
        totalInvestment,
        totalRevenue,
        directROI,
        paybackPeriod: totalInvestment / (totalRevenue / 30) // 月間売上基準
      },
      influencers: influencerROI,
      insights: {
        bestROI: influencerROI.reduce((best, current) => 
          current.roi > best.roi ? current : best
        ),
        mostCostEffective: influencerROI.reduce((best, current) => 
          current.costPerEngagement < best.costPerEngagement ? current : best
        )
      }
    };
  }
}
```

### インフルエンサーランキングパネル

```javascript
// インフルエンサーランキング表示
export function InfluencerRankingPanel({ influencerData }) {
  const [sortBy, setSortBy] = React.useState('roi');
  const [filterBy, setFilterBy] = React.useState('all');

  const sortedInfluencers = React.useMemo(() => {
    if (!influencerData?.influencers) return [];
    
    let filtered = influencerData.influencers;
    if (filterBy !== 'all') {
      filtered = filtered.filter(inf => inf.category === filterBy);
    }
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'roi': return b.roi - a.roi;
        case 'engagement': return b.engagementRate - a.engagementRate;
        case 'reach': return b.reach - a.reach;
        case 'cost': return a.costPerEngagement - b.costPerEngagement;
        default: return 0;
      }
    });
  }, [influencerData, sortBy, filterBy]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">インフルエンサーランキング</h3>
        <div className="flex items-center space-x-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="roi">ROI順</SelectItem>
              <SelectItem value="engagement">エンゲージメント順</SelectItem>
              <SelectItem value="reach">リーチ順</SelectItem>
              <SelectItem value="cost">コスト効率順</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全体</SelectItem>
              <SelectItem value="micro">マイクロ</SelectItem>
              <SelectItem value="macro">マクロ</SelectItem>
              <SelectItem value="mega">メガ</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {sortedInfluencers.map((influencer, index) => (
          <div
            key={influencer.id}
            className="p-4 border rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={influencer.profileImage}
                    alt={influencer.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="absolute -top-1 -right-1">
                    <Badge variant="secondary" className="text-xs px-1">
                      #{index + 1}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="font-medium">{influencer.name}</div>
                  <div className="text-sm text-gray-500">
                    @{influencer.username} • {influencer.category}
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-gray-600">
                    <span>👥 {formatNumber(influencer.followers)}</span>
                    <span>📊 {influencer.engagementRate}%</span>
                    <span>📈 {formatNumber(influencer.reach)}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="text-sm text-gray-600">ROI</div>
                    <div className={`font-bold ${
                      influencer.roi >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {influencer.roi >= 0 ? '+' : ''}{influencer.roi.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">コスト/エンゲージメント</div>
                    <div className="font-bold">
                      ¥{influencer.costPerEngagement.toFixed(0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">総投資</div>
                    <div className="font-bold">
                      ¥{formatNumber(influencer.investment)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* パフォーマンス詳細 */}
            <div className="mt-3 pt-3 border-t">
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">投稿数: </span>
                  <span className="font-medium">{influencer.posts}</span>
                </div>
                <div>
                  <span className="text-gray-600">平均いいね: </span>
                  <span className="font-medium">{formatNumber(influencer.avgLikes)}</span>
                </div>
                <div>
                  <span className="text-gray-600">平均コメント: </span>
                  <span className="font-medium">{formatNumber(influencer.avgComments)}</span>
                </div>
                <div>
                  <span className="text-gray-600">売上貢献: </span>
                  <span className="font-medium">¥{formatNumber(influencer.attributedRevenue)}</span>
                </div>
              </div>
              
              {/* 最近のパフォーマンストレンド */}
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-gray-600">最近のトレンド:</span>
                  {influencer.trend === 'up' ? (
                    <span className="text-green-600 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      上昇中
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center">
                      <TrendingDown className="w-3 h-3 mr-1" />
                      下降中
                    </span>
                  )}
                </div>
                <Button size="sm" variant="outline">
                  詳細分析
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
```

---

## ブランド監視機能

### ブランド監視エンジン

```javascript
// ブランド監視エンジン
class BrandMonitoringEngine {
  constructor(googleAI) {
    this.ai = googleAI;
    this.model = 'gemini-1.5-flash';
    this.monitoringKeywords = [];
    this.alertThresholds = {
      sentiment: -30,    // ネガティブ感情が30%以下で警告
      volume: 5.0,       // 通常の5倍のメンション量で警告
      viral: 1000        // 1時間で1000メンション以上で警告
    };
  }

  async monitorBrandReputation(brandConfig) {
    try {
      // ブランドメンション取得
      const brandMentions = await this.getBrandMentions(brandConfig);
      
      // 評判分析
      const reputationAnalysis = await this.analyzeReputation(brandMentions);
      
      // 競合比較
      const competitorAnalysis = await this.analyzeCompetitors(brandConfig.competitors);
      
      // クライシス検出
      const crisisAnalysis = await this.detectCrisis(brandMentions, reputationAnalysis);
      
      // アラート生成
      const alerts = await this.generateBrandAlerts(reputationAnalysis, crisisAnalysis);
      
      return {
        reputation: reputationAnalysis,
        competitors: competitorAnalysis,
        crisis: crisisAnalysis,
        alerts,
        recommendations: await this.generateReputationRecommendations(reputationAnalysis),
        updatedAt: new Date()
      };
      
    } catch (error) {
      console.error('ブランド監視エラー:', error);
      throw new Error('ブランド監視に失敗しました');
    }
  }

  async analyzeReputation(brandMentions) {
    const prompt = `
    以下のブランドメンションデータを分析し、ブランド評判を評価してください：

    メンションデータ:
    ${JSON.stringify(brandMentions.mentions.slice(0, 100), null, 2)}

    メトリクス:
    - 総メンション数: ${brandMentions.totalMentions}
    - プラットフォーム分布: ${JSON.stringify(brandMentions.platformBreakdown)}
    - 時間別分布: ${JSON.stringify(brandMentions.timeBreakdown)}

    以下の観点から分析してください：
    1. ブランド評判の全体的評価
    2. 感情分析の詳細
    3. 主要な話題・テーマ分析
    4. ポジティブ・ネガティブ要因の特定
    5. ブランドイメージの変化トレンド

    JSON形式で回答してください：
    {
      "overallScore": "総合評判スコア（0-100）",
      "sentiment": {
        "positive": "ポジティブ割合（%）",
        "negative": "ネガティブ割合（%）",
        "neutral": "ニュートラル割合（%）"
      },
      "keyThemes": {
        "positive": ["ポジティブテーマ"],
        "negative": ["ネガティブテーマ"],
        "neutral": ["ニュートラルテーマ"]
      },
      "brandAttributes": ["認識されているブランド属性"],
      "trendAnalysis": "トレンド分析",
      "riskFactors": ["リスク要因"],
      "opportunities": ["機会・チャンス"]
    }
    `;

    const result = await this.ai.generateContent(prompt);
    return JSON.parse(result.response.text());
  }

  async detectCrisis(brandMentions, reputationAnalysis) {
    // クライシス検出アルゴリズム
    const crisisIndicators = [];
    
    // 感情スコア急降下検出
    if (reputationAnalysis.sentiment.negative > 60) {
      crisisIndicators.push({
        type: 'sentiment_crisis',
        severity: 'high',
        description: 'ネガティブ感情が急増しています',
        affectedPlatforms: this.identifyNegativePlatforms(brandMentions)
      });
    }
    
    // メンション量急増検出
    const volumeSpike = this.detectVolumeSpike(brandMentions.timeBreakdown);
    if (volumeSpike.detected) {
      crisisIndicators.push({
        type: 'volume_spike',
        severity: volumeSpike.severity,
        description: `メンション量が${volumeSpike.increase}倍に急増しています`,
        timeframe: volumeSpike.timeframe
      });
    }
    
    return {
      crisisDetected: crisisIndicators.length > 0,
      severity: this.calculateCrisisSeverity(crisisIndicators),
      indicators: crisisIndicators,
      recommendedActions: await this.generateCrisisActions(crisisIndicators)
    };
  }
}
```

### ブランド監視ダッシュボード

```javascript
// ブランド監視ダッシュボード
export function BrandMonitoringDashboard() {
  const [brandData, setBrandData] = React.useState(null);
  const [alertLevel, setAlertLevel] = React.useState('normal');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadBrandData();
    
    // リアルタイム更新設定
    const interval = setInterval(loadBrandData, 300000); // 5分毎
    return () => clearInterval(interval);
  }, []);

  const loadBrandData = async () => {
    try {
      const response = await fetch('/api/social/brand-monitoring');
      const data = await response.json();
      setBrandData(data);
      setAlertLevel(determineAlertLevel(data));
    } catch (error) {
      console.error('ブランド監視データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* アラートバナー */}
      {alertLevel !== 'normal' && (
        <Alert className={`border ${getAlertBorderColor(alertLevel)}`}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>ブランド監視アラート</AlertTitle>
          <AlertDescription>
            {getAlertMessage(alertLevel, brandData)}
          </AlertDescription>
        </Alert>
      )}

      {/* ブランド評判サマリー */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">ブランド評判スコア</h3>
          <Badge variant={getReputationBadgeVariant(brandData.reputation.overallScore)}>
            {brandData.reputation.overallScore}/100
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700">
              {brandData.reputation.sentiment.positive}%
            </div>
            <div className="text-sm text-green-600">ポジティブ</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-700">
              {brandData.reputation.sentiment.negative}%
            </div>
            <div className="text-sm text-red-600">ネガティブ</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-700">
              {brandData.reputation.sentiment.neutral}%
            </div>
            <div className="text-sm text-gray-600">ニュートラル</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">
              {brandData.totalMentions}
            </div>
            <div className="text-sm text-blue-600">総メンション数</div>
          </div>
        </div>

        {/* 評判トレンドチャート */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={brandData.reputationTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="評判スコア"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 主要テーマ分析 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4 text-green-700">
            ポジティブテーマ
          </h4>
          <div className="space-y-2">
            {brandData.reputation.keyThemes.positive.map((theme, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                <span className="text-sm">{theme.topic}</span>
                <Badge variant="outline" className="text-green-700">
                  {theme.mentions}件
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4 text-red-700">
            ネガティブテーマ
          </h4>
          <div className="space-y-2">
            {brandData.reputation.keyThemes.negative.map((theme, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                <span className="text-sm">{theme.topic}</span>
                <Badge variant="outline" className="text-red-700">
                  {theme.mentions}件
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 競合比較 */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4">競合ブランド比較</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">ブランド</th>
                <th className="text-center p-2">評判スコア</th>
                <th className="text-center p-2">メンション数</th>
                <th className="text-center p-2">ポジティブ率</th>
                <th className="text-center p-2">トレンド</th>
              </tr>
            </thead>
            <tbody>
              {brandData.competitors.map((competitor, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium">{competitor.name}</td>
                  <td className="p-2 text-center">
                    <Badge variant={getReputationBadgeVariant(competitor.score)}>
                      {competitor.score}
                    </Badge>
                  </td>
                  <td className="p-2 text-center">{competitor.mentions}</td>
                  <td className="p-2 text-center">{competitor.positiveRate}%</td>
                  <td className="p-2 text-center">
                    {competitor.trend === 'up' ? '📈' : '📉'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 推奨アクション */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4">推奨アクション</h4>
        <div className="space-y-3">
          {brandData.recommendations.map((rec, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-medium text-blue-800">{rec.title}</div>
                <div className="text-sm text-blue-700">{rec.description}</div>
                <div className="text-xs text-blue-600 mt-1">
                  優先度: {rec.priority} | 期待効果: {rec.expectedImpact}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
```

---

## コンテンツ最適化

### AI コンテンツ最適化エンジン

```javascript
// コンテンツ最適化エンジン
class ContentOptimizationEngine {
  constructor(googleAI) {
    this.ai = googleAI;
    this.model = 'gemini-1.5-flash';
  }

  async optimizeContent(contentData, targetPlatform) {
    try {
      // コンテンツ分析
      const contentAnalysis = await this.analyzeContent(contentData);
      
      // プラットフォーム最適化
      const platformOptimization = await this.optimizeForPlatform(contentData, targetPlatform);
      
      // エンゲージメント最適化
      const engagementOptimization = await this.optimizeForEngagement(contentAnalysis);
      
      // 投稿時間最適化
      const timingOptimization = await this.optimizePostTiming(targetPlatform);
      
      return {
        originalContent: contentData,
        optimizedContent: platformOptimization,
        improvements: engagementOptimization,
        timing: timingOptimization,
        expectedImpact: await this.calculateExpectedImpact(contentAnalysis, platformOptimization),
        updatedAt: new Date()
      };
      
    } catch (error) {
      console.error('コンテンツ最適化エラー:', error);
      throw new Error('コンテンツ最適化に失敗しました');
    }
  }

  async analyzeContent(contentData) {
    const prompt = `
    以下のコンテンツを分析し、最適化のための評価を行ってください：

    コンテンツ:
    - テキスト: ${contentData.text}
    - 画像: ${contentData.hasImage}
    - 動画: ${contentData.hasVideo}
    - ハッシュタグ: ${contentData.hashtags?.join(', ')}
    - リンク: ${contentData.hasLink}

    以下の観点から分析してください：
    1. コンテンツの魅力度・訴求力
    2. テキストの読みやすさ・理解しやすさ
    3. ビジュアル要素の効果性
    4. ハッシュタグの適切性・効果性
    5. 行動喚起（CTA）の明確さ

    JSON形式で回答してください：
    {
      "appealScore": "魅力度スコア（0-100）",
      "readabilityScore": "読みやすさスコア（0-100）",
      "visualEffectiveness": "ビジュアル効果評価",
      "hashtagAnalysis": "ハッシュタグ分析",
      "ctaAnalysis": "CTA分析",
      "strengths": ["強み"],
      "weaknesses": ["改善点"],
      "suggestions": ["具体的改善提案"]
    }
    `;

    const result = await this.ai.generateContent(prompt);
    return JSON.parse(result.response.text());
  }

  async optimizeForPlatform(contentData, platform) {
    const prompt = `
    以下のコンテンツを${platform}プラットフォーム向けに最適化してください：

    元のコンテンツ:
    ${JSON.stringify(contentData, null, 2)}

    ${platform}の特徴を考慮して最適化してください：
    - 文字数制限や推奨長
    - プラットフォーム固有の機能
    - ユーザー行動パターン
    - エンゲージメント最適化要素

    最適化されたコンテンツをJSON形式で提案してください：
    {
      "optimizedText": "最適化されたテキスト",
      "recommendedHashtags": ["推奨ハッシュタグ"],
      "visualRecommendations": "ビジュアル推奨事項",
      "postingStrategy": "投稿戦略",
      "expectedEngagement": "期待エンゲージメント改善率（%）",
      "optimizationReasons": ["最適化の理由・根拠"]
    }
    `;

    const result = await this.ai.generateContent(prompt);
    return JSON.parse(result.response.text());
  }
}
```

### コンテンツ最適化ツール

```javascript
// コンテンツ最適化ツール
export function ContentOptimizationTool() {
  const [content, setContent] = React.useState('');
  const [selectedPlatform, setSelectedPlatform] = React.useState('twitter');
  const [optimizationResult, setOptimizationResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const optimizeContent = async () => {
    if (!content.trim()) return;
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/social/content-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: {
            text: content,
            hasImage: false, // 実際の実装では画像検出ロジックを追加
            hasVideo: false,
            hashtags: extractHashtags(content),
            hasLink: content.includes('http')
          },
          platform: selectedPlatform
        })
      });
      
      const result = await response.json();
      setOptimizationResult(result);
      
    } catch (error) {
      console.error('最適化エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">コンテンツ最適化ツール</h3>
        
        {/* プラットフォーム選択 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            ターゲットプラットフォーム
          </label>
          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="twitter">Twitter</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="discord">Discord</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* コンテンツ入力 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            コンテンツ
          </label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="最適化したいコンテンツを入力してください..."
            rows={4}
            className="w-full"
          />
          <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
            <span>{content.length} 文字</span>
            <span>ハッシュタグ: {extractHashtags(content).length}個</span>
          </div>
        </div>

        <Button 
          onClick={optimizeContent} 
          disabled={!content.trim() || loading}
          className="w-full"
        >
          {loading ? 'Optimizing...' : 'コンテンツを最適化'}
        </Button>
      </Card>

      {optimizationResult && (
        <div className="space-y-4">
          {/* 最適化結果サマリー */}
          <Card className="p-6">
            <h4 className="text-lg font-semibold mb-4">最適化結果</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-700">
                  +{optimizationResult.expectedImpact.engagementImprovement}%
                </div>
                <div className="text-sm text-blue-600">期待エンゲージメント向上</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-700">
                  {optimizationResult.improvements.appealScore}
                </div>
                <div className="text-sm text-green-600">魅力度スコア</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-700">
                  {optimizationResult.improvements.readabilityScore}
                </div>
                <div className="text-sm text-purple-600">読みやすさスコア</div>
              </div>
            </div>
          </Card>

          {/* Before/After比較 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h5 className="font-semibold mb-3 text-gray-700">元のコンテンツ</h5>
              <div className="p-3 bg-gray-50 rounded border">
                <p className="text-sm">{optimizationResult.originalContent.text}</p>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                文字数: {optimizationResult.originalContent.text.length}
              </div>
            </Card>

            <Card className="p-6">
              <h5 className="font-semibold mb-3 text-green-700">最適化されたコンテンツ</h5>
              <div className="p-3 bg-green-50 rounded border">
                <p className="text-sm">{optimizationResult.optimizedContent.optimizedText}</p>
              </div>
              <div className="mt-2 text-xs text-green-600">
                文字数: {optimizationResult.optimizedContent.optimizedText.length}
              </div>
            </Card>
          </div>

          {/* 推奨事項 */}
          <Card className="p-6">
            <h5 className="font-semibold mb-3">AI推奨事項</h5>
            <div className="space-y-3">
              {optimizationResult.improvements.suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500 mt-1" />
                  <span className="text-sm">{suggestion}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* ハッシュタグ推奨 */}
          <Card className="p-6">
            <h5 className="font-semibold mb-3">推奨ハッシュタグ</h5>
            <div className="flex flex-wrap gap-2">
              {optimizationResult.optimizedContent.recommendedHashtags.map((hashtag, index) => (
                <Badge key={index} variant="outline" className="cursor-pointer hover:bg-blue-50">
                  #{hashtag}
                </Badge>
              ))}
            </div>
          </Card>

          {/* 投稿タイミング */}
          <Card className="p-6">
            <h5 className="font-semibold mb-3">最適投稿タイミング</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h6 className="text-sm font-medium mb-2">推奨投稿時間</h6>
                <ul className="text-sm space-y-1">
                  {optimizationResult.timing.recommendedTimes.map((time, index) => (
                    <li key={index} className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {time.time} ({time.reason})
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h6 className="text-sm font-medium mb-2">避けるべき時間</h6>
                <ul className="text-sm space-y-1">
                  {optimizationResult.timing.avoidTimes.map((time, index) => (
                    <li key={index} className="flex items-center text-red-600">
                      <X className="w-3 h-3 mr-1" />
                      {time.time} ({time.reason})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
```

---

## 実装例

### API エンドポイント実装

```javascript
// /api/social/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { TwitterAnalyticsService } from '@/services/TwitterAnalyticsService';
import { InstagramAnalyticsService } from '@/services/InstagramAnalyticsService';
import { DiscordAnalyticsService } from '@/services/DiscordAnalyticsService';
import { EngagementAnalyzer } from '@/services/EngagementAnalyzer';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platforms = searchParams.get('platforms')?.split(',') || ['twitter', 'instagram', 'discord'];
    
    // 各プラットフォームの分析を並列実行
    const analyticsPromises = platforms.map(async (platform) => {
      switch (platform) {
        case 'twitter':
          return { 
            platform, 
            data: await new TwitterAnalyticsService(googleAI).analyzeTwitterMetrics('account_id')
          };
        case 'instagram':
          return { 
            platform, 
            data: await new InstagramAnalyticsService(googleAI).analyzeInstagramMetrics('account_id')
          };
        case 'discord':
          return { 
            platform, 
            data: await new DiscordAnalyticsService(googleAI).analyzeDiscordCommunity('server_id')
          };
        default:
          return null;
      }
    });

    const platformResults = await Promise.all(analyticsPromises);
    const platformData = platformResults.filter(result => result !== null)
      .reduce((acc, result) => {
        acc[result.platform] = result.data;
        return acc;
      }, {});

    // 統合エンゲージメント分析
    const engagementAnalysis = await new EngagementAnalyzer(googleAI)
      .analyzeMultiPlatformEngagement(platformData);

    return NextResponse.json({
      platforms: platformData,
      engagement: engagementAnalysis,
      summary: {
        totalFollowers: Object.values(platformData).reduce((sum, data) => sum + data.metrics.followers, 0),
        avgEngagementRate: Object.values(platformData).reduce((sum, data) => sum + data.metrics.engagement, 0) / platforms.length,
        totalReach: Object.values(platformData).reduce((sum, data) => sum + (data.metrics.reach || 0), 0)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('SNS分析API エラー:', error);
    return NextResponse.json(
      { error: 'SNS分析の取得に失敗しました' },
      { status: 500 }
    );
  }
}
```

### カスタムフック実装

```javascript
// hooks/useSocialAnalytics.ts
import { useState, useEffect, useCallback } from 'react';

export function useSocialAnalytics() {
  const [socialData, setSocialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSocialData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/social/analytics');
      
      if (!response.ok) {
        throw new Error('SNS分析データの取得に失敗しました');
      }
      
      const data = await response.json();
      setSocialData(data);
      setError(null);
      
    } catch (err) {
      setError(err.message);
      console.error('SNS分析データ取得エラー:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(() => {
    loadSocialData();
  }, [loadSocialData]);

  useEffect(() => {
    loadSocialData();
    
    // 5分毎の自動更新
    const interval = setInterval(loadSocialData, 300000);
    return () => clearInterval(interval);
  }, [loadSocialData]);

  return {
    socialData,
    engagementMetrics: socialData?.engagement,
    loading,
    error,
    refreshData
  };
}
```

---

## AI最適化機能

### 機械学習統合

```javascript
// AI統合SNS分析システム
class AISocialAnalyticsIntegration {
  constructor(googleAI) {
    this.ai = googleAI;
    this.model = 'gemini-1.5-flash';
  }

  async performComprehensiveSocialAnalysis(socialData) {
    try {
      // 全データ統合分析
      const comprehensiveInsights = await this.generateComprehensiveInsights(socialData);
      
      // 戦略的推奨事項生成
      const strategicRecommendations = await this.generateStrategicRecommendations(comprehensiveInsights);
      
      // 予測分析
      const predictions = await this.generateSocialPredictions(socialData);
      
      return {
        insights: comprehensiveInsights,
        recommendations: strategicRecommendations,
        predictions,
        actionPlan: await this.generateActionPlan(strategicRecommendations),
        updatedAt: new Date()
      };
      
    } catch (error) {
      console.error('AI統合分析エラー:', error);
      throw new Error('AI統合分析に失敗しました');
    }
  }

  async generateComprehensiveInsights(socialData) {
    const prompt = `
    以下の包括的なSNSデータを分析し、統合的な洞察を提供してください：

    プラットフォーム別データ:
    ${JSON.stringify(socialData.platforms, null, 2)}

    エンゲージメント分析:
    ${JSON.stringify(socialData.engagement, null, 2)}

    ブランド監視データ:
    ${JSON.stringify(socialData.brandMonitoring, null, 2)}

    以下の統合分析を実行してください：
    1. クロスプラットフォーム戦略の評価
    2. オーディエンス行動パターンの分析
    3. コンテンツ効果の総合評価
    4. ブランドプレゼンスの市場ポジション
    5. 競合他社との差別化ポイント

    JSON形式で詳細に回答してください：
    {
      "overallPerformance": "全体パフォーマンス評価",
      "crossPlatformInsights": ["クロスプラットフォーム洞察"],
      "audienceProfile": "統合オーディエンス分析",
      "contentEffectiveness": "コンテンツ効果分析",
      "competitivePosition": "競合ポジション分析",
      "strategicOpportunities": ["戦略的機会"],
      "riskFactors": ["リスク要因"]
    }
    `;

    const result = await this.ai.generateContent(prompt);
    return JSON.parse(result.response.text());
  }
}
```

---

## トラブルシューティング

### よくある問題と解決策

```javascript
// SNS分析トラブルシューティング
const SocialAnalyticsTroubleshooting = {
  // API連携の問題
  apiConnectionIssues: {
    'rate_limit_exceeded': {
      description: 'API利用制限に達しました',
      causes: [
        'Twitter API利用制限',
        'Instagram API利用制限',
        '短時間での大量リクエスト'
      ],
      solutions: [
        'リクエスト間隔の調整',
        'バックオフ戦略の実装',
        'プレミアムAPIの検討'
      ]
    },
    'authentication_failed': {
      description: 'API認証に失敗しました',
      causes: [
        'アクセストークンの期限切れ',
        'API キーの設定ミス',
        'アプリケーション権限不足'
      ],
      solutions: [
        'トークンの更新・再取得',
        'API設定の確認',
        'アプリケーション権限の見直し'
      ]
    }
  },

  // データ品質の問題
  dataQualityIssues: {
    'incomplete_data': {
      description: 'データが不完全です',
      solutions: [
        'データソースの確認',
        'バックアップデータソースの利用',
        'データ補完アルゴリズムの適用'
      ]
    },
    'sentiment_accuracy': {
      description: '感情分析の精度が低い',
      solutions: [
        'AI プロンプトの調整',
        '業界特化用語の学習',
        '人間による検証フィードバック'
      ]
    }
  }
};

// エラーハンドリング関数
export function handleSocialAnalyticsError(error, context) {
  console.error(`SNS分析エラー [${context}]:`, error);
  
  switch (error.type) {
    case 'RATE_LIMIT':
      return {
        message: 'API利用制限に達しました。しばらく待ってから再試行してください。',
        action: 'retry_later',
        retryAfter: error.retryAfter || 900000 // 15分
      };
      
    case 'AUTH_ERROR':
      return {
        message: 'API認証エラーです。設定を確認してください。',
        action: 'check_credentials'
      };
      
    case 'DATA_ERROR':
      return {
        message: 'データ取得エラーです。ネットワーク接続を確認してください。',
        action: 'check_connection'
      };
      
    default:
      return {
        message: '予期しないエラーが発生しました。',
        action: 'contact_support'
      };
  }
}
```

---

## まとめ

このSNS分析機能マニュアルでは、AI駆動のソーシャルメディア統合分析システムの包括的な実装方法を説明しました。

### 主要機能
1. **マルチプラットフォーム統合** - Twitter、Instagram、Discord の統合分析
2. **エンゲージメント分析** - AI による高度なエンゲージメント最適化
3. **ソーシャルリスニング** - リアルタイムブランド監視
4. **インフルエンサー分析** - ROI 中心の効果測定
5. **ブランド監視機能** - クライシス検出・評判管理
6. **コンテンツ最適化** - AI による投稿最適化

### 技術的特徴
- Google Generative AI との統合
- リアルタイムデータ処理
- 感情分析・トレンド検出
- クロスプラットフォーム比較分析
- 自動アラート・通知システム

このシステムにより、SNSマーケティングの効率化と効果最大化が実現できます。