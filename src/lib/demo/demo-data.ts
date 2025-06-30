// デモモード用サンプルデータ
// 未ログインユーザーが自動予定生成機能を体験できるリアルなデータセット

export const DEMO_TASKS = [
  {
    id: 'demo-task-1',
    title: 'プロジェクト企画書作成',
    status: 'DO',
    priority: 'HIGH',
    estimatedHours: 2,
    dueDate: new Date(Date.now() + 86400000).toISOString(), // 1日後
    description: '来週の提案に向けて企画書を完成させる',
    category: 'PROJECT',
    tags: ['企画', '重要', '提案'],
    projectId: 'demo-project-1'
  },
  {
    id: 'demo-task-2', 
    title: 'チーム会議資料準備',
    status: 'DO',
    priority: 'MEDIUM',
    estimatedHours: 1.5,
    dueDate: new Date(Date.now() + 3600000 * 8).toISOString(), // 8時間後
    description: '明日の定例会議用資料作成',
    category: 'PROJECT',
    tags: ['会議', '資料作成'],
    projectId: 'demo-project-1'
  },
  {
    id: 'demo-task-3',
    title: 'メール返信対応',
    status: 'DO', 
    priority: 'LOW',
    estimatedHours: 0.5,
    dueDate: new Date(Date.now() + 3600000 * 4).toISOString(), // 4時間後
    description: '顧客からの問い合わせ対応',
    category: 'PERSONAL',
    tags: ['メール', 'コミュニケーション'],
    projectId: null
  },
  {
    id: 'demo-task-4',
    title: 'システム設計書レビュー',
    status: 'DO',
    priority: 'HIGH',
    estimatedHours: 3,
    dueDate: new Date(Date.now() + 3600000 * 12).toISOString(), // 12時間後
    description: '新機能の設計書を詳細レビュー',
    category: 'PROJECT',
    tags: ['レビュー', '設計', '技術'],
    projectId: 'demo-project-2'
  },
  {
    id: 'demo-task-5',
    title: '月次報告書作成',
    status: 'DO',
    priority: 'MEDIUM', 
    estimatedHours: 2,
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString(), // 2日後
    description: '今月の活動をまとめて報告書作成',
    category: 'PROJECT',
    tags: ['報告書', '月次', '管理'],
    projectId: 'demo-project-1'
  },
  {
    id: 'demo-task-6',
    title: 'コードレビュー対応',
    status: 'DO',
    priority: 'MEDIUM',
    estimatedHours: 1,
    dueDate: new Date(Date.now() + 3600000 * 6).toISOString(), // 6時間後
    description: 'PRレビューコメントへの対応',
    category: 'PROJECT',
    tags: ['開発', 'レビュー'],
    projectId: 'demo-project-2'
  },
  {
    id: 'demo-task-7',
    title: 'ドキュメント更新',
    status: 'DO',
    priority: 'LOW',
    estimatedHours: 1.5,
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString(), // 3日後
    description: 'APIドキュメントの更新作業',
    category: 'PROJECT',
    tags: ['ドキュメント', '開発'],
    projectId: 'demo-project-2'
  }
];

export const DEMO_EVENTS = [
  {
    id: 'demo-event-1',
    title: 'チーム定例会議',
    startTime: new Date(Date.now() + 3600000 * 2).toISOString(), // 2時間後
    endTime: new Date(Date.now() + 3600000 * 3).toISOString(), // 3時間後
    type: 'MEETING',
    category: 'PROJECT',
    importance: 0.8,
    location: 'オンライン',
    description: '週次進捗報告と今週の計画確認',
    attendees: ['山田太郎', '佐藤花子', '鈴木一郎']
  },
  {
    id: 'demo-event-2',
    title: '顧客プレゼンテーション',
    startTime: new Date(Date.now() + 3600000 * 6).toISOString(), // 6時間後
    endTime: new Date(Date.now() + 3600000 * 7.5).toISOString(), // 7.5時間後
    type: 'MEETING',
    category: 'PROJECT',
    importance: 0.9,
    location: '会議室A',
    description: '新システム提案のプレゼンテーション',
    attendees: ['顧客担当者', '営業部長', 'プロジェクトマネージャー']
  },
  {
    id: 'demo-event-3',
    title: 'ランチ休憩',
    startTime: new Date(Date.now() + 3600000 * 4).toISOString(), // 4時間後
    endTime: new Date(Date.now() + 3600000 * 5).toISOString(), // 5時間後
    type: 'PERSONAL',
    category: 'PERSONAL',
    importance: 0.6,
    location: '',
    description: '',
    attendees: []
  },
  {
    id: 'demo-event-4',
    title: '技術勉強会',
    startTime: new Date(Date.now() + 86400000 + 3600000 * 3).toISOString(), // 翌日15時
    endTime: new Date(Date.now() + 86400000 + 3600000 * 4).toISOString(), // 翌日16時
    type: 'LEARNING',
    category: 'PERSONAL',
    importance: 0.7,
    location: 'オンライン',
    description: 'Next.js 15の新機能について',
    attendees: ['開発チーム']
  }
];

export const DEMO_USER_PREFERENCES = {
  workStartTime: '09:00',
  workEndTime: '18:00', 
  lunchTime: '12:00',
  lunchDuration: 60,
  breakInterval: 90, // 90分ごとに休憩
  breakDuration: 10, // 10分休憩
  personalityType: 'balanced',
  productivityPattern: {
    morning: 0.9,         // 朝は生産性高い
    earlyAfternoon: 0.8,  // 昼食後は少し低下
    lateAfternoon: 0.7,   // 夕方は疲労で低下
    evening: 0.6          // 夜は最も低い
  },
  taskPreferences: {
    preferHighPriorityInMorning: true,
    preferShortTasksAfterLunch: true,
    maxConsecutiveWorkHours: 2
  },
  notificationSettings: {
    taskReminder: 15,     // タスク開始15分前に通知
    breakReminder: true,
    dailySummary: true
  }
};

// デモプロジェクト情報
export const DEMO_PROJECTS = [
  {
    id: 'demo-project-1',
    name: '新商品開発プロジェクト',
    description: '2024年度の主力商品開発',
    color: '#4F46E5',
    progress: 65
  },
  {
    id: 'demo-project-2',
    name: 'システム改善プロジェクト',
    description: '社内システムの効率化',
    color: '#10B981',
    progress: 40
  }
];

// デモユーザー情報
export const DEMO_USER = {
  id: 'demo-user',
  name: 'デモユーザー',
  email: 'demo@example.com',
  avatar: null,
  role: 'プロジェクトマネージャー',
  department: '開発部'
};

// AI分析用のデモ統計データ
export const DEMO_STATISTICS = {
  completionRate: {
    today: 0.75,
    thisWeek: 0.82,
    thisMonth: 0.78
  },
  averageTaskDuration: {
    estimated: 2.5,
    actual: 2.8
  },
  productivityByTimeOfDay: {
    '09:00-11:00': 0.9,
    '11:00-13:00': 0.85,
    '13:00-15:00': 0.75,
    '15:00-17:00': 0.8,
    '17:00-19:00': 0.7
  },
  taskCategories: {
    PROJECT: 70,
    PERSONAL: 20,
    LEARNING: 10
  }
};

// デモ生産性パターン（AI分析表示用）
export const DEMO_PRODUCTIVITY_INSIGHTS = {
  bestWorkingHours: ['09:00-11:00', '15:00-17:00'],
  recommendedBreakTimes: ['10:30', '12:00', '15:30'],
  suggestedTaskOrder: [
    'HIGH優先度の集中作業',
    '会議・コミュニケーション',
    'レビュー・確認作業',
    '軽いタスク・メール対応'
  ],
  dailyCapacity: {
    focusWork: 4, // 集中作業可能時間
    meetings: 3,  // 会議可能時間
    adminWork: 1  // 事務作業時間
  }
};