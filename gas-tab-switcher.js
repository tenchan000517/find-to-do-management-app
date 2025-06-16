/**
 * Google Apps Script - タブ自動切り替えシステム
 * Google Docsにバインドして使用
 */

/**
 * ドキュメントが開かれた時に自動実行される関数
 * URLパラメータを解析して指定されたタブに自動切り替え
 */
function onOpen(e) {
  try {
    console.log('🚀 Google Docs onOpen triggered');
    
    // URLパラメータを取得
    const url = e && e.source ? e.source.getUrl() : null;
    if (!url) {
      console.log('📄 URL not available in event, trying alternative method');
      // 代替手段: ドキュメントから直接URL取得を試行
      handleTabSwitching();
      return;
    }
    
    console.log('🔗 Document URL:', url);
    
    // URLパラメータを解析
    const urlParams = parseUrlParameters(url);
    
    // gas_switch=true パラメータがある場合のみタブ切り替えを実行
    if (urlParams.gas_switch === 'true' && urlParams.tab) {
      const targetTab = urlParams.tab; // 例: "t.5"
      console.log('🎯 Target tab detected:', targetTab);
      
      // 2秒遅延でタブ切り替え実行（Google Docs読み込み完了待ち）
      Utilities.sleep(2000);
      switchToTab(targetTab);
    } else {
      console.log('⏭️ No tab switching parameters found');
    }
    
  } catch (error) {
    console.error('❌ onOpen error:', error);
    // エラーが発生してもドキュメントの通常動作は妨げない
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
    
    console.log('📋 Parsed parameters:', params);
  } catch (error) {
    console.error('❌ URL parsing error:', error);
  }
  
  return params;
}

/**
 * 指定されたタブに切り替える関数
 */
function switchToTab(targetTabParam) {
  try {
    console.log('🔄 Starting tab switch to:', targetTabParam);
    
    const doc = DocumentApp.getActiveDocument();
    if (!doc) {
      console.error('❌ No active document found');
      return;
    }
    
    // "t.5" 形式から実際のタブIDを取得
    const tabId = convertTabParamToTabId(doc, targetTabParam);
    if (!tabId) {
      console.error('❌ Could not find tab for parameter:', targetTabParam);
      return;
    }
    
    console.log('🎯 Switching to tab ID:', tabId);
    
    // タブを切り替え
    doc.setActiveTab(tabId);
    
    // 成功通知（オプション）
    showTabSwitchNotification(targetTabParam);
    
    console.log('✅ Tab switch completed successfully');
    
  } catch (error) {
    console.error('❌ Tab switching error:', error);
  }
}

/**
 * "t.5" 形式のパラメータを実際のタブIDに変換
 */
function convertTabParamToTabId(doc, targetTabParam) {
  try {
    // "t.5" → 数値5を抽出
    const tabIndexMatch = targetTabParam.match(/t\.(\d+)/);
    if (!tabIndexMatch) {
      console.error('❌ Invalid tab parameter format:', targetTabParam);
      return null;
    }
    
    const tabIndex = parseInt(tabIndexMatch[1]);
    console.log('📍 Target tab index:', tabIndex);
    
    // 全タブを取得（子タブも含む）
    const allTabs = getAllTabs(doc);
    
    if (tabIndex >= 0 && tabIndex < allTabs.length) {
      const targetTab = allTabs[tabIndex];
      console.log('🎯 Found target tab:', targetTab.getTitle());
      return targetTab.getId();
    } else {
      console.error('❌ Tab index out of range:', tabIndex, 'Total tabs:', allTabs.length);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Tab ID conversion error:', error);
    return null;
  }
}

/**
 * ドキュメント内の全タブを取得（フラットリスト）
 */
function getAllTabs(doc) {
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
  
  console.log('📚 Total tabs found:', allTabs.length);
  return allTabs;
}

/**
 * タブ切り替え完了の通知表示（オプション）
 */
function showTabSwitchNotification(targetTab) {
  try {
    // 簡単な通知をコンソールに表示
    console.log('🎉 Successfully switched to tab:', targetTab);
    
    // より高度な通知が必要な場合はここに追加
    // 例: DocumentApp.getUi().alert() など
    
  } catch (error) {
    console.error('❌ Notification error:', error);
  }
}

/**
 * 代替手段のタブ切り替え処理
 * URLが取得できない場合の対応
 */
function handleTabSwitching() {
  try {
    console.log('🔄 Alternative tab switching method');
    
    // ブラウザのURLから直接パラメータを取得する方法を実装
    // 注意: この機能は制限がある場合があります
    
  } catch (error) {
    console.error('❌ Alternative method error:', error);
  }
}

/**
 * 手動テスト用の関数
 * GASエディタから直接実行してテスト可能
 */
function testTabSwitching() {
  console.log('🧪 Testing tab switching...');
  
  const doc = DocumentApp.getActiveDocument();
  const allTabs = getAllTabs(doc);
  
  console.log('📋 Available tabs:');
  allTabs.forEach((tab, index) => {
    console.log(`  ${index}: ${tab.getTitle()} (ID: ${tab.getId()})`);
  });
  
  // 2番目のタブに切り替えテスト
  if (allTabs.length > 1) {
    console.log('🎯 Testing switch to second tab...');
    switchToTab('t.1');
  }
}

/**
 * カスタムメニューを追加
 * ユーザーが手動でタブ切り替えテストを実行可能
 */
function onInstall(e) {
  onOpen(e);
}

/**
 * カスタムメニューの追加
 */
function addCustomMenu() {
  try {
    const ui = DocumentApp.getUi();
    ui.createMenu('📑 タブ切り替え')
      .addItem('🧪 テスト実行', 'testTabSwitching')
      .addItem('📋 全タブ表示', 'showAllTabs')
      .addToUi();
    
    console.log('📋 Custom menu added successfully');
  } catch (error) {
    console.error('❌ Menu creation error:', error);
  }
}

/**
 * 全タブの情報を表示
 */
function showAllTabs() {
  try {
    const doc = DocumentApp.getActiveDocument();
    const allTabs = getAllTabs(doc);
    
    let message = '📋 利用可能なタブ一覧:\n\n';
    allTabs.forEach((tab, index) => {
      message += `${index}: ${tab.getTitle()}\n`;
    });
    
    DocumentApp.getUi().alert('タブ一覧', message, DocumentApp.getUi().ButtonSet.OK);
  } catch (error) {
    console.error('❌ Show tabs error:', error);
  }
}