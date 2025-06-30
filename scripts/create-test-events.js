const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestEvents() {
  try {
    const users = [
      'user_kawashima',
      'user_yumikino', 
      'user_ikemoto',
      'user_urushibata',
      'user_iida'
    ];
    
    const today = new Date();
    const events = [];
    
    // 各ユーザーに今日以前の予定を1-2個ずつ作成
    for (let i = 0; i < users.length; i++) {
      const userId = users[i];
      const userName = userId.replace('user_', '');
      
      // 1個目のイベント (昨日)
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      
      events.push({
        id: `test_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        title: `${userName}の会議`,
        date: yesterday.toISOString().split('T')[0],
        time: '14:00',
        endTime: '15:00',
        type: 'MEETING',
        description: `${userName}のテストイベント`,
        participants: [],
        userId: userId,
        category: 'EVENT',
        importance: 0.7,
        isRecurring: false,
        isAllDay: false
      });
      
      // 2個目のイベント (一昨日) - 隔回で作成
      if (i % 2 === 0) {
        const dayBeforeYesterday = new Date(today);
        dayBeforeYesterday.setDate(today.getDate() - 2);
        
        events.push({
          id: `test_${Date.now() + i}_${Math.random().toString(36).slice(2, 9)}`,
          title: `${userName}のプロジェクト会議`,
          date: dayBeforeYesterday.toISOString().split('T')[0],
          time: '10:30',
          endTime: '11:30',
          type: 'MEETING',
          description: `${userName}のプロジェクトミーティング`,
          participants: [],
          userId: userId,
          category: 'EVENT',
          importance: 0.8,
          isRecurring: false,
          isAllDay: false
        });
      }
    }
    
    console.log('テストイベントを作成します...');
    console.log('======================');
    
    for (const event of events) {
      await prisma.calendar_events.create({ data: event });
      console.log(`作成: ${event.title} (${event.date} ${event.time}) - ${event.userId}`);
    }
    
    console.log(`\n合計 ${events.length} 件のテストイベントを作成しました。`);
    
  } catch (error) {
    console.error('作成エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestEvents();