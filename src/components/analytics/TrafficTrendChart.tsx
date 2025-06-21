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
  // Since we don't have time-series data in the current API response,
  // we'll create sample data for demonstration
  // In a real implementation, this would come from the API
  const generateSampleData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate sample data based on actual totals
      const sessionsFactor = ga4Data.summary.sessions / 7;
      const clicksFactor = searchConsoleData.summary.clicks / 7;
      const impressionsFactor = searchConsoleData.summary.impressions / 7;
      
      data.push({
        date: date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }),
        sessions: Math.floor(sessionsFactor * (0.8 + Math.random() * 0.4)),
        users: Math.floor(sessionsFactor * 0.8 * (0.8 + Math.random() * 0.4)),
        clicks: Math.floor(clicksFactor * (0.8 + Math.random() * 0.4)),
        impressions: Math.floor(impressionsFactor * (0.8 + Math.random() * 0.4)),
      });
    }
    
    return data;
  };

  const chartData = generateSampleData();

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
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600">総セッション</p>
          <p className="text-lg font-semibold text-blue-600">
            {ga4Data.summary.sessions.toLocaleString()}
          </p>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-gray-600">総ユーザー</p>
          <p className="text-lg font-semibold text-green-600">
            {ga4Data.summary.users.toLocaleString()}
          </p>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg">
          <p className="text-sm text-gray-600">総クリック</p>
          <p className="text-lg font-semibold text-purple-600">
            {searchConsoleData.summary.clicks.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}