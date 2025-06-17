"use client";

import { useState, useEffect } from 'react';
import { SalesPrediction, ActionItem } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SalesPredictionEngineProps {
  appointmentIds?: string[];
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function SalesPredictionEngine({
  appointmentIds,
  autoRefresh = false,
  refreshInterval = 300000, // 5分
}: SalesPredictionEngineProps) {
  const [predictions, setPredictions] = useState<SalesPrediction[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadPredictions();
    
    if (autoRefresh) {
      const interval = setInterval(loadPredictions, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [appointmentIds, autoRefresh, refreshInterval]);

  const loadPredictions = async () => {
    try {
      setError(null);
      
      let response;
      if (appointmentIds && appointmentIds.length > 0) {
        // 特定案件の予測
        response = await fetch('/api/ai/sales-prediction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appointmentIds }),
        });
      } else {
        // 全案件の予測
        response = await fetch('/api/ai/sales-prediction');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load predictions');
      }

      if (Array.isArray(data.data)) {
        setPredictions(data.data);
        setActionItems([]);
      } else {
        setPredictions(data.data.predictions || []);
        setActionItems(data.data.actionItems || []);
      }
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load predictions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load predictions');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-orange-600 bg-orange-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'text-green-600 bg-green-50';
    if (probability >= 60) return 'text-orange-600 bg-orange-50';
    if (probability >= 40) return 'text-blue-600 bg-blue-50';
    return 'text-red-600 bg-red-50';
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" message="AI予測を生成中..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-medium mb-2">予測生成エラー</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadPredictions}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          再試行
        </button>
      </div>
    );
  }

  const highProbabilityPredictions = predictions.filter(p => p.closingProbability >= 80);
  const mediumProbabilityPredictions = predictions.filter(p => p.closingProbability >= 60 && p.closingProbability < 80);
  const lowProbabilityPredictions = predictions.filter(p => p.closingProbability < 60);

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">AI営業予測エンジン</h2>
          <p className="text-gray-600">
            {predictions.length}件の案件を分析中
            {lastUpdated && (
              <span className="ml-2 text-sm text-gray-500">
                最終更新: {lastUpdated.toLocaleString('ja-JP')}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={loadPredictions}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          更新
        </button>
      </div>

      {/* 概要統計 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="elevated" padding="compact">
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{predictions.length}</div>
            <div className="text-sm text-gray-600">総案件数</div>
          </CardContent>
        </Card>
        <Card variant="elevated" padding="compact">
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{highProbabilityPredictions.length}</div>
            <div className="text-sm text-gray-600">高確率案件 (80%+)</div>
          </CardContent>
        </Card>
        <Card variant="elevated" padding="compact">
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{mediumProbabilityPredictions.length}</div>
            <div className="text-sm text-gray-600">中確率案件 (60-80%)</div>
          </CardContent>
        </Card>
        <Card variant="elevated" padding="compact">
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(predictions.reduce((sum, p) => sum + p.predictedRevenue, 0))}
            </div>
            <div className="text-sm text-gray-600">総予測売上</div>
          </CardContent>
        </Card>
      </div>

      {/* アクションアイテム */}
      {actionItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>推奨アクション</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {actionItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(item.priority)}`}>
                        {item.priority === 'high' ? '高優先度' : item.priority === 'medium' ? '中優先度' : '低優先度'}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{item.title}</span>
                    </div>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    {item.estimatedImpact > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        推定インパクト: {formatCurrency(item.estimatedImpact)}
                      </p>
                    )}
                  </div>
                  {item.dueDate && (
                    <div className="text-xs text-gray-500">
                      期限: {new Date(item.dueDate).toLocaleDateString('ja-JP')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 高確率案件 */}
      {highProbabilityPredictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700">🎯 高確率案件 (80%以上)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {highProbabilityPredictions.map((prediction) => (
                <div key={prediction.appointmentId} className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getProbabilityColor(prediction.closingProbability)}`}>
                        {prediction.closingProbability}%
                      </span>
                      <span className={`px-2 py-1 text-xs rounded ${getRiskBadgeColor(prediction.competitorRisk)}`}>
                        {prediction.competitorRisk === 'high' ? '高リスク' : 
                         prediction.competitorRisk === 'medium' ? '中リスク' : '低リスク'}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{formatCurrency(prediction.predictedRevenue)}</div>
                      <div className="text-xs text-gray-500">信頼度: {prediction.confidenceScore}%</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-700">推奨アクション:</span>
                      <ul className="mt-1 space-y-1">
                        {prediction.recommendedActions.map((action, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <span className="text-green-500 mr-2">•</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">フォローアップ:</span>
                      <span className="ml-2 text-gray-600">{prediction.optimalFollowUpTiming}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 中確率案件 */}
      {mediumProbabilityPredictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-700">⚡ 中確率案件 (60-80%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mediumProbabilityPredictions.map((prediction) => (
                <div key={prediction.appointmentId} className="border border-orange-200 rounded-lg p-3 bg-orange-50">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-sm font-medium rounded ${getProbabilityColor(prediction.closingProbability)}`}>
                        {prediction.closingProbability}%
                      </span>
                      <span className="text-sm text-gray-700">
                        {formatCurrency(prediction.predictedRevenue)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {prediction.optimalFollowUpTiming}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 低確率案件 */}
      {lowProbabilityPredictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-700">🔄 要改善案件 (60%未満)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowProbabilityPredictions.slice(0, 5).map((prediction) => (
                <div key={prediction.appointmentId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getProbabilityColor(prediction.closingProbability)}`}>
                      {prediction.closingProbability}%
                    </span>
                    <span className="text-sm text-gray-600">
                      {formatCurrency(prediction.predictedRevenue)}
                    </span>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${getRiskBadgeColor(prediction.competitorRisk)}`}>
                    {prediction.competitorRisk === 'high' ? '高リスク' : 
                     prediction.competitorRisk === 'medium' ? '中リスク' : '低リスク'}
                  </span>
                </div>
              ))}
              {lowProbabilityPredictions.length > 5 && (
                <div className="text-center text-sm text-gray-500 mt-2">
                  他 {lowProbabilityPredictions.length - 5} 件
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {predictions.length === 0 && (
        <Card>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              予測可能な案件がありません
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}