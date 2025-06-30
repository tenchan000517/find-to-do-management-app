"use client";

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface ROIProjection {
  timeframe: string;
  projectedROI: number;
  conservativeROI: number;
  confidence: number;
}

interface ROIPredictionChartProps {
  projections: ROIProjection[];
  isLoading?: boolean;
}

const ROIPredictionChart: React.FC<ROIPredictionChartProps> = ({
  projections = [],
  isLoading = false
}) => {
  const chartData = useMemo(() => {
    if (!projections || projections.length === 0) {
      // デフォルトデータ（デモ用）
      return [
        { month: '1ヶ月後', projected: 15, conservative: 8, confidence: 85 },
        { month: '3ヶ月後', projected: 45, conservative: 25, confidence: 78 },
        { month: '6ヶ月後', projected: 89, conservative: 52, confidence: 72 },
        { month: '12ヶ月後', projected: 156, conservative: 98, confidence: 65 }
      ];
    }

    return projections.map(proj => ({
      month: proj.timeframe,
      projected: proj.projectedROI,
      conservative: proj.conservativeROI,
      confidence: proj.confidence
    }));
  }, [projections]);

  const finalProjectedROI = chartData[chartData.length - 1]?.projected || 0;
  const finalConfidence = chartData[chartData.length - 1]?.confidence || 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}%
            </p>
          ))}
          {payload[0]?.payload?.confidence && (
            <p className="text-xs text-gray-500 mt-1">
              信頼度: {payload[0].payload.confidence}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">📈 ROI予測</h3>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">📈 ROI予測</h3>
        <div className="text-sm text-gray-500">
          投資収益率の時系列予測
        </div>
      </div>

      {/* チャート */}
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="projected" 
              stroke="#10b981" 
              strokeWidth={3}
              name="楽観的予測"
              dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7, stroke: '#10b981', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="conservative" 
              stroke="#6b7280" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="保守的予測"
              dot={{ fill: '#6b7280', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* サマリー情報 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {finalProjectedROI}%
          </div>
          <div className="text-sm text-gray-600">12ヶ月予測ROI</div>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {finalConfidence}%
          </div>
          <div className="text-sm text-gray-600">予測信頼度</div>
        </div>
      </div>

      {/* ROI分析メトリクス */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">
            {chartData.length > 1 ? 
              Math.round(((chartData[chartData.length - 1]?.projected || 0) - (chartData[0]?.projected || 0)) / chartData.length) 
              : 0
            }%
          </div>
          <div className="text-xs text-gray-500">月平均成長率</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-600">
            {chartData.length > 0 ? 
              Math.round(chartData.reduce((sum, item) => sum + item.confidence, 0) / chartData.length)
              : 0
            }%
          </div>
          <div className="text-xs text-gray-500">平均信頼度</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-orange-600">
            {chartData.length > 0 ? 
              Math.round(((finalProjectedROI - chartData[chartData.length - 1]?.conservative) / finalProjectedROI) * 100)
              : 0
            }%
          </div>
          <div className="text-xs text-gray-500">楽観差</div>
        </div>
      </div>

      {/* 注意事項 */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start">
          <div className="text-yellow-500 mr-2">⚠️</div>
          <div className="text-sm text-yellow-800">
            <strong>注意:</strong> ROI予測は過去のデータと現在のトレンドに基づいています。
            市場条件の変化により実際の結果は異なる場合があります。
          </div>
        </div>
      </div>

      {/* 最終更新時刻 */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        予測モデル: AI-ROI-v2.1 | 最終更新: {new Date().toLocaleString('ja-JP')}
      </div>
    </div>
  );
};

export default ROIPredictionChart;