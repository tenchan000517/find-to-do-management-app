# Discord → LINE 通知システム完全ガイド

## 📋 概要

Discord サーバーでの活動を自動監視し、重要なイベントをLINE通知として管理者に送信するリアルタイム通知システムです。

## 🏗️ システム構成

```
Discord Bot (Python)     →     Webhook     →     Next.js API     →     LINE Bot
    監視・検知                  HTTP POST           データ処理           管理者通知
```

### コンポーネント詳細

1. **Discord Bot** (`/mnt/c/zeroone_support/`)
   - Python製のDiscordボット
   - 4つのチャンネルを常時監視
   - イベント検知時にWebhook送信

2. **Webhook API** (`/mnt/c/find-to-do-management-app/`)
   - Next.js/TypeScript製
   - Discord通知データを受信・変換
   - LINE APIを通じて管理者に送信

3. **LINE Bot**
   - LINE公式アカウント
   - 管理者へのプッシュ通知機能

## 🎯 監視対象と通知条件

### 1. WELCOM チャンネル (ID: 1236341987272032316)
- **イベント**: 新規メンバーの参加
- **条件**: ボット以外のメッセージ
- **通知内容**: 新規参加者の情報
```json
{
  "type": "new_member",
  "notification_message": "🎉 新しいメンバーが WELCOM チャンネルに参加しました！"
}
```

### 2. 自己紹介チャンネル (ID: 1373946891334844416)
- **イベント**: 自己紹介投稿
- **条件**: ボット以外 + リプライ以外の新規投稿
- **通知内容**: 自己紹介投稿者の情報
```json
{
  "type": "introduction", 
  "notification_message": "📝 新しい自己紹介が投稿されました！"
}
```

### 3. 雑談チャンネル (ID: 1236344090086342798)
- **イベント**: 運営の応答遅延
- **条件**: ユーザー発言後、運営が1時間以上無応答
- **監視間隔**: 10分ごと
- **通知内容**: 運営不在アラート
```json
{
  "type": "staff_absence",
  "notification_message": "⚠️ 雑談チャンネルで運営の応答が1時間以上ありません"
}
```

### 4. 誰でも告知チャンネル (ID: 1330790111259922513)
- **イベント**: 新規告知投稿
- **条件**: ボット以外のメッセージ
- **通知内容**: 告知投稿者の情報
```json
{
  "type": "announcement",
  "notification_message": "📢 新しい告知が投稿されました！"
}
```

## 🔧 技術仕様

### Discord Bot側実装

**ファイル**: `/mnt/c/zeroone_support/cogs/channel_notifications.py`

#### 主要機能
- `on_message`: リアルタイムメッセージ監視
- `staff_absence_monitor`: 10分間隔の定期監視タスク
- `_send_notification`: LINE WebhookへのHTTP POST

#### 設定ファイル
**ファイル**: `/mnt/c/zeroone_support/config/config.py`
```python
CHANNEL_NOTIFICATIONS = {
    "enabled": True,
    "line_webhook_url": "https://find-to-do-management-app.vercel.app/api/webhook/discord-notifications",
    "monitored_channels": {
        "1236341987272032316": {...},  # WELCOM
        "1373946891334844416": {...},  # 自己紹介  
        "1236344090086342798": {...},  # 雑談
        "1330790111259922513": {...}   # 誰でも告知
    }
}
```

### LINE Bot側実装

**APIエンドポイント**: `/mnt/c/find-to-do-management-app/src/app/api/webhook/discord-notifications/route.ts`

#### 処理フロー
1. **受信**: Discord Botからの通知データ受信
2. **バリデーション**: 必須フィールド確認
3. **変換**: LINE用メッセージフォーマット作成
4. **送信**: 管理者LINEアカウントへ通知
5. **応答**: 成功/失敗ステータス返却

#### NotificationService使用
**ファイル**: `/mnt/c/find-to-do-management-app/src/lib/services/notification-service.ts`
```typescript
// LINE API直接呼び出し
async sendLineNotification(lineUserId: string, message: string): Promise<void> {
  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: 'text', text: message }]
    })
  });
}
```

## 📊 通知データ構造

### 基本フォーマット
```typescript
interface DiscordNotificationData {
  type: 'new_member' | 'introduction' | 'staff_absence' | 'announcement' | 'test';
  channel: string;
  user?: {
    name: string;
    id: string;
    avatar?: string;
  };
  message?: {
    content: string;
    timestamp: string;
    jump_url: string;
  };
  notification_message: string;
  absence_duration?: {
    hours: number;
    minutes: number;
    total_minutes: number;
  };
}
```

### LINE表示例

#### 新規参加通知
```
🎉 新しいメンバーが WELCOM チャンネルに参加しました！

👤 ユーザー: 新規ユーザー
📍 チャンネル: WELCOM  
💬 メッセージ: "はじめまして！よろしくお願いします！"
🔗 Discord: https://discord.com/channels/...

⏰ 2025-06-25 09:30
```

#### 運営不在アラート
```
⚠️ 雑談チャンネルで運営の応答が1時間以上ありません

📍 チャンネル: 雑談
⏱️ 不在時間: 1時間30分経過

対応をお願いします 🙏

⏰ 2025-06-25 10:45
```

## 🧪 テスト機能

### Discord管理コマンド

#### `/notifications_status`
- **権限**: 管理者限定
- **機能**: 通知システムの状態確認
- **表示内容**:
  - 基本設定（有効/無効、LINE連携状況）
  - 監視チャンネル一覧
  - 最新活動ログ

#### `/notifications_test`  
- **権限**: 管理者限定
- **機能**: LINE通知のテスト送信
- **動作**: テストデータを生成してLINE通知実行
- **確認項目**:
  - Webhook URLの接続性
  - LINE API認証
  - メッセージ送信成功

### テストデータ例
```json
{
  "type": "test",
  "channel": "テストチャンネル",
  "user": {
    "name": "管理者",
    "id": "987654321"
  },
  "message": {
    "content": "これはテスト通知です",
    "timestamp": "2025-06-25T12:00:00",
    "jump_url": "https://discord.com/channels/test"
  },
  "notification_message": "🧪 テスト通知が送信されました"
}
```

## ⚙️ 環境変数設定

### Discord Bot側
```bash
# .env
DISCORD_BOT_TOKEN=your_discord_bot_token
ADMIN_ID=discord_admin_user_id
```

### LINE Bot側
```bash
# .env.local
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret
ADMIN_LINE_USER_ID=line_admin_user_id
```

## 🚀 運用方法

### 1. 初期設定確認
```bash
# Discord Bot状態確認
/notifications_status

# LINE連携テスト
/notifications_test
```

### 2. 監視開始
- Discord Bot起動時に自動的に監視開始
- `staff_absence_monitor`タスクが10分間隔で実行

### 3. 通知受信
- LINE管理者アカウントにリアルタイム通知
- 必要に応じてDiscordサーバーで対応

### 4. 状態監視
```python
# ログ出力例
📢 [NOTIFICATIONS] メッセージ検知: ユーザー名 in チャンネル名 (運営: False)
🎉 [NOTIFICATIONS] 新規参入通知送信: ユーザー名
✅ LINE通知送信成功: introduction
```

## 🔍 トラブルシューティング

### よくある問題と解決法

#### 1. LINE通知が届かない
**原因候補**:
- `LINE_CHANNEL_ACCESS_TOKEN`未設定
- `ADMIN_LINE_USER_ID`間違い
- LINE API制限

**確認方法**:
```bash
/notifications_test  # テスト通知実行
```

**解決策**:
- 環境変数の再確認
- LINE Developer Console設定確認

#### 2. Discord監視が動作しない
**原因候補**:
- チャンネルID間違い
- Bot権限不足
- `CHANNEL_NOTIFICATIONS.enabled = False`

**確認方法**:
```bash
/notifications_status  # 監視状態確認
```

**解決策**:
- config.py設定見直し
- Bot権限の再設定

#### 3. 重複通知
**原因**: 運営不在監視の重複実行

**解決策**:
- Bot再起動
- 監視ロジックのリセット

### ログ分析

#### 成功例
```
✅ LINE通知送信成功: new_member
📢 [NOTIFICATIONS] 新規参入通知送信: UserName
```

#### エラー例
```
❌ LINE通知送信失敗(401): Unauthorized
⚠️ [NOTIFICATIONS] LINE Webhook URLが設定されていません
```

## 📈 拡張可能性

### 追加可能な機能
1. **新しい監視チャンネル**:
   - config.pyに追加
   - 対応する処理メソッド実装

2. **通知フィルタリング**:
   - キーワードベース条件
   - ユーザーロール条件

3. **通知先の多様化**:
   - グループLINE対応
   - Slack連携
   - メール通知

4. **アナリティクス機能**:
   - 通知頻度統計
   - 応答時間分析
   - ダッシュボード表示

## 🔒 セキュリティ考慮事項

### 1. 認証情報管理
- 環境変数での秘密情報管理
- Discord/LINE APIトークンの適切な保護

### 2. データ保護
- 個人情報の最小限化
- ログの機密情報マスキング

### 3. アクセス制御
- 管理コマンドの権限制限
- Webhook URLの秘匿性

## 📝 保守・メンテナンス

### 定期確認項目
1. **週次**:
   - 通知送信状況の確認
   - エラーログの確認

2. **月次**:
   - API制限状況の確認
   - パフォーマンス分析

3. **必要時**:
   - チャンネル設定の更新
   - 新機能の追加実装

---

**最終更新**: 2025-06-25  
**作成者**: Claude Code  
**システム**: Discord → LINE 通知連携システム  
**バージョン**: 2.0