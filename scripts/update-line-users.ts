// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// const userUpdates = [
//   {
//     name: "池本",
//     lineUserId: "U65edb578f123dd915c6519f4b5730266"
//   },
//   {
//     name: "飯田", 
//     lineUserId: "U89f20854525d480262ad4d290b5767d2"
//   }
// ];

// async function updateLineUsers() {
//   console.log('Updating LINE user IDs...');
  
//   for (const update of userUpdates) {
//     try {
//       const updatedUser = await prisma.user.updateMany({
//         where: { name: update.name },
//         data: { lineUserId: update.lineUserId }
//       });
      
//       if (updatedUser.count > 0) {
//         console.log(`✅ Updated ${update.name} with LINE ID: ${update.lineUserId}`);
//       } else {
//         console.log(`⚠️  User ${update.name} not found`);
//       }
//     } catch (error) {
//       console.error(`❌ Failed to update ${update.name}:`, error);
//     }
//   }
  
//   console.log('\n📋 Current users in database:');
//   const allUsers = await prisma.user.findMany({
//     select: {
//       name: true,
//       lineUserId: true,
//       color: true,
//       isActive: true
//     },
//     orderBy: { name: 'asc' }
//   });
  
//   allUsers.forEach(user => {
//     const lineStatus = user.lineUserId ? '✅ 連携済み' : '❌ 未連携';
//     console.log(`- ${user.name}: ${lineStatus} (${user.color})`);
//   });
  
//   console.log('\nLINE user ID update completed!');
// }

// updateLineUsers()
//   .catch((e) => {
//     console.error('Update failed:', e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });