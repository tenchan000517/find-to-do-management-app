"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Mic, Play, ChevronRight, Settings, Zap } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useAppointments } from '@/hooks/useAppointments';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';

interface TodayEssentials {
  urgentTasks: Array<{
    id: string;
    title: string;
    priority: 'high' | 'medium' | 'low';
    timeRemaining: string;
    type: 'task' | 'deadline' | 'meeting';
  }>;
  aiSuggestion: {
    action: string;
    reasoning: string;
    estimatedTime: string;
  };
  productivity: {
    score: number;
    trend: 'up' | 'down' | 'stable';
    message: string;
  };
}

interface SmartDashboardProps {
  showAdvancedFeatures?: boolean;
  onAdvancedToggle?: (show: boolean) => void;
}

export default function SmartDashboard({ showAdvancedFeatures = false, onAdvancedToggle }: SmartDashboardProps) {
  const { tasks, loading: tasksLoading } = useTasks();
  const { projects, loading: projectsLoading } = useProjects();
  const { appointments, loading: appointmentsLoading } = useAppointments();
  const { events, loading: eventsLoading } = useCalendarEvents();
  
  const [todayEssentials, setTodayEssentials] = useState<TodayEssentials | null>(null);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [autoScheduleGenerated, setAutoScheduleGenerated] = useState(false);

  // Calculate today's essentials using AI-like logic
  useEffect(() => {
    if (tasksLoading || projectsLoading || appointmentsLoading || eventsLoading) return;

    const today = new Date();
    const todayString = today.toDateString();
    
    // Get urgent items for today
    const urgentItems = [];
    
    // High priority tasks due today or overdue
    const urgentTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      const isToday = dueDate.toDateString() === todayString;
      const isOverdue = dueDate < today && task.status !== 'COMPLETE';
      const isHighPriority = task.priority === 'A' || task.priority === 'B';
      
      return (isToday || isOverdue) && isHighPriority && task.status !== 'COMPLETE';
    }).map(task => {
      const dueDate = new Date(task.dueDate!);
      const isOverdue = dueDate < today;
      
      return {
        id: task.id,
        title: task.title,
        priority: 'high' as const,
        timeRemaining: isOverdue ? '期限切れ' : '今日まで',
        type: 'task' as const
      };
    });

    // Today's calendar events
    const todayEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === todayString;
    }).map(event => ({
      id: event.id,
      title: event.title,
      priority: 'medium' as const,
      timeRemaining: new Date(event.startTime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      type: 'meeting' as const
    }));

    // Combine and prioritize
    urgentItems.push(...urgentTasks.slice(0, 2));
    urgentItems.push(...todayEvents.slice(0, 2));

    // Generate AI suggestion
    let aiSuggestion = {
      action: "今日のタスクを確認しましょう",
      reasoning: "優先度の高いタスクから開始することをお勧めします",
      estimatedTime: "30分"
    };

    if (urgentTasks.length > 0) {
      aiSuggestion = {
        action: `「${urgentTasks[0].title}」から開始`,
        reasoning: "最も緊急度の高いタスクです",
        estimatedTime: "1-2時間"
      };
    } else if (todayEvents.length > 0) {
      aiSuggestion = {
        action: `次の会議「${todayEvents[0].title}」の準備`,
        reasoning: "今日の重要な予定に備えましょう",
        estimatedTime: "15-30分"
      };
    }

    // Calculate productivity score
    const completedToday = tasks.filter(task => {
      if (task.status !== 'COMPLETE') return false;
      const updatedDate = new Date(task.updatedAt);
      return updatedDate.toDateString() === todayString;
    }).length;

    const productivity = {
      score: Math.min(100, completedToday * 25 + (urgentItems.length === 0 ? 20 : 0)),
      trend: (completedToday > 2 ? 'up' : completedToday > 0 ? 'stable' : 'down') as 'up' | 'down' | 'stable',
      message: completedToday > 2 ? '素晴らしい進捗です！' : 
               completedToday > 0 ? '順調にタスクを進めています' : 
               '今日のタスクを開始しましょう'
    };

    setTodayEssentials({
      urgentTasks: urgentItems,
      aiSuggestion,
      productivity
    });
  }, [tasks, projects, appointments, events, tasksLoading, projectsLoading, appointmentsLoading, eventsLoading]);

  // Voice input simulation
  const handleVoiceInput = async () => {
    setIsVoiceRecording(true);
    
    // Simulate voice processing
    setTimeout(() => {
      setIsVoiceRecording(false);
      // This would integrate with actual speech recognition
      alert('音声入力機能は開発中です。「明日までにA社の資料作成」のような形で話してください。');
    }, 2000);
  };

  // Generate auto schedule
  const generateAutoSchedule = async () => {
    setAutoScheduleGenerated(true);
    // This would call AI scheduling API
    setTimeout(() => {
      alert('今日の最適スケジュールを生成しました！カレンダーで確認してください。');
    }, 1000);
  };

  // Show advanced features based on toggle

  if (!todayEssentials) {
    return (
      <Card variant="elevated" padding="normal" className="animate-pulse">
        <div className="h-64 bg-gray-200 rounded"></div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Smart Card - 今日すべきこと */}
      <Card variant="elevated" padding="normal" className="relative overflow-hidden">
        {/* AI Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
        
        <div className="relative">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Zap className="w-7 h-7 text-yellow-500" />
                今日すべきこと
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                AIが厳選した本日の重要タスク
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                todayEssentials.productivity.trend === 'up' ? 'bg-green-100 text-green-700' :
                todayEssentials.productivity.trend === 'stable' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {todayEssentials.productivity.message}
              </div>
            </div>
          </div>

          {/* Zero-Click Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Voice Task Creation */}
            <Button
              onClick={handleVoiceInput}
              disabled={isVoiceRecording}
              className="flex items-center justify-center gap-3 h-16 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg"
            >
              <Mic className={`w-5 h-5 ${isVoiceRecording ? 'animate-pulse' : ''}`} />
              <div className="text-left">
                <div className="font-semibold">
                  {isVoiceRecording ? '音声を認識中...' : '話すだけでタスク作成'}
                </div>
                <div className="text-sm opacity-90">
                  「明日までにA社の資料作成」
                </div>
              </div>
            </Button>

            {/* Auto Schedule Generation */}
            <Button
              onClick={generateAutoSchedule}
              disabled={autoScheduleGenerated}
              className="flex items-center justify-center gap-3 h-16 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-xl shadow-lg"
            >
              <Play className="w-5 h-5" />
              <div className="text-left">
                <div className="font-semibold">
                  {autoScheduleGenerated ? '✓ スケジュール生成済み' : '今日の予定を自動生成'}
                </div>
                <div className="text-sm opacity-90">
                  最適な順序で自動配置
                </div>
              </div>
            </Button>
          </div>

          {/* Today's Essentials */}
          {todayEssentials.urgentTasks.length > 0 ? (
            <div className="space-y-3 mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                緊急タスク {todayEssentials.urgentTasks.length}件
              </h3>
              {todayEssentials.urgentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      task.priority === 'high' ? 'bg-red-500 animate-pulse' :
                      task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <div>
                      <p className="font-medium text-gray-900">{task.title}</p>
                      <p className="text-sm text-gray-600">{task.timeRemaining}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-green-50 rounded-lg mb-6">
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="text-lg font-semibold text-green-800 mb-1">
                緊急タスクはありません！
              </h3>
              <p className="text-green-600">余裕のある一日をお過ごしください</p>
            </div>
          )}

          {/* AI Suggestion */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">AI</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-1">今日のおすすめアクション</h4>
                <p className="text-blue-800 mb-2">{todayEssentials.aiSuggestion.action}</p>
                <div className="flex items-center gap-4 text-sm text-blue-600">
                  <span>理由: {todayEssentials.aiSuggestion.reasoning}</span>
                  <span>所要時間: {todayEssentials.aiSuggestion.estimatedTime}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Link href="/tasks" className="flex-1 min-w-[120px]">
              <Button variant="outline" className="w-full">
                タスク詳細
              </Button>
            </Link>
            <Link href="/calendar" className="flex-1 min-w-[120px]">
              <Button variant="outline" className="w-full">
                カレンダー
              </Button>
            </Link>
            {showAdvancedFeatures && (
              <Link href="/projects" className="flex-1 min-w-[120px]">
                <Button variant="outline" className="w-full">
                  プロジェクト
                </Button>
              </Link>
            )}
            {!showAdvancedFeatures && onAdvancedToggle && (
              <Button
                onClick={() => onAdvancedToggle(true)}
                variant="outline"
                className="flex-1 min-w-[120px] text-blue-600 border-blue-300"
              >
                <Settings className="w-4 h-4 mr-2" />
                詳細機能
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Advanced Features */}
      {showAdvancedFeatures && (
        <Card variant="elevated" padding="normal" className="border-l-4 border-l-blue-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              高度な機能
            </h3>
            <Button
              onClick={() => onAdvancedToggle && onAdvancedToggle(false)}
              variant="outline"
              size="sm"
              className="text-gray-600"
            >
              シンプル表示に戻る
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/mbti" className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <h4 className="font-medium text-purple-900 mb-1">チーム編成最適化</h4>
              <p className="text-sm text-purple-700">MBTI分析で最適チーム構成</p>
            </Link>
            <Link href="/dashboard/financial" className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <h4 className="font-medium text-green-900 mb-1">収益予測</h4>
              <p className="text-sm text-green-700">LTV分析で収益最大化</p>
            </Link>
            <Link href="/dashboard/analytics" className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
              <h4 className="font-medium text-orange-900 mb-1">成果分析</h4>
              <p className="text-sm text-orange-700">AI分析で成功パターン発見</p>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}