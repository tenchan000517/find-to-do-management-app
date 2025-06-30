# FEATURE: モバイルダッシュボード専用コンポーネント実装

**作成日**: 2025年6月30日  
**タイプ**: FEATURE  
**優先度**: MEDIUM  
**担当**: 未定  

---

## 📋 概要

モバイルダッシュボードの機能を拡張・最適化するため、専用コンポーネントディレクトリ `/src/components/mobile/dashboard/` にダッシュボード特化コンポーネントを実装する必要があります。

## 🎯 実装対象

### **未実装ディレクトリ**
- **場所**: `/src/components/mobile/dashboard/`
- **現状**: 空ディレクトリ

### **実装すべきコンポーネント**
1. **QuickStatsWidget.tsx** - クイック統計表示ウィジェット
2. **TodayTasksCard.tsx** - 今日のタスク専用カード
3. **ProgressRingChart.tsx** - モバイル最適化進捗リング
4. **UrgentTasksAlert.tsx** - 緊急タスクアラート表示
5. **ProductivityMeter.tsx** - 生産性メーター表示
6. **QuickActionPanel.tsx** - クイックアクションボタン群

## 🔧 技術要件

### **現状ダッシュボードとの関係**
- **現在**: `/src/app/mobile/dashboard/page.tsx` (502行) - 単一ページ実装
- **改善点**: 機能別コンポーネント分離による保守性向上
- **統合方針**: 既存ページから専用コンポーネントを抽出・最適化

### **モバイル特化要件**
```typescript
// ダッシュボード最適化要件
interface MobileDashboardRequirements {
  loadTime: '<2秒';           // 初期表示速度
  touchTargetSize: '>=44px';   // タッチエリア最小サイズ
  verticalLayout: boolean;     // 縦スクロール最適化
  oneHandReach: boolean;       // 片手操作対応
  offlineCache: boolean;       // オフライン表示対応
}
```

## 📱 コンポーネント詳細設計

### **1. クイック統計ウィジェット**
```typescript
// QuickStatsWidget.tsx
interface QuickStats {
  todayCompleted: number;      // 今日完了数
  inProgress: number;          // 進行中タスク数
  overdue: number;            // 期限超過数
  weeklyGoalProgress: number;  // 週間目標進捗率
}

// モバイル最適化表示
- 4分割グリッド表示（2x2）
- カラーコード化（緑=順調、赤=注意）
- タップで詳細表示
- アニメーション付きカウントアップ
```

### **2. 今日のタスクカード**
```typescript
// TodayTasksCard.tsx
features:
  - 今日期限のタスクのみ抽出表示
  - 優先度別カラーリング
  - スワイプで完了/延期操作
  - エンプティステート対応（"今日のタスクなし"）
  
mobile_optimizations:
  - 最大5個まで表示（スクロール回避）
  - "もっと見る"で全画面遷移
  - ドラッグ&ドロップ並び替え
  - 長押しで詳細メニュー
```

### **3. 進捗リングチャート**
```typescript
// ProgressRingChart.tsx
visualization:
  - SVG ベース軽量リングチャート
  - アニメーション付き進捗表示
  - 中央に進捗率％表示
  - 複数プロジェクト同時表示対応
  
interactive:
  - タップで該当プロジェクト詳細
  - ピンチズームで拡大表示
  - 色覚障害者配慮パターン
  - ダークモード完全対応
```

### **4. 緊急タスクアラート**
```typescript
// UrgentTasksAlert.tsx
alert_conditions:
  - 期限24時間以内のタスク
  - 高優先度かつ未着手タスク
  - 期限超過タスク
  - プロジェクト遅延リスク
  
mobile_alerts:
  - 折りたたみ可能バナー表示
  - スワイプで dismiss
  - タップで該当タスクに直接遷移
  - プッシュ通知連携（将来対応）
```

### **5. 生産性メーター**
```typescript
// ProductivityMeter.tsx
metrics:
  - 今日の作業時間推定
  - タスク完了率
  - 集中度スコア（ポモドーロ連携）
  - 前日比較表示
  
visual_design:
  - 半円形ゲージ表示
  - グラデーション効果
  - 数値アニメーション
  - 色で状態表現（良好=緑、要改善=黄、不調=赤）
```

### **6. クイックアクションパネル**
```typescript
// QuickActionPanel.tsx
quick_actions:
  - "新しいタスク作成"
  - "今日の振り返り記録"
  - "プロジェクト切り替え"
  - "音声でタスク追加"（音声機能連携）
  
layout:
  - 横スクロール可能アイコン群
  - 大きめタッチエリア（60px x 60px）
  - アイコン + ラベル表示
  - カスタマイズ可能順序
```

## 🎨 デザインシステム統合

### **カラーパレット統一**
```css
/* ダッシュボード専用カラー */
--dashboard-primary: #3b82f6;      /* プライマリブルー */
--dashboard-success: #10b981;      /* 成功グリーン */
--dashboard-warning: #f59e0b;      /* 警告オレンジ */
--dashboard-danger: #ef4444;       /* 危険レッド */
--dashboard-neutral: #6b7280;      /* ニュートラルグレー */
```

### **タイポグラフィ**
```css
/* モバイルダッシュボード専用フォント */
--dashboard-title: 1.25rem;        /* ウィジェットタイトル */
--dashboard-value: 2rem;           /* 重要数値 */
--dashboard-label: 0.875rem;       /* ラベルテキスト */
--dashboard-caption: 0.75rem;      /* キャプション */
```

## 🔗 既存システム統合

### **データソース連携**
```typescript
// 既存APIとの統合
- /api/tasks → 今日のタスク情報
- /api/projects → プロジェクト進捗
- /api/analytics → 生産性データ
- PredictiveEngine → AI予測情報
```

### **他コンポーネント連携**
```typescript
// 横断的機能統合
- AIComponents → 予測情報表示
- VoiceComponents → 音声タスク作成
- AccessibilityComponents → アクセシビリティ配慮
- GestureComponents → ジェスチャー操作
```

## 📊 パフォーマンス最適化

### **表示速度最適化**
- **レイジーローディング**: スクロール時の段階的ロード
- **キャッシュ戦略**: 統計情報の短期キャッシュ（5分）
- **軽量レンダリング**: 重いチャートの遅延表示
- **プリローディング**: 頻繁に使用するデータの事前取得

### **メモリ効率化**
- **コンポーネント分離**: 不要時のアンマウント
- **状態管理最適化**: ダッシュボード専用ストア
- **イメージ最適化**: アイコンのSVG化・最適化

## 🗂️ 既存ファイルとの関係

### **分離対象（現在のpage.tsx内の機能）**
```typescript
// /src/app/mobile/dashboard/page.tsx から抽出予定
current_features:
  - 統計表示ロジック → QuickStatsWidget.tsx
  - 今日のタスク表示 → TodayTasksCard.tsx
  - プロジェクト進捗 → ProgressRingChart.tsx
  - アクションボタン → QuickActionPanel.tsx
```

### **新規追加機能**
```typescript
// 現在未実装の機能
new_features:
  - UrgentTasksAlert.tsx → 緊急アラート機能
  - ProductivityMeter.tsx → 生産性可視化
```

## ⚠️ 実装時の注意点

### **既存機能との競合回避**
- 現在のダッシュボードページの機能を損なわない
- 段階的移行（Feature Flag利用推奨）
- 既存データフローの維持

### **モバイル制約対応**
- 画面サイズ制限（最小320px幅対応）
- タッチ操作精度（最小44pxタッチエリア）
- ネットワーク制限（3G環境での表示速度）

## 📅 実装計画

### **Phase 1: 基本ウィジェット（HIGH）**
1. **QuickStatsWidget.tsx** - 統計表示（既存ロジック活用）
2. **TodayTasksCard.tsx** - 今日のタスク表示

### **Phase 2: 視覚化強化（MEDIUM）**
3. **ProgressRingChart.tsx** - 進捗可視化
4. **UrgentTasksAlert.tsx** - アラート機能

### **Phase 3: 高度機能（LOW）**
5. **ProductivityMeter.tsx** - 生産性分析
6. **QuickActionPanel.tsx** - カスタムアクション

### **Phase 4: 既存ページリファクタリング**
7. 既存 dashboard/page.tsx の新コンポーネント統合
8. パフォーマンス最適化・テスト

---

**次のアクション**: 5つのモバイルコンポーネントISSUE完了  
**関連ISSUE**: 他の4つのモバイル機能ISSUE  
**ステータス**: 未着手  
**推奨実装順**: 他コンポーネント完成後の統合フェーズで実装