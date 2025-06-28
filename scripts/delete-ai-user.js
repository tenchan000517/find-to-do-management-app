const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAIUser() {
  try {
    console.log('AI Test Userを削除します...');
    
    const deleted = await prisma.users.delete({
      where: {
        id: 'user_test_1749954779373'
      }
    });
    
    console.log('削除完了:', deleted);
    
  } catch (error) {
    console.error('削除エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAIUser();