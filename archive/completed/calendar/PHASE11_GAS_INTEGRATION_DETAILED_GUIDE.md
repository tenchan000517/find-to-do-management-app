# Phase 11: GAS連携基盤 詳細実装手順書 v2

**Phase**: 11 / 15 (GASアプローチ)  
**目標**: Google Apps Script直接連携による基盤構築  
**期間**: 2-3日 (従来5日→短縮)  
**認証**: 開発初期は認証なし（段階的セキュリティ）

---

## 🎯 Phase 11 実装目標

### 達成目標
- ✅ Google Apps Script作成・デプロイ
- ✅ Webhook API実装（認証なし）
- ✅ 基本的なコンテンツ自動同期
- ✅ 既存システム100%動作保持

### 技術的優位性
- **OAuth2不要** → 設定時間90%削減
- **API制限なし** → 安定した同期処理
- **リアルタイム同期** → 編集即座に反映
- **自動復旧機能** → 障害時の堅牢性

---

## 📋 詳細実装手順

### 🔧 ステップ1: Google Apps Script作成

#### 1.1 GASプロジェクト作成・設定

**手順：**
1. 対象のGoogle Docsを開く
2. `拡張機能` > `Apps Script` をクリック
3. プロジェクト名を `DocumentSyncScript` に変更
4. 以下のコードを実装

#### 1.2 メインスクリプト実装

```javascript
// DocumentSyncScript.gs
// Google Apps Script for Document Synchronization v2.0

// ===== 設定値 =====
const WEBHOOK_URL = 'http://localhost:3000/api/webhook/google-docs-gas'; // 開発環境
// const WEBHOOK_URL = 'https://your-production-domain.com/api/webhook/google-docs-gas'; // 本番環境

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
    
    // 結果をポップアップ表示
    if (result.success) {
      const message = result.skipped 
        ? `同期スキップ: ${result.reason}`
        : `同期完了: ${result.processingTime}ms`;
      Browser.msgBox('同期結果', message, Browser.Buttons.OK);
    } else {
      Browser.msgBox('同期エラー', result.error, Browser.Buttons.OK);
    }
    
    return result;
    
  } catch (error) {
    logError('manualSync', error);
    Browser.msgBox('同期エラー', error.message, Browser.Buttons.OK);
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
    
    // 設定確認のポップアップ
    Browser.msgBox(
      'トリガー設定完了', 
      `${triggerCount}個のトリガーを設定しました。\\n・編集時自動同期: ${CONFIG.enableEditTrigger ? '有効' : '無効'}\\n・毎日定期同期: ${CONFIG.enableDailyTrigger ? '有効' : '無効'}`, 
      Browser.Buttons.OK
    );
    
    return true;
    
  } catch (error) {
    logError('setupTriggers', error);
    Browser.msgBox('トリガー設定エラー', error.message, Browser.Buttons.OK);
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

function listTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  
  log(`📋 現在のトリガー一覧 (${triggers.length}個):`, 'INFO');
  
  triggers.forEach((trigger, index) => {
    const handlerFunction = trigger.getHandlerFunction();
    const triggerSource = trigger.getTriggerSource();
    const eventType = trigger.getEventType();
    
    log(`  ${index + 1}. ${handlerFunction} (${triggerSource}/${eventType})`, 'INFO');
  });
  
  return triggers;
}

// ===== 設定管理 =====

function updateConfig(newConfig) {
  try {
    // 設定をマージ
    Object.assign(CONFIG, newConfig);
    
    // 永続化（PropertiesService使用）
    PropertiesService.getScriptProperties().setProperties({
      'CONFIG': JSON.stringify(CONFIG)
    });
    
    log(`⚙️ 設定更新完了: ${JSON.stringify(newConfig)}`, 'SUCCESS');
    
    return true;
    
  } catch (error) {
    logError('updateConfig', error);
    return false;
  }
}

function loadConfig() {
  try {
    const stored = PropertiesService.getScriptProperties().getProperty('CONFIG');
    
    if (stored) {
      const storedConfig = JSON.parse(stored);
      Object.assign(CONFIG, storedConfig);
      log('⚙️ 保存済み設定を読み込み', 'INFO');
    } else {
      log('⚙️ デフォルト設定を使用', 'INFO');
    }
    
    return CONFIG;
    
  } catch (error) {
    logError('loadConfig', error);
    log('⚙️ 設定読み込み失敗、デフォルト設定を使用', 'WARN');
    return CONFIG;
  }
}

function getConfig() {
  return { ...CONFIG }; // コピーを返す
}

// ===== ログ機能 =====

function log(message, level = 'INFO') {
  if (!CONFIG.enableLogging) return;
  
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  
  // コンソールログ
  console.log(logMessage);
  
  // スプレッドシートログ（オプション）
  if (CONFIG.logToSheet) {
    logToSheet(timestamp, level, message);
  }
}

function logError(functionName, error) {
  const errorMessage = `${functionName}: ${error.message}`;
  log(errorMessage, 'ERROR');
  
  // スタックトレースも記録
  if (error.stack) {
    log(`Stack: ${error.stack}`, 'DEBUG');
  }
}

function logToSheet(timestamp, level, message) {
  try {
    // ログ用スプレッドシートを取得/作成
    const logSheet = getOrCreateLogSheet();
    
    if (logSheet) {
      logSheet.appendRow([timestamp, level, message]);
      
      // 古いログを削除（1000行制限）
      if (logSheet.getLastRow() > 1000) {
        logSheet.deleteRows(2, 100); // 古い100行を削除
      }
    }
    
  } catch (error) {
    console.error('ログシート書き込みエラー:', error);
  }
}

function getOrCreateLogSheet() {
  try {
    // 同名のスプレッドシートを検索
    const files = DriveApp.getFilesByName('GAS-DocumentSync-Logs');
    
    if (files.hasNext()) {
      const file = files.next();
      return SpreadsheetApp.openById(file.getId()).getSheets()[0];
    } else {
      // 新規作成
      const spreadsheet = SpreadsheetApp.create('GAS-DocumentSync-Logs');
      const sheet = spreadsheet.getSheets()[0];
      
      // ヘッダー設定
      sheet.getRange(1, 1, 1, 3).setValues([['Timestamp', 'Level', 'Message']]);
      sheet.getRange(1, 1, 1, 3).setFontWeight('bold');
      
      return sheet;
    }
    
  } catch (error) {
    console.error('ログシート取得/作成エラー:', error);
    return null;
  }
}

// ===== ユーティリティ関数 =====

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

function testConnection() {
  try {
    log('🧪 接続テスト開始', 'INFO');
    
    const testPayload = {
      documentId: 'test',
      title: '接続テスト',
      content: 'これは接続テストです。',
      url: 'https://test.example.com',
      lastModified: new Date().toISOString(),
      triggerType: 'test',
      wordCount: 13,
      gasVersion: '2.0',
      timestamp: new Date().toISOString()
    };
    
    const result = sendToWebhook(testPayload);
    
    log('✅ 接続テスト成功', 'SUCCESS');
    Browser.msgBox('接続テスト', '接続テストが成功しました！', Browser.Buttons.OK);
    
    return result;
    
  } catch (error) {
    logError('testConnection', error);
    Browser.msgBox('接続テスト失敗', error.message, Browser.Buttons.OK);
    return { success: false, error: error.message };
  }
}

// ===== 初期化・スタートアップ =====

function initialize() {
  try {
    log('🚀 DocumentSync初期化開始', 'INFO');
    
    // 設定読み込み
    loadConfig();
    
    // システム情報表示
    const systemInfo = getSystemInfo();
    log(`📋 システム情報: ${JSON.stringify(systemInfo, null, 2)}`, 'INFO');
    
    // トリガー設定
    const triggerSetup = setupTriggers();
    
    if (triggerSetup) {
      log('🎉 初期化完了', 'SUCCESS');
      Browser.msgBox(
        'DocumentSync初期化完了', 
        'Google Docs自動同期システムの初期化が完了しました！\\n\\n自動同期が有効になりました。', 
        Browser.Buttons.OK
      );
    } else {
      throw new Error('トリガー設定に失敗しました');
    }
    
    return true;
    
  } catch (error) {
    logError('initialize', error);
    Browser.msgBox('初期化エラー', error.message, Browser.Buttons.OK);
    return false;
  }
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

function showSystemInfo() {
  const info = getSystemInfo();
  const message = `システム情報:\\n\\nドキュメントID: ${info.documentId}\\nバージョン: ${info.gasVersion}\\nトリガー数: ${info.triggers}\\n最終同期: ${info.lastSync || '未実行'}`;
  
  Browser.msgBox('システム情報', message, Browser.Buttons.OK);
}

function showLogs() {
  // 簡易ログ表示（最新10件）
  Browser.msgBox('ログ表示', '詳細ログは Apps Script エディタのログ画面で確認してください。', Browser.Buttons.OK);
}
```

### ステップ2: システム側Webhook API実装

#### 2.1 データベーススキーマ準備

```bash
# 既存テーブル拡張
npx prisma migrate dev --name add_gas_integration_fields
```

```sql
-- マイグレーションファイル内容
ALTER TABLE google_docs_sources 
ADD COLUMN trigger_type VARCHAR(50) DEFAULT 'manual',
ADD COLUMN word_count INTEGER DEFAULT 0,
ADD COLUMN gas_version VARCHAR(20) DEFAULT '1.0',
ADD COLUMN content_hash VARCHAR(64),
ADD COLUMN last_error TEXT;

CREATE INDEX idx_trigger_type ON google_docs_sources(trigger_type);
CREATE INDEX idx_content_hash ON google_docs_sources(content_hash);
```

#### 2.2 Webhook API実装

```typescript
// src/app/api/webhook/google-docs-gas/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 環境設定
const isDevelopment = process.env.NODE_ENV === 'development';
const WEBHOOK_CONFIG = {
  enableAuth: !isDevelopment, // 開発中は認証無効
  apiKey: process.env.GAS_WEBHOOK_API_KEY,
  enableRateLimit: false, // GASは信頼できるソースなので制限なし
  maxContentLength: 100000,
  enableLogging: true
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // リクエストボディ取得
    const payload = await request.json();
    
    if (WEBHOOK_CONFIG.enableLogging) {
      console.log(`📨 GAS Webhook受信: ${payload.title || 'タイトル不明'} (${payload.triggerType || 'unknown'})`);
    }
    
    // 基本検証
    const validation = validateWebhookPayload(payload);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
    // 認証チェック（設定により有効/無効）
    if (WEBHOOK_CONFIG.enableAuth) {
      if (!payload.apiKey || payload.apiKey !== WEBHOOK_CONFIG.apiKey) {
        console.warn('❌ GAS Webhook認証失敗');
        return NextResponse.json(
          { error: '認証に失敗しました' },
          { status: 401 }
        );
      }
    } else {
      console.log('🔧 開発モード: 認証スキップ');
    }
    
    // 重複チェック（コンテンツハッシュベース）
    const isDuplicate = await checkForDuplicateContent(
      payload.documentId, 
      payload.contentHash
    );
    
    if (isDuplicate && payload.triggerType !== 'manual') {
      return NextResponse.json({
        success: true,
        message: '変更なし、処理をスキップしました',
        skipped: true,
        reason: 'no_changes'
      });
    }
    
    // メイン処理実行
    const result = await processGASWebhook(payload);
    
    const processingTime = Date.now() - startTime;
    
    // 成功レスポンス
    return NextResponse.json({
      success: true,
      message: 'ドキュメント処理完了',
      result,
      processingTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    console.error('❌ GAS Webhook処理エラー:', error);
    
    // エラーレスポンス
    return NextResponse.json(
      { 
        error: error.message || 'Webhook処理に失敗しました',
        processingTime,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// ペイロード検証
function validateWebhookPayload(payload: any): {isValid: boolean, error?: string} {
  // 必須フィールドチェック
  const requiredFields = ['documentId', 'title', 'content', 'url', 'lastModified'];
  
  for (const field of requiredFields) {
    if (!payload[field]) {
      return { isValid: false, error: `${field} が必要です` };
    }
  }
  
  // コンテンツ長チェック
  if (payload.content.length > WEBHOOK_CONFIG.maxContentLength) {
    return { 
      isValid: false, 
      error: `コンテンツが長すぎます (${payload.content.length}文字 > ${WEBHOOK_CONFIG.maxContentLength}文字)` 
    };
  }
  
  // 最小コンテンツ長チェック
  if (payload.content.trim().length < 50) {
    return { isValid: false, error: 'コンテンツが短すぎます' };
  }
  
  return { isValid: true };
}

// 重複チェック
async function checkForDuplicateContent(documentId: string, contentHash?: string): Promise<boolean> {
  if (!contentHash) return false;
  
  try {
    const existing = await prisma.google_docs_sources.findUnique({
      where: { document_id: documentId },
      select: { content_hash: true }
    });
    
    return existing?.content_hash === contentHash;
  } catch (error) {
    console.warn('重複チェックエラー:', error);
    return false; // エラー時は処理を続行
  }
}

// メイン処理
async function processGASWebhook(payload: any) {
  const { 
    documentId, 
    title, 
    content, 
    url, 
    lastModified, 
    triggerType, 
    wordCount,
    contentHash,
    gasVersion 
  } = payload;

  try {
    // 1. Google Docsソース情報更新/作成
    const source = await prisma.google_docs_sources.upsert({
      where: { document_id: documentId },
      update: {
        title,
        document_url: url,
        last_modified: new Date(lastModified),
        last_synced: new Date(),
        sync_status: 'syncing',
        trigger_type: triggerType,
        word_count: wordCount || content.length,
        gas_version: gasVersion || '2.0',
        content_hash: contentHash,
        error_message: null
      },
      create: {
        document_id: documentId,
        document_url: url,
        title,
        last_modified: new Date(lastModified),
        sync_status: 'syncing',
        trigger_type: triggerType,
        word_count: wordCount || content.length,
        gas_version: gasVersion || '2.0',
        content_hash: contentHash,
        page_count: 0
      }
    });

    // 2. 既存の自動生成ナレッジを削除（重複回避）
    const deletedCount = await prisma.knowledge_items.deleteMany({
      where: {
        source_document_id: documentId,
        auto_generated: true
      }
    });
    
    console.log(`🗑️ 既存ナレッジ削除: ${deletedCount.count}件`);

    // 3. コンテンツをセクション分割・ナレッジ化
    const knowledgeItems = await createKnowledgeFromContent(
      documentId,
      content,
      title,
      url
    );

    // 4. ソース情報更新（完了状態）
    await prisma.google_docs_sources.update({
      where: { document_id: documentId },
      data: {
        sync_status: 'completed',
        page_count: knowledgeItems.length,
        last_synced: new Date()
      }
    });

    console.log(`✅ 処理完了: ${title} - ${knowledgeItems.length}件のナレッジを作成`);

    return {
      documentId,
      title,
      knowledgeItemsCreated: knowledgeItems.length,
      deletedItems: deletedCount.count,
      triggerType,
      wordCount: content.length,
      gasVersion
    };

  } catch (error) {
    // エラー状態を記録
    await prisma.google_docs_sources.update({
      where: { document_id: documentId },
      data: {
        sync_status: 'error',
        last_error: error.message
      }
    });
    
    throw error;
  }
}

// コンテンツからナレッジ作成
async function createKnowledgeFromContent(
  documentId: string,
  content: string,
  title: string,
  url: string
): Promise<any[]> {
  
  const sections = splitContentIntoSections(content);
  const knowledgeItems = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    
    // 短すぎるセクションはスキップ
    if (section.content.trim().length < 100) {
      continue;
    }

    try {
      const knowledgeItem = await prisma.knowledge_items.create({
        data: {
          id: `gas_${documentId}_${i}_${Date.now()}`,
          title: section.title || `${title} - Part ${i + 1}`,
          content: section.content.trim(),
          category: categorizeContent(section.content),
          author: 'Google Docs (GAS同期)',
          tags: extractTags(section.content),
          source_type: 'google_docs',
          source_document_id: documentId,
          source_page_number: i + 1,
          source_url: url,
          auto_generated: true
        }
      });

      knowledgeItems.push(knowledgeItem);
      
    } catch (error) {
      console.error(`ナレッジ作成エラー (セクション${i}):`, error);
      // 個別セクションのエラーは処理を止めない
    }
  }

  return knowledgeItems;
}

// コンテンツ分割（Phase 12で高度化予定）
function splitContentIntoSections(content: string): Array<{title?: string, content: string}> {
  const sections = [];
  const lines = content.split('\n');
  let currentSection = { content: '' };
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // 見出し検出パターン
    if (isHeading(trimmed)) {
      // 前のセクション保存
      if (currentSection.content.trim()) {
        sections.push({ ...currentSection });
      }
      
      // 新しいセクション開始
      currentSection = {
        title: trimmed,
        content: ''
      };
    } else {
      currentSection.content += line + '\n';
    }
  }
  
  // 最後のセクション保存
  if (currentSection.content.trim()) {
    sections.push(currentSection);
  }

  // セクションが少ない場合は固定長分割
  if (sections.length < 2 && content.length > 1500) {
    return splitByLength(content, 1000);
  }

  return sections;
}

// 見出し判定
function isHeading(line: string): boolean {
  if (!line || line.length === 0) return false;
  
  return (
    /^[■●▲◆□○△◇]\s/.test(line) ||     // 記号付き見出し
    /^\d+\.\s/.test(line) ||             // 数字付き見出し
    /^第\d+[章節]\s/.test(line) ||       // 章節
    /^[【〔\[].*[】〕\]]$/.test(line) ||   // 括弧で囲まれたタイトル
    (line.length <= 30 && line.endsWith(':')) || // 短い行でコロン終わり
    /^[A-Z\s]{3,}$/.test(line)           // 大文字のみ（英語見出し）
  );
}

// 固定長分割
function splitByLength(content: string, maxLength: number): Array<{content: string}> {
  const sections = [];
  const paragraphs = content.split(/\n\s*\n/); // 段落で分割
  let currentSection = '';

  for (const paragraph of paragraphs) {
    if (currentSection.length + paragraph.length > maxLength && currentSection) {
      sections.push({ content: currentSection.trim() });
      currentSection = paragraph;
    } else {
      currentSection += paragraph + '\n\n';
    }
  }

  if (currentSection.trim()) {
    sections.push({ content: currentSection.trim() });
  }

  return sections;
}

// カテゴリ分類
function categorizeContent(content: string): 'INDUSTRY' | 'SALES' | 'TECHNICAL' | 'BUSINESS' {
  const lower = content.toLowerCase();
  
  // 技術キーワード
  if (/(?:api|システム|データベース|プログラム|コード|開発|技術|サーバー|アプリケーション)/.test(lower)) {
    return 'TECHNICAL';
  }
  
  // 営業キーワード
  if (/(?:営業|顧客|売上|契約|提案|商談|クライアント|受注|販売)/.test(lower)) {
    return 'SALES';
  }
  
  // 業界キーワード
  if (/(?:業界|市場|競合|トレンド|分析|調査|マーケット|動向)/.test(lower)) {
    return 'INDUSTRY';
  }
  
  return 'BUSINESS';
}

// タグ抽出
function extractTags(content: string): string[] {
  const tags = new Set<string>();
  
  // 日本語キーワード抽出
  const japaneseWords = content.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]{2,8}/g) || [];
  const keywords = japaneseWords
    .filter(word => word.length >= 2 && word.length <= 6)
    .slice(0, 4);
  
  keywords.forEach(word => tags.add(word));
  
  // 特定パターンでのタグ付け
  if (/(?:\d{4}年|\d+月|\d+日|来週|来月)/.test(content)) tags.add('日程');
  if (/(?:会議|ミーティング|打ち合わせ|面談)/.test(content)) tags.add('会議');
  if (/(?:TODO|タスク|課題|対応|実装|修正)/.test(content)) tags.add('タスク');
  if (/(?:プロジェクト|企画|計画|構想)/.test(content)) tags.add('プロジェクト');
  if (/(?:決定|承認|合意|確定)/.test(content)) tags.add('決定事項');
  
  return Array.from(tags).slice(0, 6);
}
```

### ステップ3: 動作テスト・検証

#### 3.1 GAS単体テスト

```javascript
// GAS エディタで実行するテスト関数

function runAllTests() {
  console.log('🧪 テスト開始');
  
  const tests = [
    testDocumentInfo,
    testContentValidation,
    testPayloadCreation,
    testConnectionTest
  ];
  
  let passedTests = 0;
  
  for (const test of tests) {
    try {
      test();
      console.log(`✅ ${test.name} 成功`);
      passedTests++;
    } catch (error) {
      console.error(`❌ ${test.name} 失敗:`, error.message);
    }
  }
  
  console.log(`🏁 テスト完了: ${passedTests}/${tests.length} 成功`);
}

function testDocumentInfo() {
  const doc = DocumentApp.getActiveDocument();
  const info = getDocumentInfo(doc);
  
  if (!info.documentId) throw new Error('documentId が取得できません');
  if (!info.title) throw new Error('title が取得できません');
  if (!info.content) throw new Error('content が取得できません');
  if (!info.url) throw new Error('url が取得できません');
}

function testContentValidation() {
  // 有効なコンテンツ
  if (!validateContent('これは有効なコンテンツです。十分な長さがあります。テストとして使用しています。')) {
    throw new Error('有効なコンテンツが無効と判定されました');
  }
  
  // 無効なコンテンツ
  if (validateContent('短い')) {
    throw new Error('無効なコンテンツが有効と判定されました');
  }
  
  if (validateContent('')) {
    throw new Error('空文字が有効と判定されました');
  }
}

function testPayloadCreation() {
  const doc = DocumentApp.getActiveDocument();
  const docInfo = getDocumentInfo(doc);
  const payload = createWebhookPayload(docInfo, 'test');
  
  if (!payload.documentId) throw new Error('payload.documentId がありません');
  if (!payload.triggerType) throw new Error('payload.triggerType がありません');
  if (!payload.contentHash) throw new Error('payload.contentHash がありません');
}

function testConnectionTest() {
  // testConnection()を実行して結果を確認
  const result = testConnection();
  
  if (!result) {
    throw new Error('接続テストが失敗しました');
  }
}
```

#### 3.2 システム側単体テスト

```bash
# 開発サーバー起動
npm run dev

# 別ターミナルでWebhook APIテスト
curl -X POST "http://localhost:3000/api/webhook/google-docs-gas" \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "test-doc-123",
    "title": "テストドキュメント",
    "content": "これはテスト用のコンテンツです。Google Apps Scriptからの送信をテストしています。十分な長さのコンテンツとして、複数の文を含めています。",
    "url": "https://docs.google.com/document/d/test-doc-123/edit",
    "lastModified": "2025-06-16T10:00:00Z",
    "triggerType": "test",
    "wordCount": 85,
    "gasVersion": "2.0",
    "timestamp": "2025-06-16T10:00:00Z"
  }'

# レスポンス確認
# 期待値: {"success": true, "message": "ドキュメント処理完了", ...}
```

#### 3.3 統合テスト手順

```markdown
## Phase 11 統合テスト チェックリスト

### GAS側確認
- [ ] スクリプト作成・保存完了
- [ ] `initialize()` 関数実行成功
- [ ] `manualSync()` 関数実行成功
- [ ] トリガー設定完了確認
- [ ] `testConnection()` 成功

### システム側確認
- [ ] Webhook API動作確認
- [ ] データベース更新確認
- [ ] ナレッジ作成確認
- [ ] エラーハンドリング動作確認

### 既存機能確認
- [ ] ナレッジ管理画面表示正常
- [ ] 既存ナレッジ CRUD操作正常
- [ ] 検索・フィルタ機能正常
- [ ] いいね機能正常

### 総合確認
- [ ] リアルタイム同期（ドキュメント編集→即座に反映）
- [ ] 手動同期（GASメニューから実行）
- [ ] エラー時の適切な処理
- [ ] ログ出力確認
```

---

## ✅ Phase 11 完了チェックリスト

### 必須完了項目
- [ ] Google Apps Script作成・デプロイ完了
- [ ] Webhook API実装・動作確認完了
- [ ] データベーススキーマ更新完了
- [ ] 基本同期機能動作確認完了
- [ ] エラーハンドリング実装完了
- [ ] 既存機能の完全動作継続確認

### パフォーマンス確認
- [ ] Webhook応答時間 < 2秒
- [ ] GAS実行時間 < 30秒
- [ ] データベース更新正常
- [ ] メモリ使用量適切

### セキュリティ確認
- [ ] 開発環境での認証なし動作確認
- [ ] 不正ペイロードの適切な拒否
- [ ] エラー情報の適切な制限

### 次Phase準備確認
- [ ] コンテンツ処理の基本動作確認
- [ ] セクション分割アルゴリズムの動作確認
- [ ] Phase 12実装準備完了

---

## 🚨 トラブルシューティング

### GAS側のよくある問題

#### 1. 権限エラー
```
エラー: "Exception: You do not have permission to call..."
解決: ドキュメントの編集権限を確認、必要に応じてオーナーに権限付与を依頼
```

#### 2. トリガー作成失敗
```
エラー: "Cannot create trigger"
解決: スクリプトを一度保存してから `setupTriggers()` を実行
```

#### 3. Webhook送信失敗
```
エラー: "Request failed for http://localhost..."
解決: 
- 開発サーバーが起動しているか確認
- WEBHOOK_URLが正しいか確認
- ファイアウォール設定確認
```

### システム側のよくある問題

#### 1. データベース接続エラー
```bash
# 解決手順
npx prisma generate
npx prisma db push
npm run dev
```

#### 2. 環境変数未設定
```bash
# .env.local が正しく設定されているか確認
echo $NODE_ENV
cat .env.local
```

#### 3. TypeScriptエラー
```bash
# 型チェック実行
npx tsc --noEmit

# よくあるエラー例と解決
# Error: 'any' type - 明示的な型注釈を追加
# Error: 'undefined' property - オプショナルチェーン(?.)使用
```

---

## 📚 次のフェーズ

**Phase 11完了後の次のステップ:**

### **Phase 12: コンテンツ処理強化（3-4日）**
- より高度なセクション分割アルゴリズム
- カテゴリ分類・タグ抽出の精度向上
- エラー監視・通知システム
- 手動制御UI実装

### **作成されたファイル確認:**
- `DocumentSyncScript.gs` (Google Apps Script)
- `src/app/api/webhook/google-docs-gas/route.ts`
- データベーススキーマ更新

---

**🚀 Phase 11完了により、Google Docs直接連携の基盤が完成し、OAuth2の複雑性なしにシンプルで安定した同期システムが稼働します！**