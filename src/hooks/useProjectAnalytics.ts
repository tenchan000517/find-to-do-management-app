import { useState, useEffect, useCallback } from 'react';

interface ProjectSuccessFactor {
  factor: string;
  impact: number;
  current: number;
  optimal: number;
  actionable: boolean;
}

interface RiskAssessment {
  technicalRisk: number;
  scheduleRisk: number;
  resourceRisk: number;
  stakeholderRisk: number;
  overallRisk: number;
}

interface ImprovementRecommendation {
  area: string;
  recommendation: string;
  expectedImpact: number;
  implementationEffort: 'LOW' | 'MEDIUM' | 'HIGH';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface ProjectAnalytics {
  projectId: string;
  successProbability: number;
  confidenceLevel: number;
  successFactors: ProjectSuccessFactor[];
  riskAssessment: RiskAssessment;
  improvementRecommendations: ImprovementRecommendation[];
  benchmarkComparison: {
    similarProjects: number;
    industryAverage: number;
    performanceRanking: string;
  };
  lastUpdated: string;
}

interface KGIData {
  target: {
    value: number;
    unit: string;
  };
  currentAchievement: number;
  projectedFinalAchievement: number;
  minimumTarget: number;
  timeline: Array<{
    month: string;
    target: number;
    actual?: number;
  }>;
  predictions: Array<{
    month: string;
    achievementRate: number;
  }>;
}

interface ProjectHealthAlert {
  level: 'WARNING' | 'CRITICAL';
  message: string;
  actionRequired: string;
}

interface ProjectHealth {
  score: number;
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  alerts: ProjectHealthAlert[];
}

export const useProjectAnalytics = (projectId: string) => {
  const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null);
  const [kgiData, setKgiData] = useState<KGIData | null>(null);
  const [projectHealth, setProjectHealth] = useState<ProjectHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // プロジェクト成功分析データを取得
  const fetchProjectAnalytics = useCallback(async () => {
    try {
      const response = await fetch(`/api/analytics/project-success?projectId=${projectId}&type=predict`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch project analytics');
      }
      
      return result.data;
    } catch (error) {
      console.error('Failed to fetch project analytics:', error);
      throw error;
    }
  }, [projectId]);

  // KGIデータを取得
  const fetchKGIData = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/kgi`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch KGI data');
      }
      
      return result.data;
    } catch (error) {
      console.error('Failed to fetch KGI data:', error);
      throw error;
    }
  }, [projectId]);

  // プロジェクト健全性データを取得
  const fetchProjectHealth = useCallback(async () => {
    try {
      const response = await fetch(`/api/analytics/project-success?projectId=${projectId}&type=monitor`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch project health');
      }
      
      return result.data;
    } catch (error) {
      console.error('Failed to fetch project health:', error);
      throw error;
    }
  }, [projectId]);

  // 全データを取得
  const fetchAllData = useCallback(async () => {
    if (!projectId) {
      setError('Project ID is required');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const [analyticsData, kgiResponse, healthData] = await Promise.all([
        fetchProjectAnalytics(),
        fetchKGIData(),
        fetchProjectHealth(),
      ]);

      setAnalytics(analyticsData);
      setKgiData(kgiResponse);
      setProjectHealth(healthData?.currentHealth || null);
      setLastRefresh(new Date());
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      console.error('Failed to fetch project analytics data:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, fetchProjectAnalytics, fetchKGIData, fetchProjectHealth]);

  // 分析を再実行
  const recalculateAnalytics = useCallback(async () => {
    try {
      const response = await fetch(`/api/analytics/project-success`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recalculate',
          projectId,
          forceRecalculate: true
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to recalculate analytics');
      }

      // データを再取得
      await fetchAllData();
      
      return result.data;
    } catch (error) {
      console.error('Failed to recalculate project analytics:', error);
      throw error;
    }
  }, [projectId, fetchAllData]);

  // 改善提案を適用
  const applyRecommendation = useCallback(async (recommendationId: string) => {
    try {
      const response = await fetch(`/api/analytics/project-success`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'applyRecommendation',
          projectId,
          recommendationId
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to apply recommendation');
      }

      // 分析データを再取得
      await fetchAllData();
      
      return result.data;
    } catch (error) {
      console.error('Failed to apply recommendation:', error);
      throw error;
    }
  }, [projectId, fetchAllData]);

  // 初回データ取得
  useEffect(() => {
    if (projectId) {
      fetchAllData();
    }
  }, [projectId, fetchAllData]);

  // 成功確率に基づく色分け
  const getSuccessProbabilityColor = useCallback((probability: number) => {
    if (probability >= 0.8) return { 
      text: 'text-green-600', 
      bg: 'bg-green-100', 
      border: 'border-green-500',
      label: '高確率'
    };
    if (probability >= 0.6) return { 
      text: 'text-yellow-600', 
      bg: 'bg-yellow-100', 
      border: 'border-yellow-500',
      label: '中確率'
    };
    return { 
      text: 'text-red-600', 
      bg: 'bg-red-100', 
      border: 'border-red-500',
      label: '低確率'
    };
  }, []);

  // リスクレベルに基づく色分け
  const getRiskLevelColor = useCallback((riskLevel: number) => {
    if (riskLevel >= 0.7) return { 
      text: 'text-red-600', 
      bg: 'bg-red-100', 
      border: 'border-red-500',
      label: '高リスク'
    };
    if (riskLevel >= 0.4) return { 
      text: 'text-yellow-600', 
      bg: 'bg-yellow-100', 
      border: 'border-yellow-500',
      label: '中リスク'
    };
    return { 
      text: 'text-green-600', 
      bg: 'bg-green-100', 
      border: 'border-green-500',
      label: '低リスク'
    };
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
    analytics,
    kgiData,
    projectHealth,
    loading,
    error,
    lastRefresh,
    
    // アクション
    refreshData: fetchAllData,
    recalculateAnalytics,
    applyRecommendation,
    
    // ユーティリティ
    getSuccessProbabilityColor,
    getRiskLevelColor,
    getPriorityColor,
  };
};