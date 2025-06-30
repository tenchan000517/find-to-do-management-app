# 【カレンダー機能】マスター設計書

**作成日**: 2025-06-15
**最終更新**: 2025-06-15
**対象**: カレンダー機能実装を担当するすべてのエンジニア

---

## 🚨 最重要：このドキュメントは全フェーズの一次情報源です

**新しいセッションを開始したら、必ずこのドキュメントを最初に読んでください。**
- オーバーエンジニアリングを防ぐため、ここに書かれていない機能は実装しない
- 重複実装を防ぐため、既存実装を必ず確認
- 型定義エラーを防ぐため、定義済みの型を使用

---

## 📋 ユーザー要件（変更禁止）

### 必須要件
1. **色分けタブ管理**
   - ユーザー別タブ（users.colorを使用）
   - カテゴリ別タブ（7種類の固定色）
   - 重要度別タブ（高:赤、中:オレンジ、低:緑）

2. **データ自動反映**
   - アポ：appointments → calendar_events自動同期
   - タスク：tasks.dueDate → calendar_events自動同期
   - イベント：直接登録

3. **繰り返し予定**
   - 特定曜日指定（複数可）
   - 週単位（毎週）
   - 隔週
   - 月1回

4. **週間ビュー**
   - タブ切り替えでフィルタリング
   - 今後1週間の予定表示

5. **レスポンシブ対応**
   - 画面幅に応じた最適表示
   - サイドバーも含めて調整

6. **カード表示**
   - 時間＋タイトル（長い場合は省略）
   - ラベル：「誰」「カテゴリ」「重要度」の1文字表示

### 採用された追加機能
- **AI活用**：スケジュール最適化、衝突検知、空き時間提案
- **チーム協調**：メンバー予定重ね表示、共有可能時間
- **LINE連携強化**：朝通知、リマインド、音声入力
- **ダッシュボード統合**：稼働率、時間配分、KPI連動

### 不採用機能（実装禁止）
- 権限管理（他人の予定の詳細閲覧制限）
- 移動時間自動計算
- バッファ時間設定
- タイムゾーン対応

---

## 🏗️ システムアーキテクチャ

### データフロー
```
[LINEボット] → [calendar_events] ← [カレンダーUI]
                        ↑
    [tasks] ────────────┤
                        │
    [appointments] ─────┘
```

### テーブル構成
1. **calendar_events**（拡張）
   - 既存フィールド保持
   - 新規フィールド追加（userId, projectId, taskId等）
   - 繰り返し設定フィールド

2. **recurring_rules**（新規）
   - 繰り返しルール定義
   - 除外日管理

### API構成
```
/api/calendar/
  ├── events/          # イベントCRUD
  ├── recurring/       # 繰り返し設定
  ├── sync/           # データ同期
  ├── filters/        # フィルタリング
  └── analytics/      # 分析データ
```

---

## 📐 実装フェーズと担当範囲

### Phase 1: 基盤構築
**担当範囲**:
- Prismaスキーマ更新
- マイグレーション実行
- 基本API実装（/api/calendar/events）

**完了条件**:
- [ ] calendar_eventsテーブル拡張完了
- [ ] recurring_rulesテーブル作成完了
- [ ] 基本CRUD API動作確認

### Phase 2: UI基本実装
**担当範囲**:
- カレンダーコンポーネント作成
- 月/週/日表示切り替え
- 基本的なイベント表示

**完了条件**:
- [ ] CalendarViewコンポーネント完成
- [ ] 3つの表示モード実装
- [ ] 既存データ表示確認

### Phase 3: 色分けタブシステム
**担当範囲**:
- 3種類のタブ実装
- 色定義の統一管理
- タブ切り替えロジック

**完了条件**:
- [ ] ColorTabsコンポーネント完成
- [ ] ユーザー/カテゴリ/重要度別表示
- [ ] パフォーマンステスト合格

### Phase 4: 繰り返し予定
**担当範囲**:
- 繰り返しルール作成UI
- 展開ロジック実装
- 除外日処理

**完了条件**:
- [ ] RecurringFormコンポーネント完成
- [ ] 4種類の繰り返しパターン対応
- [ ] 除外日機能動作確認

### Phase 5: データ統合
**担当範囲**:
- タスク期限同期
- アポイントメント同期
- リアルタイム更新

**完了条件**:
- [ ] 自動同期API実装
- [ ] 既存データ移行完了
- [ ] 整合性テスト合格

### Phase 6: フィルタリング機能
**担当範囲**:
- フィルターUI実装
- 複合条件対応
- URLパラメータ連携

**完了条件**:
- [ ] FilterPanelコンポーネント完成
- [ ] 複数条件AND/OR対応
- [ ] URL共有機能確認

### Phase 7: AI機能統合
**担当範囲**:
- スケジュール最適化API
- 衝突検知ロジック
- 提案UI実装

**完了条件**:
- [ ] AI Call Manager統合
- [ ] 3種類のAI機能実装
- [ ] ユーザビリティテスト合格

### Phase 8: チーム機能
**担当範囲**:
- メンバー選択UI
- 重ね表示ロジック
- 共有時間検出

**完了条件**:
- [ ] TeamViewコンポーネント完成
- [ ] パフォーマンス最適化
- [ ] プライバシー考慮確認

### Phase 9: LINE連携強化
**担当範囲**:
- 通知設定UI
- Webhookハンドラー拡張
- 音声入力対応

**完了条件**:
- [ ] 3種類の通知実装
- [ ] 音声→テキスト変換
- [ ] エラーハンドリング完備

### Phase 10: 最終統合
**担当範囲**:
- ダッシュボード統合
- パフォーマンス最適化
- ドキュメント整備

**完了条件**:
- [ ] 全機能統合テスト
- [ ] レスポンス2秒以内
- [ ] ユーザーガイド完成

---

## 🎨 UI/UXデザイン仕様

### カラーパレット
```typescript
// カテゴリ別色（変更禁止）
export const CATEGORY_COLORS = {
  GENERAL: '#6B7280',      // グレー
  MEETING: '#3B82F6',      // 青
  APPOINTMENT: '#10B981',  // 緑
  TASK_DUE: '#F59E0B',     // オレンジ
  PROJECT: '#8B5CF6',      // 紫
  PERSONAL: '#EC4899',     // ピンク
  TEAM: '#06B6D4'         // シアン
} as const;

// 重要度別色（変更禁止）
export const IMPORTANCE_COLORS = {
  HIGH: '#EF4444',    // 赤
  MEDIUM: '#F59E0B',  // オレンジ
  LOW: '#10B981'      // 緑
} as const;
```

### レイアウト仕様
```typescript
// カレンダーグリッド
const CALENDAR_GRID = {
  MONTH: { cols: 7, minHeight: '120px' },
  WEEK: { cols: 7, minHeight: '600px' },
  DAY: { cols: 1, minHeight: '1200px' }
};

// イベントカード
const EVENT_CARD = {
  maxTitleLength: 20,
  labelSize: '12px',
  padding: '4px 8px',
  borderRadius: '4px'
};
```

### レスポンシブブレークポイント
```typescript
const BREAKPOINTS = {
  mobile: '640px',   // スマホ
  tablet: '768px',   // タブレット
  desktop: '1024px'  // PC
};
```

---

## 🔧 技術仕様

### 型定義（必ず使用）
```typescript
// types/calendar.ts
export interface CalendarEvent {
  id: string;
  title: string;
  date: string;      // YYYY-MM-DD
  time: string;      // HH:mm
  endTime?: string;  // HH:mm
  type: EventType;
  userId: string;
  projectId?: string;
  taskId?: string;
  appointmentId?: string;
  category: EventCategory;
  importance: number; // 0.0-1.0
  isRecurring: boolean;
  recurringPattern?: string;
  colorCode?: string;
  isAllDay: boolean;
}

export interface RecurringRule {
  id: string;
  ruleName: string;
  recurrenceType: RecurrenceType;
  weekdays: number[];     // 0-6
  monthDay?: number;      // 1-31
  monthWeek?: number;     // 1-5
  monthWeekday?: number;  // 0-6
  interval: number;
  startDate: string;
  endDate?: string;
  maxOccurrences?: number;
  excludeDates: string[];
}

export type EventCategory = 
  | 'GENERAL'
  | 'MEETING'
  | 'APPOINTMENT'
  | 'TASK_DUE'
  | 'PROJECT'
  | 'PERSONAL'
  | 'TEAM';

export type RecurrenceType =
  | 'DAILY'
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'CUSTOM';

export type ViewMode = 'month' | 'week' | 'day';
export type ColorMode = 'user' | 'category' | 'importance';
```

### API仕様
```typescript
// GET /api/calendar/events
interface GetEventsParams {
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
  userId?: string;
  projectId?: string;
  category?: EventCategory;
  includeRecurring?: boolean;
}

// POST /api/calendar/events
interface CreateEventBody {
  title: string;
  date: string;
  time: string;
  endTime?: string;
  category: EventCategory;
  importance?: number;
  recurringRule?: Partial<RecurringRule>;
}

// PUT /api/calendar/events/[id]
interface UpdateEventBody extends Partial<CreateEventBody> {
  updateSeries?: boolean; // 繰り返し全体を更新
}
```

### パフォーマンス要件
- イベント取得: 500ms以内
- UI描画: 16ms以内（60fps）
- 月表示: 最大1000イベント
- キャッシュ: 5分間

---

## ⚠️ 実装時の注意事項

### 必須確認事項
1. **既存データ保護**
   - calendar_eventsの既存データを削除しない
   - マイグレーション前にバックアップ

2. **型安全性**
   - 定義済みの型を必ず使用
   - anyタイプ禁止

3. **エラーハンドリング**
   ```typescript
   try {
     // 処理
   } catch (error) {
     console.error('[Calendar]', error);
     // ユーザーへのフィードバック
   }
   ```

4. **パフォーマンス**
   - 大量データはページネーション
   - 繰り返しは表示期間のみ展開
   - useMemoとuseCallbackの適切な使用

### コーディング規約
```typescript
// ファイル名: kebab-case
calendar-view.tsx

// コンポーネント名: PascalCase
export function CalendarView() {}

// 関数名: camelCase
function calculateEventPosition() {}

// 定数: UPPER_SNAKE_CASE
const MAX_EVENTS_PER_DAY = 10;
```

---

## 📊 テストシナリオ

### 単体テスト
1. 繰り返しルール展開ロジック
2. 色分けロジック
3. フィルタリングロジック

### 統合テスト
1. タスク作成→カレンダー反映
2. アポ完了→イベント更新
3. LINE入力→カレンダー登録

### E2Eテスト
1. 月表示→週表示→日表示切り替え
2. イベントドラッグ&ドロップ
3. 繰り返し設定→確認→保存

---

## 🚀 実装開始チェックリスト

### セッション開始時
- [ ] このドキュメントを読んだ
- [ ] NEXT_ENGINEER_IMPLEMENTATION_PROMPT.mdを確認
- [ ] 現在のフェーズを確認
- [ ] 前フェーズの完了状態を確認

### 実装前
- [ ] 型定義を確認
- [ ] API仕様を確認
- [ ] 既存実装を検索
- [ ] テストシナリオを理解

### 実装後
- [ ] TypeScriptエラー0件
- [ ] ESLintエラー0件
- [ ] テスト実行成功
- [ ] ドキュメント更新

---

## 📝 進捗報告テンプレート

```markdown
## Phase X 進捗報告

### 完了項目
- [ ] 項目1
- [ ] 項目2

### 実装内容
- ファイル: `path/to/file.tsx`
- 主な変更: 説明

### 確認事項
- TypeScriptエラー: 0件
- テスト結果: X/X成功

### 次フェーズへの申し送り
- 注意点
- 未解決事項
```

---

**このドキュメントを参照することで、どのフェーズの担当者も迷うことなく実装を進められます。**