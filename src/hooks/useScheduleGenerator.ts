import { useState, useCallback } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useDemoMode } from '@/hooks/useDemoMode';

interface ScheduleBlock {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  type: 'task' | 'meeting' | 'break' | 'focus';
  priority: 'high' | 'medium' | 'low';
  estimatedProductivity: number;
}

interface ScheduleGenerationResult {
  schedule: ScheduleBlock[];
  metadata: {
    totalTasks: number;
    scheduledTasks: number;
    estimatedProductivity: number;
    isDemoMode: boolean;
  };
  generatedAt: Date;
}

export function useScheduleGenerator() {
  const { tasks } = useTasks();
  const { events } = useCalendarEvents();
  const { getTasksWithDemo, getEventsWithDemo, getPreferencesWithDemo } = useDemoMode();
  
  const [generatedSchedule, setGeneratedSchedule] = useState<ScheduleGenerationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSchedule = useCallback(async (customPreferences?: any) => {
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
      const preferencesToUse = getPreferencesWithDemo(customPreferences || {
        workStartTime: '09:00',
        workEndTime: '18:00',
        lunchTime: '12:00',
        focusBlocks: true,
        breakInterval: 90,
        personalityType: 'balanced'
      });

      // API呼び出し
      const response = await fetch('/api/ai/generate-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: tasksToUse,
          events: eventsToUse,
          preferences: preferencesToUse,
          date: today
        })
      });

      if (response.ok) {
        const result = await response.json();
        const scheduleResult: ScheduleGenerationResult = {
          schedule: result.schedule,
          metadata: result.metadata,
          generatedAt: new Date()
        };
        
        setGeneratedSchedule(scheduleResult);
        return scheduleResult;
      } else {
        throw new Error('スケジュール生成に失敗しました');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'スケジュール生成中にエラーが発生しました';
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

  return {
    generatedSchedule,
    generateSchedule,
    clearSchedule,
    isGenerating,
    error
  };
}