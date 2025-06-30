import { useState, useEffect, useCallback } from 'react';

interface SalesPrediction {
  id: string;
  appointmentId: string;
  appointmentTitle: string;
  probability: number;
  confidence: number;
  factors: Array<{
    name: string;
    impact: number;
    description: string;
  }>;
  lastUpdated: string;
}

interface SalesPipelineData {
  stages: Array<{
    name: string;
    count: number;
    value: number;
    conversionRate: number;
  }>;
  totalValue: number;
  totalAppointments: number;
}

interface ROIProjection {
  timeframe: string;
  projectedROI: number;
  conservativeROI: number;
  confidence: number;
}

interface SalesAnalyticsData {
  predictions: SalesPrediction[];
  pipeline: SalesPipelineData;
  roiProjections: ROIProjection[];
  summary: {
    totalAppointments: number;
    highProbability: number;
    mediumProbability: number;
    lowProbability: number;
    averageProbability: number;
  };
}

interface FollowUpSuggestion {
  id: string;
  appointmentId: string;
  type: 'EMAIL' | 'CALL' | 'MEETING' | 'PROPOSAL';
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedDate: string;
  aiConfidence: number;
}

export const useSalesAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState<SalesAnalyticsData | null>(null);
  const [followUpSuggestions, setFollowUpSuggestions] = useState<FollowUpSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // 営業予測データを取得
  const fetchPredictions = useCallback(async () => {
    try {
      const response = await fetch('/api/sales/prediction?type=prediction');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch predictions');
      }
      
      return result.data;
    } catch (error) {
      console.error('Failed to fetch sales predictions:', error);
      throw error;
    }
  }, []);

  // パイプラインデータを取得
  const fetchPipelineData = useCallback(async () => {
    try {
      const response = await fetch('/api/sales/prediction?type=pipeline');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch pipeline data');
      }
      
      return result.data;
    } catch (error) {
      console.error('Failed to fetch pipeline data:', error);
      throw error;
    }
  }, []);

  // ROI予測データを取得
  const fetchROIProjections = useCallback(async () => {
    try {
      const response = await fetch('/api/sales/prediction?type=roi');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch ROI projections');
      }
      
      return result.data;
    } catch (error) {
      console.error('Failed to fetch ROI projections:', error);
      throw error;
    }
  }, []);

  // フォローアップ提案を取得
  const fetchFollowUpSuggestions = useCallback(async () => {
    try {
      const response = await fetch('/api/sales/automation');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch follow-up suggestions');
      }
      
      return result.data?.suggestions || [];
    } catch (error) {
      console.error('Failed to fetch follow-up suggestions:', error);
      return [];
    }
  }, []);

  // 全データを取得
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [predictions, pipeline, roiProjections, suggestions] = await Promise.all([
        fetchPredictions(),
        fetchPipelineData(),
        fetchROIProjections(),
        fetchFollowUpSuggestions(),
      ]);

      setAnalyticsData({
        predictions: predictions.predictions || [],
        pipeline: pipeline || { stages: [], totalValue: 0, totalAppointments: 0 },
        roiProjections: roiProjections.projections || [],
        summary: predictions.summary || {
          totalAppointments: 0,
          highProbability: 0,
          mediumProbability: 0,
          lowProbability: 0,
          averageProbability: 0
        }
      });

      setFollowUpSuggestions(suggestions);
      setLastRefresh(new Date());
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      console.error('Failed to fetch sales analytics data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchPredictions, fetchPipelineData, fetchROIProjections, fetchFollowUpSuggestions]);

  // 予測を再計算
  const recalculatePredictions = useCallback(async (appointmentId?: string) => {
    try {
      const response = await fetch('/api/sales/prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recalculate',
          appointmentId,
          forceRecalculate: true
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to recalculate predictions');
      }

      // データを再取得
      await fetchAllData();
      
      return result.data;
    } catch (error) {
      console.error('Failed to recalculate predictions:', error);
      throw error;
    }
  }, [fetchAllData]);

  // フォローアップアクションを実行
  const executeFollowUpAction = useCallback(async (suggestionId: string) => {
    try {
      const response = await fetch('/api/sales/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          suggestionId
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to execute follow-up action');
      }

      // 提案リストを更新
      setFollowUpSuggestions(prev => 
        prev.filter(suggestion => suggestion.id !== suggestionId)
      );

      return result.data;
    } catch (error) {
      console.error('Failed to execute follow-up action:', error);
      throw error;
    }
  }, []);

  // 初回データ取得
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // 成約確率に基づく色分け
  const getProbabilityColor = useCallback((probability: number) => {
    if (probability >= 80) return { text: 'text-green-600', bg: 'bg-green-500' };
    if (probability >= 60) return { text: 'text-yellow-600', bg: 'bg-yellow-500' };
    return { text: 'text-red-600', bg: 'bg-red-500' };
  }, []);

  // 優先度に基づく色分け
  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  return {
    // データ
    analyticsData,
    followUpSuggestions,
    loading,
    error,
    lastRefresh,
    
    // アクション
    refreshData: fetchAllData,
    recalculatePredictions,
    executeFollowUpAction,
    
    // ユーティリティ
    getProbabilityColor,
    getPriorityColor,
  };
};