import { useState, useCallback } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useDemoMode } from '@/hooks/useDemoMode';
import { UserResourceProfile, USER_TYPE_PRESETS } from '@/types/resource-profile';

interface ScheduledTask {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  type: 'task' | 'meeting' | 'break' | 'focus';
  priority: 'high' | 'medium' | 'low';
  estimatedProductivity: number;
  weight?: number;
  canBeSplit?: boolean;
  splitInfo?: {
    partNumber: number;
    totalParts: number;
    originalTaskId: string;
  };
}

interface ResourceScheduleResult {
  schedule: ScheduledTask[];
  metadata: {
    totalTasks: number;
    scheduledTasks: number;
    estimatedProductivity: number;
    isDemoMode: boolean;
    totalWeight: number;
    capacityUtilization: number;
    message?: string;
  };
  futurePrediction: {
    weeklyCapacity: Array<{
      week: number;
      capacityStatus: 'low' | 'medium' | 'high' | 'overload';
      estimatedWorkload: number;
    }>;
    riskAlerts: string[];
    recommendations: string[];
  };
  userProfile: UserResourceProfile;
  date: string;
  generatedAt: string;
}

interface ResourceSchedulePreferences {
  workStartTime?: string;
  workEndTime?: string;
  lunchTime?: string;
  focusBlocks?: boolean;
  breakInterval?: number;
  personalityType?: 'morning' | 'afternoon' | 'balanced';
  userProfile?: Partial<UserResourceProfile>;
}

export function useResourceScheduleGenerator() {
  const { tasks } = useTasks();
  const { events } = useCalendarEvents();
  const { getTasksWithDemo, getEventsWithDemo, getPreferencesWithDemo } = useDemoMode();
  
  const [generatedSchedule, setGeneratedSchedule] = useState<ResourceScheduleResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateResourceSchedule = useCallback(async (
    customPreferences?: ResourceSchedulePreferences
  ) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // データ準備
      const pendingTasks = tasks.filter(task => 
        task.status !== 'COMPLETE' && 
        (!task.dueDate || new Date(task.dueDate) >= new Date())
      );
      
      const today = new Date().toISOString().split('T')[0];
      const todayEvents = events.filter(event => 
        new Date(event.startTime).toDateString() === new Date().toDateString()
      );

      // デモモード対応
      const tasksToUse = getTasksWithDemo(pendingTasks);
      const eventsToUse = getEventsWithDemo(todayEvents);
      
      // デフォルト設定
      const defaultPreferences = {
        workStartTime: '09:00',
        workEndTime: '18:00',
        lunchTime: '12:00',
        focusBlocks: true,
        breakInterval: 90,
        personalityType: 'balanced' as const,
        userProfile: {
          ...USER_TYPE_PRESETS.employee
        }
      };
      
      const preferencesToUse = getPreferencesWithDemo({
        ...defaultPreferences,
        ...customPreferences
      });

      // API呼び出し
      const response = await fetch('/api/ai/resource-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: tasksToUse,
          events: eventsToUse,
          userProfile: preferencesToUse.userProfile,
          preferences: {
            workStartTime: preferencesToUse.workStartTime,
            workEndTime: preferencesToUse.workEndTime,
            lunchTime: preferencesToUse.lunchTime,
            focusBlocks: preferencesToUse.focusBlocks,
            breakInterval: preferencesToUse.breakInterval,
            personalityType: preferencesToUse.personalityType
          },
          date: today
        })
      });

      if (response.ok) {
        const result = await response.json();
        setGeneratedSchedule(result);
        return result;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'リソースベーススケジュール生成に失敗しました');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'リソースベーススケジュール生成中にエラーが発生しました';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [tasks, events, getTasksWithDemo, getEventsWithDemo, getPreferencesWithDemo]);

  const clearSchedule = useCallback(() => {
    setGeneratedSchedule(null);
    setError(null);
  }, []);

  // 容量分析ヘルパー
  const getCapacityAnalysis = useCallback(() => {
    if (!generatedSchedule) return null;
    
    const { metadata, futurePrediction } = generatedSchedule;
    
    return {
      currentUtilization: metadata.capacityUtilization,
      utilizationStatus: metadata.capacityUtilization >= 1.0 ? 'overload' :
                        metadata.capacityUtilization >= 0.8 ? 'high' :
                        metadata.capacityUtilization >= 0.5 ? 'medium' : 'low',
      totalWeight: metadata.totalWeight,
      weeklyOutlook: futurePrediction.weeklyCapacity,
      risks: futurePrediction.riskAlerts,
      recommendations: futurePrediction.recommendations
    };
  }, [generatedSchedule]);

  // ユーザープロファイル分析
  const getUserProfileSummary = useCallback(() => {
    if (!generatedSchedule) return null;
    
    const profile = generatedSchedule.userProfile;
    return {
      userType: profile.userType,
      dailyCapacity: profile.dailyCapacity,
      timeConstraints: profile.timeConstraints,
      workingPattern: profile.workingPattern,
      commitmentRatio: profile.commitmentRatio
    };
  }, [generatedSchedule]);

  // スケジュール統計
  const getScheduleStats = useCallback(() => {
    if (!generatedSchedule) return null;
    
    const schedule = generatedSchedule.schedule;
    
    const tasksByType = schedule.reduce((acc, task) => {
      acc[task.type] = (acc[task.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const weightDistribution = schedule
      .filter(task => task.weight)
      .reduce((acc, task) => {
        const weight = task.weight!;
        if (weight <= 3) acc.light++;
        else if (weight <= 6) acc.medium++;
        else acc.heavy++;
        return acc;
      }, { light: 0, medium: 0, heavy: 0 });
    
    const splitTasks = schedule.filter(task => task.splitInfo).length;
    
    return {
      totalScheduledItems: schedule.length,
      tasksByType,
      weightDistribution,
      splitTasks,
      averageProductivity: generatedSchedule.metadata.estimatedProductivity
    };
  }, [generatedSchedule]);

  return {
    // Core functionality
    generatedSchedule,
    generateResourceSchedule,
    clearSchedule,
    isGenerating,
    error,
    
    // Analysis helpers
    getCapacityAnalysis,
    getUserProfileSummary,
    getScheduleStats,
    
    // Compatibility with existing useScheduleGenerator
    generateSchedule: generateResourceSchedule,
    schedule: generatedSchedule?.schedule || null,
    metadata: generatedSchedule?.metadata || null
  };
}