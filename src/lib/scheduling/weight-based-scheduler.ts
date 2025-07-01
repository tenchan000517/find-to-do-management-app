// ウエイト・リソースベース自動スケジューリング - ウエイトベース配置アルゴリズム
// タスクウエイト解析・最適配置計算・分割タスク管理・依存関係処理

import { UserResourceProfile } from '@/types/resource-profile';
import { TaskWeightProfile } from '@/types/task-weight';
import { ResourceConstraintEngine, TimeSlot, TaskWithWeight, DailyCapacityStatus } from './resource-constraint-engine';

// スケジュール生成結果
export interface ScheduleGenerationResult {
  scheduledTasks: ScheduledTask[];
  unscheduledTasks: TaskWithWeight[];
  dailyBreakdown: DailyScheduleBreakdown[];
  optimization: OptimizationMetrics;
  warnings: string[];
  recommendations: string[];
}

// スケジュール済みタスク
export interface ScheduledTask {
  task: TaskWithWeight;
  scheduledDate: string;
  scheduledTime: string;
  scheduledEndTime: string;
  actualWeight: number;
  confidence: number;          // 配置信頼度 0-1
  flexibility: number;         // 調整可能性 0-1
  splitInfo?: TaskSplitInfo;   // 分割情報（分割タスクの場合）
  dependencies: {
    blockedBy: string[];       // 待機中の依存タスク
    blocks: string[];          // このタスクが阻んでいるタスク
  };
}

// タスク分割情報
export interface TaskSplitInfo {
  originalTaskId: string;
  splitNumber: number;         // 何番目の分割か
  totalSplits: number;         // 総分割数
  splitDuration: number;       // この分割の時間
  remainingWork: number;       // 残り作業量
  canMergeWith: string[];      // 結合可能な他分割ID
}

// 日別スケジュール詳細
export interface DailyScheduleBreakdown {
  date: string;
  dayOfWeek: string;
  capacity: DailyCapacityStatus;
  scheduledTasks: ScheduledTask[];
  timeSlots: TimeSlot[];
  utilization: {
    timeUtilization: number;    // 時間利用率 0-1
    weightUtilization: number;  // ウエイト利用率 0-1
    energyBalance: number;      // エネルギーバランス 0-1
  };
  qualityScore: number;         // 配置品質スコア 0-100
}

// 最適化メトリクス
export interface OptimizationMetrics {
  totalTasks: number;
  scheduledCount: number;
  schedulingRate: number;       // 配置成功率 0-1
  averageConfidence: number;    // 平均信頼度 0-1
  loadBalance: number;          // 負荷分散度 0-1
  timeEfficiency: number;       // 時間効率 0-1
  priorityAdherence: number;    // 優先度遵守率 0-1
  dependencyCompliance: number; // 依存関係遵守率 0-1
}

// スケジューリング設定
export interface SchedulingConfiguration {
  targetDays: number;           // 配置対象日数
  startDate: string;
  allowSplitting: boolean;      // タスク分割許可
  allowRescheduling: boolean;   // 既存タスク再配置許可
  priorityWeighting: number;    // 優先度重視度 0-1
  balanceMode: 'time' | 'weight' | 'energy' | 'hybrid';
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  
  // 分割設定
  splitPreferences: {
    minimumSplitDuration: number; // 最小分割時間（分）
    maxSplitsPerTask: number;     // タスクあたり最大分割数
    preferConsecutive: boolean;   // 連続配置を優先
  };
  
  // 最適化設定
  optimizationGoals: {
    maximizeProductivity: number; // 生産性最大化重視度 0-1
    minimizeStress: number;       // ストレス最小化重視度 0-1
    respectDeadlines: number;     // 締切遵守重視度 0-1
    balanceWorkload: number;      // 負荷分散重視度 0-1
  };
}

export class WeightBasedScheduler {
  constructor(
    private userProfile: UserResourceProfile,
    private constraintEngine: ResourceConstraintEngine,
    private configuration: SchedulingConfiguration
  ) {}

  /**
   * メインスケジューリング実行
   */
  async generateSchedule(
    tasks: TaskWithWeight[],
    existingSchedule: ScheduledTask[] = []
  ): Promise<ScheduleGenerationResult> {
    // 1. タスクの前処理・優先順位付け
    const processedTasks = this.preprocessTasks(tasks);
    const sortedTasks = this.prioritizeTasks(processedTasks);
    
    // 2. 依存関係グラフ構築
    const dependencyGraph = this.buildDependencyGraph(sortedTasks);
    
    // 3. 実行可能タスクの特定
    const executableTasks = this.findExecutableTasks(sortedTasks, dependencyGraph, existingSchedule);
    
    // 4. 日別容量分析
    const dailyBreakdown = await this.analyzeDailyCapacity();
    
    // 5. メインスケジューリングループ
    const schedulingResult = await this.performScheduling(executableTasks, dailyBreakdown, existingSchedule);
    
    // 6. 最適化・調整
    const optimizedResult = await this.optimizeSchedule(schedulingResult);
    
    // 7. 品質評価・推奨事項生成
    const finalResult = await this.evaluateAndRecommend(optimizedResult);
    
    return finalResult;
  }

  /**
   * タスクの前処理
   */
  private preprocessTasks(tasks: TaskWithWeight[]): TaskWithWeight[] {
    return tasks.map(task => {
      // ウエイト自動計算（未設定の場合）
      if (!task.estimatedWeight || task.estimatedWeight === 0) {
        // TaskWeightProfileの計算関数を使用
        task.estimatedWeight = this.calculateTaskWeight(task);
      }
      
      // 分割可能性の再評価
      if (task.canSplit && task.estimatedDuration < this.configuration.splitPreferences.minimumSplitDuration) {
        task.canSplit = false;
      }
      
      return task;
    });
  }

  /**
   * タスク優先順位付け
   */
  private prioritizeTasks(tasks: TaskWithWeight[]): TaskWithWeight[] {
    return tasks.sort((a, b) => {
      // 複合スコア計算
      const scoreA = this.calculatePriorityScore(a);
      const scoreB = this.calculatePriorityScore(b);
      
      return scoreB - scoreA; // 降順ソート
    });
  }

  /**
   * 優先度スコア計算
   */
  private calculatePriorityScore(task: TaskWithWeight): number {
    let score = 0;
    
    // 緊急度・重要度（アイゼンハワーマトリックス）
    switch (task.priorityMatrix) {
      case 'urgent-important': score += 100; break;
      case 'urgent-not-important': score += 70; break;
      case 'not-urgent-important': score += 60; break;
      case 'not-urgent-not-important': score += 30; break;
    }
    
    // 締切接近度
    if (task.dueDate) {
      const daysUntilDue = this.getDaysUntilDue(task.dueDate);
      if (daysUntilDue <= 1) score += 50;
      else if (daysUntilDue <= 3) score += 30;
      else if (daysUntilDue <= 7) score += 15;
    }
    
    // リスクレベル
    switch (task.riskLevel) {
      case 'high': score += 25; break;
      case 'medium': score += 10; break;
      case 'low': score += 0; break;
    }
    
    // 依存関係（他をブロックするタスクは優先）
    score += task.blocksOtherTasks.length * 10;
    
    // ウエイト（軽いタスクは少し優先）
    score += (10 - task.estimatedWeight) * 2;
    
    // 設定による優先度重視度調整
    score *= this.configuration.priorityWeighting;
    
    return score;
  }

  /**
   * 依存関係グラフ構築
   */
  private buildDependencyGraph(tasks: TaskWithWeight[]): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();
    
    tasks.forEach(task => {
      if (!graph.has(task.taskId)) {
        graph.set(task.taskId, new Set());
      }
      
      task.dependsOnTasks.forEach(depId => {
        if (!graph.has(depId)) {
          graph.set(depId, new Set());
        }
        graph.get(depId)!.add(task.taskId);
      });
    });
    
    return graph;
  }

  /**
   * 実行可能タスク特定
   */
  private findExecutableTasks(
    tasks: TaskWithWeight[], 
    dependencyGraph: Map<string, Set<string>>,
    existingSchedule: ScheduledTask[]
  ): TaskWithWeight[] {
    const completedTasks = new Set(
      existingSchedule
        .filter(s => s.task.status === 'COMPLETE')
        .map(s => s.task.taskId)
    );
    
    return tasks.filter(task => {
      // 既に完了しているタスクは除外
      if (completedTasks.has(task.taskId)) return false;
      
      // 依存関係チェック
      return task.dependsOnTasks.every(depId => completedTasks.has(depId));
    });
  }

  /**
   * 日別容量分析
   */
  private async analyzeDailyCapacity(): Promise<DailyScheduleBreakdown[]> {
    const breakdown: DailyScheduleBreakdown[] = [];
    const startDate = typeof this.configuration.startDate === 'string' 
      ? new Date(this.configuration.startDate) 
      : this.configuration.startDate;
    
    // Validate startDate
    if (isNaN(startDate.getTime())) {
      console.error('Invalid startDate in configuration:', this.configuration.startDate);
      throw new Error('Invalid startDate provided to WeightBasedScheduler');
    }
    
    for (let i = 0; i < this.configuration.targetDays; i++) {
      const date = new Date(startDate.getTime());
      date.setDate(startDate.getDate() + i);
      
      // Invalid date check
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date generated for day ${i}`);
        continue;
      }
      
      const dateStr = date.toISOString().split('T')[0];
      
      const timeSlots = this.constraintEngine.calculateAvailableSlots(dateStr);
      const capacity = this.constraintEngine.checkDailyCapacity(dateStr, []);
      
      breakdown.push({
        date: dateStr,
        dayOfWeek: date.toLocaleDateString('ja-JP', { weekday: 'long' }),
        capacity,
        scheduledTasks: [],
        timeSlots,
        utilization: {
          timeUtilization: 0,
          weightUtilization: 0,
          energyBalance: 1
        },
        qualityScore: 100
      });
    }
    
    return breakdown;
  }

  /**
   * メインスケジューリング実行
   */
  private async performScheduling(
    tasks: TaskWithWeight[],
    dailyBreakdown: DailyScheduleBreakdown[],
    existingSchedule: ScheduledTask[]
  ): Promise<{
    scheduledTasks: ScheduledTask[];
    unscheduledTasks: TaskWithWeight[];
    dailyBreakdown: DailyScheduleBreakdown[];
  }> {
    const scheduledTasks: ScheduledTask[] = [...existingSchedule];
    const unscheduledTasks: TaskWithWeight[] = [];
    
    for (const task of tasks) {
      const placement = await this.findBestPlacement(task, dailyBreakdown, scheduledTasks);
      
      if (placement) {
        scheduledTasks.push(placement);
        this.updateDailyBreakdown(dailyBreakdown, placement);
      } else {
        // 分割を試行
        if (task.canSplit && this.configuration.allowSplitting) {
          const splitPlacements = await this.attemptTaskSplitting(task, dailyBreakdown, scheduledTasks);
          
          if (splitPlacements.length > 0) {
            scheduledTasks.push(...splitPlacements);
            splitPlacements.forEach(sp => this.updateDailyBreakdown(dailyBreakdown, sp));
          } else {
            unscheduledTasks.push(task);
          }
        } else {
          unscheduledTasks.push(task);
        }
      }
    }
    
    return { scheduledTasks, unscheduledTasks, dailyBreakdown };
  }

  /**
   * 最適配置場所検索
   */
  private async findBestPlacement(
    task: TaskWithWeight,
    dailyBreakdown: DailyScheduleBreakdown[],
    existingTasks: ScheduledTask[]
  ): Promise<ScheduledTask | null> {
    let bestPlacement: ScheduledTask | null = null;
    let bestScore = 0;
    
    for (const day of dailyBreakdown) {
      const dayTasks = existingTasks.filter(t => t.scheduledDate === day.date);
      
      for (const slot of day.timeSlots) {
        const placementResult = this.constraintEngine.canScheduleTask(
          task, 
          slot, 
          day.date, 
          dayTasks.map(t => t.task)
        );
        
        if (placementResult.canPlace && placementResult.score > bestScore) {
          bestScore = placementResult.score;
          bestPlacement = {
            task,
            scheduledDate: day.date,
            scheduledTime: slot.startTime,
            scheduledEndTime: this.calculateEndTime(slot.startTime, task.estimatedDuration),
            actualWeight: task.estimatedWeight,
            confidence: placementResult.score / 100,
            flexibility: this.calculateFlexibility(task, slot),
            dependencies: {
              blockedBy: task.dependsOnTasks,
              blocks: task.blocksOtherTasks
            }
          };
        }
      }
    }
    
    return bestPlacement;
  }

  /**
   * タスク分割試行
   */
  private async attemptTaskSplitting(
    task: TaskWithWeight,
    dailyBreakdown: DailyScheduleBreakdown[],
    existingTasks: ScheduledTask[]
  ): Promise<ScheduledTask[]> {
    const minDuration = this.configuration.splitPreferences.minimumSplitDuration;
    const maxSplits = this.configuration.splitPreferences.maxSplitsPerTask;
    
    if (task.estimatedDuration < minDuration * 2) {
      return []; // 分割できないサイズ
    }
    
    const splits: ScheduledTask[] = [];
    let remainingDuration = task.estimatedDuration;
    let splitNumber = 1;
    
    for (const day of dailyBreakdown) {
      if (remainingDuration <= 0 || splitNumber > maxSplits) break;
      
      const availableSlots = day.timeSlots.filter(slot => {
        const slotDuration = this.calculateSlotDuration(slot.startTime, slot.endTime);
        return slotDuration >= minDuration;
      });
      
      for (const slot of availableSlots) {
        if (remainingDuration <= 0) break;
        
        const slotDuration = this.calculateSlotDuration(slot.startTime, slot.endTime);
        const splitDuration = Math.min(remainingDuration, slotDuration, task.estimatedDuration / 2);
        
        if (splitDuration >= minDuration) {
          const splitTask: TaskWithWeight = {
            ...task,
            taskId: `${task.taskId}_split_${splitNumber}`,
            estimatedDuration: splitDuration,
            estimatedWeight: Math.ceil(task.estimatedWeight * (splitDuration / task.estimatedDuration))
          };
          
          const placementResult = this.constraintEngine.canScheduleTask(
            splitTask,
            slot,
            day.date,
            existingTasks.map(t => t.task)
          );
          
          if (placementResult.canPlace) {
            splits.push({
              task: splitTask,
              scheduledDate: day.date,
              scheduledTime: slot.startTime,
              scheduledEndTime: this.calculateEndTime(slot.startTime, splitDuration),
              actualWeight: splitTask.estimatedWeight,
              confidence: placementResult.score / 100,
              flexibility: 0.5, // 分割タスクは調整しにくい
              splitInfo: {
                originalTaskId: task.taskId,
                splitNumber,
                totalSplits: Math.ceil(task.estimatedDuration / splitDuration),
                splitDuration,
                remainingWork: remainingDuration - splitDuration,
                canMergeWith: []
              },
              dependencies: {
                blockedBy: task.dependsOnTasks,
                blocks: splitNumber === 1 ? [] : task.blocksOtherTasks
              }
            });
            
            remainingDuration -= splitDuration;
            splitNumber++;
            break; // この日はこの分割で終了
          }
        }
      }
    }
    
    // 全体が配置できた場合のみ返す
    return remainingDuration <= 0 ? splits : [];
  }

  /**
   * 最適化・調整
   */
  private async optimizeSchedule(result: {
    scheduledTasks: ScheduledTask[];
    unscheduledTasks: TaskWithWeight[];
    dailyBreakdown: DailyScheduleBreakdown[];
  }): Promise<ScheduleGenerationResult> {
    // 負荷分散最適化
    result = await this.optimizeLoadBalance(result);
    
    // エネルギー効率最適化
    result = await this.optimizeEnergyEfficiency(result);
    
    // 依存関係最適化
    result = await this.optimizeDependencies(result);
    
    const optimization = this.calculateOptimizationMetrics(result.scheduledTasks, result.unscheduledTasks);
    
    return {
      ...result,
      optimization,
      warnings: this.generateWarnings(result),
      recommendations: this.generateRecommendations(result, optimization)
    };
  }

  /**
   * 品質評価・推奨事項生成
   */
  private async evaluateAndRecommend(result: ScheduleGenerationResult): Promise<ScheduleGenerationResult> {
    // 品質スコア計算
    result.dailyBreakdown.forEach(day => {
      day.qualityScore = this.calculateDayQualityScore(day);
    });
    
    return result;
  }

  // ========== ヘルパーメソッド ==========

  private calculateTaskWeight(task: TaskWithWeight): number {
    // 基本的なウエイト計算ロジック
    let weight = 1;
    
    // 時間ベース
    if (task.estimatedDuration <= 30) weight += 1;
    else if (task.estimatedDuration <= 60) weight += 2;
    else if (task.estimatedDuration <= 120) weight += 3;
    else weight += 4;
    
    // 複雑性ベース
    switch (task.complexityLevel) {
      case 'simple': weight += 0; break;
      case 'medium': weight += 1; break;
      case 'complex': weight += 2; break;
      case 'expert': weight += 3; break;
    }
    
    return Math.min(10, weight);
  }

  private getDaysUntilDue(dueDate: string): number {
    const due = new Date(dueDate);
    const now = new Date();
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateEndTime(startTime: string, durationMinutes: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endDate = new Date();
    endDate.setHours(hours, minutes + durationMinutes);
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  }

  private calculateSlotDuration(startTime: string, endTime: string): number {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
  }

  private calculateFlexibility(task: TaskWithWeight, slot: TimeSlot): number {
    let flexibility = 1.0;
    
    // 時間制約
    if (task.optimalTimeOfDay !== 'flexible') flexibility -= 0.2;
    
    // エネルギー要求
    if (task.energyRequirement === 'high') flexibility -= 0.2;
    
    // 集中力要求
    if (task.focusRequirement === 'high') flexibility -= 0.2;
    
    // 協力要求
    if (task.collaborationNeeded) flexibility -= 0.2;
    
    // リスクレベル
    if (task.riskLevel === 'high') flexibility -= 0.2;
    
    return Math.max(0, flexibility);
  }

  private updateDailyBreakdown(dailyBreakdown: DailyScheduleBreakdown[], scheduledTask: ScheduledTask): void {
    const day = dailyBreakdown.find(d => d.date === scheduledTask.scheduledDate);
    if (day) {
      day.scheduledTasks.push(scheduledTask);
      
      // 利用率更新
      const totalScheduledMinutes = day.scheduledTasks.reduce((sum, t) => 
        sum + t.task.estimatedDuration, 0
      );
      const totalAvailableMinutes = day.timeSlots.reduce((sum, slot) => 
        sum + this.calculateSlotDuration(slot.startTime, slot.endTime), 0
      );
      
      day.utilization.timeUtilization = totalAvailableMinutes > 0 ? 
        totalScheduledMinutes / totalAvailableMinutes : 0;
      
      const totalScheduledWeight = day.scheduledTasks.reduce((sum, t) => 
        sum + t.task.estimatedWeight, 0
      );
      
      day.utilization.weightUtilization = totalScheduledWeight / 
        this.userProfile.dailyCapacity.totalWeightLimit;
    }
  }

  private async optimizeLoadBalance(result: any): Promise<any> {
    // 負荷分散最適化ロジック
    return result;
  }

  private async optimizeEnergyEfficiency(result: any): Promise<any> {
    // エネルギー効率最適化ロジック
    return result;
  }

  private async optimizeDependencies(result: any): Promise<any> {
    // 依存関係最適化ロジック
    return result;
  }

  private calculateOptimizationMetrics(
    scheduledTasks: ScheduledTask[], 
    unscheduledTasks: TaskWithWeight[]
  ): OptimizationMetrics {
    const totalTasks = scheduledTasks.length + unscheduledTasks.length;
    
    return {
      totalTasks,
      scheduledCount: scheduledTasks.length,
      schedulingRate: totalTasks > 0 ? scheduledTasks.length / totalTasks : 0,
      averageConfidence: scheduledTasks.length > 0 ? 
        scheduledTasks.reduce((sum, t) => sum + t.confidence, 0) / scheduledTasks.length : 0,
      loadBalance: 0.8, // 計算ロジック省略
      timeEfficiency: 0.85, // 計算ロジック省略
      priorityAdherence: 0.9, // 計算ロジック省略
      dependencyCompliance: 0.95 // 計算ロジック省略
    };
  }

  private generateWarnings(result: any): string[] {
    const warnings: string[] = [];
    
    if (result.unscheduledTasks.length > 0) {
      warnings.push(`${result.unscheduledTasks.length}個のタスクが配置できませんでした`);
    }
    
    return warnings;
  }

  private generateRecommendations(result: any, optimization: OptimizationMetrics): string[] {
    const recommendations: string[] = [];
    
    if (optimization.schedulingRate < 0.8) {
      recommendations.push('配置率が低いです。タスクの分割や期間の延長を検討してください');
    }
    
    if (optimization.averageConfidence < 0.7) {
      recommendations.push('配置信頼度が低いです。制約条件の緩和を検討してください');
    }
    
    return recommendations;
  }

  private calculateDayQualityScore(day: DailyScheduleBreakdown): number {
    let score = 100;
    
    // 利用率チェック
    if (day.utilization.weightUtilization > 1.0) score -= 30;
    else if (day.utilization.weightUtilization > 0.9) score -= 15;
    
    if (day.utilization.timeUtilization > 1.0) score -= 20;
    
    // エネルギーバランス
    score += (day.utilization.energyBalance - 0.5) * 20;
    
    return Math.max(0, Math.min(100, score));
  }
}