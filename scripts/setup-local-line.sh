#!/bin/bash

echo "🤖 FIND to DO Bot - ローカル開発セットアップ"
echo "============================================"

# 依存関係のチェック
echo "📦 依存関係をチェック中..."
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrokがインストールされていません"
    echo "以下のコマンドでインストールしてください:"
    echo "npm install -g ngrok"
    exit 1
fi

# 環境変数のチェック
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.localファイルが見つかりません"
    echo "以下の内容で.env.localファイルを作成してください:"
    echo ""
    echo "LINE_CHANNEL_SECRET=your_channel_secret"
    echo "LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token"
    echo "OPENAI_API_KEY=your_openai_api_key"
    echo ""
    exit 1
fi

echo "✅ セットアップ準備完了"
echo ""

# 開発サーバーとngrokを起動
echo "🚀 開発サーバーを起動中..."
npm run dev &
DEV_PID=$!

# サーバーの起動を待つ
sleep 5

echo "🌐 ngrokトンネルを作成中..."
ngrok http 3000 &
NGROK_PID=$!

# ngrokの起動を待つ
sleep 3

echo ""
echo "🎉 セットアップ完了！"
echo "============================================"
echo ""
echo "📋 次の手順:"
echo "1. ngrokのWebインターフェース (http://localhost:4040) を開く"
echo "2. HTTPS URLをコピー (例: https://abc123.ngrok.io)"
echo "3. LINE Developers ConsoleのWebhook URLに設定:"
echo "   https://abc123.ngrok.io/api/webhook/line"
echo "4. LINEグループでボットをテスト:"
echo "   @FIND to DO Bot 予定 明日14時 テスト会議"
echo ""
echo "🛑 終了するには Ctrl+C を押してください"

# 終了時のクリーンアップ
cleanup() {
    echo ""
    echo "🧹 クリーンアップ中..."
    kill $DEV_PID 2>/dev/null
    kill $NGROK_PID 2>/dev/null
    echo "✅ 完了"
    exit 0
}

trap cleanup SIGINT

# プロセスが終了するまで待機
wait