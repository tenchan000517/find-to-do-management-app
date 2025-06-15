// Node.js script to update users using Prisma
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateUsers() {
  console.log('🔄 Updating user LINE IDs...');
  
  try {
    // Update 池本
    const ikemoto = await prisma.users.updateMany({
      where: { name: "池本" },
      data: { lineUserId: "U65edb578f123dd915c6519f4b5730266" }
    });
    
    console.log(`✅ Updated 池本: ${ikemoto.count} records`);
    
    // Update 飯田
    const iida = await prisma.users.updateMany({
      where: { name: "飯田" },
      data: { lineUserId: "U89f20854525d480262ad4d290b5767d2" }
    });
    
    console.log(`✅ Updated 飯田: ${iida.count} records`);
    
    // Show all users
    console.log('\n📋 All users in database:');
    const users = await prisma.users.findMany({
      select: {
        name: true,
        lineUserId: true,
        color: true,
        isActive: true
      },
      orderBy: { name: 'asc' }
    });
    
    users.forEach(user => {
      const lineStatus = user.lineUserId ? '✅ 連携済み' : '❌ 未連携';
      console.log(`  - ${user.name}: ${lineStatus}`);
      console.log(`    LINE ID: ${user.lineUserId || '未設定'}`);
      console.log(`    Color: ${user.color}`);
    });
    
    console.log('\n🎉 LINE user ID update completed successfully!');
    
  } catch (error) {
    console.error('❌ Error updating users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUsers();