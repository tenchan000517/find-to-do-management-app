"use client";

import { useState, useEffect } from 'react';
import { SalesAnalyticsData } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import SalesPerformanceChart from '@/components/charts/SalesPerformanceChart';
import PredictionVisualization from '@/components/charts/PredictionVisualization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SalesAnalyticsDashboardProps {
  timeRange?: '7d' | '30d' | '90d' | '1y';
}

export default function SalesAnalyticsDashboard({ 
  timeRange = '30d' 
}: SalesAnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<SalesAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'predictions' | 'trends' | 'segments'>('overview');

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 営業パフォーマンスデータ取得
      const performanceResponse = await fetch(
        `/api/analytics/sales-performance?period=${timeRange.replace('d', '').replace('y', '365')}`
      );
      const performanceData = await performanceResponse.json();

      if (!performanceData.success) {
        throw new Error(performanceData.error);
      }

      // AI予測データ取得
      const predictionResponse = await fetch('/api/ai/sales-prediction');
      const predictionData = await predictionResponse.json();

      if (!predictionData.success) {
        throw new Error(predictionData.error);
      }

      // データ統合
      const combinedData: SalesAnalyticsData = {
        overview: performanceData.data.metrics,
        predictions: predictionData.data,
        segments: [], // TODO: セグメント分析実装
        trends: performanceData.data.trends,
        actionItems: [], // TODO: アクションアイテム実装
      };

      setAnalyticsData(combinedData);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
      setError(err instanceof Error ? err.message : 'データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getChangeColor = (change?: number) => {
    if (!change) return 'text-gray-500';
    return change > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = (change?: number) => {
    if (!change) return '→';
    return change > 0 ? '↗' : '↘';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="lg" message="営業分析データを読み込み中..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-medium mb-2">データ読み込みエラー</h3>
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadAnalyticsData}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          再試行
        </button>
      </div>
    );
  }

  if (!analyticsData) {
    return <div>データが見つかりません</div>;
  }

  const { overview, predictions, trends } = analyticsData;

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">営業分析ダッシュボード</h1>
          <p className="text-gray-600">営業パフォーマンスとAI予測の統合分析</p>
        </div>
        <div className="flex space-x-2">
          <select
            value={timeRange}
            onChange={(e) => window.location.href = `?timeRange=${e.target.value}`}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="7d">過去7日</option>
            <option value="30d">過去30日</option>
            <option value="90d">過去90日</option>
            <option value="1y">過去1年</option>
          </select>
          <button
            onClick={loadAnalyticsData}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            更新
          </button>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: '概要' },
            { id: 'predictions', label: 'AI予測' },
            { id: 'trends', label: 'トレンド' },
            { id: 'segments', label: 'セグメント' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 概要タブ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPIカード */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">成約率</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {formatPercentage(overview.conversionRate)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  全案件に対する成約率
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">平均案件規模</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(overview.averageDealSize)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  1案件あたりの平均金額
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">営業サイクル</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {overview.salesCycleLength.toFixed(1)}日
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  平均成約期間
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">アクティブ案件</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {overview.activeDeals}件
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  進行中の営業案件
                </p>
              </CardContent>
            </Card>
          </div>

          {/* パフォーマンスチャート */}
          <Card>
            <CardHeader>
              <CardTitle>営業パフォーマンス推移</CardTitle>
            </CardHeader>
            <CardContent>
              <SalesPerformanceChart data={trends} />
            </CardContent>
          </Card>

          {/* 詳細メトリクス */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>パイプライン分析</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">総パイプライン価値</span>
                  <span className="font-semibold">{formatCurrency(overview.totalPipelineValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">パイプライン速度</span>
                  <span className="font-semibold">{formatCurrency(overview.pipelineVelocity)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">勝率</span>
                  <span className="font-semibold">{formatPercentage(overview.winRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">失注率</span>
                  <span className="font-semibold">{formatPercentage(overview.lossRate)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>売上分析</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">月次売上</span>
                  <span className="font-semibold">{formatCurrency(overview.monthlyRecurringRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">顧客生涯価値</span>
                  <span className="font-semibold">{formatCurrency(overview.customerLifetimeValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">平均成約時間</span>
                  <span className="font-semibold">{overview.averageTimeToClose.toFixed(1)}日</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* AI予測タブ */}
      {activeTab === 'predictions' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI成約確率予測</CardTitle>
            </CardHeader>
            <CardContent>
              <PredictionVisualization predictions={predictions} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* トレンドタブ */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>売上成長トレンド</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {trends.revenueGrowth.map((trend, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{trend.period}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{formatCurrency(trend.value)}</span>
                        {trend.changePercent && (
                          <span className={`text-xs ${getChangeColor(trend.change)}`}>
                            {getChangeIcon(trend.change)} {Math.abs(trend.changePercent).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>成約率トレンド</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {trends.conversionRates.map((trend, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{trend.period}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{formatPercentage(trend.value)}</span>
                        {trend.changePercent && (
                          <span className={`text-xs ${getChangeColor(trend.change)}`}>
                            {getChangeIcon(trend.change)} {Math.abs(trend.changePercent).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* セグメントタブ */}
      {activeTab === 'segments' && (
        <Card>
          <CardHeader>
            <CardTitle>顧客セグメント分析</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              顧客セグメント分析機能は実装中です
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}