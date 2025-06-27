# GA4分析データ仕様書
## find-to-do.com 実装後取得可能データ一覧

### 📊 **基本メトリクス（自動取得）**

#### **1. トラフィック分析**
```javascript
// 利用可能メトリクス
{
  "sessions": "セッション数",
  "users": "ユーザー数", 
  "newUsers": "新規ユーザー数",
  "pageviews": "ページビュー数",
  "screenPageViews": "スクリーン/ページビュー",
  "bounceRate": "直帰率",
  "averageSessionDuration": "平均セッション時間",
  "sessionsPerUser": "ユーザーあたりセッション数"
}
```

#### **2. ユーザー属性**
```javascript
// 利用可能ディメンション
{
  "country": "国",
  "city": "都市", 
  "deviceCategory": "デバイス（desktop/mobile/tablet）",
  "operatingSystem": "OS",
  "browser": "ブラウザ",
  "language": "言語設定"
}
```

#### **3. トラフィックソース**
```javascript
{
  "source": "参照元",
  "medium": "メディア", 
  "campaign": "キャンペーン",
  "trafficSource": "トラフィックソース分類",
  "firstUserSource": "初回訪問時の参照元",
  "firstUserMedium": "初回訪問時のメディア"
}
```

### 🎯 **コンバージョン分析（カスタムイベント実装後）**

#### **1. お問い合わせコンバージョン**
```javascript
// API経由で取得可能なデータ
{
  "eventName": "contact_form_submit",
  "eventCount": "お問い合わせ送信回数",
  "conversionRate": "コンバージョン率",
  "eventValue": "イベント価値（1件あたり）",
  "usersByEvent": "お問い合わせしたユーザー数"
}

// 分析可能な指標
- 日別お問い合わせ件数
- 参照元別コンバージョン率
- デバイス別コンバージョン率  
- ページ経路別コンバージョン分析
```

#### **2. Discord参加コンバージョン**
```javascript
{
  "eventName": "discord_join_click", 
  "eventCount": "Discord参加クリック数",
  "clickThroughRate": "クリック率",
  "userEngagement": "エンゲージメント指標"
}
```

#### **3. サービスエンゲージメント**
```javascript
{
  "eventName": "service_view",
  "parameters": {
    "service_type": "webdev|event|intern",
    "page_location": "閲覧ページURL",
    "engagement_time": "エンゲージメント時間"
  }
}

// 分析レポート例
- サービス別人気度ランキング
- サービス閲覧からお問い合わせまでの導線分析
- サービスページ滞在時間分析
```

### 📈 **Enhanced Ecommerce データ（実装後）**

#### **1. 商品分析（サービス = 商品として扱い）**
```javascript
{
  "itemViews": "サービス詳細閲覧数",
  "itemName": "サービス名",
  "itemCategory": "サービスカテゴリ", 
  "itemRevenue": "想定売上（お問い合わせ単価）",
  "purchaseToDetailRate": "詳細閲覧→お問い合わせ率"
}
```

#### **2. ファネル分析**
```javascript
// 取得可能な顧客導線データ
{
  "funnel_steps": [
    {
      "step": "サイト訪問",
      "users": "訪問ユーザー数",
      "completion_rate": "100%"
    },
    {
      "step": "サービスページ閲覧", 
      "users": "サービス閲覧ユーザー数",
      "completion_rate": "例: 45%"
    },
    {
      "step": "お問い合わせページ訪問",
      "users": "お問い合わせページ訪問数", 
      "completion_rate": "例: 15%"
    },
    {
      "step": "お問い合わせ送信完了",
      "users": "実際の送信数",
      "completion_rate": "例: 8%"
    }
  ]
}
```

### 🔍 **リアルタイム分析データ**

#### **1. リアルタイムユーザー**
```javascript
{
  "activeUsers": "現在のアクティブユーザー数",
  "realtimeUsersByCountry": "国別リアルタイムユーザー",
  "realtimeUsersByDevice": "デバイス別リアルタイムユーザー",
  "realtimePageViews": "リアルタイムページビュー",
  "realtimeEvents": "リアルタイムイベント発生状況"
}
```

### 📊 **分析アプリで実装予定の新機能**

#### **1. ビジネスKPIダッシュボード**
```javascript
// 新しいコンポーネント
{
  "ConversionFunnelChart": "コンバージョンファネル可視化",
  "ServicePerformanceTable": "サービス別パフォーマンス",
  "LeadGenerationMetrics": "リード獲得指標",
  "ROICalculator": "投資収益率計算機",
  "CustomerJourneyMap": "カスタマージャーニー可視化"
}
```

#### **2. アラート機能**
```javascript
{
  "conversionAlert": "コンバージョン急減時のアラート",
  "trafficSpike": "トラフィック急増時の通知", 
  "errorTracking": "フォームエラー率監視",
  "goalTracking": "月次目標達成率追跡"
}
```

#### **3. レポート自動生成**
```javascript
{
  "weeklyReport": "週次パフォーマンスレポート",
  "monthlyBusinessReport": "月次事業レポート",
  "conversionOptimizationSuggestions": "コンバージョン改善提案",
  "contentPerformanceAnalysis": "コンテンツパフォーマンス分析"
}
```

### 🎯 **実装後の効果予測**

#### **1. 取得可能になるビジネス指標**
- **リード獲得コスト（CPL）**: 広告費用 ÷ お問い合わせ件数
- **サービス別人気度**: サービスページ閲覧数の比較
- **顧客獲得経路分析**: どの経路からの訪問者がコンバージョンしやすいか
- **コンテンツ効果測定**: ブログ記事からの送客効果

#### **2. 改善施策の効果測定**
- **A/Bテスト結果**: ページ改善の効果測定
- **SEO効果**: 検索流入とコンバージョンの関係
- **SNS効果**: ソーシャルメディアからの流入効果
- **リターゲティング効果**: 再訪問ユーザーのコンバージョン率

### 📅 **実装スケジュール**

#### **Phase 1: 基礎データ取得（GA4実装後1週間）**
- 基本トラフィック分析機能
- ページビュー・セッション分析
- ユーザー属性分析

#### **Phase 2: コンバージョン分析（GA4実装後2週間）**
- お問い合わせコンバージョン追跡
- サービス別エンゲージメント分析
- 簡易ファネル分析

#### **Phase 3: 高度分析機能（GA4実装後1ヶ月）**
- Enhanced Ecommerce分析
- 詳細なカスタマージャーニー分析
- 予測分析・AI活用機能

### 🔧 **技術実装要件**

#### **GA4 API 新エンドポイント追加予定**
```javascript
// 新規追加予定のAPI
GET /api/analytics/conversion-funnel    // コンバージョンファネル
GET /api/analytics/service-performance  // サービス別パフォーマンス  
GET /api/analytics/lead-generation     // リード獲得分析
GET /api/analytics/customer-journey    // カスタマージャーニー
GET /api/analytics/roi-calculator      // ROI計算
```

#### **新コンポーネント**
```javascript
// 追加予定コンポーネント
- ConversionFunnelChart.tsx           // ファネルチャート
- ServicePerformanceTable.tsx         // サービス別表
- LeadGenerationMetrics.tsx          // リード指標
- CustomerJourneyMap.tsx             // ジャーニーマップ
- BusinessKPIDashboard.tsx           // ビジネスKPI総合
```

---

## 📋 **実装完了チェックリスト**

### **find-to-do-site側（要依頼）**
- [ ] GA4トラッキングコード設置
- [ ] お問い合わせフォーム送信イベント
- [ ] Discord参加クリックイベント  
- [ ] サービスページビューイベント
- [ ] Enhanced Ecommerceイベント

### **分析アプリ側（今後実装）**
- [ ] コンバージョンファネル機能
- [ ] サービス別分析機能
- [ ] リード獲得分析機能
- [ ] ビジネスKPIダッシュボード
- [ ] アラート・レポート機能

この仕様書に基づいて、GA4実装完了後に分析アプリの新機能開発を進めます。