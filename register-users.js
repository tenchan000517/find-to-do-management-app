// ユーザーマスター登録スクリプト
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const users = [
  {
    id: 'user_kawashima',
    name: '川島',
    email: 'kawashima@company.com',
    lineUserId: 'Ua1ffc5321b117a134dfe6eb8a3827294',
    discordId: '1281631920308097046',
    color: '#FF6B6B',
    skills: {
      technical: ['プロジェクト管理', 'システム開発', 'AI技術'],
      business: ['戦略企画', 'チームリーダーシップ', '予算管理'],
      personal: ['問題解決', 'コミュニケーション', '意思決定']
    },
    preferences: {
      workHours: '9:00-18:00',
      meetingStyle: 'face-to-face',
      communicationStyle: 'direct',
      workLocation: 'office'
    },
    workStyle: {
      taskApproach: 'systematic',
      decisionMaking: 'analytical',
      teamCollaboration: 'leader',
      timeManagement: 'structured'
    }
  },
  {
    id: 'user_yumikino',
    name: '弓木野',
    email: 'yumikino@company.com',
    lineUserId: 'Uf1bb3a48bf5974b39540482116dd6d09',
    discordId: '1131429130823536702',
    color: '#4ECDC4',
    skills: {
      technical: ['フロントエンド開発', 'UI/UX設計', 'デザイン'],
      business: ['クライアント対応', 'ユーザー分析', 'プロダクト企画'],
      personal: ['創造性', '注意力', 'チームワーク']
    },
    preferences: {
      workHours: '10:00-19:00',
      meetingStyle: 'online',
      communicationStyle: 'collaborative',
      workLocation: 'hybrid'
    },
    workStyle: {
      taskApproach: 'creative',
      decisionMaking: 'intuitive',
      teamCollaboration: 'supporter',
      timeManagement: 'flexible'
    }
  },
  {
    id: 'user_urushibata',
    name: '漆畑',
    email: 'urushibata@company.com',
    lineUserId: 'U869a0f7f41941e953d75f5e5f73d947f',
    discordId: '976427276340166696',
    color: '#45B7D1',
    skills: {
      technical: ['バックエンド開発', 'データベース設計', 'インフラ構築'],
      business: ['技術仕様策定', 'システム分析', '品質管理'],
      personal: ['論理思考', '継続性', '技術学習']
    },
    preferences: {
      workHours: '8:00-17:00',
      meetingStyle: 'online',
      communicationStyle: 'technical',
      workLocation: 'remote'
    },
    workStyle: {
      taskApproach: 'methodical',
      decisionMaking: 'evidence-based',
      teamCollaboration: 'specialist',
      timeManagement: 'planned'
    }
  },
  {
    id: 'user_ikemoto',
    name: '池本',
    email: 'ikemoto@company.com',
    lineUserId: 'U65edb578f123dd915c6519f4b5730266',
    discordId: '1143373602675232859',
    color: '#96CEB4',
    skills: {
      technical: ['営業支援システム', 'データ分析', 'CRM管理'],
      business: ['営業戦略', '顧客管理', '売上分析'],
      personal: ['交渉力', '関係構築', 'プレゼンテーション']
    },
    preferences: {
      workHours: '9:30-18:30',
      meetingStyle: 'face-to-face',
      communicationStyle: 'persuasive',
      workLocation: 'office'
    },
    workStyle: {
      taskApproach: 'goal-oriented',
      decisionMaking: 'result-focused',
      teamCollaboration: 'coordinator',
      timeManagement: 'deadline-driven'
    }
  },
  {
    id: 'user_iida',
    name: '飯田',
    email: 'iida@company.com',
    lineUserId: 'U89f20854525d480262ad4d290b5767d2',
    discordId: '1232977995673894937',
    color: '#FFEAA7',
    skills: {
      technical: ['品質保証', 'テスト設計', '業務分析'],
      business: ['プロセス改善', '文書管理', 'コンプライアンス'],
      personal: ['詳細志向', '正確性', '責任感']
    },
    preferences: {
      workHours: '9:00-18:00',
      meetingStyle: 'structured',
      communicationStyle: 'precise',
      workLocation: 'office'
    },
    workStyle: {
      taskApproach: 'thorough',
      decisionMaking: 'careful',
      teamCollaboration: 'quality-keeper',
      timeManagement: 'precise'
    }
  }
];

async function registerUsers() {
  try {
    console.log('👥 ユーザーマスター登録開始...\n');

    // 既存のユーザー確認（削除はしない - 外部キー制約のため）
    const existingUsers = await prisma.users.findMany({
      select: { name: true }
    });
    console.log('既存ユーザー:', existingUsers.map(u => u.name).join(', '));

    // 新しいユーザーを登録
    for (const user of users) {
      try {
        const createdUser = await prisma.users.create({
          data: user
        });
        console.log(`✅ ${user.name}を登録しました (ID: ${createdUser.id})`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️  ${user.name}は既に登録済みです`);
        } else {
          console.error(`❌ ${user.name}の登録に失敗:`, error.message);
        }
      }
    }

    // 登録結果確認
    const totalUsers = await prisma.users.count();
    console.log(`\n📊 現在のユーザー数: ${totalUsers}`);

    const allUsers = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        lineUserId: true,
        discordId: true,
        color: true
      }
    });

    console.log('\n👥 登録済みユーザー一覧:');
    allUsers.forEach(user => {
      console.log(`  • ${user.name} (LINE: ${user.lineUserId ? '✓' : '✗'}, Discord: ${user.discordId ? '✓' : '✗'})`);
    });

    console.log('\n🎯 ユーザーマスター登録完了！');
    console.log('\n💡 次のステップ:');
    console.log('1. タスクデータの登録');
    console.log('2. プロジェクトデータの登録');
    console.log('3. アポイントメント・コネクションデータの登録');

  } catch (error) {
    console.error('❌ ユーザー登録エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

registerUsers();