# 🚀 開発引き継ぎプロンプト

**作成日**: 2025-06-19  
**前任者**: Claude Code Assistant  
**対象プロジェクト**: Find To-Do Management App  
**現在のフェーズ**: アポイントメントカンバンUI/UX改善

---

## 📋 プロジェクト概要

タスク管理・営業支援を統合したWebアプリケーション。Next.js 15、TypeScript、Prisma、PostgreSQLで構築。

## 🔧 直前の作業内容

### 完了事項
1. **人脈管理機能拡張** ✅
   - 連絡先情報（メール・電話）追加
   - 企業別フィルタリング機能実装

2. **アポイントメントカンバン編集ボタン修正** ✅
   - カンバンビューでの編集機能不具合を解決
   - ドラッグ&ドロップとの競合を修正

### 現在のアクティブ課題
`docs/active/current/ACTIVE_TASKS_2025-06-19.md`を参照

**最優先タスク**:
1. **9.1 カードUIデザイン統一** (4-6時間)
2. **9.2 関係性タブ自動化** (6-8時間)

---

## 🎯 次のエンジニアへの作業指示

### 1. 環境セットアップ
```bash
# リポジトリクローン後
npm install
npx prisma generate
npm run dev
```

### 2. 作業開始前の確認事項
- `docs/active/current/ACTIVE_TASKS_2025-06-19.md` - 最新の課題リスト
- `docs/active/current/CONNECTIONS_ENHANCEMENT_COMPLETION_REPORT.md` - 直前の完了作業
- `docs/core/CURRENT_ISSUES_AND_IMPROVEMENTS.md` - 全体的な改善項目

### 3. 推奨作業フロー

#### STEP 1: カードUIデザイン統一 (9.1)
```typescript
// EnhancedAppointmentKanban.tsx の AppointmentCard コンポーネント修正

// 現在の表示:
// - 会社名がメインタイトル
// - 次のアクションが小さく表示

// 変更後:
// - 次のアクション(nextAction)をメインタイトルに
// - カレンダーイベント日時を明確に表示
// - 会社名・担当者をサブ要素として表示
```

**参考実装**: 
- `src/components/kanban/KanbanItemCard.tsx` - タスクカンバンのカードデザイン
- 同じ視覚的階層・色使い・アイコンを適用

#### STEP 2: 関係性タブ自動化 (9.2)
```typescript
// 処理フロー:
// 1. COMPLETED ステータス到達時
// 2. appointment_details.relationshipStatus を 'RAPPORT_BUILDING' に自動更新
// 3. 完了タブ移動時にモーダル表示
```

**必要な実装**:
- `handleAppointmentMove` 関数の拡張
- 新規モーダルコンポーネント作成
- APIエンドポイントの追加

---

## 🔄 フェーズ途中で区切る際のフロー

### 1. 作業状態の保存
```bash
# 現在の作業をステージング
git add -A

# WIP（Work In Progress）コミット
git commit -m "WIP: [作業内容の簡潔な説明]

## 進捗状況
- 完了: [完了した項目]
- 作業中: [現在作業中の項目]
- 未着手: [残りの項目]

## 次のステップ
[次に行うべき作業の説明]"
```

### 2. 引き継ぎドキュメント更新
```bash
# アクティブタスクの進捗更新
vim docs/active/current/ACTIVE_TASKS_2025-06-19.md
# ステータスを「🔧作業中」に変更

# 作業ログファイル作成
vim docs/active/current/WORK_LOG_[日付].md
```

### 3. 作業ログテンプレート
```markdown
# 作業ログ - [日付]

## 実施内容
- [具体的な変更内容]

## 発生した問題
- [問題の説明と対処法]

## 残課題
- [未解決の課題]

## 次回作業者への申し送り
- [重要な注意点]
- [参考になる情報]
```

---

## ⚠️ 重要な注意事項

### 1. デバッグログ
現在、以下のデバッグログが仕込まれています：
- `🎯` - カンバン編集ハンドラー
- `🔄` - データ読み込み
- `💾` - フォーム送信
- `🎨` - UI操作

本番環境では削除してください。

### 2. 既知の課題
- カンバンのドラッグ&ドロップが時々不安定
- 大量データ時のパフォーマンス最適化が必要

### 3. テスト手順
```bash
# TypeScriptチェック
npm run build

# Lintチェック
npm run lint

# 手動テスト重点項目
1. アポイントメントページ → カンバン表示
2. 各種編集・削除・ドラッグ操作
3. モーダル表示・データ保存
```

---

## 📚 参考資料

### プロジェクト構造
```
src/
├── app/appointments/     # アポイントメント関連
├── components/
│   ├── appointments/     # アポ専用コンポーネント
│   ├── kanban/          # 汎用カンバンコンポーネント
│   └── tasks/           # タスク関連（UI参考用）
├── hooks/               # カスタムフック
└── lib/                 # ユーティリティ
```

### 主要ファイル
- `src/app/appointments/page.tsx` - アポイントメントメインページ
- `src/components/appointments/EnhancedAppointmentKanban.tsx` - カンバンビュー
- `prisma/schema.prisma` - データベーススキーマ

### API設計パターン
- REST API: `/api/appointments`
- カンバン専用: `/api/appointments/kanban/[type]`
- 詳細操作: `/api/appointments/[id]/[action]`

---

## 🤝 引き継ぎ完了チェックリスト

- [ ] このドキュメントを読み理解した
- [ ] 開発環境が正常に動作している
- [ ] アクティブタスクの内容を把握した
- [ ] 現在のコードベースの状態を確認した
- [ ] テスト実行して問題がないことを確認した

**質問や不明点がある場合**:
1. 過去のコミットログを確認
2. `docs/`ディレクトリ内のドキュメントを検索
3. コード内のコメントやTODOを確認

---

*頑張ってください！素晴らしいアプリケーションの完成を期待しています。* 🚀