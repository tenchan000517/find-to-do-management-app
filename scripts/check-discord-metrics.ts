// /**
//  * Discord メトリクスデータの確認スクリプト
//  */

// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// async function checkDiscordMetrics() {
//   console.log('📊 Discord メトリクスデータ確認中...');

//   try {
//     // 最新のメトリクスデータを取得
//     const latestMetrics = await prisma.discord_metrics.findMany({
//       orderBy: { date: 'desc' },
//       take: 10
//     });

//     if (latestMetrics.length === 0) {
//       console.log('📭 メトリクスデータが見つかりません');
//       console.log('   Discordボットで !metrics コマンドを実行してデータを収集してください');
//       return;
//     }

//     console.log(`📈 メトリクスデータ: ${latestMetrics.length}件見つかりました\n`);

//     // 各メトリクスを表示
//     latestMetrics.forEach((metrics, index) => {
//       console.log(`📅 ${index + 1}. ${metrics.date.toLocaleDateString('ja-JP')}:`);
//       console.log(`   👥 メンバー数: ${metrics.memberCount}`);
//       console.log(`   🟢 オンライン: ${metrics.onlineCount}`);
//       console.log(`   💬 総メッセージ: ${metrics.dailyMessages}`);
//       console.log(`   👤 ユーザーメッセージ: ${metrics.dailyUserMessages}`);
//       console.log(`   👮 運営メッセージ: ${metrics.dailyStaffMessages}`);
//       console.log(`   🏃 アクティブユーザー: ${metrics.activeUsers}`);
//       console.log(`   📈 エンゲージメントスコア: ${metrics.engagementScore}`);
      
//       // ロール別メンバー数表示
//       if (metrics.roleCounts && typeof metrics.roleCounts === 'object') {
//         console.log(`   👥 ロール別メンバー:`);
//         Object.entries(metrics.roleCounts).forEach(([roleId, data]: [string, any]) => {
//           if (typeof data === 'object' && data.name && data.count !== undefined) {
//             console.log(`      - ${data.name}: ${data.count}人`);
//           } else {
//             // 旧形式対応
//             console.log(`      - ${roleId}: ${data}人`);
//           }
//         });
//       }
      
//       console.log(`   🕒 更新日時: ${metrics.updatedAt.toLocaleString('ja-JP')}`);
//       console.log('');
//     });

//     // 統計情報
//     if (latestMetrics.length >= 2) {
//       const latest = latestMetrics[0];
//       const previous = latestMetrics[1];
      
//       console.log('📊 前日比較:');
//       console.log(`   👥 メンバー数: ${latest.memberCount - previous.memberCount > 0 ? '+' : ''}${latest.memberCount - previous.memberCount}`);
//       console.log(`   💬 総メッセージ数: ${latest.dailyMessages - previous.dailyMessages > 0 ? '+' : ''}${latest.dailyMessages - previous.dailyMessages}`);
//       console.log(`   👤 ユーザーメッセージ: ${latest.dailyUserMessages - previous.dailyUserMessages > 0 ? '+' : ''}${latest.dailyUserMessages - previous.dailyUserMessages}`);
//       console.log(`   👮 運営メッセージ: ${latest.dailyStaffMessages - previous.dailyStaffMessages > 0 ? '+' : ''}${latest.dailyStaffMessages - previous.dailyStaffMessages}`);
//       console.log(`   📈 エンゲージメント: ${(latest.engagementScore - previous.engagementScore) > 0 ? '+' : ''}${(latest.engagementScore - previous.engagementScore).toFixed(2)}`);
//     }

//     // テーブル情報
//     console.log('\n🔍 テーブル情報:');
//     const tableInfo = await prisma.$queryRaw<any[]>`
//       SELECT column_name, data_type, is_nullable
//       FROM information_schema.columns 
//       WHERE table_name = 'discord_metrics'
//       ORDER BY ordinal_position
//     `;
    
//     tableInfo.forEach(col => {
//       console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(NULL可)' : '(NOT NULL)'}`);
//     });

//   } catch (error) {
//     console.error('❌ エラーが発生しました:', error);
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// // スクリプト実行
// checkDiscordMetrics();