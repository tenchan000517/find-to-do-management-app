// 統合データ登録スクリプト（プロジェクト、コネクション、カレンダー）
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

// ユーザー名からIDへのマッピング
const userMapping = {
  '川島': 'user_kawashima',
  '飯田': 'user_iida',
  '弓木野': 'user_yumikino',
  '漆畑': 'user_urushibata',
  '池本': 'user_ikemoto',
  'watairu': 'user_kawashima' // 仮マッピング
};

// ステータスマッピング
const projectStatusMapping = {
  '進行中': 'ACTIVE',
  '未着手': 'PLANNING',
  '完了': 'COMPLETED'
};

const priorityMapping = {
  '高': 'A',
  '中': 'B',
  '低': 'C',
  '': 'C'
};

// ヘルパー関数
function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function parseDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  // 日本語日付形式を変換
  const match = dateStr.match(/(\d{4})[年-](\d{1,2})[月-](\d{1,2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return dateStr;
}

function generateKGI(projectName, assignee) {
  const kgiTemplates = {
    '動画': `${projectName}の動画制作完了と顧客満足度95%達成`,
    'イベント': `${projectName}の成功開催と参加者満足度90%達成`,
    'ワークショップ': `${projectName}の開催と学習効果測定完了`,
    'システム': `${projectName}の開発完了とリリース`,
    'マーケティング': `${projectName}の実施と目標指標達成`
  };
  
  for (const [key, template] of Object.entries(kgiTemplates)) {
    if (projectName.includes(key)) {
      return template;
    }
  }
  
  return `${projectName}の完了と成果創出`;
}

async function importProjects() {
  console.log('📁 プロジェクトデータをインポート中...');
  
  const projectsData = JSON.parse(fs.readFileSync('projects.json', 'utf8'));
  let importedCount = 0;
  
  for (const proj of projectsData.projects) {
    try {
      const assigneeId = userMapping[proj.assignee] || null;
      const teamMembers = assigneeId ? [assigneeId] : [];
      
      const project = await prisma.projects.create({
        data: {
          id: generateId('proj'),
          name: proj.project_name,
          description: proj.content || `${proj.project_name}に関するプロジェクト`,
          status: projectStatusMapping[proj.status] || 'PLANNING',
          progress: proj.progress_percentage || 0,
          startDate: parseDate(proj.start_date),
          endDate: proj.end_date ? parseDate(proj.end_date) : null,
          teamMembers: teamMembers,
          priority: priorityMapping[proj.priority] || 'C',
          phase: proj.status === '完了' ? 'completion' : 'execution',
          kgi: generateKGI(proj.project_name, proj.assignee)
        }
      });
      
      // プロジェクトに関連するタスクを自動生成
      if (assigneeId) {
        const taskTemplates = [
          { title: `${proj.project_name} - 企画・設計`, status: 'PLAN', priority: 'A' },
          { title: `${proj.project_name} - 実装・制作`, status: 'DO', priority: 'A' },
          { title: `${proj.project_name} - 確認・テスト`, status: 'CHECK', priority: 'B' },
          { title: `${proj.project_name} - 完了・納品`, status: 'IDEA', priority: 'B' }
        ];
        
        for (const [index, template] of taskTemplates.entries()) {
          await prisma.tasks.create({
            data: {
              id: generateId('task'),
              title: template.title,
              description: `${proj.project_name}プロジェクトの${template.title.split(' - ')[1]}段階`,
              status: index === 0 ? template.status : 'IDEA',
              priority: template.priority,
              dueDate: proj.end_date ? parseDate(proj.end_date) : null,
              userId: assigneeId,
              projectId: project.id,
              estimatedHours: 8,
              resourceWeight: 0.5 + (index * 0.1)
            }
          });
        }
      }
      
      importedCount++;
      console.log(`✅ プロジェクト「${proj.project_name}」をインポート`);
      
    } catch (error) {
      console.error(`❌ プロジェクト「${proj.project_name}」のインポート失敗:`, error.message);
    }
  }
  
  console.log(`📊 プロジェクト ${importedCount}件をインポート完了\n`);
}

async function importConnections() {
  console.log('🤝 コネクションデータをインポート中...');
  
  const connectionsData = JSON.parse(fs.readFileSync('connection.json', 'utf8'));
  let importedCount = 0;
  
  for (const contact of connectionsData.contacts) {
    try {
      const connection = await prisma.connections.create({
        data: {
          id: generateId('conn'),
          date: new Date().toISOString().split('T')[0],
          location: contact.connection || '不明',
          company: contact.company || '未設定',
          name: contact.name,
          position: contact.position || '未設定',
          type: contact.category === '企業' ? 'COMPANY' : contact.category === '学生' ? 'PERSONAL' : 'COMPANY',
          description: `${contact.company}の${contact.position}`,
          conversation: contact.notes || '初回コンタクト',
          potential: contact.additional_info || 'ビジネス連携可能性',
          businessCard: null,
          updatedAt: new Date()
        }
      });
      
      importedCount++;
      console.log(`✅ コネクション「${contact.name}（${contact.company}）」をインポート`);
      
    } catch (error) {
      console.error(`❌ コネクション「${contact.name}」のインポート失敗:`, error.message);
    }
  }
  
  console.log(`📊 コネクション ${importedCount}件をインポート完了\n`);
}

async function importCalendarEvents() {
  console.log('📅 カレンダーイベントをインポート中...');
  
  const calendarData = JSON.parse(fs.readFileSync('calender.json', 'utf8'));
  let importedCount = 0;
  
  for (const event of calendarData.events) {
    try {
      // イベントタイプマッピング
      const eventTypeMapping = {
        '企業イベント': 'MEETING',
        'オンラインミーティング': 'MEETING',
        '対面': 'MEETING',
        '学生イベント': 'EVENT',
        'コミュニティイベント': 'EVENT',
        '自社イベント': 'EVENT',
        'イベント告知日': 'EVENT',
        '': 'MEETING'
      };
      
      const participants = event.organizer ? [event.organizer] : [];
      
      const calendarEvent = await prisma.calendar_events.create({
        data: {
          id: generateId('cal'),
          title: event.name,
          date: parseDate(event.date.split(' - ')[0]), // 期間の場合は開始日のみ
          time: '10:00', // デフォルト時間
          type: eventTypeMapping[event.type] || 'MEETING',
          description: `${event.type || 'ミーティング'}: ${event.name}`,
          participants: participants,
          location: event.type === 'オンラインミーティング' ? 'オンライン' : '名古屋'
        }
      });
      
      importedCount++;
      console.log(`✅ イベント「${event.name}」をインポート`);
      
    } catch (error) {
      console.error(`❌ イベント「${event.name}」のインポート失敗:`, error.message);
    }
  }
  
  console.log(`📊 カレンダーイベント ${importedCount}件をインポート完了\n`);
}

async function generateAppointments() {
  console.log('📅 アポイントメントデータを生成中...');
  
  // 実在の人物の個人情報を推測で生成するのは適切でないため、
  // サンプルデータのみ作成（架空の企業・人物）
  const sampleAppointments = [
    {
      companyName: 'サンプル商事株式会社',
      contactName: 'テスト太郎',
      phone: '052-123-4567',
      email: 'test@sample-company.com',
      status: 'INTERESTED',
      nextAction: 'プロダクト説明資料の送付',
      notes: 'サンプルデータ：実際のアポイントメントは手動で登録してください',
      priority: 'A'
    },
    {
      companyName: 'デモ技術開発',
      contactName: 'サンプル花子',
      phone: '052-987-6543',
      email: 'demo@demo-tech.com',
      status: 'CONTACTED',
      nextAction: '次回ミーティング日程調整',
      notes: 'サンプルデータ：実際のアポイントメントは手動で登録してください',
      priority: 'B'
    }
  ];
  
  let generatedCount = 0;
  
  for (const appt of sampleAppointments) {
    try {
      await prisma.appointments.create({
        data: {
          id: generateId('appt'),
          companyName: appt.companyName,
          contactName: appt.contactName,
          phone: appt.phone,
          email: appt.email,
          status: appt.status,
          lastContact: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          nextAction: appt.nextAction,
          notes: appt.notes,
          priority: appt.priority
        }
      });
      
      generatedCount++;
      console.log(`✅ サンプルアポイントメント「${appt.contactName}（${appt.companyName}）」を生成`);
      
    } catch (error) {
      console.error(`❌ アポイントメント生成失敗:`, error.message);
    }
  }
  
  console.log(`📊 サンプルアポイントメント ${generatedCount}件を生成完了`);
  console.log(`💡 実際のアポイントメントは/appointmentsページから手動で登録してください\n`);
}

async function main() {
  try {
    console.log('🚀 データインポート開始...\n');
    
    // 既存のテストデータをクリア（ユーザーは保持）
    console.log('🧹 既存データをクリア中...');
    await prisma.tasks.deleteMany({});
    await prisma.projects.deleteMany({});
    await prisma.connections.deleteMany({});
    await prisma.calendar_events.deleteMany({});
    await prisma.appointments.deleteMany({});
    console.log('✅ 既存データクリア完了\n');
    
    // データインポート実行
    await importProjects();
    await importConnections();
    await importCalendarEvents();
    await generateAppointments();
    
    // 統計情報表示
    const stats = await Promise.all([
      prisma.users.count(),
      prisma.projects.count(),
      prisma.tasks.count(),
      prisma.connections.count(),
      prisma.calendar_events.count(),
      prisma.appointments.count()
    ]);
    
    console.log('📊 インポート完了統計:');
    console.log(`   👥 ユーザー: ${stats[0]}件`);
    console.log(`   📁 プロジェクト: ${stats[1]}件`);
    console.log(`   📋 タスク: ${stats[2]}件`);
    console.log(`   🤝 コネクション: ${stats[3]}件`);
    console.log(`   📅 カレンダー: ${stats[4]}件`);
    console.log(`   📅 アポイントメント: ${stats[5]}件`);
    console.log(`   📊 総データ数: ${stats.reduce((a, b) => a + b, 0)}件`);
    
    console.log('\n🎉 データインポート完了！');
    console.log('\n💡 次のステップ:');
    console.log('1. ブラウザで http://localhost:3000 にアクセス');
    console.log('2. 各ページでデータが正常に表示されることを確認');
    console.log('3. Phase 6の新機能（プロジェクト昇華、KGI生成）をテスト');
    
  } catch (error) {
    console.error('❌ データインポートエラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();