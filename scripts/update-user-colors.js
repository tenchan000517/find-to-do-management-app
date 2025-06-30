const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateUserColors() {
  try {
    // Tailwind-500/400相当の色に更新
    const colorUpdates = [
      { name: '川島', color: '#EC4899' },    // pink-500
      { name: '弓木野', color: '#EAB308' },  // yellow-500
      { name: '池本', color: '#22C55E' },    // green-500
      { name: '漆畑', color: '#9333EA' },    // purple-600
      { name: '飯田', color: '#2563EB' }     // blue-600
    ];
    
    console.log('ユーザーカラーを更新します...');
    console.log('========================');
    
    for (const update of colorUpdates) {
      const result = await prisma.users.updateMany({
        where: { name: update.name },
        data: { color: update.color }
      });
      
      console.log(`${update.name}: ${update.color} (${result.count}件更新)`);
    }
    
    console.log('\n更新後の確認:');
    console.log('=============');
    
    const users = await prisma.users.findMany({
      select: { name: true, color: true },
      orderBy: { name: 'asc' }
    });
    
    users.forEach(user => {
      console.log(`${user.name}: ${user.color}`);
    });
    
  } catch (error) {
    console.error('更新エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserColors();