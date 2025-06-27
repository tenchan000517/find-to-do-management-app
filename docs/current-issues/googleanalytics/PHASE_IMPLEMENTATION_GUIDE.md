# フェーズ別実装ガイド　GA4統合分析ダッシュボード

## 🎯 実装方針

セットアップドキュメントに完全準拠し、既存システムパターンを最大限活用した段階的実装

---

## 🚀 フェーズ1: 基盤構築（3-4日）

### 1.1 セットアップ・認証実装

#### パッケージインストール
```bash
# 必要パッケージの追加
npm install @google-analytics/data googleapis google-auth-library
```

#### 環境設定ファイル作成
```typescript
// 📁 config/analytics-config.ts
export const ANALYTICS_CONFIG = {
  // 基本設定
  ga4PropertyId: process.env.GA4_PROPERTY_ID!,
  gscSiteUrl: process.env.GSC_SITE_URL!,
  
  // 認証設定（セットアップドキュメント準拠）
  auth: {
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS!,
    scopes: [
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/webmasters.readonly'
    ]
  },
  
  // API制限設定（ドキュメント仕様準拠）
  limits: {
    tokensPerHour: 50000,
    maxConcurrentRequests: 50,
    maxServerErrors: 50,
    retryDelay: 1000
  }
} as const;

// 型定義
export type AnalyticsConfig = typeof ANALYTICS_CONFIG;
```

#### GA4基盤クライアント実装
```typescript
// 📁 src/lib/services/ga4-base-client.ts
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { GoogleAuth } from 'google-auth-library';
import { ANALYTICS_CONFIG } from '@/config/analytics-config';

export class GA4BaseClient {
  protected client: BetaAnalyticsDataClient;
  protected propertyId: string;
  private tokenUsage: number = 0;
  private requestCount: number = 0;

  constructor() {
    // セットアップドキュメント準拠の認証
    const auth = new GoogleAuth(ANALYTICS_CONFIG.auth);
    
    this.client = new BetaAnalyticsDataClient({ auth });
    this.propertyId = `properties/${ANALYTICS_CONFIG.ga4PropertyId}`;
    
    console.log('✅ GA4クライアント初期化完了');
  }

  // 接続テスト（セットアップドキュメントのサンプルベース）
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 GA4接続テスト開始...');
      
      const [response] = await this.client.runReport({
        property: this.propertyId,
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        metrics: [{ name: 'activeUsers' }]
      });

      const hasData = !!response.metricHeaders?.length;
      console.log(hasData ? '✅ GA4接続成功' : '⚠️ GA4接続成功（データなし）');
      
      return hasData;
    } catch (error) {
      console.error('❌ GA4接続エラー:', error.message);
      return false;
    }
  }

  // レート制限管理（ドキュメント仕様準拠）
  protected async executeWithRateLimit<T>(
    operation: () => Promise<T>,
    estimatedTokens: number = 10
  ): Promise<T> {
    // トークン制限チェック
    if (this.tokenUsage + estimatedTokens > ANALYTICS_CONFIG.limits.tokensPerHour) {
      throw new Error('⚠️ APIトークン制限に達しました。1時間後に再試行してください。');
    }

    // 同時リクエスト制限チェック
    if (this.requestCount >= ANALYTICS_CONFIG.limits.maxConcurrentRequests) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.requestCount++;
    
    try {
      const result = await operation();
      this.tokenUsage += estimatedTokens;
      return result;
    } catch (error) {
      console.error('📊 GA4 API エラー:', error.message);
      throw error;
    } finally {
      this.requestCount--;
    }
  }
}
```

#### Search Console基盤クライアント
```typescript
// 📁 src/lib/services/search-console-base-client.ts
import { google } from 'googleapis';
import { ANALYTICS_CONFIG } from '@/config/analytics-config';

export class SearchConsoleBaseClient {
  protected client: any;
  protected siteUrl: string;

  constructor() {
    // 同じ認証設定を使用
    const auth = new google.auth.GoogleAuth(ANALYTICS_CONFIG.auth);
    
    this.client = google.searchconsole({ version: 'v1', auth });
    this.siteUrl = ANALYTICS_CONFIG.gscSiteUrl;
    
    console.log('✅ Search Consoleクライアント初期化完了');
  }

  // 接続テスト
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Search Console接続テスト開始...');
      
      const response = await this.client.sites.list();
      const sites = response.data.siteEntry || [];
      const hasSite = sites.some((site: any) => site.siteUrl === this.siteUrl);
      
      console.log(hasSite ? '✅ Search Console接続成功' : '⚠️ 対象サイトが見つかりません');
      
      return hasSite;
    } catch (error) {
      console.error('❌ Search Console接続エラー:', error.message);
      return false;
    }
  }
}
```

#### テスト用API Route実装
```typescript
// 📁 src/app/api/analytics/test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GA4BaseClient } from '@/lib/services/ga4-base-client';
import { SearchConsoleBaseClient } from '@/lib/services/search-console-base-client';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Analytics接続テスト開始...');
    
    const ga4Client = new GA4BaseClient();
    const gscClient = new SearchConsoleBaseClient();
    
    // 並列で接続テスト実行
    const [ga4Connected, gscConnected] = await Promise.all([
      ga4Client.testConnection(),
      gscClient.testConnection()
    ]);

    const allConnected = ga4Connected && gscConnected;
    
    return NextResponse.json({
      success: allConnected,
      services: {
        ga4: ga4Connected,
        searchConsole: gscConnected
      },
      message: allConnected ? 
        '🎉 すべてのサービスに正常に接続できました' : 
        '⚠️ 一部のサービスで接続エラーが発生しました',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ テストAPI実行エラー:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
```

### 1.2 環境変数設定

#### .env.local ファイル作成
```env
# GA4設定
GA4_PROPERTY_ID=123456789

# Google Service Account
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# Search Console
GSC_SITE_URL=https://example.com

# オプション設定
NODE_ENV=development
```

### 1.3 初期テスト実行

#### テストコマンド追加
```json
// package.json に追加
{
  "scripts": {
    "analytics:test": "curl http://localhost:3000/api/analytics/test"
  }
}
```

#### 接続確認手順
```bash
# 1. 開発サーバー起動
npm run dev

# 2. 別ターミナルで接続テスト
curl http://localhost:3000/api/analytics/test

# 期待されるレスポンス:
# {
#   "success": true,
#   "services": {
#     "ga4": true,
#     "searchConsole": true
#   },
#   "message": "🎉 すべてのサービスに正常に接続できました"
# }
```

---

## 🚀 フェーズ2: データ取得サービス（4-5日）

### 2.1 GA4レポートサービス実装

```typescript
// 📁 src/lib/services/ga4-reports-service.ts
import { GA4BaseClient } from './ga4-base-client';

export class GA4ReportsService extends GA4BaseClient {
  
  // 基本メトリクス取得（セットアップドキュメントの例を活用）
  async getBasicMetrics(dateRange: { startDate: string; endDate: string }) {
    return await this.executeWithRateLimit(async () => {
      console.log('📊 基本メトリクス取得開始...');
      
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
        limit: 10000 // セットアップドキュメント推奨値
      });

      console.log('✅ 基本メトリクス取得完了');
      return this.transformBasicData(response);
    }, 15); // 推定トークン使用量
  }

  // リアルタイムデータ取得（セットアップドキュメント準拠）
  async getRealtimeData() {
    return await this.executeWithRateLimit(async () => {
      console.log('⚡ リアルタイムデータ取得開始...');
      
      const [response] = await this.client.runRealtimeReport({
        property: this.propertyId,
        dimensions: [
          { name: 'deviceCategory' },
          { name: 'country' }
        ],
        metrics: [{ name: 'activeUsers' }]
      });

      console.log('✅ リアルタイムデータ取得完了');
      return this.transformRealtimeData(response);
    }, 5);
  }

  // バッチレポート取得（複数レポート一括取得）
  async getBatchReports(dateRange: { startDate: string; endDate: string }) {
    return await this.executeWithRateLimit(async () => {
      console.log('📋 バッチレポート取得開始...');
      
      const [response] = await this.client.batchRunReports({
        property: this.propertyId,
        requests: [
          // トラフィックソース分析
          {
            dateRanges: [dateRange],
            dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
            metrics: [{ name: 'sessions' }, { name: 'newUsers' }],
            orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
            limit: 20
          },
          // ページパフォーマンス
          {
            dateRanges: [dateRange],
            dimensions: [{ name: 'pagePath' }],
            metrics: [{ name: 'screenPageViews' }, { name: 'uniquePageViews' }],
            orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
            limit: 50
          },
          // デバイス分析
          {
            dateRanges: [dateRange],
            dimensions: [{ name: 'deviceCategory' }],
            metrics: [{ name: 'sessions' }, { name: 'bounceRate' }]
          }
        ]
      });

      console.log('✅ バッチレポート取得完了');
      return this.transformBatchData(response);
    }, 25);
  }

  // 期間比較レポート（セットアップドキュメントの複数期間機能活用）
  async getComparisonReport(
    currentPeriod: { startDate: string; endDate: string },
    previousPeriod: { startDate: string; endDate: string }
  ) {
    return await this.executeWithRateLimit(async () => {
      console.log('📈 期間比較レポート取得開始...');
      
      const [response] = await this.client.runReport({
        property: this.propertyId,
        dateRanges: [currentPeriod, previousPeriod], // 自動的にdateRange列が追加される
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' }
        ]
      });

      console.log('✅ 期間比較レポート取得完了');
      return this.transformComparisonData(response);
    }, 20);
  }

  // データ変換処理
  private transformBasicData(response: any) {
    const rows = response.rows || [];
    const dimensionHeaders = response.dimensionHeaders?.map((h: any) => h.name) || [];
    const metricHeaders = response.metricHeaders?.map((h: any) => h.name) || [];

    return {
      summary: {
        totalRows: response.rowCount || 0,
        dimensions: dimensionHeaders,
        metrics: metricHeaders
      },
      data: rows.map((row: any) => {
        const result: any = {};
        
        // ディメンション値をマッピング
        dimensionHeaders.forEach((header: string, index: number) => {
          result[header] = row.dimensionValues?.[index]?.value || '';
        });
        
        // メトリクス値をマッピング
        metricHeaders.forEach((header: string, index: number) => {
          const value = row.metricValues?.[index]?.value || '0';
          result[header] = header.includes('Rate') ? 
            parseFloat(value) : parseInt(value, 10);
        });
        
        return result;
      }),
      totals: response.totals?.[0]?.metricValues?.map((m: any, i: number) => ({
        metric: metricHeaders[i],
        value: parseFloat(m.value || '0')
      })) || []
    };
  }

  private transformRealtimeData(response: any) {
    const rows = response.rows || [];
    
    return {
      totalActiveUsers: rows.reduce((sum: number, row: any) => 
        sum + parseInt(row.metricValues?.[0]?.value || '0', 10), 0),
      breakdown: rows.map((row: any) => ({
        deviceCategory: row.dimensionValues?.[0]?.value || 'unknown',
        country: row.dimensionValues?.[1]?.value || 'unknown',
        activeUsers: parseInt(row.metricValues?.[0]?.value || '0', 10)
      }))
    };
  }

  private transformBatchData(response: any) {
    const reports = response.reports || [];
    
    return {
      trafficSources: this.transformBasicData(reports[0] || {}),
      pagePerformance: this.transformBasicData(reports[1] || {}),
      deviceAnalysis: this.transformBasicData(reports[2] || {})
    };
  }

  private transformComparisonData(response: any) {
    const rows = response.rows || [];
    
    const currentData: any[] = [];
    const previousData: any[] = [];

    rows.forEach((row: any) => {
      const dateRange = row.dimensionValues?.[1]?.value; // dateRange列
      const data = {
        date: row.dimensionValues?.[0]?.value,
        activeUsers: parseInt(row.metricValues?.[0]?.value || '0', 10),
        sessions: parseInt(row.metricValues?.[1]?.value || '0', 10),
        screenPageViews: parseInt(row.metricValues?.[2]?.value || '0', 10),
        bounceRate: parseFloat(row.metricValues?.[3]?.value || '0')
      };

      if (dateRange === 'date_range_0') {
        currentData.push(data);
      } else if (dateRange === 'date_range_1') {
        previousData.push(data);
      }
    });

    return { currentData, previousData };
  }
}
```

### 2.2 Search Console データサービス

```typescript
// 📁 src/lib/services/search-console-service.ts
import { SearchConsoleBaseClient } from './search-console-base-client';

export class SearchConsoleService extends SearchConsoleBaseClient {
  
  // 検索パフォーマンスデータ取得
  async getSearchPerformance(dateRange: { startDate: string; endDate: string }) {
    try {
      console.log('🔍 検索パフォーマンス取得開始...');
      
      const response = await this.client.searchanalytics.query({
        siteUrl: this.siteUrl,
        requestBody: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          dimensions: ['page', 'query', 'country', 'device'],
          rowLimit: 1000
        }
      });

      console.log('✅ 検索パフォーマンス取得完了');
      return this.transformSearchData(response.data);
    } catch (error) {
      console.error('❌ 検索パフォーマンス取得エラー:', error.message);
      throw error;
    }
  }

  // トップクエリ取得
  async getTopQueries(dateRange: { startDate: string; endDate: string }) {
    try {
      const response = await this.client.searchanalytics.query({
        siteUrl: this.siteUrl,
        requestBody: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          dimensions: ['query'],
          rowLimit: 100
        }
      });

      return this.transformQueryData(response.data);
    } catch (error) {
      console.error('❌ トップクエリ取得エラー:', error.message);
      throw error;
    }
  }

  // サイトマップ情報取得
  async getSitemaps() {
    try {
      const response = await this.client.sitemaps.list({
        siteUrl: this.siteUrl
      });

      return response.data.sitemap || [];
    } catch (error) {
      console.error('❌ サイトマップ取得エラー:', error.message);
      throw error;
    }
  }

  private transformSearchData(data: any) {
    const rows = data.rows || [];
    
    return {
      totalClicks: rows.reduce((sum: number, row: any) => sum + (row.clicks || 0), 0),
      totalImpressions: rows.reduce((sum: number, row: any) => sum + (row.impressions || 0), 0),
      averageCTR: rows.length > 0 ? 
        rows.reduce((sum: number, row: any) => sum + (row.ctr || 0), 0) / rows.length : 0,
      averagePosition: rows.length > 0 ? 
        rows.reduce((sum: number, row: any) => sum + (row.position || 0), 0) / rows.length : 0,
      pages: rows.map((row: any) => ({
        page: row.keys?.[0] || '',
        query: row.keys?.[1] || '',
        country: row.keys?.[2] || '',
        device: row.keys?.[3] || '',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0
      }))
    };
  }

  private transformQueryData(data: any) {
    const rows = data.rows || [];
    
    return rows.map((row: any) => ({
      query: row.keys?.[0] || '',
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0
    }));
  }
}
```

### 2.3 API Routes実装

```typescript
// 📁 src/app/api/analytics/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GA4ReportsService } from '@/lib/services/ga4-reports-service';
import { SearchConsoleService } from '@/lib/services/search-console-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30');
  const includeRealtime = searchParams.get('realtime') === 'true';

  try {
    console.log(`📊 ダッシュボードデータ取得開始 (${days}日間)`);
    
    const ga4Service = new GA4ReportsService();
    const gscService = new SearchConsoleService();
    
    const dateRange = {
      startDate: `${days}daysAgo`,
      endDate: 'today'
    };

    // 並列でデータ取得
    const promises = [
      ga4Service.getBasicMetrics(dateRange),
      ga4Service.getBatchReports(dateRange),
      gscService.getSearchPerformance(dateRange),
      gscService.getTopQueries(dateRange)
    ];

    if (includeRealtime) {
      promises.push(ga4Service.getRealtimeData());
    }

    const [
      basicMetrics,
      batchReports,
      searchPerformance,
      topQueries,
      realtimeData
    ] = await Promise.all(promises);

    console.log('✅ ダッシュボードデータ取得完了');

    return NextResponse.json({
      success: true,
      data: {
        overview: basicMetrics,
        traffic: batchReports.trafficSources,
        pages: batchReports.pagePerformance,
        devices: batchReports.deviceAnalysis,
        seo: {
          performance: searchPerformance,
          queries: topQueries
        },
        realtime: realtimeData || null
      },
      meta: {
        dateRange,
        includeRealtime,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ ダッシュボードAPI エラー:', error.message);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
```

### 2.4 データ統合サービス

```typescript
// 📁 src/lib/services/integrated-analytics-service.ts
export class IntegratedAnalyticsService {
  private ga4Service: GA4ReportsService;
  private gscService: SearchConsoleService;

  constructor() {
    this.ga4Service = new GA4ReportsService();
    this.gscService = new SearchConsoleService();
  }

  // ページレベルでのGA4とGSCデータ統合
  async getPageInsights(dateRange: { startDate: string; endDate: string }) {
    const [ga4Pages, gscData] = await Promise.all([
      this.ga4Service.getBatchReports(dateRange),
      this.gscService.getSearchPerformance(dateRange)
    ]);

    const pagePerformance = ga4Pages.pagePerformance.data;
    const searchData = gscData.pages;

    return pagePerformance.map((page: any) => {
      const seoData = searchData.find((seo: any) => 
        seo.page === page.pagePath || seo.page.includes(page.pagePath)
      );

      return {
        ...page,
        // SEOデータを追加
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

  private calculateSEOEfficiency(ga4Data: any, gscData: any): number {
    if (!gscData || gscData.impressions === 0) return 0;
    
    const organicRatio = gscData.clicks / Math.max(ga4Data.screenPageViews, 1);
    const positionScore = Math.max(0, (100 - gscData.position) / 100);
    
    return Math.min(100, organicRatio * positionScore * 100);
  }

  private calculateTrafficQuality(ga4Data: any): number {
    const avgTime = ga4Data.averageSessionDuration || 0;
    const bounceRate = ga4Data.bounceRate || 100;
    
    const timeScore = Math.min(avgTime / 180, 1); // 3分を最大とする
    const engagementScore = (100 - bounceRate) / 100;
    
    return (timeScore + engagementScore) * 50;
  }
}
```

---

## 🎯 フェーズ2完了時の確認事項

### テスト実行
```bash
# 基本テスト
curl "http://localhost:3000/api/analytics/dashboard?days=7"

# リアルタイム含む
curl "http://localhost:3000/api/analytics/dashboard?days=30&realtime=true"
```

### 期待されるレスポンス構造
```json
{
  "success": true,
  "data": {
    "overview": { "summary": {...}, "data": [...] },
    "traffic": { "data": [...] },
    "pages": { "data": [...] },
    "seo": {
      "performance": { "pages": [...] },
      "queries": [...]
    },
    "realtime": { "totalActiveUsers": 123 }
  },
  "meta": {
    "dateRange": { "startDate": "30daysAgo", "endDate": "today" },
    "generatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

フェーズ2完了時点で、すべての基本データ取得機能が動作し、API経由でデータにアクセスできる状態になります。

---

## 次のステップ

フェーズ3では、このデータを活用したUIコンポーネントとビジュアライゼーションを実装します。
