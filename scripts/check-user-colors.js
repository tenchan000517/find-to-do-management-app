const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserColors() {
  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        color: true
      },
      orderBy: { name: 'asc' }
    });
    
    console.log('現在のユーザーカラー設定:');
    console.log('========================');
    users.forEach(user => {
      console.log(`${user.name}: ${user.color}`);
    });
    
    // 色の重複チェック
    const colorCounts = {};
    users.forEach(user => {
      colorCounts[user.color] = (colorCounts[user.color] || 0) + 1;
    });
    
    console.log('\n色の重複状況:');
    console.log('=============');
    Object.entries(colorCounts).forEach(([color, count]) => {
      if (count > 1) {
        console.log(`${color}: ${count}人が使用中`);
      }
    });
    
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserColors();