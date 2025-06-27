# 開発ISSUE管理システム INDEX

**最終更新**: 2025-06-21  
**システム完成度**: 95%（認証のみ未実装）

## 🗂️ ディレクトリ構造

### 🚨 `/immediate/` - 今すぐ対応が必要
システム運用開始前に必須の緊急対応事項

- **`AUTHENTICATION_ISSUE.md`** - 認証システム実装（2-3日で完了必須）

### 🔄 `/current-issues/` - 中期ISSUE管理
現在進行中または近日対応予定の具体的な改善作業

- **`UI_OPTIMIZATION_ISSUE.md`** - UI統一・最適化作業（1-2週間）
- **`ACTIVE_TASKS_2025-06-19.md`** - アクティブタスク一覧
- **`CONNECTIONS_ENHANCEMENT_COMPLETION_REPORT.md`** - 人脈機能強化報告
- **`HANDOVER_2025-06-19.md`** - 引き継ぎ事項
- **`HANDOVER_APPOINTMENT_FLOW_2025-06-19.md`** - アポイントメントフロー
- **`PROGRESS_SUMMARY_2025-06-19.md`** - 進捗サマリー
- **`ENGINEER_PREPARATION_PROMPT.md`** - エンジニア準備
- **`CURRENT_ISSUES_AND_IMPROVEMENTS.md`** - 現在の課題と改善点
- **`INTEGRATED_PROJECT_STATUS_REPORT.md`** - 統合プロジェクト状況
- **`DATE_FIELD_MAPPING.md`** - 日付フィールドマッピング

### 📋 `/strategic/` - 長期戦略ISSUE
重要だが緊急でない将来の機能拡張計画

- **`LONG_TERM_ENHANCEMENT_ISSUE.md`** - 長期機能拡張戦略（2025-2027年）
- **`COMPREHENSIVE_UNIMPLEMENTED_REQUIREMENTS_ROADMAP.md`** - 詳細ロードマップ
- **`PERFECT_PHASE_IMPLEMENTATION_PLAN.md`** - 完璧フェーズ実装計画
- **`PHASE_6_KICKOFF_PROMPT.md`** - フェーズ6開始プロンプト

### 📚 `/guides/` - 永続開発ガイド
不変の開発ルール・UI統一・技術ガイド

#### 開発ルール・ワークフロー
- **`CLAUDE.md`** - Claude開発エージェント設定
- **`DEVELOPMENT_WORKFLOW_MASTER_GUIDE.md`** - 開発ワークフロー
- **`MASTER_DEVELOPMENT_PROMPT.md`** - 統一開発プロンプト
- **`UNIVERSAL_DEVELOPMENT_GUIDE.md`** - 汎用開発ガイド
- **`UNIVERSAL_DEVELOPMENT_KNOWLEDGE_BASE.md`** - 開発ナレッジベース
- **`DEVELOPER_REFERENCE_INDEX.md`** - 開発者リファレンス
- **`README.md`** - 基本ガイド

#### UI/UX・設計ガイド
- **`UI_UX_DESIGN_GUIDELINES.md`** - UIデザインガイドライン
- **`ASSIGNEE_SYSTEM_CORE_GUIDANCE.md`** - 担当者システム設計指針
- **`REQUIREMENTS_DEFINITION_COMPREHENSIVE.md`** - 包括的要件定義
- **`DATABASE_ANALYSIS_COMPLETE_REPORT.md`** - データベース設計分析
- **`CALENDAR_FEATURE_MASTER_DESIGN.md`** - カレンダー機能設計

#### 技術実装ガイド
- **`dnd-kit-animation-knowledge.md`** - ドラッグ&ドロップ実装
- **`drag-drop-debug-knowledge.md`** - D&Dデバッグ知識
- **`kanban-improvement-plan.md`** - カンバン改善技術
- **`MBTI活用ガイド.md`** - MBTI性格分析活用

### 📦 `/archive/` - 履歴・完了事項
過去のドキュメント・完了したタスクの履歴

- **`historical/`** - 過去の開発プロンプト・調査レポート

### 📄 ルートレベル重要ドキュメント
- **`ASSIGNEE_SYSTEM_REDESIGN_PROPOSAL.md`** - 担当者システム再設計
- **`HANDOFF.md`** - メイン引き継ぎドキュメント

## 🔄 ISSUE管理フロー

### 1. 新規ISSUE発生時
```
問題発見 → 緊急度判定 → 該当ディレクトリに ISSUE.md 作成
```

### 2. 作業フロー
```
immediate → current-issues → strategic → 完了・archive
```

### 3. 進捗更新ルール
- 各ISSUEファイルの末尾に日付付きで進捗更新
- ステータス: 🔴未着手 🟡進行中 🟢完了 🔵計画中
- チェックリスト形式でタスク管理

## 📊 現在の実装状況

### ✅ 完全実装済み（95%）
- データベース基盤（20テーブル）
- API層（51エンドポイント）  
- UI層（59コンポーネント）
- 外部連携（LINE・Google Docs・Discord）
- 業務管理機能（タスク・プロジェクト・アポ・人脈）

### 🚨 今すぐ対応必要（immediate）
- **認証システム実装** - NextAuth.js（2-3日）

### 🔄 改善作業中（current-issues）
- UI統一・最適化
- システム微調整

### 📋 将来計画（strategic）
- 高度AI機能
- 外部連携拡張
- スケーラビリティ向上

## 🎯 開発者向け使用ガイド

### 新規参画時
1. `/guides/CLAUDE.md` - 開発環境設定
2. `/guides/UNIVERSAL_DEVELOPMENT_GUIDE.md` - 開発方針理解
3. `/immediate/` - 緊急対応事項確認
4. `/current-issues/` - 現在の作業把握

### 日々の開発時
1. `/immediate/` - 緊急事項優先対応
2. `/current-issues/` - 進行中作業の進捗更新
3. `/guides/` - 開発ルール・技術ガイド参照

### 新機能企画時
1. `/strategic/` - 長期計画との整合性確認
2. `/guides/` - 設計ガイドライン遵守
3. 新ISSUE作成（適切なディレクトリに配置）

## 🔧 ドキュメント管理ルール

- **ISSUE形式**: 問題・タスク・進捗を一元管理
- **進捗透明性**: 各ISSUEで具体的な進捗状況を更新
- **完了時移動**: 完了したISSUEは`/archive/`に移動
- **ガイド更新**: `/guides/`は新しい知見で随時更新

このシステムにより、全てのタスクが体系的に管理され、必然的にシステム完成へと導かれます。