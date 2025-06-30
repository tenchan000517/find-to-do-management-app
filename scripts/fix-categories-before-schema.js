const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixCategories() {
  try {
    console.log('既存のGENERALカテゴリをEVENTに変更します...');
    
    const result = await prisma.calendar_events.updateMany({
      where: { category: 'GENERAL' },
      data: { category: 'EVENT' }
    });
    
    console.log(`${result.count}件のイベントをGENERALからEVENTに変更しました`);
    
    // その他の不要なカテゴリもEVENTに変更
    const categories = ['MEETING', 'PERSONAL', 'TEAM'];
    for (const cat of categories) {
      const result2 = await prisma.calendar_events.updateMany({
        where: { category: cat },
        data: { category: 'EVENT' }
      });
      if (result2.count > 0) {
        console.log(`${result2.count}件のイベントを${cat}からEVENTに変更しました`);
      }
    }
    
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCategories();