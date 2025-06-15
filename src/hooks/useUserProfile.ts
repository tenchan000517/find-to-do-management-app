'use client';

import { useState, useCallback } from 'react';
import { User, UserSkills, UserPreferences, WorkStyle } from '@/lib/types';

export function useUserProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveUserProfile = useCallback(async (
    userId: string, 
    profile: { skills?: UserSkills; preferences?: UserPreferences; workStyle?: WorkStyle }
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${userId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }

      // AI再評価をトリガー
      await triggerAIReevaluation(userId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerAIReevaluation = async (userId: string): Promise<void> => {
    try {
      // ユーザーのタスクを取得してAI再評価
      const tasksResponse = await fetch(`/api/tasks?userId=${userId}`);
      if (tasksResponse.ok) {
        const tasks = await tasksResponse.json();
        
        // 各タスクのリソースウェイトを再計算
        for (const task of tasks) {
          await fetch('/api/ai/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              entityType: 'task',
              entityId: task.id,
              evaluationType: 'resource_weight'
            })
          });
        }
      }
    } catch (error) {
      console.error('AI re-evaluation failed:', error);
      // エラーでも処理は継続
    }
  };

  return {
    saveUserProfile,
    loading,
    error
  };
}