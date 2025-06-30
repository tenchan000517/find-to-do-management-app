# 詳細ダッシュボード機能 マニュアル

## 概要

詳細ダッシュボードは、FIND to DO Management Appの包括的な情報表示機能を提供する従来型ダッシュボードシステムです。プロジェクト進捗、タスク管理、統合システム状況、Discord分析など、全ての重要な情報を一画面で確認できる設計となっています。

### 主要特徴
- **包括的データ表示**：全ての主要機能の統計情報を表示
- **リアルタイム統合システム監視**
- **Discord コミュニティ分析**
- **AI レコメンデーション機能**
- **カスタマイズ可能なダッシュボード表示**

---

## 目次

1. [アーキテクチャ設計](#アーキテクチャ設計)
2. [統計カードシステム](#統計カードシステム)
3. [統合システム監視](#統合システム監視)
4. [データ管理・計算](#データ管理計算)
5. [Discord 分析機能](#discord-分析機能)
6. [AI レコメンデーション](#ai-レコメンデーション)
7. [レスポンシブ設計](#レスポンシブ設計)
8. [実装例](#実装例)
9. [パフォーマンス最適化](#パフォーマンス最適化)
10. [トラブルシューティング](#トラブルシューティング)

---

## アーキテクチャ設計

### コンポーネント構造

```javascript
// Dashboard.tsx の基本構造
export default function Dashboard({ onDataRefresh }) {
  // データフック
  const { tasks, loading: tasksLoading, refreshTasks } = useTasks();
  const { projects, loading: projectsLoading, refreshProjects } = useProjects();
  const { connections, loading: connectionsLoading, refreshConnections } = useConnections();
  const { appointments, loading: appointmentsLoading, reload: reloadAppointments } = useAppointments();
  const { events, loading: eventsLoading, refreshEvents } = useCalendarEvents();
  
  // Discord metrics および レコメンデーション
  const [discordMetrics, setDiscordMetrics] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [integratedSystemStatus, setIntegratedSystemStatus] = useState(null);
  
  // モード切り替え機能
  const [isSimpleMode, setIsSimpleMode] = useState(true);
  
  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      {/* ヘッダー・モード切り替え */}
      <DashboardHeader />
      
      {/* 条件付きダッシュボード表示 */}
      {isSimpleMode ? <SmartDashboard /> : <TraditionalDashboard />}
    </div>
  );
}
```

### データフロー管理

```javascript
// 統合データ管理システム
const DashboardDataManager = {
  // 統計データの一元管理
  calculateStats: (tasks, projects, connections, appointments) => {
    const today = new Date();
    const thisWeekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    return {
      projects: {
        total: projects.length,
        active: projects.filter(p => p.status === 'active').length,
        completed: projects.filter(p => p.status === 'completed').length,
        onHold: projects.filter(p => p.status === 'on_hold').length
      },
      tasks: {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'COMPLETE').length,
        inProgress: tasks.filter(t => ['PLAN', 'DO', 'CHECK'].includes(t.status)).length,
        overdue: tasks.filter(t => {
          if (!t.dueDate) return false;
          const dueDate = new Date(t.dueDate);
          return dueDate < today && t.status !== 'COMPLETE';
        }).length
      },
      connections: {
        total: connections.length,
        companies: connections.filter(c => c.type === 'company').length,
        students: connections.filter(c => c.type === 'student').length,
        thisMonth: connections.filter(c => {
          const createdDate = new Date(c.createdAt);
          return createdDate >= thisMonthStart;
        }).length
      },
      appointments: {
        total: appointments.length,
        scheduled: appointments.filter(a => a.status === 'scheduled').length,
        completed: appointments.filter(a => a.status === 'contacted' || a.status === 'interested').length,
        thisWeek: appointments.filter(a => {
          const lastContact = a.lastContact ? new Date(a.lastContact) : null;
          return lastContact && lastContact >= thisWeekStart;
        }).length
      }
    };
  }
};
```

---

## 統計カードシステム

### StatCard コンポーネント

```javascript
// 統計カード基本コンポーネント
const StatCard = ({ title, value, subtitle, color, icon }) => (
  <Card variant="elevated" padding="normal">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs sm:text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl md:text-3xl font-bold text-gray-900">{value}</p>
        <p className="text-xs sm:text-sm text-gray-500">{subtitle}</p>
      </div>
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${color} flex items-center justify-center`}>
        {icon}
      </div>
    </div>
  </Card>
);

// 使用例
const StatCardsGrid = ({ stats, discordMetrics, discordLoading }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
    <StatCard
      title="アクティブプロジェクト"
      value={stats.projects.active}
      subtitle={`全${stats.projects.total}プロジェクト中`}
      color="bg-blue-100"
      icon="🚀"
    />
    <StatCard
      title="進行中タスク"
      value={stats.tasks.inProgress}
      subtitle={`${stats.tasks.overdue}件が期限超過`}
      color="bg-green-100"
      icon={<CheckCircle className="w-6 h-6" />}
    />
    <StatCard
      title="今月の新規つながり"
      value={stats.connections.thisMonth}
      subtitle={`全${stats.connections.total}件のつながり`}
      color="bg-purple-100"
      icon="👥"
    />
    <StatCard
      title="今週のアポ"
      value={stats.appointments.thisWeek}
      subtitle={`${stats.appointments.scheduled}件予定中`}
      color="bg-orange-100"
      icon="📞"
    />
    <StatCard
      title="コミュニティメンバー"
      value={!discordLoading && discordMetrics.length > 0 ? 
        discordMetrics[discordMetrics.length - 1]?.memberCount || 0 : 0}
      subtitle="Discord総メンバー数"
      color="bg-indigo-100"
      icon="👨‍👩‍👧‍👦"
    />
  </div>
);
```

### 動的統計計算

```javascript
// リアルタイム統計更新システム
const StatisticsCalculator = {
  // 今日のタスク分析
  getTodayTasks: (tasks) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      return dueDate.toDateString() === today.toDateString();
    });
  },
  
  // プロジェクト進捗分析
  getActiveProjects: (projects) => {
    return projects.filter(project => project.status === 'active');
  },
  
  // 期限迫るタスクの計算
  getUpcomingDeadlines: (tasks, daysAhead = 3) => {
    const today = new Date();
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + daysAhead);
    
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= today && dueDate <= targetDate && task.status !== 'COMPLETE';
    });
  },
  
  // 時間分析ユーティリティ
  formatTimeAgo: (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return '数分前';
    if (diffInHours < 24) return `${diffInHours}時間前`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}日前`;
  }
};
```

---

## 統合システム監視

### SystemIntegrator 連携

```javascript
// Phase 5 統合システム状態監視
const IntegratedSystemMonitor = {
  // システム状態取得
  fetchIntegratedSystemStatus: async () => {
    try {
      const response = await fetch('/api/dashboard/integrated');
      if (response.ok) {
        const data = await response.json();
        return data.data || null;
      }
    } catch (error) {
      console.error('Integrated system status fetch error:', error);
      return null;
    }
  },
  
  // SystemIntegrator からの詳細状態取得
  fetchSystemIntegratorStatus: async (systemIntegrator) => {
    try {
      const systemStatus = await systemIntegrator.getSystemStatus();
      return {
        systemIntegrator: systemStatus,
        health: systemStatus.health || 0,
        lastCheck: systemStatus.lastCheck || new Date(),
        performance: systemStatus.performance || {}
      };
    } catch (error) {
      console.error('Failed to fetch system status:', error);
      return null;
    }
  }
};

// 統合システム状態表示コンポーネント
const SystemIntegrationStatus = ({ integratedSystemStatus, systemStatusLoading }) => (
  <Card variant="elevated" padding="normal">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg md:text-xl font-semibold text-gray-900">🚀 システム統合状況</h2>
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${
          integratedSystemStatus?.systemIntegrator?.health > 0.8 ? 'bg-green-500' :
          integratedSystemStatus?.systemIntegrator?.health > 0.5 ? 'bg-yellow-500' : 'bg-red-500'
        }`}></div>
        <span className="text-sm text-gray-600">
          {integratedSystemStatus?.systemIntegrator?.health ? 
            `${Math.round(integratedSystemStatus.systemIntegrator.health * 100)}%` : '0%'}
        </span>
      </div>
    </div>
    
    {systemStatusLoading ? (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    ) : (
      <PhaseStatusGrid systemStatus={integratedSystemStatus} />
    )}
  </Card>
);
```

### Phase別統合監視

```javascript
// Phase別統合状況表示
const PhaseStatusGrid = ({ systemStatus }) => (
  <div className="space-y-3">
    <div className="grid grid-cols-2 gap-4 text-sm">
      <PhaseStatusItem 
        phase="Phase 1" 
        status={systemStatus?.systemIntegrator?.integration?.phase1?.dataIntegrity}
        label="リソース管理統合"
      />
      <PhaseStatusItem 
        phase="Phase 2" 
        status={systemStatus?.systemIntegrator?.integration?.phase2?.performanceOptimized}
        label="パフォーマンス最適化"
      />
      <PhaseStatusItem 
        phase="Phase 3" 
        status={systemStatus?.systemIntegrator?.integration?.phase3?.analyticsIntegrated}
        label="アナリティクス統合"
      />
      <PhaseStatusItem 
        phase="Phase 4" 
        status={systemStatus?.systemIntegrator?.integration?.phase4?.aiAssistant}
        label="AI アシスタント"
      />
    </div>
    
    <div className="pt-3 border-t border-gray-200">
      <SystemPerformanceMetrics performance={systemStatus?.systemIntegrator?.performance} />
    </div>
  </div>
);

const PhaseStatusItem = ({ phase, status, label }) => (
  <div className="flex justify-between">
    <span className="text-gray-600">{phase}</span>
    <span className={`font-medium ${status ? 'text-green-600' : 'text-red-600'}`}>
      {status ? '✅' : '❌'}
    </span>
  </div>
);
```

---

## データ管理・計算

### 最近のアクティビティ生成

```javascript
// 実データからアクティビティを生成
const ActivityGenerator = {
  generateRecentActivities: (tasks, projects, connections) => {
    const activities = [];
    
    // 最近完了したタスク
    const completedTasks = tasks
      .filter(t => t.status === 'COMPLETE')
      .slice(0, 2)
      .map(task => ({
        id: task.id,
        type: 'task',
        title: task.title,
        description: 'タスクが完了されました',
        timestamp: task.updatedAt,
        user: task.user?.name || task.userId || 'Unknown'
      }));
    
    // 最近作成されたプロジェクト
    const recentProjects = projects
      .slice(0, 1)
      .map(project => ({
        id: project.id,
        type: 'project',
        title: project.name,
        description: `プロジェクトの進捗が${project.progress}%に更新されました`,
        timestamp: project.updatedAt,
        user: 'Unknown'
      }));
    
    // 最近追加されたつながり
    const recentConnections = connections
      .slice(0, 1)
      .map(connection => ({
        id: connection.id,
        type: 'connection',
        title: `${connection.name}（${connection.company}）`,
        description: '新しいつながりが追加されました',
        timestamp: connection.createdAt,
        user: 'Unknown'
      }));
    
    activities.push(...completedTasks, ...recentProjects, ...recentConnections);
    
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 4);
  }
};
```

### 今後のイベント計算

```javascript
// カレンダーイベントと締切の統合表示
const EventScheduler = {
  generateUpcomingEvents: (events, tasks) => {
    const upcomingEvents = [];
    
    // カレンダーイベント
    const calendarEvents = events
      .filter(event => {
        const eventDate = new Date(event.startTime);
        const today = new Date();
        return eventDate >= today;
      })
      .slice(0, 2)
      .map(event => ({
        id: event.id,
        title: event.title,
        date: new Date(event.startTime).toISOString().split('T')[0],
        time: new Date(event.startTime).toLocaleTimeString('ja-JP', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        type: event.type
      }));
    
    // 期限が近いタスク（締切として）
    const upcomingDeadlines = tasks
      .filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(today.getDate() + 3);
        return dueDate >= today && dueDate <= threeDaysFromNow && task.status !== 'COMPLETE';
      })
      .slice(0, 2)
      .map(task => ({
        id: task.id,
        title: `${task.title}（締切）`,
        date: new Date(task.dueDate).toISOString().split('T')[0],
        time: '終日',
        type: 'deadline'
      }));
    
    upcomingEvents.push(...calendarEvents, ...upcomingDeadlines);
    
    return upcomingEvents
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 4);
  }
};
```

---

## Discord 分析機能

### Discord メトリクス取得

```javascript
// Discord API データ取得
const DiscordAnalytics = {
  // 基本メトリクス取得
  fetchDiscordMetrics: async (days = 7) => {
    try {
      const response = await fetch(`/api/discord/metrics?days=${days}`);
      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
      return [];
    } catch (error) {
      console.error('Discord metrics fetch error:', error);
      return [];
    }
  },
  
  // 過去7日間のデータ生成
  getLast7Days: () => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      days.push(date);
    }
    return days;
  },
  
  // 特定日のメトリクス取得
  getMetricForDate: (discordMetrics, date) => {
    const dateString = date.toISOString().split('T')[0];
    return discordMetrics.find(m => m.date === dateString);
  }
};
```

### Discord チャート表示

```javascript
// メンバー数推移チャート
const DiscordMemberChart = ({ discordMetrics }) => {
  const last7Days = DiscordAnalytics.getLast7Days();
  
  const chartData = last7Days.map((date, index) => {
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
    const currentMetric = DiscordAnalytics.getMetricForDate(discordMetrics, date);
    const previousMetric = index > 0 ? 
      DiscordAnalytics.getMetricForDate(discordMetrics, last7Days[index-1]) : null;
    
    const newMembers = (currentMetric && previousMetric) 
      ? Math.max(0, currentMetric.memberCount - previousMetric.memberCount) 
      : 0;
    
    return {
      date: dateStr,
      memberCount: currentMetric?.memberCount || 0,
      newMembers: newMembers
    };
  });

  return <MemberChart data={chartData} height={180} />;
};

// ロール分析チャート
const DiscordRoleChart = ({ discordMetrics }) => {
  const last7Days = DiscordAnalytics.getLast7Days();
  
  const chartData = last7Days.map(date => {
    const metric = DiscordAnalytics.getMetricForDate(discordMetrics, date);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
    
    if (!metric?.roleCounts) {
      return {
        date: dateStr,
        'FIND to DO': 0,
        'イベント情報': 0,
        'みんなの告知': 0
      };
    }
    
    const roleCounts = typeof metric.roleCounts === 'string' 
      ? JSON.parse(metric.roleCounts) 
      : metric.roleCounts;
    
    return {
      date: dateStr,
      'FIND to DO': roleCounts['1332242428459221046']?.count || 0,
      'イベント情報': roleCounts['1381201663045668906']?.count || 0,
      'みんなの告知': roleCounts['1382167308180394145']?.count || 0
    };
  });

  const lines = [
    { dataKey: 'FIND to DO', stroke: '#3b82f6' },
    { dataKey: 'イベント情報', stroke: '#10b981' },
    { dataKey: 'みんなの告知', stroke: '#f59e0b' }
  ];

  return <RoleLineChart data={chartData} lines={lines} height={180} />;
};
```

---

## AI レコメンデーション

### レコメンデーション取得・実行

```javascript
// AI レコメンデーション管理システム
const AIRecommendationSystem = {
  // レコメンデーション取得
  fetchRecommendations: async (options = {}) => {
    const params = new URLSearchParams({
      status: options.status || 'PENDING',
      limit: options.limit || '5',
      minRelevance: options.minRelevance || '0.6'
    });
    
    try {
      const response = await fetch(`/api/google-docs/recommendations?${params}`);
      if (response.ok) {
        const data = await response.json();
        return data.data?.recommendations || [];
      }
      return [];
    } catch (error) {
      console.error('Recommendations fetch error:', error);
      return [];
    }
  },
  
  // レコメンデーション実行
  executeRecommendation: async (recommendationId) => {
    try {
      const response = await fetch('/api/google-docs/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          recommendationId,
          params: { userId: 'current-user' }
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Recommendation execution error:', error);
      return { success: false, error: error.message };
    }
  }
};

// レコメンデーション表示コンポーネント
const RecommendationCard = ({ recommendation, onExecute }) => (
  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
    <div className="flex justify-between items-start mb-2">
      <div className="flex-1 mr-2">
        <h4 className="text-sm font-medium text-gray-900 truncate">
          {recommendation.title}
        </h4>
        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
          {recommendation.description}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <ImpactBadge impact={recommendation.estimatedImpact} />
      </div>
    </div>
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span>関連性: {Math.round(recommendation.relevance_score * 100)}%</span>
        <span>実行性: {Math.round(recommendation.executabilityScore * 100)}%</span>
      </div>
      <Button
        onClick={() => onExecute(recommendation.id)}
        size="sm"
        className="px-2 py-1 text-xs"
      >
        実行
      </Button>
    </div>
  </div>
);
```

---

## レスポンシブ設計

### グリッドレイアウト対応

```javascript
// レスポンシブグリッドシステム
const ResponsiveGridSystem = {
  // 統計カード用グリッド
  statCardsGrid: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4",
  
  // メインダッシュボード用グリッド
  mainDashboardGrid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6",
  
  // Discord分析用グリッド
  discordAnalyticsGrid: "grid grid-cols-1 lg:grid-cols-4 gap-6",
  
  // 二列レイアウト
  twoColumnGrid: "grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8",
  
  // デバイス別表示制御
  getDeviceSpecificClasses: (device) => {
    const classes = {
      mobile: {
        text: "text-xs sm:text-sm",
        card: "p-4",
        grid: "grid-cols-1"
      },
      tablet: {
        text: "text-sm md:text-base", 
        card: "p-4 md:p-6",
        grid: "grid-cols-1 md:grid-cols-2"
      },
      desktop: {
        text: "text-base lg:text-lg",
        card: "p-6 lg:p-8", 
        grid: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
      }
    };
    
    return classes[device] || classes.desktop;
  }
};
```

### モバイル最適化

```javascript
// モバイル対応コンポーネント
const MobileOptimizedCard = ({ title, children, className = "" }) => (
  <Card 
    variant="elevated" 
    padding="normal" 
    className={`${className} overflow-hidden`}
  >
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg md:text-xl font-semibold text-gray-900 truncate">
        {title}
      </h2>
    </div>
    <div className="overflow-x-auto">
      {children}
    </div>
  </Card>
);

// タッチ対応インタラクション
const TouchOptimizedButton = ({ children, onClick, className = "" }) => (
  <button
    onClick={onClick}
    className={`
      ${className}
      min-h-[44px] min-w-[44px] 
      touch-manipulation
      active:scale-95 
      transition-transform duration-150
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    `}
  >
    {children}
  </button>
);
```

---

## 実装例

### 完全なダッシュボード実装

```javascript
// TraditionalDashboard の完全実装例
const TraditionalDashboard = () => {
  const [stats, setStats] = useState(initialStats);
  const [discordMetrics, setDiscordMetrics] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [integratedSystemStatus, setIntegratedSystemStatus] = useState(null);
  
  // データ取得とリアルタイム更新
  useEffect(() => {
    const fetchAllData = async () => {
      const [discord, recs, systemStatus] = await Promise.all([
        DiscordAnalytics.fetchDiscordMetrics(7),
        AIRecommendationSystem.fetchRecommendations(),
        IntegratedSystemMonitor.fetchIntegratedSystemStatus()
      ]);
      
      setDiscordMetrics(discord);
      setRecommendations(recs);
      setIntegratedSystemStatus(systemStatus);
    };
    
    fetchAllData();
    
    // 5分ごとの自動更新
    const interval = setInterval(fetchAllData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div>
      {/* 統計カード */}
      <StatCardsGrid stats={stats} discordMetrics={discordMetrics} />
      
      {/* Phase 5: 統合システム概要 */}
      <IntegratedSystemOverview systemStatus={integratedSystemStatus} />
      
      {/* メインコンテンツグリッド */}
      <MainContentGrid 
        stats={stats}
        discordMetrics={discordMetrics}
        recommendations={recommendations}
        integratedSystemStatus={integratedSystemStatus}
      />
      
      {/* Discord 分析セクション */}
      <DiscordAnalyticsSection discordMetrics={discordMetrics} />
      
      {/* 最下部セクション */}
      <BottomSection 
        recommendations={recommendations}
        onExecuteRecommendation={handleExecuteRecommendation}
      />
    </div>
  );
};
```

---

## パフォーマンス最適化

### データキャッシュ戦略

```javascript
// パフォーマンス最適化システム
const DashboardPerformanceOptimizer = {
  // メモ化によるレンダリング最適化
  memoizedComponents: {
    StatCard: React.memo(StatCard),
    ProjectProgressCard: React.memo(ProjectProgressCard),
    DiscordChart: React.memo(DiscordMemberChart)
  },
  
  // データキャッシュ
  cacheManager: {
    set: (key, data, ttl = 5 * 60 * 1000) => {
      const item = {
        data,
        timestamp: Date.now(),
        ttl
      };
      localStorage.setItem(`dashboard_cache_${key}`, JSON.stringify(item));
    },
    
    get: (key) => {
      const item = localStorage.getItem(`dashboard_cache_${key}`);
      if (!item) return null;
      
      const parsed = JSON.parse(item);
      if (Date.now() - parsed.timestamp > parsed.ttl) {
        localStorage.removeItem(`dashboard_cache_${key}`);
        return null;
      }
      
      return parsed.data;
    }
  },
  
  // 遅延ローディング
  lazyLoadComponents: {
    DiscordAnalytics: React.lazy(() => import('./DiscordAnalyticsSection')),
    RecommendationSection: React.lazy(() => import('./RecommendationSection'))
  }
};
```

### バッチAPI呼び出し

```javascript
// 効率的なAPI呼び出し管理
const APIBatchManager = {
  // 並列データ取得
  fetchDashboardData: async () => {
    const batchRequests = [
      fetch('/api/discord/metrics?days=7'),
      fetch('/api/google-docs/recommendations?status=PENDING&limit=5'),
      fetch('/api/dashboard/integrated'),
      fetch('/api/analytics/dashboard')
    ];
    
    try {
      const responses = await Promise.allSettled(batchRequests);
      
      const results = await Promise.allSettled(
        responses.map(response => 
          response.status === 'fulfilled' && response.value.ok ? 
          response.value.json() : null
        )
      );
      
      return {
        discord: results[0]?.value?.data || [],
        recommendations: results[1]?.value?.data?.recommendations || [],
        systemStatus: results[2]?.value?.data || null,
        analytics: results[3]?.value?.data || null
      };
    } catch (error) {
      console.error('Batch API fetch error:', error);
      return {};
    }
  }
};
```

---

## トラブルシューティング

### よくある問題と解決策

#### 1. データローディングが遅い

```javascript
// ローディング状態最適化
const LoadingStateManager = {
  // 段階的ローディング
  useStaggeredLoading: () => {
    const [loadingStates, setLoadingStates] = useState({
      stats: true,
      discord: true,
      recommendations: true,
      system: true
    });
    
    const updateLoadingState = (key, isLoading) => {
      setLoadingStates(prev => ({ ...prev, [key]: isLoading }));
    };
    
    return { loadingStates, updateLoadingState };
  },
  
  // スケルトンUI
  SkeletonCard: () => (
    <Card variant="elevated" padding="normal" className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
    </Card>
  )
};
```

#### 2. レスポンシブ表示の問題

```javascript
// レスポンシブ問題の対処
const ResponsiveDebugger = {
  // ブレークポイント検出
  useBreakpoint: () => {
    const [breakpoint, setBreakpoint] = useState('desktop');
    
    useEffect(() => {
      const updateBreakpoint = () => {
        const width = window.innerWidth;
        if (width < 768) setBreakpoint('mobile');
        else if (width < 1024) setBreakpoint('tablet');
        else setBreakpoint('desktop');
      };
      
      updateBreakpoint();
      window.addEventListener('resize', updateBreakpoint);
      return () => window.removeEventListener('resize', updateBreakpoint);
    }, []);
    
    return breakpoint;
  },
  
  // デバッグ用表示
  BreakpointIndicator: () => (
    <div className="fixed top-4 right-4 z-50 bg-black text-white px-2 py-1 rounded text-xs">
      <span className="sm:hidden">XS</span>
      <span className="hidden sm:block md:hidden">SM</span>
      <span className="hidden md:block lg:hidden">MD</span>
      <span className="hidden lg:block xl:hidden">LG</span>
      <span className="hidden xl:block">XL</span>
    </div>
  )
};
```

#### 3. メモリリーク対策

```javascript
// メモリ管理システム
const MemoryManager = {
  // クリーンアップ処理
  useCleanup: () => {
    const cleanup = useCallback(() => {
      // インターバルクリア
      const intervals = window.dashboardIntervals || [];
      intervals.forEach(clearInterval);
      window.dashboardIntervals = [];
      
      // イベントリスナー削除
      const listeners = window.dashboardListeners || [];
      listeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      window.dashboardListeners = [];
    }, []);
    
    useEffect(() => {
      return cleanup;
    }, [cleanup]);
  },
  
  // メモリ使用量監視
  monitorMemoryUsage: () => {
    if (performance.memory) {
      console.log('Memory usage:', {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB',
        total: Math.round(performance.memory.totalJSHeapSize / 1048576) + 'MB',
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) + 'MB'
      });
    }
  }
};
```

---

このマニュアルは、詳細ダッシュボードの包括的な実装・運用ガイドです。システム全体の統合監視から個別機能の詳細表示まで、全ての重要な情報を効率的に管理・表示するためのベストプラクティスを提供します。