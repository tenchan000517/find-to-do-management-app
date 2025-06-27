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

    // 特定の日時の会議検索 (6/17 or 6/18 14:00)
    console.log('\n🔍 指定日時の会議検索 (2025-06-17 or 2025-06-18 14:00)...');
    
    const targetDates = ['2025-06-17', '2025-06-18'];
    const targetTimes = ['14:00', '14:00:00', '2:00 PM', '午後2時', '午後２時'];
    
    for (const date of targetDates) {
      console.log(`\n📅 ${date}の検索結果:`);
      
      // calendar_eventsテーブルから検索
      const calendarEvents = await prisma.calendar_events.findMany({
        where: {
          date: date,
          OR: [
            { time: { in: targetTimes } },
            { time: { contains: '14:' } },
            { title: { contains: '会議' } },
            { title: { contains: 'meeting' } },
            { title: { contains: 'Meeting' } }
          ]
        },
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          },
          assignee: {
            select: { id: true, name: true, email: true }
          },
          users: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      if (calendarEvents.length > 0) {
        console.log(`  📋 カレンダーイベント (${calendarEvents.length}件):`);
        calendarEvents.forEach((event, index) => {
          console.log(`  ${index + 1}. ${event.title}`);
          console.log(`     日時: ${event.date} ${event.time}${event.endTime ? ' - ' + event.endTime : ''}`);
          console.log(`     タイプ: ${event.type}, カテゴリ: ${event.category}`);
          console.log(`     説明: ${event.description}`);
          console.log(`     参加者: ${JSON.stringify(event.participants)}`);
          console.log(`     場所: ${event.location || 'なし'}`);
          console.log(`     重要度: ${event.importance}`);
          console.log(`     -------`);
          console.log(`     👤 作成者 (createdBy): ${event.creator ? `${event.creator.name} (${event.creator.id})` : 'なし'}`);
          console.log(`     🎯 担当者 (assignedTo): ${event.assignee ? `${event.assignee.name} (${event.assignee.id})` : 'なし'}`);
          console.log(`     👥 レガシーユーザー (userId): ${event.users ? `${event.users.name} (${event.users.id})` : 'なし'}`);
          console.log(`     📊 レガシーID: userId=${event.userId}, projectId=${event.projectId}, taskId=${event.taskId}`);
          console.log(`     🔄 繰り返し: ${event.isRecurring ? `あり (${event.recurringPattern})` : 'なし'}`);
          console.log(`     🎨 カラー: ${event.colorCode || 'デフォルト'}`);
          console.log(`     ⏰ 終日: ${event.isAllDay ? 'はい' : 'いいえ'}`);
          console.log(`     📝 作成: ${event.createdAt}, 更新: ${event.updatedAt}`);
          console.log('');
        });
      }

      // personal_schedulesテーブルから検索
      const personalSchedules = await prisma.personal_schedules.findMany({
        where: {
          date: date,
          OR: [
            { time: { in: targetTimes } },
            { time: { contains: '14:' } },
            { title: { contains: '会議' } },
            { title: { contains: 'meeting' } },
            { title: { contains: 'Meeting' } }
          ]
        },
        include: {
          users: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      if (personalSchedules.length > 0) {
        console.log(`  📅 個人スケジュール (${personalSchedules.length}件):`);
        personalSchedules.forEach((schedule, index) => {
          console.log(`  ${index + 1}. ${schedule.title}`);
          console.log(`     日時: ${schedule.date} ${schedule.time}${schedule.endTime ? ' - ' + schedule.endTime : ''}`);
          console.log(`     説明: ${schedule.description || 'なし'}`);
          console.log(`     場所: ${schedule.location || 'なし'}`);
          console.log(`     優先度: ${schedule.priority}`);
          console.log(`     終日: ${schedule.isAllDay ? 'はい' : 'いいえ'}`);
          console.log(`     👤 ユーザー: ${schedule.users.name} (${schedule.users.id})`);
          console.log(`     📝 作成: ${schedule.createdAt}, 更新: ${schedule.updatedAt}`);
          console.log('');
        });
      }

      // tasksテーブルから期日検索
      const tasks = await prisma.tasks.findMany({
        where: {
          dueDate: date,
          OR: [
            { title: { contains: '会議' } },
            { title: { contains: 'meeting' } },
            { title: { contains: 'Meeting' } },
            { description: { contains: '14:' } },
            { description: { contains: '午後2時' } }
          ]
        },
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          },
          assignee: {
            select: { id: true, name: true, email: true }
          },
          users: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      if (tasks.length > 0) {
        console.log(`  📋 関連タスク (${tasks.length}件):`);
        tasks.forEach((task, index) => {
          console.log(`  ${index + 1}. ${task.title}`);
          console.log(`     期日: ${task.dueDate}`);
          console.log(`     説明: ${task.description}`);
          console.log(`     ステータス: ${task.status}, 優先度: ${task.priority}`);
          console.log(`     -------`);
          console.log(`     👤 作成者 (createdBy): ${task.creator ? `${task.creator.name} (${task.creator.id})` : 'なし'}`);
          console.log(`     🎯 担当者 (assignedTo): ${task.assignee ? `${task.assignee.name} (${task.assignee.id})` : 'なし'}`);
          console.log(`     👥 レガシーユーザー (userId): ${task.users.name} (${task.users.id})`);
          console.log(`     📝 作成: ${task.createdAt}, 更新: ${task.updatedAt}`);
          console.log('');
        });
      }

      if (calendarEvents.length === 0 && personalSchedules.length === 0 && tasks.length === 0) {
        console.log(`  ❌ ${date}に該当する会議・イベントが見つかりませんでした`);
      }
    }

    // LINEログの確認
    console.log('\n📱 LINE登録ログの確認...');
    const lineLogsCount = await prisma.line_integration_logs.count();
    console.log(`📊 LINE統合ログ数: ${lineLogsCount}`);
    
    if (lineLogsCount > 0) {
      const recentLineLogs = await prisma.line_integration_logs.findMany({
        where: {
          createdAt: {
            gte: new Date('2025-06-16T00:00:00Z')
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      });

      if (recentLineLogs.length > 0) {
        console.log(`📋 最近のLINE登録ログ (${recentLineLogs.length}件):`);
        recentLineLogs.forEach((log, index) => {
          console.log(`  ${index + 1}. メッセージID: ${log.messageId}`);
          console.log(`     グループID: ${log.groupId}`);
          console.log(`     ユーザーID: ${log.userId}`);
          console.log(`     元メッセージ: ${log.originalMessage.substring(0, 100)}...`);
          console.log(`     処理後: ${log.processedMessage ? log.processedMessage.substring(0, 100) + '...' : 'なし'}`);
          console.log(`     処理ステータス: ${log.processingStatus}`);
          console.log(`     信頼度: ${log.confidence}`);
          console.log(`     作成アイテム: ${JSON.stringify(log.createdItems)}`);
          console.log(`     ユーザー確認: ${log.userConfirmation ?? '未確認'}`);
          console.log(`     エラー: ${log.errorMessage || 'なし'}`);
          console.log(`     作成日時: ${log.createdAt}`);
          console.log('');
        });
      }
    }

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