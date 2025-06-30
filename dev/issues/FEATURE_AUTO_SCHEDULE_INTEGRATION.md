# FEATURE: AutoScheduler と SmartDashboard の完全統合

**作成日**: 2025年6月30日  
**タイプ**: FEATURE  
**優先度**: HIGH  
**担当**: 未定  

---

## 📋 概要

実装済みの `AutoScheduler.tsx` と `SmartScheduleViewer.tsx` を実際のダッシュボードに統合し、完全に機能する自動予定生成システムを構築する。現在は機能的なコンポーネントが存在するが、実際のUIに統合されていない状態。

## 🚨 現在の問題

### **統合不完全な状態**
- `AutoScheduler.tsx` - 実装済みだが未使用
- `SmartScheduleViewer.tsx` - 実装済みだが未使用  
- `SmartDashboard.tsx` - 簡易的なボタンとアラート表示のみ
- 実際のスケジュール表示・管理機能が欠如

### **機能ギャップ**
- ボタンクリック → アラート表示で終了
- 生成されたスケジュールの表示なし
- スケジュール調整・編集機能なし
- カレンダー統合機能が未実装

## 🎯 実装要件

### **1. AutoScheduler統合**

#### **SmartDashboard.tsx 修正**
```typescript
// 現在の簡易実装を置き換え
import AutoScheduler from '@/components/AutoScheduler';

// generateAutoSchedule関数を削除し、AutoSchedulerを直接埋め込み
<div className="auto-scheduler-section">
  <h3 className="text-lg font-semibold mb-4">今日のスケジュール最適化</h3>
  <AutoScheduler />
</div>
```

#### **レイアウト調整**
- SmartDashboardの適切な位置にAutoSchedulerを配置
- 既存のクイック機能と調和するデザイン
- レスポンシブ対応の確保

### **2. SmartScheduleViewer統合**

#### **モバイル版ダッシュボード統合**
```typescript
// /src/app/mobile/dashboard/page.tsx
import SmartScheduleViewer from '@/components/mobile/ai/SmartScheduleViewer';

// モバイルダッシュボードにスケジュール表示セクション追加
<section className="schedule-section">
  <SmartScheduleViewer />
</section>
```

#### **デスクトップ版での表示**
```typescript
// AutoSchedulerと連携したスケジュール表示
// 生成後の結果をSmartScheduleViewer形式で表示
```

### **3. データフロー統合**

#### **共通状態管理**
```typescript
// /src/hooks/useScheduleGenerator.ts
export function useScheduleGenerator() {
  const [generatedSchedule, setGeneratedSchedule] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState(null);
  
  const generateSchedule = async () => {
    // AutoSchedulerとSmartScheduleViewerで共通利用
  };
  
  return {
    generatedSchedule,
    isGenerating,
    generateSchedule,
    lastGenerated
  };
}
```

#### **API連携強化**
```typescript
// generate-schedule APIの出力を両コンポーネントで利用
// 統一されたスケジュールデータ形式の確立
```

### **4. ユーザーインターフェース改善**

#### **統合的な表示フロー**
1. **生成ボタン** → AutoSchedulerの本格的なUI
2. **計算中表示** → プログレスバーと詳細ステップ表示  
3. **結果表示** → SmartScheduleViewer形式の見やすい表示
4. **調整機能** → インライン編集・移動・削除
5. **保存機能** → カレンダー統合・永続化

#### **デザイン統一**
- SmartDashboardの既存デザインシステムに準拠
- 一貫したアイコン・色彩・タイポグラフィ
- モバイル・デスクトップ両対応

### **5. カレンダー統合機能**

#### **既存カレンダーシステム連携**
```typescript
// useCalendarEvents() との統合
// 生成されたスケジュールの永続化
// 既存予定との競合回避・調整機能
```

#### **外部カレンダー連携**
```typescript
// Google Calendar, Outlook 等への出力機能
// iCal形式でのエクスポート機能
```

## 🔧 実装手順

### **Phase 1: 基盤統合**
1. AutoSchedulerをSmartDashboardに統合
2. 共通フック `useScheduleGenerator` 作成
3. データフロー設計・実装

### **Phase 2: UI統合**
1. SmartScheduleViewerの統合
2. 統一デザインシステム適用
3. レスポンシブ対応

### **Phase 3: 機能拡張**
1. スケジュール編集機能
2. カレンダー統合機能
3. 外部エクスポート機能

### **Phase 4: 最適化**
1. パフォーマンス最適化
2. エラーハンドリング強化
3. ユーザビリティ改善

## 📊 技術要件

### **コンポーネント設計**
```typescript
// 統合後の構造
<SmartDashboard>
  <QuickActions />
  <AutoSchedulerSection>
    <AutoScheduler />
    <ScheduleDisplay>
      <SmartScheduleViewer />
    </ScheduleDisplay>
  </AutoSchedulerSection>
  <OtherSections />
</SmartDashboard>
```

### **状態管理**
- React Context または Zustand での状態管理
- スケジュール生成状態の一元管理
- リアルタイム更新対応

### **API統合**
- 既存の `/api/ai/generate-schedule` 活用
- `/api/calendar` との連携強化
- エラー処理・リトライ機能

## 📊 完了条件

### **機能要件**
- ✅ AutoSchedulerの完全統合・表示
- ✅ SmartScheduleViewerでの結果表示
- ✅ スケジュール編集・調整機能
- ✅ カレンダー保存・エクスポート機能
- ✅ モバイル・デスクトップ両対応

### **技術要件**
- ✅ 型安全性の確保
- ✅ パフォーマンス最適化
- ✅ エラーハンドリング完備
- ✅ テスタビリティ確保

### **UX要件**
- ✅ 直感的な操作フロー
- ✅ 明確なフィードバック
- ✅ 快適なレスポンス時間
- ✅ 一貫したデザイン

## 🎯 期待効果

### **ユーザー価値**
- 完全に機能する自動スケジュール生成
- 直感的なスケジュール管理体験
- 生産性向上の実現

### **システム価値**
- 既存コンポーネントの有効活用
- 保守性・拡張性の向上
- 技術的負債の解消

---

**管理責任者**: PM Level  
**実装ブランチ**: `feature/auto-schedule-integration`  
**関連ISSUE**: `FEATURE_AUTO_SCHEDULE_DEMO_DATA`  
**エピック**: 自動予定生成システム完成