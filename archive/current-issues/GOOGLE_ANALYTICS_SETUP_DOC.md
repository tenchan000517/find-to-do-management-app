# GA4 Data API活用 軽量SEO分析ダッシュボード 実装ガイド

## 1. 事前準備・認証設定

### 1.1 Google Cloud プロジェクト設定
```bash
# gcloud CLI をインストールして初期化
gcloud auth application-default login --scopes="https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/analytics.readonly"
```

### 1.2 API有効化
- **Google Analytics Data API v1** を有効にする
- **Google Analytics Admin API** を有効にする（管理機能が必要な場合）

### 1.3 SDK インストール
```bash
# Node.js/TypeScript環境の場合
npm install @google-analytics/data
```

### 1.4 サービスアカウント設定
```typescript
// 環境変数設定
process.env.GOOGLE_APPLICATION_CREDENTIALS = "/path/to/service-account-key.json"
// または
process.env.GA4_SERVICE_ACCOUNT_KEY = "/path/to/service-account-key.json"
```

## 2. 基本レポート取得実装（runReport）

### 2.1 基本的なレポート作成
```typescript
import { BetaAnalyticsDataClient } from '@google-analytics/data';

// データソース指定（必須）
const propertyId = 'properties/GA_PROPERTY_ID';

// 基本リクエスト構造
const request = {
  property: propertyId,
  dateRanges: [{ startDate: "2023-09-01", endDate: "2023-09-15" }],
  dimensions: [{ name: "country" }],
  metrics: [{ name: "activeUsers" }]
};
```

### 2.2 利用可能なディメンションとメトリクス
```typescript
// 主要ディメンション
const dimensions = [
  { name: "date" },        // 日付
  { name: "pagePath" },    // ページパス
  { name: "country" },     // 国
  { name: "city" },        // 都市  
  { name: "browser" },     // ブラウザ
  { name: "deviceCategory" }, // デバイス
  { name: "source" },      // 参照元
  { name: "medium" },      // メディア
  { name: "eventName" }    // イベント名
];

// 主要メトリクス
const metrics = [
  { name: "activeUsers" },     // アクティブユーザー
  { name: "newUsers" },        // 新規ユーザー
  { name: "sessions" },        // セッション数
  { name: "screenPageViews" }, // ページビュー
  { name: "bounceRate" },      // 直帰率
  { name: "totalRevenue" },    // 総収益
  { name: "eventCount" }       // イベント数
];
```

### 2.3 複数期間の比較
```typescript
const comparePeriodsRequest = {
  property: propertyId,
  dateRanges: [
    { startDate: "2022-08-01", endDate: "2022-08-14" },
    { startDate: "2023-08-01", endDate: "2023-08-14" }
  ],
  dimensions: [{ name: "platform" }],
  metrics: [{ name: "activeUsers" }]
};

// レスポンスには自動的にdateRange列が追加される
// dateRange列の値: "date_range_0", "date_range_1"
```

## 3. フィルタリング機能

### 3.1 基本フィルタ
```typescript
// 単一条件フィルタ
const dimensionFilter = {
  filter: {
    fieldName: "eventName",
    stringFilter: {
      value: "first_open"
    }
  }
};

// リストフィルタ（複数値）
const inListFilter = {
  filter: {
    fieldName: "eventName", 
    inListFilter: {
      values: ["purchase", "in_app_purchase", "app_store_subscription_renew"]
    }
  }
};
```

### 3.2 複合フィルタ
```typescript
// AND条件
const andFilter = {
  andGroup: {
    expressions: [
      {
        filter: {
          fieldName: "browser",
          stringFilter: { value: "Chrome" }
        }
      },
      {
        filter: {
          fieldName: "countryId", 
          stringFilter: { value: "US" }
        }
      }
    ]
  }
};

// NOT条件（除外）
const notFilter = {
  notExpression: {
    filter: {
      fieldName: "pageTitle",
      stringFilter: { value: "My Homepage" }
    }
  }
};
```

## 4. ページネーション（大量データ処理）

### 4.1 基本ページネーション
```typescript
// 最初の250,000行
const firstBatch = {
  property: propertyId,
  dateRanges: [{ startDate: "7daysAgo", endDate: "yesterday" }],
  dimensions: [{ name: "pagePath" }],
  metrics: [{ name: "screenPageViews" }],
  limit: 250000,
  offset: 0
};

// 次の250,000行
const secondBatch = {
  // ... 同じパラメータ
  limit: 250000,
  offset: 250000
};

// rowCountで総行数を確認
// 例: "rowCount": 572345 の場合、3回のリクエストが必要
```

## 5. ピボットレポート（runPivotReport）

### 5.1 基本ピボット構造
```typescript
const pivotRequest = {
  property: propertyId,
  dateRanges: [{ startDate: "2020-09-01", endDate: "2020-09-15" }],
  dimensions: [
    { name: "browser" },
    { name: "country" }, 
    { name: "language" }
  ],
  metrics: [{ name: "sessions" }],
  pivots: [
    {
      fieldNames: ["browser"],
      limit: 5
    },
    {
      fieldNames: ["country"],
      limit: 250
    },
    {
      fieldNames: ["language"], 
      limit: 15
    }
  ]
};
```

### 5.2 ピボット制限事項
```typescript
// 重要: 各ピボットのlimitパラメータの積が100,000を超えてはいけない
// 例: 5 × 250 × 15 = 18,750 ✓ OK
// 例: 100 × 100 × 50 = 500,000 ✗ NG

// ピボットの並び替え
const pivotWithOrdering = {
  fieldNames: ["browser"],
  limit: 5,
  orderBys: [
    {
      metric: {
        metricName: "sessions"
      },
      desc: true
    }
  ]
};
```

### 5.3 メトリクス集計
```typescript
const pivotWithAggregation = {
  fieldNames: ["browser"],
  limit: 10,
  metricAggregations: ["TOTAL"] // 合計値を計算
};

// レスポンスのaggregatesフィールドに集計値が含まれる
// dimensionValuesに "RESERVED_TOTAL" が表示される
```

## 6. リアルタイムレポート

### 6.1 runRealtimeReport実装
```typescript
const realtimeRequest = {
  property: propertyId,
  dimensions: [
    { name: "country" },
    { name: "deviceCategory" }
  ],
  metrics: [{ name: "activeUsers" }]
};

// リアルタイムデータは過去30分間のデータ
```

## 7. バッチレポート（複数レポート一括取得）

### 7.1 batchRunReports実装
```typescript
const batchRequest = {
  property: propertyId,
  requests: [
    {
      dateRanges: [{ startDate: "7daysAgo", endDate: "yesterday" }],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }]
    },
    {
      dateRanges: [{ startDate: "7daysAgo", endDate: "yesterday" }],
      dimensions: [{ name: "source" }], 
      metrics: [{ name: "sessions" }]
    }
  ]
};

// レスポンス: response.reports[0], response.reports[1]
```

## 8. カスタムディメンション・メトリクス

### 8.1 Metadata APIでカスタム定義取得
```typescript
// プロパティのメタデータ取得
const metadataRequest = `GET https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}/metadata`;

// カスタムディメンション例
const customDimensions = [
  { name: "customEvent:achievement_id" },  // イベントスコープ
  { name: "customUser:last_level" }        // ユーザースコープ
];

// カスタムメトリクス例
const customMetrics = [
  { name: "customEvent:credits_spent" },           // イベントスコープ
  { name: "averageCustomEvent:credits_spent" },    // 平均値
  { name: "sessionKeyEventRate:add_to_cart" }      // キーイベント率
];
```

## 9. エラーハンドリング・レート制限

### 9.1 レート制限対策
```typescript
// GA4 Data API制限: 1時間あたり50,000トークン
class GA4RateLimiter {
  private tokenUsage = 0;
  private hourlyLimit = 50000;

  async execute<T>(apiCall: () => Promise<T>, estimatedTokens: number): Promise<T> {
    if (this.tokenUsage + estimatedTokens > this.hourlyLimit) {
      throw new Error('レート制限に達しました');
    }

    const result = await apiCall();
    this.tokenUsage += estimatedTokens;
    return result;
  }
}
```

### 9.2 一般的なエラー処理
```typescript
const handleGA4Error = (error: any) => {
  if (error.code === 429) {
    // レート制限
    console.error('APIレート制限に達しました');
  } else if (error.code === 403) {
    // 権限エラー
    console.error('GA4プロパティへのアクセス権限がありません');
  } else if (error.code === 400) {
    // リクエストエラー
    console.error('無効なリクエストパラメータ');
  }
};
```

## 10. レスポンス構造理解

### 10.1 標準レポートレスポンス
```typescript
interface RunReportResponse {
  dimensionHeaders: [{ name: "country" }];
  metricHeaders: [{ name: "activeUsers", type: "TYPE_INTEGER" }];
  rows: [
    {
      dimensionValues: [{ value: "Japan" }],
      metricValues: [{ value: "2541" }]
    }
  ];
  rowCount: number;
  metadata: {};
}
```

### 10.2 ピボットレスポンス特徴
```typescript
// ピボットレポートでは各行が表の1つのセルを表す
// 通常レポートでは1行が表の行全体を表す

interface PivotResponse {
  pivotHeaders: [...]; // ピボット列ヘッダー
  dimensionHeaders: [...];
  metricHeaders: [...];
  rows: [
    // 各行は1つのセル
    {
      dimensionValues: [
        { value: "Chrome" },    // browser
        { value: "United States" }, // country  
        { value: "English" }    // language
      ],
      metricValues: [{ value: "1" }] // sessions
    }
  ];
}
```

## 11. 日付とタイムゾーン処理

### 11.1 相対日付指定
```typescript
const dateRanges = [
  { startDate: "7daysAgo", endDate: "yesterday" },
  { startDate: "30daysAgo", endDate: "today" },
  { startDate: "2020-03-31", endDate: "today" }
];
```

### 11.2 プロパティのタイムゾーン
```typescript
// GA4プロパティのタイムゾーン設定が適用される
// event_timestamp（UTC）とevent_date（プロパティTZ）の違いに注意
```

これらの実装ガイドを参考に、提案されているフェーズ1-4の段階的な開発を進めることで、GA4 Data APIを最大限活用した軽量SEO分析ダッシュボードを構築できます。