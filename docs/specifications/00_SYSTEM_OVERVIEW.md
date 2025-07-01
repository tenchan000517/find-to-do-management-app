# システム概要仕様書

## プロジェクト情報

| 項目 | 内容 |
|------|------|
| システム名 | Find To Do Management App |
| バージョン | 2.5 |
| 開発フェーズ | リソースベースシステム実装完了 |
| 最終更新日 | 2025年7月1日 |
| 文書作成者 | Claude Code |

## 1. システム概要

### 1.1 システム目的
Find To Do Management Appは、個人・チーム・企業レベルでの包括的なタスク管理とプロジェクト管理を実現する次世代統合プラットフォームです。AI技術、LINE Bot連携、リアルタイム分析機能を組み合わせ、従来のタスク管理ツールを超越した革新的なワークフロー最適化を提供します。

### 1.2 システム特徴

#### 🤖 AI駆動の自動化
- Gemini AIによる自然言語処理とタスク自動生成
- 営業成約確率・プロジェクト成功度のAI予測
- タスク完了時の自動ナレッジ化システム
- MBTI分析に基づくチーム最適化
- **🚀 NEW: リソースベーススケジューリング** - 業界初のウエイト・容量ベース自動スケジューリング
- **🚀 NEW: 6種類ユーザータイプ対応** - 学生・会社員・フリーランス等の特性別最適化
- **🚀 NEW: 制約遵守エンジン** - 時間制約・容量制約の自動遵守

#### 📱 LINE Bot統合
- 自然言語でのタスク・予定・アポイント作成
- セッション管理による段階的データ入力
- リアルタイムでのダッシュボード連携

#### 📊 統合分析ダッシュボード
- GA4・Search Console連携による包括的分析
- リアルタイムメトリクス監視
- Phase別システム統合状況の可視化
- **🚀 NEW: ResourceUtilizationViewer** - 革新的リソース利用状況可視化
- **🚀 NEW: リソースベース表示機能** - 3つの表示モード（概要・詳細・分析）

#### 💼 企業レベル機能
- LTV（顧客生涯価値）分析
- 営業自動化・機会管理
- プロジェクトテンプレート自動生成
- 財務リスク管理
- **🚀 NEW: AI駆動プロジェクトテンプレート** - 自然言語からの30秒プロジェクト生成
- **🚀 NEW: ウエイトベースタスク管理** - 科学的作業負荷管理

### 1.3 技術スタック

#### フロントエンド
- **Framework**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **状態管理**: React Hooks + Custom Hooks
- **リアルタイム**: WebSocket
- **モバイル対応**: レスポンシブデザイン

#### バックエンド
- **Runtime**: Node.js
- **API**: Next.js API Routes
- **認証**: NextAuth.js
- **ORM**: Prisma
- **データベース**: PostgreSQL

#### 外部連携
- **AI**: Google Gemini API
- **メッセージング**: LINE Messaging API
- **分析**: Google Analytics 4, Search Console
- **ドキュメント**: Google Apps Script連携

### 1.4 主要機能モジュール

#### Core Modules
1. **タスク管理** - 高度なカンバンボード、MECE関係性管理
2. **プロジェクト管理** - フェーズ管理、リソース配分、成功度予測
3. **カレンダー・スケジュール** - 統合カレンダー、繰り返し予定
4. **人脈・コネクション管理** - 営業プロセス、LTV分析
5. **ナレッジ管理** - 自動化ナレッジ生成、カテゴリ分類

#### Advanced Modules
1. **AI分析エンジン** - 成功度・優先度・リスク評価
2. **営業自動化** - 機会管理、成約確率予測
3. **リソース最適化** - MBTI分析、チーム最適化
4. **財務管理** - プロジェクト収益予測、リスク管理
5. **運用監視** - システムヘルス、パフォーマンス監視

#### Integration Modules
1. **LINE Bot統合** - 自然言語処理、マルチセッション管理
2. **Google連携** - Docs自動処理、Analytics統合
3. **Discord連携** - メトリクス連携、通知システム
4. **モバイル最適化** - PWA対応、オフライン機能

### 1.5 システムアーキテクチャ

```
┌─────────────────────────────────────────────────┐
│                 Frontend Layer                   │
├─────────────────────────────────────────────────┤
│  Next.js App Router │ React Components │ Hooks   │
├─────────────────────────────────────────────────┤
│                  API Layer                      │
├─────────────────────────────────────────────────┤
│  REST APIs │ WebSocket │ Webhooks │ Auth        │
├─────────────────────────────────────────────────┤
│                Service Layer                    │
├─────────────────────────────────────────────────┤
│  Business Logic │ AI Services │ Integrations    │
├─────────────────────────────────────────────────┤
│                 Data Layer                      │
├─────────────────────────────────────────────────┤
│  Prisma ORM │ PostgreSQL │ Redis Cache         │
├─────────────────────────────────────────────────┤
│               External Services                 │
├─────────────────────────────────────────────────┤
│  Gemini AI │ LINE API │ Google APIs │ Discord   │
└─────────────────────────────────────────────────┘
```

### 1.6 データベース構成

#### Core Tables (17テーブル)
- users, tasks, projects, appointments, calendar_events
- knowledge_items, connections, line_integration_logs
- task_relationships, project_relationships
- task_collaborators, task_archives, recurring_rules
- personal_schedules, appointment_details
- discord_metrics, ai_evaluations

#### Advanced Tables (20テーブル)  
- student_resources, project_resource_allocation
- mbti_team_analysis, resource_optimization_history
- project_financial_details, customer_ltv_analysis
- project_templates, knowledge_automation_history
- google_docs_sources, ai_content_analysis
- content_recommendations, content_processing_logs
- gas_sync_metrics, customers, sales_opportunities
- sales_activities, contracts, ai_analysis_history
- conversion_predictions, sales_metrics_history

### 1.7 セキュリティ・認証

#### 認証システム
- NextAuth.js による OAuth認証
- ロールベースアクセス制御 (RBAC)
- セッション管理・タイムアウト制御

#### セキュリティ機能
- API署名検証 (LINE Webhook)
- CORS設定・CSP実装
- 入力値検証・SQLインジェクション対策
- 監査ログ・アクセス制御

### 1.8 パフォーマンス・スケーラビリティ

#### 最適化機能
- データベースインデックス最適化
- API応答キャッシュ (5分間)
- 仮想化リスト表示
- 楽観的更新・並行処理

#### 監視・運用
- リアルタイムシステムヘルス監視
- パフォーマンスメトリクス計測
- エラー追跡・アラート機能
- 自動バックアップ・復旧

### 1.9 モバイル対応

#### レスポンシブデザイン
- モバイルファースト設計
- タッチ操作最適化
- オフライン機能対応
- PWA (Progressive Web App) 実装

#### モバイル専用機能
- スワイプジェスチャー
- 音声入力対応
- プッシュ通知
- ダークモード対応

### 1.10 今後の拡張計画

#### Phase B (次期開発)
- より高度なジェスチャー操作
- 音声認識・音声コマンド
- AR/VR インターフェース
- 多言語対応

#### 長期計画
- マイクロサービス化
- クラウドネイティブ対応
- エンタープライズ機能強化
- API生態系の構築

### 1.11 🚀 NEW: リソースベースシステムアーキテクチャ

#### 核心エンジン

##### WeightBasedScheduler
**次世代スケジューリングエンジン**
- ウエイトベースタスク分析・優先順位付け
- 依存関係グラフの構築・解析
- 制約遵守下での最適配置アルゴリズム
- リアルタイムスケジュール最適化

##### ResourceConstraintEngine
**制約遵守エンジン**
- ユーザータイプ別制約の自動適用
- 時間制約（授業・勤務時間）の厳格遵守
- 容量制約（日次ウエイト制限）の動的管理
- リソース可用性の実時間計算

##### FuturePredictionEngine
**先読み予測システム**
- 4週間先の容量予測・分析
- 破綻リスクの事前検出・回避
- 前倒し推奨の自動生成
- 季節性・外部要因の考慮

#### 革新的アーキテクチャ特徴

##### パラダイムシフト
- **従来**: 時間ベース管理 → **革新**: ウエイト・容量ベース管理
- **従来**: 主観的判断 → **革新**: 科学的データ駆動管理
- **従来**: 事後対応 → **革新**: 予測的問題回避

##### 6種類ユーザータイプ対応
```typescript
UserType = "student" | "employee" | "freelancer" | 
           "entrepreneur" | "parent" | "retiree"
```

各ユーザータイプの特性:
- **制約条件**: 時間・容量・エネルギー制限
- **最適化目標**: 効率性・ストレス軽減・バランス
- **予測パラメータ**: リスク許容度・パフォーマンス期待値

##### データ統合アーキテクチャ
```typescript
interface ResourceScheduleResult {
  schedule: ScheduledTask[];
  resourceAllocation: ResourceAllocation;
  futurePrediction: FuturePrediction;
  userProfile: UserResourceProfile;
  metadata: ScheduleMetadata;
}
```

#### API設計原則

##### RESTful設計
- **POST /api/ai/resource-schedule**: メインスケジューリング
- **統合レスポンス**: スケジュール・リソース・予測の一体提供
- **フォールバック機能**: 障害時の自動代替処理

##### 型安全性
- TypeScript完全対応
- 実行時型チェック実装
- エラーハンドリングの完全実装

#### パフォーマンス特性

##### 応答性能
- **API応答時間**: 0.7-4.0秒
- **スループット**: 50 requests/second
- **同時ユーザー**: 100+ concurrent users

##### スケーラビリティ
- **ユーザー容量**: 10,000+ users
- **データ処理能力**: 1,000,000+ records
- **処理能力**: 5,000+ operations/second

#### セキュリティ・品質保証

##### データ整合性
- **一貫性**: 99.5%データ整合性保証
- **信頼性**: 99.9%アップタイム
- **エラー率**: 0.1%未満

##### 品質指標
- **コードカバレッジ**: 90%以上
- **型安全性**: 100%TypeScript対応
- **ドキュメント**: 実装・仕様書100%同期

---

*この仕様書は、システムの現在の実装状況に基づいて作成されており、定期的に更新されます。*