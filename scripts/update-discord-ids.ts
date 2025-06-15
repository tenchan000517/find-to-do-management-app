// /**
//  * ユーザーにDiscord IDを追加するスクリプト
//  */

// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// // ユーザーマッピングデータ
// const userMappings = [
//   {
//     name: '川島',
//     lineUserId: 'Ua1ffc5321b117a134dfe6eb8a3827294',
//     discordId: '1281631920308097046'
//   },
//   {
//     name: '弓木野',
//     lineUserId: 'Uf1bb3a48bf5974b39540482116dd6d09',
//     discordId: '1131429130823536702'
//   },
//   {
//     name: '漆畑',
//     lineUserId: 'U869a0f7f41941e953d75f5e5f73d947f',
//     discordId: '976427276340166696'
//   },
//   {
//     name: '池本',
//     lineUserId: 'U65edb578f123dd915c6519f4b5730266',
//     discordId: '1143373602675232859'
//   },
//   {
//     name: '飯田',
//     lineUserId: 'U89f20854525d480262ad4d290b5767d2',
//     discordId: '1232977995673894937'
//   }
// ];

// async function updateDiscordIds() {
//   console.log('🔄 Discord ID更新を開始します...');

//   try {
//     for (const mapping of userMappings) {
//       console.log(`\n👤 ${mapping.name} のDiscord ID更新中...`);
      
//       // LINE IDでユーザーを検索
//       const user = await prisma.users.findUnique({
//         where: { lineUserId: mapping.lineUserId }
//       });

//       if (!user) {
//         console.log(`❌ ${mapping.name} (LINE ID: ${mapping.lineUserId}) が見つかりません`);
//         continue;
//       }

//       // Discord IDを更新
//       const updatedUser = await prisma.users.update({
//         where: { id: user.id },
//         data: { discordId: mapping.discordId }
//       });

//       console.log(`✅ ${mapping.name}: Discord ID ${mapping.discordId} を設定`);
//       console.log(`   ユーザーID: ${user.id}`);
//       console.log(`   LINE ID: ${mapping.lineUserId}`);
//     }

//     console.log('\n📊 更新後のユーザー一覧:');
//     const allUsers = await prisma.users.findMany({
//       select: {
//         id: true,
//         name: true,
//         lineUserId: true,
//         discordId: true,
//         isActive: true
//       }
//     });

//     allUsers.forEach(user => {
//       console.log(`👥 ${user.name}:`);
//       console.log(`   LINE: ${user.lineUserId || '未設定'}`);
//       console.log(`   Discord: ${user.discordId || '未設定'}`);
//       console.log(`   アクティブ: ${user.isActive ? 'はい' : 'いいえ'}`);
//       console.log('');
//     });

//     console.log('🎉 Discord ID更新が完了しました！');

//   } catch (error) {
//     console.error('❌ エラーが発生しました:', error);
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// // スクリプト実行
// updateDiscordIds();