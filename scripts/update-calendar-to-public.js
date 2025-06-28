const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateCalendarToPublic() {
  try {
    console.log('川島さんのcalendar_eventsを全員向けに変更します...');
    
    // 現在の川島さんのイベント数を確認
    const kawashimaEvents = await prisma.calendar_events.count({
      where: {
        userId: 'user_kawashima'
      }
    });
    
    console.log(`対象イベント数: ${kawashimaEvents}件`);
    
    // 川島さんのイベントをnullに更新（全員向け）
    const result = await prisma.calendar_events.updateMany({
      where: {
        userId: 'user_kawashima'
      },
      data: {
        userId: null
      }
    });
    
    console.log(`更新完了: ${result.count}件を全員向けに変更しました`);
    
    // 確認
    const publicEvents = await prisma.calendar_events.count({
      where: {
        userId: null
      }
    });
    
    console.log(`\n現在の全員向けイベント数: ${publicEvents}件`);
    
  } catch (error) {
    console.error('更新エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCalendarToPublic();