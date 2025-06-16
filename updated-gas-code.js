// DocumentSyncScript.gs
// Google Apps Script for Document Synchronization v3.6 - AUTO TAB SWITCHING版
// UI表示削除版：高速実行に特化 + 自動タブ切り替え機能追加

// ===== 設定値 =====
const WEBHOOK_URL = 'https://5e83-2402-6b00-da0d-9600-78-397f-ab3d-5949.ngrok-free.app/api/webhook/google-docs-gas';

const CONFIG = {
  enableAuth: false,
  apiKey: '',
  retryCount: 3,
  retryDelay: 1000,
  maxContentLength: 100000,
  minContentLength: 50,
  enableLogging: true,
  enableAutoTabSwitch: true // 自動タブ切り替え有効化
};

// ===== 自動タブ切り替え機能 =====

/**
 * ドキュメントが開かれた時に自動実行される関数（既存のメニュー作成 + 新機能）
 * URLパラメータを解析して指定されたタブに自動切り替え
 */
function onOpen(e) {
  try {
    // 既存のメニュー作成
    createDocumentMenu();
    
    // 自動タブ切り替えが有効な場合のみ実行
    if (!CONFIG.enableAutoTabSwitch) {
      console.log('📋 メニューのみ作成（自動タブ切り替え無効）');
      return;
    }
    
    console.log('🚀 Google Docs onOpen triggered - v3.6 AUTO TAB SWITCHING');
    
    // URLパラメータ解析と自動タブ切り替え
    setTimeout(() => {
      handleAutoTabSwitching();
    }, 2000); // 2秒遅延でGoogle Docs読み込み完了を待つ
    
  } catch (error) {
    console.error('❌ onOpen error:', error);
    // エラーが発生してもドキュメントの通常動作は妨げない
  }
}

/**
 * 自動タブ切り替えのメイン処理
 */
function handleAutoTabSwitching() {
  try {
    console.log('🔍 自動タブ切り替えチェック開始');
    
    // ブラウザのURLを取得する試行（制限あり）
    const currentUrl = getCurrentDocumentUrl();
    
    if (!currentUrl) {
      console.log('📄 URL取得失敗 - 自動タブ切り替えスキップ');
      return;
    }
    
    console.log('🔗 現在のURL:', currentUrl);
    
    // URLパラメータを解析
    const urlParams = parseUrlParameters(currentUrl);
    
    // gas_switch=true かつ tab パラメータがある場合のみ実行
    if (urlParams.gas_switch === 'true' && urlParams.tab) {
      const targetTab = urlParams.tab; // 例: "t.5"
      console.log('🎯 自動タブ切り替え対象:', targetTab);
      
      // タブ切り替え実行
      const result = switchToSpecificTab(targetTab);
      
      if (result.success) {
        console.log('✅ 自動タブ切り替え成功:', result.tabTitle);
        showTabSwitchNotification(result.tabTitle);
      } else {
        console.log('❌ 自動タブ切り替え失敗:', result.error);
      }
    } else {
      console.log('⏭️ 自動タブ切り替えパラメータなし');
    }
    
  } catch (error) {
    console.error('❌ 自動タブ切り替えエラー:', error);
  }
}

/**
 * 現在のドキュメントURLを取得（制限あり）
 */
function getCurrentDocumentUrl() {
  try {
    const doc = DocumentApp.getActiveDocument();
    return doc.getUrl();
  } catch (error) {
    console.error('❌ URL取得エラー:', error);
    return null;
  }
}

/**
 * URLパラメータを解析する関数
 */
function parseUrlParameters(url) {
  const params = {};
  try {
    const urlObj = new URL(url);
    const searchParams = urlObj.searchParams;
    
    // 全パラメータを取得
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }
    
    console.log('📋 解析されたパラメータ:', params);
  } catch (error) {
    console.error('❌ URL解析エラー:', error);
  }
  
  return params;
}

/**
 * 指定されたタブに切り替える関数
 */
function switchToSpecificTab(targetTabParam) {
  try {
    console.log('🔄 タブ切り替え開始:', targetTabParam);
    
    const doc = DocumentApp.getActiveDocument();
    if (!doc) {
      return { success: false, error: 'ドキュメントが見つかりません' };
    }
    
    // "t.5" 形式から実際のタブIDを取得
    const tabResult = findTabByParameter(doc, targetTabParam);
    if (!tabResult.success) {
      return { success: false, error: tabResult.error };
    }
    
    console.log('🎯 切り替え先タブ:', tabResult.tab.getTitle());
    
    // タブを切り替え
    doc.setActiveTab(tabResult.tab.getId());
    
    console.log('✅ タブ切り替え完了');
    
    return { 
      success: true, 
      tabTitle: tabResult.tab.getTitle(),
      tabId: tabResult.tab.getId(),
      tabIndex: tabResult.index
    };
    
  } catch (error) {
    console.error('❌ タブ切り替えエラー:', error);
    return { success: false, error: error.message };
  }
}

/**
 * "t.5" 形式のパラメータから対応するタブを検索
 */
function findTabByParameter(doc, targetTabParam) {
  try {
    // "t.5" → 数値5を抽出
    const tabIndexMatch = targetTabParam.match(/t\.(\d+)/);
    if (!tabIndexMatch) {
      return { success: false, error: '無効なタブパラメータ形式: ' + targetTabParam };
    }
    
    const tabIndex = parseInt(tabIndexMatch[1]);
    console.log('📍 対象タブインデックス:', tabIndex);
    
    // 全タブを取得（子タブも含む）
    const allTabs = getAllDocumentTabs(doc);
    
    if (tabIndex >= 0 && tabIndex < allTabs.length) {
      const targetTab = allTabs[tabIndex];
      console.log('🎯 見つかったタブ:', targetTab.getTitle());
      return { 
        success: true, 
        tab: targetTab,
        index: tabIndex,
        totalTabs: allTabs.length
      };
    } else {
      return { 
        success: false, 
        error: `タブインデックス範囲外: ${tabIndex} (総タブ数: ${allTabs.length})` 
      };
    }
    
  } catch (error) {
    console.error('❌ タブ検索エラー:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ドキュメント内の全タブを取得（フラットリスト）
 */
function getAllDocumentTabs(doc) {
  const allTabs = [];
  
  function addCurrentAndChildTabs(tab) {
    allTabs.push(tab);
    const childTabs = tab.getChildTabs();
    for (let i = 0; i < childTabs.length; i++) {
      addCurrentAndChildTabs(childTabs[i]);
    }
  }
  
  const topLevelTabs = doc.getTabs();
  for (let i = 0; i < topLevelTabs.length; i++) {
    addCurrentAndChildTabs(topLevelTabs[i]);
  }
  
  console.log('📚 総タブ数:', allTabs.length);
  return allTabs;
}

/**
 * タブ切り替え完了の通知表示
 */
function showTabSwitchNotification(tabTitle) {
  try {
    console.log('🎉 タブ切り替え完了通知:', tabTitle);
    
    // コンソールログのみ（UIを表示しない）
    // 必要に応じてここにより高度な通知を追加可能
    
  } catch (error) {
    console.error('❌ 通知エラー:', error);
  }
}

/**
 * 手動テスト用のタブ切り替え関数
 */
function testAutoTabSwitching() {
  console.log('🧪 自動タブ切り替えテスト開始');
  
  const doc = DocumentApp.getActiveDocument();
  const allTabs = getAllDocumentTabs(doc);
  
  console.log('📋 利用可能なタブ:');
  allTabs.forEach((tab, index) => {
    console.log(`  t.${index}: ${tab.getTitle()} (ID: ${tab.getId()})`);
  });
  
  // 2番目のタブに切り替えテスト
  if (allTabs.length > 1) {
    console.log('🎯 2番目のタブに切り替えテスト...');
    const result = switchToSpecificTab('t.1');
    console.log('🧪 テスト結果:', result);
  } else {
    console.log('⚠️ テスト用タブが不足（2つ以上必要）');
  }
}

// ===== 既存の機能群（個別タブ順次送信等） =====

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
        
        if (content.length < CONFIG.minContentLength) {
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
          documentId: `${doc.getId()}_tab_${index + 1}`,  // 個別ID
          title: `${tab.getTitle()}`,
          content: content,
          url: `${doc.getUrl()}#heading=h.tab_${index + 1}`,
          lastModified: new Date().toISOString(),
          triggerType: 'bulk_sync',
          wordCount: content.length,
          tabIndex: index + 1,
          tabId: tab.getId(),
          parentDocumentId: doc.getId(),
          parentDocumentTitle: doc.getName(),
          gasVersion: '3.6-SEQUENTIAL-AUTO-TAB',
          contentHash: Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, content).toString(),
          timestamp: new Date().toISOString()
        };
        
        console.log(`📤 送信中: ${content.length}文字`);
        
        // Webhook送信
        const response = UrlFetchApp.fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'GAS-DocumentSync/3.6-AUTO-TAB',
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

// ===== 全タブ統合送信（非推奨・大容量でエラー） =====
function fastAllTabsSync() {
  const startTime = new Date();
  
  try {
    console.log('🚀 高速全タブ同期開始 (UI表示なし)');
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
    
    // コンテンツ統合
    let combinedContent = '';
    let totalChars = 0;
    const tabSummaries = [];
    
    console.log('📝 コンテンツ統合開始...');
    
    allTabs.forEach((tab, index) => {
      try {
        console.log(`処理中: ${index + 1}/${allTabs.length} - ${tab.getTitle()}`);
        
        const docTab = tab.asDocumentTab();
        const body = docTab.getBody();
        const content = body.getText().trim();
        
        if (content.length > 0) {
          combinedContent += `\n\n=== TAB ${index + 1}: ${tab.getTitle()} ===\n`;
          combinedContent += `TAB_ID: ${tab.getId()}\n`;
          combinedContent += `CONTENT_LENGTH: ${content.length}\n`;
          combinedContent += `---\n`;
          combinedContent += content;
          combinedContent += `\n--- END TAB ${index + 1} ---\n`;
          
          totalChars += content.length;
          
          tabSummaries.push({
            id: tab.getId(),
            title: tab.getTitle(),
            index: index + 1,
            characterCount: content.length,
            preview: content.substring(0, 100)
          });
          
          console.log(`✅ タブ${index + 1}完了: ${content.length}文字`);
        } else {
          console.log(`⚠️ タブ${index + 1}: 空コンテンツ`);
        }
        
        // 進捗レポート
        if ((index + 1) % 10 === 0) {
          const progress = Math.round(((index + 1) / allTabs.length) * 100);
          console.log(`📈 進捗: ${progress}% (${index + 1}/${allTabs.length})`);
        }
        
      } catch (tabError) {
        console.log(`❌ タブ${index + 1}処理エラー: ${tabError.message}`);
      }
    });
    
    console.log(`✅ コンテンツ統合完了: ${totalChars.toLocaleString()}文字`);
    
    if (totalChars < CONFIG.minContentLength) {
      console.log(`❌ 総文字数不足: ${totalChars}文字 (最低${CONFIG.minContentLength}文字必要)`);
      return { success: false, error: 'Insufficient content' };
    }
    
    // Webhook送信
    const payload = {
      documentId: doc.getId(),
      title: `${doc.getName()} (全${allTabs.length}タブ統合)`,
      content: combinedContent,
      url: doc.getUrl(),
      lastModified: new Date().toISOString(),
      triggerType: 'fast_all_tabs_no_ui',
      wordCount: totalChars,
      tabsCount: allTabs.length,
      tabSummaries: tabSummaries,
      processingMode: 'all_tabs_fast_no_ui',
      gasVersion: '3.6-NO-UI-AUTO-TAB',
      timestamp: new Date().toISOString()
    };
    
    console.log('📤 Webhook送信開始...');
    console.log(`📤 送信データサイズ: ${JSON.stringify(payload).length}文字`);
    
    const response = UrlFetchApp.fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GAS-DocumentSync/3.6-AUTO-TAB',
        'X-Document-ID': payload.documentId,
        'X-Trigger-Type': payload.triggerType
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    const processingTime = new Date() - startTime;
    
    console.log(`📡 Webhook応答コード: ${responseCode}`);
    console.log(`📡 処理時間: ${processingTime}ms`);
    console.log(`📡 応答内容: ${responseText.substring(0, 200)}...`);
    
    if (responseCode === 200) {
      console.log('🎉🎉🎉 全タブ同期完全成功！ 🎉🎉🎉');
      console.log(`📊 最終結果:`);
      console.log(`   - タブ数: ${allTabs.length}`);
      console.log(`   - 総文字数: ${totalChars.toLocaleString()}`);
      console.log(`   - 処理時間: ${processingTime}ms`);
      console.log(`   - 応答コード: ${responseCode}`);
      console.log(`✅ サーバーでAI分析が開始されました！`);
      
      return { 
        success: true, 
        tabsCount: allTabs.length, 
        totalChars: totalChars,
        processingTime: processingTime,
        responseCode: responseCode
      };
    } else {
      console.log(`❌ Webhook送信失敗: ${responseCode}`);
      console.log(`❌ エラー内容: ${responseText}`);
      return { success: false, error: `HTTP ${responseCode}: ${responseText}` };
    }
    
  } catch (error) {
    const processingTime = new Date() - startTime;
    console.log(`❌❌❌ 同期エラー: ${error.message}`);
    console.log(`❌ 処理時間: ${processingTime}ms`);
    console.log(`❌ スタック: ${error.stack}`);
    return { success: false, error: error.message, processingTime: processingTime };
  }
}

// ===== 高速接続テスト =====
function fastConnectionTest() {
  try {
    console.log('🧪 高速接続テスト開始');
    
    const testPayload = {
      documentId: 'test-fast-' + Date.now(),
      title: '高速接続テスト',
      content: 'これは高速版での接続テストです。UI表示なしで実行されています。サーバー側の最小文字数チェックをパスするために、十分な長さのテキストを含める必要があります。この接続テストが成功すれば、実際の全タブ同期処理を安心して実行できます。',
      url: 'https://test.example.com',
      lastModified: new Date().toISOString(),
      triggerType: 'test_fast_no_ui',
      gasVersion: '3.6-AUTO-TAB',
      timestamp: new Date().toISOString()
    };
    
    const response = UrlFetchApp.fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

// ===== 指定インデックスから送信 =====
function sequentialTabsSyncFrom(startIndex = 0) {
  const startTime = new Date();
  
  try {
    console.log(`🔄 個別タブ順次送信開始（${startIndex + 1}番目から）`);
    console.log('時刻:', new Date().toISOString());
    
    const doc = DocumentApp.getActiveDocument();
    console.log(`📄 ドキュメント名: ${doc.getName()}`);
    
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
    
    console.log(`📊 総タブ数: ${allTabs.length}`);
    console.log(`📋 送信対象: ${startIndex + 1}番目から${allTabs.length}番目まで`);
    
    if (startIndex >= allTabs.length) {
      console.log('✅ 全タブ送信済み');
      return { success: true, message: 'All tabs already sent' };
    }
    
    // 指定インデックスから送信
    let successCount = 0;
    let errorCount = 0;
    const results = [];
    
    for (let index = startIndex; index < allTabs.length; index++) {
      const tab = allTabs[index];
      
      try {
        console.log(`処理中: ${index + 1}/${allTabs.length} - ${tab.getTitle()}`);
        
        const docTab = tab.asDocumentTab();
        const body = docTab.getBody();
        const content = body.getText().trim();
        
        if (content.length < CONFIG.minContentLength) {
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
          documentId: `${doc.getId()}_tab_${index + 1}`,
          title: `${tab.getTitle()}`,
          content: content,
          url: `${doc.getUrl()}#heading=h.tab_${index + 1}`,
          lastModified: new Date().toISOString(),
          triggerType: 'bulk_sync',
          wordCount: content.length,
          tabIndex: index + 1,
          tabId: tab.getId(),
          parentDocumentId: doc.getId(),
          parentDocumentTitle: doc.getName(),
          gasVersion: '3.6-SEQUENTIAL-CONTINUE-AUTO-TAB',
          contentHash: Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, content).toString(),
          timestamp: new Date().toISOString()
        };
        
        console.log(`📤 送信中: ${content.length}文字`);
        
        const response = UrlFetchApp.fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'GAS-DocumentSync/3.6-CONTINUE-AUTO-TAB',
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
        Utilities.sleep(1000);
        
        // 実行時間チェック（5分30秒で停止）
        const elapsedTime = new Date() - startTime;
        if (elapsedTime > 330000) { // 5分30秒
          console.log(`⏰ 実行時間制限により一時停止: ${index + 1}番目まで送信完了`);
          console.log(`📊 次回は ${index + 2}番目から実行してください`);
          return {
            success: true,
            partialComplete: true,
            lastProcessedIndex: index + 1,
            nextStartIndex: index + 1,
            successCount: successCount,
            errorCount: errorCount,
            processingTime: elapsedTime,
            results: results,
            message: `${index + 1}番目まで送信完了。次回は${index + 2}番目から実行してください。`
          };
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
    
    console.log('🎉 送信完了！');
    console.log(`📊 最終結果:`);
    console.log(`   - 送信範囲: ${startIndex + 1}～${allTabs.length}`);
    console.log(`   - 送信成功: ${successCount}`);
    console.log(`   - 送信エラー: ${errorCount}`);
    console.log(`   - 処理時間: ${processingTime}ms`);
    
    return { 
      success: true, 
      complete: true,
      startIndex: startIndex + 1,
      endIndex: allTabs.length,
      successCount: successCount,
      errorCount: errorCount,
      processingTime: processingTime,
      results: results
    };
    
  } catch (error) {
    const processingTime = new Date() - startTime;
    console.log(`❌❌❌ 送信エラー: ${error.message}`);
    return { success: false, error: error.message, processingTime: processingTime };
  }
}

// ===== 直近3タブ送信（毎時トリガー用） =====
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
    
    // 直近3タブ（末尾から3つ、新しいタブは通常最後に追加される）
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
        
        if (content.length < CONFIG.minContentLength) {
          console.log(`⏭️ スキップ: ${content.length}文字`);
          continue;
        }
        
        const tabPayload = {
          documentId: `${doc.getId()}_recent_${i + 1}`,
          title: tab.getTitle(),
          content: content,
          url: `${doc.getUrl()}#recent_${i + 1}`,
          lastModified: new Date().toISOString(),
          triggerType: 'hourly_recent',
          wordCount: content.length,
          tabId: tab.getId(),
          parentDocumentId: doc.getId(),
          gasVersion: '3.6-RECENT-AUTO-TAB',
          contentHash: Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, content).toString(),
          timestamp: new Date().toISOString()
        };
        
        const response = UrlFetchApp.fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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

// ===== 高速3タブテスト =====
function fastThreeTabsTest() {
  try {
    console.log('🧪 高速3タブテスト開始');
    
    const doc = DocumentApp.getActiveDocument();
    const tabs = doc.getTabs().slice(0, 3); // 最初の3タブのみ
    
    let combinedContent = '';
    let totalChars = 0;
    
    tabs.forEach((tab, index) => {
      console.log(`処理中: タブ${index + 1} - ${tab.getTitle()}`);
      
      const docTab = tab.asDocumentTab();
      const body = docTab.getBody();
      const content = body.getText().trim();
      
      if (content.length > 0) {
        combinedContent += `\n=== TAB ${index + 1}: ${tab.getTitle()} ===\n`;
        combinedContent += content.substring(0, 1000); // 最初の1000文字のみ
        combinedContent += `\n--- END TAB ${index + 1} ---\n`;
        totalChars += content.length;
      }
      
      console.log(`タブ${index + 1}完了: ${content.length}文字`);
    });
    
    console.log(`3タブテスト完了: ${totalChars}文字`);
    return { success: true, totalChars: totalChars };
    
  } catch (error) {
    console.log(`3タブテストエラー: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ===== メニュー作成 =====
function createDocumentMenu() {
  try {
    const ui = DocumentApp.getUi();
    ui.createMenu('⚡ FAST v3.6 (自動タブ切り替え付き)')
      .addItem('🔄 個別タブ順次送信（推奨）', 'sequentialTabsSync')
      .addItem('📅 直近3タブ送信', 'recentThreeTabsSync')
      .addSeparator()
      .addItem('🚀 全タブ統合送信（非推奨）', 'fastAllTabsSync')
      .addSeparator()
      .addItem('🎯 自動タブ切り替えテスト', 'testAutoTabSwitching')
      .addSeparator()
      .addItem('🧪 高速接続テスト', 'fastConnectionTest')
      .addItem('🧪 高速3タブテスト', 'fastThreeTabsTest')
      .addToUi();
    
    console.log('📋 メニュー作成完了 - v3.6 自動タブ切り替え機能付き');
  } catch (error) {
    console.error('❌ メニュー作成エラー:', error);
  }
}

// ===== ログ関数 =====
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
}