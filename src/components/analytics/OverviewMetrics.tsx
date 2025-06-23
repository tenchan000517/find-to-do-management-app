'use client';

interface OverviewData {
  organicTraffic: {
    sessions: number;
    clicks: number;
    impressions: number;
    ctr: number;
    avgPosition: number;
  };
  engagement: {
    totalSessions: number;
    totalUsers: number;
    pageViews: number;
    bounceRate: number;
    avgSessionDuration: number;
  };
}

interface OverviewMetricsProps {
  data: OverviewData;
}

export default function OverviewMetrics({ data }: OverviewMetricsProps) {
  const formatNumber = (num: number) => {
    if (!num || isNaN(num)) return '0';
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  const formatPercentage = (num: number) => {
    if (!num || isNaN(num)) return '0.0%';
    return (num * 100).toFixed(1) + '%';
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatPosition = (position: number) => {
    if (!position || isNaN(position)) return '0.0';
    return position.toFixed(1);
  };

  const metrics = [
    {
      label: 'セッション数',
      value: formatNumber(data.engagement.totalSessions),
      subValue: `ユーザー: ${formatNumber(data.engagement.totalUsers)}`,
      icon: '👥',
      color: 'bg-blue-500',
    },
    {
      label: 'ページビュー',
      value: formatNumber(data.engagement.pageViews),
      subValue: `平均滞在時間: ${formatDuration(data.engagement.avgSessionDuration)}`,
      icon: '📊',
      color: 'bg-green-500',
    },
    {
      label: '検索クリック数',
      value: formatNumber(data.organicTraffic.clicks),
      subValue: `CTR: ${formatPercentage(data.organicTraffic.ctr)}`,
      icon: '🔍',
      color: 'bg-purple-500',
    },
    {
      label: '検索表示回数',
      value: formatNumber(data.organicTraffic.impressions),
      subValue: `平均順位: ${formatPosition(data.organicTraffic.avgPosition)}位`,
      icon: '📈',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-full ${metric.color} bg-opacity-10`}>
              <span className="text-2xl">{metric.icon}</span>
            </div>
            <div className={`w-3 h-3 rounded-full ${metric.color}`}></div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-600">{metric.label}</h3>
            <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
            <p className="text-sm text-gray-500">{metric.subValue}</p>
          </div>
        </div>
      ))}
    </div>
  );
}