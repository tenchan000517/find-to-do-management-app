# システム機能カテゴリ一覧

このドキュメントは、タスク管理アプリケーションの全機能を完全走査し、カテゴライズした結果です。

## システム概要

- **プロジェクト名**: Find To-Do Management App
- **技術スタック**: Next.js 14, TypeScript, Tailwind CSS, Prisma (PostgreSQL)
- **APIエンドポイント数**: 100以上
- **Reactコンポーネント数**: 80以上  
- **データベーステーブル数**: 30以上
- **専門サービスクラス数**: 15

## 機能カテゴリ

### 1. 認証・権限管理
- **NextAuth.js認証システム** (`src/app/api/auth/[...nextauth]/route.ts`)
- **ユーザー権限管理** (AdminユーザーAI使用量管理)
- **ロールベースアクセス制御** (ADMIN, MANAGER, MEMBER, GUEST, STUDENT, ENTERPRISE)
- **セキュリティ設定**
- **ログイン履歴追跡**

### 2. タスク管理システム
- **カンバンボード** (IDEA → PLAN → DO → CHECK → COMPLETE → KNOWLEDGE)
- **タスクCRUD操作** (`src/app/api/tasks/route.ts`)
- **タスク関係性管理** (TRANSFERABLE, SIMULTANEOUS, DEPENDENT)
- **タスクアーカイブ機能** (SOFT/PERMANENT削除)
- **協力者管理システム**
- **MECE関係性マネージャー**
- **優先度管理** (A, B, C, D)
- **期限管理・リセット機能**

### 3. プロジェクト管理
- **プロジェクトライフサイクル管理** (PLANNING → ACTIVE → ON_HOLD → COMPLETED)
- **プロジェクト分析・予測** (成功確率、KGI生成)
- **フェーズ履歴管理**
- **プロジェクトテンプレート生成**
- **チーム最適化・リーダーシップ追跡**
- **プロジェクト関係性管理**
- **昇格候補プロジェクト識別**

### 4. アポイントメント管理
- **商談管理** (PENDING → CONTACTED → INTERESTED → SCHEDULED)
- **商談詳細管理** (関係性ステータス、フェーズ管理)
- **契約処理フロー**
- **アポイントメント評価システム**
- **再スケジュール機能**
- **商談カンバンボード**

### 5. カレンダー・スケジュール管理
- **統合カレンダー** (月・週・日表示)
- **イベント管理** (MEETING, EVENT, DEADLINE)
- **繰り返しルール** (DAILY, WEEKLY, MONTHLY, CUSTOM)
- **個人スケジュール管理**
- **ドラッグ&ドロップ機能**
- **カラーコード管理**
- **全日イベント対応**

### 6. ナレッジ管理
- **ナレッジベース** (INDUSTRY, SALES, TECHNICAL, BUSINESS)
- **自動ナレッジ生成** (タスク完了時の自動化)
- **Google Docs連携・同期**
- **AI コンテンツ分析**
- **ナレッジ自動化ダッシュボード**
- **タグ管理・検索**
- **いいね機能**

### 7. AI・機械学習機能

#### 7.1 営業AI
- **営業予測エンジン** (コンバージョン予測)
- **営業ステージ自動化**
- **顧客セグメント分析**
- **契約自動化エンジン**
- **営業アシスタント**
- **営業確率計算**

#### 7.2 評価・分析AI
- **AI評価エンジン** (batch評価、個別評価)
- **コンテンツ分析** (sentiment、urgency解析)
- **推奨エンジン** (タスク・プロジェクト・イベント作成提案)
- **AI使用量管理**

### 8. 分析・ダッシュボード

#### 8.1 Webアナリティクス
- **Google Analytics 4連携**
- **Search Console連携**
- **SEO インサイト**
- **トラフィック分析**
- **ページパフォーマンス分析**

#### 8.2 営業分析
- **営業パフォーマンス分析**
- **ROI予測チャート**
- **パイプライン分析**
- **売上メトリクス**
- **フォローアップ提案**

#### 8.3 プロジェクト分析
- **プロジェクト成功率分析**
- **リスク分析**
- **改善提案生成**
- **接続性分析**
- **リーチ計算**

### 9. ソーシャル・外部連携

#### 9.1 Discord連携
- **Discord メトリクス分析**
- **リアクション・メッセージ統計**
- **チャンネル分析**
- **メンバー・ロール分析**
- **エンゲージメント計測**

#### 9.2 LINE Bot
- **LINE ユーザー管理**
- **メッセージ処理・解析**
- **自動データ保存**
- **セッション管理**
- **Webhook検証**
- **Flex UIメッセージ**

#### 9.3 ソーシャルアナリティクス
- **Twitter API連携**
- **Instagram Graph API**
- **レート制限管理**
- **ソーシャルダッシュボード**

### 10. 財務・LTV管理
- **顧客LTV分析**
- **プロジェクト財務詳細**
- **売上予測・追跡**
- **財務リスク管理**
- **収益予測**
- **LTV分析アラート**

### 11. 人事・リソース管理

#### 11.1 学生リソース管理
- **学生スキル・可用性管理**
- **プロジェクト割り当て最適化**
- **パフォーマンス追跡**
- **週次コミット時間管理**
- **負荷率管理**

#### 11.2 MBTI活用システム
- **個人性格プロファイル**
- **チーム相性分析**
- **最適化提案**
- **MBTI型別分析**
- **チーム最適化**

### 12. リアルタイム・通知
- **リアルタイムダッシュボード**
- **イベントストリーミング**
- **アラート・通知システム**
- **プロジェクトアラート管理**
- **ユーザーアラート**
- **スケジューラー**

### 13. モバイル対応
- **モバイル専用UI**
- **アクセシビリティ対応**
- **ジェスチャー操作**
- **オフライン機能**
- **PWA対応**
- **レスポンシブデザイン**

### 14. 管理機能
- **デバッグ・テストデータ管理**
- **システムメトリクス**
- **エラーログ管理**
- **データクリーンアップ**
- **統合ダッシュボード**

## 主要APIエンドポイント一覧

### 認証
- `POST /api/auth/[...nextauth]` - NextAuth認証

### タスク管理
- `GET|POST /api/tasks` - タスク一覧・作成
- `GET|PUT|DELETE /api/tasks/[id]` - タスク詳細操作
- `POST /api/tasks/[id]/assignee` - 担当者設定
- `POST /api/tasks/[id]/collaborators` - 協力者管理
- `POST /api/tasks/[id]/archive` - アーカイブ
- `GET|POST /api/task-relationships` - タスク関係性

### プロジェクト管理
- `GET|POST /api/projects` - プロジェクト一覧・作成
- `GET /api/projects/[id]/analytics` - プロジェクト分析
- `POST /api/projects/[id]/assignee` - 担当者設定
- `GET /api/projects/[id]/kgi` - KGI取得
- `GET /api/projects/[id]/leadership-history` - リーダーシップ履歴
- `GET /api/projects/[id]/relationships` - プロジェクト関係性
- `GET /api/projects/promotion-candidates` - 昇格候補

### アポイントメント管理
- `GET|POST /api/appointments` - アポイントメント一覧・作成
- `GET|PUT|DELETE /api/appointments/[id]` - アポイントメント詳細
- `POST /api/appointments/[id]/complete` - 完了処理
- `POST /api/appointments/[id]/contract` - 契約処理
- `POST /api/appointments/[id]/reschedule` - 再スケジュール
- `POST /api/appointments/evaluate` - 評価

### カレンダー
- `GET|POST /api/calendar` - カレンダー操作
- `GET|POST /api/calendar/events` - イベント管理
- `GET|PUT|DELETE /api/calendar/events/[id]` - イベント詳細
- `GET /api/calendar/unified` - 統合カレンダー

### ナレッジ管理
- `GET|POST /api/knowledge` - ナレッジ一覧・作成
- `POST /api/knowledge/[id]/like` - いいね機能
- `GET /api/knowledge-automation` - 自動化管理

### AI機能
- `POST /api/ai/evaluate` - AI評価
- `POST /api/ai/batch-evaluate` - バッチ評価
- `POST /api/ai/conversion-prediction` - コンバージョン予測
- `POST /api/ai/sales-analysis` - 営業分析
- `POST /api/ai/sales-prediction` - 営業予測

### 分析・ダッシュボード
- `GET /api/analytics/dashboard` - 分析ダッシュボード
- `GET /api/analytics/connections` - 接続分析
- `GET /api/analytics/project-success` - プロジェクト成功分析
- `GET /api/analytics/sales-metrics` - 営業メトリクス
- `GET /api/analytics/sales-performance` - 営業パフォーマンス
- `GET /api/analytics/seo-insights` - SEOインサイト

### 外部連携
- `POST /api/webhook/line` - LINE Webhook
- `POST /api/webhook/discord-notifications` - Discord通知
- `POST /api/webhook/google-docs-gas` - Google Docs連携

## データベーステーブル構造

### 主要テーブル
- `users` - ユーザー管理
- `tasks` - タスク管理
- `projects` - プロジェクト管理
- `appointments` - アポイントメント管理
- `calendar_events` - カレンダーイベント
- `knowledge_items` - ナレッジアイテム
- `connections` - 人脈管理

### 分析・履歴テーブル
- `ai_evaluations` - AI評価履歴
- `project_alerts` - プロジェクトアラート
- `user_alerts` - ユーザーアラート
- `discord_metrics` - Discordメトリクス
- `ai_call_logs` - AI呼び出しログ

### 専門機能テーブル
- `student_resources` - 学生リソース管理
- `customer_ltv_analysis` - 顧客LTV分析
- `sales_opportunities` - 営業機会
- `contracts` - 契約管理
- `mbti_team_analysis` - MBTIチーム分析

## 主要コンポーネント

### UI コンポーネント
- `KanbanBoard` - カンバンボード
- `CalendarView` - カレンダー表示
- `Dashboard` - メインダッシュボード
- `ProjectsTable` - プロジェクト一覧
- `TaskModal` - タスク編集モーダル

### 分析コンポーネント
- `AnalyticsDashboard` - 分析ダッシュボード
- `SalesAnalyticsDashboard` - 営業分析
- `SocialAnalyticsDashboard` - ソーシャル分析
- `RealTimeDashboard` - リアルタイム分析

### 専門コンポーネント
- `MBTITeamOptimizer` - MBTIチーム最適化
- `CustomerLTVAnalyzer` - 顧客LTV分析
- `SalesPredictionEngine` - 営業予測エンジン

## サービスクラス

### AI・機械学習
- `AISalesAssistant` - AI営業アシスタント
- `SalesConversionPredictor` - 営業コンバージョン予測
- `ProjectSuccessPredictor` - プロジェクト成功予測
- `SmartRecommendationEngine` - スマート推奨エンジン

### 分析・最適化
- `ConnectionAnalyzer` - 人脈分析
- `CustomerLTVAnalyzer` - 顧客LTV分析
- `MBTITeamOptimizer` - MBTIチーム最適化
- `StudentResourceManager` - 学生リソース管理

### 自動化・処理
- `TaskKnowledgeAutomator` - タスクナレッジ自動化
- `ContractAutomationEngine` - 契約自動化
- `AnomalyDetectionEngine` - 異常検知
- `SafeMenuProcessor` - 安全メニュー処理

---

**生成日時**: 2025-06-29  
**システムバージョン**: Phase 4 実装完了版  
**ドキュメント作成者**: Claude AI Assistant

このドキュメントは、システムの全機能を欠損なく走査し、API仕様書やMee6ドキュメントのような構造でカテゴライズしたものです。