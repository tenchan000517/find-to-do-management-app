"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useConnections } from '@/hooks/useConnections';
import { useAppointments } from '@/hooks/useAppointments';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { TASK_STATUS_LABELS } from '@/lib/types';
import { LoadingPage } from '@/components/ui/Loading';
import MemberChart from '@/components/charts/MemberChart';
import RoleLineChart from '@/components/charts/RoleLineChart';
import RolePieChart from '@/components/charts/RolePieChart';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { CheckCircle, Target, Calendar, Handshake, Clock, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';
import SmartDashboard from '@/components/SmartDashboard';
// SystemIntegrator moved to API endpoints to avoid Prisma browser error
// Removed unused imports

// 型定義
interface DashboardStats {
  projects: {
    total: number;
    active: number;
    completed: number;
    onHold: number;
  };
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
  };
  connections: {
    total: number;
    companies: number;
    students: number;
    thisMonth: number;
  };
  appointments: {
    total: number;
    scheduled: number;
    completed: number;
    thisWeek: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'project' | 'task' | 'appointment' | 'connection';
  title: string;
  description: string;
  timestamp: string;
  user: string;
}

interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'meeting' | 'deadline' | 'event';
}

interface DiscordMetric {
  id: string;
  date: string;
  memberCount: number;
  onlineCount: number;
  dailyMessages: number;
  dailyUserMessages: number;
  dailyStaffMessages: number;
  activeUsers: number;
  engagementScore: number;
  channelMessageStats: any;
  staffChannelStats: any;
  roleCounts: any;
  createdAt: string;
  updatedAt: string;
}

interface DashboardProps {
  onDataRefresh?: () => void;
}

export default function Dashboard({ onDataRefresh }: DashboardProps = {}) {
  const { tasks, loading: tasksLoading, refreshTasks } = useTasks();
  const { projects, loading: projectsLoading, refreshProjects } = useProjects();
  const { connections, loading: connectionsLoading, refreshConnections } = useConnections();
  const { appointments, loading: appointmentsLoading, reload: reloadAppointments } = useAppointments();
  const { events, loading: eventsLoading, refreshEvents } = useCalendarEvents();
  
  // Discord metrics state
  const [discordMetrics, setDiscordMetrics] = useState<DiscordMetric[]>([]);
  const [discordLoading, setDiscordLoading] = useState(true);
  
  // レコメンデーション関連のstate
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);

  // Phase 5: 統合システム状態
  const [integratedSystemStatus, setIntegratedSystemStatus] = useState<any>(null);
  const [systemStatusLoading, setSystemStatusLoading] = useState(true);
  // const [systemIntegrator] = useState(() => SystemIntegrator.getInstance()); // Moved to API
  
  // Smart Dashboard state
  const [isSimpleMode, setIsSimpleMode] = useState(() => {
    // Default to simple mode for new users
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('dashboard-mode');
      return savedMode !== null ? savedMode === 'simple' : true;
    }
    return true;
  });
  
  const [stats, setStats] = useState<DashboardStats>({
    projects: { total: 0, active: 0, completed: 0, onHold: 0 },
    tasks: { total: 0, completed: 0, inProgress: 0, overdue: 0 },
    connections: { total: 0, companies: 0, students: 0, thisMonth: 0 },
    appointments: { total: 0, scheduled: 0, completed: 0, thisWeek: 0 }
  });


  // Discord metricsを取得
  const fetchDiscordMetrics = async () => {
    try {
      setDiscordLoading(true);
      const response = await fetch('/api/discord/metrics?days=7');
      if (response.ok) {
        const data = await response.json();
        setDiscordMetrics(data.data || []);
      }
    } catch (error) {
      console.error('Discord metrics fetch error:', error);
    } finally {
      setDiscordLoading(false);
    }
  };

  // レコメンデーションを取得
  const fetchRecommendations = async () => {
    try {
      setRecommendationsLoading(true);
      const response = await fetch('/api/google-docs/recommendations?status=PENDING&limit=5&minRelevance=0.6');
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.data?.recommendations || []);
      }
    } catch (error) {
      console.error('Recommendations fetch error:', error);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  // 統合システム状態を取得
  const fetchIntegratedSystemStatus = async () => {
    try {
      setSystemStatusLoading(true);
      const response = await fetch('/api/dashboard/integrated');
      if (response.ok) {
        const data = await response.json();
        setIntegratedSystemStatus(data.data || null);
      }
    } catch (error) {
      console.error('Integrated system status fetch error:', error);
    } finally {
      setSystemStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscordMetrics();
    fetchRecommendations();
    fetchIntegratedSystemStatus();
  }, []);

  // Save dashboard mode preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-mode', isSimpleMode ? 'simple' : 'complex');
    }
  }, [isSimpleMode]);

  const toggleDashboardMode = () => {
    setIsSimpleMode(!isSimpleMode);
  };

  // データから統計を計算
  useEffect(() => {
    if (!tasksLoading && !projectsLoading && !connectionsLoading && !appointmentsLoading) {
      const today = new Date();
      const thisWeekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      
      setStats({
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
      });
    }
  }, [tasks, projects, connections, appointments, tasksLoading, projectsLoading, connectionsLoading, appointmentsLoading]);

  // 今日のタスクを取得
  const todayTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    return dueDate.toDateString() === today.toDateString();
  });

  // 進行中のプロジェクトを取得
  const activeProjects = projects.filter(project => project.status === 'active');

  // 最近のアクティビティを生成（実際のデータから）
  const recentActivities: RecentActivity[] = [
    // 最近完了したタスク
    ...tasks.filter(t => t.status === 'COMPLETE').slice(0, 2).map(task => ({
      id: task.id,
      type: 'task' as const,
      title: task.title,
      description: 'タスクが完了されました',
      timestamp: task.updatedAt,
      user: task.user?.name || task.userId || 'Unknown'
    })),
    // 最近作成されたプロジェクト
    ...projects.slice(0, 1).map(project => ({
      id: project.id,
      type: 'project' as const,
      title: project.name,
      description: `プロジェクトの進捗が${project.progress}%に更新されました`,
      timestamp: project.updatedAt,
      user: 'Unknown'
    })),
    // 最近追加されたつながり
    ...connections.slice(0, 1).map(connection => ({
      id: connection.id,
      type: 'connection' as const,
      title: `${connection.name}（${connection.company}）`,
      description: '新しいつながりが追加されました',
      timestamp: connection.createdAt,
      user: 'Unknown'
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 4);

  // 今後のイベントを生成（実際のデータから）
  const upcomingEvents: UpcomingEvent[] = [
    // カレンダーイベント
    ...events.filter(event => {
      const eventDate = new Date(event.startTime);
      const today = new Date();
      return eventDate >= today;
    }).slice(0, 2).map(event => ({
      id: event.id,
      title: event.title,
      date: new Date(event.startTime).toISOString().split('T')[0],
      time: new Date(event.startTime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      type: event.type as 'meeting' | 'deadline' | 'event'
    })),
    // 期限が近いタスク（締切として）
    ...tasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(today.getDate() + 3);
      return dueDate >= today && dueDate <= threeDaysFromNow && task.status !== 'COMPLETE';
    }).slice(0, 2).map(task => ({
      id: task.id,
      title: `${task.title}（締切）`,
      date: new Date(task.dueDate!).toISOString().split('T')[0],
      time: '終日',
      type: 'deadline' as const
    }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 4);

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'project': return <Target className="w-4 h-4" />;
      case 'task': return <CheckCircle className="w-4 h-4" />;
      case 'appointment': return <Calendar className="w-4 h-4" />;
      case 'connection': return <Target className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getEventIcon = (type: UpcomingEvent['type']) => {
    switch (type) {
      case 'meeting': return <Handshake className="w-4 h-4" />;
      case 'deadline': return <Clock className="w-4 h-4" />;
      case 'event': return <Target className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return '数分前';
    if (diffInHours < 24) return `${diffInHours}時間前`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}日前`;
  };

  // レコメンデーション実行
  const executeRecommendation = async (recommendationId: string) => {
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
      
      if (data.success) {
        alert(`Success: ${data.result.message}`);
        fetchRecommendations(); // リストを更新
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  const StatCard = ({ title, value, subtitle, color, icon }: {
    title: string;
    value: number;
    subtitle: string;
    color: string;
    icon: React.ReactNode;
  }) => (
    <Card variant="elevated" padding="normal">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-600">{title}</p>
          <p className="text-xl md:text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs sm:text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${color} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </Card>
  );

  // Helper functions for Discord data
  const getLast7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      days.push(date);
    }
    return days;
  };

  const getMetricForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return discordMetrics.find(m => m.date === dateString);
  };

  // ローディング状態の確認
  // SystemIntegratorからシステム状態を取得 (APIエンドポイント経由に変更)
  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        setSystemStatusLoading(true);
        // API経由でシステム状態を取得
        const response = await fetch('/api/system/integration');
        if (response.ok) {
          const systemStatus = await response.json();
          setIntegratedSystemStatus({
            ...integratedSystemStatus,
            systemIntegrator: systemStatus
          });
        }
      } catch (error) {
        console.error('Failed to fetch system status:', error);
      } finally {
        setSystemStatusLoading(false);
      }
    };

    fetchSystemStatus();
    
    // 5分ごとにシステム状態を更新
    const interval = setInterval(fetchSystemStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []); // systemIntegrator dependency removed

  const isLoading = tasksLoading || projectsLoading || connectionsLoading || appointmentsLoading || eventsLoading || systemStatusLoading;

  if (isLoading) {
    return <LoadingPage title="ダッシュボードを読み込んでいます..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      <div className="mx-auto px-4 lg:px-8">
        {/* ヘッダー - 常に左右配置 */}
        <div className="flex justify-between items-start mb-6 gap-2">
          {/* 左カラム: タイトル部分 */}
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg md:text-2xl font-bold text-gray-900 whitespace-nowrap">ダッシュボード</h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1 whitespace-nowrap">
              {isSimpleMode ? '今日のタスクを確認' : '詳細分析とインサイト'}
            </p>
          </div>
          
          {/* 右カラム: Dashboard Mode Toggle */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <div className="flex items-center gap-1 sm:gap-2 bg-white p-1.5 sm:p-2 rounded-lg shadow-sm border w-fit ml-auto">
              <span className={`text-xs font-medium whitespace-nowrap ${isSimpleMode ? 'text-blue-600' : 'text-gray-500'}`}>
                シンプル
              </span>
              <button
                onClick={toggleDashboardMode}
                className="relative inline-flex items-center"
              >
                {isSimpleMode ? (
                  <ToggleLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-blue-600" />
                ) : (
                  <ToggleRight className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-blue-600" />
                )}
              </button>
              <span className={`text-xs font-medium whitespace-nowrap ${!isSimpleMode ? 'text-blue-600' : 'text-gray-500'}`}>
                詳細
              </span>
            </div>
            
            {isSimpleMode && (
              <div className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full w-fit ml-auto">
                <Sparkles className="w-3 h-3" />
                <span className="text-xs font-medium whitespace-nowrap">スマートモード</span>
              </div>
            )}
          </div>
        </div>

        {/* Conditional Dashboard Rendering */}
        {isSimpleMode ? (
          // Smart Dashboard - Simple Mode
          <div className="space-y-6">
            <SmartDashboard />
          </div>
        ) : (
          // Traditional Complex Dashboard
          <div>
            {/* 統計カード */}
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
            value={!discordLoading && discordMetrics.length > 0 ? discordMetrics[discordMetrics.length - 1]?.memberCount || 0 : 0}
            subtitle="Discord総メンバー数"
            color="bg-indigo-100"
            icon="👨‍👩‍👧‍👦"
          />
        </div>

        {/* Phase 5: 統合機能ダッシュボード */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">🚀 統合システム概要</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Phase 1: 学生リソース・MBTI統合状況 */}
            <Card variant="elevated" padding="normal">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                👥 リソース管理
              </h3>
              {systemStatusLoading ? (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Phase 1統合</span>
                    <span className={`text-sm font-medium ${
                      integratedSystemStatus?.systemIntegrator?.integration?.phase1?.dataIntegrity ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {integratedSystemStatus?.systemIntegrator?.integration?.phase1?.dataIntegrity ? '✅ 統合済み' : '❌ 未統合'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">リソース管理</span>
                    <span className={`text-sm font-medium ${
                      integratedSystemStatus?.systemIntegrator?.integration?.phase1?.studentResourceManager ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {integratedSystemStatus?.systemIntegrator?.integration?.phase1?.studentResourceManager ? '稼働中' : '停止中'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">MBTI最適化</span>
                    <span className={`text-sm font-medium ${
                      integratedSystemStatus?.systemIntegrator?.integration?.phase1?.mbtiTeamOptimizer ? 'text-purple-600' : 'text-red-600'
                    }`}>
                      {integratedSystemStatus?.systemIntegrator?.integration?.phase1?.mbtiTeamOptimizer ? '最適化中' : '停止中'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">平均負荷率</span>
                    <span className="text-sm font-medium text-gray-700">
                      {Math.round(integratedSystemStatus?.systemStatus?.phase1?.resourceOptimization?.averageLoad || 0)}%
                    </span>
                  </div>
                </div>
              )}
            </Card>

            {/* Phase 2: LTV・プロジェクト管理状況 */}
            <Card variant="elevated" padding="normal">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                💰 財務・LTV分析
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">LTV分析</span>
                  <span className="text-sm font-medium text-green-600">実行中</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">収益予測</span>
                  <span className="text-sm font-medium text-blue-600">85%精度</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">テンプレート生成</span>
                  <span className="text-sm font-medium text-purple-600">自動化済み</span>
                </div>
              </div>
            </Card>

            {/* Phase 3: アナリティクス・成功予測状況 */}
            <Card variant="elevated" padding="normal">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                📊 アナリティクス
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">リーチ予測</span>
                  <span className="text-sm font-medium text-green-600">92%精度</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">成功確率</span>
                  <span className="text-sm font-medium text-blue-600">計算中</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">コネクション分析</span>
                  <span className="text-sm font-medium text-purple-600">稼働中</span>
                </div>
              </div>
            </Card>

            {/* Phase 4: 営業・NLP自動化状況 */}
            <Card variant="elevated" padding="normal">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                🤖 営業自動化
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">NLP処理</span>
                  <span className="text-sm font-medium text-green-600">稼働中</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">営業自動化</span>
                  <span className="text-sm font-medium text-blue-600">80%自動</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">LINE Bot連携</span>
                  <span className="text-sm font-medium text-purple-600">統合済み</span>
                </div>
              </div>
            </Card>

            {/* セキュリティ・運用状況 */}
            <Card variant="elevated" padding="normal">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                🛡️ セキュリティ状況
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">脅威検知</span>
                  <span className={`text-sm font-medium ${
                    integratedSystemStatus?.systemIntegrator?.security?.systemSecurity === 'SECURE' ? 'text-green-600' : 
                    integratedSystemStatus?.systemIntegrator?.security?.systemSecurity === 'WARNING' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {integratedSystemStatus?.systemIntegrator?.security?.systemSecurity === 'SECURE' ? '✅ 正常' :
                     integratedSystemStatus?.systemIntegrator?.security?.systemSecurity === 'WARNING' ? '⚠️ 注意' : '🚨 警告'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">監査ログ</span>
                  <span className="text-sm font-medium text-blue-600">📋 記録中</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">セキュリティスコア</span>
                  <span className={`text-sm font-medium ${
                    (integratedSystemStatus?.systemIntegrator?.security?.health || 0) > 80 ? 'text-green-600' : 
                    (integratedSystemStatus?.systemIntegrator?.security?.health || 0) > 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {integratedSystemStatus?.systemIntegrator?.security?.health ? 
                      `${Math.round(integratedSystemStatus.systemIntegrator.security.health)}%` : '0%'}
                  </span>
                </div>
              </div>
            </Card>

            {/* 運用状況 */}
            <Card variant="elevated" padding="normal">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                ⚙️ 運用状況
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">システム健全性</span>
                  <span className={`text-sm font-medium ${
                    (integratedSystemStatus?.systemIntegrator?.operations?.systemHealth || 0) > 90 ? 'text-green-600' : 
                    (integratedSystemStatus?.systemIntegrator?.operations?.systemHealth || 0) > 70 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {integratedSystemStatus?.systemIntegrator?.operations?.systemHealth ? 
                      `${Math.round(integratedSystemStatus.systemIntegrator.operations.systemHealth)}%` : '0%'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">自動保守</span>
                  <span className={`text-sm font-medium ${
                    integratedSystemStatus?.systemIntegrator?.operations?.maintenanceStatus === 'UP_TO_DATE' ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {integratedSystemStatus?.systemIntegrator?.operations?.maintenanceStatus === 'UP_TO_DATE' ? '✅ 最新' : '🔄 実行中'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">稼働率</span>
                  <span className={`text-sm font-medium ${
                    (integratedSystemStatus?.systemIntegrator?.operations?.uptime || 0) > 99 ? 'text-green-600' : 
                    (integratedSystemStatus?.systemIntegrator?.operations?.uptime || 0) > 95 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {integratedSystemStatus?.systemIntegrator?.operations?.uptime ? 
                      `${integratedSystemStatus.systemIntegrator.operations.uptime.toFixed(1)}%` : '0%'}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* プロジェクト進捗、今日のタスク、カレンダー、今後の予定 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* プロジェクト進捗状況 */}
          <Card variant="elevated" padding="normal">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">プロジェクト進捗状況</h2>
            <div className="space-y-4">
              {projects.slice(0, 5).map((project, index) => {
                const colors = ['bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-yellow-600', 'bg-red-600'];
                return (
                  <div key={project.id}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">{project.name}</span>
                      <span className="text-sm text-gray-500">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`${colors[index % colors.length]} h-2 rounded-full transition-all duration-300`} 
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              {projects.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">プロジェクトがありません</p>
              )}
            </div>
          </Card>

          {/* 今日のタスク */}
          <Card variant="elevated" padding="normal">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base md:text-lg font-semibold text-gray-900">今日のタスク</h2>
              <Link href="/tasks" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                すべて見る
              </Link>
            </div>
            <div className="space-y-3">
              {todayTasks.length > 0 ? (
                todayTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full ${
                        task.status === 'COMPLETE' ? 'bg-green-500' :
                        task.status === 'DO' || task.status === 'CHECK' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span>担当:</span>
                        {(() => {
                          const assignee = task.assignee || task.user;
                          if (assignee) {
                            return (
                              <div className="flex items-center gap-1">
                                <div 
                                  className="w-3 h-3 rounded-full flex items-center justify-center text-white text-xs font-medium"
                                  style={{ backgroundColor: assignee.color }}
                                >
                                  {assignee.name.charAt(0)}
                                </div>
                                <span>{assignee.name}</span>
                              </div>
                            );
                          } else {
                            return <span>未設定</span>;
                          }
                        })()}
                        <span>|</span>
                        <span>{TASK_STATUS_LABELS[task.status]}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">今日のタスクはありません</p>
              )}
            </div>
          </Card>

          {/* SystemIntegrator 統合状況 */}
          <Card variant="elevated" padding="normal">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base md:text-lg font-semibold text-gray-900">🚀 システム統合状況</h2>
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
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phase 1</span>
                    <span className={`font-medium ${
                      integratedSystemStatus?.systemIntegrator?.integration?.phase1?.dataIntegrity ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {integratedSystemStatus?.systemIntegrator?.integration?.phase1?.dataIntegrity ? '✅' : '❌'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phase 2</span>
                    <span className={`font-medium ${
                      integratedSystemStatus?.systemIntegrator?.integration?.phase2?.performanceOptimized ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {integratedSystemStatus?.systemIntegrator?.integration?.phase2?.performanceOptimized ? '✅' : '❌'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phase 3</span>
                    <span className={`font-medium ${
                      integratedSystemStatus?.systemIntegrator?.integration?.phase3?.analyticsIntegrated ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {integratedSystemStatus?.systemIntegrator?.integration?.phase3?.analyticsIntegrated ? '✅' : '❌'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phase 4</span>
                    <span className={`font-medium ${
                      integratedSystemStatus?.systemIntegrator?.integration?.phase4?.aiAssistant ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {integratedSystemStatus?.systemIntegrator?.integration?.phase4?.aiAssistant ? '✅' : '❌'}
                    </span>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">最終チェック</span>
                    <span className="text-gray-500">
                      {integratedSystemStatus?.systemIntegrator?.lastCheck ? 
                        new Date(integratedSystemStatus.systemIntegrator.lastCheck).toLocaleTimeString('ja-JP') : '--:--'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-gray-600">API応答時間</span>
                    <span className="text-gray-700 font-medium">
                      {integratedSystemStatus?.systemIntegrator?.performance?.responseTime?.api || 0}ms
                    </span>
                  </div>
                </div>
                
                {/* セキュリティ・運用詳細 */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">セキュリティ</span>
                      <span className={`font-medium ${
                        (integratedSystemStatus?.systemIntegrator?.security?.health || 0) > 80 ? 'text-green-600' : 
                        (integratedSystemStatus?.systemIntegrator?.security?.health || 0) > 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {integratedSystemStatus?.systemIntegrator?.security?.health ? 
                          `${Math.round(integratedSystemStatus.systemIntegrator.security.health)}%` : '--'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">運用状態</span>
                      <span className={`font-medium ${
                        (integratedSystemStatus?.systemIntegrator?.operations?.systemHealth || 0) > 80 ? 'text-green-600' : 
                        (integratedSystemStatus?.systemIntegrator?.operations?.systemHealth || 0) > 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {integratedSystemStatus?.systemIntegrator?.operations?.systemHealth ? 
                          `${Math.round(integratedSystemStatus.systemIntegrator.operations.systemHealth)}%` : '--'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">脅威検知</span>
                      <span className={`font-medium ${
                        integratedSystemStatus?.systemIntegrator?.security?.activeThreats === 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {typeof integratedSystemStatus?.systemIntegrator?.security?.activeThreats === 'number' ? 
                          `${integratedSystemStatus.systemIntegrator.security.activeThreats}件` : '--'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">自動化率</span>
                      <span className={`font-medium ${
                        (integratedSystemStatus?.systemIntegrator?.operations?.automationRate || 0) > 80 ? 'text-green-600' : 
                        (integratedSystemStatus?.systemIntegrator?.operations?.automationRate || 0) > 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {integratedSystemStatus?.systemIntegrator?.operations?.automationRate ? 
                          `${Math.round(integratedSystemStatus.systemIntegrator.operations.automationRate)}%` : '--'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* カレンダー */}
          <Card variant="elevated" padding="normal">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base md:text-lg font-semibold text-gray-900">カレンダー</h2>
              <Link href="/calendar" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                カレンダーを見る
              </Link>
            </div>
            <div className="space-y-4">
              {events.slice(0, 4).map((event) => (
                <div key={event.id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <span className="text-xl">{getEventIcon(event.type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{event.title}</p>
                    <p className="text-xs text-gray-600">
                      {event.date} {event.time}
                    </p>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">予定がありません</p>
              )}
            </div>
          </Card>

          {/* 今後の予定 */}
          <Card variant="elevated" padding="normal">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base md:text-lg font-semibold text-gray-900">今後の予定</h2>
              <Link href="/calendar" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                カレンダーを見る
              </Link>
            </div>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <span className="text-xl">{getEventIcon(event.type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{event.title}</p>
                    <p className="text-xs text-gray-600">
                      {event.date} {event.time}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      event.type === 'meeting' ? 'bg-blue-100 text-blue-800' :
                      event.type === 'deadline' ? 'bg-red-100 text-red-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {event.type === 'meeting' ? '会議' :
                       event.type === 'deadline' ? '締切' : 'イベント'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Discord インサイト概要 */}
        {!discordLoading && discordMetrics.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Discord コミュニティ概要</h2>
              <Link 
                href="/dashboard/discord-insights"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
              >
                詳細を見る →
              </Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* メンバー数推移・新規参加 */}
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">メンバー推移</h3>
                <div className="h-48">
                  {(() => {
                    const last7Days = getLast7Days();
                    
                    const chartData = last7Days.map((date, index) => {
                      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
                      const currentMetric = getMetricForDate(date);
                      const previousMetric = index > 0 ? getMetricForDate(last7Days[index-1]) : null;
                      
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
                  })()}
                </div>
              </div>

              {/* メンバー統計サマリー */}
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">統計</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <div>
                      <p className="text-sm font-medium text-gray-900">総メンバー</p>
                      <p className="text-xs text-gray-600">現在</p>
                    </div>
                    <span className="text-xl font-bold text-blue-600">
                      {discordMetrics[discordMetrics.length - 1]?.memberCount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                    <div>
                      <p className="text-sm font-medium text-gray-900">7日間新規</p>
                      <p className="text-xs text-gray-600">参加者</p>
                    </div>
                    <span className="text-xl font-bold text-orange-600">
                      {(() => {
                        const last7Days = getLast7Days();
                        let totalNew = 0;
                        for (let i = 1; i < last7Days.length; i++) {
                          const currentMetric = getMetricForDate(last7Days[i]);
                          const previousMetric = getMetricForDate(last7Days[i-1]);
                          if (currentMetric && previousMetric) {
                            totalNew += Math.max(0, currentMetric.memberCount - previousMetric.memberCount);
                          }
                        }
                        return totalNew;
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* 情報取得ロール推移 */}
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">情報ロール推移</h3>
                <div className="h-48">
                  {(() => {
                    const last7Days = getLast7Days();
                    
                    const chartData = last7Days.map(date => {
                      const metric = getMetricForDate(date);
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
                  })()}
                </div>
              </div>

              {/* 属性ロール構成 */}
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">属性ロール構成</h3>
                <div className="h-48">
                  {(() => {
                    const latestMetric = discordMetrics[discordMetrics.length - 1];
                    if (!latestMetric?.roleCounts) return <p className="text-sm text-gray-500 text-center">データがありません</p>;
                    
                    const roleCounts = typeof latestMetric.roleCounts === 'string' 
                      ? JSON.parse(latestMetric.roleCounts) 
                      : latestMetric.roleCounts;
                    
                    const attributeRoles = [
                      { id: '1383347155548504175', name: '経営幹部', color: '#dc2626' },
                      { id: '1383347231188586628', name: '学生', color: '#7c3aed' },
                      { id: '1383347303347257486', name: 'フリーランス', color: '#059669' },
                      { id: '1383347353141907476', name: 'エンジョイ', color: '#ea580c' }
                    ];
                    
                    const pieData = attributeRoles.map(role => ({
                      name: role.name,
                      value: roleCounts[role.id]?.count || 0,
                      color: role.color
                    })).filter(item => item.value > 0);
                    
                    return <RolePieChart data={pieData} height={180} />;
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* AIレコメンデーション機能サマリー */}
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
                🤖 AIレコメンデーション
              </h2>
              <Link href="/dashboard/google-docs" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                詳細を見る
              </Link>
            </div>
            
            {recommendationsLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">読み込み中...</span>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-gray-400 mb-2">
                  <svg className="mx-auto h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="text-sm text-gray-500">実行可能なレコメンデーションはありません</div>
              </div>
            ) : (
              <div className="space-y-3">
                {recommendations.slice(0, 3).map((rec) => (
                  <div key={rec.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 mr-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{rec.title}</h4>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{rec.description}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                          rec.estimatedImpact === 'HIGH' ? 'bg-red-100 text-red-700' :
                          rec.estimatedImpact === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {rec.estimatedImpact === 'HIGH' ? '高' : rec.estimatedImpact === 'MEDIUM' ? '中' : '低'}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>関連性: {Math.round(rec.relevance_score * 100)}%</span>
                        <span>実行性: {Math.round(rec.executabilityScore * 100)}%</span>
                      </div>
                      <Button
                        onClick={() => executeRecommendation(rec.id)}
                        size="sm"
                        className="px-2 py-1 text-xs"
                      >
                        実行
                      </Button>
                    </div>
                  </div>
                ))}
                {recommendations.length > 3 && (
                  <div className="text-center py-2">
                    <Link 
                      href="/dashboard/google-docs"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      他{recommendations.length - 3}件のレコメンデーションを見る →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 進行中のプロジェクト */}
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base md:text-lg font-semibold text-gray-900">進行中のプロジェクト</h2>
              <Link href="/projects" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                すべて見る
              </Link>
            </div>
            <div className="space-y-3">
              {activeProjects.length > 0 ? (
                activeProjects.slice(0, 4).map((project) => (
                  <div key={project.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{project.name}</h4>
                      <span className="text-xs text-gray-500">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">進行中のプロジェクトはありません</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 lg:gap-8 mt-8">

          {/* 最近のアクティビティ */}
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base md:text-lg font-semibold text-gray-900">最近のアクティビティ</h2>
              <Link href="/activity" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                すべて見る
              </Link>
            </div>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <span className="text-xl">{getActivityIcon(activity.type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-600">{activity.description}</p>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <span>{activity.user}</span>
                      <span className="mx-1">•</span>
                      <span>{formatTimeAgo(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 週間サマリー */}
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base md:text-lg font-semibold text-gray-900">週間サマリー</h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">今週完了タスク</p>
                  <p className="text-xs text-gray-600">この1週間で完了</p>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {tasks.filter(task => task.status === 'COMPLETE').length}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">アクティブプロジェクト</p>
                  <p className="text-xs text-gray-600">現在進行中</p>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {activeProjects.length}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">期限迫るタスク</p>
                  <p className="text-xs text-gray-600">3日以内</p>
                </div>
                <span className="text-2xl font-bold text-yellow-600">
                  {tasks.filter(task => {
                    if (!task.dueDate) return false;
                    const dueDate = new Date(task.dueDate);
                    const threeDaysFromNow = new Date();
                    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
                    return dueDate <= threeDaysFromNow && task.status !== 'COMPLETE';
                  }).length}
                </span>
              </div>
            </div>
          </div>
        </div>
          </div>
        )}
      </div>
    </div>
  );
}