# Phase 1 実装戦略

## Phase 1 実装戦略

### 📋 必須完了項目
- [ ] 絵文字完全削除（11ファイル・200箇所以上）: 工数見積もり 8時間
- [ ] Lucide React統一実装（アイコン検証必須）: 工数見積もり 8時間
- [ ] UniversalKanbanCard実装（4種類対応）: 工数見積もり 6時間
- [ ] UniversalKanban実装（ドラッグ&ドロップ統合）: 工数見積もり 8時間
- [ ] AddCardButton実装（全カンバン配置）: 工数見積もり 4時間
- [ ] 基本アニメーション実装: 工数見積もり 4時間

### 🔧 技術的課題・リスク
- **課題1: アイコン存在チェック**: 対応方針: Lucide React公式ドキュメント事前確認・実装前検証
- **課題2: @dnd-kit統合**: 対応方針: 既存パターン維持・段階的移行
- **課題3: 型安全性**: 対応方針: TypeScript generics活用・厳密な型定義
- **課題4: 既存機能保持**: 対応方針: TaskKanbanBoardから段階的移行・機能テスト必須

### 📅 5日間詳細スケジュール
**Day 1**: アイコンシステム構築・絵文字削除（8時間）
**Day 2**: UniversalKanbanCard実装・型定義（8時間）
**Day 3**: UniversalKanban実装・@dnd-kit統合（8時間）
**Day 4**: AddCardButton・アニメーション実装（8時間）
**Day 5**: TaskKanbanBoard移行・統合テスト・品質確認（8時間）

### 🎯 Day別完了基準
**Day 1完了基準**: 
- src/lib/icons.ts完成・全アイコン定義済み
- 11ファイルの絵文字完全削除
- TypeScript・ESLintエラー0件
- ビルド成功

**Day 2完了基準**: 
- UniversalKanbanCard.tsx完成
- 4種類（task/appointment/project/calendar）対応
- 型安全性確保・プロップス定義完了
- 基本レンダリング確認

**Day 3完了基準**:
- UniversalKanban.tsx完成
- @dnd-kit完全統合
- ドラッグ&ドロップ動作確認
- 既存機能100%保持

**Day 4完了基準**:
- AddCardButton.tsx完成
- kanban-animations.css完成
- マイクロアニメーション動作確認
- 全コンポーネント統合完了

**Day 5完了基準**:
- TaskKanbanBoard新コンポーネント移行完了
- 全機能動作確認
- TypeScript・ESLintエラー0件
- ビルド成功・パフォーマンス<200ms
- Phase 1完了報告書作成