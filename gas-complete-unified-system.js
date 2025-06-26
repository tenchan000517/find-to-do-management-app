/**
 * Google Apps Script - 完全統合システム v4.0
 * 🎯 Web App + タブ切り替え + ドキュメント同期 + AI分析
 * 🔥 ALL-IN-ONE: 1つのGASプロジェクトですべて完結
 */

// =============================================================================
// 🌐 Web App機能 (URLパラメータ処理)
// =============================================================================

/**
 * Web App のメインエントリポイント
 * GET: ?tab=t.4&docId=1234567890
 */
function doGet(e) {
  try {
    console.log('🌐 Web App リクエスト受信');
    console.log('📥 パラメータ:', e.parameter);

    const tabParam = e.parameter.tab;
    const docId = e.parameter.docId;

    if (!docId) {
      return createErrorResponse('docId パラメータが必要です');
    }

    // tabパラメータがある場合は保存
    if (tabParam && tabParam.match(/^t\.\d+$/)) {
      console.log(`🔧 タブパラメータ保存: ${tabParam}`);

      const properties = PropertiesService.getScriptProperties();
      properties.setProperty('CURRENT_TAB_PARAM', tabParam);
      properties.setProperty('CURRENT_DOC_ID', docId);
      properties.setProperty('LAST_ACCESS_TIME', new Date().toISOString());

      console.log('✅ パラメータ保存完了');
    }

    // Google Docsドキュメントにリダイレクト
    const googleDocsUrl = `https://docs.google.com/document/d/${docId}/edit`;

    console.log(`🔗 リダイレクト先: ${googleDocsUrl}`);

    // 即座にリダイレクト（HTMLなし）
    return HtmlService.createHtmlOutput(`
      <script>
        window.location.href = "${googleDocsUrl}";
      </script>
    `);

  } catch (error) {
    console.error('❌ Web App エラー:', error);
    return createErrorResponse('Web App 処理エラー: ' + error.message);
  }
}

function createErrorResponse(message) {
  return HtmlService.createHtmlOutput(`<h2>❌ エラー</h2><p>${message}</p>`);
}

// =============================================================================
// 📄 ドキュメント機能 (タブ切り替え + 同期)
// =============================================================================

/**
 * ドキュメントが開かれた時に自動実行
 */
function onOpen() {
  console.log('🚀 完全統合システム起動');

  try {
    // メニュー作成
    createUnifiedMenu();

    // タブ切り替え実行（1秒後）
    setTimeout(() => {
      urlBasedTabSwitch();
    }, 1000);

  } catch (error) {
    console.error('❌ onOpen エラー:', error);
  }
}

/**
 * URL直接タブ切り替えのメイン処理
 */
function urlBasedTabSwitch() {
  try {
    console.log('🎯 URL直接タブ切り替え開始');

    // PropertiesServiceからtabパラメータを取得
    const tabParam = getTabParameterFromProperties();

    if (tabParam) {
      console.log(`🎯 保存済みタブパラメータ: ${tabParam}`);

      // t.4 → インデックス4に変換して切り替え
      const result = switchToTabByUrlParam(tabParam);

      if (result.success) {
        console.log(`✅ URL直接切り替え成功: ${result.tabTitle}`);

        // 使用済みパラメータをクリア
        clearTabParameter();
      } else {
        console.log(`❌ URL直接切り替え失敗: ${result.error}`);
        // フォールバック: 時間ベース
        fallbackToTimeBasedSwitch();
      }
    } else {
      console.log('📅 URLパラメータなし - 時間ベース切り替え');
      fallbackToTimeBasedSwitch();
    }

  } catch (error) {
    console.error('❌ URL直接タブ切り替えエラー:', error);
    // エラー時もフォールバック
    fallbackToTimeBasedSwitch();
  }
}

/**
 * PropertiesServiceからtabパラメータを取得
 */
function getTabParameterFromProperties() {
  try {
    const properties = PropertiesService.getScriptProperties();
    const tabParam = properties.getProperty('CURRENT_TAB_PARAM');

    if (tabParam && tabParam.match(/^t\.\d+$/)) {
      console.log(`✅ PropertiesServiceからタブパラメータ取得: ${tabParam}`);
      return tabParam;
    }

    console.log('⚠️ PropertiesServiceにタブパラメータなし');
    return null;

  } catch (error) {
    console.error('❌ PropertiesService取得エラー:', error);
    return null;
  }
}

/**
 * 使用済みタブパラメータをクリア
 */
function clearTabParameter() {
  try {
    const properties = PropertiesService.getScriptProperties();
    properties.deleteProperty('CURRENT_TAB_PARAM');
    console.log('🗑️ 使用済みタブパラメータクリア完了');
  } catch (error) {
    console.error('❌ タブパラメータクリアエラー:', error);
  }
}

/**
 * URLパラメータ（t.4）に基づいてタブ切り替え
 */
function switchToTabByUrlParam(tabParam) {
  try {
    // t.4 → 4 に変換
    const match = tabParam.match(/^t\.(\d+)$/);
    if (!match) {
      return { success: false, error: '無効なタブパラメータ形式' };
    }

    const tabIndex = parseInt(match[1]);
    console.log(`🔢 タブインデックス: ${tabIndex}`);

    // 実際のタブ切り替え
    return switchToTab(tabIndex);

  } catch (error) {
    console.error('❌ URLパラメータ切り替えエラー:', error);
    return { success: false, error: error.message };
  }
}

/**
 * フォールバック: 時間ベースタブ切り替え
 */
function fallbackToTimeBasedSwitch() {
  try {
    console.log('🕒 フォールバック: 時間ベース切り替え');

    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    // 時間ベース判定（改善版）
    let targetTab = 64; // デフォルト: 最新

    if (month === 6 && day >= 16) targetTab = 64;
    else if (month === 6 && day >= 15) targetTab = 63;
    else if (month === 6 && day >= 13) targetTab = 62;
    else if (month === 6) targetTab = 60;
    else if (month === 5) targetTab = 55;
    else if (month === 4) targetTab = 40;
    else if (month === 11) targetTab = 5;
    else if (month === 10) targetTab = 1;

    console.log(`🎯 時間ベース対象タブ: ${targetTab}`);

    return switchToTab(targetTab);

  } catch (error) {
    console.error('❌ フォールバック切り替えエラー:', error);
  }
}

/**
 * 指定されたインデックスのタブに切り替え（子タブ対応）
 */
function switchToTab(tabIndex) {
  try {
    console.log(`🔄 タブ切り替え実行: インデックス ${tabIndex}`);

    const doc = DocumentApp.getActiveDocument();

    // 全タブ取得（子タブ含む）
    const allTabs = getAllTabs(doc);

    console.log(`📋 利用可能タブ数: ${allTabs.length}`);

    if (tabIndex < 0 || tabIndex >= allTabs.length) {
      console.log(`❌ タブインデックス範囲外: ${tabIndex} (総タブ数: ${allTabs.length})`);
      return { success: false, error: `タブインデックス範囲外: ${tabIndex}` };
    }

    const targetTab = allTabs[tabIndex];
    const tabTitle = targetTab.getTabProperties().getTitle();
    const tabId = targetTab.getTabProperties().getTabId();

    console.log(`🎯 切り替え先: ${tabTitle} (ID: ${tabId})`);

    // タブ切り替え実行
    doc.setActiveTab(tabId);

    console.log('✅ タブ切り替え完了');

    return {
      success: true,
      tabTitle: tabTitle,
      tabIndex: tabIndex,
      tabId: tabId
    };

  } catch (error) {
    console.error('❌ タブ切り替えエラー:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 全タブを取得（子タブを含む階層構造を平坦化）
 * Google Docs API推奨方式
 */
function getAllTabs(doc) {
  const allTabs = [];

  // ルートタブを取得
  const rootTabs = doc.getTabs();

  // 各ルートタブとその子タブを再帰的に追加
  for (const tab of rootTabs) {
    addCurrentAndChildTabs(tab, allTabs);
  }

  console.log(`📊 タブ階層解析: ルート${rootTabs.length}個 → 総タブ${allTabs.length}個`);

  return allTabs;
}

/**
 * 現在のタブと子タブを再帰的に配列に追加
 * Google Docs API推奨方式
 */
function addCurrentAndChildTabs(tab, allTabs) {
  // 現在のタブを追加
  allTabs.push(tab);

  // 子タブがある場合は再帰的に追加
  if (tab.getChildTabs && tab.getChildTabs().length > 0) {
    for (const childTab of tab.getChildTabs()) {
      addCurrentAndChildTabs(childTab, allTabs);
    }
  }
}

// =============================================================================
// 📡 ドキュメント同期機能 (DocumentSyncScript統合)
// =============================================================================

// 設定値
const WEBHOOK_URL = 'https://find-to-do-management-app.vercel.app/api/webhook/google-docs-gas';

// 議題抽出はAI側で行うため、GAS側では実装不要

const SYNC_CONFIG = {
  enableAuth: true,
  apiKey: 'gas-webhook-secret-2025',
  retryCount: 3,
  retryDelay: 1000,
  maxContentLength: 100000,
  minContentLength: 50,
  enableLogging: true
};

/**
 * 個別タブ順次送信版（推奨）
 */
function sequentialTabsSync() {
  const startTime = new Date();

  try {
    console.log('🔄 個別タブ順次送信開始');
    console.log('時刻:', new Date().toISOString());

    // ドキュメント取得
    const doc = DocumentApp.getActiveDocument();
    console.log(`📄 ドキュメント名: ${doc.getName()}`);
    console.log(`📄 ドキュメントID: ${doc.getId()}`);

    // タブ取得
    const rootTabs = doc.getTabs();
    console.log(`📊 ルートタブ数: ${rootTabs.length}`);

    // 全タブ展開
    const allTabs = [];
    for (const tab of rootTabs) {
      allTabs.push(tab);
      // 子タブも追加
      if (tab.getChildTabs && tab.getChildTabs().length > 0) {
        for (const childTab of tab.getChildTabs()) {
          allTabs.push(childTab);
        }
      }
    }

    console.log(`📋 展開後タブ数: ${allTabs.length}`);

    if (allTabs.length === 0) {
      console.log('❌ タブが見つかりません');
      return { success: false, error: 'No tabs found' };
    }

    // 個別タブ送信
    let successCount = 0;
    let errorCount = 0;
    const results = [];

    console.log('📤 個別タブ送信開始...');

    for (let index = 0; index < allTabs.length; index++) {
      const tab = allTabs[index];

      try {
        console.log(`処理中: ${index + 1}/${allTabs.length} - ${tab.getTitle()}`);

        const docTab = tab.asDocumentTab();
        const body = docTab.getBody();
        const content = body.getText().trim();

        if (content.length < SYNC_CONFIG.minContentLength) {
          console.log(`⏭️ スキップ: コンテンツ不足 (${content.length}文字)`);
          results.push({
            tabIndex: index + 1,
            tabId: tab.getId(),
            title: tab.getTitle(),
            status: 'skipped',
            reason: 'insufficient_content',
            chars: content.length
          });
          continue;
        }

        // 個別タブのペイロード作成
        const tabPayload = {
          apiKey: SYNC_CONFIG.apiKey,
          documentId: `${doc.getId()}_tab_${index + 1}`,  // 個別ID
          title: `${tab.getTitle()}`,
          content: content,
          // agenda は AI分析で抽出するため GAS側では送信しない
          url: `https://docs.google.com/document/d/${doc.getId()}/edit?tab=${tab.getId()}`,
          lastModified: new Date().toISOString(),
          triggerType: 'bulk_sync',
          wordCount: content.length,
          tabIndex: index + 1,
          tabId: tab.getId(),
          parentDocumentId: doc.getId(),
          parentDocumentTitle: doc.getName(),
          gasVersion: '4.0-UNIFIED',
          contentHash: Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, content).toString(),
          timestamp: new Date().toISOString()
        };

        console.log(`📤 送信中: ${content.length}文字`);

        // Webhook送信
        const response = UrlFetchApp.fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'GAS-UnifiedSystem/4.0',
            'X-Document-ID': tabPayload.documentId,
            'X-Trigger-Type': tabPayload.triggerType,
            'X-Tab-Index': String(index + 1)
          },
          payload: JSON.stringify(tabPayload),
          muteHttpExceptions: true
        });

        const responseCode = response.getResponseCode();
        const responseText = response.getContentText();

        if (responseCode === 200) {
          successCount++;
          console.log(`✅ タブ${index + 1}送信成功: ${responseCode}`);

          // レスポンス解析
          let responseData = {};
          try {
            responseData = JSON.parse(responseText);
          } catch (e) {
            responseData = { raw: responseText.substring(0, 100) };
          }

          results.push({
            tabIndex: index + 1,
            tabId: tab.getId(),
            title: tab.getTitle(),
            status: 'success',
            responseCode: responseCode,
            chars: content.length,
            skipped: responseData.skipped || false,
            reason: responseData.reason || 'processed'
          });

        } else {
          errorCount++;
          console.log(`❌ タブ${index + 1}送信失敗: ${responseCode} - ${responseText.substring(0, 100)}`);

          results.push({
            tabIndex: index + 1,
            tabId: tab.getId(),
            title: tab.getTitle(),
            status: 'error',
            responseCode: responseCode,
            chars: content.length,
            error: responseText.substring(0, 200)
          });
        }

        // 進捗レポート
        if ((index + 1) % 10 === 0) {
          const progress = Math.round(((index + 1) / allTabs.length) * 100);
          console.log(`📈 進捗: ${progress}% (${index + 1}/${allTabs.length}) - 成功:${successCount} エラー:${errorCount}`);
        }

        // 1秒間隔
        if (index < allTabs.length - 1) {
          Utilities.sleep(1000);
        }

      } catch (tabError) {
        errorCount++;
        console.log(`❌ タブ${index + 1}処理エラー: ${tabError.message}`);

        results.push({
          tabIndex: index + 1,
          tabId: tab.getId(),
          title: tab.getTitle(),
          status: 'error',
          chars: 0,
          error: tabError.message
        });
      }
    }

    const processingTime = new Date() - startTime;

    console.log('🎉 個別タブ送信完了！');
    console.log(`📊 最終結果:`);
    console.log(`   - 総タブ数: ${allTabs.length}`);
    console.log(`   - 送信成功: ${successCount}`);
    console.log(`   - 送信エラー: ${errorCount}`);
    console.log(`   - 処理時間: ${processingTime}ms`);
    console.log(`✅ 各タブが個別にAI分析処理されます！`);

    return {
      success: true,
      totalTabs: allTabs.length,
      successCount: successCount,
      errorCount: errorCount,
      processingTime: processingTime,
      results: results
    };

  } catch (error) {
    const processingTime = new Date() - startTime;
    console.log(`❌❌❌ 順次送信エラー: ${error.message}`);
    console.log(`❌ 処理時間: ${processingTime}ms`);
    return { success: false, error: error.message, processingTime: processingTime };
  }
}

/**
 * 直近3タブ送信（毎時トリガー用）
 */
function recentThreeTabsSync() {
  const startTime = new Date();

  try {
    console.log('📅 直近3タブ送信開始');
    console.log('時刻:', new Date().toISOString());

    const doc = DocumentApp.getActiveDocument();
    console.log(`📄 ドキュメント: ${doc.getName()}`);

    // 全タブ取得
    const rootTabs = doc.getTabs();
    const allTabs = [];

    for (const tab of rootTabs) {
      allTabs.push(tab);
      if (tab.getChildTabs && tab.getChildTabs().length > 0) {
        for (const childTab of tab.getChildTabs()) {
          allTabs.push(childTab);
        }
      }
    }

    if (allTabs.length === 0) {
      console.log('❌ タブなし');
      return { success: false, error: 'No tabs' };
    }

    // 直近3タブ（末尾から3つ）
    const recentTabs = allTabs.slice(-3);
    console.log(`📋 対象: 直近${recentTabs.length}タブ`);

    // 各タブを送信
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < recentTabs.length; i++) {
      const tab = recentTabs[i];

      try {
        console.log(`送信中: ${i + 1}/${recentTabs.length} - ${tab.getTitle()}`);

        const docTab = tab.asDocumentTab();
        const content = docTab.getBody().getText().trim();

        if (content.length < SYNC_CONFIG.minContentLength) {
          console.log(`⏭️ スキップ: ${content.length}文字`);
          continue;
        }

        const tabPayload = {
          apiKey: SYNC_CONFIG.apiKey,
          documentId: `${doc.getId()}_recent_${i + 1}`,
          title: tab.getTitle(),
          content: content,
          // agenda は AI分析で抽出するため GAS側では送信しない
          url: `https://docs.google.com/document/d/${doc.getId()}/edit?tab=${tab.getId()}`,
          lastModified: new Date().toISOString(),
          triggerType: 'hourly_recent',
          wordCount: content.length,
          tabId: tab.getId(),
          parentDocumentId: doc.getId(),
          gasVersion: '4.0-UNIFIED-RECENT',
          contentHash: Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, content).toString(),
          timestamp: new Date().toISOString()
        };

        const response = UrlFetchApp.fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'GAS-UnifiedSystem/4.0-RECENT'
          },
          payload: JSON.stringify(tabPayload),
          muteHttpExceptions: true
        });

        const code = response.getResponseCode();
        if (code === 200) {
          successCount++;
          console.log(`✅ 成功: ${tab.getTitle()}`);
        } else {
          errorCount++;
          console.log(`❌ 失敗: ${code}`);
        }

        Utilities.sleep(500);

      } catch (e) {
        errorCount++;
        console.log(`❌ エラー: ${e.message}`);
      }
    }

    console.log(`📊 完了: 成功${successCount} エラー${errorCount}`);
    return { success: true, successCount, errorCount };

  } catch (error) {
    console.log(`❌ 全体エラー: ${error.message}`);
    return { success: false, error: error.message };
  }
}


/**
 * 緊急: 指定タブから再開送信
 */
function emergencyResumeFromTab(startTabNumber = 30) {
  const startTime = new Date();

  try {
    console.log(`🚨 緊急再開: タブ${startTabNumber}から送信開始`);
    console.log('時刻:', new Date().toISOString());

    const doc = DocumentApp.getActiveDocument();
    console.log(`📄 ドキュメント: ${doc.getName()}`);

    // 全タブ取得
    const rootTabs = doc.getTabs();
    const allTabs = [];

    for (const tab of rootTabs) {
      allTabs.push(tab);
      if (tab.getChildTabs && tab.getChildTabs().length > 0) {
        for (const childTab of tab.getChildTabs()) {
          allTabs.push(childTab);
        }
      }
    }

    if (startTabNumber > allTabs.length) {
      console.log(`❌ エラー: タブ${startTabNumber}は存在しません（総タブ数: ${allTabs.length}）`);
      return { success: false, error: 'Tab number out of range' };
    }

    // 指定タブから送信開始
    const resumeTabs = allTabs.slice(startTabNumber - 1);
    console.log(`📋 再開対象: タブ${startTabNumber}～${allTabs.length} (${resumeTabs.length}件)`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < resumeTabs.length; i++) {
      const tab = resumeTabs[i];
      const actualTabIndex = startTabNumber + i;

      try {
        console.log(`処理中: ${actualTabIndex}/${allTabs.length} - ${tab.getTitle()}`);

        const docTab = tab.asDocumentTab();
        const content = docTab.getBody().getText().trim();

        if (content.length < SYNC_CONFIG.minContentLength) {
          console.log(`⏭️ スキップ: ${content.length}文字`);
          continue;
        }

        const tabPayload = {
          apiKey: SYNC_CONFIG.apiKey,
          documentId: `${doc.getId()}_tab_${actualTabIndex}`,
          title: tab.getTitle(),
          content: content,
          // agenda は AI分析で抽出するため GAS側では送信しない
          url: `https://docs.google.com/document/d/${doc.getId()}/edit?tab=${tab.getId()}`,
          lastModified: new Date().toISOString(),
          triggerType: 'emergency_resume',
          wordCount: content.length,
          tabIndex: actualTabIndex,
          tabId: tab.getId(),
          parentDocumentId: doc.getId(),
          gasVersion: '4.0-UNIFIED-EMERGENCY',
          contentHash: Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, content).toString(),
          timestamp: new Date().toISOString()
        };

        const response = UrlFetchApp.fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'GAS-UnifiedSystem/4.0-EMERGENCY'
          },
          payload: JSON.stringify(tabPayload),
          muteHttpExceptions: true
        });

        const code = response.getResponseCode();
        if (code === 200) {
          successCount++;
          console.log(`✅ 成功: ${tab.getTitle()}`);
        } else {
          errorCount++;
          console.log(`❌ 失敗: ${code}`);
        }

        // 進捗レポート
        if ((i + 1) % 5 === 0) {
          const progress = Math.round(((i + 1) / resumeTabs.length) * 100);
          console.log(`📈 進捗: ${progress}% - 成功:${successCount} エラー:${errorCount}`);
        }

        Utilities.sleep(1000);

      } catch (e) {
        errorCount++;
        console.log(`❌ エラー: ${e.message}`);
      }
    }

    console.log(`🎉 緊急再開完了: 成功${successCount} エラー${errorCount}`);
    return { success: true, startTab: startTabNumber, successCount, errorCount };

  } catch (error) {
    console.log(`❌ 緊急再開エラー: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 高速接続テスト
 */
function connectionTest() {
  try {
    console.log('🧪 接続テスト開始');

    const testPayload = {
      apiKey: SYNC_CONFIG.apiKey,
      documentId: 'test-unified-' + Date.now(),
      title: '統合システム接続テスト',
      content: 'これは統合システムでの接続テストです。Web App + タブ切り替え + ドキュメント同期が1つのGASプロジェクトで動作しています。サーバー側の最小文字数チェックをパスするために、十分な長さのテキストを含める必要があります。',
      // agenda は AI分析で抽出するため GAS側では送信しない
      url: 'https://test.example.com',
      lastModified: new Date().toISOString(),
      triggerType: 'test_unified_system',
      gasVersion: '4.0-UNIFIED-TEST',
      timestamp: new Date().toISOString()
    };

    const response = UrlFetchApp.fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GAS-UnifiedSystem/4.0-TEST'
      },
      payload: JSON.stringify(testPayload),
      muteHttpExceptions: true
    });

    const code = response.getResponseCode();
    console.log(`接続テスト結果: ${code === 200 ? '✅ 成功' : '❌ 失敗'} (${code})`);

    return code === 200;

  } catch (error) {
    console.log(`接続テストエラー: ${error.message}`);
    return false;
  }
}

// =============================================================================
// 🎛️ 統合メニューシステム
// =============================================================================

/**
 * 統合メニューを作成
 */
function createUnifiedMenu() {
  try {
    const ui = DocumentApp.getUi();
    ui.createMenu('🎯 統合システム v4.0')
      .addSubMenu(ui.createMenu('🔗 タブ切り替え')
        .addItem('🎯 URL直接切り替え実行', 'urlBasedTabSwitch')
        .addItem('🕒 時間ベース切り替え', 'fallbackToTimeBasedSwitch')
        .addItem('📋 タブ一覧表示', 'showAllTabs')
        .addItem('🎯 タブ5テスト', 'testSwitchToTab5'))
      .addSubMenu(ui.createMenu('📡 ドキュメント同期')
        .addItem('🔄 個別タブ順次送信（推奨）', 'sequentialTabsSync')
        .addItem('📅 直近3タブ送信', 'recentThreeTabsSync')
        .addItem('🧪 接続テスト', 'connectionTest'))
      .addSubMenu(ui.createMenu('🧪 テスト・デバッグ')
        .addItem('🔍 統合診断実行', 'runUnifiedDiagnostics')
        .addItem('🧪 URL解析テスト', 'testUrlParsing')
        .addItem('💾 PropertiesService確認', 'checkProperties')
        .addItem('🗑️ PropertiesServiceクリア', 'clearProperties'))
      .addToUi();

    console.log('✅ 統合メニュー作成完了');
  } catch (error) {
    console.error('❌ メニュー作成エラー:', error);
  }
}

// =============================================================================
// 🧪 テスト・デバッグ機能
// =============================================================================

/**
 * 統合診断実行
 */
function runUnifiedDiagnostics() {
  console.log('🔍 統合システム診断開始');

  try {
    const doc = DocumentApp.getActiveDocument();
    const tabs = doc.getTabs();

    console.log('📊 統合診断結果:');
    console.log(`- ドキュメント: ${doc.getName()}`);
    console.log(`- ドキュメントID: ${doc.getId()}`);
    console.log(`- URL: ${doc.getUrl()}`);
    console.log(`- タブ数: ${tabs.length}`);

    // PropertiesService状態確認
    const properties = PropertiesService.getScriptProperties();
    const tabParam = properties.getProperty('CURRENT_TAB_PARAM');
    const docId = properties.getProperty('CURRENT_DOC_ID');
    const lastAccess = properties.getProperty('LAST_ACCESS_TIME');

    console.log(`- PropertiesServiceのタブパラメータ: ${tabParam || 'なし'}`);
    console.log(`- PropertiesServiceのドキュメントID: ${docId || 'なし'}`);
    console.log(`- 最終アクセス時刻: ${lastAccess || 'なし'}`);

    // Webhook接続テスト
    console.log('🧪 Webhook接続テスト実行中...');
    const connectionResult = connectionTest();
    console.log(`- Webhook接続: ${connectionResult ? '✅ 正常' : '❌ 異常'}`);

    return {
      success: true,
      tabCount: tabs.length,
      connectionStatus: connectionResult
    };

  } catch (error) {
    console.error('❌ 統合診断エラー:', error);
    return { success: false, error: error.message };
  }
}

/**
 * URL解析テスト
 */
function testUrlParsing() {
  console.log('🧪 URL解析テスト開始');

  try {
    const doc = DocumentApp.getActiveDocument();
    const url = doc.getUrl();

    console.log(`🔗 現在のURL: ${url}`);

    const tabParam = getTabParameterFromProperties();

    if (tabParam) {
      console.log(`✅ 抽出成功: ${tabParam}`);

      const match = tabParam.match(/^t\.(\d+)$/);
      if (match) {
        console.log(`🔢 タブインデックス: ${match[1]}`);
      }
    } else {
      console.log('❌ タブパラメータ抽出失敗');
    }

    // PropertiesServiceの状態確認
    const properties = PropertiesService.getScriptProperties();
    const savedTab = properties.getProperty('CURRENT_TAB_PARAM');
    const savedDoc = properties.getProperty('CURRENT_DOC_ID');
    const lastAccess = properties.getProperty('LAST_ACCESS_TIME');

    console.log('💾 PropertiesService状態:');
    console.log(`- CURRENT_TAB_PARAM: ${savedTab || 'なし'}`);
    console.log(`- CURRENT_DOC_ID: ${savedDoc || 'なし'}`);
    console.log(`- LAST_ACCESS_TIME: ${lastAccess || 'なし'}`);

  } catch (error) {
    console.error('❌ URL解析テストエラー:', error);
  }
}

/**
 * 全タブ表示（子タブ対応）
 */
function showAllTabs() {
  try {
    const doc = DocumentApp.getActiveDocument();

    // 全タブ取得（子タブ含む）
    const allTabs = getAllTabs(doc);

    console.log('📋 全タブ一覧（階層構造を平坦化）:');

    allTabs.forEach((tab, index) => {
      try {
        const tabProperties = tab.getTabProperties();
        const tabTitle = tabProperties.getTitle();
        const tabId = tabProperties.getTabId();

        console.log(`t.${index}: ${tabTitle} (ID: ${tabId})`);
      } catch (tabError) {
        console.log(`t.${index}: エラー - ${tabError.message}`);
      }
    });

    console.log(`📊 総タブ数: ${allTabs.length}`);

    return allTabs.length;

  } catch (error) {
    console.error('❌ 全タブ表示エラー:', error);
    return 0;
  }
}

/**
 * タブ5切り替えテスト
 */
function testSwitchToTab5() {
  console.log('🧪 タブ5切り替えテスト');
  return switchToTab(4); // インデックス4 = 5番目のタブ
}

/**
 * PropertiesService状態確認
 */
function checkProperties() {
  try {
    const properties = PropertiesService.getScriptProperties();
    const allProperties = properties.getProperties();

    console.log('💾 全PropertiesService状態:');
    for (const [key, value] of Object.entries(allProperties)) {
      console.log(`- ${key}: ${value}`);
    }

    return allProperties;

  } catch (error) {
    console.error('❌ PropertiesService 確認エラー:', error);
    return {};
  }
}

/**
 * PropertiesService クリア
 */
function clearProperties() {
  try {
    const properties = PropertiesService.getScriptProperties();
    properties.deleteProperty('CURRENT_TAB_PARAM');
    properties.deleteProperty('CURRENT_DOC_ID');
    properties.deleteProperty('LAST_ACCESS_TIME');

    console.log('🗑️ PropertiesService クリア完了');

  } catch (error) {
    console.error('❌ PropertiesService クリアエラー:', error);
  }
}

// =============================================================================
// 🎉 初期化
// =============================================================================

// 初期化ログ
console.log('🎯 完全統合システム v4.0 読み込み完了');
console.log('🔥 ALL-IN-ONE: Web App + タブ切り替え + ドキュメント同期');