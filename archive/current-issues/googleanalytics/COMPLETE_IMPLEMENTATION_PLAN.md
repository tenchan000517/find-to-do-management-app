# GA4 + Search Console 統合分析ダッシュボード　完全実装計画書

## 📋 実装概要

既存システム基盤を活用し、GA4 Data API と Search Console API を統合したデジタルマーケティング分析ダッシュボードを構築します。

### 🎯 実現可能性評価済み機能（80%以上）
- ✅ GA4 基本レポート取得・表示
- ✅ リアルタイムデータ監視
- ✅ Search Console SEOデータ統合
- ✅ コンバージョンファネル分析
- ✅ トラフィック流入元分析
- ✅ ページパフォーマンス分析
- ✅ デバイス・地域別分析
- ✅ 期間比較・トレンド分析

---

## 🏗️ フェーズ1: 基盤構築（3-4日）

### 1.1 認証・環境設定

```typescript
// 📁 config/analytics-config.ts
export const ANALYTICS_CONFIG = {
  ga4PropertyId: process.env.GA4_PROPERTY_ID!,
  serviceAccountPath: process.env.GOOGLE_APPLICATION_CREDENTIALS!,
  gscSiteUrl: process.env.GSC_SITE_URL!,
  
  // レート制限設定
  rateLimits: {
    tokensPerHour: 50000,
    concurrentRequests: 50,
    retryDelay: 60000
  }
};

// 📁 .env.local
GA4_PROPERTY_ID=123456789
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
GSC_SITE_URL=https://example.com
```

### 1.2 基本クライアント実装

```typescript
// 📁 src/lib/services/ga4-base-client.ts
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { GoogleAuth } from 'google-auth-library';

export class GA4BaseClient {
  protected client: BetaAnalyticsDataClient;
  protected propertyId: string;

  constructor() {
    const auth = new GoogleAuth({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/analytics.readonly'
      ]
    });

    this.client = new BetaAnalyticsDataClient({ auth });
    this.propertyId = `properties/${process.env.GA4_PROPERTY_ID}`;
  }

  // 接続テスト
  async testConnection(): Promise<boolean> {
    try {
      const [response] = await this.client.runReport({
        property: this.propertyId,
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        metrics: [{ name: 'activeUsers' }]
      });
      return !!response.metricHeaders;
    } catch (error) {
      console.error('GA4接続エラー:', error);
      return false;
    }
  }
}
```

### 1.3 Search Console クライアント

```typescript
// 📁 src/lib/services/search-console-client.ts
import { google } from 'googleapis';

export class SearchConsoleClient {
  private client: any;
  private siteUrl: string;

  constructor() {
    const auth = new google.auth.GoogleAuth({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
    });

    this.client = google.searchconsole({ version: 'v1', auth });
    this.siteUrl = process.env.GSC_SITE_URL!;
  }

  async getSearchPerformance(dateRange: { startDate: string; endDate: string }) {
    const response = await this.client.searchanalytics.query({
      siteUrl: this.siteUrl,
      requestBody: {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        dimensions: ['page', 'query', 'country', 'device'],
        rowLimit: 1000
      }
    });

    return response.data.rows || [];
  }
}
```

### 1.4 API Routes 基盤

```typescript
// 📁 src/app/api/analytics/test/route.ts
export async function GET() {
  try {
    const ga4Client = new GA4BaseClient();
    const gscClient = new SearchConsoleClient();
    
    const [ga4Test, gscTest] = await Promise.all([
      ga4Client.testConnection(),
      gscClient.getSearchPerformance({
        startDate: '7daysAgo',
        endDate: 'today'
      }).then(() => true).catch(() => false)
    ]);

    return NextResponse.json({
      success: ga4Test && gscTest,
      ga4: ga4Test,
      searchConsole: gscTest,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

## 🏗️ フェーズ2: コアデータ取得（4-5日）

### 2.1 GA4レポートサービス

```typescript
// 📁 src/lib/services/ga4-reports-service.ts
export class GA4ReportsService extends GA4BaseClient {
  
  // 基本メトリクス取得
  async getBasicMetrics(dateRange: DateRange): Promise<BasicMetrics> {
    const [response] = await this.client.runReport({
      property: this.propertyId,
      dateRanges: [dateRange],
      dimensions: [
        { name: 'date' },
        { name: 'pagePath' },
        { name: 'deviceCategory' },
        { name: 'country' },
        { name: 'source' },
        { name: 'medium' }
      ],
      metrics: [
        { name: 'activeUsers' },
        { name: 'newUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' }
      ],
      limit: 10000
    });

    return this.transformBasicData(response);
  }

  // リアルタイムデータ取得
  async getRealtimeData(): Promise<RealtimeData> {
    const [response] = await this.client.runRealtimeReport({
      property: this.propertyId,
      dimensions: [
        { name: 'deviceCategory' },
        { name: 'country' }
      ],
      metrics: [{ name: 'activeUsers' }]
    });

    return this.transformRealtimeData(response);
  }

  // コンバージョン分析
  async getConversionData(dateRange: DateRange): Promise<ConversionData> {
    const [response] = await this.client.runReport({
      property: this.propertyId,
      dateRanges: [dateRange],
      dimensions: [
        { name: 'eventName' },
        { name: 'source' },
        { name: 'medium' }
      ],
      metrics: [
        { name: 'eventCount' },
        { name: 'totalRevenue' }
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          inListFilter: {
            values: ['purchase', 'form_submit', 'sign_up', 'download']
          }
        }
      }
    });

    return this.transformConversionData(response);
  }

  // 流入元分析
  async getTrafficSources(dateRange: DateRange): Promise<TrafficSourceData> {
    const [response] = await this.client.runReport({
      property: this.propertyId,
      dateRanges: [dateRange],
      dimensions: [
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
        { name: 'sessionCampaignName' }
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'newUsers' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' }
      ],
      orderBys: [
        {
          metric: { metricName: 'sessions' },
          desc: true
        }
      ],
      limit: 50
    });

    return this.transformTrafficData(response);
  }

  // ページパフォーマンス分析
  async getPagePerformance(dateRange: DateRange): Promise<PagePerformanceData> {
    const [response] = await this.client.runReport({
      property: this.propertyId,
      dateRanges: [dateRange],
      dimensions: [
        { name: 'pagePath' },
        { name: 'pageTitle' }
      ],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'uniquePageViews' },
        { name: 'averageTimeOnPage' },
        { name: 'exitRate' }
      ],
      orderBys: [
        {
          metric: { metricName: 'screenPageViews' },
          desc: true
        }
      ],
      limit: 100
    });

    return this.transformPageData(response);
  }

  // 期間比較分析
  async getComparisonReport(
    currentPeriod: DateRange, 
    previousPeriod: DateRange
  ): Promise<ComparisonData> {
    const [response] = await this.client.runReport({
      property: this.propertyId,
      dateRanges: [currentPeriod, previousPeriod],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' }
      ]
    });

    return this.transformComparisonData(response);
  }
}
```

### 2.2 統合データサービス

```typescript
// 📁 src/lib/services/integrated-analytics-service.ts
export class IntegratedAnalyticsService {
  private ga4Service: GA4ReportsService;
  private gscService: SearchConsoleClient;

  constructor() {
    this.ga4Service = new GA4ReportsService();
    this.gscService = new SearchConsoleClient();
  }

  // 統合ダッシュボードデータ
  async getDashboardData(dateRange: DateRange): Promise<DashboardData> {
    const [
      basicMetrics,
      realtimeData,
      conversionData,
      trafficSources,
      pagePerformance,
      searchPerformance
    ] = await Promise.all([
      this.ga4Service.getBasicMetrics(dateRange),
      this.ga4Service.getRealtimeData(),
      this.ga4Service.getConversionData(dateRange),
      this.ga4Service.getTrafficSources(dateRange),
      this.ga4Service.getPagePerformance(dateRange),
      this.gscService.getSearchPerformance(dateRange)
    ]);

    return {
      overview: this.calculateOverviewMetrics(basicMetrics),
      realtime: realtimeData,
      conversions: conversionData,
      traffic: trafficSources,
      pages: this.correlatePageData(pagePerformance, searchPerformance),
      seo: this.transformSEOData(searchPerformance),
      insights: this.generateInsights(basicMetrics, searchPerformance)
    };
  }

  // ページデータとSEOデータの相関
  private correlatePageData(ga4Pages: any[], gscData: any[]) {
    return ga4Pages.map(page => {
      const seoData = gscData.find(gsc => gsc.keys?.[0] === page.pagePath);
      
      return {
        ...page,
        organicClicks: seoData?.clicks || 0,
        impressions: seoData?.impressions || 0,
        avgPosition: seoData?.position || 0,
        ctr: seoData?.ctr || 0,
        // 計算メトリクス
        seoEfficiency: this.calculateSEOEfficiency(page, seoData),
        trafficQuality: this.calculateTrafficQuality(page)
      };
    });
  }

  // SEO効率計算
  private calculateSEOEfficiency(ga4Data: any, gscData: any): number {
    if (!gscData || gscData.impressions === 0) return 0;
    
    const organicTrafficRatio = gscData.clicks / (ga4Data.screenPageViews || 1);
    const positionScore = Math.max(0, (100 - gscData.position) / 100);
    
    return (organicTrafficRatio * positionScore * 100);
  }
}
```

### 2.3 データ取得API Routes

```typescript
// 📁 src/app/api/analytics/dashboard/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30');
  const includeRealtime = searchParams.get('realtime') === 'true';

  try {
    const analyticsService = new IntegratedAnalyticsService();
    const dateRange = {
      startDate: `${days}daysAgo`,
      endDate: 'today'
    };

    const dashboardData = await analyticsService.getDashboardData(dateRange);

    return NextResponse.json({
      success: true,
      data: dashboardData,
      dateRange,
      includeRealtime,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

## 🏗️ フェーズ3: UI・可視化コンポーネント（5-6日）

### 3.1 メインダッシュボード

```typescript
// 📁 src/components/analytics/AnalyticsDashboard.tsx
import { LineChart, BarChart, PieChart, AreaChart } from 'recharts';
import { useState, useEffect } from 'react';

export function AnalyticsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [timeRange, setTimeRange] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [realtimeEnabled, setRealtimeEnabled] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/analytics/dashboard?days=${timeRange}&realtime=${realtimeEnabled}`
      );
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // リアルタイムモード時の自動更新
    if (realtimeEnabled) {
      const interval = setInterval(fetchData, 30000); // 30秒ごと
      return () => clearInterval(interval);
    }
  }, [timeRange, realtimeEnabled]);

  if (isLoading) return <LoadingSpinner />;
  if (!data) return <div>データがありません</div>;

  return (
    <div className="space-y-6">
      {/* コントロールパネル */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <div className="flex space-x-4">
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          <RealtimeToggle enabled={realtimeEnabled} onChange={setRealtimeEnabled} />
        </div>
      </div>

      {/* リアルタイムステータス */}
      {realtimeEnabled && (
        <RealtimeStatus data={data.realtime} />
      )}

      {/* 概要メトリクス */}
      <OverviewMetrics data={data.overview} />

      {/* メインチャート群 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrafficTrendChart data={data.overview.dailyTrend} />
        <ConversionFunnelChart data={data.conversions} />
        <TrafficSourceChart data={data.traffic} />
        <DeviceBreakdownChart data={data.overview.deviceData} />
      </div>

      {/* ページパフォーマンステーブル */}
      <PagePerformanceTable data={data.pages} />

      {/* SEO分析 */}
      <SEOInsightsPanel data={data.seo} />

      {/* 改善提案 */}
      <InsightsRecommendations insights={data.insights} />
    </div>
  );
}
```

### 3.2 詳細分析コンポーネント

```typescript
// 📁 src/components/analytics/TrafficTrendChart.tsx
export function TrafficTrendChart({ data }: { data: DailyTrendData[] }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">トラフィック推移</h3>
      <AreaChart width={500} height={300} data={data}>
        <defs>
          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorPageViews" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="date" />
        <YAxis />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="users"
          stroke="#8884d8"
          fillOpacity={1}
          fill="url(#colorUsers)"
          name="ユーザー数"
        />
        <Area
          type="monotone"
          dataKey="pageViews"
          stroke="#82ca9d"
          fillOpacity={1}
          fill="url(#colorPageViews)"
          name="ページビュー"
        />
      </AreaChart>
    </div>
  );
}

// 📁 src/components/analytics/ConversionFunnelChart.tsx
export function ConversionFunnelChart({ data }: { data: ConversionData }) {
  const funnelData = [
    { step: 'セッション', count: data.sessions, rate: 100 },
    { step: 'ページビュー', count: data.pageViews, rate: (data.pageViews / data.sessions) * 100 },
    { step: 'イベント', count: data.events, rate: (data.events / data.sessions) * 100 },
    { step: 'コンバージョン', count: data.conversions, rate: (data.conversions / data.sessions) * 100 }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">コンバージョンファネル</h3>
      <BarChart width={500} height={300} data={funnelData}>
        <XAxis dataKey="step" />
        <YAxis />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip 
          formatter={(value, name) => [
            name === 'count' ? value : `${value.toFixed(1)}%`,
            name === 'count' ? '件数' : '率'
          ]}
        />
        <Bar dataKey="count" fill="#8884d8" name="件数" />
      </BarChart>
      
      {/* 離脱率表示 */}
      <div className="mt-4 grid grid-cols-4 gap-2 text-sm">
        {funnelData.map((step, index) => (
          <div key={step.step} className="text-center">
            <div className="font-medium">{step.step}</div>
            <div className="text-gray-600">{step.rate.toFixed(1)}%</div>
            {index > 0 && (
              <div className="text-red-600 text-xs">
                離脱: {(funnelData[index-1].rate - step.rate).toFixed(1)}%
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 📁 src/components/analytics/PagePerformanceTable.tsx
export function PagePerformanceTable({ data }: { data: PageData[] }) {
  const [sortField, setSortField] = useState<keyof PageData>('screenPageViews');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedData = [...data].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    return (aVal > bVal ? 1 : -1) * multiplier;
  });

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold">ページパフォーマンス</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader field="pagePath" label="ページ" 
                sortField={sortField} sortDirection={sortDirection}
                onSort={(field, direction) => {
                  setSortField(field);
                  setSortDirection(direction);
                }}
              />
              <SortableHeader field="screenPageViews" label="PV" 
                sortField={sortField} sortDirection={sortDirection}
                onSort={(field, direction) => {
                  setSortField(field);
                  setSortDirection(direction);
                }}
              />
              <SortableHeader field="organicClicks" label="オーガニック" 
                sortField={sortField} sortDirection={sortDirection}
                onSort={(field, direction) => {
                  setSortField(field);
                  setSortDirection(direction);
                }}
              />
              <SortableHeader field="avgPosition" label="平均順位" 
                sortField={sortField} sortDirection={sortDirection}
                onSort={(field, direction) => {
                  setSortField(field);
                  setSortDirection(direction);
                }}
              />
              <SortableHeader field="seoEfficiency" label="SEO効率" 
                sortField={sortField} sortDirection={sortDirection}
                onSort={(field, direction) => {
                  setSortField(field);
                  setSortDirection(direction);
                }}
              />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.slice(0, 20).map((page, index) => (
              <tr key={page.pagePath} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="max-w-xs truncate" title={page.pagePath}>
                    {page.pagePath}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {page.screenPageViews.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {page.organicClicks.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${
                    page.avgPosition <= 10 ? 'bg-green-100 text-green-800' :
                    page.avgPosition <= 20 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {page.avgPosition.toFixed(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(page.seoEfficiency, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs">{page.seoEfficiency.toFixed(0)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## 🏗️ フェーズ4: 高度分析機能（4-5日）

### 4.1 コホート分析

```typescript
// 📁 src/lib/services/cohort-analysis-service.ts
export class CohortAnalysisService extends GA4BaseClient {
  
  async getCohortAnalysis(cohortWeeks: number = 12): Promise<CohortData> {
    const cohortData = [];
    
    for (let week = 0; week < cohortWeeks; week++) {
      const cohortStartDate = `${week * 7 + 7}daysAgo`;
      const cohortEndDate = `${week * 7}daysAgo`;
      
      const [response] = await this.client.runReport({
        property: this.propertyId,
        dateRanges: [{ startDate: cohortStartDate, endDate: cohortEndDate }],
        dimensions: [
          { name: 'cohort' },
          { name: 'cohortNthWeek' }
        ],
        metrics: [
          { name: 'cohortActiveUsers' },
          { name: 'cohortTotalUsers' }
        ]
      });

      cohortData.push(this.transformCohortData(response, week));
    }

    return this.calculateRetentionRates(cohortData);
  }
}
```

### 4.2 予測分析

```typescript
// 📁 src/lib/utils/trend-predictor.ts
export class TrendPredictor {
  
  // 線形回帰による予測
  static predictTrend(data: number[], periods: number = 7): number[] {
    const n = data.length;
    const xSum = data.reduce((sum, _, i) => sum + i, 0);
    const ySum = data.reduce((sum, val) => sum + val, 0);
    const xySum = data.reduce((sum, val, i) => sum + i * val, 0);
    const x2Sum = data.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
    const intercept = (ySum - slope * xSum) / n;

    const predictions = [];
    for (let i = n; i < n + periods; i++) {
      predictions.push(Math.max(0, slope * i + intercept));
    }

    return predictions;
  }

  // 移動平均による平滑化
  static smoothData(data: number[], windowSize: number = 7): number[] {
    const smoothed = [];
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(data.length, i + Math.floor(windowSize / 2) + 1);
      const window = data.slice(start, end);
      const average = window.reduce((sum, val) => sum + val, 0) / window.length;
      smoothed.push(average);
    }
    return smoothed;
  }
}
```

### 4.3 改善提案エンジン

```typescript
// 📁 src/lib/services/insights-engine.ts
export class InsightsEngine {
  
  static generateInsights(data: DashboardData): Insight[] {
    const insights: Insight[] = [];

    // SEO改善提案
    insights.push(...this.analyzeSEOOpportunities(data.pages));
    
    // コンバージョン改善提案
    insights.push(...this.analyzeConversionOpportunities(data.conversions));
    
    // トラフィック改善提案
    insights.push(...this.analyzeTrafficOpportunities(data.traffic));
    
    // パフォーマンス警告
    insights.push(...this.detectPerformanceIssues(data.overview));

    return insights.sort((a, b) => b.priority - a.priority);
  }

  private static analyzeSEOOpportunities(pages: PageData[]): Insight[] {
    const insights: Insight[] = [];

    // 高インプレッション、低クリック率のページ
    const lowCTRPages = pages.filter(page => 
      page.impressions > 1000 && page.ctr < 0.02
    );

    if (lowCTRPages.length > 0) {
      insights.push({
        type: 'seo_opportunity',
        title: 'CTR改善の機会',
        message: `${lowCTRPages.length}ページでCTRが2%未満です。タイトル・説明文の最適化を検討してください。`,
        priority: 0.8,
        actionItems: [
          'メタタイトルの見直し',
          'メタディスクリプションの改善',
          '構造化データの追加'
        ],
        affectedPages: lowCTRPages.slice(0, 5).map(p => p.pagePath)
      });
    }

    // 検索順位が低いが可能性のあるページ
    const potentialPages = pages.filter(page =>
      page.avgPosition > 20 && page.impressions > 500
    );

    if (potentialPages.length > 0) {
      insights.push({
        type: 'seo_opportunity',
        title: '検索順位改善の機会',
        message: `${potentialPages.length}ページで順位向上の余地があります。`,
        priority: 0.7,
        actionItems: [
          'コンテンツの充実化',
          '内部リンクの最適化',
          'キーワード密度の調整'
        ],
        affectedPages: potentialPages.slice(0, 5).map(p => p.pagePath)
      });
    }

    return insights;
  }

  private static analyzeConversionOpportunities(conversions: ConversionData): Insight[] {
    const insights: Insight[] = [];

    // コンバージョン率の分析
    const conversionRate = conversions.conversions / conversions.sessions;
    
    if (conversionRate < 0.02) { // 2%未満
      insights.push({
        type: 'conversion_improvement',
        title: 'コンバージョン率が低下しています',
        message: `現在のコンバージョン率は${(conversionRate * 100).toFixed(2)}%です。`,
        priority: 0.9,
        actionItems: [
          'ランディングページの最適化',
          'CTA の改善',
          'フォームの簡素化',
          'ページ読み込み速度の改善'
        ]
      });
    }

    return insights;
  }
}
```

---

## 📊 実装スケジュール

| フェーズ | 期間 | 主要成果物 | 実現可能性 |
|---------|------|------------|------------|
| フェーズ1 | 3-4日 | 認証基盤、基本クライアント | 95% |
| フェーズ2 | 4-5日 | データ取得サービス、API Routes | 90% |
| フェーズ3 | 5-6日 | UI コンポーネント、可視化 | 85% |
| フェーズ4 | 4-5日 | 高度分析、改善提案 | 80% |
| **合計** | **16-20日** | **完全な分析ダッシュボード** | **87.5%** |

---

## 🔧 技術仕様

### 必要なパッケージ
```bash
npm install @google-analytics/data googleapis google-auth-library recharts
npm install -D @types/node
```

### 環境変数
```env
GA4_PROPERTY_ID=123456789
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
GSC_SITE_URL=https://example.com
```

### APIレート制限対策
- 1時間あたり50,000トークン制限
- 同時リクエスト数50以下
- エラー時の指数バックオフ実装

### データ最大化戦略
- バッチリクエストによる効率化
- キャッシュによるレスポンス改善
- リアルタイムデータの適切な更新間隔

この実装計画により、確実で高機能なデジタルマーケティング分析ダッシュボードを構築できます。