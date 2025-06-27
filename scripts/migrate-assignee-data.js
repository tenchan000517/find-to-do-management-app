/**
 * 担当者システム改修 - データ移行スクリプト
 * 既存のuserIdデータをcreatedBy/assignedToフィールドに移行
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateAssigneeData() {
  console.log('🚀 担当者システム データ移行開始...');
  
  try {
    // 1. Tasks移行
    console.log('\n📋 Tasks データ移行中...');
    const tasks = await prisma.tasks.findMany({
      where: {
        OR: [
          { createdBy: null },
          { assignedTo: null }
        ]
      },
      select: { id: true, userId: true }
    });
    
    console.log(`対象タスク: ${tasks.length}件`);
    
    for (const task of tasks) {
      await prisma.tasks.update({
        where: { id: task.id },
        data: {
          createdBy: task.userId,    // 既存のuserIdを作成者に
          assignedTo: task.userId    // 既存のuserIdを担当者に
        }
      });
    }
    console.log(`✅ Tasks移行完了: ${tasks.length}件`);

    // 2. Projects移行
    console.log('\n📁 Projects データ移行中...');
    const projects = await prisma.projects.findMany({
      where: {
        OR: [
          { createdBy: null },
          { assignedTo: null }
        ]
      },
      select: { id: true, teamMembers: true }
    });
    
    console.log(`対象プロジェクト: ${projects.length}件`);
    
    // デフォルトユーザー（既存データから推定）
    const defaultUser = 'user_iida'; // 現在のメインユーザー
    
    for (const project of projects) {
      const assignee = project.teamMembers && project.teamMembers.length > 0 
        ? project.teamMembers[0]  // チームの最初のメンバーをマネージャーに
        : defaultUser;
        
      await prisma.projects.update({
        where: { id: project.id },
        data: {
          createdBy: defaultUser,    // デフォルトユーザーを作成者に
          assignedTo: assignee       // チームメンバーまたはデフォルトユーザーを担当者に
        }
      });
    }
    console.log(`✅ Projects移行完了: ${projects.length}件`);

    // 3. Appointments移行
    console.log('\n📅 Appointments データ移行中...');
    const appointments = await prisma.appointments.findMany({
      where: {
        OR: [
          { createdBy: null },
          { assignedTo: null }
        ]
      },
      select: { id: true }
    });
    
    console.log(`対象アポイントメント: ${appointments.length}件`);
    
    for (const appointment of appointments) {
      await prisma.appointments.update({
        where: { id: appointment.id },
        data: {
          createdBy: defaultUser,    // デフォルトユーザーを作成者に
          assignedTo: defaultUser    // デフォルトユーザーを担当者に
        }
      });
    }
    console.log(`✅ Appointments移行完了: ${appointments.length}件`);

    // 4. Calendar Events移行（optional fields）
    console.log('\n📆 Calendar Events データ移行中...');
    const events = await prisma.calendar_events.findMany({
      where: {
        AND: [
          { createdBy: null },
          { userId: { not: null } }  // userIdがあるものだけ
        ]
      },
      select: { id: true, userId: true }
    });
    
    console.log(`対象イベント: ${events.length}件`);
    
    for (const event of events) {
      await prisma.calendar_events.update({
        where: { id: event.id },
        data: {
          createdBy: event.userId,      // 既存のuserIdを作成者に
          assignedTo: event.userId      // 既存のuserIdを担当者に（オプショナル）
        }
      });
    }
    console.log(`✅ Calendar Events移行完了: ${events.length}件`);

    // 5. Connections移行（optional fields）
    console.log('\n🤝 Connections データ移行中...');
    const connections = await prisma.connections.findMany({
      where: {
        createdBy: null
      },
      select: { id: true }
    });
    
    console.log(`対象コネクション: ${connections.length}件`);
    
    for (const connection of connections) {
      await prisma.connections.update({
        where: { id: connection.id },
        data: {
          createdBy: defaultUser,      // デフォルトユーザーを作成者に
          // assignedToは意図的にnullのまま（共有人脈として）
        }
      });
    }
    console.log(`✅ Connections移行完了: ${connections.length}件`);

    // 6. Knowledge Items移行（optional fields）
    console.log('\n📚 Knowledge Items データ移行中...');
    const knowledgeItems = await prisma.knowledge_items.findMany({
      where: {
        createdBy: null
      },
      select: { id: true, author: true }
    });
    
    console.log(`対象ナレッジ: ${knowledgeItems.length}件`);
    
    for (const item of knowledgeItems) {
      await prisma.knowledge_items.update({
        where: { id: item.id },
        data: {
          createdBy: defaultUser,      // デフォルトユーザーを作成者に
          // assignedToは意図的にnullのまま（共有ナレッジとして）
        }
      });
    }
    console.log(`✅ Knowledge Items移行完了: ${knowledgeItems.length}件`);

    // 7. AI Content Analysis移行（optional fields）
    console.log('\n🤖 AI Content Analysis データ移行中...');
    const aiAnalysis = await prisma.ai_content_analysis.findMany({
      where: {
        createdBy: null
      },
      select: { id: true }
    });
    
    console.log(`対象AI分析: ${aiAnalysis.length}件`);
    
    for (const analysis of aiAnalysis) {
      await prisma.ai_content_analysis.update({
        where: { id: analysis.id },
        data: {
          createdBy: defaultUser,      // デフォルトユーザーを作成者に
          // assignedToは意図的にnullのまま（パブリック分析として）
        }
      });
    }
    console.log(`✅ AI Content Analysis移行完了: ${aiAnalysis.length}件`);

    // 移行完了後の確認
    console.log('\n🔍 移行結果確認...');
    const summary = await Promise.all([
      prisma.tasks.count({ where: { assignedTo: { not: null } } }),
      prisma.projects.count({ where: { assignedTo: { not: null } } }),
      prisma.appointments.count({ where: { assignedTo: { not: null } } }),
      prisma.calendar_events.count({ where: { assignedTo: { not: null } } }),
      prisma.connections.count({ where: { createdBy: { not: null } } }),
      prisma.knowledge_items.count({ where: { createdBy: { not: null } } }),
      prisma.ai_content_analysis.count({ where: { createdBy: { not: null } } })
    ]);

    console.log('\n✅ データ移行完了サマリー:');
    console.log(`Tasks (担当者あり): ${summary[0]}件`);
    console.log(`Projects (担当者あり): ${summary[1]}件`);
    console.log(`Appointments (担当者あり): ${summary[2]}件`);
    console.log(`Calendar Events (担当者あり): ${summary[3]}件`);
    console.log(`Connections (作成者あり): ${summary[4]}件`);
    console.log(`Knowledge Items (作成者あり): ${summary[5]}件`);
    console.log(`AI Analysis (作成者あり): ${summary[6]}件`);

    console.log('\n🎉 全データ移行が正常に完了しました！');
    
  } catch (error) {
    console.error('❌ 移行エラー:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプト実行
if (require.main === module) {
  migrateAssigneeData()
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateAssigneeData };