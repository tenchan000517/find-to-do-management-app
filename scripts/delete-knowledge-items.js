// Google Docs由来のknowledge_items削除スクリプト
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteGoogleDocsKnowledge() {
  try {
    console.log('🗑️ Google Docs由来のナレッジ削除開始...\n');
    
    // 削除対象: source_document_idが特定のGoogle Docs IDのもの
    const targetDocumentId = '1jlKCfrxUnOGb9DvhlnVCPyzds-d_DYzEDUBf23jnXOY';
    
    // 削除前に確認
    const targetItems = await prisma.knowledge_items.findMany({
      where: {
        source_document_id: targetDocumentId
      },
      select: {
        id: true,
        title: true,
        createdAt: true
      }
    });
    
    console.log(`📋 削除対象のナレッジ: ${targetItems.length}件`);
    targetItems.forEach((item, i) => {
      console.log(`${i+1}. ${item.title}`);
      console.log(`   作成: ${item.createdAt.toLocaleString('ja-JP')}`);
    });
    
    if (targetItems.length === 0) {
      console.log('削除対象なし');
      return;
    }
    
    console.log('\n削除を実行しています...');
    
    // 削除実行
    const result = await prisma.knowledge_items.deleteMany({
      where: {
        source_document_id: targetDocumentId
      }
    });
    
    console.log(`\n✅ 削除完了: ${result.count}件のナレッジを削除しました`);
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

deleteGoogleDocsKnowledge();