# LINE Bot セットアップ手順

## 1. LINE Official Account作成

### Step 1: LINE Business Accountを作成
1. [LINE Business](https://www.linebiz.com/jp/entry/) にアクセス
2. 「LINE公式アカウントを作る」をクリック
3. 必要情報を入力（会社名: FIND to DO、業種: ソフトウェア・アプリケーション）
4. SMS認証を完了

### Step 2: LINE Official Account Manager設定
1. [LINE Official Account Manager](https://manager.line.biz/) にログイン
2. 新しいアカウントを作成:
   - アカウント名: `FIND to DO Bot`
   - アカウント種別: 一般アカウント
   - 業種: ソフトウェア・アプリケーション

### Step 3: 重要な設定変更
**⚠️ 必須設定**:
- **グループ参加**: `許可` に変更
- **応答設定** → **Webhook**: `有効`
- **応答設定** → **応答メッセージ**: `無効`（重要！）
- **応答設定** → **あいさつメッセージ**: `有効`

## 2. LINE Developers Console設定

### Step 1: LINE Developers Consoleにアクセス
1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. 先ほど作成したLINE Official Accountと連携

### Step 2: Messaging API Channel作成
1. `Providers` → 新しいProviderを作成: `FIND to DO`
2. `Messaging API Channel` を作成:
   - Channel名: `FIND to DO Bot`
   - Channel説明: `LINE連携プロジェクト管理ボット`

### Step 3: 重要な情報を取得
以下の情報をメモしてください:

```bash
# .env.localファイルに設定
LINE_CHANNEL_SECRET=ここにChannel Secretを入力
LINE_CHANNEL_ACCESS_TOKEN=ここにChannel Access Tokenを入力
OPENAI_API_KEY=ここにOpenAI APIキーを入力（任意）
```

### Step 4: Webhook URL設定
1. `Messaging API設定` タブ
2. `Webhook URL` に設定:
   ```
   https://your-domain.vercel.app/api/webhook/line
   ```
3. `Webhook URL`を検証
4. `Webhookの利用` を `有効`

## 3. 開発環境でのテスト

### Step 1: 依存関係インストール
```bash
npm install @line/bot-sdk openai
```

### Step 2: 環境変数設定
`.env.local`ファイルを作成:
```bash
LINE_CHANNEL_SECRET=your_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token
OPENAI_API_KEY=your_openai_api_key  # 任意
```

### Step 3: 開発サーバー起動
```bash
npm run dev
```

### Step 4: ngrok設定（ローカルテスト用）
```bash
# ngrokをインストール
npm install -g ngrok

# トンネル作成
ngrok http 3000

# 表示されるHTTPS URLをWebhook URLに設定
# 例: https://abc123.ngrok.io/api/webhook/line
```

## 4. ボットをLINEグループに招待

### Step 1: QRコードまたはLINE IDで友達追加
1. LINE Official Account Manager → `友だちを増やす`
2. QRコードまたはLINE IDをコピー
3. 自分のLINEで友達追加

### Step 2: グループに招待
1. LINEグループを開く
2. `メンバー` → `招待`
3. `FIND to DO Bot`を選択
4. 招待完了

### Step 3: テストしてみる
グループでメンションでボットを呼び出し:
```
@FIND to DO Bot 予定 明日14時 チーム会議
@FIND to DO Bot タスク 資料作成 今週金曜まで
```

## 5. 実際の使用例

### 予定作成
```
@FIND to DO Bot 予定 1月15日 14時 田中さんと打ち合わせ 会議室A
```
→ カレンダーに自動登録

### タスク作成  
```
@FIND to DO Bot タスク 企画書作成 山田さん 来週月曜まで 重要
```
→ タスク管理に自動登録

### プロジェクト作成
```
@FIND to DO Bot プロジェクト 新サービス開発 ショウジキの機能改善
```
→ プロジェクト管理に自動登録

### 人脈記録
```
@FIND to DO Bot 人脈 鈴木太郎 XYZ株式会社 営業部長 展示会で出会った
```
→ 人脈管理に自動登録

## 6. よくある問題と解決法

### ボットが反応しない場合
1. **Webhook設定確認**: URLが正しく設定されているか
2. **応答メッセージ無効化**: LINE Official Account Managerで無効にする
3. **メンション形式**: `@FIND to DO Bot`で正しくメンションしているか
4. **グループ設定**: ボットのグループ参加が許可されているか

### エラーレスポンスの場合
1. **環境変数確認**: `.env.local`が正しく設定されているか
2. **ログ確認**: ブラウザ開発者ツールやサーバーログをチェック
3. **署名検証**: Channel Secretが正しく設定されているか

## 7. 本番デプロイメント

### Vercel デプロイ
```bash
# Vercelにデプロイ
npm install -g vercel
vercel

# 環境変数設定
vercel env add LINE_CHANNEL_SECRET
vercel env add LINE_CHANNEL_ACCESS_TOKEN
vercel env add OPENAI_API_KEY
```

### Webhook URL更新
本番URLをLINE Developers ConsoleのWebhook URLに設定:
```
https://your-app.vercel.app/api/webhook/line
```

---

**⚠️ 重要な注意点**:
- ボットは**メンションされた時のみ**反応します
- 普通の会話には反応しません
- OpenAI APIキーがない場合は簡易抽出機能で動作します
- 本番環境では必ずHTTPSを使用してください