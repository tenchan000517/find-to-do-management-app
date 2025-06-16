// DocumentSyncScript.gs
// Google Apps Script for Document Synchronization v2.0

// ===== 設定値 =====
const WEBHOOK_URL = 'https://5e83-2402-6b00-da0d-9600-78-397f-ab3d-5949.ngrok-free.app/api/webhook/google-docs-gas'; // ngrok公開URL
// const WEBHOOK_URL = 'http://localhost:3000/api/webhook/google-docs-gas'; // ローカル環境（ngrok使用不可の場合）
// const WEBHOOK_URL = 'https://find-to-do-management-app.vercel.app/api/webhook/google-docs-gas'; // 本番環境

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

// ===== ドキュメント構造分析関数 =====

function analyzeDocumentStructure() {
  try {
    log('📊 ドキュメント構造分析開始', 'INFO');

    const doc = DocumentApp.getActiveDocument();
    const body = doc.getBody();
    const fullText = body.getText();

    // 基本情報
    const basicInfo = {
      documentTitle: doc.getName(),
      documentId: doc.getId(),
      totalCharacters: fullText.length,
      totalLines: fullText.split('\n').length
    };

    // タブ（セクション）解析
    const sections = analyzeDocumentSections(body);

    // 結果の集計
    const analysis = {
      ...basicInfo,
      totalSections: sections.length,
      sections: sections,
      totalSectionCharacters: sections.reduce((sum, section) => sum + section.characterCount, 0)
    };

    // 結果表示
    displayAnalysisResults(analysis);

    return analysis;

  } catch (error) {
    logError('analyzeDocumentStructure', error);
    return null;
  }
}

function analyzeDocumentSections(body) {
  const paragraphs = body.getParagraphs();
  const sections = [];
  let currentSection = null;
  let sectionIndex = 0;

  paragraphs.forEach((para, index) => {
    const text = para.getText().trim();

    // 空行スキップ
    if (!text) return;

    // セクション（タブ）の判定
    if (isSectionHeader(text, index)) {
      // 前のセクションを保存
      if (currentSection) {
        finalizeSectionAnalysis(currentSection);
        sections.push(currentSection);
      }

      // 新しいセクション開始
      sectionIndex++;
      currentSection = {
        sectionNumber: sectionIndex,
        title: text,
        content: '',
        lines: [],
        characterCount: 0,
        lineCount: 0,
        firstLine: '',
        lastLine: '',
        estimatedDate: extractDateFromTitle(text),
        startIndex: index
      };

    } else if (currentSection) {
      // 既存セクションにコンテンツ追加
      currentSection.content += text + '\n';
      currentSection.lines.push(text);
    }
  });

  // 最後のセクション処理
  if (currentSection) {
    finalizeSectionAnalysis(currentSection);
    sections.push(currentSection);
  }

  return sections;
}

function isSectionHeader(text, index) {
  // セクションヘッダーの判定ロジック
  return (
    // 日付パターン
    /^\d{4}[年\/\-]\d{1,2}[月\/\-]\d{1,2}[日]?/.test(text) ||
    /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(text) ||

    // 見出しパターン
    /^[■●▲◆□○△◇]\s/.test(text) ||
    /^\d+\.\s/.test(text) ||
    /^第\d+[章節回]\s/.test(text) ||

    // 会議・イベントパターン
    /会議|ミーティング|打ち合わせ|面談|レビュー/.test(text) ||

    // 括弧タイトル
    /^[【〔\[].*[】〕\]]$/.test(text) ||

    // 短いタイトル行（30文字以下でコロン終わり）
    (text.length <= 30 && text.endsWith(':')) ||

    // 最初の段落は常にセクションとして扱う
    index === 0
  );
}

function extractDateFromTitle(title) {
  // タイトルから日付を抽出
  const datePatterns = [
    /(\d{4})[年\/\-](\d{1,2})[月\/\-](\d{1,2})[日]?/,
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
    /(\d{4})(\d{2})(\d{2})/
  ];

  for (const pattern of datePatterns) {
    const match = title.match(pattern);
    if (match) {
      try {
        const year = match[1].length === 4 ? match[1] : `20${match[1]}`;
        const month = match[2].padStart(2, '0');
        const day = match[3].padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch (e) {
        // 日付解析失敗時は継続
      }
    }
  }

  return null;
}

function finalizeSectionAnalysis(section) {
  section.characterCount = section.content.length;
  section.lineCount = section.lines.length;
  section.firstLine = section.lines[0] || '';
  section.lastLine = section.lines[section.lines.length - 1] || '';

  // プレビュー用の短縮版
  section.contentPreview = section.content.length > 100
    ? section.content.substring(0, 100) + '...'
    : section.content;
}

function displayAnalysisResults(analysis) {
  // コンソールログ出力
  console.log('='.repeat(50));
  console.log('📊 ドキュメント構造分析結果');
  console.log('='.repeat(50));
  console.log(`ドキュメント名: ${analysis.documentTitle}`);
  console.log(`総文字数: ${analysis.totalCharacters}`);
  console.log(`総行数: ${analysis.totalLines}`);
  console.log(`総タブ数: ${analysis.totalSections}`);
  console.log(`セクション合計文字数: ${analysis.totalSectionCharacters}`);
  console.log('');

  // セクション詳細
  analysis.sections.forEach((section, index) => {
    console.log(`--- タブ ${index + 1} ---`);
    console.log(`タイトル: ${section.title}`);
    console.log(`推定日付: ${section.estimatedDate || '不明'}`);
    console.log(`文字数: ${section.characterCount}`);
    console.log(`行数: ${section.lineCount}`);
    console.log(`最初の行: ${section.firstLine.substring(0, 50)}${section.firstLine.length > 50 ? '...' : ''}`);
    console.log(`最後の行: ${section.lastLine.substring(0, 50)}${section.lastLine.length > 50 ? '...' : ''}`);
    console.log('');
  });

  // UI表示（可能な場合）
  const summaryMessage = createSummaryMessage(analysis);

  if (typeof DocumentApp !== 'undefined' && DocumentApp.getUi) {
    try {
      DocumentApp.getUi().alert('ドキュメント構造分析', summaryMessage);
    } catch (uiError) {
      log('UI表示エラー（無視可能）: ' + uiError.message, 'WARN');
    }
  }

  log(`構造分析完了: ${summaryMessage}`, 'SUCCESS');
}

function createSummaryMessage(analysis) {
  let message = `📊 構造分析結果\n\n`;
  message += `ドキュメント: ${analysis.documentTitle}\n`;
  message += `総文字数: ${analysis.totalCharacters}\n`;
  message += `総タブ数: ${analysis.totalSections}\n\n`;

  message += `=== タブ一覧 ===\n`;
  analysis.sections.forEach((section, index) => {
    message += `${index + 1}. ${section.title.substring(0, 30)}${section.title.length > 30 ? '...' : ''}\n`;
    message += `   日付: ${section.estimatedDate || '不明'} | 文字数: ${section.characterCount}\n`;
  });

  return message;
}

// 追加するデバッグ関数
function debugRawContent() {
  const doc = DocumentApp.getActiveDocument();
  const fullText = doc.getBody().getText();

  console.log('=== RAW CONTENT DEBUG ===');
  console.log('Total length:', fullText.length);
  console.log('First 200 chars:', fullText.substring(0, 200));
  console.log('Last 200 chars:', fullText.substring(fullText.length - 200));
  console.log('All lines:');

  const lines = fullText.split('\n');
  lines.forEach((line, index) => {
    if (line.trim()) {
      console.log(`Line ${index + 1}: ${line}`);
    }
  });
}

// ✅ 全タブ取得の正しい方法
function getAllTabsContent() {
  const doc = DocumentApp.getActiveDocument();
  const allTabs = getAllTabs(doc);

  console.log(`総タブ数: ${allTabs.length}`);

  let allContent = '';
  let totalCharacters = 0;

  allTabs.forEach((tab, index) => {
    const documentTab = tab.asDocumentTab();
    const body = documentTab.getBody();
    const tabContent = body.getText();

    console.log(`=== タブ ${index + 1} ===`);
    console.log(`タブID: ${tab.getId()}`);
    console.log(`タブタイトル: ${tab.getTitle()}`);
    console.log(`文字数: ${tabContent.length}`);
    console.log(`最初の100文字: ${tabContent.substring(0, 100)}...`);

    allContent += `\n=== ${tab.getTitle()} ===\n${tabContent}\n`;
    totalCharacters += tabContent.length;
  });

  console.log(`\n=== 総計 ===`);
  console.log(`全タブ合計文字数: ${totalCharacters}`);

  return {
    totalTabs: allTabs.length,
    totalCharacters: totalCharacters,
    allContent: allContent,
    tabs: allTabs.map(tab => ({
      id: tab.getId(),
      title: tab.getTitle(),
      content: tab.asDocumentTab().getBody().getText()
    }))
  };
}

// 公式ドキュメントのサンプルコード
function getAllTabs(doc) {
  const allTabs = [];
  for (const tab of doc.getTabs()) {
    addCurrentAndChildTabs(tab, allTabs);
  }
  return allTabs;
}

function addCurrentAndChildTabs(tab, allTabs) {
  allTabs.push(tab);
  for (const childTab of tab.getChildTabs()) {
    addCurrentAndChildTabs(childTab, allTabs);
  }
}

// GASランタイムとAPI可用性確認
function checkGASCapabilities() {
  console.log('=== GAS環境確認 ===');

  const doc = DocumentApp.getActiveDocument();

  // 基本情報
  console.log('GASランタイム:', typeof ScriptApp !== 'undefined' ? 'V8' : 'Rhino');
  console.log('DocumentApp版本:', typeof DocumentApp !== 'undefined');

  // getTabs対応確認
  console.log('getTabs対応:', typeof doc.getTabs === 'function');
  console.log('getActiveTab対応:', typeof doc.getActiveTab === 'function');

  // 利用可能メソッド一覧
  console.log('\n=== Document利用可能メソッド ===');
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(doc))
    .filter(name => typeof doc[name] === 'function')
    .sort();

  methods.forEach(method => {
    if (method.includes('Tab') || method.includes('tab')) {
      console.log(`★ ${method}`);
    } else {
      console.log(`  ${method}`);
    }
  });

  // ドキュメント構造確認
  console.log('\n=== ドキュメント構造 ===');
  console.log('ID:', doc.getId());
  console.log('名前:', doc.getName());
  console.log('URL:', doc.getUrl());

  return {
    hasTabSupport: typeof doc.getTabs === 'function',
    availableMethods: methods
  };
}

// 直接getTabs()を試行
  function testGetTabs() {
    console.log('=== getTabs()直接テスト ===');

    try {
      const doc = DocumentApp.getActiveDocument();

      // 1. getTabs()の直接実行
      console.log('getTabs()実行開始...');
      const tabs = doc.getTabs();
      console.log('getTabs()成功！');
      console.log('タブ数:', tabs.length);

      // 2. 各タブの詳細
      tabs.forEach((tab, index) => {
        console.log(`\n=== タブ ${index + 1} ===`);
        console.log('ID:', tab.getId());
        console.log('タイトル:', tab.getTitle());

        // DocumentTabとして取得
        const docTab = tab.asDocumentTab();
        const body = docTab.getBody();
        const content = body.getText();

        console.log('文字数:', content.length);
        console.log('最初の100文字:', content.substring(0, 100));
      });

      return tabs;

    } catch (error) {
      console.error('getTabs()エラー:', error.message);
      console.error('エラータイプ:', error.name);
      console.error('スタック:', error.stack);

      // フォールバック
      console.log('\n=== フォールバック実行 ===');
      return testAlternativeApproach();
    }
  }

  function testAlternativeApproach() {
    console.log('代替手段でのタブ検出...');

    const doc = DocumentApp.getActiveDocument();

    // getActiveTab()を試行
    try {
      const activeTab = doc.getActiveTab();
      console.log('getActiveTab()成功:', activeTab.getId());
      console.log('アクティブタブタイトル:', activeTab.getTitle());

      const docTab = activeTab.asDocumentTab();
      const content = docTab.getBody().getText();
      console.log('アクティブタブ文字数:', content.length);

      return [activeTab];

    } catch (error2) {
      console.error('getActiveTab()もエラー:', error2.message);

      // 最後の手段：従来方式
      console.log('従来方式にフォールバック...');
      const body = doc.getBody();
      const content = body.getText();
      console.log('従来方式文字数:', content.length);

      return null;
    }
  }


// メニューに追加用
function analyzeStructure() {
  return analyzeDocumentStructure();
}

onOpen関数に追加:
function onOpen() {
  const ui = DocumentApp.getUi();
  ui.createMenu('🔄 DocumentSync')
    .addItem('📊 構造分析', 'analyzeStructure')  // ← 追加
    .addItem('📤 手動同期', 'manualSync')
    .addItem('⚙️ 初期設定', 'initialize')
    .addItem('🧪 接続テスト', 'testConnection')
    .addSeparator()
    .addItem('📋 システム情報', 'showSystemInfo')
    .addItem('📝 ログ表示', 'showLogs')
    .addToUi();
}