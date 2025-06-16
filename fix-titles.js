// タイトル修正スクリプト（AI処理なし）
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgres://neondb_owner:npg_VKJPW8pIfQq0@ep-calm-butterfly-a55pupnn-pooler.us-east-2.aws.neon.tech/neondb?connect_timeout=15&sslmode=require"
    }
  }
});

async function fixTitles() {
  try {
    console.log('🔧 タイトル修正スクリプト開始');
    
    // 「タイトル不明」または空のタイトルのレコードを取得
    const analysisWithUnknownTitle = await prisma.ai_content_analysis.findMany({
      where: {
        OR: [
          { title: 'タイトル不明' },
          { title: { equals: '' } }
        ]
      },
      select: {
        id: true,
        source_document_id: true,
        title: true
      }
    });

    console.log(`📊 修正対象: ${analysisWithUnknownTitle.length}件`);

    if (analysisWithUnknownTitle.length === 0) {
      console.log('✅ 修正対象なし');
      return;
    }

    // Google Docsのタイトル情報を取得
    const googleDocsSources = await prisma.google_docs_sources.findMany({
      select: {
        document_id: true,
        title: true
      }
    });

    const docsMap = new Map(googleDocsSources.map(doc => [doc.document_id, doc.title]));
    console.log(`📋 Google Docsタイトル: ${docsMap.size}件`);

    let updatedCount = 0;

    for (const analysis of analysisWithUnknownTitle) {
      // 完全一致でタイトルを検索
      const docTitle = docsMap.get(analysis.source_document_id);
      
      if (docTitle && docTitle !== 'タイトル不明') {
        await prisma.ai_content_analysis.update({
          where: { id: analysis.id },
          data: { title: docTitle }
        });
        
        updatedCount++;
        console.log(`✅ 更新: ${analysis.id} → "${docTitle}"`);
      } else {
        console.log(`⚠️ タイトル見つからず: ${analysis.source_document_id}`);
      }
    }

    console.log(`\n🎉 タイトル修正完了`);
    console.log(`📊 修正結果:`);
    console.log(`   - 対象件数: ${analysisWithUnknownTitle.length}`);
    console.log(`   - 更新成功: ${updatedCount}件`);
    console.log(`   - 未更新: ${analysisWithUnknownTitle.length - updatedCount}件`);

  } catch (error) {
    console.error('❌ スクリプト実行エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプト実行
if (require.main === module) {
  fixTitles();
}

module.exports = { fixTitles };