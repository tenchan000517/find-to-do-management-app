// ウエイト・リソースベース自動スケジューリング - 先読み予測エンジン
// 将来容量予測・パツパツ期間検知・前倒し推奨・リスクアラート生成

import { UserResourceProfile } from '@/types/resource-profile';
import { TaskWeightProfile } from '@/types/task-weight';
import { FuturePrediction, CapacityPrediction, DailyCapacityBreakdown, RecommendationItem } from '@/types/prediction';
import { ResourceConstraintEngine, TaskWithWeight, DailyCapacityStatus } from './resource-constraint-engine';
import { WeightBasedScheduler, ScheduledTask } from './weight-based-scheduler';

// 予測パラメータ
export interface PredictionParameters {
  userId: string;
  analysisDepth: 'basic' | 'standard' | 'detailed' | 'comprehensive';
  forecastPeriod: number;         // 予測期間(週)
  includeSeasonalFactors: boolean;
  includePersonalEvents: boolean;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  
  // 学習データ重み
  weights: {
    historicalData: number;       // 過去データ重要度 0-1
    currentTrends: number;        // 現在傾向重要度 0-1
    externalFactors: number;      // 外部要因重要度 0-1
  };
}

// 履歴データ
export interface HistoricalData {
  userId: string;
  period: string;              // YYYY-MM 形式
  metrics: {
    averageTasksPerWeek: number;
    averageWeightPerWeek: number;
    completionRate: number;      // 完了率 0-1
    overloadDays: number;        // 容量超過日数
    stressLevel: number;         // ストレスレベル 1-10
  };
  patterns: {
    busyDays: string[];          // 忙しい曜日
    productiveHours: string[];   // 生産性の高い時間
    commonBottlenecks: string[]; // よくあるボトルネック
  };
}

// 外部要因
export interface ExternalFactor {
  id: string;
  type: 'seasonal' | 'personal' | 'work' | 'industry';
  name: string;
  impact: number;              // 影響度 -1 to 1
  startDate: string;
  endDate: string;
  description: string;
}

// 容量逼迫アラート
export interface CapacityAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  type: 'overload' | 'bottleneck' | 'deadline-risk' | 'burnout-risk';
  week: number;
  dates: string[];
  message: string;
  impact: string;
  suggestedActions: string[];
  preventable: boolean;
}

export class FuturePredictionEngine {
  constructor(
    private userProfile: UserResourceProfile,
    private constraintEngine: ResourceConstraintEngine,
    private scheduler: WeightBasedScheduler,
    private parameters: PredictionParameters
  ) {}

  /**
   * 包括的な将来予測実行
   */
  async generateFuturePrediction(
    currentTasks: TaskWithWeight[],
    currentSchedule: ScheduledTask[],
    historicalData: HistoricalData[] = [],
    externalFactors: ExternalFactor[] = []
  ): Promise<FuturePrediction> {
    // 1. 基本容量予測
    const weeklyCapacityPrediction = await this.predictWeeklyCapacity(
      currentTasks, 
      currentSchedule, 
      historicalData
    );

    // 2. トレンド分析
    const monthlyTrends = await this.analyzeMonthlyTrends(
      historicalData, 
      externalFactors
    );

    // 3. リスクアラート生成
    const riskAlerts = await this.generateRiskAlerts(
      weeklyCapacityPrediction, 
      monthlyTrends, 
      currentTasks
    );

    // 4. 推奨アクション生成
    const recommendations = await this.generateRecommendations(
      weeklyCapacityPrediction, 
      riskAlerts, 
      currentTasks
    );

    // 5. 予測精度計算
    const predictionAccuracy = this.calculatePredictionAccuracy(historicalData);

    const now = new Date();
    const predictionDate = now.toISOString().split('T')[0];
    const validUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    return {
      id: `prediction_${this.parameters.userId}_${Date.now()}`,
      userId: this.parameters.userId,
      predictionDate,
      weeklyCapacityPrediction,
      monthlyTrends,
      riskAlerts,
      recommendations,
      predictionAccuracy,
      calculatedAt: now.toISOString(),
      validUntil
    };
  }

  /**
   * 週次容量予測
   */
  private async predictWeeklyCapacity(
    currentTasks: TaskWithWeight[],
    currentSchedule: ScheduledTask[],
    historicalData: HistoricalData[]
  ): Promise<FuturePrediction['weeklyCapacityPrediction']> {
    const baseDate = new Date();
    
    const predictions = {
      week1: await this.predictSingleWeek(1, baseDate, currentTasks, currentSchedule, historicalData),
      week2: await this.predictSingleWeek(2, baseDate, currentTasks, currentSchedule, historicalData),
      week3: await this.predictSingleWeek(3, baseDate, currentTasks, currentSchedule, historicalData),
      week4: await this.predictSingleWeek(4, baseDate, currentTasks, currentSchedule, historicalData)
    };

    return predictions;
  }

  /**
   * 単一週予測
   */
  private async predictSingleWeek(
    weekOffset: number,
    baseDate: Date,
    currentTasks: TaskWithWeight[],
    currentSchedule: ScheduledTask[],
    historicalData: HistoricalData[]
  ): Promise<CapacityPrediction> {
    const weekStart = new Date(baseDate);
    weekStart.setDate(weekStart.getDate() + (weekOffset - 1) * 7);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    // その週に既定されているタスク
    const weekScheduledTasks = currentSchedule.filter(task => {
      const taskDate = new Date(task.scheduledDate);
      return taskDate >= weekStart && taskDate <= weekEnd;
    });

    // 予想される新規タスク（履歴ベース）
    const expectedNewTasks = this.predictNewTasks(weekOffset, historicalData);

    // 日別詳細予測
    const dailyBreakdown = await this.predictDailyBreakdown(weekStart, weekEnd, weekScheduledTasks, expectedNewTasks);

    // 週全体の容量計算
    const totalAvailableCapacity = dailyBreakdown.reduce((sum, day) => sum + day.availableHours, 0);
    const totalScheduledHours = dailyBreakdown.reduce((sum, day) => sum + day.scheduledHours, 0);
    const totalScheduledWeight = weekScheduledTasks.reduce((sum, task) => sum + task.actualWeight, 0);

    const availableCapacity = totalAvailableCapacity > 0 ? 
      (totalAvailableCapacity - totalScheduledHours) / totalAvailableCapacity : 0;

    // リスク日の特定
    const riskDays = dailyBreakdown
      .filter(day => day.capacityStatus === 'near-limit' || day.capacityStatus === 'overloaded')
      .map(day => day.date);

    const criticalDays = dailyBreakdown
      .filter(day => day.capacityStatus === 'overloaded')
      .map(day => day.date);

    // 調整提案
    const adjustmentSuggestions = this.generateAdjustmentSuggestions(
      dailyBreakdown, 
      currentTasks, 
      weekScheduledTasks
    );

    return {
      weekNumber: weekOffset,
      weekStartDate: weekStart.toISOString().split('T')[0],
      weekEndDate: weekEnd.toISOString().split('T')[0],
      availableCapacity,
      scheduledWeight: totalScheduledWeight,
      flexibleWeight: Math.max(0, this.userProfile.dailyCapacity.totalWeightLimit * 7 - totalScheduledWeight),
      reservedCapacity: 0.15, // 15%をバッファとして確保
      dailyBreakdown,
      riskDays,
      criticalDays,
      recommendedActions: this.generateWeeklyRecommendations(dailyBreakdown, riskDays),
      adjustmentSuggestions
    };
  }

  /**
   * 日別詳細予測
   */
  private async predictDailyBreakdown(
    weekStart: Date,
    weekEnd: Date,
    scheduledTasks: ScheduledTask[],
    expectedNewTasks: TaskWithWeight[]
  ): Promise<DailyCapacityBreakdown[]> {
    const breakdown: DailyCapacityBreakdown[] = [];
    
    for (let date = new Date(weekStart); date <= weekEnd; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.toLocaleDateString('ja-JP', { weekday: 'long' });

      // その日のスケジュール済みタスク
      const dayScheduledTasks = scheduledTasks.filter(task => task.scheduledDate === dateStr);
      
      // 利用可能時間計算
      const availableSlots = this.constraintEngine.calculateAvailableSlots(dateStr);
      const availableHours = availableSlots.reduce((sum, slot) => {
        const duration = this.calculateSlotDuration(slot.startTime, slot.endTime);
        return sum + duration;
      }, 0) / 60; // 分から時間に変換

      // 既定作業時間
      const scheduledHours = dayScheduledTasks.reduce((sum, task) => 
        sum + task.task.estimatedDuration, 0) / 60;

      // 予想される追加作業（新規タスクの一部）
      const expectedAdditionalHours = this.estimateAdditionalWorkload(expectedNewTasks, dateStr);

      const totalExpectedHours = scheduledHours + expectedAdditionalHours;
      const utilizationRate = availableHours > 0 ? totalExpectedHours / availableHours : 0;

      // 容量状況判定
      let capacityStatus: DailyCapacityBreakdown['capacityStatus'];
      if (utilizationRate < 0.5) capacityStatus = 'underutilized';
      else if (utilizationRate < 0.8) capacityStatus = 'optimal';
      else if (utilizationRate < 1.0) capacityStatus = 'near-limit';
      else capacityStatus = 'overloaded';

      // 衝突イベント数（簡略化）
      const conflictingEvents = Math.floor(Math.random() * 3); // 実際は詳細計算

      // エネルギーレベル予測
      const energyLevel = this.predictEnergyLevel(dateStr, utilizationRate, scheduledTasks.length);

      breakdown.push({
        date: dateStr,
        dayOfWeek,
        availableHours,
        scheduledHours: totalExpectedHours,
        utilizationRate,
        capacityStatus,
        conflictingEvents,
        energyLevel
      });
    }

    return breakdown;
  }

  /**
   * 月次トレンド分析
   */
  private async analyzeMonthlyTrends(
    historicalData: HistoricalData[],
    externalFactors: ExternalFactor[]
  ): Promise<FuturePrediction['monthlyTrends']> {
    // 過去データからタスク増加傾向を分析
    let expectedTaskIncrease = 0.1; // デフォルト10%増加
    if (historicalData.length >= 3) {
      const recentTrend = this.calculateTaskIncreaseRate(historicalData.slice(-3));
      expectedTaskIncrease = recentTrend;
    }

    // 季節要因分析
    const seasonalFactors = this.analyzeSeasonalFactors(externalFactors);

    // 個人イベント影響
    const personalEventImpact = this.analyzePersonalEventImpact(externalFactors);

    // 作業負荷パターン
    const workloadPattern = this.determineWorkloadPattern(historicalData);

    return {
      expectedTaskIncrease,
      seasonalFactors,
      personalEventImpact,
      workloadPattern
    };
  }

  /**
   * リスクアラート生成
   */
  private async generateRiskAlerts(
    weeklyPredictions: FuturePrediction['weeklyCapacityPrediction'],
    monthlyTrends: FuturePrediction['monthlyTrends'],
    currentTasks: TaskWithWeight[]
  ): Promise<FuturePrediction['riskAlerts']> {
    const weeks = Object.values(weeklyPredictions);
    
    // 容量超過リスク
    const overloadDays = weeks.flatMap(week => week.riskDays).length;
    const overloadRisk = this.calculateRiskLevel(overloadDays, 'overload');

    // バーンアウトリスク
    const criticalDays = weeks.flatMap(week => week.criticalDays).length;
    const consecutiveHighLoad = this.checkConsecutiveHighLoad(weeks);
    const burnoutRisk = this.calculateBurnoutRisk(criticalDays, consecutiveHighLoad, monthlyTrends);

    // 締切逸失リスク
    const deadlineMissRisk = this.assessDeadlineMissRisk(currentTasks, weeks);

    // リソース競合リスク
    const resourceConflictRisk = this.assessResourceConflictRisk(weeks);

    return {
      overloadRisk,
      burnoutRisk,
      deadlineMissRisk,
      resourceConflictRisk
    };
  }

  /**
   * 推奨アクション生成
   */
  private async generateRecommendations(
    weeklyPredictions: FuturePrediction['weeklyCapacityPrediction'],
    riskAlerts: FuturePrediction['riskAlerts'],
    currentTasks: TaskWithWeight[]
  ): Promise<RecommendationItem[]> {
    const recommendations: RecommendationItem[] = [];
    const weeks = Object.values(weeklyPredictions);

    // 高リスク週への対応
    const highRiskWeeks = weeks.filter(week => week.riskDays.length > 2);
    if (highRiskWeeks.length > 0) {
      recommendations.push({
        id: `rec_${Date.now()}_overload`,
        type: 'risk-mitigation',
        priority: 'high',
        title: '容量超過リスクの回避',
        description: `${highRiskWeeks.length}週間で容量超過が予想されます。タスクの前倒しまたは延期を検討してください。`,
        actionable: true,
        estimatedBenefit: '破綻リスク60%削減',
        estimatedEffort: '30分の調整作業'
      });
    }

    // 前倒し推奨
    const earlyTasks = weeks.flatMap(week => week.adjustmentSuggestions.tasksToMoveEarlier);
    if (earlyTasks.length > 0) {
      recommendations.push({
        id: `rec_${Date.now()}_early`,
        type: 'task-scheduling',
        priority: 'medium',
        title: 'タスクの前倒し実行',
        description: `${earlyTasks.length}個のタスクを前倒しすることで、将来の負荷を軽減できます。`,
        actionable: true,
        estimatedBenefit: '将来負荷30%削減',
        estimatedEffort: '15分の再配置作業',
        relatedTaskIds: earlyTasks
      });
    }

    // バーンアウト対策
    if (riskAlerts.burnoutRisk === 'high' || riskAlerts.burnoutRisk === 'critical') {
      recommendations.push({
        id: `rec_${Date.now()}_burnout`,
        type: 'workload-balance',
        priority: 'urgent',
        title: 'バーンアウトリスク軽減',
        description: '継続的な高負荷が検出されました。休息時間の確保と作業量の調整をお勧めします。',
        actionable: true,
        estimatedBenefit: 'ストレス50%軽減',
        estimatedEffort: '作業スケジュール見直し'
      });
    }

    // 容量活用最適化
    const underutilizedWeeks = weeks.filter(week => week.availableCapacity > 0.4);
    if (underutilizedWeeks.length > 0) {
      recommendations.push({
        id: `rec_${Date.now()}_efficiency`,
        type: 'capacity-adjustment',
        priority: 'low',
        title: '容量の有効活用',
        description: `${underutilizedWeeks.length}週間で余剰容量があります。前倒し作業で将来の負荷を軽減できます。`,
        actionable: true,
        estimatedBenefit: '全体効率20%向上',
        estimatedEffort: '軽微なスケジュール調整'
      });
    }

    return recommendations;
  }

  // ========== ヘルパーメソッド ==========

  private predictNewTasks(weekOffset: number, historicalData: HistoricalData[]): TaskWithWeight[] {
    // 履歴データから新規タスクを予測（簡略化）
    if (historicalData.length === 0) return [];

    const avgTasksPerWeek = historicalData.reduce((sum, data) => 
      sum + data.metrics.averageTasksPerWeek, 0) / historicalData.length;

    // 週が進むにつれて予測不確実性が増加
    const uncertaintyFactor = 1 + (weekOffset - 1) * 0.2;
    const expectedTaskCount = Math.round(avgTasksPerWeek * uncertaintyFactor);

    // ダミータスク生成（実際は詳細な予測モデル）
    const newTasks: TaskWithWeight[] = [];
    for (let i = 0; i < expectedTaskCount; i++) {
      newTasks.push({
        id: `predicted_${weekOffset}_${i}`,
        taskId: `predicted_${weekOffset}_${i}`,
        taskTitle: `予測タスク ${i + 1}`,
        estimatedWeight: Math.floor(Math.random() * 5) + 3, // 3-7
        estimatedDuration: Math.floor(Math.random() * 90) + 30, // 30-120分
        estimatedDays: 1,
        complexityLevel: 'medium',
        canSplit: true,
        splitMinimumDuration: 30,
        dependsOnTasks: [],
        blocksOtherTasks: [],
        urgencyScore: Math.floor(Math.random() * 5) + 3,
        importanceScore: Math.floor(Math.random() * 5) + 3,
        priorityMatrix: 'not-urgent-important',
        energyRequirement: 'medium',
        creativityRequirement: 'medium',
        focusRequirement: 'medium',
        collaborationNeeded: false,
        resourcesNeeded: [],
        optimalTimeOfDay: 'flexible',
        optimalEnvironment: 'flexible',
        interruptionTolerance: 'medium',
        deadlineBuffer: 1,
        riskLevel: 'medium',
        status: 'TODO',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return newTasks;
  }

  private estimateAdditionalWorkload(expectedTasks: TaskWithWeight[], dateStr: string): number {
    // その日に配置される可能性のあるタスクの予想時間
    const dailyPortion = expectedTasks.length > 0 ? 
      expectedTasks.reduce((sum, task) => sum + task.estimatedDuration, 0) / (7 * expectedTasks.length) : 0;
    
    return dailyPortion / 60; // 分から時間に変換
  }

  private predictEnergyLevel(dateStr: string, utilizationRate: number, taskCount: number): DailyCapacityBreakdown['energyLevel'] {
    // 利用率とタスク数からエネルギーレベルを予測
    if (utilizationRate > 0.9 || taskCount > 6) return 'low';
    if (utilizationRate > 0.7 || taskCount > 3) return 'medium';
    return 'high';
  }

  private calculateTaskIncreaseRate(recentData: HistoricalData[]): number {
    if (recentData.length < 2) return 0.1;

    const firstPeriod = recentData[0].metrics.averageTasksPerWeek;
    const lastPeriod = recentData[recentData.length - 1].metrics.averageTasksPerWeek;

    return firstPeriod > 0 ? (lastPeriod - firstPeriod) / firstPeriod : 0.1;
  }

  private analyzeSeasonalFactors(externalFactors: ExternalFactor[]): number {
    const seasonalFactors = externalFactors.filter(factor => factor.type === 'seasonal');
    
    if (seasonalFactors.length === 0) return 1.0;

    const avgImpact = seasonalFactors.reduce((sum, factor) => sum + factor.impact, 0) / seasonalFactors.length;
    return 1.0 + avgImpact * 0.5; // 影響を50%に調整
  }

  private analyzePersonalEventImpact(externalFactors: ExternalFactor[]): number {
    const personalFactors = externalFactors.filter(factor => factor.type === 'personal');
    
    if (personalFactors.length === 0) return 1.0;

    const avgImpact = personalFactors.reduce((sum, factor) => sum + Math.abs(factor.impact), 0) / personalFactors.length;
    return 1.0 + avgImpact * 0.3; // 影響を30%に調整
  }

  private determineWorkloadPattern(historicalData: HistoricalData[]): FuturePrediction['monthlyTrends']['workloadPattern'] {
    if (historicalData.length < 3) return 'stable';

    const taskCounts = historicalData.map(data => data.metrics.averageTasksPerWeek);
    const trend = this.calculateTrend(taskCounts);

    if (trend > 0.2) return 'increasing';
    if (trend < -0.2) return 'decreasing';
    if (this.isCyclical(taskCounts)) return 'cyclical';
    return 'stable';
  }

  private calculateRiskLevel(count: number, type: string): FuturePrediction['riskAlerts']['overloadRisk'] {
    const thresholds = {
      overload: { low: 2, medium: 5, high: 8 },
      burnout: { low: 1, medium: 3, high: 5 }
    };

    const threshold = thresholds[type as keyof typeof thresholds] || thresholds.overload;

    if (count >= threshold.high) return 'critical';
    if (count >= threshold.medium) return 'high';
    if (count >= threshold.low) return 'medium';
    return 'low';
  }

  private checkConsecutiveHighLoad(weeks: CapacityPrediction[]): number {
    let consecutive = 0;
    let maxConsecutive = 0;

    for (const week of weeks) {
      if (week.riskDays.length > 2) {
        consecutive++;
        maxConsecutive = Math.max(maxConsecutive, consecutive);
      } else {
        consecutive = 0;
      }
    }

    return maxConsecutive;
  }

  private calculateBurnoutRisk(
    criticalDays: number, 
    consecutiveWeeks: number, 
    trends: FuturePrediction['monthlyTrends']
  ): FuturePrediction['riskAlerts']['burnoutRisk'] {
    let risk = 'low' as FuturePrediction['riskAlerts']['burnoutRisk'];

    if (criticalDays > 5 || consecutiveWeeks > 2) risk = 'high';
    else if (criticalDays > 2 || consecutiveWeeks > 1) risk = 'medium';

    // トレンド調整
    if (trends.workloadPattern === 'increasing' && trends.expectedTaskIncrease > 0.3) {
      risk = risk === 'low' ? 'medium' : risk === 'medium' ? 'high' : 'critical';
    }

    return risk;
  }

  private assessDeadlineMissRisk(tasks: TaskWithWeight[], weeks: CapacityPrediction[]): FuturePrediction['riskAlerts']['deadlineMissRisk'] {
    const urgentTasks = tasks.filter(task => 
      task.priorityMatrix === 'urgent-important' || task.priorityMatrix === 'urgent-not-important'
    );

    const overloadedWeeks = weeks.filter(week => week.criticalDays.length > 0).length;

    if (urgentTasks.length > 3 && overloadedWeeks > 1) return 'high';
    if (urgentTasks.length > 1 || overloadedWeeks > 0) return 'medium';
    return 'low';
  }

  private assessResourceConflictRisk(weeks: CapacityPrediction[]): FuturePrediction['riskAlerts']['resourceConflictRisk'] {
    // 簡略化: 高負荷週の数に基づく
    const highLoadWeeks = weeks.filter(week => week.availableCapacity < 0.2).length;
    
    if (highLoadWeeks > 2) return 'high';
    if (highLoadWeeks > 0) return 'medium';
    return 'low';
  }

  private generateAdjustmentSuggestions(
    dailyBreakdown: DailyCapacityBreakdown[],
    currentTasks: TaskWithWeight[],
    scheduledTasks: ScheduledTask[]
  ): CapacityPrediction['adjustmentSuggestions'] {
    const overloadedDays = dailyBreakdown.filter(day => day.capacityStatus === 'overloaded');
    const underutilizedDays = dailyBreakdown.filter(day => day.capacityStatus === 'underutilized');

    // 前倒し推奨タスク
    const tasksToMoveEarlier = currentTasks
      .filter(task => task.canSplit || task.estimatedDuration <= 60)
      .slice(0, 3)
      .map(task => task.taskId);

    // 延期推奨タスク
    const tasksToDefer = scheduledTasks
      .filter(task => task.task.priorityMatrix === 'not-urgent-not-important')
      .slice(0, 2)
      .map(task => task.task.taskId);

    // 最適作業日
    const optimalWorkDays = dailyBreakdown
      .filter(day => day.capacityStatus === 'optimal')
      .map(day => day.date);

    return {
      tasksToMoveEarlier,
      tasksToDefer,
      optimalWorkDays
    };
  }

  private generateWeeklyRecommendations(dailyBreakdown: DailyCapacityBreakdown[], riskDays: string[]): string[] {
    const recommendations: string[] = [];

    if (riskDays.length > 2) {
      recommendations.push('この週は高負荷が予想されます。タスクの分散を検討してください');
    }

    const overloadedDays = dailyBreakdown.filter(day => day.capacityStatus === 'overloaded');
    if (overloadedDays.length > 0) {
      recommendations.push(`${overloadedDays.length}日間で容量超過が予想されます。重要でないタスクの調整を推奨`);
    }

    const underutilizedDays = dailyBreakdown.filter(day => day.capacityStatus === 'underutilized');
    if (underutilizedDays.length > 2) {
      recommendations.push('余剰容量があります。将来のタスクを前倒しして実行することをお勧めします');
    }

    return recommendations;
  }

  private calculatePredictionAccuracy(historicalData: HistoricalData[]): FuturePrediction['predictionAccuracy'] {
    if (historicalData.length === 0) {
      return {
        historicalAccuracy: 0.5,
        confidenceLevel: 0.6,
        dataQuality: 'poor'
      };
    }

    const baseAccuracy = 0.75;
    const experienceBonus = Math.min(historicalData.length / 12, 0.2); // 12ヶ月で最大20%ボーナス
    const historicalAccuracy = Math.min(baseAccuracy + experienceBonus, 0.95);

    const confidenceLevel = historicalAccuracy * 0.9; // 予測は実績より若干低い信頼度

    let dataQuality: FuturePrediction['predictionAccuracy']['dataQuality'];
    if (historicalData.length >= 6) dataQuality = 'excellent';
    else if (historicalData.length >= 3) dataQuality = 'good';
    else if (historicalData.length >= 1) dataQuality = 'fair';
    else dataQuality = 'poor';

    return {
      historicalAccuracy,
      confidenceLevel,
      dataQuality
    };
  }

  // ユーティリティメソッド
  private calculateSlotDuration(startTime: string, endTime: string): number {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    return firstAvg > 0 ? (secondAvg - firstAvg) / firstAvg : 0;
  }

  private isCyclical(values: number[]): boolean {
    // 簡単な周期性検査（実際はより複雑なアルゴリズムが必要）
    if (values.length < 4) return false;
    
    const variance = this.calculateVariance(values);
    return variance > values.reduce((sum, val) => sum + val, 0) / values.length * 0.5;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }
}