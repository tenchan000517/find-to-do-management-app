// Google Docs URLを正しい形式に修正
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgres://neondb_owner:npg_VKJPW8pIfQq0@ep-calm-butterfly-a55pupnn-pooler.us-east-2.aws.neon.tech/neondb?connect_timeout=15&sslmode=require"
    }
  }
});

// URLを正しい形式に変換
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
      return `https://docs.google.com/document/d/${baseId}/edit?tab=t.${urlTabNumber}`;
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

async function fixGoogleDocsUrls() {
  try {
    console.log('🔗 Google Docs URL修正スクリプト開始');
    
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
        // 新しいURLを生成
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
          console.log(`   ✅ URL更新完了`);
        } else {
          console.log(`   ⏭️ URL変更なし`);
        }

      } catch (error) {
        errorCount++;
        console.error(`   ❌ エラー: ${error.message}`);
      }
    }

    console.log(`\n🎉 Google Docs URL修正完了`);
    console.log(`📊 修正結果:`);
    console.log(`   - 対象件数: ${allSources.length}`);
    console.log(`   - 更新成功: ${updatedCount}件`);
    console.log(`   - エラー: ${errorCount}件`);
    console.log(`   - 変更なし: ${allSources.length - updatedCount - errorCount}件`);

    // 修正後のサンプルを表示
    console.log(`\n🔍 修正後のサンプル確認:`);
    const samples = await prisma.google_docs_sources.findMany({
      select: { document_id: true, document_url: true, title: true },
      take: 3
    });
    
    samples.forEach((s, i) => {
      console.log(`${i+1}. ${s.title}`);
      console.log(`   ${s.document_url}`);
    });

  } catch (error) {
    console.error('❌ スクリプト実行エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプト実行
fixGoogleDocsUrls();