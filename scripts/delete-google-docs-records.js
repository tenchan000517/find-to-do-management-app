// Google Docs議事録レコード削除スクリプト
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteGoogleDocsRecords() {
  try {
    console.log('🗑️ Google Docs議事録レコード削除開始...\n');
    
    // 削除対象のレコードを確認
    const targetRecord = await prisma.google_docs_sources.findFirst({
      where: {
        title: 'FIND TO DO 議事録 (全65タブ統合)'
      },
      select: {
        id: true,
        title: true,
        word_count: true,
        createdAt: true
      }
    });
    
    if (!targetRecord) {
      console.log('❌ 削除対象のレコードが見つかりません');
      return;
    }
    
    console.log('📄 削除対象レコード:');
    console.log(`   ID: ${targetRecord.id}`);
    console.log(`   タイトル: ${targetRecord.title}`);
    console.log(`   文字数: ${targetRecord.word_count}`);
    console.log(`   作成日時: ${targetRecord.createdAt.toLocaleString('ja-JP')}`);
    console.log('');
    
    // 関連するレコードも含めて削除
    console.log('🔍 関連レコードを検索中...');
    
    // 1. knowledge_items の削除（テーブル名修正）
    const deletedKnowledge = await prisma.knowledge_items.deleteMany({
      where: {
        sourceId: targetRecord.id
      }
    });
    console.log(`✅ ナレッジ削除: ${deletedKnowledge.count}件`);
    
    // 2. ai_content_analysis の削除
    const deletedAnalysis = await prisma.ai_content_analysis.deleteMany({
      where: {
        source_document_id: targetRecord.id
      }
    });
    console.log(`✅ AI分析削除: ${deletedAnalysis.count}件`);
    
    // 3. content_recommendations の削除（分析IDで関連付け）
    // まず削除された分析のIDを取得していないので、作成時刻で推定
    const deletedRecommendations = await prisma.content_recommendations.deleteMany({
      where: {
        createdAt: {
          gte: new Date(targetRecord.createdAt.getTime() - 60000), // 前後1分
          lte: new Date(targetRecord.createdAt.getTime() + 60000)
        }
      }
    });
    console.log(`✅ レコメンド削除: ${deletedRecommendations.count}件`);
    
    // 4. google_docs_sources 本体の削除
    const deletedSource = await prisma.google_docs_sources.delete({
      where: {
        id: targetRecord.id
      }
    });
    console.log(`✅ Google Docsソース削除: 完了`);
    
    console.log('\n🎉 削除完了！');
    console.log('   合計削除レコード数:');
    console.log(`   - Google Docsソース: 1件`);
    console.log(`   - ナレッジ: ${deletedKnowledge.count}件`);
    console.log(`   - AI分析: ${deletedAnalysis.count}件`);
    console.log(`   - レコメンド: ${deletedRecommendations.count}件`);
    
  } catch (error) {
    console.error('❌ エラー発生:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 実行
deleteGoogleDocsRecords();