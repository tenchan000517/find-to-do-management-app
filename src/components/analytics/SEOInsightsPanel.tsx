'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SearchConsoleData {
  summary: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
  byQuery: Array<any>;
  byPage: Array<any>;
  byCountry: Array<any>;
  byDevice: Array<any>;
}

interface SEOInsightsPanelProps {
  data: SearchConsoleData;
}

export default function SEOInsightsPanel({ data }: SEOInsightsPanelProps) {
  // Generate sample query data for demonstration
  const sampleQueryData = [
    { query: 'プロジェクト管理', clicks: 250, impressions: 3500, ctr: 0.071, position: 4.2 },
    { query: 'タスク管理 アプリ', clicks: 180, impressions: 2800, ctr: 0.064, position: 5.1 },
    { query: 'TODO リスト', clicks: 150, impressions: 2200, ctr: 0.068, position: 3.8 },
    { query: '人脈管理', clicks: 120, impressions: 1800, ctr: 0.067, position: 6.2 },
    { query: 'スケジュール管理', clicks: 100, impressions: 1500, ctr: 0.067, position: 7.5 },
  ];

  const formatPercentage = (num: number) => {
    return (num * 100).toFixed(1) + '%';
  };

  const getPositionColor = (position: number) => {
    if (position <= 3) return 'text-green-600';
    if (position <= 7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCTRColor = (ctr: number) => {
    if (ctr >= 0.07) return 'text-green-600';
    if (ctr >= 0.05) return 'text-yellow-600';
    return 'text-red-600';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold mb-2">{`検索クエリ: ${label}`}</p>
          <p className="text-sm text-blue-600">{`クリック数: ${data.clicks}`}</p>
          <p className="text-sm text-green-600">{`表示回数: ${data.impressions.toLocaleString()}`}</p>
          <p className="text-sm text-purple-600">{`CTR: ${formatPercentage(data.ctr)}`}</p>
          <p className="text-sm text-orange-600">{`平均順位: ${data.position.toFixed(1)}位`}</p>
        </div>
      );
    }
    return null;
  };

  // Get top insights
  const getInsights = () => {
    const insights = [];
    
    // High CTR queries
    const highCTRQueries = sampleQueryData.filter(q => q.ctr >= 0.07);
    if (highCTRQueries.length > 0) {
      insights.push({
        type: 'success',
        title: '高CTRクエリ',
        message: `${highCTRQueries.length}個のクエリが7%以上のCTRを獲得`,
        icon: '📈'
      });
    }

    // Low position queries with high impressions
    const lowPositionHighImpressions = sampleQueryData.filter(q => q.position > 7 && q.impressions > 1000);
    if (lowPositionHighImpressions.length > 0) {
      insights.push({
        type: 'warning',
        title: '改善機会',
        message: `順位が低いが表示回数の多いクエリが${lowPositionHighImpressions.length}個あります`,
        icon: '⚠️'
      });
    }

    // Top performing queries
    const topQuery = sampleQueryData[0];
    insights.push({
      type: 'info',
      title: 'トップクエリ',
      message: `「${topQuery.query}」が最多の${topQuery.clicks}クリックを獲得`,
      icon: '🏆'
    });

    return insights;
  };

  const insights = getInsights();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">SEO インサイト</h3>
        <div className="text-sm text-gray-500">
          Search Console データ
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {data.summary.clicks.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">総クリック数</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {data.summary.impressions.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">総表示回数</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {formatPercentage(data.summary.ctr)}
          </div>
          <div className="text-sm text-gray-600">平均CTR</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {data.summary.position.toFixed(1)}
          </div>
          <div className="text-sm text-gray-600">平均順位</div>
        </div>
      </div>

      {/* Query Performance Chart */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-800 mb-4">検索クエリ別パフォーマンス</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sampleQueryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="query" 
                stroke="#666"
                fontSize={10}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="clicks" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Queries Table */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-800 mb-4">トップ検索クエリ</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-medium text-gray-600 text-sm">クエリ</th>
                <th className="text-right py-2 px-3 font-medium text-gray-600 text-sm">クリック</th>
                <th className="text-right py-2 px-3 font-medium text-gray-600 text-sm">表示回数</th>
                <th className="text-right py-2 px-3 font-medium text-gray-600 text-sm">CTR</th>
                <th className="text-right py-2 px-3 font-medium text-gray-600 text-sm">順位</th>
              </tr>
            </thead>
            <tbody>
              {sampleQueryData.map((query, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-3 text-sm text-gray-900 max-w-xs truncate">
                    {query.query}
                  </td>
                  <td className="text-right py-2 px-3 text-sm text-gray-900">
                    {query.clicks}
                  </td>
                  <td className="text-right py-2 px-3 text-sm text-gray-900">
                    {query.impressions.toLocaleString()}
                  </td>
                  <td className={`text-right py-2 px-3 text-sm ${getCTRColor(query.ctr)}`}>
                    {formatPercentage(query.ctr)}
                  </td>
                  <td className={`text-right py-2 px-3 text-sm ${getPositionColor(query.position)}`}>
                    {query.position.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      <div>
        <h4 className="text-md font-medium text-gray-800 mb-4">インサイト</h4>
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg ${
              insight.type === 'success' ? 'bg-green-50 border border-green-200' :
              insight.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
              'bg-blue-50 border border-blue-200'
            }`}>
              <span className="text-lg">{insight.icon}</span>
              <div className="flex-1">
                <div className={`font-medium text-sm ${
                  insight.type === 'success' ? 'text-green-800' :
                  insight.type === 'warning' ? 'text-yellow-800' :
                  'text-blue-800'
                }`}>
                  {insight.title}
                </div>
                <div className={`text-sm ${
                  insight.type === 'success' ? 'text-green-700' :
                  insight.type === 'warning' ? 'text-yellow-700' :
                  'text-blue-700'
                }`}>
                  {insight.message}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}