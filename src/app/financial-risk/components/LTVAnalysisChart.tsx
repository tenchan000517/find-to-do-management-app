'use client';

import React from 'react';
import { LTVAnalysis } from '@/hooks/useFinancialRisk';
import { TrendingUp, Users, DollarSign, Target, ArrowUp, ArrowDown } from 'lucide-react';

interface LTVAnalysisChartProps {
  data: LTVAnalysis[];
  loading?: boolean;
}

export default function LTVAnalysisChart({ data, loading }: LTVAnalysisChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  // セグメント別の集計
  const segmentData = data.reduce((acc, customer) => {
    const segment = customer.segment;
    if (!acc[segment]) {
      acc[segment] = {
        count: 0,
        totalLTV: 0,
        avgLTV: 0,
        totalPredictedLTV: 0,
        avgPredictedLTV: 0
      };
    }
    acc[segment].count++;
    acc[segment].totalLTV += customer.currentLTV;
    acc[segment].totalPredictedLTV += customer.predictedLTV;
    return acc;
  }, {} as Record<string, any>);

  // 平均値を計算
  Object.keys(segmentData).forEach(segment => {
    segmentData[segment].avgLTV = segmentData[segment].totalLTV / segmentData[segment].count;
    segmentData[segment].avgPredictedLTV = segmentData[segment].totalPredictedLTV / segmentData[segment].count;
  });

  // 全体の統計
  const totalCustomers = data.length;
  const totalCurrentLTV = data.reduce((sum, customer) => sum + customer.currentLTV, 0);
  const totalPredictedLTV = data.reduce((sum, customer) => sum + customer.predictedLTV, 0);
  const averageLTV = totalCustomers > 0 ? totalCurrentLTV / totalCustomers : 0;
  const ltvGrowthPotential = totalPredictedLTV - totalCurrentLTV;
  const growthPercentage = totalCurrentLTV > 0 ? ((ltvGrowthPotential / totalCurrentLTV) * 100) : 0;

  // セグメント色の定義
  const segmentColors = {
    A: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: 'text-green-600' },
    B: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'text-blue-600' },
    C: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: 'text-yellow-600' },
    D: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'text-red-600' }
  };

  // 上位顧客のリスト（LTV上位5名）
  const topCustomers = [...data]
    .sort((a, b) => b.currentLTV - a.currentLTV)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 全体統計 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
            LTV分析概要
          </h3>
          <span className="text-sm text-gray-500">{totalCustomers}名の顧客</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">平均LTV</p>
                <p className="text-2xl font-bold text-blue-900">
                  ¥{averageLTV.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">総LTV</p>
                <p className="text-2xl font-bold text-green-900">
                  ¥{totalCurrentLTV.toLocaleString()}
                </p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">成長ポテンシャル</p>
                <p className="text-2xl font-bold text-purple-900">
                  ¥{ltvGrowthPotential.toLocaleString()}
                </p>
              </div>
              {growthPercentage >= 0 ? (
                <ArrowUp className="w-8 h-8 text-purple-600" />
              ) : (
                <ArrowDown className="w-8 h-8 text-purple-600" />
              )}
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">成長率</p>
                <p className="text-2xl font-bold text-orange-900">
                  {growthPercentage > 0 ? '+' : ''}{growthPercentage.toFixed(1)}%
                </p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* セグメント別分析 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">セグメント別LTV分析</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(segmentData).map(([segment, stats]) => {
            const colors = segmentColors[segment as keyof typeof segmentColors];
            const growthPotential = stats.avgPredictedLTV - stats.avgLTV;
            const segmentGrowthPercentage = stats.avgLTV > 0 ? ((growthPotential / stats.avgLTV) * 100) : 0;
            
            return (
              <div key={segment} className={`${colors.bg} ${colors.border} border rounded-lg p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-lg font-bold ${colors.text}`}>セグメント {segment}</span>
                  <span className={`text-sm ${colors.text}`}>{stats.count}名</span>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <p className={`text-xs ${colors.text} opacity-80`}>平均LTV</p>
                    <p className={`text-lg font-semibold ${colors.text}`}>
                      ¥{stats.avgLTV.toLocaleString()}
                    </p>
                  </div>
                  
                  <div>
                    <p className={`text-xs ${colors.text} opacity-80`}>予測LTV</p>
                    <p className={`text-lg font-semibold ${colors.text}`}>
                      ¥{stats.avgPredictedLTV.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className={`text-xs ${colors.text} opacity-80`}>成長率</p>
                    <span className={`text-sm font-medium ${colors.text} flex items-center`}>
                      {segmentGrowthPercentage > 0 ? (
                        <ArrowUp className="w-3 h-3 mr-1" />
                      ) : (
                        <ArrowDown className="w-3 h-3 mr-1" />
                      )}
                      {segmentGrowthPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 上位顧客リスト */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">LTV上位顧客</h3>
        <div className="space-y-3">
          {topCustomers.map((customer, index) => {
            const colors = segmentColors[customer.segment];
            const growthPotential = customer.predictedLTV - customer.currentLTV;
            const customerGrowthPercentage = customer.currentLTV > 0 ? ((growthPotential / customer.currentLTV) * 100) : 0;
            
            return (
              <div key={customer.customerId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-700">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{customer.customerName}</p>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${colors.bg} ${colors.text}`}>
                        セグメント {customer.segment}
                      </span>
                      <span className="text-sm text-gray-500">
                        AOV: ¥{customer.averageOrderValue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    ¥{customer.currentLTV.toLocaleString()}
                  </p>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 mr-2">予測:</span>
                    <span className="font-medium">¥{customer.predictedLTV.toLocaleString()}</span>
                    <span className={`ml-2 flex items-center ${customerGrowthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {customerGrowthPercentage >= 0 ? (
                        <ArrowUp className="w-3 h-3 mr-1" />
                      ) : (
                        <ArrowDown className="w-3 h-3 mr-1" />
                      )}
                      {Math.abs(customerGrowthPercentage).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}