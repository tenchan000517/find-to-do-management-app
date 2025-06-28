"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, Zap, Settings, RefreshCw } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';

interface ScheduleBlock {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  type: 'task' | 'meeting' | 'break' | 'focus';
  priority: 'high' | 'medium' | 'low';
  estimatedProductivity: number;
}

interface AutoSchedulerProps {
  onScheduleGenerated?: (schedule: ScheduleBlock[]) => void;
  className?: string;
}

export default function AutoScheduler({ onScheduleGenerated, className }: AutoSchedulerProps) {
  const { tasks } = useTasks();
  const { events } = useCalendarEvents();
  
  const [todaySchedule, setTodaySchedule] = useState<ScheduleBlock[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userPreferences, setUserPreferences] = useState({
    workStartTime: '09:00',
    workEndTime: '18:00',
    lunchTime: '12:00',
    focusBlocks: true,
    breakInterval: 90, // minutes
    personalityType: 'balanced' // morning, afternoon, balanced
  });
  const [scheduleGenerated, setScheduleGenerated] = useState(false);

  useEffect(() => {
    // Auto-generate schedule at 7 AM or when component loads
    const now = new Date();
    const hour = now.getHours();
    
    // Auto-generate if it's morning or no schedule exists
    if (hour === 7 || (!scheduleGenerated && todaySchedule.length === 0)) {
      generateOptimalSchedule();
    }
  }, []);

  const generateOptimalSchedule = async () => {
    setIsGenerating(true);
    
    try {
      // Get today's existing commitments
      const today = new Date().toISOString().split('T')[0];
      const todayEvents = events.filter(event => 
        new Date(event.startTime).toDateString() === new Date().toDateString()
      );

      // Get pending tasks
      const pendingTasks = tasks.filter(task => 
        task.status !== 'COMPLETE' && 
        (!task.dueDate || new Date(task.dueDate) >= new Date())
      );

      // Call AI scheduling API
      const response = await fetch('/api/ai/generate-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: pendingTasks,
          events: todayEvents,
          preferences: userPreferences,
          date: today
        })
      });

      if (response.ok) {
        const result = await response.json();
        setTodaySchedule(result.schedule);
        setScheduleGenerated(true);
        
        if (onScheduleGenerated) {
          onScheduleGenerated(result.schedule);
        }
      } else {
        // Fallback to local scheduling
        const fallbackSchedule = generateFallbackSchedule(pendingTasks, todayEvents);
        setTodaySchedule(fallbackSchedule);
        setScheduleGenerated(true);
      }
    } catch (error) {
      console.error('Schedule generation error:', error);
      // Generate fallback schedule
      const fallbackSchedule = generateFallbackSchedule(tasks, events);
      setTodaySchedule(fallbackSchedule);
      setScheduleGenerated(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFallbackSchedule = (pendingTasks: any[], todayEvents: any[]): ScheduleBlock[] => {
    const schedule: ScheduleBlock[] = [];
    const workStart = parseTime(userPreferences.workStartTime);
    const workEnd = parseTime(userPreferences.workEndTime);
    const lunchTime = parseTime(userPreferences.lunchTime);
    
    let currentTime = workStart;
    
    // Add existing meetings first
    todayEvents.forEach(event => {
      const startTime = new Date(event.startTime).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      const endTime = new Date(event.endTime || new Date(new Date(event.startTime).getTime() + 60*60*1000)).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      schedule.push({
        id: `meeting-${event.id}`,
        startTime,
        endTime,
        title: event.title,
        type: 'meeting',
        priority: 'high',
        estimatedProductivity: 85
      });
    });

    // Sort tasks by priority and deadline
    const sortedTasks = [...pendingTasks].sort((a, b) => {
      const priorityScore = (task: any) => {
        if (task.priority === 'HIGH') return 3;
        if (task.priority === 'MEDIUM') return 2;
        return 1;
      };
      
      const deadlineScore = (task: any) => {
        if (!task.dueDate) return 0;
        const days = Math.floor((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(0, 7 - days); // Higher score for closer deadlines
      };
      
      return (priorityScore(b) + deadlineScore(b)) - (priorityScore(a) + deadlineScore(a));
    });

    // Schedule tasks in optimal time slots
    let timeSlotIndex = 0;
    const timeSlots = getOptimalTimeSlots(workStart, workEnd, lunchTime);
    
    sortedTasks.slice(0, 6).forEach((task, index) => {
      if (timeSlotIndex >= timeSlots.length) return;
      
      const timeSlot = timeSlots[timeSlotIndex];
      const estimatedHours = task.estimatedHours || 1;
      const endTime = addMinutes(timeSlot.start, estimatedHours * 60);
      
      schedule.push({
        id: `task-${task.id}`,
        startTime: timeSlot.start,
        endTime: endTime,
        title: task.title,
        type: 'task',
        priority: task.priority?.toLowerCase() || 'medium',
        estimatedProductivity: timeSlot.productivity
      });
      
      timeSlotIndex++;
      
      // Add breaks between long tasks
      if (estimatedHours > 1.5 && timeSlotIndex < timeSlots.length) {
        const breakSlot = timeSlots[timeSlotIndex];
        schedule.push({
          id: `break-${index}`,
          startTime: endTime,
          endTime: addMinutes(endTime, 15),
          title: '休憩',
          type: 'break',
          priority: 'low',
          estimatedProductivity: 0
        });
        timeSlotIndex++;
      }
    });

    return schedule.sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getOptimalTimeSlots = (workStart: string, workEnd: string, lunchTime: string) => {
    const slots = [];
    
    // Morning slots (high productivity)
    slots.push(
      { start: workStart, productivity: 90 },
      { start: addMinutes(workStart, 90), productivity: 85 },
      { start: addMinutes(workStart, 180), productivity: 80 }
    );
    
    // Post-lunch slots (medium productivity)
    const afterLunch = addMinutes(lunchTime, 60);
    slots.push(
      { start: afterLunch, productivity: 75 },
      { start: addMinutes(afterLunch, 90), productivity: 70 },
      { start: addMinutes(afterLunch, 180), productivity: 65 }
    );
    
    return slots;
  };

  const parseTime = (timeStr: string): string => {
    return timeStr;
  };

  const addMinutes = (timeStr: string, minutes: number): string => {
    const [hours, mins] = timeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task': return '📋';
      case 'meeting': return '👥';
      case 'break': return '☕';
      case 'focus': return '🎯';
      default: return '📅';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <Card variant="elevated" padding="normal" className={className}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              今日の最適スケジュール
            </h3>
            <p className="text-sm text-gray-600">
              AIが生産性を最大化する順序で自動配置
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={generateOptimalSchedule}
              disabled={isGenerating}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? '生成中...' : '再生成'}
            </Button>
          </div>
        </div>

        {/* Schedule Generation Status */}
        {isGenerating && (
          <div className="text-center py-4">
            <div className="animate-pulse text-blue-600 font-medium">
              🤖 AIが最適なスケジュールを計算中...
            </div>
            <div className="text-sm text-gray-500 mt-1">
              タスクの優先度、期限、あなたの生産性パターンを分析しています
            </div>
          </div>
        )}

        {/* Generated Schedule */}
        {todaySchedule.length > 0 && !isGenerating && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">
                {new Date().toLocaleDateString('ja-JP', { 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'short'
                })}のスケジュール
              </h4>
              <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded">
                ✓ 最適化済み
              </span>
            </div>
            
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {todaySchedule.map((block, index) => (
                <div
                  key={block.id}
                  className={`p-3 border-l-4 rounded-r-lg ${getPriorityColor(block.priority)} hover:shadow-sm transition-shadow`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getTypeIcon(block.type)}</span>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {block.title}
                        </p>
                        <p className="text-xs text-gray-600">
                          {block.startTime} - {block.endTime}
                          {block.estimatedProductivity > 0 && (
                            <span className="ml-2 text-blue-600">
                              生産性 {block.estimatedProductivity}%
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        block.priority === 'high' ? 'bg-red-100 text-red-700' :
                        block.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {block.priority === 'high' ? '高' : 
                         block.priority === 'medium' ? '中' : '低'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Schedule Summary */}
            <div className="grid grid-cols-3 gap-4 pt-3 border-t">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {todaySchedule.filter(b => b.type === 'task').length}
                </div>
                <div className="text-xs text-gray-600">タスク</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {todaySchedule.filter(b => b.type === 'meeting').length}
                </div>
                <div className="text-xs text-gray-600">会議</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  {Math.round(todaySchedule.reduce((sum, b) => sum + b.estimatedProductivity, 0) / todaySchedule.length)}%
                </div>
                <div className="text-xs text-gray-600">平均生産性</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => window.open('/calendar', '_blank')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                カレンダーに反映
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => alert('スケジュール設定機能は開発中です')}
              >
                <Settings className="w-4 h-4 mr-2" />
                設定
              </Button>
            </div>
          </div>
        )}

        {/* No Schedule Message */}
        {todaySchedule.length === 0 && !isGenerating && !scheduleGenerated && (
          <div className="text-center py-6 text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">今日のスケジュールを生成しましょう</p>
            <Button
              onClick={generateOptimalSchedule}
              className="mt-3 bg-blue-500 hover:bg-blue-600 text-white"
            >
              自動スケジュール生成
            </Button>
          </div>
        )}

        {/* AI Features Explanation */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <strong>🤖 AI機能:</strong>
          <ul className="mt-1 space-y-1">
            <li>• 優先度と期限から最適な順序を計算</li>
            <li>• あなたの生産性パターンを学習</li>
            <li>• 集中時間と休憩を自動配置</li>
            <li>• 既存の予定と自動調整</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}