# カンバン機能改善タスクリスト

## 🚨 次のエンジニアへ - 緊急対応事項

**前回の実装**: カンバン統合APIとフロントエンド統合完了
**現在の状況**: 基本動作はするが、UX改善が必要

### 現在発生している問題
1. ⚠️ **タイムアウトエラー**: API応答9秒 vs タイムアウト5秒
2. ⚠️ **重複操作警告**: `カンバン移動が既に進行中です`
3. ⚠️ **視覚的フィードバック不足**: ドロップ先が不明確

---

## 📋 優先度付きタスクリスト

### 🔥 高優先度（今すぐ対応）

- [ ] **カレンダーの視覚的フィードバックをカンバンに適用**
  - ファイル: `src/components/tasks/EnhancedTaskKanban.tsx`
  - 内容: ドロップ領域のハイライト、移動中アニメーション
  - 参考: `src/components/calendar/DraggableEvent.tsx`

- [ ] **ローディング状態管理の改善**  
  - ファイル: `src/lib/hooks/useKanbanMove.ts`
  - 内容: 移動専用ローディング、競合状態防止強化
  - 問題: 重複操作で警告が出る

- [ ] **タブ別処理の統一**
  - ファイル: `src/components/tasks/EnhancedTaskKanban.tsx`
  - 内容: ステータス別・ユーザー別・プロジェクト別の適切な処理分岐
  - 現状: ステータス変更のみ対応

### ⚡ 中優先度（1週間以内）

- [ ] **タイムアウト設定の最適化**
  - ファイル: `src/lib/utils/kanban-utils.ts:27`
  - 変更: `timeout: 5000` → `timeout: 15000`
  - 変更: `retryCount: 3` → `retryCount: 2`

- [ ] **デバウンス機能追加**
  - ファイル: `src/lib/hooks/useKanbanMove.ts`
  - 内容: 連続ドラッグ防止、300ms遅延

### 📈 低優先度（機能拡張）

- [ ] **統一UI/UXシステム構築**
  - ファイル: `src/lib/hooks/useUnifiedMove.ts` (新規作成)
  - 内容: カレンダーとカンバンの統合フック

---

## 📁 重要ファイル一覧

### 実装済み（参考にする）
- ✅ `src/app/api/kanban/move/route.ts` - 統合API
- ✅ `src/lib/hooks/useKanbanMove.ts` - 移動フック  
- ✅ `src/lib/utils/kanban-utils.ts` - ユーティリティ

### 改善対象
- 🔧 `src/components/tasks/EnhancedTaskKanban.tsx` - メイン実装
- 🔧 各種カンバンコンポーネント

### 参考実装（カレンダー）
- 📖 `src/components/calendar/DraggableEvent.tsx`
- 📖 `src/components/calendar/CalendarView.tsx`
- 📖 `src/components/calendar/DraggableCalendarCell.tsx`

---

## 🚀 実装手順

1. **すぐやる**: タイムアウト設定変更（1行修正）
2. **次にやる**: 視覚的フィードバック追加
3. **その後**: ローディング状態改善
4. **最後**: タブ別処理統一

## 📖 詳細仕様

**詳細な実装計画**: `docs/kanban-improvement-plan.md`を確認

---

**🔔 注意**: このタスクはカレンダー機能の成功パターンを参考に、カンバンのUXを同等レベルまで向上させることが目的です。