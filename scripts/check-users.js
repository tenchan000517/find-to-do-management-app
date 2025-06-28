const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.users.findMany({
      orderBy: { id: 'asc' }
    });
    
    console.log('現在のユーザー一覧:');
    console.log('================');
    users.forEach(user => {
      console.log(`ID: ${user.id}, 名前: ${user.name}, アクティブ: ${user.isActive}`);
    });
    
    console.log(`\n合計: ${users.length}人`);
    
    // AIっぽいユーザーを特定
    const aiUsers = users.filter(user => 
      user.id.includes('ai') || 
      user.id.includes('test') || 
      user.id.includes('bot') ||
      user.name.includes('AI') ||
      user.name.includes('テスト')
    );
    
    if (aiUsers.length > 0) {
      console.log('\nAI/テストユーザー候補:');
      console.log('=====================');
      aiUsers.forEach(user => {
        console.log(`ID: ${user.id}, 名前: ${user.name}`);
      });
    }
    
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();