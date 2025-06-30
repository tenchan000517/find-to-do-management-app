# Discord KPI Integration - 実装状況と継続タスク

## 🎯 プロジェクト概要
タスク管理アプリ（Next.js + Prisma + Neon DB）とDiscordボット（Python）を連携し、Discordサーバーの詳細KPIメトリクスを収集・可視化するシステムの実装。

## ✅ 完了事項

### 1. データベース接続確立
- **接続テスト完了**: `/mnt/c/zeroone_support/test_db_connection_fixed.py`
- **接続情報**: `.env`の`NEON_DATABASE_URL`に設定済み
- **依存関係**: `asyncpg`インストール済み

### 2. データベーススキーマ更新
- **usersテーブル**: `discordId`フィールド追加完了
- **discord_metricsテーブル**: 新要件に基づく構造で再構築完了

```prisma
model discord_metrics {
  id                    String   @id @default(cuid())
  date                  DateTime @db.Date @unique
  memberCount           Int      @map("member_count")
  onlineCount           Int      @map("online_count")
  dailyMessages         Int      @map("daily_messages")
  dailyUserMessages     Int      @default(0) @map("daily_user_messages")
  dailyStaffMessages    Int      @default(0) @map("daily_staff_messages")
  activeUsers           Int      @map("active_users")
  engagementScore       Float    @map("engagement_score")
  channelMessageStats   Json     @default("{}") @map("channel_message_stats")
  staffChannelStats     Json     @default("{}") @map("staff_channel_stats")
  roleCounts            Json     @default("{}") @map("role_counts")
  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")

  @@map("discord_metrics")
}
```

### 3. ユーザーマスター設定
全ユーザーのDiscord ID設定完了:
- 川島: `1281631920308097046`
- 弓木野: `1131429130823536702`
- 漆畑: `976427276340166696`
- 池本: `1143373602675232859`
- 飯田: `1232977995673894937`

### 4. Discord Bot実装（完全リニューアル）
`/mnt/c/zeroone_support/cogs/metrics_collector.py` 新要件対応完了

#### 新機能:
- **権限ベース収集**: 閲覧可能ロール（ID: 1236344630132473946）が見えるチャンネルのみ対象
- **運営・一般ユーザー分離**: 運営ロール（ID: 1236487195741913119）とその他を分けて集計
- **リアルタイムメッセージカウント**: `on_message`イベントで低負荷カウント（メモリ管理）
- **チャンネル別統計**: チャンネルごとのメッセージ数とユーザー数を記録
- **ロールメンバー数追跡**: 指定7ロールのメンバー数を自動カウント
  - 1332242428459221046: "FIND to DO"
  - 1381201663045668906: "イベント情報"
  - 1382167308180394145: "みんなの告知"
  - 1383347155548504175: "経営幹部"
  - 1383347231188586628: "学生"
  - 1383347303347257486: "フリーランス"
  - 1383347353141907476: "エンジョイ"

#### スラッシュコマンド:
- `/metrics` - KPI収集・保存（管理者限定）
- `/metrics_history [days]` - 履歴表示（最大30日）
- `/metrics_test` - DB接続テスト

#### 24時間自動収集:
- 毎日定時実行でKPI自動保存
- メッセージカウントの日次リセット

### 5. 不要機能の削除
- **AI使用回数**: 収集対象から除外
- **ポイント取引**: 収集対象から除外

## 🎯 現在の収集データ

### メイン指標
1. **member_count** - 総メンバー数
2. **online_count** - オンライン数
3. **daily_messages** - 日次総メッセージ数
4. **daily_user_messages** - 日次ユーザーメッセージ数（運営除く）
5. **daily_staff_messages** - 日次運営メッセージ数
6. **active_users** - アクティブユーザー数（運営除く）
7. **engagement_score** - エンゲージメントスコア（計算値）

### 詳細データ（JSON形式）
1. **channel_message_stats** - チャンネル別ユーザーメッセージ統計
2. **staff_channel_stats** - チャンネル別運営メッセージ統計
3. **role_counts** - 指定ロール別メンバー数

### 収集範囲
- **対象サーバー**: 最初のDiscordサーバー全体
- **対象チャンネル**: 閲覧可能ロール（ID: 1236344630132473946）が見えるチャンネルのみ
- **期間**: 当日データ（メッセージはリアルタイムカウント）

## 🚀 テスト実行手順

### 1. Discordボット起動
```bash
cd C:\zeroone_support
python main.py
```

### 2. KPI収集テスト
```
/metrics  # Discord上で実行
```

### 3. データ確認
```bash
cd /mnt/c/find-to-do-management-app
npx tsx scripts/check-discord-metrics.ts
```

## 📋 残タスク

### Phase 1: 動作確認（現在）
- [x] 新metrics_collector.pyの実装完了
- [x] データベーススキーマ更新完了
- [ ] 初回KPI収集テスト実行
- [ ] チャンネル権限フィルタリング動作確認
- [ ] 運営・一般ユーザー分離動作確認

### Phase 2: ダッシュボード実装
- [ ] `/src/app/api/discord/metrics/route.ts` - API作成
- [ ] `/src/app/dashboard/discord-insights.tsx` - UI実装
- [ ] 新データ構造対応のグラフ・チャート表示

### Phase 3: 高度な分析機能
- [ ] 期間別集計（週間・月間・年間）計算機能
- [ ] チャンネル別詳細分析
- [ ] ロール別アクティビティ分析
- [ ] 自動レポート生成

## 🔧 環境情報

### タスク管理アプリ
- **フォルダ**: `/mnt/c/find-to-do-management-app`
- **DB**: Neon PostgreSQL
- **フレームワーク**: Next.js 14 + Prisma

### Discordボット
- **フォルダ**: `C:\zeroone_support`
- **言語**: Python 3.10.9
- **主要ライブラリ**: discord.py, asyncpg

### EC2情報
- **tmuxセッション**: `dj-eyes`
- **状態**: 停止中（ローカルテスト優先）

## 🎯 技術的実装詳細

### メッセージカウント方式
- **低負荷設計**: on_messageイベントでメモリ上の辞書に蓄積
- **権限チェック**: チャンネル毎に閲覧可能ロールの権限を確認
- **運営分離**: 運営ロール保有者のメッセージを別カウント
- **日次リセット**: `/metrics`実行時に自動リセット

### データ保存方式
- **UPSERT処理**: 同日データは更新、新規日は挿入
- **JSON保存**: 複雑な統計データはJSON形式で保存
- **CUID生成**: 手動でCUID形式のIDを生成

### 集計期間の考え方
- **日次保存**: 毎日のデータを保存
- **期間集計**: 保存されたデータから週間・月間・年間を計算
- **リアルタイム性**: メッセージカウントはリアルタイム、その他は定期収集

## 💡 重要な注意事項

1. **ロールID**: 権限チェックに使用するロールIDは固定設定
2. **メモリ管理**: メッセージカウントは日次リセットで メモリ使用量を制御
3. **権限フィルタ**: 閲覧不可チャンネルのメッセージは完全除外
4. **データ整合性**: 運営メッセージも総メッセージ数に含まれる

## 🎯 次のアクション

1. **即座に**: 新実装でのKPI収集動作テスト
2. **テスト成功後**: ダッシュボードUI実装開始
3. **完了目標**: 詳細なDiscord KPI分析をタスクアプリで可視化

---
最終更新: 2025-06-14 17:30
作業者: 漆畑（Discord ID: 976427276340166696）
バージョン: v2.0 - 新要件対応版