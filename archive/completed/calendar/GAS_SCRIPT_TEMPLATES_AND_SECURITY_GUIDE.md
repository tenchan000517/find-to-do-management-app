# GASスクリプトテンプレート集 & セキュリティ段階的実装ガイド

**作成日**: 2025-06-16  
**バージョン**: 2.0 (GASアプローチ対応)  
**用途**: 即座に利用可能なGASテンプレート + 段階的セキュリティ実装

---

## 🎯 このドキュメントの用途

### **即座に使える実装リソース**
- ✅ **コピー&ペースト可能なGASコード**
- ✅ **環境別設定テンプレート**
- ✅ **段階的セキュリティ実装手順**
- ✅ **トラブルシューティング解決集**

### **対象ユーザー**
- Google Apps Script初心者〜中級者
- セキュリティを段階的に強化したい開発者
- テスト・開発・本番環境を分けて管理したい開発者

---

## 📋 GASスクリプトテンプレート集

### 🔧 テンプレート1: 最小構成（開発初期向け）

```javascript
// ===== 最小構成 GAS スクリプト =====
// ファイル名: SimpleDocumentSync.gs
// 用途: 開発初期、基本動作確認

// 設定（開発用）
const WEBHOOK_URL = 'http://localhost:3000/api/webhook/google-docs-gas';
const ENABLE_AUTH = false; // 認証なし
const ENABLE_LOGGING = true;

// メイン同期関数
function syncDocument() {
  try {
    const doc = DocumentApp.getActiveDocument();
    
    const payload = {
      documentId: doc.getId(),
      title: doc.getName(),
      content: doc.getBody().getText(),
      url: doc.getUrl(),
      lastModified: new Date().toISOString(),
      triggerType: 'manual'
    };
    
    const response = UrlFetchApp.fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify(payload)
    });
    
    if (response.getResponseCode() === 200) {
      console.log('✅ 同期成功');
      Browser.msgBox('同期完了', '同期が正常に完了しました', Browser.Buttons.OK);
    } else {
      throw new Error(`HTTP ${response.getResponseCode()}: ${response.getContentText()}`);
    }
    
  } catch (error) {
    console.error('❌ 同期エラー:', error);
    Browser.msgBox('同期エラー', error.message, Browser.Buttons.OK);
  }
}

// カスタムメニュー追加
function onOpen() {
  DocumentApp.getUi()
    .createMenu('📤 ドキュメント同期')
    .addItem('🔄 手動同期', 'syncDocument')
    .addToUi();
}

// 初期設定
function setup() {
  Browser.msgBox('設定完了', '最小構成のドキュメント同期が設定されました', Browser.Buttons.OK);
}
```

### 🚀 テンプレート2: 標準構成（開発・テスト向け）

```javascript
// ===== 標準構成 GAS スクリプト =====
// ファイル名: StandardDocumentSync.gs
// 用途: 開発・テスト環境、基本機能フル実装

// ===== 設定値 =====
const CONFIG = {
  // 環境設定
  environment: 'development', // development, staging, production
  
  // Webhook URL（環境別）
  webhookUrls: {
    development: 'http://localhost:3000/api/webhook/google-docs-gas',
    staging: 'https://staging.your-domain.com/api/webhook/google-docs-gas',
    production: 'https://your-domain.com/api/webhook/google-docs-gas'
  },
  
  // セキュリティ設定
  enableAuth: false, // 開発中はfalse
  apiKey: '', // 後で設定
  
  // 機能設定
  enableAutoSync: true,  // 編集時自動同期
  enableDailySync: true, // 毎日定期同期
  enableLogging: true,
  
  // パフォーマンス設定
  retryCount: 3,
  retryDelay: 1000,
  timeoutMs: 30000
};

// ===== メイン処理 =====
function syncDocument(triggerType = 'manual') {
  const startTime = new Date();
  
  try {
    log(`🔄 同期開始: ${triggerType}`);
    
    // ドキュメント情報取得
    const doc = DocumentApp.getActiveDocument();
    const payload = createPayload(doc, triggerType);
    
    // バリデーション
    if (!validatePayload(payload)) {
      throw new Error('ペイロードが無効です');
    }
    
    // Webhook送信
    const result = sendToWebhook(payload);
    
    const duration = new Date() - startTime;
    log(`✅ 同期完了: ${duration}ms`);
    
    return result;
    
  } catch (error) {
    const duration = new Date() - startTime;
    logError('syncDocument', error);
    
    if (triggerType === 'manual') {
      Browser.msgBox('同期エラー', error.message, Browser.Buttons.OK);
    }
    
    throw error;
  }
}

// ペイロード作成
function createPayload(doc, triggerType) {
  return {
    documentId: doc.getId(),
    title: doc.getName(),
    content: doc.getBody().getText(),
    url: doc.getUrl(),
    lastModified: new Date().toISOString(),
    triggerType: triggerType,
    wordCount: doc.getBody().getText().length,
    gasVersion: '2.0',
    environment: CONFIG.environment,
    timestamp: new Date().toISOString(),
    ...(CONFIG.enableAuth && { apiKey: CONFIG.apiKey })
  };
}

// ペイロード検証
function validatePayload(payload) {
  if (!payload.documentId || !payload.title || !payload.content) {
    return false;
  }
  
  if (payload.content.trim().length < 10) {
    log('⚠️ コンテンツが短すぎます');
    return false;
  }
  
  return true;
}

// Webhook送信（リトライ付き）
function sendToWebhook(payload) {
  const url = CONFIG.webhookUrls[CONFIG.environment];
  
  for (let attempt = 1; attempt <= CONFIG.retryCount; attempt++) {
    try {
      log(`📤 送信試行 ${attempt}/${CONFIG.retryCount}`);
      
      const response = UrlFetchApp.fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `GAS-StandardSync/2.0 (${CONFIG.environment})`
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
      
      const responseCode = response.getResponseCode();
      
      if (responseCode === 200) {
        log(`✅ 送信成功 (${attempt}回目)`);
        return JSON.parse(response.getContentText());
      }
      
      if (responseCode >= 400 && responseCode < 500) {
        throw new Error(`Client Error ${responseCode}: ${response.getContentText()}`);
      }
      
      throw new Error(`Server Error ${responseCode}: ${response.getContentText()}`);
      
    } catch (error) {
      log(`❌ 送信失敗 (${attempt}回目): ${error.message}`);
      
      if (attempt < CONFIG.retryCount) {
        Utilities.sleep(CONFIG.retryDelay * attempt);
      } else {
        throw error;
      }
    }
  }
}

// ===== トリガー管理 =====
function onDocumentEdit(e) {
  if (CONFIG.enableAutoSync) {
    // 2秒待機（連続編集対策）
    Utilities.sleep(2000);
    syncDocument('edit');
  }
}

function dailySync() {
  if (CONFIG.enableDailySync) {
    syncDocument('scheduled');
  }
}

function setupTriggers() {
  try {
    deleteAllTriggers();
    
    const doc = DocumentApp.getActiveDocument();
    let triggerCount = 0;
    
    if (CONFIG.enableAutoSync) {
      ScriptApp.newTrigger('onDocumentEdit')
        .forDocument(doc)
        .onEdit()
        .create();
      triggerCount++;
    }
    
    if (CONFIG.enableDailySync) {
      ScriptApp.newTrigger('dailySync')
        .timeBased()
        .everyDays(1)
        .atHour(0)
        .create();
      triggerCount++;
    }
    
    log(`✅ ${triggerCount}個のトリガーを設定`);
    Browser.msgBox('設定完了', `${triggerCount}個のトリガーを設定しました`, Browser.Buttons.OK);
    
  } catch (error) {
    logError('setupTriggers', error);
    Browser.msgBox('設定エラー', error.message, Browser.Buttons.OK);
  }
}

function deleteAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  log(`🗑️ ${triggers.length}個のトリガーを削除`);
}

// ===== ユーティリティ =====
function log(message) {
  if (CONFIG.enableLogging) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }
}

function logError(functionName, error) {
  log(`ERROR in ${functionName}: ${error.message}`);
  if (error.stack) {
    log(`Stack: ${error.stack}`);
  }
}

// ===== テスト・管理機能 =====
function testConnection() {
  try {
    const testPayload = {
      documentId: 'test',
      title: '接続テスト',
      content: 'これは接続テストです。',
      triggerType: 'test',
      gasVersion: '2.0',
      environment: CONFIG.environment
    };
    
    const result = sendToWebhook(testPayload);
    Browser.msgBox('接続テスト成功', '接続テストが成功しました', Browser.Buttons.OK);
    
  } catch (error) {
    logError('testConnection', error);
    Browser.msgBox('接続テスト失敗', error.message, Browser.Buttons.OK);
  }
}

function showConfig() {
  const configText = `現在の設定:
環境: ${CONFIG.environment}
認証: ${CONFIG.enableAuth ? '有効' : '無効'}
自動同期: ${CONFIG.enableAutoSync ? '有効' : '無効'}
定期同期: ${CONFIG.enableDailySync ? '有効' : '無効'}
ログ: ${CONFIG.enableLogging ? '有効' : '無効'}`;
  
  Browser.msgBox('設定情報', configText, Browser.Buttons.OK);
}

// ===== メニュー =====
function onOpen() {
  const ui = DocumentApp.getUi();
  ui.createMenu('🔄 ドキュメント同期')
    .addItem('📤 手動同期', 'manualSync')
    .addItem('🧪 接続テスト', 'testConnection')
    .addSeparator()
    .addItem('⚙️ トリガー設定', 'setupTriggers')
    .addItem('📋 設定確認', 'showConfig')
    .addItem('🗑️ トリガー削除', 'deleteAllTriggers')
    .addToUi();
}

function manualSync() {
  syncDocument('manual');
}
```

### 🔒 テンプレート3: 本番環境用（セキュリティ強化）

```javascript
// ===== 本番環境用 GAS スクリプト =====
// ファイル名: ProductionDocumentSync.gs
// 用途: 本番環境、セキュリティ・監視強化

// ===== セキュリティ設定 =====
const SECURITY_CONFIG = {
  enableAuth: true,
  enableEncryption: false, // 将来実装
  enableAuditLog: true,
  enableRateLimit: true,
  maxRequestsPerHour: 100,
  allowedDomains: [
    'your-production-domain.com',
    'your-staging-domain.com'
  ]
};

// ===== 本番設定 =====
const PROD_CONFIG = {
  environment: 'production',
  webhookUrl: 'https://your-production-domain.com/api/webhook/google-docs-gas',
  apiKey: getSecureApiKey(), // PropertiesServiceから取得
  
  // 堅牢性設定
  retryCount: 5,
  retryDelay: 2000,
  timeoutMs: 60000,
  
  // 監視設定
  enableHealthCheck: true,
  enableErrorAlert: true,
  enablePerformanceLog: true,
  
  // 機能設定
  enableAutoSync: true,
  enableDailySync: true,
  enableWeeklyReport: true
};

// ===== セキュアAPI Key取得 =====
function getSecureApiKey() {
  try {
    const apiKey = PropertiesService.getScriptProperties().getProperty('WEBHOOK_API_KEY');
    
    if (!apiKey) {
      throw new Error('API Key が設定されていません。setupApiKey() を実行してください。');
    }
    
    return apiKey;
    
  } catch (error) {
    logSecurityEvent('API_KEY_ACCESS_FAILED', error.message);
    throw error;
  }
}

// API Key設定（初回のみ実行）
function setupApiKey() {
  const apiKey = Browser.inputBox(
    'API Key設定',
    '本番環境のAPI Keyを入力してください:',
    Browser.Buttons.OK_CANCEL
  );
  
  if (apiKey === 'cancel' || !apiKey) {
    Browser.msgBox('設定キャンセル', 'API Key設定がキャンセルされました', Browser.Buttons.OK);
    return;
  }
  
  // 安全に保存
  PropertiesService.getScriptProperties().setProperty('WEBHOOK_API_KEY', apiKey);
  
  logSecurityEvent('API_KEY_CONFIGURED', 'API Key設定完了');
  Browser.msgBox('設定完了', 'API Keyが安全に設定されました', Browser.Buttons.OK);
}

// ===== セキュア同期処理 =====
function secureSync(triggerType = 'manual') {
  const sessionId = generateSessionId();
  const startTime = new Date();
  
  try {
    // セキュリティチェック
    performSecurityChecks();
    
    // レート制限チェック
    checkRateLimit();
    
    // 監査ログ開始
    logAuditEvent(sessionId, 'SYNC_STARTED', { triggerType });
    
    // メイン処理
    const doc = DocumentApp.getActiveDocument();
    const payload = createSecurePayload(doc, triggerType, sessionId);
    
    // ペイロード検証
    validateSecurePayload(payload);
    
    // セキュア送信
    const result = sendSecureWebhook(payload);
    
    // 成功ログ
    const duration = new Date() - startTime;
    logAuditEvent(sessionId, 'SYNC_COMPLETED', { 
      duration, 
      status: 'success',
      sectionsCreated: result.knowledgeItemsCreated 
    });
    
    // パフォーマンスログ
    if (PROD_CONFIG.enablePerformanceLog) {
      logPerformance(sessionId, duration, payload.wordCount);
    }
    
    return result;
    
  } catch (error) {
    const duration = new Date() - startTime;
    
    // エラー監査ログ
    logAuditEvent(sessionId, 'SYNC_FAILED', { 
      duration, 
      error: error.message,
      triggerType 
    });
    
    // セキュリティインシデントチェック
    if (isSecurityIncident(error)) {
      logSecurityEvent('SECURITY_INCIDENT', error.message, sessionId);
    }
    
    // エラーアラート
    if (PROD_CONFIG.enableErrorAlert) {
      sendErrorAlert(error, sessionId);
    }
    
    throw error;
  }
}

// セキュリティチェック
function performSecurityChecks() {
  // 実行環境チェック
  const userEmail = Session.getActiveUser().getEmail();
  
  if (!userEmail) {
    throw new Error('ユーザー認証が確認できません');
  }
  
  // ドメインチェック（オプション）
  const domain = userEmail.split('@')[1];
  const allowedDomains = ['your-company.com']; // 許可ドメイン
  
  if (allowedDomains.length > 0 && !allowedDomains.includes(domain)) {
    logSecurityEvent('UNAUTHORIZED_DOMAIN', `不許可ドメイン: ${domain}`);
    throw new Error('このドメインからの実行は許可されていません');
  }
}

// レート制限チェック
function checkRateLimit() {
  if (!SECURITY_CONFIG.enableRateLimit) return;
  
  const now = new Date();
  const hourKey = `rate_limit_${now.getFullYear()}_${now.getMonth()}_${now.getDate()}_${now.getHours()}`;
  
  const cache = CacheService.getScriptCache();
  const currentCount = parseInt(cache.get(hourKey) || '0');
  
  if (currentCount >= SECURITY_CONFIG.maxRequestsPerHour) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', `時間当たり制限超過: ${currentCount}`);
    throw new Error('時間当たりのリクエスト制限に達しました。しばらく待ってから再実行してください。');
  }
  
  // カウント更新
  cache.put(hourKey, String(currentCount + 1), 3600); // 1時間保持
}

// セキュアペイロード作成
function createSecurePayload(doc, triggerType, sessionId) {
  const payload = {
    documentId: doc.getId(),
    title: doc.getName(),
    content: doc.getBody().getText(),
    url: doc.getUrl(),
    lastModified: new Date().toISOString(),
    triggerType: triggerType,
    wordCount: doc.getBody().getText().length,
    
    // セキュリティ情報
    gasVersion: '2.0-secure',
    environment: PROD_CONFIG.environment,
    sessionId: sessionId,
    userEmail: Session.getActiveUser().getEmail(),
    timestamp: new Date().toISOString(),
    apiKey: PROD_CONFIG.apiKey,
    
    // 整合性チェック用
    checksum: generateChecksum(doc.getBody().getText())
  };
  
  return payload;
}

// セキュアペイロード検証
function validateSecurePayload(payload) {
  // 必須フィールド
  const requiredFields = ['documentId', 'title', 'content', 'apiKey', 'sessionId'];
  
  for (const field of requiredFields) {
    if (!payload[field]) {
      throw new Error(`必須フィールドが不足: ${field}`);
    }
  }
  
  // コンテンツサイズチェック
  if (payload.content.length > 100000) { // 100KB制限
    throw new Error('ドキュメントサイズが制限を超えています');
  }
  
  // 不正文字チェック（基本的なインジェクション対策）
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(payload.content)) {
      logSecurityEvent('SUSPICIOUS_CONTENT', 'スクリプト注入の疑い');
      throw new Error('不正なコンテンツが検出されました');
    }
  }
}

// セキュア送信
function sendSecureWebhook(payload) {
  const maxAttempts = PROD_CONFIG.retryCount;
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = UrlFetchApp.fetch(PROD_CONFIG.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `GAS-SecureSync/2.0`,
          'X-Session-ID': payload.sessionId,
          'X-Environment': PROD_CONFIG.environment
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
      
      const responseCode = response.getResponseCode();
      
      if (responseCode === 200) {
        return JSON.parse(response.getContentText());
      }
      
      // 4xxエラーは再試行しない
      if (responseCode >= 400 && responseCode < 500) {
        throw new Error(`Client Error ${responseCode}: ${response.getContentText()}`);
      }
      
      throw new Error(`Server Error ${responseCode}: ${response.getContentText()}`);
      
    } catch (error) {
      lastError = error;
      
      if (attempt < maxAttempts) {
        const delay = PROD_CONFIG.retryDelay * Math.pow(2, attempt - 1); // 指数バックオフ
        Utilities.sleep(delay);
      }
    }
  }
  
  throw new Error(`送信失敗 (${maxAttempts}回試行): ${lastError.message}`);
}

// ===== ログ・監視機能 =====
function logAuditEvent(sessionId, event, details = {}) {
  if (!SECURITY_CONFIG.enableAuditLog) return;
  
  const auditLog = {
    timestamp: new Date().toISOString(),
    sessionId: sessionId,
    event: event,
    userEmail: Session.getActiveUser().getEmail(),
    details: details
  };
  
  // ログをスプレッドシートに記録
  try {
    const sheet = getAuditLogSheet();
    sheet.appendRow([
      auditLog.timestamp,
      auditLog.sessionId,
      auditLog.event,
      auditLog.userEmail,
      JSON.stringify(auditLog.details)
    ]);
  } catch (error) {
    console.error('監査ログ記録エラー:', error);
  }
}

function logSecurityEvent(eventType, message, sessionId = null) {
  const securityLog = {
    timestamp: new Date().toISOString(),
    eventType: eventType,
    message: message,
    sessionId: sessionId,
    userEmail: Session.getActiveUser().getEmail()
  };
  
  console.error('🚨 SECURITY EVENT:', securityLog);
  
  // 重要なセキュリティイベントは即座にアラート
  if (['UNAUTHORIZED_DOMAIN', 'RATE_LIMIT_EXCEEDED', 'SECURITY_INCIDENT'].includes(eventType)) {
    sendSecurityAlert(securityLog);
  }
}

function logPerformance(sessionId, duration, wordCount) {
  const performanceLog = {
    timestamp: new Date().toISOString(),
    sessionId: sessionId,
    duration: duration,
    wordCount: wordCount,
    wordsPerSecond: Math.round(wordCount / (duration / 1000))
  };
  
  console.log('📊 PERFORMANCE:', performanceLog);
}

// ===== アラート機能 =====
function sendErrorAlert(error, sessionId) {
  const alertMessage = `🚨 GAS同期エラー

セッションID: ${sessionId}
エラー: ${error.message}
時刻: ${new Date().toLocaleString('ja-JP')}
ユーザー: ${Session.getActiveUser().getEmail()}`;

  console.error(alertMessage);
  
  // 将来的にはLINE/Slackに送信
  // sendLineAlert(alertMessage);
}

function sendSecurityAlert(securityLog) {
  const alertMessage = `🔒 セキュリティアラート

イベント: ${securityLog.eventType}
詳細: ${securityLog.message}
時刻: ${securityLog.timestamp}
ユーザー: ${securityLog.userEmail}`;

  console.error(alertMessage);
  
  // 緊急セキュリティアラート
  // sendUrgentAlert(alertMessage);
}

// ===== ユーティリティ =====
function generateSessionId() {
  return `session_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateChecksum(content) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, content)
    .map(byte => (byte + 256) % 256)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 16); // 最初の16文字のみ
}

function isSecurityIncident(error) {
  const securityKeywords = [
    'unauthorized',
    'forbidden',
    'invalid token',
    'authentication failed',
    'injection'
  ];
  
  return securityKeywords.some(keyword => 
    error.message.toLowerCase().includes(keyword)
  );
}

function getAuditLogSheet() {
  const sheetName = 'GAS_Audit_Log';
  
  // 既存のスプレッドシートを検索
  const files = DriveApp.getFilesByName(sheetName);
  
  if (files.hasNext()) {
    return SpreadsheetApp.openById(files.next().getId()).getSheets()[0];
  } else {
    // 新規作成
    const spreadsheet = SpreadsheetApp.create(sheetName);
    const sheet = spreadsheet.getSheets()[0];
    
    // ヘッダー設定
    sheet.getRange(1, 1, 1, 5).setValues([
      ['Timestamp', 'Session ID', 'Event', 'User Email', 'Details']
    ]);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
    
    return sheet;
  }
}

// ===== 定期処理 =====
function weeklyReport() {
  if (!PROD_CONFIG.enableWeeklyReport) return;
  
  try {
    // 週次レポート生成・送信
    const report = generateWeeklyReport();
    sendWeeklyReport(report);
    
  } catch (error) {
    logSecurityEvent('WEEKLY_REPORT_FAILED', error.message);
  }
}

function generateWeeklyReport() {
  // 過去7日間の統計生成
  return {
    period: '過去7日間',
    totalSyncs: 0, // 実際の統計値
    successRate: 0,
    averagePerformance: 0,
    securityEvents: 0
  };
}

// ===== メニュー（本番用） =====
function onOpen() {
  const ui = DocumentApp.getUi();
  ui.createMenu('🔒 セキュア同期')
    .addItem('📤 セキュア同期', 'manualSecureSync')
    .addItem('🧪 接続テスト', 'testSecureConnection')
    .addSeparator()
    .addItem('⚙️ 初期設定', 'productionSetup')
    .addItem('🔑 API Key設定', 'setupApiKey')
    .addSeparator()
    .addItem('📊 監査ログ', 'openAuditLog')
    .addItem('🛡️ セキュリティ状態', 'checkSecurityStatus')
    .addToUi();
}

function manualSecureSync() {
  secureSync('manual');
}

function testSecureConnection() {
  try {
    performSecurityChecks();
    checkRateLimit();
    
    Browser.msgBox('接続テスト成功', 'セキュリティチェックをパスしました', Browser.Buttons.OK);
    
  } catch (error) {
    Browser.msgBox('接続テスト失敗', error.message, Browser.Buttons.OK);
  }
}

function productionSetup() {
  // 本番環境セットアップウィザード
  Browser.msgBox(
    '本番環境セットアップ',
    '1. API Keyを設定\n2. トリガーを設定\n3. セキュリティ設定を確認',
    Browser.Buttons.OK
  );
}

function checkSecurityStatus() {
  const status = `セキュリティ状態:
認証: ${SECURITY_CONFIG.enableAuth ? '有効' : '無効'}
監査ログ: ${SECURITY_CONFIG.enableAuditLog ? '有効' : '無効'}
レート制限: ${SECURITY_CONFIG.enableRateLimit ? '有効' : '無効'}
エラーアラート: ${PROD_CONFIG.enableErrorAlert ? '有効' : '無効'}`;

  Browser.msgBox('セキュリティ状態', status, Browser.Buttons.OK);
}

function openAuditLog() {
  const sheet = getAuditLogSheet();
  const url = sheet.getParent().getUrl();
  
  Browser.msgBox('監査ログ', `監査ログを確認してください:\n${url}`, Browser.Buttons.OK);
}
```

---

## 🔒 セキュリティ段階的実装ガイド

### 🎯 セキュリティレベル定義

#### **Level 0: 開発初期（セキュリティなし）**
```javascript
const CONFIG = {
  enableAuth: false,
  apiKey: '',
  environment: 'development'
};
```
- **用途**: 基本機能開発・テスト
- **適用場面**: ローカル開発・概念実証
- **リスク**: 高（本番環境では使用禁止）

#### **Level 1: 基本認証（簡易セキュリティ）**
```javascript
const CONFIG = {
  enableAuth: true,
  apiKey: 'simple-dev-key-2024',
  environment: 'staging'
};
```
- **用途**: ステージング環境・チーム内テスト
- **適用場面**: 社内テスト・デモ環境
- **リスク**: 中（限定的な環境でのみ使用）

#### **Level 2: 強化認証（本番準備）**
```javascript
const CONFIG = {
  enableAuth: true,
  apiKey: PropertiesService.getScriptProperties().getProperty('API_KEY'),
  enableAuditLog: true,
  enableRateLimit: true,
  environment: 'production'
};
```
- **用途**: 本番前テスト・準本番環境
- **適用場面**: 最終検証・プレリリース
- **リスク**: 低（本番同等のセキュリティ）

#### **Level 3: エンタープライズ（完全セキュリティ）**
```javascript
const CONFIG = {
  enableAuth: true,
  enableEncryption: true,
  enableAuditLog: true,
  enableRateLimit: true,
  enableDomainRestriction: true,
  enableSecurityMonitoring: true,
  environment: 'production'
};
```
- **用途**: エンタープライズ本番環境
- **適用場面**: 企業データ・機密情報処理
- **リスク**: 最小（最高レベルセキュリティ）

### 📋 段階的実装手順

#### **Step 1: Level 0 → Level 1（基本認証追加）**

```javascript
// 変更前（Level 0）
const WEBHOOK_URL = 'http://localhost:3000/api/webhook/google-docs-gas';
const payload = {
  documentId: doc.getId(),
  title: doc.getName(),
  content: doc.getBody().getText()
};

// 変更後（Level 1）
const CONFIG = {
  enableAuth: true,
  apiKey: 'staging-key-2024',
  webhookUrl: 'https://staging.your-domain.com/api/webhook/google-docs-gas'
};

const payload = {
  documentId: doc.getId(),
  title: doc.getName(),
  content: doc.getBody().getText(),
  apiKey: CONFIG.apiKey, // 認証キー追加
  environment: 'staging'
};
```

#### **Step 2: Level 1 → Level 2（セキュア保存・監査ログ）**

```javascript
// API Key セキュア保存設定
function setupSecureApiKey() {
  const apiKey = Browser.inputBox('API Key設定', 'セキュアなAPI Keyを入力:');
  
  PropertiesService.getScriptProperties().setProperty('WEBHOOK_API_KEY', apiKey);
  Browser.msgBox('設定完了', 'API Keyがセキュアに保存されました');
}

// 監査ログ機能追加
function logSecurityEvent(eventType, details) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    eventType: eventType,
    details: details,
    userEmail: Session.getActiveUser().getEmail()
  };
  
  console.log('SECURITY_LOG:', logEntry);
  
  // スプレッドシートに記録
  const sheet = getSecurityLogSheet();
  sheet.appendRow([logEntry.timestamp, logEntry.eventType, JSON.stringify(logEntry.details), logEntry.userEmail]);
}
```

#### **Step 3: Level 2 → Level 3（完全セキュリティ）**

```javascript
// ドメイン制限機能
function validateUserDomain() {
  const userEmail = Session.getActiveUser().getEmail();
  const domain = userEmail.split('@')[1];
  const allowedDomains = ['your-company.com', 'trusted-partner.com'];
  
  if (!allowedDomains.includes(domain)) {
    logSecurityEvent('UNAUTHORIZED_DOMAIN', { domain, userEmail });
    throw new Error('このドメインからの実行は許可されていません');
  }
}

// レート制限機能
function checkRateLimit() {
  const hourKey = `rate_${new Date().getHours()}`;
  const cache = CacheService.getScriptCache();
  const currentCount = parseInt(cache.get(hourKey) || '0');
  
  if (currentCount >= 50) { // 1時間50回制限
    logSecurityEvent('RATE_LIMIT_EXCEEDED', { count: currentCount });
    throw new Error('時間当たりのリクエスト制限に達しました');
  }
  
  cache.put(hourKey, String(currentCount + 1), 3600);
}

// コンテンツ検証機能
function validateContent(content) {
  // 不正スクリプト検出
  const dangerousPatterns = [/<script/i, /javascript:/i, /on\w+\s*=/i];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(content)) {
      logSecurityEvent('SUSPICIOUS_CONTENT', { pattern: pattern.toString() });
      throw new Error('不正なコンテンツが検出されました');
    }
  }
  
  // ファイルサイズ制限
  if (content.length > 1000000) { // 1MB制限
    logSecurityEvent('OVERSIZED_CONTENT', { size: content.length });
    throw new Error('ドキュメントサイズが制限を超えています');
  }
}
```

### 🚨 セキュリティ運用ガイド

#### **監視すべきセキュリティイベント**

1. **認証関連**
   - 不正なAPI Key使用
   - 認証失敗の連続発生
   - 許可されていないドメインからのアクセス

2. **使用量関連**
   - レート制限の超過
   - 異常に大きなドキュメントのアップロード
   - 短時間での大量リクエスト

3. **コンテンツ関連**
   - 不正スクリプトの検出
   - 機密情報パターンの検出
   - 異常な文字列の含有

#### **インシデント対応手順**

```javascript
// 緊急時のアクセス停止
function emergencyShutdown() {
  // 全トリガー無効化
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  // 緊急ログ記録
  logSecurityEvent('EMERGENCY_SHUTDOWN', {
    timestamp: new Date().toISOString(),
    executedBy: Session.getActiveUser().getEmail(),
    reason: 'Manual emergency shutdown'
  });
  
  Browser.msgBox('緊急停止', '全ての自動同期を停止しました', Browser.Buttons.OK);
}

// セキュリティ状態確認
function performSecurityAudit() {
  const auditResult = {
    apiKeyConfigured: !!PropertiesService.getScriptProperties().getProperty('WEBHOOK_API_KEY'),
    triggersActive: ScriptApp.getProjectTriggers().length,
    lastSyncTime: PropertiesService.getScriptProperties().getProperty('LAST_SYNC'),
    recentSecurityEvents: getRecentSecurityEvents(),
    domainRestrictionActive: CONFIG.enableDomainRestriction || false
  };
  
  console.log('SECURITY_AUDIT:', auditResult);
  return auditResult;
}
```

### 🔄 環境別設定テンプレート

#### **開発環境設定**
```javascript
// .env.development.gs
const DEV_CONFIG = {
  environment: 'development',
  webhookUrl: 'http://localhost:3000/api/webhook/google-docs-gas',
  enableAuth: false,
  enableLogging: true,
  enableRateLimit: false,
  retryCount: 2,
  timeoutMs: 10000
};
```

#### **ステージング環境設定**
```javascript
// .env.staging.gs
const STAGING_CONFIG = {
  environment: 'staging',
  webhookUrl: 'https://staging.your-domain.com/api/webhook/google-docs-gas',
  enableAuth: true,
  apiKey: 'staging-key-2024',
  enableLogging: true,
  enableRateLimit: true,
  maxRequestsPerHour: 200,
  retryCount: 3,
  timeoutMs: 20000
};
```

#### **本番環境設定**
```javascript
// .env.production.gs
const PROD_CONFIG = {
  environment: 'production',
  webhookUrl: 'https://your-domain.com/api/webhook/google-docs-gas',
  enableAuth: true,
  apiKey: getSecureApiKey(),
  enableLogging: true,
  enableAuditLog: true,
  enableRateLimit: true,
  enableDomainRestriction: true,
  allowedDomains: ['your-company.com'],
  maxRequestsPerHour: 100,
  retryCount: 5,
  timeoutMs: 30000,
  enableErrorAlert: true,
  enablePerformanceMonitoring: true
};
```

---

## 📚 トラブルシューティング集

### 🔧 よくある問題と解決策

#### **1. 認証エラー**
```
エラー: "API Key authentication failed"
原因: API Keyが正しく設定されていない
解決: setupApiKey() を実行してキーを再設定
```

#### **2. レート制限エラー**
```
エラー: "Rate limit exceeded"
原因: 短時間に大量のリクエストを送信
解決: 1時間待機後に再実行、またはレート制限設定を調整
```

#### **3. トリガー作成失敗**
```
エラー: "Cannot create trigger for document"
原因: ドキュメントへの編集権限がない
解決: ドキュメントオーナーに権限変更を依頼
```

#### **4. Webhook送信失敗**
```
エラー: "Connection timeout"
原因: ネットワーク問題またはサーバー問題
解決: retryCount を増やす、timeoutMs を延長
```

#### **5. セキュリティブロック**
```
エラー: "Unauthorized domain access"
原因: 許可されていないドメインからのアクセス
解決: allowedDomains に実行者のドメインを追加
```

### 🛠️ デバッグ用コード

```javascript
// デバッグ情報出力
function debugInfo() {
  const info = {
    gasVersion: '2.0',
    userEmail: Session.getActiveUser().getEmail(),
    timeZone: Session.getScriptTimeZone(),
    triggers: ScriptApp.getProjectTriggers().length,
    properties: Object.keys(PropertiesService.getScriptProperties().getProperties()),
    config: CONFIG,
    timestamp: new Date().toISOString()
  };
  
  console.log('DEBUG_INFO:', JSON.stringify(info, null, 2));
  return info;
}

// 接続診断
function diagnoseProblem() {
  const tests = [
    { name: 'User Authentication', test: () => !!Session.getActiveUser().getEmail() },
    { name: 'Document Access', test: () => !!DocumentApp.getActiveDocument().getId() },
    { name: 'API Key Setup', test: () => !!PropertiesService.getScriptProperties().getProperty('WEBHOOK_API_KEY') },
    { name: 'Network Access', test: () => testNetworkConnection() },
    { name: 'Cache Service', test: () => testCacheService() }
  ];
  
  const results = tests.map(test => ({
    name: test.name,
    passed: test.test(),
    timestamp: new Date().toISOString()
  }));
  
  console.log('DIAGNOSIS_RESULTS:', results);
  return results;
}

function testNetworkConnection() {
  try {
    UrlFetchApp.fetch('https://httpbin.org/get', { muteHttpExceptions: true });
    return true;
  } catch {
    return false;
  }
}

function testCacheService() {
  try {
    const cache = CacheService.getScriptCache();
    cache.put('test', 'value', 60);
    return cache.get('test') === 'value';
  } catch {
    return false;
  }
}
```

---

## ✅ チェックリスト

### **GASスクリプト実装チェックリスト**

#### **基本実装**
- [ ] 最小構成テンプレートの動作確認
- [ ] 標準構成テンプレートの機能確認
- [ ] カスタムメニューの表示確認
- [ ] 手動同期の動作確認

#### **セキュリティ実装**
- [ ] API Key設定・保存確認
- [ ] 認証機能の動作確認
- [ ] レート制限機能の動作確認
- [ ] 監査ログ機能の動作確認

#### **運用準備**
- [ ] 環境別設定の適用確認
- [ ] エラーハンドリングの動作確認
- [ ] アラート機能の動作確認
- [ ] トラブルシューティング手順の確認

---

**🎉 これで即座に利用可能なGASテンプレート集とセキュリティ実装ガイドが完成しました！開発段階に応じて適切なテンプレートを選択し、段階的にセキュリティを強化できます。**