# 【緊急】カレンダーシステム全体修正指示

**作成日**: 2025-06-15  
**優先度**: 緊急  
**対象**: 次期開発エンジニア

---

## 🚨 現在発生している問題

### 1. **データカテゴライゼーション問題**
```
問題: 全てのイベントが「GENERAL」カテゴリになっている（41件すべて）
原因: APIレベルでのカテゴライズ処理が不適切
影響: カテゴリ別フィルタリングが機能しない
```

**調査が必要な箇所:**
- `src/app/api/calendar/events/route.ts` - イベント作成時のカテゴリ自動判定
- データベースの既存calendar_eventsテーブルのcategoryフィールド値
- tasksとappointmentsからcalendar_eventsへの変換時のカテゴリマッピング

**期待される動作:**
- tasks → `TASK_DUE`カテゴリ
- appointments → `APPOINTMENT`カテゴリ  
- projects関連 → `PROJECT`カテゴリ
- その他のイベント → `EVENT`カテゴリ

### 2. **モーダル背景問題（システム全体共通）**
```
問題: 全てのポップアップ・モーダルで背景が真っ暗/グレーになりカレンダーが見えない
原因: z-indexまたはスタイリングの階層問題
影響: UX悪化、カレンダーコンテキストの喪失
```

**調査が必要な箇所:**
- システム全体のz-index管理戦略
- 既存のモーダルコンポーネントの実装パターン
- グローバルCSSスタイルとの衝突
- Tailwind CSSのz-index設定

**対象コンポーネント:**
- `EventEditModal`
- `DayEventsModal` 
- `WeeklyPreview`
- その他システム内の全ポップアップ/モーダル

### 3. **型安全性エラー（複数箇所）**
```
EventCard.tsx: onEventEditプロパティの型不整合
CalendarView.tsx: MonthViewPropsとWeeklyPreviewPropsの型不整合
カテゴリラベルの型不整合
```

---

## 🔧 修正が必要なファイル群

### **A. APIレイヤー**
```
src/app/api/calendar/events/route.ts
- カテゴリ自動判定ロジックの実装
- tasksとappointmentsの正しいカテゴリマッピング
- データベースからの既存データ変換処理
```

### **B. 型定義**
```
src/types/calendar.ts
- EventCategoryの整理（現在のGENERAL問題の解決）
- コンポーネント間の型整合性確保
```

### **C. モーダル/ポップアップシステム**
```
src/components/calendar/EventEditModal.tsx
src/components/calendar/DayEventsModal.tsx
src/components/calendar/WeeklyPreview.tsx
+ システム内の他の全モーダルコンポーネント

調査・修正内容:
- z-index階層の統一
- 背景オーバーレイの透明度/色設定
- ポートレイヤーやモーダルマネージャーの導入検討
```

### **D. コンポーネント型整合性**
```
src/components/calendar/MonthView.tsx
src/components/calendar/WeekView.tsx  
src/components/calendar/DayView.tsx
src/components/calendar/EventCard.tsx

修正内容:
- onEventEditプロパティの統一
- プロパティ型定義の整合性確保
```

---

## 📊 データベース調査項目

### **1. 既存データ確認**
```sql
-- calendar_eventsのカテゴリ分布確認
SELECT category, COUNT(*) FROM calendar_events GROUP BY category;

-- tasksのカテゴリ確認（calendar_eventsとの関連）
SELECT t.*, ce.category 
FROM tasks t 
LEFT JOIN calendar_events ce ON ce.taskId = t.id;

-- appointmentsのカテゴリ確認
SELECT a.*, ce.category 
FROM appointments a 
LEFT JOIN calendar_events ce ON ce.appointmentId = a.id;
```

### **2. データマイグレーション検討**
既存のGENERALカテゴリデータを正しいカテゴリに分類し直す必要がある可能性

---

## 🎯 修正アプローチ

### **Phase 1: データ層修正（最優先）**
1. APIでのカテゴリ自動判定ロジック実装
2. 既存データの正しいカテゴライゼーション
3. データベース整合性確保

### **Phase 2: モーダルシステム修正**
1. システム全体のz-index戦略策定
2. モーダルマネージャーまたは統一スタイリングシステム導入
3. 全モーダルコンポーネントの修正

### **Phase 3: 型安全性確保**
1. 型定義の整理・統一
2. コンポーネント間のプロパティ整合性確保
3. TypeScriptエラーの全解消

---

## ⚠️ 重要な注意事項

### **システム全体への影響**
- この修正は単一コンポーネントの修正では解決不可能
- モーダルシステムの修正は他の機能（タスク管理、プロジェクト管理等）にも影響
- データベースレベルでの修正が必要な可能性が高い

### **テスト必須項目**
- カレンダー表示の全機能
- 全モーダル/ポップアップの動作
- タスク・アポイントメント・プロジェクトとの連携
- フィルタリング機能の動作確認

### **パフォーマンス考慮**
- 大量データ（41件以上）でのカテゴリ分類処理
- モーダル表示のレンダリングパフォーマンス

---

## 📝 実装優先順位

1. **緊急（今すぐ）**: APIカテゴリ自動判定の実装
2. **高優先度**: モーダル背景問題の解決（システム全体）
3. **中優先度**: 型安全性エラーの解消
4. **低優先度**: UI/UXの微調整

---

**この問題は単一機能の修正ではなく、システムアーキテクチャレベルでの包括的な修正が必要です。**
**次期エンジニアは必ずシステム全体を把握してから修正に着手してください。**