"use client";

import { useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface SalesPipelineStage {
  name: string;
  count: number;
  value: number;
  conversionRate: number;
}

interface SalesPipelineData {
  stages: SalesPipelineStage[];
  totalValue: number;
  totalAppointments: number;
}

interface SalesPipelineChartProps {
  pipelineData?: SalesPipelineData;
  isLoading?: boolean;
}

const SalesPipelineChart: React.FC<SalesPipelineChartProps> = ({
  pipelineData,
  isLoading = false
}) => {
  const chartData = useMemo(() => {
    if (!pipelineData || !pipelineData.stages || pipelineData.stages.length === 0) {
      // デフォルトデータ（デモ用）
      return [
        { stage: 'リード', count: 120, value: 24000, conversionRate: 100 },
        { stage: '初回面談', count: 80, value: 18000, conversionRate: 67 },
        { stage: '提案', count: 45, value: 13500, conversionRate: 56 },
        { stage: '交渉', count: 25, value: 9000, conversionRate: 56 },
        { stage: '成約', count: 15, value: 6000, conversionRate: 60 }
      ];
    }

    return pipelineData.stages.map(stage => ({
      stage: stage.name,
      count: stage.count,
      value: stage.value,
      conversionRate: stage.conversionRate
    }));
  }, [pipelineData]);

  const totalValue = pipelineData?.totalValue || chartData.reduce((sum, item) => sum + item.value, 0);
  const totalAppointments = pipelineData?.totalAppointments || chartData.reduce((sum, item) => sum + item.count, 0);

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-blue-600">件数: {payload[0]?.value}件</p>
          <p className="text-green-600">金額: ¥{(payload[1]?.value || 0).toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  const CustomLineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-blue-600">転換率: {payload[0]?.value}%</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">📊 営業パイプライン</h3>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">📊 営業パイプライン</h3>
        <div className="text-sm text-gray-500">
          総額: ¥{totalValue.toLocaleString()} | 総件数: {totalAppointments}件
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 案件数・金額チャート */}
        <div>
          <h4 className="text-md font-medium text-gray-800 mb-3">案件数・金額推移</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="stage" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                />
                <YAxis 
                  yAxisId="count"
                  orientation="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                />
                <YAxis 
                  yAxisId="value"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Legend />
                <Bar 
                  yAxisId="count"
                  dataKey="count" 
                  fill="#3b82f6" 
                  name="案件数"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  yAxisId="value"
                  dataKey="value" 
                  fill="#10b981" 
                  name="金額 (¥)"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 転換率チャート */}
        <div>
          <h4 className="text-md font-medium text-gray-800 mb-3">ステージ転換率</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="stage" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomLineTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="conversionRate" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  name="転換率 (%)"
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: '#8b5cf6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* パイプライン統計 */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">
              {chartData[0]?.count || 0}
            </div>
            <div className="text-sm text-gray-600">新規リード</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">
              {chartData[chartData.length - 1]?.count || 0}
            </div>
            <div className="text-sm text-gray-600">成約件数</div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">
              {chartData.length > 0 ? 
                Math.round(
                  chartData.reduce((sum, item) => sum + item.conversionRate, 0) / chartData.length
                ) : 0
              }%
            </div>
            <div className="text-sm text-gray-600">平均転換率</div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600">
              ¥{Math.round(totalValue / Math.max(totalAppointments, 1)).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">平均単価</div>
          </div>
        </div>
      </div>

      {/* パイプライン健全性インジケーター */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h5 className="font-medium text-gray-800 mb-3">パイプライン健全性</h5>
        <div className="space-y-2">
          {chartData.map((stage, index) => {
            const healthScore = stage.conversionRate;
            const healthColor = healthScore >= 70 ? 'bg-green-500' : 
                               healthScore >= 50 ? 'bg-yellow-500' : 'bg-red-500';
            
            return (
              <div key={stage.stage} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 w-20">{stage.stage}</span>
                <div className="flex-1 mx-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${healthColor}`}
                      style={{ width: `${Math.min(healthScore, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">
                  {healthScore}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 最終更新時刻 */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        パイプライン分析: AI-Pipeline-v1.8 | 最終更新: {new Date().toLocaleString('ja-JP')}
      </div>
    </div>
  );
};

export default SalesPipelineChart;