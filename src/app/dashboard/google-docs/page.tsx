'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { LoadingCenter } from '@/components/ui/Loading';

interface AnalyticsData {
  overview: {
    totalDocuments: number;
    recentSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    successRate: number;
    totalRecommendations: number;
    acceptedRecommendations: number;
    recommendationAcceptanceRate: number;
    aiAnalyses: number;
  };
  processing: {
    currentlyProcessing: number;
    recentlyCompleted: number;
    recentErrors: number;
    lastProcessingTime: string | null;
  };
  health: {
    systemStatus: 'HEALTHY' | 'WARNING' | 'ERROR';
    aiSystemStatus: 'ACTIVE' | 'INACTIVE';
    recommendationSystemStatus: 'ACTIVE' | 'INACTIVE';
  };
  timeRange: {
    range: string;
    days: number;
    startDate: string;
    endDate: string;
  };
}

interface Recommendation {
  id: string;
  recommendation_type: string;
  title: string;
  description: string;
  status: string;
  relevance_score: number;
  priority_score: number;
  executabilityScore: number;
  estimatedImpact: 'LOW' | 'MEDIUM' | 'HIGH';
  suggested_data: any;
  createdAt: string;
}

export default function GoogleDocsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // データ取得
  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/google-docs/analytics?timeRange=${timeRange}&includeDetails=true`);
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Analytics取得エラー:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/google-docs/recommendations?status=PENDING&limit=10&minRelevance=0.5');
      const data = await response.json();
      
      if (data.success) {
        setRecommendations(data.data.recommendations);
      }
    } catch (error) {
      console.error('レコメンデーション取得エラー:', error);
    }
  };

  // 初期データ読み込み
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAnalytics(), fetchRecommendations()]);
      setLoading(false);
    };
    
    loadData();
  }, [timeRange]);

  // 自動リフレッシュ
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAnalytics();
      fetchRecommendations();
    }, 30000); // 30秒ごと

    return () => clearInterval(interval);
  }, [autoRefresh, timeRange]);

  // レコメンデーション実行
  const executeRecommendation = async (recommendationId: string) => {
    try {
      const response = await fetch('/api/google-docs/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          recommendationId,
          params: { userId: 'current-user' }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`✅ ${data.result.message}`);
        fetchRecommendations(); // リストを更新
      } else {
        alert(`❌ 実行失敗: ${data.error}`);
      }
    } catch (error) {
      alert(`❌ エラー: ${error}`);
    }
  };

  // レコメンデーション削除
  const deleteRecommendation = async (recommendationId: string) => {
    if (!confirm('このレコメンデーションを削除しますか？')) {
      return;
    }

    try {
      const response = await fetch('/api/google-docs/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          recommendationId,
          params: { feedback: 'ユーザーによる削除' }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        fetchRecommendations(); // リストを更新
      } else {
        alert(`❌ 削除失敗: ${data.error}`);
      }
    } catch (error) {
      alert(`❌ エラー: ${error}`);
    }
  };

  // ステータス色の取得
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY': return 'text-green-600 bg-green-100';
      case 'WARNING': return 'text-yellow-600 bg-yellow-100';
      case 'ERROR': return 'text-red-600 bg-red-100';
      case 'ACTIVE': return 'text-blue-600 bg-blue-100';
      case 'INACTIVE': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // インパクト色の取得
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'HIGH': return 'text-red-600 bg-red-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <SkeletonCard className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Google Docs AI分析ダッシュボード</h1>
          <p className="text-gray-600 mt-1">リアルタイム監視・制御システム</p>
        </div>
        
        <div className="flex space-x-4">
          {/* 時間範囲選択 */}
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white"
          >
            <option value="1d">過去24時間</option>
            <option value="7d">過去7日間</option>
            <option value="30d">過去30日間</option>
            <option value="90d">過去90日間</option>
          </select>
          
          {/* 自動リフレッシュ切り替え */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-md font-medium ${
              autoRefresh 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {autoRefresh ? '🔄 自動更新中' : '⏸️ 停止中'}
          </button>
        </div>
      </div>

      {/* システム健全性 */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">システム状況</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>システム全体</span>
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(analytics.health.systemStatus)}`}>
                  {analytics.health.systemStatus}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>AI分析</span>
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(analytics.health.aiSystemStatus)}`}>
                  {analytics.health.aiSystemStatus}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>レコメンド</span>
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(analytics.health.recommendationSystemStatus)}`}>
                  {analytics.health.recommendationSystemStatus}
                </span>
              </div>
            </div>
          </Card>

          {/* 同期統計 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">同期パフォーマンス</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>成功率</span>
                <span className="font-bold text-green-600">{analytics.overview.successRate}%</span>
              </div>
              <div className="flex justify-between">
                <span>総同期数</span>
                <span className="font-bold">{analytics.overview.recentSyncs}</span>
              </div>
              <div className="flex justify-between">
                <span>失敗数</span>
                <span className="font-bold text-red-600">{analytics.overview.failedSyncs}</span>
              </div>
              <div className="flex justify-between">
                <span>処理中</span>
                <span className="font-bold text-blue-600">{analytics.processing.currentlyProcessing}</span>
              </div>
            </div>
          </Card>

          {/* AI分析統計 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">AI分析・レコメンド</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>AI分析実行数</span>
                <span className="font-bold">{analytics.overview.aiAnalyses}</span>
              </div>
              <div className="flex justify-between">
                <span>レコメンド生成</span>
                <span className="font-bold">{analytics.overview.totalRecommendations}</span>
              </div>
              <div className="flex justify-between">
                <span>採用率</span>
                <span className="font-bold text-green-600">{analytics.overview.recommendationAcceptanceRate}%</span>
              </div>
              <div className="flex justify-between">
                <span>総ドキュメント</span>
                <span className="font-bold">{analytics.overview.totalDocuments}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* レコメンデーション一覧 */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">🤖 AI レコメンデーション (上位10件)</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">総件数: {recommendations.length}件</span>
            <button
              onClick={fetchRecommendations}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              更新
            </button>
          </div>
        </div>
        
        {recommendations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="text-gray-400 text-lg mb-2">現在、実行可能なレコメンデーションはありません</div>
            <div className="text-gray-500 text-sm">新しい議事録をAI分析すると、自動的にレコメンデーションが生成されます</div>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={rec.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 hover:shadow-md transition-all duration-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 mr-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        #{index + 1}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(rec.estimatedImpact)}`}>
                        {rec.estimatedImpact === 'HIGH' ? '高インパクト' : rec.estimatedImpact === 'MEDIUM' ? '中インパクト' : '低インパクト'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">{rec.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{rec.description}</p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <div className="text-sm text-gray-500 mb-1">関連性</div>
                      <div className="text-lg font-bold text-blue-600">{Math.round(rec.relevance_score * 100)}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 mb-1">実行容易度</div>
                      <div className="text-lg font-bold text-green-600">{Math.round(rec.executabilityScore * 100)}%</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">タイプ: <span className="font-medium">{rec.recommendation_type.replace('_', ' ')}</span></span>
                    <span className="text-gray-600">優先度スコア: <span className="font-medium">{Math.round(rec.priority_score * 100)}</span></span>
                  </div>
                </div>
                
                <div className="flex justify-end items-center gap-3">
                  <button
                    onClick={() => deleteRecommendation(rec.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 font-medium transition-all duration-200 hover:shadow-md flex items-center gap-2"
                    title="このレコメンデーションを削除"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    削除
                  </button>
                  <button
                    onClick={() => executeRecommendation(rec.id)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium transition-all duration-200 hover:shadow-md flex items-center gap-2"
                    title="このレコメンデーションを実行"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    ワンクリック実行
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 最終更新時刻 */}
      <div className="text-center text-sm text-gray-500">
        最終更新: {new Date().toLocaleString()}
        {autoRefresh && <span className="ml-2">（30秒ごと自動更新）</span>}
      </div>
    </div>
  );
}