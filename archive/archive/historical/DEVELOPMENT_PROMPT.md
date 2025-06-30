# 【統合開発プロンプト】プロジェクト中心型AIアシスタント付きタスク管理システム

**最終更新**: 2025-06-16
**現在Phase**: Phase 1-8 + 全追加機能完了 + TypeScript型エラー修正完了

---

## 🚀 このドキュメントについて

**このドキュメント1つで開発のすべてが始まります。**

新しいClaude Codeセッションを開始したら、まずこのドキュメントを読んでください。
現在の進捗、開発手法、実装計画、すべての情報がここから参照できます。

**進捗詳細は [PROJECT_PROGRESS_REPORT.md](./PROJECT_PROGRESS_REPORT.md) を参照してください。**

---

## 📚 ドキュメント分類と参照ガイド

### 【A】参照必須ドキュメント（現在も活用）

#### 開発を始める前に必ず読む
1. **[開発手法論](./docs/CLAUDE_CODE_DEVELOPMENT_METHODOLOGY.md)** - Claude Code特有の制約と効率的な開発方法
2. **[開発プロセスガイド](./docs/DEVELOPMENT_PROCESS_GUIDE.md)** - 日次の開発フローと手順
3. **[プロジェクト進捗報告書](./documentation/active/current/PROJECT_PROGRESS_REPORT.md)** - 現在の完成状況・システム規模 【毎日更新】

#### トラブルシューティング・ナレッジ
4. **[データベース操作ナレッジ](./docs/DATABASE_OPERATIONS_KNOWLEDGE.md)** - よくある問題と解決策 ⚠️重要
5. **[トラブルシューティング集約](./documentation/active/troubleshooting/)** - 継続的問題解決ナレッジ

#### 次期開発向け設計書
6. **[統合実装計画](./docs/INTEGRATED_IMPLEMENTATION_PLAN.md)** - Phase 9-10の詳細設計
7. **[カレンダー機能マスター設計書](./docs/CALENDAR_FEATURE_MASTER_DESIGN.md)** - Phase 4実装用

### 【B】完了済みドキュメント（参照のみ）

#### Phase別実装ガイド（完了済み）
- **[Phase 1-6実装ガイド](./docs/)** - 各Phaseの詳細仕様 ✅完了
- **[実装インデックス](./docs/MASTER_IMPLEMENTATION_INDEX.md)** - 全体アーキテクチャマップ ✅完了

#### 実装完了報告
- **[カレンダー緊急修正完了報告](./documentation/completed/calendar/CALENDAR_URGENT_FIXES_PROMPT.md)** - 2025-06-15完了 ✅
- **[個人予定管理システム仕様](./documentation/completed/personal-schedules/PERSONAL_SCHEDULES_SYSTEM_SPECIFICATION.md)** - 実装完了 ✅
- **[TypeScript型エラー修正報告](./documentation/completed/implementation/PHASE9-10_TYPESCRIPT_FIX_REPORT.md)** - 2025-06-16修正事例 ✅

### 【C】アーカイブ（歴史的記録）

#### 初期開発ドキュメント
- **[要件定義書](./documentation/archive/initial/)** - 要件定義書.md、REQUIREMENTS_V2.md
- **[システム理論書](./documentation/archive/initial/)** - タスク管理・アポ管理・ナレッジ管理理論書

#### 過去の進捗報告
- **[進捗報告書V1-V2](./documentation/archive/progress-reports/)** - PROGRESS_REPORT_V1.md、V2.md
- **[タスク管理改善計画](./documentation/archive/progress-reports/)** - TASK_MANAGEMENT_*.md

#### 過去の実装プロンプト
- **[初期プロンプト](./documentation/archive/old-prompts/)** - NEXT_ENGINEER_PROMPT.md（初期）
- **[UI改善計画](./documentation/archive/old-prompts/)** - UI_IMPROVEMENT_PLAN.md、PROPOSED_CHANGES.md
- **[Phase最適化プロンプト](./documentation/archive/old-prompts/)** - PHASE9-10_OPTIMIZATION_*.md

---

## 🎯 現在の開発状況と次のステップ

### 📊 最新のシステム状態（2025-06-16更新）

**✅ 完成済み機能:**
- Phase 1-8: 全機能実装完了
- LINEボット: 分類確認システム・セッション管理完備
- カレンダー: Phase 1-3完了、緊急修正完了
- 個人予定管理: DB・API・LINE統合完了
- ナレッジ管理: DB連携・UI最新化完了
- TypeScript: 型エラー0件達成 【NEW】

**🚀 次の実装候補:**
1. **カレンダーPhase 4** - 繰り返し予定機能
2. **Phase 9-10** - システム統合・最適化
3. **既存機能改善** - パフォーマンス・UX向上

---

## ⚠️ 絶対厳守事項（システム破壊防止）

### **禁止行為（絶対にやってはいけないこと）**

❌ **既存テーブルの削除・列削除**
```sql
-- 絶対禁止
DROP TABLE tasks;
ALTER TABLE users DROP COLUMN email;
```

❌ **既存APIエンドポイントの破壊的変更**
```typescript
// 絶対禁止 - 既存レスポンス形式の変更
export async function GET() {
  return { different_format: "breaks_existing_ui" };
}
```

❌ **既存UIコンポーネントの削除**
```typescript
// 絶対禁止 - 既存コンポーネント削除
// KanbanBoard.tsx を削除する等
```

❌ **データベース接続の変更**
```typescript
// 禁止 - 既存のPrisma設定変更
```

### **安全な実装パターン（必ず従うこと）**

✅ **新規テーブル・列の追加のみ**
```sql
-- 安全
ALTER TABLE users ADD COLUMN skills JSON DEFAULT '{}';
CREATE TABLE new_feature_table (...);
```

✅ **新規APIエンドポイントの追加**
```typescript
// 安全 - 新しいエンドポイント
// /api/ai/evaluate/route.ts (新規)
```

✅ **既存UIの拡張・新規コンポーネント追加**
```typescript
// 安全 - 新機能コンポーネント
export default function NewFeatureComponent() { }
```

---

## 📊 現在のシステム完全把握（重複実装防止）

### **✅ 既に実装済み - 実装不要**

#### **データベース（PostgreSQL + Prisma）**
- **20テーブル完備**: appointments, calendar_events, connections, knowledge_items, line_integration_logs, projects, task_archives, task_collaborators, tasks, users, discord_metrics, project_relationships, ai_evaluations, project_alerts, user_alerts, project_phase_history, ai_call_logs, appointment_details, recurring_rules, personal_schedules
- **完全な関係性**: User ↔ Task (owner + collaborators), Project ↔ Task, AI評価・アラート・関係性
- **6名ユーザー**: 川島、弓木野、漆畑、池本、飯田（LINE ID・Discord ID・詳細プロファイル完備）+ 182件のリアルデータ

#### **API（Next.js App Router）**
- **34API完備**: `/api/tasks`, `/api/projects`, `/api/users`, `/api/calendar`, `/api/connections`, `/api/appointments`, `/api/knowledge`, `/api/schedules`
- **AI評価**: `/api/ai/evaluate`, `/api/ai/batch-evaluate` - 高精度リソース・成功確率・ISSUE度評価
- **統合分析**: `/api/projects/[id]/analytics`, `/api/projects/[id]/relationships` - プロジェクト関係性分析
- **アラートシステム**: `/api/alerts`, `/api/alerts/scheduler` - 自動監視・通知配信
- **高度自動化**: `/api/projects/promotion-candidates`, `/api/projects/[id]/kgi` - プロジェクト昇華・KGI自動生成
- **プロファイル管理**: `/api/users/[id]/profile`, `/api/projects/[id]/leadership-history` - ユーザー・リーダーシップ管理
- **LINE Bot統合**: `/api/webhook/line` - Gemini AI + 高度自然言語処理完備
- **Discord分析**: `/api/discord/metrics`
- **ナレッジ管理**: `/api/knowledge`, `/api/knowledge/[id]/like` - 知識共有・いいね機能

#### **UI（Next.js + Tailwind）**
- **6種類Kanban**: ステータス別、ユーザー別、プロジェクト別、期限別、アポ処理状況、関係性別
- **多様表示**: テーブル、カード、ガントチャート、カレンダー、ナレッジ管理
- **高度UI機能**: UserProfileModal（3タブ構成）、ProjectLeadershipTab（権限管理）、NotificationCenter（統合アラート）、ProjectDetailModal（分析統合）、AppointmentKanbanBoard、ナレッジ管理システム
- **日本語対応**: PDCAワークフロー完備
- **レスポンシブ**: モバイル対応完備

#### **LINE Bot機能**
- **自然言語処理**: Gemini AI + regex fallback
- **5タイプ抽出**: schedule, task, project, contact, memo
- **グループチャット**: メンション検知完備
- **通知システム**: リマインド・プッシュ機能
- **分類確認システム**: SessionManager・FlexメッセージUI・誤分類防止

### **✅ 全機能実装完了**

**Phase 1-8の全機能が実装済みです:**
- **アラートシステム** - リアルタイム進捗・活動・フェーズ監視 ✅
- **通知エンジン** - 自動アラート生成・配信 ✅
- **高度UI機能** - プロファイル設定、リーダー移行、昇華候補管理 ✅
- **ダッシュボード強化** - 統合分析可視化 ✅
- **自動化機能** - プロジェクト昇華、フェーズ遷移判定 ✅
- **プロジェクト昇華システム** - 4種類の検出アルゴリズム完備 ✅
- **KGI自動設定** - 5つのビジネス結果タイプ対応 ✅
- **LINE連携強化** - 高度自然言語処理・意図認識 ✅
- **アポ管理システム** - 4種類カンバン・AI評価・LINE連携 ✅
- **個人予定管理システム** - DB基盤・API・LINE統合・統合表示 ✅
- **ナレッジ管理システム** - DB連携・UI最新化・アコーディオン・リンク検知 ✅

---

## 🚀 実装手順（段階的・安全優先）

### **実装開始: Phase 9-10実装**

**⚠️ 重要: Phase 1-8は完了済み。Phase 9-10を実装してください**

#### **✅ Phase 1-8: 完了済み**

**Phase 1完了内容:**
- ユーザープロファイル管理基盤
- AI評価のためのデータ構造拡張
- アラートシステム基盤
- 新規テーブル5個追加、既存3テーブル拡張

**Phase 2完了内容:**
- AIエンジン実装: リソースウェイト、成功確率、ISSUE度評価
- AI評価API: /api/ai/evaluate, /api/ai/batch-evaluate
- 高精度アルゴリズム: 複合要因分析エンジン

**Phase 3完了内容:**
- RelationshipService: エンティティ自動プロジェクト紐づけ
- 統合分析API: /api/projects/[id]/analytics
- 関係性管理API: /api/projects/[id]/relationships

**Phase 4完了内容:**
- AlertEngine: プロジェクト・ユーザーアラート自動検出
- NotificationService: LINE通知配信・リマインド機能
- アラート管理API: /api/alerts, /api/alerts/[id], /api/alerts/scheduler
- AlertScheduler: 定期実行ジョブ（4h/1h/30m間隔）
- アラート5種類実装: activity/progress/phase_stagnation, workload_risk, low_priority_overload

**Phase 5完了内容:** 【2025-06-15 完了】
- UserProfileModal: 3タブ構成プロファイル設定（スキル・志向性・作業スタイル）
- ProjectLeadershipTab: リーダー移行・権限管理・履歴追跡システム
- NotificationCenter: 統合アラート管理・フィルタリング・操作UI
- ProjectDetailModal: プロジェクト詳細・分析・リーダーシップ統合画面
- useUserProfile: プロファイル管理・AI再評価フック
- Header統合: 通知センター・未読バッジ表示
- Projects統合: 詳細表示・リーダー管理機能
- API追加: /api/projects/[id]/leadership-history
- TypeScript完全対応: エラー0件、型安全実装完了 ✅ **2025-06-16 型エラー完全解決**

### **✅ Phase 6: 高度自動化実装 【完了済み】**

**Phase 6完了内容:** 【2025-06-15 完了】
- **ProjectPromotionEngine**: 4種類の検出アルゴリズム
- **昇華候補API**: `/api/projects/promotion-candidates`
- **KGIGenerator**: 5つのビジネス結果タイプ自動生成
- **KGI自動設定API**: `/api/projects/[id]/kgi`
- **データ基盤**: 182件のリアルデータ導入完了

### **✅ Phase 7-8: AI基盤・アポ管理 【完了済み】**

**Phase 7完了内容:**
- **AI Call Manager**: レート制限・キャッシング・ログ機能
- **ai_call_logsテーブル**: AI使用量完全追跡
- **50%以上のAPI呼び出し削減**: キャッシュ効果

**Phase 8完了内容:**
- **4種類カンバンUI**: 処理状況・関係性・営業フェーズ・流入経路
- **アポ管理API群**: 5エンドポイント追加
- **AppointmentEvaluator**: AI評価エンジン

### **LINEボット分類確認システム完全実装**

**🎉 Phase 1-8 + LINEボット分類確認システムの全実装が完了しました！**

**LINEボット分類確認システム完了内容:** 【2025-06-15 完了】
- **SessionManager**: インメモリセッション状態管理（30分タイムアウト）
- **分類確認UI**: AI分析後の毎回確認ボタンでヒューマンエラー完全防止
- **詳細入力フロー**: セッション管理付きボタン選択式項目入力
- **@メンション不要モード**: セッション中は通常メッセージで反応
- **Flexメッセージ**: リッチUI（分類確認/項目選択/進捗表示）
- **Postbackハンドラー**: 15種類のボタンアクション処理
- **途中保存機能**: 柔軟な入力継続・完了・キャンセル

**実装ファイル:**
- `src/lib/line/session-manager.ts` - セッション状態管理（新規）
- `src/app/api/webhook/line/route.ts` - ボタン処理・セッション処理拡張
- `src/lib/line/notification.ts` - FlexメッセージUI機能追加

**LINEボットシステムの効果:**
- **誤分類防止**: AI分析後の100%確認フロー
- **自然な会話**: セッション中は@メンション不要
- **効率的入力**: 必要項目のみボタンで選択
- **継続性**: 途中保存→後から追加可能

### **個人予定管理システム完全実装**

**個人予定管理システム完了内容:** 【2025-06-15 完了】
- **DB基盤**: personal_schedulesテーブル追加（19フィールド）
- **API実装**: /api/schedules CRUD + /api/calendar/unified統合API（4エンドポイント追加）
- **LINE統合**: 「📅予定」→個人予定、「🎯イベント」→パブリック分類完全対応
- **統合表示**: 個人予定+パブリックイベント一元管理システム

### **ナレッジ管理システム完全実装**

**ナレッジ管理システム完了内容:** 【NEW 2025-06-15 完了】
- **データベース連携**: モックデータ→実DB接続完全移行
- **リンク検知機能**: URL自動検知・ソースボタン表示（最大2個表示）
- **アコーディオンカード**: 2行以上で自動スライス・展開機能
- **ヘッダー最適化**: 戻るボタン・タイトル削除、統計情報をヘッダー行に移動
- **いいね機能**: API連携完全動作（/api/knowledge/[id]/like）
- **新規投稿**: モーダル作成機能・バリデーション・タグ管理
- **レスポンシブ**: 完全モバイル対応・Tailwind CSS最新スタイリング

### **システム動作確認コマンド**
```bash
# 全システム機能確認
# 1. ビルドエラーなし確認
npm run build

# 2. TypeScriptエラーなし確認
npx tsc --noEmit

# 3. AI Call Manager動作確認
curl "http://localhost:3000/api/admin/ai-usage"
curl -X POST "http://localhost:3000/api/admin/ai-usage" -H "Content-Type: application/json" -d '{"action":"clear_cache"}'

# 4. アラートシステム動作確認
curl -X POST "http://localhost:3000/api/alerts" -H "Content-Type: application/json" -d '{"action":"check_all"}'
curl "http://localhost:3000/api/alerts?type=all"

# 5. プロジェクト昇華システム確認
curl "http://localhost:3000/api/projects/promotion-candidates"

# 6. KGI自動生成確認
curl "http://localhost:3000/api/projects/[PROJECT_ID]/kgi"

# 7. データベース統計確認（AI Call Logs含む）
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); Promise.all([p.users.count(), p.projects.count(), p.tasks.count(), p.ai_call_logs.count()]).then(r => console.log('統計:', {users: r[0], projects: r[1], tasks: r[2], ai_calls: r[3]})).finally(() => p.\$disconnect())"
```

---

## 🛡️ 緊急時対応（問題発生時）

### **システム障害時の復旧手順**

#### **データベース復旧:**
```bash
# 1. 障害確認
psql $DATABASE_URL -c "SELECT version();"

# 2. バックアップから復旧
psql $DATABASE_URL < backup_YYYYMMDD.sql

# 3. マイグレーション再適用
npx prisma migrate deploy
```

#### **アプリケーション復旧:**
```bash
# 1. 安全なコミットに戻す
git log --oneline -10
git reset --hard <safe_commit_hash>

# 2. 依存関係再インストール
rm -rf node_modules package-lock.json
npm install

# 3. 再ビルド
npm run build
```

#### **TypeScriptエラー解決:**
```bash
# よくあるエラーパターンと解決法

# 1. implicit 'any' エラー
# エラー: Parameter 'item' implicitly has an 'any' type
# 解決: 明示的な型注釈を追加
array.filter((item: { status: string }) => item.status === "active")

# 2. 不要なawait警告
# エラー: 'await' has no effect on the type of this expression
# 解決: 同期プロパティからawaitを削除
const response = result.response; // await削除

# 3. Prisma型エラー
# 解決: Prisma生成とスキーマ同期
npx prisma generate
npx prisma db push
```

#### **緊急連絡先・エスカレーション:**
```
Level 1: データ破損の疑い → 即座に作業停止、バックアップ復旧
Level 2: 既存機能停止 → git reset、システム再起動
Level 3: 新機能のみ問題 → 該当コード無効化、後日修正
Level 4: TypeScriptエラー → 上記パターン適用、npx tsc --noEmit確認
```

---

## ✅ 各Phase完了時の報告テンプレート

```markdown
## Phase X実装完了報告

### 実装内容
- [ ] データベース変更: [具体的変更内容]
- [ ] API追加: [新規エンドポイント]
- [ ] UI実装: [新規コンポーネント]

### 検証結果
- [ ] 既存機能正常動作確認
- [ ] 新機能動作確認
- [ ] パフォーマンステスト実施
- [ ] データ整合性確認

### 問題・懸念事項
- [なし / または具体的な問題]

### 次Phase準備状況
- [準備完了 / 要確認事項]
```

---

## 📝 実装中の注意事項

### **コーディング規約**
- **TypeScript必須** - any型使用禁止
- **Prisma型使用** - 生SQLは最小限
- **エラーハンドリング必須** - try-catch + ログ出力
- **レスポンシブ対応** - Tailwind CSS使用

### **セキュリティ考慮事項**
- **入力値検証** - 全API入力値チェック
- **SQLインジェクション防止** - Prisma ORM使用
- **XSS防止** - Next.js標準機能活用
- **認証情報保護** - 環境変数使用

### **パフォーマンス要件**
- **API応答時間** - 2秒以内
- **データベースクエリ最適化** - N+1問題回避
- **フロントエンド最適化** - 適切なメモ化

---

## 🎯 成功の定義

あなたの実装が成功したと言える条件：

1. **既存機能無影響** - 全ての既存ページが従来通り動作
2. **新機能正常動作** - 実装した新機能が設計通り動作
3. **データ整合性維持** - 既存データが保持され、新データと整合
4. **パフォーマンス維持** - システムレスポンスが劣化しない
5. **エラー発生なし** - 実装により新たなエラーが発生しない

**最重要**: 「動く新機能」より「壊れない既存機能」を優先してください。

---

## 🎉 プロジェクト中心型AIアシスタント完成

### **システム完成状態**
```bash
# システム状態確認
git log --oneline -3  # Phase 8完了確認

# システム稼働確認（必要時のみ）
npm run dev  # 開発サーバー起動

# API機能テスト（必要時のみ）
curl "http://localhost:3000/api/appointments/kanban/processing"
curl "http://localhost:3000/api/projects/promotion-candidates"
curl "http://localhost:3000/api/admin/ai-usage"
```

### **実装完了機能**
- **Phase 1-8**: 全機能完成
- **LINEボット分類確認システム**: セッション管理・ボタンUI・誤分類防止
- **アポ管理システム**: 4種類カンバン・AI評価・LINE連携
- **AI呼び出し基盤**: Call Manager・レート制限・キャッシング
- **プロジェクト昇華システム**: 4種類検出アルゴリズム
- **KGI自動設定**: 5つのビジネス結果タイプ
- **LINE連携強化**: 高度自然言語処理
- **営業管理完全統合**: アポ→コネクション自動連携
- **個人予定管理システム**: DB基盤・API・LINE統合・統合表示
- **ナレッジ管理システム**: DB連携・UI最新化・アコーディオン・リンク検知

## ✅ **主要機能実装完了状況**

### **LINEボット機能 【完全実装済み】**
- ✅ データベース保存処理完全動作
- ✅ ユーザーマッピング機能（LINE ID → System ID）
- ✅ ハイブリッド日時解析（パターン + AI）
- ✅ 分類確認システム（セッション管理・FlexメッセージUI）
- ✅ エラーハンドリング・フォールバック処理

### **カレンダー機能 【Phase 1-3完了】**
- ✅ 基本UI・データ統合・色分けタブ実装
- ✅ 緊急修正完了（型安全性・UI統一）
- 📋 Phase 4（繰り返し予定）未実装

### **個人予定・ナレッジ管理 【完全実装済み】**
- ✅ 個人予定: DB・API・LINE統合完了
- ✅ ナレッジ: DB連携・リンク検知・アコーディオン実装

---

## 🔄 セッション開始手順

新しいClaude Codeセッションを開始したら、以下の手順で作業を始めてください：

### 1. 環境確認
```bash
# 作業ディレクトリ確認
pwd  # /mnt/c/find-to-do-management-app であること

# Git状況確認
git status
git log --oneline -5

# ビルド状態確認
npm run build
npx tsc --noEmit
```

### 2. データベース状況確認
```bash
# データ件数確認
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); Promise.all([p.users.count(), p.projects.count(), p.tasks.count(), p.connections.count(), p.appointments.count(), p.knowledge_items.count()]).then(r => console.log('DB統計:', r)).finally(() => p.$disconnect())"
```

### 3. 現在のPhase確認
- **Phase 1-8**: ✅ 完了済み
- **Phase 9**: 📋 システム統合・最適化（次の実装対象）
- **Phase 10**: 📋 統合・最適化（計画済み）

### 4. 作業開始
```bash
# 開発サーバー起動
npm run dev

# 別ターミナルでTypeScriptウォッチ
npx tsc --noEmit --watch
```

---

## 🎯 次の開発タスク候補

### 1. **カレンダー機能Phase 4（繰り返し予定）**
```bash
# 設計確認
cat docs/CALENDAR_FEATURE_MASTER_DESIGN.md  # Phase 4セクション

# 実装内容:
# - RecurringFormコンポーネント作成
# - 4種類の繰り返しパターン対応
# - 除外日処理機能
# - recurring_rules テーブル活用
```

### 2. **Phase 9-10（システム統合・最適化）**
```bash
# 実装計画確認
cat docs/INTEGRATED_IMPLEMENTATION_PLAN.md

# 実装内容:
# - システム全体の統合・最適化
# - パフォーマンス改善
# - セキュリティ強化
# - コード品質向上
```

### 3. **既存システム改善**
```bash
# 改善候補確認
npm run build  # ビルド最適化
npm run lint   # コード品質

# 改善対象:
# - レスポンス速度向上
# - UI/UX改善
# - エラーハンドリング強化
```

---

## 💡 開発のコツ

### 効率的な開発のために
1. **TodoWriteを積極的に活用** - タスクを細かく分割して管理
2. **並行ツール実行** - 複数のRead/Bashを同時実行
3. **頻繁なコミット** - Phase完了時には必ずコミット
4. **TypeScriptエラー0維持** - 常時 `npx tsc --noEmit --watch`

### よくある質問
- **Q: 既存機能が動かなくなった**
  - A: `git reset --hard` で安全なコミットに戻す
  
- **Q: AI API制限に引っかかった**
  - A: Phase 7のキャッシング実装を優先
  
- **Q: どこから始めればいい？**
  - A: このドキュメントの「セッション開始手順」から

- **Q: Prisma型エラーが頻発する**
  - A: **[DATABASE_OPERATIONS_KNOWLEDGE.md](./docs/DATABASE_OPERATIONS_KNOWLEDGE.md)**を必ず参照
  - Next.js 15のasync paramsパターンや暗黙的any型の解決方法を記載
  - **[PHASE9-10_TYPESCRIPT_FIX_REPORT.md](./documentation/completed/implementation/PHASE9-10_TYPESCRIPT_FIX_REPORT.md)** - 最新の修正事例（2025-06-16）

---

## 📞 エスカレーション

問題が発生した場合の対応：

1. **データ破損の疑い** → 即座に作業停止、バックアップ確認
2. **既存機能の停止** → git resetで復旧
3. **不明な点** → 関連ドキュメントを確認

---

## 📊 Gitコミット履歴（最新20件）

```
820569c TypeScript型エラー修正: APIルートの暗黙的any型を解決
25fba19 プロンプト分割完了: 開発効率性向上・情報整理・欠損なし分割実装
354d25b ナレッジシステム完全アップデート: データベース連携・UI最新化・モバイル対応完了
f99e504 個人予定管理システム完全実装: Phase 1-3完了
ad8d9df LINEボット重要バグ修正: AI抽出データの保存失敗問題を解決
（以下、git log --oneline -20で確認可能）
```

---

**このプロンプト1つから、すべての開発が始まります。**

- 情報の欠損・欠落なし：全ナレッジ・エラー解決法を保持
- 効率的な参照：A/B/C分類で必要な文書を即座に特定
- 最新状態の反映：Git履歴・進捗報告書で現在位置を把握