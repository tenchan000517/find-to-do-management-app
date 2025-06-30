# Google Apps Script セットアップ手順

## 📋 GAS作成・設定手順

### Step 1: Google Apps Script作成

1. 対象のGoogle Docsを開く
2. メニューから `拡張機能` > `Apps Script` をクリック
3. プロジェクト名を `DocumentSyncScript` に変更
4. 以下のコードを `Code.gs` にコピー＆ペースト

### Step 2: GASスクリプトコード

```javascript
// DocumentSyncScript.gs
// Google Apps Script for Document Synchronization v2.0

// ===== 設定値 =====
const WEBHOOK_URL = 'https://5e83-2402-6b00-da0d-9600-78-397f-ab3d-5949.ngrok-free.app/api/webhook/google-docs-gas'; // ngrok公開URL
// const WEBHOOK_URL = 'http://localhost:3001/api/webhook/google-docs-gas'; // ローカル環境（ngrok使用不可の場合）
// const WEBHOOK_URL = 'https://find-to-do-management-app.vercel.app/calendar/api/webhook/google-docs-gas'; // 本番環境

const CONFIG = {
  // セキュリティ設定（開発初期はfalse）
  enableAuth: false,
  apiKey: '', // 開発中は空文字
  
  // パフォーマンス設定
  retryCount: 3,
  retryDelay: 1000, // ミリ秒
  maxContentLength: 50000, // 最大コンテンツ長
  minContentLength: 50, // 最小コンテンツ長
  
  // ログ設定
  enableLogging: true,
  logToSheet: false, // スプレッドシートログ（オプション）
  
  // トリガー設定
  enableEditTrigger: true,
  enableDailyTrigger: true,
  dailyTriggerHour: 0 // 0時に実行
};

// ===== メイン同期関数 =====
function syncDocument(triggerType = 'manual') {
  const startTime = new Date();
  
  try {
    log(`🔄 同期開始: ${triggerType}`, 'INFO');
    
    // ドキュメント情報取得
    const doc = DocumentApp.getActiveDocument();
    const docInfo = getDocumentInfo(doc);
    
    // コンテンツ検証
    if (!validateContent(docInfo.content)) {
      log(`⏭️ 同期スキップ: ${docInfo.title} (コンテンツ不足)`, 'WARN');
      return { success: true, skipped: true, reason: 'insufficient_content' };
    }
    
    // Webhook送信用ペイロード作成
    const payload = createWebhookPayload(docInfo, triggerType);
    
    // Webhook送信
    const result = sendToWebhook(payload);
    
    const processingTime = new Date() - startTime;
    log(`✅ 同期完了: ${docInfo.title} (${processingTime}ms)`, 'SUCCESS');
    
    return { success: true, result, processingTime };
    
  } catch (error) {
    const processingTime = new Date() - startTime;
    logError('syncDocument', error);
    
    // 重要なエラーの場合は再試行
    if (isRetryableError(error) && triggerType !== 'retry') {
      log(`🔄 同期リトライ: ${error.message}`, 'WARN');
      Utilities.sleep(CONFIG.retryDelay);
      return syncDocument('retry');
    }
    
    return { success: false, error: error.message, processingTime };
  }
}

// ===== ドキュメント情報取得 =====
function getDocumentInfo(doc) {
  return {
    documentId: doc.getId(),
    title: doc.getName(),
    content: doc.getBody().getText(),
    url: doc.getUrl(),
    lastModified: new Date().toISOString(),
    wordCount: doc.getBody().getText().length,
    // ドキュメントの詳細情報
    createdDate: DriveApp.getFileById(doc.getId()).getDateCreated().toISOString(),
    owner: DriveApp.getFileById(doc.getId()).getOwner().getEmail(),
    // 編集者情報（権限がある場合）
    editors: getEditorEmails(doc.getId())
  };
}

// 編集者情報取得（エラー処理付き）
function getEditorEmails(documentId) {
  try {
    const file = DriveApp.getFileById(documentId);
    return file.getEditors().map(editor => editor.getEmail()).slice(0, 5); // 最大5名
  } catch (error) {
    log(`編集者情報取得エラー: ${error.message}`, 'WARN');
    return [];
  }
}

// ===== コンテンツ検証 =====
function validateContent(content) {
  if (!content || typeof content !== 'string') {
    return false;
  }
  
  const trimmedContent = content.trim();
  
  // 最小長チェック
  if (trimmedContent.length < CONFIG.minContentLength) {
    return false;
  }
  
  // 最大長チェック
  if (trimmedContent.length > CONFIG.maxContentLength) {
    log(`⚠️ コンテンツが長すぎます: ${trimmedContent.length}文字`, 'WARN');
    // 長すぎる場合も処理は続行（警告のみ）
  }
  
  // 意味のあるコンテンツかチェック（簡易）
  const meaningfulContent = trimmedContent.replace(/\s+/g, '');
  if (meaningfulContent.length < 30) {
    return false;
  }
  
  return true;
}

// ===== Webhookペイロード作成 =====
function createWebhookPayload(docInfo, triggerType) {
  const payload = {
    // 基本情報
    documentId: docInfo.documentId,
    title: docInfo.title,
    content: docInfo.content,
    url: docInfo.url,
    lastModified: docInfo.lastModified,
    
    // メタデータ
    triggerType: triggerType,
    wordCount: docInfo.wordCount,
    createdDate: docInfo.createdDate,
    owner: docInfo.owner,
    editors: docInfo.editors,
    
    // システム情報
    gasVersion: '2.0',
    timestamp: new Date().toISOString(),
    
    // 認証情報（設定により含める/除外）
    ...(CONFIG.enableAuth && { apiKey: CONFIG.apiKey })
  };
  
  // コンテンツのハッシュ値（重複検出用）
  payload.contentHash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, 
    docInfo.content
  ).map(byte => (byte + 256) % 256).map(byte => byte.toString(16).padStart(2, '0')).join('');
  
  return payload;
}

// ===== Webhook送信（リトライ付き） =====
function sendToWebhook(payload) {
  let lastError;
  
  for (let attempt = 1; attempt <= CONFIG.retryCount; attempt++) {
    try {
      log(`📤 Webhook送信 (試行${attempt}/${CONFIG.retryCount}): ${payload.title}`, 'INFO');
      
      const response = UrlFetchApp.fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `GAS-DocumentSync/${payload.gasVersion}`,
          'X-Document-ID': payload.documentId,
          'X-Trigger-Type': payload.triggerType
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
      
      const responseCode = response.getResponseCode();
      const responseText = response.getContentText();
      
      // 成功判定
      if (responseCode === 200) {
        log(`✅ Webhook送信成功 (試行${attempt}): ${responseCode}`, 'SUCCESS');
        
        try {
          const responseData = JSON.parse(responseText);
          return responseData;
        } catch (parseError) {
          log(`⚠️ レスポンス解析失敗: ${parseError.message}`, 'WARN');
          return { success: true, message: 'Response received but parsing failed' };
        }
      }
      
      // 4xx系エラーは再試行しない
      if (responseCode >= 400 && responseCode < 500) {
        throw new Error(`Client Error ${responseCode}: ${responseText}`);
      }
      
      // 5xx系エラーは再試行
      throw new Error(`Server Error ${responseCode}: ${responseText}`);
      
    } catch (error) {
      lastError = error;
      log(`❌ Webhook送信失敗 (試行${attempt}/${CONFIG.retryCount}): ${error.message}`, 'ERROR');
      
      // 最後の試行でない場合は待機
      if (attempt < CONFIG.retryCount) {
        const delay = CONFIG.retryDelay * Math.pow(2, attempt - 1); // 指数バックオフ
        log(`⏳ ${delay}ms待機後リトライ`, 'INFO');
        Utilities.sleep(delay);
      }
    }
  }
  
  // 全試行失敗
  throw new Error(`Webhook送信失敗 (${CONFIG.retryCount}回試行): ${lastError.message}`);
}

// ===== エラー判定 =====
function isRetryableError(error) {
  const retryablePatterns = [
    /timeout/i,
    /network/i,
    /connection/i,
    /502/,
    /503/,
    /504/
  ];
  
  return retryablePatterns.some(pattern => pattern.test(error.message));
}

// ===== トリガー管理 =====

// 編集トリガー（リアルタイム同期）
function onDocumentEdit(e) {
  try {
    // 編集から少し待機（連続編集の考慮）
    Utilities.sleep(2000);
    
    log('📝 ドキュメント編集検出', 'INFO');
    syncDocument('edit');
    
  } catch (error) {
    logError('onDocumentEdit', error);
  }
}

// 定期トリガー（毎日同期）
function dailySync() {
  try {
    log('⏰ 定期同期実行', 'INFO');
    const result = syncDocument('scheduled');
    
    // 定期同期の結果をログ
    if (result.success) {
      log(`✅ 定期同期完了: ${result.skipped ? 'スキップ' : '同期済み'}`, 'SUCCESS');
    } else {
      log(`❌ 定期同期失敗: ${result.error}`, 'ERROR');
    }
    
  } catch (error) {
    logError('dailySync', error);
  }
}

// 手動同期（テスト・緊急時用）
function manualSync() {
  try {
    log('🔧 手動同期実行', 'INFO');
    const result = syncDocument('manual');
    
    // 結果をポップアップ表示（UI利用可能時のみ）
    if (result.success) {
      const message = result.skipped 
        ? `同期スキップ: ${result.reason}`
        : `同期完了: ${result.processingTime}ms`;
      
      if (typeof DocumentApp !== 'undefined' && DocumentApp.getUi) {
        try {
          DocumentApp.getUi().alert('同期結果', message);
        } catch (uiError) {
          log('UI表示エラー（無視可能）: ' + uiError.message, 'WARN');
        }
      }
      log(`手動同期結果: ${message}`, 'SUCCESS');
    } else {
      if (typeof DocumentApp !== 'undefined' && DocumentApp.getUi) {
        try {
          DocumentApp.getUi().alert('同期エラー', result.error);
        } catch (uiError) {
          log('UI表示エラー（無視可能）: ' + uiError.message, 'WARN');
        }
      }
      log(`手動同期エラー: ${result.error}`, 'ERROR');
    }
    
    return result;
    
  } catch (error) {
    logError('manualSync', error);
    
    if (typeof DocumentApp !== 'undefined' && DocumentApp.getUi) {
      try {
        DocumentApp.getUi().alert('同期エラー', error.message);
      } catch (uiError) {
        log('UI表示エラー（無視可能）: ' + uiError.message, 'WARN');
      }
    }
    log(`手動同期例外: ${error.message}`, 'ERROR');
    return { success: false, error: error.message };
  }
}

// ===== トリガー設定・管理 =====

function setupTriggers() {
  try {
    log('🔧 トリガー設定開始', 'INFO');
    
    // 既存トリガー削除
    deleteAllTriggers();
    
    const doc = DocumentApp.getActiveDocument();
    let triggerCount = 0;
    
    // 編集トリガー作成
    if (CONFIG.enableEditTrigger) {
      ScriptApp.newTrigger('onDocumentEdit')
        .forDocument(doc)
        .onEdit()
        .create();
      triggerCount++;
      log('✅ 編集トリガー作成完了', 'SUCCESS');
    }
    
    // 定期トリガー作成
    if (CONFIG.enableDailyTrigger) {
      ScriptApp.newTrigger('dailySync')
        .timeBased()
        .everyDays(1)
        .atHour(CONFIG.dailyTriggerHour)
        .create();
      triggerCount++;
      log(`✅ 定期トリガー作成完了 (毎日${CONFIG.dailyTriggerHour}時)`, 'SUCCESS');
    }
    
    log(`🎉 トリガー設定完了: ${triggerCount}個のトリガーを作成`, 'SUCCESS');
    
    // 設定確認のポップアップ（UI利用可能時のみ）
    const message = `${triggerCount}個のトリガーを設定しました。\n・編集時自動同期: ${CONFIG.enableEditTrigger ? '有効' : '無効'}\n・毎日定期同期: ${CONFIG.enableDailyTrigger ? '有効' : '無効'}`;
    
    if (typeof DocumentApp !== 'undefined' && DocumentApp.getUi) {
      try {
        DocumentApp.getUi().alert('トリガー設定完了', message);
      } catch (uiError) {
        log('UI表示エラー（無視可能）: ' + uiError.message, 'WARN');
      }
    }
    log(`トリガー設定完了: ${message}`, 'SUCCESS');
    
    return true;
    
  } catch (error) {
    logError('setupTriggers', error);
    
    if (typeof DocumentApp !== 'undefined' && DocumentApp.getUi) {
      try {
        DocumentApp.getUi().alert('トリガー設定エラー', error.message);
      } catch (uiError) {
        log('UI表示エラー（無視可能）: ' + uiError.message, 'WARN');
      }
    }
    log(`トリガー設定エラー: ${error.message}`, 'ERROR');
    return false;
  }
}

function deleteAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  
  triggers.forEach(trigger => {
    ScriptApp.deleteTrigger(trigger);
  });
  
  log(`🗑️ ${triggers.length}個のトリガーを削除`, 'INFO');
}

// ===== ログ機能 =====

function log(message, level = 'INFO') {
  if (!CONFIG.enableLogging) return;
  
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  
  // コンソールログ
  console.log(logMessage);
}

function logError(functionName, error) {
  const errorMessage = `${functionName}: ${error.message}`;
  log(errorMessage, 'ERROR');
  
  // スタックトレースも記録
  if (error.stack) {
    log(`Stack: ${error.stack}`, 'DEBUG');
  }
}

// ===== ユーティリティ関数 =====

function testConnection() {
  try {
    log('🧪 接続テスト開始', 'INFO');
    
    const testPayload = {
      documentId: 'test-' + new Date().getTime(),
      title: '接続テスト',
      content: 'これは接続テストです。十分な長さのコンテンツを含んでいます。Google Apps Scriptからの送信をテストしています。',
      url: 'https://test.example.com',
      lastModified: new Date().toISOString(),
      triggerType: 'test',
      wordCount: 55,
      gasVersion: '2.0',
      timestamp: new Date().toISOString()
    };
    
    const result = sendToWebhook(testPayload);
    
    log('✅ 接続テスト成功', 'SUCCESS');
    log(`結果: ${JSON.stringify(result)}`, 'INFO');
    
    // ドキュメントUIが利用可能な場合のみmsgBoxを使用
    if (typeof DocumentApp !== 'undefined' && DocumentApp.getUi) {
      try {
        DocumentApp.getUi().alert('接続テスト成功', '接続テストが成功しました！\n\n結果: ' + JSON.stringify(result, null, 2));
      } catch (uiError) {
        log('UI表示エラー（無視可能）: ' + uiError.message, 'WARN');
      }
    }
    
    return result;
    
  } catch (error) {
    logError('testConnection', error);
    
    // ドキュメントUIが利用可能な場合のみmsgBoxを使用
    if (typeof DocumentApp !== 'undefined' && DocumentApp.getUi) {
      try {
        DocumentApp.getUi().alert('接続テスト失敗', error.message);
      } catch (uiError) {
        log('UI表示エラー（無視可能）: ' + uiError.message, 'WARN');
      }
    }
    
    return { success: false, error: error.message };
  }
}

// ===== 初期化・スタートアップ =====

function initialize() {
  try {
    log('🚀 DocumentSync初期化開始', 'INFO');
    
    // トリガー設定
    const triggerSetup = setupTriggers();
    
    if (triggerSetup) {
      log('🎉 初期化完了', 'SUCCESS');
      
      const successMessage = 'Google Docs自動同期システムの初期化が完了しました！\n\n自動同期が有効になりました。';
      if (typeof DocumentApp !== 'undefined' && DocumentApp.getUi) {
        try {
          DocumentApp.getUi().alert('DocumentSync初期化完了', successMessage);
        } catch (uiError) {
          log('UI表示エラー（無視可能）: ' + uiError.message, 'WARN');
        }
      }
      log(`初期化完了: ${successMessage}`, 'SUCCESS');
    } else {
      throw new Error('トリガー設定に失敗しました');
    }
    
    return true;
    
  } catch (error) {
    logError('initialize', error);
    
    if (typeof DocumentApp !== 'undefined' && DocumentApp.getUi) {
      try {
        DocumentApp.getUi().alert('初期化エラー', error.message);
      } catch (uiError) {
        log('UI表示エラー（無視可能）: ' + uiError.message, 'WARN');
      }
    }
    log(`初期化エラー: ${error.message}`, 'ERROR');
    return false;
  }
}

// ===== システム情報・管理機能 =====

function getSystemInfo() {
  const doc = DocumentApp.getActiveDocument();
  
  return {
    documentId: doc.getId(),
    documentTitle: doc.getName(),
    documentUrl: doc.getUrl(),
    gasVersion: '2.0',
    config: getConfig(),
    triggers: listTriggers().length,
    lastSync: PropertiesService.getScriptProperties().getProperty('LAST_SYNC'),
    timestamp: new Date().toISOString()
  };
}

function showSystemInfo() {
  try {
    const info = getSystemInfo();
    const message = `システム情報:\n\nドキュメントID: ${info.documentId.substring(0, 20)}...\nドキュメント名: ${info.documentTitle}\nバージョン: ${info.gasVersion}\nトリガー数: ${info.triggers}\n最終同期: ${info.lastSync || '未実行'}`;
    
    log(`システム情報表示: ${message}`, 'INFO');
    
    if (typeof DocumentApp !== 'undefined' && DocumentApp.getUi) {
      try {
        DocumentApp.getUi().alert('システム情報', message);
      } catch (uiError) {
        log('UI表示エラー（無視可能）: ' + uiError.message, 'WARN');
      }
    }
  } catch (error) {
    logError('showSystemInfo', error);
  }
}

function showLogs() {
  try {
    const message = '詳細ログは Apps Script エディタの「実行数」画面で確認してください。\n\nまたは、console.log出力を確認するには、スクリプトエディタの「ログ」を参照してください。';
    log('ログ表示要求', 'INFO');
    
    if (typeof DocumentApp !== 'undefined' && DocumentApp.getUi) {
      try {
        DocumentApp.getUi().alert('ログ表示', message);
      } catch (uiError) {
        log('UI表示エラー（無視可能）: ' + uiError.message, 'WARN');
      }
    }
  } catch (error) {
    logError('showLogs', error);
  }
}

// ===== 設定管理関数 =====

function getConfig() {
  return { ...CONFIG }; // コピーを返す
}

// スクリプト読み込み時の自動実行
function onOpen() {
  // カスタムメニュー追加
  const ui = DocumentApp.getUi();
  ui.createMenu('🔄 DocumentSync')
    .addItem('📤 手動同期', 'manualSync')
    .addItem('⚙️ 初期設定', 'initialize')
    .addItem('🧪 接続テスト', 'testConnection')
    .addSeparator()
    .addItem('📋 システム情報', 'showSystemInfo')
    .addItem('📝 ログ表示', 'showLogs')
    .addToUi();
}
```

### Step 3: 初期設定

1. スクリプトを保存（Ctrl+S）
2. `initialize` 関数を実行:
   - 上部の関数選択ドロップダウンで `initialize` を選択
   - 「実行」ボタンをクリック
   - 権限の承認が求められたら承認

### Step 4: 動作確認

1. **開発サーバーが起動していることを確認**
   ```bash
   # 別ターミナルで確認
   ps aux | grep "next dev"
   # http://localhost:3001 で起動していることを確認
   ```

2. **Google Docsに戻る**
   - メニューに「🔄 DocumentSync」が追加されていることを確認

3. **接続テスト実行**
   - 「🧪 接続テスト」を実行
   - ✅ 成功時: アラートで成功メッセージ表示
   - ❌ 失敗時: エラーメッセージとログを確認

4. **システム情報確認**
   - 「📋 システム情報」でトリガー設定状況を確認

5. **手動同期テスト**
   - ドキュメントに十分な内容（100文字以上）を記述
   - 「📤 手動同期」を実行
   - ナレッジ管理画面（http://localhost:3001/knowledge）で結果確認

6. **自動同期テスト**
   - ドキュメントを編集（テキスト追加）
   - 2-3秒待機後、ナレッジ管理画面で自動更新を確認

### Step 5: トラブルシューティング

**問題が発生した場合は、[GAS接続テストガイド](./GAS_CONNECTION_TEST_GUIDE.md)を参照してください。**

#### **よくある初期設定エラー**

1. **"Browser.msgBox() エラー"**
   - ✅ 修正済み: 最新コードでは`DocumentApp.getUi().alert()`を使用

2. **"Connection refused"**
   - 開発サーバーの起動確認
   - ポート番号確認（3001）
   - ファイアウォール設定確認

3. **権限エラー**
   - Google Drive、Document、UrlFetchの権限を再承認
   - ドキュメントの編集権限を確認

## ✅ 設定完了チェックリスト

- [ ] GASプロジェクト作成完了
- [ ] スクリプトコード貼り付け完了
- [ ] `initialize` 関数実行完了
- [ ] トリガー設定完了
- [ ] 接続テスト成功
- [ ] ドキュメント編集による自動同期確認

## 🚨 トラブルシューティング

### よくある問題

1. **権限エラー**
   - ドキュメントの編集権限を確認
   - GASの実行権限を再承認

2. **Webhook接続失敗**
   - 開発サーバーが起動しているか確認
   - WEBHOOK_URLが正しいか確認

3. **トリガー作成失敗**
   - スクリプトを保存してから再実行
   - 既存トリガーを削除してから再設定

## 📊 期待される動作

- ドキュメント編集時に自動同期実行
- 手動同期メニューから即座に同期
- 毎日定期同期実行
- ナレッジ管理システムにコンテンツ自動追加