import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { 
  DEMO_TASKS, 
  DEMO_EVENTS, 
  DEMO_USER_PREFERENCES 
} from '@/lib/demo/demo-data';

// Core scheduling engines
import { ResourceConstraintEngine } from '@/lib/scheduling/resource-constraint-engine';
import { WeightBasedScheduler } from '@/lib/scheduling/weight-based-scheduler';
import { FuturePredictionEngine } from '@/lib/scheduling/future-prediction-engine';

// Type imports
import { UserResourceProfile, USER_TYPE_PRESETS } from '@/types/resource-profile';
import { TaskWeightProfile, createTaskWeightProfile } from '@/types/task-weight';
import { FuturePrediction } from '@/types/prediction';

interface Task {
  id: string;
  title: string;
  priority: string;
  dueDate?: string;
  estimatedHours?: number;
  status: string;
  description?: string;
}

interface Event {
  id: string;
  title: string;
  startTime: string;
  endTime?: string;
}

interface ResourceScheduleRequest {
  tasks: Task[];
  events: Event[];
  userProfile?: Partial<UserResourceProfile>;
  preferences?: any;
  date: string;
}

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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let { 
      tasks, 
      events, 
      userProfile, 
      preferences, 
      date 
    }: ResourceScheduleRequest = await request.json();

    // デモモード処理: 未ログイン時またはデータが空の場合
    const isDemoMode = !session || !tasks || tasks.length === 0;
    
    if (isDemoMode) {
      // デモデータを使用
      tasks = tasks?.length > 0 ? tasks : DEMO_TASKS;
      events = events?.length > 0 ? events : DEMO_EVENTS;
      preferences = preferences || DEMO_USER_PREFERENCES;
    }

    if (!tasks || !Array.isArray(tasks)) {
      return NextResponse.json({ error: 'Tasks array is required' }, { status: 400 });
    }

    // ユーザーリソースプロファイル準備
    const resourceProfile = prepareUserResourceProfile(userProfile, isDemoMode);
    
    // タスクウエイトプロファイル生成
    const taskWeightProfiles = tasks.map(task => 
      createTaskWeightProfile(
        task.id,
        task.title,
        task.description,
        {
          estimatedDuration: (task.estimatedHours || 1) * 60,
          urgencyScore: task.priority === 'HIGH' ? 8 : task.priority === 'MEDIUM' ? 5 : 3,
          importanceScore: task.priority === 'HIGH' ? 8 : task.priority === 'MEDIUM' ? 5 : 3,
        }
      )
    );

    // ウエイト・リソースベーススケジューリング実行
    const scheduleResult = generateResourceBasedSchedule(
      tasks,
      events || [],
      taskWeightProfiles,
      resourceProfile,
      preferences || {},
      date
    );

    return NextResponse.json({
      success: true,
      ...scheduleResult,
      isDemoMode,
      metadata: {
        ...scheduleResult.metadata,
        isDemoMode,
        message: isDemoMode ? 'デモデータを使用したリソースベーススケジュールです' : null
      }
    });

  } catch (error) {
    console.error('Resource-based schedule generation error:', error);
    return NextResponse.json({
      success: false,
      error: 'リソースベーススケジュール生成中にエラーが発生しました'
    }, { status: 500 });
  }
}

function generateResourceBasedSchedule(
  tasks: Task[], 
  events: Event[], 
  taskWeightProfiles: TaskWeightProfile[],
  userProfile: UserResourceProfile,
  preferences: any,
  date: string
): ResourceScheduleResult {
  
  // タスクをウエイトプロファイルと統合
  const tasksWithWeight = tasks.map(task => {
    const weightProfile = taskWeightProfiles.find(wp => wp.taskId === task.id);
    return {
      ...task,
      taskTitle: task.title,
      weight: weightProfile?.estimatedWeight || 5,
      canSplit: weightProfile?.canSplit || false,
      weightProfile
    };
  });

  // シンプルなスケジュール生成（コアエンジンの代替実装）
  const schedule: ScheduledTask[] = [];
  let currentTime = 540; // 09:00 in minutes
  const workEndTime = 1080; // 18:00 in minutes

  // 既存イベントを追加
  events.forEach(event => {
    const startTime = new Date(event.startTime);
    const endTime = event.endTime ? new Date(event.endTime) : 
                   new Date(startTime.getTime() + 60 * 60 * 1000);
    
    schedule.push({
      id: `meeting-${event.id}`,
      startTime: `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`,
      endTime: `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`,
      title: event.title,
      type: 'meeting',
      priority: 'high',
      estimatedProductivity: 85
    });
  });

  // タスクを重要度順にソート
  const sortedTasks = tasksWithWeight
    .filter(task => task.status !== 'COMPLETE')
    .sort((a, b) => {
      const priorityA = a.priority === 'HIGH' ? 3 : a.priority === 'MEDIUM' ? 2 : 1;
      const priorityB = b.priority === 'HIGH' ? 3 : b.priority === 'MEDIUM' ? 2 : 1;
      return priorityB - priorityA;
    });

  // タスクを時間枠に配置
  sortedTasks.slice(0, 6).forEach((task, index) => {
    const duration = (task.estimatedHours || 1) * 60;
    const endTime = currentTime + duration;
    
    if (endTime <= workEndTime) {
      schedule.push({
        id: `task-${task.id}`,
        startTime: minutesToTime(currentTime),
        endTime: minutesToTime(endTime),
        title: task.title,
        type: 'task',
        priority: task.priority.toLowerCase() as 'high' | 'medium' | 'low',
        estimatedProductivity: 80,
        weight: task.weight,
        canBeSplit: task.canSplit
      });
      
      currentTime = endTime + 15; // 15分休憩
    }
  });

  // 時間順ソート
  schedule.sort((a, b) => a.startTime.localeCompare(b.startTime));

  // 容量利用率計算
  const totalWeight = taskWeightProfiles.reduce((sum, profile) => sum + profile.estimatedWeight, 0);
  const capacityUtilization = totalWeight / userProfile.dailyCapacity.totalWeightLimit;

  // 簡単な先読み予測
  const futurePrediction = {
    weeklyCapacity: [
      { week: 1, capacityStatus: 'medium' as const, estimatedWorkload: 12 },
      { week: 2, capacityStatus: 'low' as const, estimatedWorkload: 8 },
      { week: 3, capacityStatus: 'high' as const, estimatedWorkload: 16 },
      { week: 4, capacityStatus: 'medium' as const, estimatedWorkload: 10 }
    ],
    riskAlerts: capacityUtilization > 0.8 ? ['容量超過のリスクがあります'] : [],
    recommendations: [
      'リソースベーススケジューリングが適用されました',
      `現在の容量利用率: ${Math.round(capacityUtilization * 100)}%`
    ]
  };

  return {
    schedule,
    metadata: {
      totalTasks: tasks.length,
      scheduledTasks: schedule.filter(s => s.type === 'task').length,
      estimatedProductivity: Math.round(
        schedule.reduce((sum, task) => sum + task.estimatedProductivity, 0) / schedule.length
      ),
      isDemoMode: false, // Will be set by caller
      totalWeight,
      capacityUtilization: Math.round(capacityUtilization * 100) / 100
    },
    futurePrediction,
    userProfile,
    date,
    generatedAt: new Date().toISOString()
  };
}

// Utility function
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function prepareUserResourceProfile(
  userProfile?: Partial<UserResourceProfile>,
  isDemoMode: boolean = false
): UserResourceProfile {
  // デモモード時のデフォルトプロファイル
  const demoUserType = 'employee'; // デモではサラリーマンタイプ
  
  const profileBase = userProfile || {};
  const userType = profileBase.userType || demoUserType;
  
  // プリセットを基準にプロファイル構築
  const preset = USER_TYPE_PRESETS[userType];
  const now = new Date().toISOString();
  
  return {
    id: profileBase.id || `profile_demo_${Date.now()}`,
    userId: profileBase.userId || 'demo_user',
    userType,
    commitmentRatio: profileBase.commitmentRatio ?? preset.commitmentRatio,
    dailyCapacity: {
      ...preset.dailyCapacity,
      ...profileBase.dailyCapacity
    },
    timeConstraints: {
      ...preset.timeConstraints,
      ...profileBase.timeConstraints
    },
    workingPattern: {
      ...preset.workingPattern,
      ...profileBase.workingPattern
    },
    personalConstraints: {
      ...preset.personalConstraints,
      ...profileBase.personalConstraints
    },
    preferences: {
      ...preset.preferences,
      ...profileBase.preferences
    },
    createdAt: profileBase.createdAt || now,
    updatedAt: now
  };
}