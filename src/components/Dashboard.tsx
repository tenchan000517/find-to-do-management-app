"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useConnections } from '@/hooks/useConnections';
import { useAppointments } from '@/hooks/useAppointments';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { TASK_STATUS_LABELS } from '@/lib/types';
import FullPageLoading from '@/components/FullPageLoading';
import MemberChart from '@/components/charts/MemberChart';
import RoleLineChart from '@/components/charts/RoleLineChart';
import RolePieChart from '@/components/charts/RolePieChart';
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
  
  const [stats, setStats] = useState<DashboardStats>({
    projects: { total: 0, active: 0, completed: 0, onHold: 0 },
    tasks: { total: 0, completed: 0, inProgress: 0, overdue: 0 },
    connections: { total: 0, companies: 0, students: 0, thisMonth: 0 },
    appointments: { total: 0, scheduled: 0, completed: 0, thisWeek: 0 }
  });

  // 全データの再読み込み関数
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const refreshAllData = async () => {
    try {
      if (onDataRefresh) {
        onDataRefresh();
      } else {
        await Promise.all([
          refreshTasks(),
          refreshProjects(),
          refreshConnections(),
          reloadAppointments(),
          refreshEvents(),
          fetchDiscordMetrics()
        ]);
      }
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error);
    }
  };

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

  useEffect(() => {
    fetchDiscordMetrics();
  }, []);

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
      case 'project': return '🚀';
      case 'task': return '✅';
      case 'appointment': return '📞';
      case 'connection': return '👥';
      default: return '📄';
    }
  };

  const getEventIcon = (type: UpcomingEvent['type']) => {
    switch (type) {
      case 'meeting': return '🤝';
      case 'deadline': return '⏰';
      case 'event': return '🎯';
      default: return '📅';
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

  const StatCard = ({ title, value, subtitle, color, icon }: {
    title: string;
    value: number;
    subtitle: string;
    color: string;
    icon: string;
  }) => (
    <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">{value}</p>
          <p className="text-xs sm:text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${color} flex items-center justify-center`}>
          <span className="text-xl sm:text-2xl">{icon}</span>
        </div>
      </div>
    </div>
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
  const isLoading = tasksLoading || projectsLoading || connectionsLoading || appointmentsLoading || eventsLoading;

  if (isLoading) {
    return <FullPageLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      <div className="mx-auto px-4 lg:px-8">
        {/* ヘッダー */}



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
            icon="✅"
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

        {/* プロジェクト進捗、今日のタスク、カレンダー、今後の予定 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* プロジェクト進捗状況 */}
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">プロジェクト進捗状況</h2>
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
          </div>

          {/* 今日のタスク */}
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">今日のタスク</h2>
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
                      <p className="text-xs text-gray-600">
                        担当: {task.user?.name || task.userId} | {TASK_STATUS_LABELS[task.status]}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">今日のタスクはありません</p>
              )}
            </div>
          </div>

          {/* カレンダー */}
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">カレンダー</h2>
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
          </div>

          {/* 今後の予定 */}
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">今後の予定</h2>
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
          </div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* 進行中のプロジェクト */}
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">進行中のプロジェクト</h2>
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

          {/* 最近のアクティビティ */}
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">最近のアクティビティ</h2>
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
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">週間サマリー</h2>
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
    </div>
  );
}