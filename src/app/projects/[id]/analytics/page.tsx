"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProjectAnalytics } from '@/hooks/useProjectAnalytics';
import SuccessPrediction from './components/SuccessPrediction';
import KGIPredictionChart from './components/KGIPredictionChart';
import RiskAnalysis from './components/RiskAnalysis';
import ImprovementRecommendations from './components/ImprovementRecommendations';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface ProjectAnalyticsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ProjectAnalyticsPage({ params }: ProjectAnalyticsPageProps) {
  const [projectId, setProjectId] = useState<string>('');

  useEffect(() => {
    params.then(resolvedParams => {
      setProjectId(resolvedParams.id);
    });
  }, [params]);

  const {
    analytics,
    kgiData,
    projectHealth,
    loading,
    error,
    lastRefresh,
    refreshData,
    recalculateAnalytics,
    applyRecommendation
  } = useProjectAnalytics(projectId);

  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!projectId) {
    return <LoadingSpinner />;
  }

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
      await recalculateAnalytics();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading && !analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-lg text-gray-600">プロジェクト分析データを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">分析データ読み込みエラー</h2>
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
                📊 プロジェクト分析
              </h1>
              <p className="text-gray-600 mt-2">
                AI予測による成功確率とリスク分析
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
                {isRefreshing ? '分析中...' : '🤖 AI再分析'}
              </Button>
            </div>
          </div>
        </div>

        {/* プロジェクト健全性アラート */}
        {projectHealth?.alerts && projectHealth.alerts.length > 0 && (
          <div className="mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="text-red-500 mr-2">🚨</div>
                <h3 className="font-semibold text-red-800">プロジェクトアラート</h3>
              </div>
              <div className="space-y-2">
                {projectHealth.alerts.map((alert, index) => (
                  <div key={index} className="text-sm">
                    <div className="flex items-start">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium mr-2 ${
                        alert.level === 'CRITICAL' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {alert.level}
                      </span>
                      <div>
                        <p className="text-gray-800">{alert.message}</p>
                        <p className="text-gray-600 mt-1">対応: {alert.actionRequired}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 成功予測メイン */}
        <div className="mb-8">
          <SuccessPrediction 
            projectId={projectId}
            analytics={analytics}
            projectHealth={projectHealth}
            isLoading={isRefreshing}
          />
        </div>

        {/* メインコンテンツグリッド */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* KGI達成予測 */}
          <div>
            <KGIPredictionChart 
              projectId={projectId}
              kgiData={kgiData}
              isLoading={isRefreshing}
            />
          </div>

          {/* リスク分析 */}
          <div>
            <RiskAnalysis 
              analytics={analytics}
              isLoading={isRefreshing}
            />
          </div>
        </div>

        {/* 改善提案 */}
        <div className="mb-8">
          <ImprovementRecommendations
            recommendations={analytics?.improvementRecommendations as any[] || []}
            onApply={applyRecommendation}
            isLoading={isRefreshing}
          />
        </div>

        {/* 成功要因詳細 */}
        {analytics?.successFactors && analytics.successFactors.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">🎯 成功要因詳細分析</h3>
            
            <div className="space-y-4">
              {analytics.successFactors.map((factor, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{factor.factor}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm px-2 py-1 rounded ${
                        factor.actionable 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {factor.actionable ? '改善可能' : '外部要因'}
                      </span>
                      <span className={`text-sm font-medium ${
                        factor.impact > 5 ? 'text-green-600' :
                        factor.impact > 0 ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        影響度: {factor.impact > 0 ? '+' : ''}{factor.impact}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">現在レベル</div>
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${(factor.current / 10) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{factor.current}/10</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600 mb-1">最適レベル</div>
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="h-2 rounded-full bg-green-500"
                            style={{ width: `${(factor.optimal / 10) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{factor.optimal}/10</span>
                      </div>
                    </div>
                  </div>

                  {factor.current < factor.optimal && factor.actionable && (
                    <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-800">
                      💡 {factor.optimal - factor.current}ポイントの改善余地があります
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ベンチマーク比較 */}
        {analytics?.benchmarkComparison && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">📈 ベンチマーク比較</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {analytics.benchmarkComparison.similarProjects}
                </div>
                <div className="text-sm text-gray-600">類似プロジェクト数</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(analytics.benchmarkComparison.industryAverage * 100)}%
                </div>
                <div className="text-sm text-gray-600">業界平均成功率</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {analytics.benchmarkComparison.performanceRanking}
                </div>
                <div className="text-sm text-gray-600">パフォーマンスランク</div>
              </div>
            </div>
          </div>
        )}

        {/* ナビゲーション */}
        <div className="text-center">
          <Link 
            href={`/projects/${projectId}`} 
            className="text-blue-500 hover:underline inline-flex items-center"
          >
            ← プロジェクト詳細に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}