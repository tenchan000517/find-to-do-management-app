# LINE Bot 公式ドキュメント準拠セットアップガイド 📚

## 🎯 概要
このガイドは、LINE公式ドキュメントに完全準拠したFIND to DO Bot の作成手順です。セキュリティとベストプラクティスを重視しています。

---

## 🚀 手順1: LINE公式アカウントの作成

### 1-1. LINEビジネスIDに登録
1. **LINEビジネスID登録**
   - https://business.line.me/ にアクセス
   - 「アカウント開設」をクリック
   - LINEアカウントまたはメールアドレスで登録

### 1-2. LINE公式アカウント作成
1. **作成フォーム入力**
   ```
   アカウント名: FIND to DO Bot
   業種: IT・インターネット
   企業・事業者名: あなたの企業名
   担当者名: あなたの名前
   メールアドレス: あなたのメールアドレス
   ```

2. **確認**
   - LINE Official Account Manager で作成を確認
   - https://manager.line.biz/ にアクセス

---

## 🔗 手順2: Messaging API連携

### 2-1. Messaging API有効化
1. **LINE Official Account Manager**
   - 作成したアカウントを選択
   - 「設定」→「Messaging API」
   - 「利用する」をクリック

2. **プロバイダー選択**
   ```
   プロバイダー名: FIND-to-DO
   （注意: 後から変更不可）
   ```

3. **開発者アカウント作成**
   - 名前とメールアドレスを入力
   - LINE Developersコンソールへのアクセス権を取得

### 2-2. 重要な設定
**LINE Official Account Manager**で以下を設定：

```bash
✅ あいさつメッセージ: オン
❌ 応答メッセージ: オフ（重要！）
✅ Webhook: オン（後で設定）
応答方法: Bot
チャット: オフ
```

⚠️ **重要**: 「応答メッセージ」を必ずオフにしてください。オンのままだと自動応答とBotの応答が重複します。

---

## 🔑 手順3: 認証情報の取得

### 3-1. チャネルシークレット
1. **LINE Developers コンソール**
   - https://developers.line.biz/ja/
   - 作成されたプロバイダーとチャネルを選択
   - 「チャネル基本設定」タブ
   - 「チャネルシークレット」をコピー

### 3-2. チャネルアクセストークン
1. **長期トークン発行**
   - 「Messaging API設定」タブ
   - 「チャネルアクセストークン（長期）」の「発行」
   - ⚠️ **注意**: 一度しか表示されません！必ず保存してください

### 3-3. 環境変数設定
```bash
# .env.local に保存
LINE_CHANNEL_SECRET=your_channel_secret_here
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token_here

# 本番環境用
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

---

## 🌐 手順4: Webhook URL設定

### 4-1. ngrok起動（開発環境）
```bash
# ターミナル1: Next.jsアプリ起動
npm run dev

# ターミナル2: ngrok起動
ngrok http 3000

# 表示されるHTTPS URLをコピー
# 例: https://abc123def.ngrok.io
```

### 4-2. Webhook URL設定
1. **LINE Developers コンソール**
   - 「Messaging API設定」タブ
   - 「Webhook URL」に入力:
   ```
   https://abc123def.ngrok.io/api/line/webhook
   ```

2. **疎通確認**
   - 「検証」ボタンをクリック
   - ✅ **成功** が表示されることを確認

3. **Webhook有効化**
   - 「Webhookの利用」をオンにする

---

## 🔒 手順5: セキュリティ確認

### 5-1. 署名検証の実装確認
作成したWebhook APIは以下のセキュリティ機能を実装済み：

```typescript
// 1. 署名検証（HMAC-SHA256）
static verifySignature(body: string, signature: string | null): boolean {
  // タイミング攻撃を防ぐcrypto.timingSafeEqualを使用
}

// 2. 本番環境では署名検証必須
if (process.env.NODE_ENV === 'production') {
  if (!LineService.verifySignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
}
```

### 5-2. エラー統計情報の有効化
1. **LINE Developers コンソール**
   - 「Messaging API設定」タブ
   - 「エラーの統計情報」をオンにする
   - エラー発生時の詳細な情報を取得可能

---

## 📱 手順6: テスト実行

### 6-1. 友だち追加
1. **QRコード取得**
   - LINE Official Account Manager: 「友だちを増やす」→「QRコード」
   - または LINE Developers: 「Messaging API設定」→「QRコード」

2. **友だち追加**
   - LINEアプリでQRコードをスキャン
   - 自動でウェルカムメッセージが送信される

### 6-2. 基本テスト
```
1. /help
→ コマンド一覧が表示される

2. こんにちは
→ 挨拶メッセージが返る

3. 明日14時に会議があります
→ スケジュール認識メッセージが返る

4. 企画書を作成する
→ タスク認識メッセージが返る
```

### 6-3. デバッグページ確認
```
http://localhost:3000/line-debug
```
- Webhookのログを確認
- エラー状況を監視
- Bot設定状況をチェック

---

## 🚀 手順7: 本番デプロイ

### 7-1. Vercelデプロイ
```bash
# Vercel CLIインストール
npm i -g vercel

# デプロイ実行
vercel

# 環境変数設定
vercel env add LINE_CHANNEL_SECRET
vercel env add LINE_CHANNEL_ACCESS_TOKEN
vercel env add NODE_ENV production

# 再デプロイ
vercel --prod
```

### 7-2. 本番Webhook URL更新
1. **Vercel URLを取得**
   ```
   例: https://find-to-do-bot.vercel.app
   ```

2. **LINE Developers で更新**
   ```
   Webhook URL: https://find-to-do-bot.vercel.app/api/line/webhook
   ```

3. **検証実行**
   - 「検証」ボタンで成功を確認
   - 本番環境での署名検証が有効になる

---

## 🔧 セキュリティベストプラクティス

### 🛡️ 必須のセキュリティ対策

1. **署名検証は必須**
   ```typescript
   // ❌ 危険: 署名検証をスキップ
   // if (signature) { ... }
   
   // ✅ 安全: 本番では必須
   if (process.env.NODE_ENV === 'production') {
     if (!verifySignature(body, signature)) {
       return error401();
     }
   }
   ```

2. **環境変数の適切な管理**
   ```bash
   # ❌ 危険: ハードコーディング
   const secret = "your_secret_here";
   
   # ✅ 安全: 環境変数使用
   const secret = process.env.LINE_CHANNEL_SECRET;
   ```

3. **HTTPS必須**
   - 開発環境: ngrok（自動でHTTPS）
   - 本番環境: Vercel（自動でHTTPS）
   - 自己署名証明書は使用不可

### 🔍 監視とログ

1. **エラー監視**
   ```typescript
   // ログレベルの適切な設定
   console.error('Critical error:', error);
   console.warn('Warning:', warning);
   console.log('Info:', info);
   ```

2. **統計情報の活用**
   - エラー発生率の監視
   - レスポンス時間の確認
   - メッセージ送信数の追跡

---

## 📊 料金管理

### 💰 メッセージ数の管理

1. **料金プラン理解**
   ```
   コミュニケーションプラン: 200通/月（無料）
   ライトプラン: 5,000通/月（月額5,000円）
   スタンダードプラン: 30,000通/月（月額15,000円）
   ```

2. **カウント対象**
   - ✅ プッシュメッセージ（カウント対象）
   - ❌ 応答メッセージ（カウント対象外）

3. **使用量確認API**
   ```typescript
   // 月間使用量を確認
   GET https://api.line.me/v2/bot/message/quota/consumption
   ```

---

## 🚨 トラブルシューティング

### ❌ よくあるエラーと解決方法

1. **Webhook検証エラー**
   ```
   原因: 
   - ngrokが停止している
   - URLが間違っている
   - アプリが起動していない
   
   解決:
   - ngrok http 3000 を再実行
   - URLを確認してコピペし直す
   - npm run dev でアプリを再起動
   ```

2. **メッセージに応答しない**
   ```
   原因:
   - 「応答メッセージ」がオンになっている
   - 署名検証エラー
   - 環境変数が未設定
   
   解決:
   - LINE Official Account Manager で「応答メッセージ」をオフ
   - .env.local の内容を確認
   - サーバーを再起動
   ```

3. **署名検証エラー**
   ```
   原因:
   - チャネルシークレットが間違っている
   - 文字エンコーディングの問題
   - タイムスタンプずれ
   
   解決:
   - LINE Developers でシークレットを再確認
   - UTF-8エンコーディングを確認
   - サーバー時刻を確認
   ```

### 🔍 デバッグ方法

1. **ログ確認**
   ```bash
   # 開発環境
   npm run dev
   # コンソールでログを確認
   
   # 本番環境
   vercel logs
   ```

2. **デバッグページ活用**
   ```
   http://localhost:3000/line-debug
   - リアルタイムログ監視
   - Webhook テスト実行
   - Bot設定状況確認
   ```

---

## 🎉 完了チェックリスト

### ✅ セットアップ完了確認

- [ ] LINE公式アカウント作成完了
- [ ] Messaging API有効化完了
- [ ] 「応答メッセージ」がオフに設定済み
- [ ] チャネルシークレット取得済み
- [ ] チャネルアクセストークン取得済み
- [ ] 環境変数設定完了
- [ ] Webhook URL設定完了
- [ ] Webhook検証成功
- [ ] 友だち追加テスト完了
- [ ] メッセージ送受信テスト完了
- [ ] 署名検証動作確認済み
- [ ] エラー統計情報有効化済み
- [ ] 本番デプロイ完了（該当する場合）

### 🚀 次のステップ

✅ **基本機能拡張**
- リッチメニューの設定
- Flex Message の実装
- 画像・動画メッセージ対応

✅ **AI機能強化**
- より高度な自然言語処理
- 文脈を考慮した応答
- 学習機能の実装

✅ **データベース統合**
- ユーザー情報の永続化
- メッセージ履歴の保存
- 統計データの蓄積

---

これでLINE Botの基本的なセットアップは完了です！🎉
何か問題が発生した場合は、デバッグページとログを確認してトラブルシューティングを行ってください。