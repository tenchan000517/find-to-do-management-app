'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface GA4Data {
  summary: {
    sessions: number;
    users: number;
    pageViews: number;
    bounceRate: number;
    avgSessionDuration: number;
    eventsPerSession: number;
  };
  byChannel: Array<any>;
  byPage: Array<any>;
  byDevice: Array<any>;
}

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

interface TrafficTrendChartProps {
  ga4Data: GA4Data;
  searchConsoleData: SearchConsoleData;
}

export default function TrafficTrendChart({ ga4Data, searchConsoleData }: TrafficTrendChartProps) {
  // Check if we have valid data
  const hasValidData = ga4Data?.summary && searchConsoleData?.summary;
  
  // For now, we'll show an empty state since we don't have time-series data from the API
  // In a real implementation, the API should return daily data points
  const chartData: Array<{
    date: string;
    sessions: number;
    users: number;
    clicks: number;
    impressions: number;
  }> = [];
  
  // Calculate totals
  const totalSessions = ga4Data?.summary?.sessions || 0;
  const totalUsers = ga4Data?.summary?.users || 0;
  const totalClicks = searchConsoleData?.summary?.clicks || 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold mb-2">{`日付: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${entry.value.toLocaleString()}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">トラフィック推移</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-gray-600">セッション</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-gray-600">ユーザー</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
            <span className="text-gray-600">検索クリック</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#666"
                fontSize={12}
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="sessions"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                name="セッション"
              />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                name="ユーザー"
              />
              <Line
                type="monotone"
                dataKey="clicks"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                name="検索クリック"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50 rounded">
            <div className="text-center">
              <div className="text-gray-400 text-2xl mb-2">📈</div>
              <p className="text-gray-500">時系列データなし</p>
              <p className="text-gray-400 text-sm mt-1">APIが日別データを返すように改善が必要です</p>
            </div>
          </div>
        )}</div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600">総セッション</p>
          <p className="text-lg font-semibold text-blue-600">
            {totalSessions.toLocaleString()}
          </p>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-gray-600">総ユーザー</p>
          <p className="text-lg font-semibold text-green-600">
            {totalUsers.toLocaleString()}
          </p>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg">
          <p className="text-sm text-gray-600">総クリック</p>
          <p className="text-lg font-semibold text-purple-600">
            {totalClicks.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}