// Google Docs URLを正しい形式に修正（GAS自動タブ切り替え対応版）
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgres://neondb_owner:npg_VKJPW8pIfQq0@ep-calm-butterfly-a55pupnn-pooler.us-east-2.aws.neon.tech/neondb?connect_timeout=15&sslmode=require"
    }
  }
});

// URLを正しい形式に変換（GAS自動タブ切り替えパラメータ付き）
function convertToCorrectUrl(documentId) {
  // documentId例: "1jlKCfrxUnOGb9DvhlnVCPyzds-d_DYzEDUBf23jnXOY_tab_1"
  const parts = documentId.split('_');
  
  if (parts.length >= 3) {
    // ベースID取得
    const baseId = parts.slice(0, -2).join('_'); // "1jlKCfrxUnOGb9DvhlnVCPyzds-d_DYzEDUBf23jnXOY"
    const tabType = parts[parts.length - 2]; // "tab"
    const tabNumber = parseInt(parts[parts.length - 1]); // 1, 2, 3...
    
    if (tabType === 'tab' && !isNaN(tabNumber)) {
      // tab_1 → t.0, tab_2 → t.1 に変換
      const urlTabNumber = tabNumber - 1;
      // GAS自動タブ切り替えパラメータを追加
      return `https://docs.google.com/document/d/${baseId}/edit?tab=t.${urlTabNumber}&gas_switch=true`;
    }
  }
  
  // recent_1, recent_2 の場合
  if (documentId.includes('_recent_')) {
    const baseId = documentId.split('_recent_')[0];
    return `https://docs.google.com/document/d/${baseId}/edit`;
  }
  
  // フォールバック: ベースIDのみ
  const baseId = documentId.split('_')[0];
  return `https://docs.google.com/document/d/${baseId}/edit`;
}

async function updateGoogleDocsUrlsWithGAS() {
  try {
    console.log('🔗 Google Docs URL修正スクリプト開始（GAS自動タブ切り替え対応）');
    
    // 全てのGoogle Docs Sourcesを取得
    const allSources = await prisma.google_docs_sources.findMany({
      select: {
        document_id: true,
        document_url: true,
        title: true
      },
      orderBy: { document_id: 'asc' }
    });

    console.log(`📊 修正対象: ${allSources.length}件`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const source of allSources) {
      try {
        // 新しいURL（GASパラメータ付き）を生成
        const newUrl = convertToCorrectUrl(source.document_id);
        
        console.log(`\n📄 処理中: ${source.document_id}`);
        console.log(`   📝 タイトル: ${source.title}`);
        console.log(`   🔗 旧URL: ${source.document_url}`);
        console.log(`   ✨ 新URL: ${newUrl}`);

        // URLが変更されている場合のみ更新
        if (source.document_url !== newUrl) {
          await prisma.google_docs_sources.update({
            where: { document_id: source.document_id },
            data: { document_url: newUrl }
          });
          
          updatedCount++;
          console.log(`   ✅ URL更新完了（GAS自動切り替え対応）`);
        } else {
          console.log(`   ⏭️ URL変更なし`);
        }

      } catch (error) {
        errorCount++;
        console.error(`   ❌ エラー: ${error.message}`);
      }
    }

    console.log(`\n🎉 Google Docs URL修正完了（GAS自動タブ切り替え対応）`);
    console.log(`📊 修正結果:`);
    console.log(`   - 対象件数: ${allSources.length}`);
    console.log(`   - 更新成功: ${updatedCount}件`);
    console.log(`   - エラー: ${errorCount}件`);
    console.log(`   - 変更なし: ${allSources.length - updatedCount - errorCount}件`);

    // 修正後のサンプルを表示
    console.log(`\n🔍 修正後のサンプル確認（GASパラメータ付き）:`);
    const samples = await prisma.google_docs_sources.findMany({
      select: { document_id: true, document_url: true, title: true },
      take: 5
    });
    
    samples.forEach((s, i) => {
      console.log(`${i+1}. ${s.title}`);
      console.log(`   ${s.document_url}`);
      
      // GASパラメータの確認
      if (s.document_url.includes('gas_switch=true')) {
        console.log(`   ✅ GAS自動切り替え対応済み`);
      } else {
        console.log(`   ⚠️ GAS自動切り替え未対応`);
      }
    });

    console.log(`\n🎯 自動タブ切り替えの動作:`);
    console.log(`   1. ユーザーがNext.jsで議事録リンクをクリック`);
    console.log(`   2. Google Docsが開く（?gas_switch=true&tab=t.N 付き）`);
    console.log(`   3. GAS onOpenトリガーがURLパラメータを検知`);
    console.log(`   4. 2-3秒後に指定されたタブに自動切り替え`);
    console.log(`   5. ユーザーが目的のタブの内容を確認`);

  } catch (error) {
    console.error('❌ スクリプト実行エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプト実行
updateGoogleDocsUrlsWithGAS();