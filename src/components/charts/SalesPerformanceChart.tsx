"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Area, AreaChart } from 'recharts';
import { TrendData } from '@/lib/types';

interface SalesPerformanceChartProps {
  data: {
    revenueGrowth: TrendData[];
    pipelineHealth: TrendData[];
    conversionRates: TrendData[];
    averageDealSizes: TrendData[];
  };
}

export default function SalesPerformanceChart({ data }: SalesPerformanceChartProps) {
  // データを統合して表示用に変換
  const chartData = data.revenueGrowth.map((revenue, index) => ({
    period: revenue.period,
    revenue: revenue.value,
    pipeline: data.pipelineHealth[index]?.value || 0,
    conversionRate: data.conversionRates[index]?.value || 0,
    dealSize: data.averageDealSizes[index]?.value || 0,
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-8">
      {/* 売上・パイプライン推移 */}
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">売上・パイプライン推移</h4>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="period" 
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={formatCurrency}
            />
            <Tooltip 
              formatter={(value, name) => [
                formatCurrency(value as number), 
                name === 'revenue' ? '売上' : 'パイプライン'
              ]}
              labelStyle={{ color: '#374151' }}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '6px'
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="pipeline"
              stackId="1"
              stroke="#60a5fa"
              fill="#dbeafe"
              name="パイプライン"
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stackId="1"
              stroke="#10b981"
              fill="#d1fae5"
              name="売上"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 成約率推移 */}
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">成約率推移</h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="period" 
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={formatPercentage}
            />
            <Tooltip 
              formatter={(value) => [formatPercentage(value as number), '成約率']}
              labelStyle={{ color: '#374151' }}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '6px'
              }}
            />
            <Line
              type="monotone"
              dataKey="conversionRate"
              stroke="#8b5cf6"
              strokeWidth={3}
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 平均案件規模推移 */}
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">平均案件規模推移</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="period" 
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={formatCurrency}
            />
            <Tooltip 
              formatter={(value) => [formatCurrency(value as number), '平均案件規模']}
              labelStyle={{ color: '#374151' }}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '6px'
              }}
            />
            <Bar 
              dataKey="dealSize" 
              fill="#f59e0b"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 統計サマリー */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">期間サマリー</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-500">最高売上</div>
            <div className="font-semibold text-green-600">
              {formatCurrency(Math.max(...chartData.map(d => d.revenue)))}
            </div>
          </div>
          <div>
            <div className="text-gray-500">最高成約率</div>
            <div className="font-semibold text-purple-600">
              {formatPercentage(Math.max(...chartData.map(d => d.conversionRate)))}
            </div>
          </div>
          <div>
            <div className="text-gray-500">最大案件規模</div>
            <div className="font-semibold text-orange-600">
              {formatCurrency(Math.max(...chartData.map(d => d.dealSize)))}
            </div>
          </div>
          <div>
            <div className="text-gray-500">最大パイプライン</div>
            <div className="font-semibold text-blue-600">
              {formatCurrency(Math.max(...chartData.map(d => d.pipeline)))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}