import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { 
  DEMO_TASKS, 
  DEMO_EVENTS, 
  DEMO_USER_PREFERENCES 
} from '@/lib/demo/demo-data';

// Core scheduling engines
import { ResourceConstraintEngine, TaskWithWeight } from '@/lib/scheduling/resource-constraint-engine';
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
    const scheduleResult = await generateResourceBasedSchedule(
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

async function generateResourceBasedSchedule(
  tasks: Task[], 
  events: Event[], 
  taskWeightProfiles: TaskWeightProfile[],
  userProfile: UserResourceProfile,
  preferences: any,
  date: string
): Promise<ResourceScheduleResult> {
  
  // コアエンジン初期化
  const constraintEngine = new ResourceConstraintEngine(
    userProfile,
    [], // personalSchedules
    calendarEvents
  );
  
  const schedulingConfig = {
    targetDays: 7,
    startDate: date,
    allowSplitting: true,
    allowRescheduling: true,
    priorityWeighting: 0.8,
    balanceMode: 'hybrid' as const,
    riskTolerance: 'moderate' as const,
    splitPreferences: {
      minimumSplitDuration: 30,
      maxSplitsPerTask: 3,
      preferConsecutive: true
    },
    optimizationGoals: {
      maximizeProductivity: 0.8,
      minimizeStress: 0.6,
      respectDeadlines: 0.9,
      balanceWorkload: 0.7
    }
  };
  
  const scheduler = new WeightBasedScheduler(
    userProfile,
    constraintEngine,
    schedulingConfig
  );
  
  const predictionParams = {
    userId: userProfile.userId,
    analysisDepth: 'standard' as const,
    forecastPeriod: 4,
    includeSeasonalFactors: true,
    includePersonalEvents: true,
    riskTolerance: 'moderate' as const,
    weights: {
      historicalData: 0.4,
      currentTrends: 0.4,
      externalFactors: 0.2
    }
  };
  
  const predictionEngine = new FuturePredictionEngine(
    userProfile,
    constraintEngine,
    scheduler,
    predictionParams
  );

  try {
    // 1. リソース制約分析
    const calendarEvents = events.map(event => ({
      id: event.id,
      startTime: event.startTime,
      endTime: event.endTime,
      title: event.title,
      type: 'meeting'
    }));

    const availableSlots = constraintEngine.calculateAvailableSlots(date);

    const capacityStatus = constraintEngine.checkDailyCapacity(
      date,
      [] // 既存タスク（初回は空）
    );

    // 2. ウエイトベーススケジューリング実行
    const tasksWithWeight = tasks.map(task => {
      const weightProfile = taskWeightProfiles.find(wp => wp.taskId === task.id);
      return {
        ...weightProfile,
        taskId: task.id,
        taskTitle: task.title,
        taskDescription: task.description,
        dueDate: task.dueDate,
        status: task.status
      } as TaskWithWeight;
    }).filter(task => task.status !== 'COMPLETE');

    const scheduleConfig = {
      optimizationMode: preferences.optimizationMode || 'balanced',
      allowTaskSplitting: preferences.allowTaskSplitting !== false,
      prioritizeHighWeight: preferences.prioritizeHighWeight !== false,
      energyBasedScheduling: preferences.energyBasedScheduling !== false
    };

    const scheduleResult = await scheduler.generateSchedule(
      tasksWithWeight,
      [] // 既存スケジュール（初回は空）
    );

    // 3. 先読み予測生成
    const predictionParams = {
      userId: userProfile.userId,
      analysisDepth: 'standard' as const,
      forecastPeriod: 4,
      includeSeasonalFactors: true,
      includePersonalEvents: true,
      riskTolerance: preferences.riskTolerance || 'moderate' as const,
      weights: {
        historicalData: 0.4,
        currentTrends: 0.4,
        externalFactors: 0.2
      }
    };

    const futurePrediction = await predictionEngine.generateFuturePrediction(
      tasksWithWeight,
      scheduleResult.scheduledTasks,
      [], // 履歴データ（デモ時は空）
      []  // 外部要因（デモ時は空）
    );

    // 4. 結果変換（APIレスポンス形式に合わせる）
    const schedule: ScheduledTask[] = [
      // 既存イベント
      ...events.map(event => {
        const startTime = new Date(event.startTime);
        const endTime = event.endTime ? new Date(event.endTime) : 
                       new Date(startTime.getTime() + 60 * 60 * 1000);
        return {
          id: `meeting-${event.id}`,
          startTime: formatTime(startTime),
          endTime: formatTime(endTime),
          title: event.title,
          type: 'meeting' as const,
          priority: 'high' as const,
          estimatedProductivity: 85
        };
      }),
      // スケジュール済みタスク
      ...scheduleResult.scheduledTasks.map(scheduledTask => ({
        id: `task-${scheduledTask.task.id}`,
        startTime: scheduledTask.scheduledTime,
        endTime: scheduledTask.scheduledEndTime,
        title: scheduledTask.task.taskTitle,
        type: 'task' as const,
        priority: mapPriority(scheduledTask.task.priorityMatrix || 'urgent-important'),
        estimatedProductivity: Math.round(scheduledTask.confidence * 100),
        weight: scheduledTask.actualWeight,
        canBeSplit: scheduledTask.task.canSplit,
        splitInfo: scheduledTask.splitInfo ? {
          partNumber: scheduledTask.splitInfo.splitNumber,
          totalParts: scheduledTask.splitInfo.totalSplits,
          originalTaskId: scheduledTask.splitInfo.originalTaskId
        } : undefined
      }))
    ];

    // 時間順ソート
    schedule.sort((a, b) => a.startTime.localeCompare(b.startTime));

    // 容量利用率計算
    const totalWeight = taskWeightProfiles.reduce((sum, profile) => sum + profile.estimatedWeight, 0);
    const capacityUtilization = capacityStatus.totalAvailableHours > 0 ? 
      capacityStatus.scheduledHours / capacityStatus.totalAvailableHours : 0;

    return {
      schedule,
      metadata: {
        totalTasks: tasks.length,
        scheduledTasks: scheduleResult.scheduledTasks.length,
        estimatedProductivity: Math.round(
          schedule.reduce((sum, task) => sum + task.estimatedProductivity, 0) / Math.max(schedule.length, 1)
        ),
        isDemoMode: false, // Will be set by caller
        totalWeight,
        capacityUtilization: Math.round(capacityUtilization * 100) / 100
      },
      futurePrediction: {
        weeklyCapacity: [
          {
            week: 1,
            capacityStatus: mapCapacityStatus(futurePrediction.weeklyCapacityPrediction.week1.availableCapacity),
            estimatedWorkload: futurePrediction.weeklyCapacityPrediction.week1.scheduledWeight
          },
          {
            week: 2,
            capacityStatus: mapCapacityStatus(futurePrediction.weeklyCapacityPrediction.week2.availableCapacity),
            estimatedWorkload: futurePrediction.weeklyCapacityPrediction.week2.scheduledWeight
          },
          {
            week: 3,
            capacityStatus: mapCapacityStatus(futurePrediction.weeklyCapacityPrediction.week3.availableCapacity),
            estimatedWorkload: futurePrediction.weeklyCapacityPrediction.week3.scheduledWeight
          },
          {
            week: 4,
            capacityStatus: mapCapacityStatus(futurePrediction.weeklyCapacityPrediction.week4.availableCapacity),
            estimatedWorkload: futurePrediction.weeklyCapacityPrediction.week4.scheduledWeight
          }
        ],
        riskAlerts: generateRiskAlerts(futurePrediction.riskAlerts),
        recommendations: futurePrediction.recommendations.map(rec => rec.description)
      },
      userProfile,
      date,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Core engine error, falling back to simple scheduling:', error);
    
    // フォールバック：簡易スケジューリング
    return generateSimpleFallbackSchedule(tasks, events, taskWeightProfiles, userProfile, date);
  }
}

// ユーティリティ関数
function formatTime(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function mapPriority(priorityMatrix: string): 'high' | 'medium' | 'low' {
  return priorityMatrix === 'urgent-important' ? 'high' : 
         priorityMatrix === 'urgent-not-important' || priorityMatrix === 'not-urgent-important' ? 'medium' : 'low';
}

function generateRiskAlerts(riskAlerts: any): string[] {
  const alerts: string[] = [];
  if (riskAlerts.overloadRisk !== 'low') {
    alerts.push(`容量超過リスク: ${riskAlerts.overloadRisk}`);
  }
  if (riskAlerts.burnoutRisk !== 'low') {
    alerts.push(`バーンアウトリスク: ${riskAlerts.burnoutRisk}`);
  }
  if (riskAlerts.deadlineMissRisk !== 'low') {
    alerts.push(`締切逸失リスク: ${riskAlerts.deadlineMissRisk}`);
  }
  return alerts;
}

function mapCapacityStatus(level: number): 'low' | 'medium' | 'high' | 'overload' {
  if (level < 0.3) return 'low';
  if (level < 0.7) return 'medium';
  if (level < 0.9) return 'high';
  return 'overload';
}

// フォールバック用簡易スケジューリング
function generateSimpleFallbackSchedule(
  tasks: Task[], 
  events: Event[], 
  taskWeightProfiles: TaskWeightProfile[],
  userProfile: UserResourceProfile,
  date: string
): ResourceScheduleResult {
  const schedule: ScheduledTask[] = [];
  let currentTime = 540; // 09:00 in minutes
  const workEndTime = 1080; // 18:00 in minutes

  // 既存イベント追加
  events.forEach(event => {
    const startTime = new Date(event.startTime);
    const endTime = event.endTime ? new Date(event.endTime) : 
                   new Date(startTime.getTime() + 60 * 60 * 1000);
    schedule.push({
      id: `meeting-${event.id}`,
      startTime: formatTime(startTime),
      endTime: formatTime(endTime),
      title: event.title,
      type: 'meeting',
      priority: 'high',
      estimatedProductivity: 85
    });
  });

  // 簡易タスク配置
  const pendingTasks = tasks.filter(task => task.status !== 'COMPLETE')
    .sort((a, b) => {
      const priorityA = a.priority === 'HIGH' ? 3 : a.priority === 'MEDIUM' ? 2 : 1;
      const priorityB = b.priority === 'HIGH' ? 3 : b.priority === 'MEDIUM' ? 2 : 1;
      return priorityB - priorityA;
    })
    .slice(0, 6);

  pendingTasks.forEach(task => {
    const duration = (task.estimatedHours || 1) * 60;
    const endTime = currentTime + duration;
    
    if (endTime <= workEndTime) {
      const weightProfile = taskWeightProfiles.find(wp => wp.taskId === task.id);
      schedule.push({
        id: `task-${task.id}`,
        startTime: minutesToTime(currentTime),
        endTime: minutesToTime(endTime),
        title: task.title,
        type: 'task',
        priority: mapPriority(task.priority),
        estimatedProductivity: 75,
        weight: weightProfile?.estimatedWeight || 5,
        canBeSplit: weightProfile?.canSplit || false
      });
      currentTime = endTime + 15;
    }
  });

  schedule.sort((a, b) => a.startTime.localeCompare(b.startTime));

  const totalWeight = taskWeightProfiles.reduce((sum, profile) => sum + profile.estimatedWeight, 0);
  const capacityUtilization = totalWeight / userProfile.dailyCapacity.totalWeightLimit;

  return {
    schedule,
    metadata: {
      totalTasks: tasks.length,
      scheduledTasks: schedule.filter(s => s.type === 'task').length,
      estimatedProductivity: Math.round(
        schedule.reduce((sum, task) => sum + task.estimatedProductivity, 0) / Math.max(schedule.length, 1)
      ),
      isDemoMode: false,
      totalWeight,
      capacityUtilization: Math.round(capacityUtilization * 100) / 100
    },
    futurePrediction: {
      weeklyCapacity: [
        { week: 1, capacityStatus: 'medium', estimatedWorkload: 12 },
        { week: 2, capacityStatus: 'low', estimatedWorkload: 8 },
        { week: 3, capacityStatus: 'high', estimatedWorkload: 16 },
        { week: 4, capacityStatus: 'medium', estimatedWorkload: 10 }
      ],
      riskAlerts: capacityUtilization > 0.8 ? ['容量超過のリスクがあります（フォールバック）'] : [],
      recommendations: [
        '簡易スケジューリングが適用されました',
        `現在の容量利用率: ${Math.round(capacityUtilization * 100)}%`
      ]
    },
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

// 初期化時にcalendarEventsを定義
const calendarEvents: any[] = [];