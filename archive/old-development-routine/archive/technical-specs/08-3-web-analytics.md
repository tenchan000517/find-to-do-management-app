# Web分析機能 マニュアル

## 概要

Web分析機能は、Google Analytics 4（GA4）とGoogle Search Consoleを統合した包括的なWebサイトパフォーマンス分析システムです。リアルタイムデータ、トラフィック分析、SEO指標、ユーザー行動分析を一元的に管理し、データドリブンな意思決定を支援します。

### 主要特徴
- **GA4とSearch Console統合分析**
- **リアルタイムユーザー監視**
- **SEOパフォーマンス分析**
- **マルチデバイス対応分析**
- **自動データ統合・計算**

---

## 目次

1. [アーキテクチャ設計](#アーキテクチャ設計)
2. [Google Analytics 4連携](#google-analytics-4連携)
3. [Search Console統合](#search-console統合)
4. [リアルタイム分析](#リアルタイム分析)
5. [データ統合・計算](#データ統合計算)
6. [SEO分析機能](#seo分析機能)
7. [パフォーマンス監視](#パフォーマンス監視)
8. [実装例](#実装例)
9. [エラーハンドリング](#エラーハンドリング)
10. [トラブルシューティング](#トラブルシューティング)

---

## アーキテクチャ設計

### システム構成

```javascript
// Web分析システムの全体構成
const WebAnalyticsArchitecture = {
  // データソース
  dataSources: {
    ga4: 'Google Analytics 4 API',
    searchConsole: 'Google Search Console API',
    realtime: 'GA4 Realtime Reporting API'
  },
  
  // サービス層
  services: {
    ga4ReportsService: 'GA4データ取得・処理',
    searchConsoleService: 'Search Consoleデータ取得・処理',
    dataIntegrationService: 'データ統合・計算'
  },
  
  // UI層
  components: {
    analyticsDashboard: 'メインダッシュボード',
    overviewMetrics: '概要指標表示',
    trafficTrendChart: 'トラフィック推移グラフ',
    pagePerformanceTable: 'ページパフォーマンステーブル',
    seoInsightsPanel: 'SEOインサイトパネル',
    realtimeStatus: 'リアルタイム状況表示'
  }
};

// AnalyticsDashboard.tsx の基本構造
export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(7);

  const fetchData = async (days) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/dashboard?days=${days}`);
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PeriodSelector onPeriodChange={handlePeriodChange} />
      <RealtimeStatus data={data?.data?.realtime} />
      <OverviewMetrics data={data?.data?.combined?.overview} />
      <ChartsSection data={data?.data} />
      <PagePerformanceTable data={data?.data?.combined?.topPerformingPages} />
      <DataStatusPanel data={data} />
    </div>
  );
}
```

### API設計

```javascript
// /api/analytics/dashboard/route.ts の実装
export async function GET(request) {
  try {
    const days = parseInt(searchParams.get('days') || '7', 10);
    
    // サービス初期化
    const ga4Service = GA4ReportsService.getInstance();
    const searchConsoleService = SearchConsoleService.getInstance();

    // 並列データ取得
    const [ga4Data, searchConsoleData, realtimeData] = await Promise.allSettled([
      ga4Service.getBasicReport(days),
      searchConsoleService.getSearchAnalytics(days),
      ga4Service.getRealtimeData(),
    ]);

    // レスポンス構築
    const response = {
      success: true,
      timeRange: calculateTimeRange(days),
      data: {
        ga4: processGA4Data(ga4Data),
        searchConsole: processSearchConsoleData(searchConsoleData),
        realtime: processRealtimeData(realtimeData),
        combined: calculateCombinedMetrics(ga4Data, searchConsoleData)
      },
      errors: collectErrors([ga4Data, searchConsoleData, realtimeData])
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleAPIError(error);
  }
}
```

---

## Google Analytics 4連携

### GA4ReportsService

```javascript
// GA4データ取得サービス
class GA4ReportsService {
  private static instance: GA4ReportsService;
  
  static getInstance() {
    if (!GA4ReportsService.instance) {
      GA4ReportsService.instance = new GA4ReportsService();
    }
    return GA4ReportsService.instance;
  }

  // 基本レポート取得
  async getBasicReport(days = 7) {
    const startDate = this.getDateString(days);
    const endDate = this.getDateString(0);

    const reportRequest = {
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'sessions' },
        { name: 'users' },
        { name: 'pageviews' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
        { name: 'eventsPerSession' }
      ],
      dimensions: []
    };

    const response = await this.executeReport(reportRequest);
    return this.processBasicReport(response);
  }

  // チャネル別分析
  async getChannelReport(days = 7) {
    const reportRequest = {
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ 
        startDate: this.getDateString(days), 
        endDate: this.getDateString(0) 
      }],
      metrics: [
        { name: 'sessions' },
        { name: 'users' },
        { name: 'pageviews' }
      ],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }]
    };

    const response = await this.executeReport(reportRequest);
    return this.processChannelReport(response);
  }

  // ページ別分析
  async getPageReport(days = 7) {
    const reportRequest = {
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ 
        startDate: this.getDateString(days), 
        endDate: this.getDateString(0) 
      }],
      metrics: [
        { name: 'pageviews' },
        { name: 'uniquePageviews' },
        { name: 'averageTimeOnPage' },
        { name: 'bounceRate' }
      ],
      dimensions: [{ name: 'pagePath' }],
      orderBys: [{ 
        metric: { metricName: 'pageviews' }, 
        desc: true 
      }],
      limit: 20
    };

    const response = await this.executeReport(reportRequest);
    return this.processPageReport(response);
  }

  // デバイス別分析
  async getDeviceReport(days = 7) {
    const reportRequest = {
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ 
        startDate: this.getDateString(days), 
        endDate: this.getDateString(0) 
      }],
      metrics: [
        { name: 'sessions' },
        { name: 'users' },
        { name: 'pageviews' }
      ],
      dimensions: [{ name: 'deviceCategory' }]
    };

    const response = await this.executeReport(reportRequest);
    return this.processDeviceReport(response);
  }
}
```

### リアルタイムデータ取得

```javascript
// リアルタイム分析機能
const RealtimeAnalytics = {
  // リアルタイムユーザー数取得
  getRealtimeData: async () => {
    const reportRequest = {
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      metrics: [
        { name: 'activeUsers' }
      ],
      dimensions: [
        { name: 'country' },
        { name: 'deviceCategory' }
      ]
    };

    try {
      const response = await analyticsData.properties.runRealtimeReport(reportRequest);
      return {
        activeUsers: response.data.totals?.[0]?.metricValues?.[0]?.value || 0,
        byCountry: processCountryData(response.data.rows),
        byDevice: processDeviceData(response.data.rows),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Realtime data fetch error:', error);
      return null;
    }
  },

  // リアルタイム表示コンポーネント
  RealtimeStatus: ({ data }) => {
    if (!data) return null;

    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <h3 className="text-green-800 font-semibold">リアルタイム分析</h3>
              <p className="text-green-600 text-sm">現在アクティブなユーザー数</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-700">{data.activeUsers}</div>
            <div className="text-xs text-green-600">アクティブユーザー</div>
          </div>
        </div>
        
        {data.byCountry && data.byCountry.length > 0 && (
          <div className="mt-4 pt-4 border-t border-green-200">
            <h4 className="text-sm font-medium text-green-800 mb-2">国別アクティブユーザー</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {data.byCountry.slice(0, 4).map((country, index) => (
                <div key={index} className="text-center p-2 bg-green-100 rounded">
                  <div className="text-sm font-medium text-green-700">{country.users}</div>
                  <div className="text-xs text-green-600">{country.country}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
};
```

---

## Search Console統合

### SearchConsoleService

```javascript
// Search Console データ取得サービス
class SearchConsoleService {
  private static instance: SearchConsoleService;
  
  static getInstance() {
    if (!SearchConsoleService.instance) {
      SearchConsoleService.instance = new SearchConsoleService();
    }
    return SearchConsoleService.instance;
  }

  // 検索アナリティクス取得
  async getSearchAnalytics(days = 7) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const request = {
      siteUrl: process.env.SEARCH_CONSOLE_SITE_URL,
      requestBody: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dimensions: ['query', 'page', 'country', 'device'],
        rowLimit: 1000
      }
    };

    try {
      const response = await searchConsole.searchanalytics.query(request);
      return this.processSearchAnalytics(response.data);
    } catch (error) {
      console.error('Search Console API error:', error);
      throw error;
    }
  }

  // データ処理・集計
  processSearchAnalytics(data) {
    const rows = data.rows || [];
    
    // サマリー計算
    const summary = {
      clicks: rows.reduce((sum, row) => sum + row.clicks, 0),
      impressions: rows.reduce((sum, row) => sum + row.impressions, 0),
      ctr: 0,
      position: 0
    };
    
    summary.ctr = summary.impressions > 0 ? summary.clicks / summary.impressions : 0;
    summary.position = rows.length > 0 ? 
      rows.reduce((sum, row) => sum + row.position, 0) / rows.length : 0;

    // クエリ別データ
    const byQuery = this.groupByDimension(rows, 'query').slice(0, 20);
    
    // ページ別データ
    const byPage = this.groupByDimension(rows, 'page').slice(0, 20);
    
    // 国別データ
    const byCountry = this.groupByDimension(rows, 'country').slice(0, 10);
    
    // デバイス別データ
    const byDevice = this.groupByDimension(rows, 'device');

    return {
      summary,
      byQuery,
      byPage,
      byCountry,
      byDevice,
      totalRows: rows.length
    };
  }

  // ディメンション別グループ化
  groupByDimension(rows, dimension) {
    const grouped = new Map();
    
    rows.forEach(row => {
      const key = row.keys[this.getDimensionIndex(dimension)];
      if (!grouped.has(key)) {
        grouped.set(key, {
          dimension: key,
          metrics: {
            clicks: 0,
            impressions: 0,
            ctr: 0,
            position: 0
          }
        });
      }
      
      const item = grouped.get(key);
      item.metrics.clicks += row.clicks;
      item.metrics.impressions += row.impressions;
    });
    
    // CTRと平均掲載順位を再計算
    for (const [key, item] of grouped) {
      item.metrics.ctr = item.metrics.impressions > 0 ? 
        item.metrics.clicks / item.metrics.impressions : 0;
      item.metrics.position = this.calculateAvgPosition(rows, key, dimension);
    }
    
    return Array.from(grouped.values())
      .sort((a, b) => b.metrics.clicks - a.metrics.clicks);
  }
}
```

### SEO分析パネル

```javascript
// SEOインサイトパネル
const SEOInsightsPanel = ({ data }) => {
  if (!data) return <SEOPlaceholder />;

  const { summary, byQuery, byPage } = data;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">SEOインサイト</h3>
      
      {/* サマリー指標 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SEOMetricCard
          label="クリック数"
          value={summary.clicks.toLocaleString()}
          icon="👆"
          color="blue"
        />
        <SEOMetricCard
          label="表示回数"
          value={summary.impressions.toLocaleString()}
          icon="👁️"
          color="green"
        />
        <SEOMetricCard
          label="CTR"
          value={`${(summary.ctr * 100).toFixed(1)}%`}
          icon="📊"
          color="purple"
        />
        <SEOMetricCard
          label="平均掲載順位"
          value={summary.position.toFixed(1)}
          icon="🎯"
          color="orange"
        />
      </div>

      {/* トップクエリ */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-800 mb-3">トップ検索クエリ</h4>
        <div className="space-y-2">
          {byQuery.slice(0, 5).map((query, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700 truncate flex-1 mr-4">
                {query.dimension}
              </span>
              <div className="flex items-center space-x-4 text-xs text-gray-600">
                <span>{query.metrics.clicks} クリック</span>
                <span>{(query.metrics.ctr * 100).toFixed(1)}% CTR</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* トップページ */}
      <div>
        <h4 className="text-md font-medium text-gray-800 mb-3">トップパフォーマンスページ</h4>
        <div className="space-y-2">
          {byPage.slice(0, 5).map((page, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700 truncate flex-1 mr-4">
                {page.dimension}
              </span>
              <div className="flex items-center space-x-4 text-xs text-gray-600">
                <span>{page.metrics.clicks} クリック</span>
                <span>順位 {page.metrics.position.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SEOMetricCard = ({ label, value, icon, color }) => (
  <div className={`p-3 rounded-lg border border-${color}-200 bg-${color}-50`}>
    <div className="flex items-center justify-between">
      <div>
        <p className={`text-xs font-medium text-${color}-600`}>{label}</p>
        <p className={`text-lg font-bold text-${color}-800`}>{value}</p>
      </div>
      <span className="text-lg">{icon}</span>
    </div>
  </div>
);
```

---

## リアルタイム分析

### ライブデータ監視

```javascript
// リアルタイム監視システム
const RealtimeMonitoring = {
  // ライブデータポーリング
  setupRealtimePolling: (updateCallback, interval = 30000) => {
    const pollRealtime = async () => {
      try {
        const response = await fetch('/api/analytics/realtime');
        if (response.ok) {
          const data = await response.json();
          updateCallback(data);
        }
      } catch (error) {
        console.error('Realtime polling error:', error);
      }
    };

    // 初回実行
    pollRealtime();
    
    // 定期実行
    const intervalId = setInterval(pollRealtime, interval);
    
    return () => clearInterval(intervalId);
  },

  // リアルタイムダッシュボード
  RealtimeDashboard: () => {
    const [realtimeData, setRealtimeData] = useState(null);
    const [isLive, setIsLive] = useState(true);

    useEffect(() => {
      if (!isLive) return;

      const cleanup = RealtimeMonitoring.setupRealtimePolling(
        (data) => setRealtimeData(data),
        30000 // 30秒ごと
      );

      return cleanup;
    }, [isLive]);

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            リアルタイム分析
          </h3>
          <div className="flex items-center space-x-2">
            <ToggleSwitch 
              checked={isLive} 
              onChange={setIsLive}
              label="ライブ更新"
            />
            {isLive && (
              <div className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-xs">LIVE</span>
              </div>
            )}
          </div>
        </div>

        {realtimeData ? (
          <RealtimeMetrics data={realtimeData} />
        ) : (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">リアルタイムデータを取得中...</p>
          </div>
        )}
      </div>
    );
  }
};
```

### イベント追跡

```javascript
// カスタムイベント追跡
const EventTracking = {
  // GA4イベント送信
  trackEvent: (eventName, parameters = {}) => {
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, {
        ...parameters,
        custom_parameter: 'dashboard_interaction'
      });
    }
  },

  // ダッシュボード操作追跡
  trackDashboardInteraction: (action, element) => {
    EventTracking.trackEvent('dashboard_interaction', {
      action: action,
      element: element,
      timestamp: Date.now()
    });
  },

  // ページパフォーマンス追跡
  trackPagePerformance: () => {
    if (typeof performance !== 'undefined') {
      const navigationTiming = performance.getEntriesByType('navigation')[0];
      
      EventTracking.trackEvent('page_performance', {
        load_time: navigationTiming.loadEventEnd - navigationTiming.fetchStart,
        dom_ready: navigationTiming.domContentLoadedEventEnd - navigationTiming.fetchStart,
        page_type: 'analytics_dashboard'
      });
    }
  }
};
```

---

## データ統合・計算

### 統合メトリクス計算

```javascript
// GA4とSearch Consoleデータの統合
function calculateCombinedMetrics(ga4Data, searchConsoleData) {
  return {
    overview: {
      organicTraffic: {
        sessions: extractOrganicSessions(ga4Data.byChannel),
        clicks: searchConsoleData.summary.clicks,
        impressions: searchConsoleData.summary.impressions,
        ctr: searchConsoleData.summary.ctr,
        avgPosition: searchConsoleData.summary.position,
      },
      engagement: {
        totalSessions: ga4Data.summary.sessions,
        totalUsers: ga4Data.summary.users,
        pageViews: ga4Data.summary.pageViews,
        bounceRate: ga4Data.summary.bounceRate,
        avgSessionDuration: ga4Data.summary.avgSessionDuration,
      },
    },
    topPerformingPages: mergePageData(
      ga4Data.byPage,
      searchConsoleData.byPage
    ),
    trafficSources: {
      ga4Channels: ga4Data.byChannel,
      searchQueries: searchConsoleData.byQuery,
    },
    deviceBreakdown: {
      ga4: ga4Data.byDevice,
      searchConsole: searchConsoleData.byDevice,
    },
  };
}

// ページデータ統合
function mergePageData(ga4Pages, searchConsolePages) {
  const pageMap = new Map();

  // GA4データの追加
  ga4Pages.forEach(page => {
    pageMap.set(page.dimension, {
      url: page.dimension,
      ga4: page.metrics,
      searchConsole: null,
      combinedScore: page.metrics.pageViews || 0
    });
  });

  // Search Consoleデータの統合
  searchConsolePages.forEach(page => {
    const existing = pageMap.get(page.dimension);
    if (existing) {
      existing.searchConsole = page.metrics;
      existing.combinedScore += page.metrics.clicks || 0;
    } else {
      pageMap.set(page.dimension, {
        url: page.dimension,
        ga4: null,
        searchConsole: page.metrics,
        combinedScore: page.metrics.clicks || 0
      });
    }
  });

  return Array.from(pageMap.values())
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, 10);
}

// オーガニックトラフィック抽出
function extractOrganicSessions(channelData) {
  const organicChannel = channelData.find(channel => 
    channel.dimension.toLowerCase().includes('organic') ||
    channel.dimension.toLowerCase().includes('search')
  );
  
  return organicChannel?.metrics?.sessions || 0;
}
```

### トレンド分析

```javascript
// トレンド分析機能
const TrendAnalysis = {
  // トラフィック推移チャート
  TrafficTrendChart: ({ ga4Data, searchConsoleData }) => {
    const chartData = generateTrendData(ga4Data, searchConsoleData);

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          トラフィック推移
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={formatTooltip} />
              <Legend />
              <Line
                type="monotone"
                dataKey="sessions"
                stroke="#3b82f6"
                strokeWidth={2}
                name="セッション数"
              />
              <Line
                type="monotone"
                dataKey="clicks"
                stroke="#10b981"
                strokeWidth={2}
                name="検索クリック数"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  },

  // データ期間比較
  comparePeriods: (currentData, previousData) => {
    const metrics = ['sessions', 'users', 'pageViews', 'clicks', 'impressions'];
    const comparison = {};

    metrics.forEach(metric => {
      const current = currentData[metric] || 0;
      const previous = previousData[metric] || 0;
      const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;

      comparison[metric] = {
        current,
        previous,
        change,
        trend: change > 5 ? 'up' : change < -5 ? 'down' : 'stable'
      };
    });

    return comparison;
  }
};
```

---

## SEO分析機能

### キーワード分析

```javascript
// キーワードパフォーマンス分析
const SEOAnalysis = {
  // キーワード分類・分析
  analyzeKeywords: (queryData) => {
    const keywords = queryData.map(query => ({
      keyword: query.dimension,
      clicks: query.metrics.clicks,
      impressions: query.metrics.impressions,
      ctr: query.metrics.ctr,
      position: query.metrics.position,
      category: categorizeKeyword(query.dimension),
      opportunity: calculateOpportunity(query.metrics)
    }));

    return {
      brandKeywords: keywords.filter(k => k.category === 'brand'),
      productKeywords: keywords.filter(k => k.category === 'product'),
      informationalKeywords: keywords.filter(k => k.category === 'informational'),
      highOpportunity: keywords.filter(k => k.opportunity > 0.7).slice(0, 10),
      lowCTR: keywords.filter(k => k.ctr < 0.02 && k.impressions > 100).slice(0, 10)
    };
  },

  // キーワード機会分析
  calculateOpportunity: (metrics) => {
    const { impressions, ctr, position } = metrics;
    
    // 表示回数が多く、CTRが低く、掲載順位が改善可能な場合に機会スコアが高くなる
    const impressionScore = Math.min(impressions / 1000, 1); // 最大1000表示回数で正規化
    const ctrScore = 1 - Math.min(ctr / 0.1, 1); // CTRが低いほどスコアが高い
    const positionScore = Math.max(0, (20 - position) / 20); // 20位以内で正規化

    return (impressionScore + ctrScore + positionScore) / 3;
  },

  // SEO推奨事項生成
  generateSEORecommendations: (seoData) => {
    const recommendations = [];

    // CTR改善推奨
    if (seoData.summary.ctr < 0.03) {
      recommendations.push({
        type: 'ctr_improvement',
        priority: 'high',
        title: 'メタディスクリプションの最適化',
        description: `現在のCTRは${(seoData.summary.ctr * 100).toFixed(1)}%です。メタディスクリプションを改善してCTRを向上させましょう。`,
        expectedImpact: 'CTR 15-25% 向上'
      });
    }

    // 掲載順位改善推奨
    if (seoData.summary.position > 10) {
      recommendations.push({
        type: 'position_improvement',
        priority: 'high',
        title: 'コンテンツ最適化',
        description: `平均掲載順位が${seoData.summary.position.toFixed(1)}位です。コンテンツを充実させて上位表示を目指しましょう。`,
        expectedImpact: '掲載順位 3-5位 向上'
      });
    }

    return recommendations;
  }
};
```

### ページパフォーマンス分析

```javascript
// ページパフォーマンステーブル
const PagePerformanceTable = ({ topPages, ga4Pages, searchConsolePages }) => {
  const mergedData = mergePagePerformanceData(topPages, ga4Pages, searchConsolePages);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        ページパフォーマンス分析
      </h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ページ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ページビュー
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                検索クリック
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CTR
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                平均掲載順位
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                改善度
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mergedData.map((page, index) => (
              <PagePerformanceRow key={index} page={page} index={index} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PagePerformanceRow = ({ page, index }) => {
  const improvementScore = calculateImprovementScore(page);
  
  return (
    <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
          {page.url}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {page.ga4?.pageViews?.toLocaleString() || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {page.searchConsole?.clicks?.toLocaleString() || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {page.searchConsole?.ctr ? `${(page.searchConsole.ctr * 100).toFixed(1)}%` : '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {page.searchConsole?.position ? page.searchConsole.position.toFixed(1) : '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <ImprovementBadge score={improvementScore} />
      </td>
    </tr>
  );
};
```

---

## パフォーマンス監視

### 読み込み最適化

```javascript
// パフォーマンス最適化システム
const PerformanceOptimizer = {
  // 遅延ローディング
  useLazyLoading: () => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef();

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      if (ref.current) {
        observer.observe(ref.current);
      }

      return () => observer.disconnect();
    }, []);

    return { ref, isVisible };
  },

  // データキャッシュ
  useDataCache: (key, fetchFunction, ttl = 5 * 60 * 1000) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const loadData = async () => {
        // キャッシュチェック
        const cached = getCachedData(key, ttl);
        if (cached) {
          setData(cached);
          setLoading(false);
          return;
        }

        // 新規取得
        try {
          const result = await fetchFunction();
          setCachedData(key, result);
          setData(result);
        } catch (error) {
          console.error('Data fetch error:', error);
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }, [key, fetchFunction, ttl]);

    return { data, loading };
  }
};

// キャッシュ機能
const DataCache = {
  set: (key, data, ttl = 5 * 60 * 1000) => {
    const item = {
      data,
      timestamp: Date.now(),
      ttl
    };
    localStorage.setItem(`analytics_cache_${key}`, JSON.stringify(item));
  },

  get: (key, maxAge = 5 * 60 * 1000) => {
    const item = localStorage.getItem(`analytics_cache_${key}`);
    if (!item) return null;

    const parsed = JSON.parse(item);
    if (Date.now() - parsed.timestamp > maxAge) {
      localStorage.removeItem(`analytics_cache_${key}`);
      return null;
    }

    return parsed.data;
  }
};
```

---

## 実装例

### 完全なWeb分析ダッシュボード

```javascript
// 完全実装例
const CompleteWebAnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(7);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // データ取得
  const fetchAnalyticsData = useCallback(async (days) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/analytics/dashboard?days=${days}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setAnalyticsData(result);

      // キャッシュに保存
      DataCache.set(`analytics_${days}`, result);

    } catch (err) {
      setError(err.message);
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初期データ読み込み
  useEffect(() => {
    fetchAnalyticsData(selectedPeriod);
  }, [selectedPeriod, fetchAnalyticsData]);

  // 自動更新
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAnalyticsData(selectedPeriod);
    }, 5 * 60 * 1000); // 5分ごと

    return () => clearInterval(interval);
  }, [autoRefresh, selectedPeriod, fetchAnalyticsData]);

  const handlePeriodChange = (days) => {
    setSelectedPeriod(days);
    EventTracking.trackDashboardInteraction('period_change', `${days}_days`);
  };

  const handleRefresh = () => {
    fetchAnalyticsData(selectedPeriod);
    EventTracking.trackDashboardInteraction('manual_refresh', 'button');
  };

  if (loading && !analyticsData) {
    return <AnalyticsLoadingSkeleton />;
  }

  if (error && !analyticsData) {
    return <AnalyticsErrorState error={error} onRetry={handleRefresh} />;
  }

  return (
    <div className="space-y-6">
      {/* コントロールパネル */}
      <AnalyticsControlPanel
        selectedPeriod={selectedPeriod}
        onPeriodChange={handlePeriodChange}
        autoRefresh={autoRefresh}
        onAutoRefreshToggle={setAutoRefresh}
        onRefresh={handleRefresh}
        loading={loading}
        timeRange={analyticsData?.timeRange}
      />

      {/* リアルタイム状況 */}
      {analyticsData?.data?.realtime && (
        <RealtimeStatus data={analyticsData.data.realtime} />
      )}

      {/* 概要メトリクス */}
      {analyticsData?.data?.combined?.overview ? (
        <OverviewMetrics data={analyticsData.data.combined.overview} />
      ) : (
        <DataPreparationNotice />
      )}

      {/* チャートセクション */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LazyTrafficTrendChart 
          ga4Data={analyticsData?.data?.ga4} 
          searchConsoleData={analyticsData?.data?.searchConsole} 
        />
        <LazySEOInsightsPanel 
          data={analyticsData?.data?.searchConsole} 
        />
      </div>

      {/* ページパフォーマンステーブル */}
      <LazyPagePerformanceTable 
        topPages={analyticsData?.data?.combined?.topPerformingPages}
        ga4Pages={analyticsData?.data?.ga4?.byPage}
        searchConsolePages={analyticsData?.data?.searchConsole?.byPage}
      />

      {/* データ状況パネル */}
      <DataStatusPanel 
        data={analyticsData} 
        onConnectionTest={handleConnectionTest}
      />

      {/* SEO推奨事項 */}
      {analyticsData?.data?.searchConsole && (
        <SEORecommendationsPanel 
          data={analyticsData.data.searchConsole}
        />
      )}
    </div>
  );
};
```

---

## エラーハンドリング

### 包括的エラー処理

```javascript
// エラーハンドリングシステム
const AnalyticsErrorHandler = {
  // API エラー分類・処理
  handleAPIError: (error) => {
    const errorTypes = {
      NETWORK_ERROR: /network|fetch/i,
      AUTH_ERROR: /401|403|unauthorized|forbidden/i,
      RATE_LIMIT: /429|rate.?limit/i,
      DATA_ERROR: /404|not.?found/i,
      SERVER_ERROR: /5\d{2}|server.?error/i
    };

    let errorType = 'UNKNOWN_ERROR';
    let userMessage = 'データの取得に失敗しました。';
    let retryable = true;

    for (const [type, pattern] of Object.entries(errorTypes)) {
      if (pattern.test(error.message)) {
        errorType = type;
        break;
      }
    }

    switch (errorType) {
      case 'NETWORK_ERROR':
        userMessage = 'ネットワーク接続を確認してください。';
        break;
      case 'AUTH_ERROR':
        userMessage = 'GoogleアカウントでGoogle AnalyticsとSearch Consoleのアクセス許可が必要です。';
        retryable = false;
        break;
      case 'RATE_LIMIT':
        userMessage = 'リクエスト制限に達しました。しばらく待ってから再試行してください。';
        break;
      case 'DATA_ERROR':
        userMessage = '指定された期間のデータが見つかりません。';
        break;
      case 'SERVER_ERROR':
        userMessage = 'サーバーエラーが発生しました。しばらく待ってから再試行してください。';
        break;
    }

    return {
      type: errorType,
      message: userMessage,
      originalError: error.message,
      retryable,
      timestamp: new Date().toISOString()
    };
  }
};
```

---

## トラブルシューティング

### よくある問題と解決策

#### 1. GA4接続エラー

```javascript
// GA4接続問題の診断・解決
const GA4Troubleshooter = {
  diagnoseConnection: async () => {
    const checks = [];
    
    // 環境変数チェック
    checks.push({
      name: 'GA4 Property ID',
      status: process.env.GA4_PROPERTY_ID ? 'OK' : 'MISSING',
      message: process.env.GA4_PROPERTY_ID ? 
        `Property ID: ${process.env.GA4_PROPERTY_ID}` : 
        'GA4_PROPERTY_ID環境変数が設定されていません'
    });

    // 認証チェック
    try {
      const testResponse = await ga4Service.testConnection();
      checks.push({
        name: 'GA4 API認証',
        status: 'OK',
        message: 'API認証成功'
      });
    } catch (error) {
      checks.push({
        name: 'GA4 API認証',
        status: 'ERROR',
        message: `認証エラー: ${error.message}`
      });
    }

    return checks;
  }
};
```

#### 2. Search Console接続エラー

```javascript
// Search Console接続問題の診断
const SearchConsoleTroubleshooter = {
  diagnoseConnection: async () => {
    const checks = [];

    // サイトURL確認
    checks.push({
      name: 'Search Console Site URL',
      status: process.env.SEARCH_CONSOLE_SITE_URL ? 'OK' : 'MISSING',
      message: process.env.SEARCH_CONSOLE_SITE_URL || 
        'SEARCH_CONSOLE_SITE_URL環境変数が設定されていません'
    });

    // サイト所有権確認
    try {
      const sites = await searchConsoleService.listSites();
      const siteFound = sites.some(site => 
        site.siteUrl === process.env.SEARCH_CONSOLE_SITE_URL
      );
      
      checks.push({
        name: 'サイト所有権',
        status: siteFound ? 'OK' : 'ERROR',
        message: siteFound ? 
          'サイトの所有権が確認されています' : 
          'Search Consoleでサイトの所有権確認が必要です'
      });
    } catch (error) {
      checks.push({
        name: 'サイト所有権',
        status: 'ERROR',
        message: `確認エラー: ${error.message}`
      });
    }

    return checks;
  }
};
```

#### 3. パフォーマンス問題

```javascript
// パフォーマンス最適化
const PerformanceTroubleshooter = {
  // 読み込み時間分析
  analyzeLoadTime: () => {
    const navigation = performance.getEntriesByType('navigation')[0];
    
    return {
      dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcpConnect: navigation.connectEnd - navigation.connectStart,
      request: navigation.responseStart - navigation.requestStart,
      response: navigation.responseEnd - navigation.responseStart,
      domProcessing: navigation.domContentLoadedEventEnd - navigation.responseEnd,
      total: navigation.loadEventEnd - navigation.fetchStart
    };
  },

  // メモリ使用量監視
  monitorMemoryUsage: () => {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576),
        total: Math.round(performance.memory.totalJSHeapSize / 1048576),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
      };
    }
    return null;
  }
};
```

---

このマニュアルは、Web分析機能の包括的な実装・運用ガイドです。GA4とSearch Consoleの統合から高度なSEO分析まで、全ての重要な機能を効率的に管理・活用するためのベストプラクティスを提供します。