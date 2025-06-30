# FEATURE: 自動予定生成システム用デモデータ実装

**作成日**: 2025年6月30日  
**タイプ**: FEATURE  
**優先度**: HIGH  
**担当**: 未定  

---

## 📋 概要

未ログインユーザー向けに自動予定生成システムの機能を体験できるデモデータを実装する。現在、未ログイン時は空データで意味のない結果となっているため、実際の機能価値を伝えるサンプルデータが必要。

## 🚨 発生している問題

### **現在の問題点**
- 未ログイン時：タスクデータ0件、カレンダーデータ0件
- 「AI最適化」を謳いながら実質的に空データ処理
- 「あなたの生産性パターンを分析」等、虚偽の機能表示
- ユーザーに価値を提供できていない状態

### **影響範囲**
- **AutoScheduler.tsx** - 自動スケジュール生成機能
- **SmartScheduleViewer.tsx** - モバイル版スケジュール表示
- **generate-schedule API** - スケジュール生成エンドポイント

## 🎯 実装要件

### **1. デモデータ作成**

#### **場所**: `/src/lib/demo/demo-data.ts`
```typescript
export const DEMO_TASKS = [
  {
    id: 'demo-task-1',
    title: 'プロジェクト企画書作成',
    status: 'DO',
    priority: 'HIGH',
    estimatedHours: 2,
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    description: '来週の提案に向けて企画書を完成させる'
  },
  {
    id: 'demo-task-2', 
    title: 'チーム会議資料準備',
    status: 'DO',
    priority: 'MEDIUM',
    estimatedHours: 1.5,
    dueDate: new Date(Date.now() + 3600000 * 8).toISOString(),
    description: '明日の定例会議用資料作成'
  },
  {
    id: 'demo-task-3',
    title: 'メール返信対応',
    status: 'DO', 
    priority: 'LOW',
    estimatedHours: 0.5,
    dueDate: new Date(Date.now() + 3600000 * 4).toISOString(),
    description: '顧客からの問い合わせ対応'
  },
  {
    id: 'demo-task-4',
    title: 'システム設計書レビュー',
    status: 'DO',
    priority: 'HIGH',
    estimatedHours: 3,
    dueDate: new Date(Date.now() + 3600000 * 12).toISOString(),
    description: '新機能の設計書を詳細レビュー'
  },
  {
    id: 'demo-task-5',
    title: '月次報告書作成',
    status: 'DO',
    priority: 'MEDIUM', 
    estimatedHours: 2,
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    description: '今月の活動をまとめて報告書作成'
  }
];

export const DEMO_EVENTS = [
  {
    id: 'demo-event-1',
    title: 'チーム定例会議',
    startTime: new Date(Date.now() + 3600000 * 2).toISOString(),
    endTime: new Date(Date.now() + 3600000 * 3).toISOString(),
    type: 'MEETING',
    category: 'PROJECT',
    importance: 0.8
  },
  {
    id: 'demo-event-2',
    title: '顧客プレゼンテーション',
    startTime: new Date(Date.now() + 3600000 * 6).toISOString(), 
    endTime: new Date(Date.now() + 3600000 * 7.5).toISOString(),
    type: 'MEETING',
    category: 'PROJECT',
    importance: 0.9
  },
  {
    id: 'demo-event-3',
    title: 'ランチ休憩',
    startTime: new Date(Date.now() + 3600000 * 4).toISOString(),
    endTime: new Date(Date.now() + 3600000 * 5).toISOString(),
    type: 'PERSONAL',
    category: 'PERSONAL',
    importance: 0.6
  }
];

export const DEMO_USER_PREFERENCES = {
  workStartTime: '09:00',
  workEndTime: '18:00', 
  lunchTime: '12:00',
  lunchDuration: 60,
  personalityType: 'balanced',
  productivityPattern: {
    morning: 0.9,
    earlyAfternoon: 0.8,
    lateAfternoon: 0.7
  }
};
```

### **2. デモモード検出フック**

#### **場所**: `/src/hooks/useDemoMode.ts`
```typescript
import { useAuth } from '@/lib/auth/client';
import { DEMO_TASKS, DEMO_EVENTS, DEMO_USER_PREFERENCES } from '@/lib/demo/demo-data';

export function useDemoMode() {
  const { isAuthenticated } = useAuth();
  
  return {
    isDemoMode: !isAuthenticated,
    demoTasks: !isAuthenticated ? DEMO_TASKS : [],
    demoEvents: !isAuthenticated ? DEMO_EVENTS : [],
    demoPreferences: !isAuthenticated ? DEMO_USER_PREFERENCES : null,
    getDemoMessage: () => !isAuthenticated ? 'デモモード: サンプルデータで機能をお試しください' : null
  };
}
```

### **3. API修正**

#### **場所**: `/src/app/api/ai/generate-schedule/route.ts`
```typescript
// 未ログイン時のデモデータ対応
if (!session && (!tasks || tasks.length === 0)) {
  // デモデータを使用
  tasks = DEMO_TASKS;
  events = DEMO_EVENTS;
  preferences = DEMO_USER_PREFERENCES;
}
```

### **4. UI表示更新**

#### **AutoScheduler.tsx**
```typescript
const { isDemoMode, getDemoMessage } = useDemoMode();

{isDemoMode && (
  <div className="demo-banner bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
    <div className="flex items-center gap-2 text-blue-800">
      <Info className="w-5 h-5" />
      <span className="font-medium">{getDemoMessage()}</span>
    </div>
    <p className="text-sm text-blue-600 mt-1">
      ログインすると実際のタスクで最適化できます
    </p>
  </div>
)}
```

#### **SmartScheduleViewer.tsx**
```typescript
// デモモード時の明確な表示
{isDemoMode && (
  <div className="demo-indicator">
    📝 デモモード - サンプルデータで機能体験中
  </div>
)}
```

## 🔧 実装手順

### **Phase 1: デモデータ基盤作成**
1. `/src/lib/demo/demo-data.ts` 作成
2. `/src/hooks/useDemoMode.ts` 作成  
3. 型定義の整備

### **Phase 2: API統合**
1. `generate-schedule API` でデモデータ対応
2. エラーハンドリング追加
3. デモモード判定ロジック

### **Phase 3: UI統合**
1. AutoScheduler にデモモード表示追加
2. SmartScheduleViewer にデモ表示追加
3. 適切な案内メッセージ表示

### **Phase 4: 検証・調整**
1. 型チェック: `npx tsc --noEmit`
2. リントチェック: `npm run lint`
3. 機能テスト
4. デモデータの調整・最適化

## 📊 完了条件

### **機能要件**
- ✅ 未ログイン時にリアルなデモデータでスケジュール生成
- ✅ デモモード表示で機能理解促進
- ✅ ログイン促進の適切な案内
- ✅ 既存の機能に影響なし

### **技術要件**
- ✅ 型安全性の確保
- ✅ パフォーマンス影響なし
- ✅ コードの可読性・保守性
- ✅ エラーハンドリング完備

### **UX要件**
- ✅ 機能価値の明確な伝達
- ✅ 自然なログイン導線
- ✅ 混乱を招かない表示
- ✅ スムーズな体験フロー

## 🎯 期待効果

### **ユーザー体験向上**
- 未ログインでも機能価値を理解可能
- 実際のスケジュール最適化を体験
- 自然なログイン促進

### **技術的改善**
- 虚偽表示の解消
- 適切なフォールバック機能
- 保守性の向上

---

**管理責任者**: PM Level  
**実装ブランチ**: `feature/auto-schedule-demo-data`  
**関連ISSUE**: なし  
**エピック**: 自動予定生成システム改善