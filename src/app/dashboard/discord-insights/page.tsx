"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import FullPageLoading from '@/components/FullPageLoading';
import RoleLineChart from '@/components/charts/RoleLineChart';
import RolePieChart from '@/components/charts/RolePieChart';
import MemberChart from '@/components/charts/MemberChart';

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

interface DiscordStats {
  memberGrowth: number;
  avgDailyMessages: number;
  avgEngagement: number;
  mostActiveRole: string;
  totalChannels: number;
}

export default function DiscordInsights() {
  const [metrics, setMetrics] = useState<DiscordMetric[]>([]);
  const [stats, setStats] = useState<DiscordStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState(30);

  useEffect(() => {
    fetchMetrics();
  }, [selectedDays]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/discord/metrics?days=${selectedDays}`);
      if (!response.ok) {
        throw new Error('メトリクスデータの取得に失敗しました');
      }
      const data = await response.json();
      setMetrics(data.data || []);
      calculateStats(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: DiscordMetric[]) => {
    if (data.length === 0) {
      setStats(null);
      return;
    }

    const latest = data[data.length - 1];
    const earliest = data[0];
    
    const memberGrowth = latest.memberCount - earliest.memberCount;
    const avgDailyMessages = data.reduce((sum, m) => sum + m.dailyMessages, 0) / data.length;
    const avgEngagement = data.reduce((sum, m) => sum + m.engagementScore, 0) / data.length;
    
    // 最もアクティブなロールを見つける
    const allRoleCounts = latest.roleCounts as Record<string, number>;
    const mostActiveRole = Object.entries(allRoleCounts).reduce((max, [role, count]) => 
      (count as number) > max.count ? { role, count: count as number } : max, { role: '', count: 0 }).role;

    // チャンネル数を計算
    const totalChannels = Object.keys(latest.channelMessageStats || {}).length;

    setStats({
      memberGrowth,
      avgDailyMessages: Math.round(avgDailyMessages),
      avgEngagement: Math.round(avgEngagement * 100) / 100,
      mostActiveRole,
      totalChannels
    });
  };

  const StatCard = ({ title, value, subtitle, color, icon }: {
    title: string;
    value: string | number;
    subtitle: string;
    color: string;
    icon: string;
  }) => (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric'
    });
  };

  // 過去7日分の日付を生成
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

  // 日付に対応するメトリクスデータを取得
  const getMetricForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return metrics.find(m => m.date === dateString);
  };

  const getRoleDisplayName = (roleKey: string): string => {
    const roleNames: Record<string, string> = {
      '1332242428459221046': 'FIND to DO',
      '1381201663045668906': 'イベント情報',
      '1382167308180394145': 'みんなの告知',
      '1383347155548504175': '経営幹部',
      '1383347231188586628': '学生',
      '1383347303347257486': 'フリーランス',
      '1383347353141907476': 'エンジョイ'
    };
    return roleNames[roleKey] || roleKey;
  };

  if (loading) {
    return <FullPageLoading />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 md:py-8">
        <div className="mx-auto px-4 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-red-800 mb-2">エラーが発生しました</h2>
            <p className="text-red-600 text-sm md:text-base">{error}</p>
            <button 
              onClick={fetchMetrics}
              className="mt-4 px-3 md:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm md:text-base"
            >
              再試行
            </button>
          </div>
        </div>
      </div>
    );
  }

  const latestMetric = metrics[metrics.length - 1];

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      <div className="mx-auto px-4 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Discord インサイト</h1>
              <p className="text-gray-600 mt-2 text-sm md:text-base">サーバーのKPI分析ダッシュボード</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <select 
                value={selectedDays} 
                onChange={(e) => setSelectedDays(Number(e.target.value))}
                className="px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base w-full sm:w-auto"
              >
                <option value={7}>過去7日</option>
                <option value={30}>過去30日</option>
                <option value={90}>過去90日</option>
              </select>
              <Link 
                href="/"
                className="px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm md:text-base text-center w-full sm:w-auto"
              >
                ダッシュボードに戻る
              </Link>
            </div>
          </div>
        </div>

        {/* メンバー関連グラフ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
          {/* メンバー数推移と新規参加 */}
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">メンバー数推移・新規参加</h2>
            <p className="text-xs md:text-sm text-gray-600 mb-4">総メンバー数の推移と日別新規参加者数</p>
            <div className="h-64">
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

                return <MemberChart data={chartData} />;
              })()}
            </div>
          </div>

          {/* サマリー統計 */}
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">メンバー統計</h2>
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 md:p-4 bg-blue-50 rounded-lg gap-2">
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900">現在のメンバー数</h3>
                  <p className="text-xs md:text-sm text-gray-600">最新の総メンバー数</p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-2xl md:text-3xl font-bold text-blue-600">{latestMetric?.memberCount || 0}</span>
                  <span className="text-xs md:text-sm text-gray-600 ml-1">人</span>
                </div>
              </div>
              
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
                
                return (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 md:p-4 bg-orange-50 rounded-lg gap-2">
                    <div>
                      <h3 className="text-base md:text-lg font-semibold text-gray-900">7日間の新規参加</h3>
                      <p className="text-xs md:text-sm text-gray-600">過去7日間の新規参加者合計</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-2xl md:text-3xl font-bold text-orange-600">{totalNew}</span>
                      <span className="text-xs md:text-sm text-gray-600 ml-1">人</span>
                    </div>
                  </div>
                );
              })()}

              {stats && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 md:p-4 bg-green-50 rounded-lg gap-2">
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-gray-900">期間成長率</h3>
                    <p className="text-xs md:text-sm text-gray-600">前期間比の増減</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className={`text-2xl md:text-3xl font-bold ${stats.memberGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.memberGrowth >= 0 ? '+' : ''}{stats.memberGrowth}
                    </span>
                    <span className="text-xs md:text-sm text-gray-600 ml-1">人</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 統計カードグリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">

          {/* チャンネル別メッセージ数 */}
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">チャンネル別メッセージ</h3>
              <span className="text-xs md:text-sm text-gray-500">?</span>
            </div>
            <div className="space-y-2">
              {latestMetric && latestMetric.channelMessageStats && (() => {
                const channelStats = typeof latestMetric.channelMessageStats === 'string'
                  ? JSON.parse(latestMetric.channelMessageStats)
                  : latestMetric.channelMessageStats;
                
                const sortedChannels = Object.entries(channelStats)
                  .sort(([, a]: any, [, b]: any) => (b.count || 0) - (a.count || 0))
                  .slice(0, 5);

                if (sortedChannels.length === 0) {
                  return <p className="text-sm text-gray-500">データがありません</p>;
                }

                return sortedChannels.map(([channelName, data]: any, index) => (
                  <div key={channelName} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center">
                      <span className="text-xs md:text-sm font-medium text-gray-600 mr-2">#{index + 1}</span>
                      <span className="text-xs md:text-sm text-gray-900 truncate max-w-[120px] md:max-w-[150px]">{channelName}</span>
                    </div>
                    <span className="text-xs md:text-sm font-bold text-orange-600">{data.count || 0}</span>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* メッセージ数ランキング */}
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">話しかけ王</h3>
              <span className="text-xs md:text-sm text-gray-500">?</span>
            </div>
            <div className="text-xs md:text-sm text-gray-600 mb-4">
              他メンバーに話しかけてくれたベスト5⭐
            </div>
            <div className="flex items-center justify-center h-32">
              <p className="text-sm text-gray-500">ユーザー別メッセージ数データがありません</p>
            </div>
          </div>
        </div>


        {/* ロール別グラフ - 一行表示 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* 情報取得ロール推移 */}
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <h2 className="text-base md:text-xl font-semibold text-gray-900 mb-4">情報取得ロール推移</h2>
            <p className="text-xs md:text-sm text-gray-600 mb-4">ユーザーが自分で取得した情報ロールの人数推移</p>
            <div className="h-64">
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

                return <RoleLineChart data={chartData} lines={lines} />;
              })()}
            </div>
          </div>

          {/* 情報取得ロール構成 */}
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <h2 className="text-base md:text-xl font-semibold text-gray-900 mb-4">情報取得ロール構成</h2>
            <p className="text-xs md:text-sm text-gray-600 mb-4">欲しい情報別の取得者割合</p>
            <div className="h-64">
              {latestMetric && latestMetric.roleCounts && (() => {
                const roleCounts = typeof latestMetric.roleCounts === 'string' 
                  ? JSON.parse(latestMetric.roleCounts) 
                  : latestMetric.roleCounts;
                
                const systemRoles = [
                  { id: '1332242428459221046', name: 'FIND to DO', color: '#3b82f6' },
                  { id: '1381201663045668906', name: 'イベント情報', color: '#10b981' },
                  { id: '1382167308180394145', name: 'みんなの告知', color: '#f59e0b' }
                ];
                
                const pieData = systemRoles.map(role => ({
                  name: role.name,
                  value: roleCounts[role.id]?.count || 0,
                  color: role.color
                })).filter(item => item.value > 0);
                
                return <RolePieChart data={pieData} height={250} />;
              })()}
            </div>
          </div>

          {/* 属性ロール推移 */}
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <h2 className="text-base md:text-xl font-semibold text-gray-900 mb-4">属性ロール推移</h2>
            <p className="text-xs md:text-sm text-gray-600 mb-4">ユーザーの職業・立場属性の人数推移</p>
            <div className="h-64">
              {(() => {
                const last7Days = getLast7Days();
                
                const chartData = last7Days.map(date => {
                  const metric = getMetricForDate(date);
                  const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
                  
                  if (!metric?.roleCounts) {
                    return {
                      date: dateStr,
                      '経営幹部': 0,
                      '学生': 0,
                      'フリーランス': 0,
                      'エンジョイ': 0
                    };
                  }
                  
                  const roleCounts = typeof metric.roleCounts === 'string' 
                    ? JSON.parse(metric.roleCounts) 
                    : metric.roleCounts;
                  
                  return {
                    date: dateStr,
                    '経営幹部': roleCounts['1383347155548504175']?.count || 0,
                    '学生': roleCounts['1383347231188586628']?.count || 0,
                    'フリーランス': roleCounts['1383347303347257486']?.count || 0,
                    'エンジョイ': roleCounts['1383347353141907476']?.count || 0
                  };
                });

                const lines = [
                  { dataKey: '経営幹部', stroke: '#dc2626' },
                  { dataKey: '学生', stroke: '#7c3aed' },
                  { dataKey: 'フリーランス', stroke: '#059669' },
                  { dataKey: 'エンジョイ', stroke: '#ea580c' }
                ];

                return <RoleLineChart data={chartData} lines={lines} />;
              })()}
            </div>
          </div>

          {/* 属性ロール構成 */}
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <h2 className="text-base md:text-xl font-semibold text-gray-900 mb-4">属性ロール構成</h2>
            <p className="text-xs md:text-sm text-gray-600 mb-4">職業・立場別の構成比率</p>
            <div className="h-64">
              {latestMetric && latestMetric.roleCounts && (() => {
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
                
                return <RolePieChart data={pieData} height={250} />;
              })()}
            </div>
          </div>
        </div>

        {/* メトリクス詳細 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">ロール別メンバー数一覧</h2>
            {latestMetric && latestMetric.roleCounts && (
              <div className="space-y-3">
                {(() => {
                  try {
                    const roleCounts = typeof latestMetric.roleCounts === 'string' 
                      ? JSON.parse(latestMetric.roleCounts) 
                      : latestMetric.roleCounts;
                    
                    return Object.entries(roleCounts).map(([roleId, roleData]: [string, any]) => {
                      const count = roleData.count || 0;
                      
                      return (
                        <div key={roleId} className="flex justify-between items-center p-2 md:p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-900 text-sm md:text-base">{getRoleDisplayName(roleId)}</span>
                          <span className="text-base md:text-lg font-bold text-blue-600">{count}人</span>
                        </div>
                      );
                    });
                  } catch (e) {
                    console.error('Error parsing roleCounts:', e);
                    return <p className="text-sm text-gray-500">データの読み込みに失敗しました</p>;
                  }
                })()}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">最新メトリクス詳細</h2>
            {latestMetric && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs md:text-sm font-medium text-gray-900">総メンバー数</p>
                    <p className="text-xl md:text-2xl font-bold text-blue-600">{latestMetric.memberCount}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs md:text-sm font-medium text-gray-900">アクティブユーザー</p>
                    <p className="text-xl md:text-2xl font-bold text-green-600">{latestMetric.activeUsers}</p>
                  </div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs md:text-sm font-medium text-gray-900">エンゲージメントスコア</p>
                  <p className="text-xl md:text-2xl font-bold text-purple-600">{latestMetric.engagementScore.toFixed(2)}%</p>
                </div>
                <div className="text-xs md:text-sm text-gray-500">
                  最終更新: {new Date(latestMetric.updatedAt).toLocaleString('ja-JP')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}