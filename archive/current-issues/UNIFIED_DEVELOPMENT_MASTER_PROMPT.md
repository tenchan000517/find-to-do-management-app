# 🚀 UI/UXカンバン改善プロジェクト - 統一開発マスタープロンプト

**作成日**: 2025-06-17  
**対象**: プロジェクト各フェーズ担当エンジニア  
**目的**: 統一開発ルール・進捗報告・プロンプト統合  
**適用範囲**: Phase 1〜6の全実装工程（Phase 5完了済み）

---

## 📋 このドキュメントの使用方法

### 🎯 対象エンジニア
- **Phase 1担当**: アイコン統一・基盤構築エンジニア
- **Phase 2担当**: タスクワークフロー実装エンジニア  
- **Phase 3担当**: MECE・カレンダー実装エンジニア
- **Phase 4担当**: アポイントメント・営業フロー実装エンジニア
- **Phase 5担当**: AI営業支援・高度ダッシュボード実装エンジニア（完了済み）
- **Phase 6担当**: 営業自動化・高度AI分析システム実装エンジニア

### 📚 必須参照ドキュメント順序
1. **このドキュメント** - 開発ルール・全体方針
2. **REQUIREMENTS_DEFINITION_COMPREHENSIVE.md** - 包括要件定義
3. **PERFECT_PHASE_IMPLEMENTATION_PLAN.md** - 詳細実装計画
4. **CURRENT_ISSUES_AND_IMPROVEMENTS.md** - 既知課題・対応状況

---

## 🏗️ プロジェクト全体概要

### 🎯 プロジェクト目標
**完全なUI/UX統一改善とワークフロー自動化**

1. **UI統一**: 4ページ（カレンダー・タスク・アポイント・プロジェクト）の完全統一
2. **ワークフロー高度化**: タスク・アポイントメント自動化
3. **営業プロセス完全自動化**: 契約処理〜バックオフィス連携
4. **開発効率向上**: 共通コンポーネント化・保守性向上

### 📊 現在のシステム状況（2025-06-17時点）

#### ✅ 完成済み（変更厳禁）
- **データベース**: 20テーブル完全実装（219件実データ）
- **基本CRUD API**: 43エンドポイント完成
- **担当者システム**: 7エンティティ完全対応
- **カンバンシステム**: 7種類のカンバン実装済み
- **ドラッグ&ドロップ**: @dnd-kit完全統合
- **レスポンシブ**: 全ページ対応済み
- **Phase 1-4**: UI統一・タスクワークフロー・MECE・アポイントメント完全実装
- **Phase 5**: AI営業支援・高度ダッシュボードシステム完全実装

#### 🔄 次期実装対象（Phase 6）
- **営業自動化システム**: 営業メール自動送信・提案書自動生成
- **高度AI分析**: 競合分析AI・市場トレンド予測・顧客行動分析
- **営業プロセス完全自動化**: フォローアップ自動化・契約書テンプレート
- **売上最適化**: ROI最適化AI・営業リソース配分最適化

---

## 🚨 絶対遵守ルール

### ⛔ 破壊禁止事項
```
❌ データベース破壊的変更禁止
❌ 既存API後方互換性破壊禁止  
❌ 既存機能削除・変更禁止
❌ 技術スタック変更禁止
❌ Next.js 15 + TypeScript + Tailwind以外の技術導入禁止
```

### ✅ 必須品質基準
```
✅ TypeScriptエラー: 0件維持必須
✅ ESLintエラー: 0件維持必須
✅ ビルド成功: 100%必須
✅ 既存機能: 100%動作保証必須
✅ レスポンシブ: 全デバイス対応必須
```

### 🔧 必須開発フロー
```bash
# 開始前（毎回必須）
git status && git add . && git commit -m "Phase X作業開始前状態保存"
npx tsc --noEmit    # 0件確認
npm run lint        # 0件確認  
npm run build       # 成功確認
npm run dev         # サーバー起動

# 作業中（随時実行）
npx tsc --noEmit    # エラー発生時即座に修正
npm run lint        # エラー発生時即座に修正

# 完了時（毎回必須）
npx tsc --noEmit    # 0件必須
npm run lint        # 0件必須
npm run build       # 成功必須
git add . && git commit -m "Phase X完了 - 品質基準達成"
```

---

## 📋 Phase別実装ガイドライン

### 🎨 Phase 1: アイコン統一・基盤構築（1週間）

#### 📅 担当エンジニア向け指示
**あなたの責務**: 絵文字完全削除・Lucide React統一・共通コンポーネント基盤構築

#### 🎯 完了必須項目
- [ ] 絵文字完全削除（検索: 🚀📋📅💼⚡📊🔥✨🎯等）
- [ ] Lucide React統一実装（実在アイコン検証必須）
- [ ] UniversalKanbanCard実装（4種類対応）
- [ ] UniversalKanban実装（ドラッグ&ドロップ統合）
- [ ] AddCardButton実装（全カンバン配置）
- [ ] 基本アニメーション実装

#### 📂 主要作業ファイル
```
src/lib/icons.ts                        # アイコン統一定義
src/components/ui/UniversalKanbanCard.tsx # 統一カードコンポーネント
src/components/ui/UniversalKanban.tsx     # 統一カンバンコンポーネント
src/components/ui/AddCardButton.tsx       # +追加ボタン
src/styles/kanban-animations.css         # アニメーション定義
```

#### 🔧 実装リファレンス
```typescript
// アイコン統一例
import { Target, Lightbulb, Play, AlertTriangle, CheckCircle, Brain } from 'lucide-react';

export const TASK_STATUS_ICONS = {
  IDEA: Target,
  PLAN: Lightbulb, 
  DO: Play,
  CHECK: AlertTriangle,
  COMPLETE: CheckCircle,
  KNOWLEDGE: Brain
} as const;
```

#### ⚠️ Phase 1注意事項
- 既存TaskKanbanBoard.tsxの移行は慎重に実施
- 既存機能100%動作保証
- 11ファイル以上のアイコン変更が必要

---

### 🔄 Phase 2: タスクワークフロー高度化（1週間）

#### 📅 担当エンジニア向け指示  
**あなたの責務**: 高度タスクフロー・DELETEカンバン廃止・タブ別移動実装

#### 🎯 完了必須項目
- [ ] EnhancedTaskKanban実装（ドラッグ&ドロップ拡張）
- [ ] ステータス移動フロー実装（IDEA→PLAN→DO→CHECK→COMPLETE）
- [ ] 期日設定モーダル実装（PLAN→DO移行時）
- [ ] DELETEカンバン完全廃止
- [ ] タスク更新アイコン・リスケモーダル実装
- [ ] タブ別移動処理（ユーザー・プロジェクト・期限）

#### 📂 主要作業ファイル
```
src/components/tasks/EnhancedTaskKanban.tsx  # 拡張タスクカンバン
src/components/tasks/DueDateModal.tsx        # 期日設定モーダル
src/components/tasks/TaskUpdateModal.tsx     # 更新・リスケモーダル
src/components/tasks/SummaryModal.tsx        # サマリー入力モーダル
src/components/tasks/CompletionModal.tsx     # 完了処理モーダル
```

#### 🔧 実装リファレンス
```typescript
// ステータス移動フロー例
const handleStatusChange = async (task: Task, newStatus: string) => {
  switch (`${task.status}_TO_${newStatus}`) {
    case 'PLAN_TO_DO':
      if (!task.dueDate) {
        setDueDateModal({ isOpen: true, taskId: task.id, targetStatus: 'DO' });
        return;
      }
      await updateTaskStatus(task.id, 'DO');
      break;
  }
};
```

#### ⚠️ Phase 2注意事項
- DELETEカンバンは完全削除（期限切れはdeadlineタブで管理）
- 更新アイコンはカード右上に配置
- タブ別移動でassignedTo、projectId、dueDateを適切に更新

---

### 🔗 Phase 3: MECE関係性・カレンダー日付移動（1週間）

#### 📅 担当エンジニア向け指示
**あなたの責務**: MECE関係性システム・カレンダー日付マス移動実装

#### 🎯 完了必須項目
- [x] task_relationshipsテーブル作成
- [x] MECE関係性UI実装（ドラッグ作成）
- [x] 関係性可視化表示
- [x] カレンダー日付マス移動実装
- [x] 全イベント種別対応（タスク・アポ・イベント・個人予定）
- [x] 適切なAPI連携

#### 📂 主要作業ファイル
```
src/components/tasks/MECERelationshipManager.tsx    # MECE関係性管理
src/components/calendar/DraggableCalendarCell.tsx   # ドラッグ可能日付マス
src/components/calendar/DraggableEvent.tsx          # ドラッグ可能イベント
src/app/api/task-relationships/route.ts             # 関係性API
```

#### 🔧 実装リファレンス
```sql
-- 必須データベーススキーマ
CREATE TABLE task_relationships (
  id VARCHAR(255) PRIMARY KEY,
  source_task_id VARCHAR(255) NOT NULL,
  target_task_id VARCHAR(255),
  project_id VARCHAR(255),
  relationship_type ENUM('TRANSFERABLE', 'SIMULTANEOUS', 'DEPENDENT') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### ⚠️ Phase 3注意事項
- MECE関係性はプロジェクト紐付け必須
- カレンダー移動はイベント種別に応じたAPI呼び出し
- 既存カレンダー機能との完全統合必要

---

### 🚀 Phase 4: アポイントメント営業フェーズ・契約処理（1週間）

#### 📅 担当エンジニア向け指示
**あなたの責務**: 営業フェーズ自動変更・契約処理モーダル・日程管理実装

#### 🎯 完了必須項目
- [x] EnhancedAppointmentKanban実装（4タブ対応）
- [x] AppointmentFlowModal実装（統合フローモーダル）
- [x] ContractProcessingForm実装（契約処理・プロジェクト自動作成）
- [x] 営業フェーズ自動変更システム
- [x] アポイントメント日程管理
- [x] バックオフィスタスク自動生成

#### 📂 主要作業ファイル
```
src/components/appointments/EnhancedAppointmentKanban.tsx     # 4タブ対応カンバン
src/components/appointments/AppointmentFlowModal.tsx         # 統合フローモーダル
src/components/appointments/ContractProcessingForm.tsx       # 契約処理フォーム
src/components/appointments/AppointmentCompletionForm.tsx    # 完了処理フォーム
src/app/api/appointments/[id]/schedule/route.ts              # 日程設定API
src/app/api/appointments/[id]/contract/route.ts              # 契約処理API
```

#### 🔧 実装リファレンス
```typescript
// 営業フェーズ自動変更パターン
const salesPhaseFlow = {
  CONTACT: { next: 'MEETING', autoActions: ['createCalendarEvent'] },
  MEETING: { next: 'PROPOSAL', autoActions: ['generateMeetingNote'] },
  PROPOSAL: { next: 'CONTRACT', autoActions: ['createProposal'] },
  CONTRACT: { next: 'CLOSED', autoActions: ['generateBackofficeTasks'] }
};

// タブ別処理分岐パターン
switch (kanbanType) {
  case 'processing':
    await handleProcessingMove(appointment, newColumn);
    break;
  case 'relationship':
    await handleRelationshipMove(appointment, newColumn);
    break;
  case 'phase':
    if (newColumn === 'CONTRACT') {
      setContractForm({ isOpen: true, appointment });
      return;
    }
    await handlePhaseMove(appointment, newColumn);
    break;
}
```

#### ⚠️ Phase 4注意事項
- 4タブ対応（processing/relationship/phase/source）必須
- 営業フェーズCONTRACT移動時は契約処理モーダル自動表示
- 契約処理時のプロジェクト・タスク・人脈管理自動連携必須
- 既存AppointmentKanbanBoard機能削除禁止

---

### 🤖 Phase 5: AI営業支援・高度ダッシュボード（1週間）

#### 📅 担当エンジニア向け指示
**あなたの責務**: AI営業支援システム・営業パフォーマンス分析ダッシュボード実装

#### 🎯 完了必須項目
- [ ] AI営業成約予測システム
- [ ] 営業パフォーマンス分析ダッシュボード
- [ ] 顧客セグメント分析機能
- [ ] 最適提案タイミング予測AI
- [ ] 競合分析AI
- [ ] ROI最大化提案システム

#### 📂 主要作業ファイル
```
src/components/dashboard/SalesAnalyticsDashboard.tsx    # 営業分析ダッシュボード
src/components/ai/SalesPredictionEngine.tsx            # AI成約予測
src/components/ai/CustomerSegmentAnalyzer.tsx          # 顧客セグメント分析
src/app/api/ai/sales-prediction/route.ts               # AI予測API
src/app/api/analytics/sales-performance/route.ts       # 営業パフォーマンスAPI
```

#### 🔧 実装リファレンス
```typescript
// AI営業予測例
interface SalesPrediction {
  appointmentId: string;
  closingProbability: number;
  predictedRevenue: number;
  recommendedActions: string[];
  competitorRisk: 'low' | 'medium' | 'high';
  optimalFollowUpTiming: string;
}

// 営業パフォーマンス分析
interface SalesMetrics {
  conversionRate: number;
  averageDealSize: number;
  salesCycleLength: number;
  pipelineVelocity: number;
  customerLifetimeValue: number;
}
```

#### ⚠️ Phase 5注意事項
- AI予測は既存アポイントメントデータを活用
- ダッシュボードはリアルタイム更新対応
- 機械学習モデルは軽量化してフロントエンド実装

---

## 📊 進捗報告フォーマット

### 🔄 日次進捗報告（毎日EOD）

```markdown
# Phase X - Day Y 進捗報告

## ✅ 完了項目
- [ ] 項目1: 詳細説明
- [ ] 項目2: 詳細説明

## 🔧 実装中項目  
- [ ] 項目1: 進捗率（%）、残課題
- [ ] 項目2: 進捗率（%）、残課題

## 🚨 課題・ブロッカー
- 課題1: 詳細・対応方針
- 課題2: 詳細・対応方針

## 📋 品質チェック結果
- TypeScriptエラー: X件（0件必須）
- ESLintエラー: X件（0件必須）
- ビルド状況: 成功/失敗
- 既存機能動作: 正常/異常

## 📅 明日の予定
- 実装予定項目1
- 実装予定項目2
```

### 🎯 Phase完了報告

```markdown
# Phase X 完了報告

## ✅ 実装完了項目（100%必須）
- [ ] 必須項目1: 完了
- [ ] 必須項目2: 完了
- [ ] 必須項目3: 完了

## 📋 品質基準達成確認
- [ ] TypeScriptエラー: 0件
- [ ] ESLintエラー: 0件  
- [ ] ビルド成功: 100%
- [ ] 既存機能動作: 100%
- [ ] レスポンシブ動作: 全デバイス確認

## 📂 作成・変更ファイル一覧
- 新規作成: X件
- 変更: X件
- 削除: X件

## 🔍 テスト結果
- 機能テスト: 合格/不合格
- 統合テスト: 合格/不合格
- レスポンシブテスト: 合格/不合格

## ➡️ 次Phase引き継ぎ事項
- 引き継ぎ項目1
- 引き継ぎ項目2
```

---

## 🛡️ 品質管理・エラー対応

### 🚨 エラー発生時の対応手順

#### 1. TypeScriptエラー発生時
```bash
# エラー箇所特定
npx tsc --noEmit

# 型定義確認・修正
# 修正後再チェック
npx tsc --noEmit
```

#### 2. ESLintエラー発生時
```bash
# エラー箇所特定
npm run lint

# 自動修正可能な場合
npm run lint -- --fix

# 手動修正後再チェック
npm run lint
```

#### 3. ビルドエラー発生時
```bash
# エラー内容確認
npm run build

# 依存関係確認
npm install

# キャッシュクリア
rm -rf .next
npm run build
```

#### 4. 機能破綻発生時
```bash
# 直前の安定状態に戻る
git log --oneline | head -5
git reset --hard <STABLE_COMMIT>

# 原因調査・修正後再実装
```

### 🔧 パフォーマンス監視

#### 必須監視項目
- **レスポンス時間**: カンバン移動 < 200ms
- **メモリ使用量**: ブラウザ < 100MB
- **バンドルサイズ**: 増加 < 10%
- **API応答**: < 500ms

```bash
# バンドル分析
npm run build
npm run analyze

# パフォーマンス測定
npm run lighthouse
```

---

## 📚 技術リファレンス

### 🎨 共通デザイントークン

```css
/* カラーパレット */
:root {
  --kanban-primary: #3b82f6;
  --kanban-secondary: #64748b;
  --kanban-success: #10b981;
  --kanban-warning: #f59e0b;
  --kanban-danger: #ef4444;
}

/* アニメーション */
:root {
  --animation-fast: 150ms;
  --animation-normal: 200ms;
  --animation-slow: 300ms;
}

/* 共通クラス */
.kanban-card {
  @apply bg-white rounded-lg border border-gray-200 p-4;
  @apply transition-all duration-200 ease-out;
  @apply hover:shadow-lg hover:-translate-y-0.5;
}
```

### 🔧 共通型定義

```typescript
// 共通インターフェース
interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  count?: number;
}

interface UniversalKanbanProps<T> {
  columns: KanbanColumn[];
  items: T[];
  itemType: 'task' | 'appointment' | 'project';
  onItemMove: (itemId: string, newColumnId: string) => void;
  renderCard: (item: T) => React.ReactNode;
  enableAddCards?: boolean;
  onAddCard?: (columnId: string) => void;
}

// タスク関係性
interface TaskRelationship {
  id: string;
  sourceTaskId: string;
  targetTaskId?: string;
  projectId?: string;
  relationshipType: 'TRANSFERABLE' | 'SIMULTANEOUS' | 'DEPENDENT';
  createdAt: string;
}
```

### 📡 API仕様

#### 新規エンドポイント
```
POST /api/task-relationships               # MECE関係性作成
POST /api/appointments/{id}/schedule        # アポ日程設定
PATCH /api/appointments/{id}/schedule       # アポ完了処理
POST /api/appointments/{id}/contract        # 契約処理
GET /api/calendar/unified                   # 統合カレンダー（拡張）
```

#### レスポンス形式
```typescript
// 成功レスポンス
{
  success: true,
  data: any,
  message?: string
}

// エラーレスポンス
{
  success: false,
  error: string,
  details?: any
}
```

---

## 🎯 成功基準・完了条件

### 📊 定量基準（すべて必須）
- **UI統一度**: 100%（アイコン・コンポーネント）
- **品質基準**: TypeScript・ESLintエラー 0件
- **パフォーマンス**: レスポンス時間 < 200ms
- **機能動作**: 100%（既存+新機能）

### 📋 定性基準
- **ユーザビリティ**: 直感的操作実現
- **保守性**: 共通コンポーネント化完了
- **拡張性**: 将来機能追加対応
- **一貫性**: 全ページ統一デザイン

### ✅ 最終検収項目

#### UI統一性検収
- [ ] 絵文字完全削除確認
- [ ] Lucide Reactアイコン統一確認
- [ ] 共通コンポーネント使用確認
- [ ] マイクロアニメーション動作確認

#### 機能完全性検収  
- [ ] タスクワークフロー完全動作
- [ ] MECE関係性機能動作
- [ ] カレンダー日付移動動作
- [ ] アポイントメント自動化動作
- [ ] バックオフィス連携動作

#### 品質基準検収
- [ ] TypeScriptエラー 0件
- [ ] ESLintエラー 0件
- [ ] ビルド成功 100%
- [ ] 全ブラウザ動作確認
- [ ] 全デバイス動作確認

#### データ整合性検収
- [ ] 既存データ 100%保持
- [ ] 既存機能 100%動作
- [ ] API互換性 100%維持

---

## 🚀 実装開始チェックリスト

### 📋 Phase開始前の確認事項

#### 環境確認
- [ ] Node.js 18+ インストール済み
- [ ] npm依存関係最新
- [ ] 開発サーバー正常起動
- [ ] データベース接続確認

#### ドキュメント確認
- [ ] このマスタープロンプト読了
- [ ] 要件定義書読了  
- [ ] 詳細実装計画読了
- [ ] 担当Phase詳細把握

#### 品質基準確認
- [ ] TypeScriptエラー 0件
- [ ] ESLintエラー 0件
- [ ] ビルド成功確認
- [ ] 既存機能動作確認

#### 作業環境準備
- [ ] Git状態保存コミット実行
- [ ] 作業ブランチ作成（必要に応じて）
- [ ] 開発ツール準備完了

---

## 🎓 このプロンプトで実現される成果

このマスタープロンプトに従って開発することで、以下が保証されます：

### ✨ 完璧な品質保証
- **エラー0件**: TypeScript・ESLint完全クリーン
- **100%動作保証**: 既存+新機能完全動作
- **完全レスポンシブ**: 全デバイス最適化

### 🚀 エンタープライズ級システム完成
- **統一UI/UX**: 4ページ完全統一デザイン
- **高度ワークフロー**: タスク・アポイント完全自動化
- **営業プロセス完全自動化**: 契約〜バックオフィス連携

### 🛠️ 高い開発効率
- **共通コンポーネント**: 保守性・拡張性向上
- **一貫したAPI**: 開発速度向上  
- **完全な型安全性**: バグ発生率最小化

### 📈 システム価値最大化
- **MECE関係性**: タスク間関係活用
- **完全統合**: カレンダー・タスク・アポイント連携
- **データ活用**: 営業ナレッジ蓄積・分析

---

**各フェーズ担当エンジニアは、このマスタープロンプトを基準として、高品質で一貫した実装を行ってください。**

**5週間で、世界レベルのエンタープライズ営業・タスク管理システムを完成させましょう。**

---

*作成者: Claude Code*  
*最終更新: 2025-06-17*  
*適用開始: 即座に適用可能*