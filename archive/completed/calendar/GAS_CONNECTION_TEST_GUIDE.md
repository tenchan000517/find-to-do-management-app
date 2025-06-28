# Google Apps Script接続テストガイド

**作成日**: 2025-06-16  
**対象**: Phase 11 Google Docs GAS統合システム

---

## 🔧 修正済みの問題

### **1. Browser.msgBox() エラーの解決**

**問題**: 
```
Exception: このコンテキストから Browser.msgBox() を呼び出せません。代わりに Logger.log() を試しましたか？
```

**解決策**: 
- `Browser.msgBox()` → `DocumentApp.getUi().alert()` に変更
- UIが利用できない場合のフォールバック処理を追加
- すべてのログを`console.log()`でも出力するように改善

### **2. ngrok公開URL設定**

**問題**: Google Apps Scriptは`localhost`にアクセス不可
**解決**: ngrokでローカルサーバーを公開
**現在のURL**: `https://5e83-2402-6b00-da0d-9600-78-397f-ab3d-5949.ngrok-free.app`

---

## 🧪 接続テスト手順

### **Step 1: サーバー側準備**

```bash
# 1. 開発サーバー起動
npm run dev

# 2. ngrok公開（別ターミナル）
ngrok http 3001
# 出力されるhttps URLを確認・コピー

# 3. サーバーログ監視（別ターミナル）
tail -f server.log

# 3. ngrok経由の手動API テスト（推奨）
curl -X POST "https://5e83-2402-6b00-da0d-9600-78-397f-ab3d-5949.ngrok-free.app/api/webhook/google-docs-gas" \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "test-manual-123",
    "title": "手動接続テスト",
    "content": "これは手動での接続テストです。Google Apps Scriptからの送信をテストしています。十分な長さのコンテンツを含んでいます。正常に動作すれば、このコンテンツがナレッジとして作成されるはずです。",
    "url": "https://docs.google.com/document/d/test-manual/edit",
    "lastModified": "2025-06-16T14:00:00Z",
    "triggerType": "manual_test",
    "wordCount": 95,
    "gasVersion": "2.0",
    "timestamp": "2025-06-16T14:00:00Z"
  }'

# 4. ローカル直接テスト（参考）
curl -X POST "http://localhost:3001/api/webhook/google-docs-gas" \
  -H "Content-Type: application/json" \
  -d '{ "documentId": "test-local-123", ... }'
```

**期待する応答**:
```json
{
  "success": true,
  "message": "ドキュメント処理完了",
  "result": {
    "documentId": "test-manual-123",
    "title": "手動接続テスト",
    "knowledgeItemsCreated": 1,
    "deletedItems": 0,
    "triggerType": "manual_test",
    "wordCount": 126,
    "gasVersion": "2.0"
  },
  "processingTime": ~3000,
  "timestamp": "2025-06-16T05:xx:xx.xxxZ"
}
```

### **Step 2: Google Apps Script準備**

1. **Google Docsを開いて、Apps Scriptを作成**
   - 拡張機能 > Apps Script
   - プロジェクト名: `DocumentSyncScript`

2. **修正済みコードを貼り付け**
   - [GOOGLE_APPS_SCRIPT_SETUP.md](./GOOGLE_APPS_SCRIPT_SETUP.md)の最新コードを使用
   - 重要: WEBHOOK_URLが`http://localhost:3001`になっていることを確認

3. **権限承認**
   - 初回実行時に権限承認が必要
   - Google Drive、Document、UrlFetchの権限が必要

### **Step 3: GAS接続テスト実行**

```javascript
// Apps Script エディタで実行する関数

// 1. 基本接続テスト
function testConnection() {
  // この関数を実行してサーバーログを確認
}

// 2. 初期化テスト
function initialize() {
  // トリガー設定と初期化を実行
}

// 3. 手動同期テスト
function manualSync() {
  // 実際のドキュメントコンテンツを送信
}
```

### **Step 4: 結果確認**

#### **GAS側で確認するもの**
1. **実行ログ**: Apps Script エディタの「実行数」タブ
2. **コンソールログ**: `console.log()`の出力
3. **エラー表示**: 実行時エラーがあれば表示される

#### **サーバー側で確認するもの**
1. **リクエスト受信ログ**:
   ```
   📨 GAS Webhook受信: テストタイトル (test)
   ```

2. **処理完了ログ**:
   ```
   🔧 開発モード: 認証スキップ
   🗑️ 既存ナレッジ削除: 0件
   ✅ 処理完了: テストタイトル - 1件のナレッジを作成
   ```

3. **APIレスポンス**: 200 OK + JSON レスポンス

---

## 🚨 よくある問題と解決法

### **問題1: GASで "Browser.msgBox() エラー"**

**症状**: 
```
Exception: このコンテキストから Browser.msgBox() を呼び出せません
```

**解決**: ✅ 修正済み
- 最新のGASコードを使用
- `DocumentApp.getUi().alert()`を使用
- UIエラーは無視される設定

### **問題2: "DNS error" または "Connection refused" エラー**

**症状**: 
```
DNS error: http://localhost:3001/api/webhook/google-docs-gas
UrlFetchApp.fetch failed: Connection refused
```

**原因**: Google Apps Scriptは`localhost`にアクセス不可

**解決手順**:
1. **ngrokで公開URL作成**
   ```bash
   ngrok http 3001
   ```

2. **出力されたhttps URLをコピー**
   ```
   Forwarding: https://xxxx-xxxx.ngrok-free.app -> http://localhost:3001
   ```

3. **GAS内のWEBHOOK_URLを更新**
   ```javascript
   const WEBHOOK_URL = 'https://xxxx-xxxx.ngrok-free.app/api/webhook/google-docs-gas';
   ```

4. **再テスト実行**

### **問題3: JSON Parse エラー**

**症状**: 
```
SyntaxError: Unterminated string in JSON
```

**解決**:
1. GAS内のペイロード作成部分を確認
2. 文字列のエスケープ処理を確認
3. `JSON.stringify()`が正しく動作するか確認

### **問題4: 権限エラー**

**症状**: 
```
You do not have permission to call...
```

**解決**:
1. Google Docsの編集権限を確認
2. Apps Scriptの実行権限を再承認
3. ドキュメントのオーナー権限を確認

---

## 📊 成功の確認指標

### **✅ 完全成功の条件**

1. **GAS実行成功**:
   - `testConnection()`が無エラーで完了
   - console.logに成功メッセージ表示

2. **サーバー処理成功**:
   - HTTPステータス 200
   - `knowledgeItemsCreated > 0`（コンテンツが十分な場合）

3. **データベース更新成功**:
   - `google_docs_sources`テーブルに記録追加
   - `knowledge_items`テーブルに自動生成記録追加

4. **ナレッジ管理画面で確認**:
   - http://localhost:3001/knowledge で新しいナレッジが表示される
   - `author: "Google Docs (GAS同期)"`
   - `auto_generated: true`

### **📈 パフォーマンス指標**

- **GAS実行時間**: < 30秒
- **API応答時間**: < 3秒
- **エンドツーエンド**: < 1分

---

## 🔄 継続テストフロー

### **日次確認項目**
1. 手動同期テスト実行
2. サーバーログ確認
3. ナレッジ作成確認

### **週次確認項目**
1. 編集トリガーテスト
2. 定期トリガーテスト
3. エラー復旧テスト

### **トラブル時エスカレーション**
1. **Level 1**: GASログ確認
2. **Level 2**: サーバーログ確認
3. **Level 3**: データベース直接確認
4. **Level 4**: システム再起動

---

**🎯 この手順に従うことで、Google Docs ↔ システム間の完全な連携が確認できます。**