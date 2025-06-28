// Phase 2: Knowledge Automation Hook
// ナレッジ自動化機能用カスタムフック

import { useState, useCallback, useEffect } from 'react';

export interface KnowledgeAutomationHistory {
  id: string;
  taskId: string;
  taskTitle: string;
  decision: {
    shouldGenerate: boolean;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    suggestedTitle: string;
    estimatedValue: number;
  };
  generatedKnowledge?: {
    id: string;
    title: string;
    valueScore: number;
    confidence: number;
  };
  processingTime: number;
  createdAt: Date;
}

export interface KnowledgeAutomationStats {
  totalProcessedTasks: number;
  generatedKnowledgeCount: number;
  averageQualityScore: number;
  automationRate: number; // 自動化された割合
  timesSaved: number; // 節約時間（分）
}

export interface TaskCompletionNotification {
  id: string;
  taskId: string;
  taskTitle: string;
  shouldGenerate: boolean;
  suggestedTitle?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedValue?: number;
  isProcessing: boolean;
  createdAt: Date;
}

export const useKnowledgeAutomation = () => {
  const [history, setHistory] = useState<KnowledgeAutomationHistory[]>([]);
  const [stats, setStats] = useState<KnowledgeAutomationStats>({
    totalProcessedTasks: 0,
    generatedKnowledgeCount: 0,
    averageQualityScore: 0,
    automationRate: 0,
    timesSaved: 0
  });
  const [notifications, setNotifications] = useState<TaskCompletionNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 自動化履歴を取得
  const fetchAutomationHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/knowledge-automation');
      if (!response.ok) {
        throw new Error('Failed to fetch automation history');
      }
      const data = await response.json();
      
      // 実際のAPIレスポンスに合わせて調整
      setHistory(data.history || []);
      setStats(data.stats || stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  // タスク完了時のナレッジ自動化処理
  const processTaskCompletion = useCallback(async (taskCompletionData: {
    taskId: string;
    completionData: {
      deliverables?: string;
      issues?: string;
      solutions?: string;
      lessonsLearned?: string;
      timeSpent: number;
      difficultyActual: number;
    };
  }) => {
    try {
      // 通知を追加
      const notification: TaskCompletionNotification = {
        id: Date.now().toString(),
        taskId: taskCompletionData.taskId,
        taskTitle: `タスク ${taskCompletionData.taskId}`,
        shouldGenerate: false,
        isProcessing: true,
        createdAt: new Date()
      };
      
      setNotifications(prev => [notification, ...prev]);

      const response = await fetch('/api/knowledge-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'processTaskCompletion',
          ...taskCompletionData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process task completion');
      }

      const result = await response.json();
      
      // 通知を更新
      setNotifications(prev => prev.map(n => 
        n.id === notification.id ? {
          ...n,
          shouldGenerate: result.data.decision.shouldGenerate,
          suggestedTitle: result.data.decision.suggestedTitle,
          priority: result.data.decision.priority,
          estimatedValue: result.data.decision.estimatedValue,
          isProcessing: false
        } : n
      ));

      // 履歴を更新
      await fetchAutomationHistory();

      return result.data;
    } catch (error) {
      console.error('Task completion processing failed:', error);
      
      // エラー時は通知を削除
      setNotifications(prev => prev.filter(n => n.taskId !== taskCompletionData.taskId));
      
      throw error;
    }
  }, [fetchAutomationHistory]);

  // ナレッジ品質評価
  const evaluateKnowledgeQuality = useCallback(async (knowledgeId: string) => {
    try {
      const response = await fetch('/api/knowledge-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluateKnowledgeQuality',
          knowledgeId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to evaluate knowledge quality');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Knowledge quality evaluation failed:', error);
      throw error;
    }
  }, []);

  // 通知をクリア
  const clearNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // 全通知をクリア
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // 自動化設定の更新
  const updateAutomationSettings = useCallback(async (settings: {
    autoGenerateEnabled: boolean;
    minimumValueThreshold: number;
    priorityFilter: ('HIGH' | 'MEDIUM' | 'LOW')[];
  }) => {
    try {
      const response = await fetch('/api/knowledge-automation/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Failed to update automation settings');
      }

      return await response.json();
    } catch (error) {
      console.error('Automation settings update failed:', error);
      throw error;
    }
  }, []);

  // 重複ナレッジ統合
  const mergeDuplicateKnowledge = useCallback(async (knowledgeIds: string[], mergeSettings: {
    title: string;
    category: string;
    content: string;
    tags: string[];
  }) => {
    try {
      const response = await fetch('/api/knowledge-automation/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          knowledgeIds,
          mergeSettings
        })
      });

      if (!response.ok) {
        throw new Error('Failed to merge duplicate knowledge');
      }

      const result = await response.json();
      
      // 履歴を更新
      await fetchAutomationHistory();
      
      return result.data;
    } catch (error) {
      console.error('Knowledge merge failed:', error);
      throw error;
    }
  }, [fetchAutomationHistory]);

  // 初期データ取得
  useEffect(() => {
    fetchAutomationHistory();
  }, [fetchAutomationHistory]);

  return {
    // データ
    history,
    stats,
    notifications,
    loading,
    error,
    
    // アクション
    processTaskCompletion,
    evaluateKnowledgeQuality,
    clearNotification,
    clearAllNotifications,
    updateAutomationSettings,
    mergeDuplicateKnowledge,
    refetch: fetchAutomationHistory
  };
};