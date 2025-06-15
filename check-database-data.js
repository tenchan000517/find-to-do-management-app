// データベースの内容確認スクリプト
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseData() {
  try {
    console.log('🔍 データベースの内容を確認中...\n');

    // ユーザー数確認
    const userCount = await prisma.users.count();
    console.log(`👥 ユーザー数: ${userCount}`);
    
    if (userCount > 0) {
      const users = await prisma.users.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          lineUserId: true,
        },
        take: 5
      });
      console.log('ユーザー例:', users);
    }

    // タスク数確認
    const taskCount = await prisma.tasks.count();
    console.log(`\n📋 タスク数: ${taskCount}`);
    
    if (taskCount > 0) {
      const tasks = await prisma.tasks.findMany({
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          projectId: true,
        },
        take: 5
      });
      console.log('タスク例:', tasks);
    }

    // プロジェクト数確認
    const projectCount = await prisma.projects.count();
    console.log(`\n🎯 プロジェクト数: ${projectCount}`);
    
    if (projectCount > 0) {
      const projects = await prisma.projects.findMany({
        select: {
          id: true,
          name: true,
          status: true,
          phase: true,
          kgi: true,
        },
        take: 5
      });
      console.log('プロジェクト例:', projects);
    }

    // アポイントメント数確認
    const appointmentCount = await prisma.appointments.count();
    console.log(`\n📅 アポイントメント数: ${appointmentCount}`);
    
    if (appointmentCount > 0) {
      const appointments = await prisma.appointments.findMany({
        select: {
          id: true,
          companyName: true,
          contactName: true,
          status: true,
        },
        take: 3
      });
      console.log('アポイントメント例:', appointments);
    }

    // コネクション数確認
    const connectionCount = await prisma.connections.count();
    console.log(`\n🤝 コネクション数: ${connectionCount}`);
    
    if (connectionCount > 0) {
      const connections = await prisma.connections.findMany({
        select: {
          id: true,
          company: true,
          name: true,
          position: true,
        },
        take: 3
      });
      console.log('コネクション例:', connections);
    }

    // カレンダーイベント数確認
    const eventCount = await prisma.calendar_events.count();
    console.log(`\n📆 カレンダーイベント数: ${eventCount}`);

    // 総データ数表示
    const totalRecords = userCount + taskCount + projectCount + appointmentCount + connectionCount + eventCount;
    console.log(`\n📊 総レコード数: ${totalRecords}`);

    if (totalRecords === 0) {
      console.log('\n❌ データベースが空です！初期データの投入が必要です。');
      console.log('\n💡 データを追加する方法:');
      console.log('1. /tasks ページでタスクを手動作成');
      console.log('2. /projects ページでプロジェクトを手動作成');
      console.log('3. /appointments ページでアポイントメントを手動作成');
      console.log('4. /connections ページでコネクションを手動作成');
    } else {
      console.log('\n✅ データベースにデータが存在します');
    }

  } catch (error) {
    console.error('❌ データベース接続エラー:', error);
    console.log('\n🔧 確認事項:');
    console.log('1. DATABASE_URLが正しく設定されているか');
    console.log('2. データベースサーバーが起動しているか');
    console.log('3. Prismaマイグレーションが実行されているか');
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseData();