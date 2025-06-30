// Phase 2: MBTI Analysis Hook
// MBTI個人最適化システム用カスタムフック

import { useState, useCallback, useEffect } from 'react';

export interface MBTIType {
  code: string;
  name: string;
  category: string;
  population_percentage: number;
  dimensions: {
    extraversion: number; // 0 = Introversion, 1 = Extraversion
    sensing: number; // 0 = Intuition, 1 = Sensing
    thinking: number; // 0 = Feeling, 1 = Thinking
    judging: number; // 0 = Perceiving, 1 = Judging
  };
  core_traits: {
    independence: number;
    strategic_thinking: number;
    perfectionism: number;
    innovation: number;
    focus: number;
    leadership: number;
    social_skills: number;
    adaptability: number;
    detail_orientation: number;
    team_collaboration: number;
  };
  strengths: string[];
  weaknesses: string[];
  optimal_roles: string[];
  task_preferences: Record<string, number>;
  communication_style: {
    preferred_meeting_style: string;
    feedback_preference: string;
    conflict_resolution: string;
    decision_making: string;
  };
  work_environment: {
    noise_tolerance: number;
    structure_preference: number;
    autonomy_need: number;
    social_interaction_preference: number;
  };
}

export interface UserMBTIProfile {
  userId: string;
  userName: string;
  email: string;
  mbtiType: string;
  assessmentDate: Date;
  confidence: number; // 診断の信頼度 (0-100)
  customTraits?: Partial<MBTIType['core_traits']>; // ユーザー固有の調整
  taskHistory: TaskPerformance[];
  collaborationHistory: CollaborationRecord[];
}

export interface TaskPerformance {
  taskId: string;
  taskType: string;
  completed: boolean;
  timeSpent: number; // 時間(分)
  qualityScore: number; // 1-10
  difficultyLevel: number; // 1-10
  collaborationRequired: boolean;
  completionDate: Date;
  feedback?: string;
}

export interface CollaborationRecord {
  projectId: string;
  partnerUserId: string;
  partnerMBTI: string;
  duration: number; // 日数
  successRating: number; // 1-10
  communicationRating: number; // 1-10
  conflictResolution: number; // 1-10
  productivityRating: number; // 1-10
  feedback?: string;
}

export interface TeamCompatibility {
  teamMembers: {
    userId: string;
    userName: string;
    mbtiType: string;
  }[];
  compatibilityScore: number; // 0-100
  strengthAreas: string[];
  riskAreas: string[];
  recommendations: string[];
  communicationMatrix: Record<string, Record<string, number>>; // user pairs -> compatibility
}

export interface PersonalizedRecommendation {
  userId: string;
  recommendationType: 'task' | 'role' | 'collaboration' | 'environment' | 'development';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  expectedImpact: string;
  actionItems: string[];
  timeframe: string;
  successMetrics: string[];
}

export interface PerformancePrediction {
  taskType: string;
  predictedSuccess: number; // 0-100
  predictedTime: number; // 時間(分)
  confidenceLevel: number; // 0-100
  factors: {
    mbtiAlignment: number;
    pastPerformance: number;
    taskComplexity: number;
    currentWorkload: number;
  };
  recommendations: string[];
}

export const useMBTIAnalysis = () => {
  const [mbtiTypes, setMbtiTypes] = useState<Record<string, MBTIType>>({});
  const [userProfiles, setUserProfiles] = useState<UserMBTIProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [teamCompatibility, setTeamCompatibility] = useState<TeamCompatibility | null>(null);
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>([]);
  const [performancePredictions, setPerformancePredictions] = useState<PerformancePrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // MBTI基本データの取得
  const fetchMBTITypes = useCallback(async () => {
    try {
      const response = await fetch('/data/mbti.json');
      if (!response.ok) throw new Error('MBTIデータの取得に失敗しました');
      const data = await response.json();
      setMbtiTypes(data.mbti_types || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  }, []);

  // ユーザーMBTIプロファイルの取得
  const fetchUserProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mbti/profiles');
      if (!response.ok) throw new Error('ユーザープロファイルの取得に失敗しました');
      const data = await response.json();
      setUserProfiles(data.profiles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, []);

  // 個人分析の取得
  const fetchIndividualAnalysis = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/mbti/individual/${userId}`);
      if (!response.ok) throw new Error('個人分析の取得に失敗しました');
      const data = await response.json();
      
      setRecommendations(data.recommendations || []);
      setPerformancePredictions(data.predictions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  }, []);

  // チーム相性分析の取得
  const fetchTeamCompatibility = useCallback(async (userIds: string[]) => {
    try {
      setLoading(true);
      const response = await fetch('/api/mbti/compatibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userIds })
      });
      
      if (!response.ok) throw new Error('チーム相性分析に失敗しました');
      const data = await response.json();
      setTeamCompatibility(data.compatibility);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, []);

  // パフォーマンス最適化の実行
  const runOptimization = useCallback(async (userId: string, taskType?: string) => {
    try {
      const response = await fetch('/api/mbti/optimization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, taskType })
      });
      
      if (!response.ok) throw new Error('最適化分析に失敗しました');
      const data = await response.json();
      
      setRecommendations(data.recommendations || []);
      setPerformancePredictions(data.predictions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  }, []);

  // MBTIタイプ互換性の計算
  const calculateTypeCompatibility = useCallback((type1: string, type2: string): number => {
    if (!mbtiTypes[type1] || !mbtiTypes[type2]) return 50;

    const dims1 = mbtiTypes[type1].dimensions;
    const dims2 = mbtiTypes[type2].dimensions;

    // 次元ごとの互換性計算
    const compatibility = {
      extraversionAlignment: Math.abs(dims1.extraversion - dims2.extraversion) === 0 ? 100 : 60,
      sensingAlignment: Math.abs(dims1.sensing - dims2.sensing) === 0 ? 80 : 70,
      thinkingAlignment: Math.abs(dims1.thinking - dims2.thinking) === 0 ? 90 : 65,
      judgingAlignment: Math.abs(dims1.judging - dims2.judging) === 0 ? 85 : 75
    };

    // 重み付き平均
    const weights = { extraversionAlignment: 0.2, sensingAlignment: 0.3, thinkingAlignment: 0.3, judgingAlignment: 0.2 };
    const totalScore = Object.entries(compatibility).reduce((sum, [key, value]) => {
      return sum + (value * weights[key as keyof typeof weights]);
    }, 0);

    return Math.round(totalScore);
  }, [mbtiTypes]);

  // 選択されたユーザーの詳細プロファイル
  const selectedUserProfile = selectedUserId ? userProfiles.find(p => p.userId === selectedUserId) : null;
  const selectedUserMBTI = selectedUserProfile ? mbtiTypes[selectedUserProfile.mbtiType] : null;

  // 統計データ
  const stats = {
    totalUsers: userProfiles.length,
    mbtiDistribution: userProfiles.reduce((acc, profile) => {
      acc[profile.mbtiType] = (acc[profile.mbtiType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    averageTaskPerformance: userProfiles.reduce((sum, profile) => {
      const avgPerformance = profile.taskHistory.reduce((taskSum, task) => taskSum + task.qualityScore, 0) / (profile.taskHistory.length || 1);
      return sum + avgPerformance;
    }, 0) / (userProfiles.length || 1),
    collaborationSuccessRate: userProfiles.reduce((sum, profile) => {
      const avgSuccess = profile.collaborationHistory.reduce((collabSum, collab) => collabSum + collab.successRating, 0) / (profile.collaborationHistory.length || 1);
      return sum + avgSuccess;
    }, 0) / (userProfiles.length || 1)
  };

  // 初期データ取得
  useEffect(() => {
    Promise.all([fetchMBTITypes(), fetchUserProfiles()]);
  }, [fetchMBTITypes, fetchUserProfiles]);

  // 選択されたユーザーの分析データ取得
  useEffect(() => {
    if (selectedUserId) {
      fetchIndividualAnalysis(selectedUserId);
    }
  }, [selectedUserId, fetchIndividualAnalysis]);

  return {
    // データ
    mbtiTypes,
    userProfiles,
    selectedUserProfile,
    selectedUserMBTI,
    teamCompatibility,
    recommendations,
    performancePredictions,
    stats,

    // 状態
    loading,
    error,
    selectedUserId,

    // アクション
    setSelectedUserId,
    fetchUserProfiles,
    fetchIndividualAnalysis,
    fetchTeamCompatibility,
    runOptimization,
    calculateTypeCompatibility,

    // ヘルパー関数
    getMBTITypeInfo: (typeCode: string) => mbtiTypes[typeCode],
    getUserProfile: (userId: string) => userProfiles.find(p => p.userId === userId),
    getRecommendationsByType: (type: PersonalizedRecommendation['recommendationType']) => 
      recommendations.filter(r => r.recommendationType === type),
    
    // 集計データ
    totalProfiles: userProfiles.length,
    highPerformanceUsers: userProfiles.filter(p => 
      p.taskHistory.reduce((sum, t) => sum + t.qualityScore, 0) / (p.taskHistory.length || 1) >= 8
    ).length,
    activeRecommendations: recommendations.filter(r => r.priority === 'high').length
  };
};