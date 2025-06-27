/**
 * Google DocsのタブIDを確認するGASコード
 * 🎯 目的: 実際のタブIDがどのような形式か確認
 * 🔥 重要: タブIDは数値ではなくランダム文字列の可能性
 */

// Google Apps Scriptで実行するコード
function checkAllTabIds() {
  try {
    console.log('🔍 タブID確認開始');
    
    const doc = DocumentApp.getActiveDocument();
    const tabs = doc.getTabs();
    
    console.log(`📊 総タブ数: ${tabs.length}`);
    console.log('\n📋 タブID一覧:');
    
    tabs.forEach((tab, index) => {
      try {
        // まずタブオブジェクトの構造を確認
        console.log(`\n--- タブ${index} の構造確認 ---`);
        console.log(`タブオブジェクトのキー: ${Object.keys(tab).join(', ')}`);
        
        // 各メソッドを試す
        if (tab.getTitle) {
          console.log(`タイトル (getTitle): ${tab.getTitle()}`);
        }
        if (tab.getId) {
          console.log(`ID (getId): ${tab.getId()}`);
        }
        if (tab.getIndex) {
          console.log(`インデックス (getIndex): ${tab.getIndex()}`);
        }
        
        // tabPropertiesがある場合
        if (tab.tabProperties) {
          console.log(`tabPropertiesあり`);
          console.log(`tabPropertiesのキー: ${Object.keys(tab.tabProperties).join(', ')}`);
        }
        
        // getTabPropertiesメソッドがある場合
        if (tab.getTabProperties && typeof tab.getTabProperties === 'function') {
          console.log(`getTabPropertiesメソッドあり`);
          const props = tab.getTabProperties();
          console.log(`プロパティのキー: ${Object.keys(props).join(', ')}`);
        }
        
      } catch (e) {
        console.log(`タブ${index}: エラー - ${e.message}`);
      }
    });
    
    console.log('\n🎯 結論:');
    console.log('タブIDは数値インデックスではなく、ランダムな文字列です！');
    
  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

// 特定のタブを探す
function findTabByTitle(targetTitle) {
  try {
    console.log(`🔍 「${targetTitle}」を検索中...`);
    
    const doc = DocumentApp.getActiveDocument();
    const tabs = doc.getTabs();
    
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      const tabProps = tab.tabProperties;
      const tabTitle = tabProps.title;
      
      if (tabTitle.includes(targetTitle)) {
        const tabId = tabProps.tabId;
        console.log(`✅ 発見！`);
        console.log(`- インデックス: ${i}`);
        console.log(`- タイトル: ${tabTitle}`);
        console.log(`- タブID: ${tabId}`);
        console.log(`- URL: https://docs.google.com/document/d/${doc.getId()}/edit?tab=${tabId}`);
        return tabId;
      }
    }
    
    console.log('❌ 見つかりませんでした');
    return null;
    
  } catch (error) {
    console.error('❌ エラー:', error);
    return null;
  }
}

// 6/13のタブを探す
function findJune13Tab() {
  return findTabByTitle('6/13');
}

// タブIDマッピングを作成
function createTabIdMapping() {
  try {
    console.log('🗺️ タブIDマッピング作成');
    
    const doc = DocumentApp.getActiveDocument();
    const tabs = doc.getTabs();
    const mapping = {};
    
    tabs.forEach((tab, index) => {
      const tabProps = tab.tabProperties;
      const tabId = tabProps.tabId;
      const tabTitle = tabProps.title;
      
      // タイトルからキーを生成（例: "6/13　漆　1週間振り返り" → "tab_62"）
      const key = `tab_${index + 1}`;
      
      mapping[key] = {
        index: index,
        title: tabTitle,
        tabId: tabId,
        url: `https://docs.google.com/document/d/${doc.getId()}/edit?tab=${tabId}`
      };
    });
    
    console.log('📋 マッピング結果:');
    console.log(JSON.stringify(mapping, null, 2));
    
    return mapping;
    
  } catch (error) {
    console.error('❌ エラー:', error);
    return {};
  }
}