"use client";

import { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { SalesPrediction } from '@/lib/types';

interface PredictionVisualizationProps {
  predictions: SalesPrediction[];
}

export default function PredictionVisualization({ predictions }: PredictionVisualizationProps) {
  const [selectedPrediction, setSelectedPrediction] = useState<SalesPrediction | null>(null);

  // 成約確率による色分け
  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return '#10b981'; // 緑 - 高確率
    if (probability >= 60) return '#f59e0b'; // オレンジ - 中確率
    if (probability >= 40) return '#3b82f6'; // 青 - 低中確率
    return '#ef4444'; // 赤 - 低確率
  };

  // リスクレベルによる色分け
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // 散布図用データ変換
  const scatterData = predictions.map((pred, index) => ({
    x: pred.closingProbability,
    y: pred.predictedRevenue,
    z: pred.confidenceScore,
    id: pred.appointmentId,
    risk: pred.competitorRisk,
    actions: pred.recommendedActions.length,
    index,
  }));

  // 確率分布データ
  const probabilityBuckets = [
    { range: '0-20%', count: predictions.filter(p => p.closingProbability < 20).length },
    { range: '20-40%', count: predictions.filter(p => p.closingProbability >= 20 && p.closingProbability < 40).length },
    { range: '40-60%', count: predictions.filter(p => p.closingProbability >= 40 && p.closingProbability < 60).length },
    { range: '60-80%', count: predictions.filter(p => p.closingProbability >= 60 && p.closingProbability < 80).length },
    { range: '80-100%', count: predictions.filter(p => p.closingProbability >= 80).length },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const prediction = predictions.find(p => p.appointmentId === data.id);
      
      if (prediction) {
        return (
          <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg min-w-[250px]">
            <p className="font-semibold text-gray-900 mb-2">案件予測詳細</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">成約確率:</span>
                <span className="font-medium">{prediction.closingProbability}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">予測売上:</span>
                <span className="font-medium">{formatCurrency(prediction.predictedRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">信頼度:</span>
                <span className="font-medium">{prediction.confidenceScore}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">競合リスク:</span>
                <span className={`font-medium ${
                  prediction.competitorRisk === 'high' ? 'text-red-600' :
                  prediction.competitorRisk === 'medium' ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {prediction.competitorRisk === 'high' ? '高' :
                   prediction.competitorRisk === 'medium' ? '中' : '低'}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-500">クリックで詳細表示</span>
              </div>
            </div>
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* 概要統計 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-blue-600 text-sm font-medium">総案件数</div>
          <div className="text-2xl font-bold text-blue-900">{predictions.length}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-green-600 text-sm font-medium">高確率案件</div>
          <div className="text-2xl font-bold text-green-900">
            {predictions.filter(p => p.closingProbability >= 80).length}
          </div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="text-orange-600 text-sm font-medium">平均成約確率</div>
          <div className="text-2xl font-bold text-orange-900">
            {predictions.length > 0 
              ? Math.round(predictions.reduce((sum, p) => sum + p.closingProbability, 0) / predictions.length)
              : 0}%
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-purple-600 text-sm font-medium">総予測売上</div>
          <div className="text-2xl font-bold text-purple-900">
            {formatCurrency(predictions.reduce((sum, p) => sum + p.predictedRevenue, 0))}
          </div>
        </div>
      </div>

      {/* 成約確率 vs 予測売上 散布図 */}
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">成約確率 vs 予測売上分析</h4>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart data={scatterData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              type="number" 
              domain={[0, 100]}
              dataKey="x"
              name="成約確率"
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
              label={{ value: '成約確率 (%)', position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              type="number"
              dataKey="y"
              name="予測売上"
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={formatCurrency}
              label={{ value: '予測売上', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter 
              dataKey="y" 
              onClick={(data) => {
                const prediction = predictions.find(p => p.appointmentId === data.id);
                setSelectedPrediction(prediction || null);
              }}
            >
              {scatterData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getProbabilityColor(entry.x)}
                  stroke={getRiskColor(entry.risk)}
                  strokeWidth={2}
                  r={Math.max(4, entry.z / 10)} // 信頼度に応じてサイズ変更
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div className="flex justify-center mt-2 space-x-6 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>高確率 (80%+)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>中確率 (60-80%)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>低中確率 (40-60%)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>低確率 (40%未満)</span>
          </div>
        </div>
      </div>

      {/* 成約確率分布 */}
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">成約確率分布</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={probabilityBuckets}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="range" 
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip 
              formatter={(value) => [`${value}件`, '案件数']}
              labelStyle={{ color: '#374151' }}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '6px'
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {probabilityBuckets.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={
                  index === 4 ? '#10b981' : // 80-100%
                  index === 3 ? '#f59e0b' : // 60-80%
                  index === 2 ? '#3b82f6' : // 40-60%
                  index === 1 ? '#f97316' : // 20-40%
                  '#ef4444' // 0-20%
                } />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 選択された案件の詳細 */}
      {selectedPrediction && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-blue-900 mb-4">選択案件の詳細分析</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-gray-900 mb-3">予測スコア</h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">成約確率:</span>
                  <span className="font-medium">{selectedPrediction.closingProbability}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">予測売上:</span>
                  <span className="font-medium">{formatCurrency(selectedPrediction.predictedRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">信頼度:</span>
                  <span className="font-medium">{selectedPrediction.confidenceScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">競合リスク:</span>
                  <span className={`font-medium ${
                    selectedPrediction.competitorRisk === 'high' ? 'text-red-600' :
                    selectedPrediction.competitorRisk === 'medium' ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {selectedPrediction.competitorRisk === 'high' ? '高リスク' :
                     selectedPrediction.competitorRisk === 'medium' ? '中リスク' : '低リスク'}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h5 className="font-medium text-gray-900 mb-3">推奨アクション</h5>
              <ul className="space-y-1">
                {selectedPrediction.recommendedActions.map((action, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    {action}
                  </li>
                ))}
              </ul>
              <div className="mt-4 p-3 bg-white rounded border">
                <div className="text-sm">
                  <strong>最適フォロータイミング:</strong>
                  <div className="text-gray-600 mt-1">{selectedPrediction.optimalFollowUpTiming}</div>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setSelectedPrediction(null)}
            className="mt-4 text-blue-600 hover:text-blue-800 text-sm"
          >
            閉じる
          </button>
        </div>
      )}
    </div>
  );
}