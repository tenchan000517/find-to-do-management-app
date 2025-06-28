"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useSalesAnalytics } from '@/hooks/useSalesAnalytics';
import SalesPredictionCard from './components/SalesPredictionCard';
import SalesPipelineChart from './components/SalesPipelineChart';
import ROIPredictionChart from './components/ROIPredictionChart';
import FollowUpSuggestions from './components/FollowUpSuggestions';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function SalesAnalyticsPage() {
  const {
    analyticsData,
    followUpSuggestions,
    loading,
    error,
    lastRefresh,
    refreshData,
    recalculatePredictions,
    executeFollowUpAction
  } = useSalesAnalytics();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRecalculate = async () => {
    setIsRefreshing(true);
    try {
      await recalculatePredictions();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading && !analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-lg text-gray-600">営業分析データを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">データ読み込みエラー</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? '再試行中...' : '再試行'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ページヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🎯 営業AI分析ダッシュボード
              </h1>
              <p className="text-gray-600 mt-2">
                AI予測による営業プロセス最適化と成果向上
              </p>
              {lastRefresh && (
                <p className="text-sm text-gray-500 mt-1">
                  最終更新: {lastRefresh.toLocaleString('ja-JP')}
                </p>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button 
                onClick={handleRefresh} 
                disabled={isRefreshing}
                variant="outline"
              >
                {isRefreshing ? '更新中...' : '🔄 データ更新'}
              </Button>
              <Button 
                onClick={handleRecalculate} 
                disabled={isRefreshing}
                variant="primary"
              >
                {isRefreshing ? '計算中...' : '🤖 AI再計算'}
              </Button>
            </div>
          </div>
        </div>

        {/* サマリーカード */}
        {analyticsData?.summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">総アポイントメント数</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsData.summary.totalAppointments}
                  </p>
                </div>
                <div className="text-3xl">📊</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">高確率案件</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {analyticsData.summary.highProbability}
                  </p>
                  <p className="text-xs text-gray-500">80%以上</p>
                </div>
                <div className="text-3xl">🎯</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">中確率案件</h3>
                  <p className="text-2xl font-bold text-yellow-600">
                    {analyticsData.summary.mediumProbability}
                  </p>
                  <p className="text-xs text-gray-500">60-79%</p>
                </div>
                <div className="text-3xl">⚠️</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">平均成約確率</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {analyticsData.summary.averageProbability}%
                  </p>
                </div>
                <div className="text-3xl">📈</div>
              </div>
            </div>
          </div>
        )}

        {/* メインコンテンツ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* 成約確率予測カード */}
          <div className="lg:col-span-1">
            <SalesPredictionCard 
              predictions={analyticsData?.predictions || []}
              isLoading={isRefreshing}
            />
          </div>

          {/* フォローアップ提案 */}
          <div className="lg:col-span-1">
            <FollowUpSuggestions
              suggestions={followUpSuggestions}
              onExecute={executeFollowUpAction}
              isLoading={isRefreshing}
            />
          </div>

          {/* ROI予測 */}
          <div className="lg:col-span-1">
            <ROIPredictionChart
              projections={analyticsData?.roiProjections || []}
              isLoading={isRefreshing}
            />
          </div>
        </div>

        {/* 営業パイプライン */}
        <div className="mb-8">
          <SalesPipelineChart
            pipelineData={analyticsData?.pipeline}
            isLoading={isRefreshing}
          />
        </div>

        {/* 高確率案件一覧 */}
        {analyticsData?.predictions && analyticsData.predictions.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">🔥 注目すべき高確率案件</h3>
            <div className="space-y-3">
              {analyticsData.predictions
                .filter(p => p.probability >= 80)
                .slice(0, 5)
                .map((prediction) => (
                  <div 
                    key={prediction.id} 
                    className="flex items-center justify-between p-4 border border-green-200 rounded-lg bg-green-50"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {prediction.appointmentTitle}
                      </h4>
                      <p className="text-sm text-gray-600">
                        信頼度: {prediction.confidence}% | 
                        最終更新: {new Date(prediction.lastUpdated).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {prediction.probability}%
                      </div>
                      <div className="text-xs text-gray-500">成約確率</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ナビゲーション */}
        <div className="mt-8 text-center">
          <Link 
            href="/dashboard" 
            className="text-blue-500 hover:underline inline-flex items-center"
          >
            ← メインダッシュボードに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}