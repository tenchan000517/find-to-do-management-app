// ウエイト・リソースベース自動スケジューリング - リソース制約エンジン
// ユーザーリソースプロファイル解析・個人予定統合・制約違反チェック・利用可能時間枠計算

import { UserResourceProfile } from '@/types/resource-profile';
import { TaskWeightProfile } from '@/types/task-weight';

// 外部依存型（他のファイルで定義されている型を想定）
interface PersonalSchedule {
  id: string;
  date: string;
  time: string;
  endTime?: string;
  title: string;
  type: 'personal' | 'work' | 'family' | 'other';
}

interface CalendarEvent {
  id: string;
  startTime: string;
  endTime?: string;
  title: string;
  type?: string;
}

// 時間枠型定義
export interface TimeSlot {
  startTime: string;          // "HH:MM" 形式
  endTime: string;            // "HH:MM" 形式
  availableWeight: number;    // この時間枠で処理可能なウエイト
  slotType: 'light' | 'heavy' | 'mixed';
  energyLevel: 'high' | 'medium' | 'low';
  isOptimal: boolean;         // ユーザーの生産性時間帯か
  conflictRisk: 'none' | 'low' | 'medium' | 'high';
}

// タスク配置可能性判定結果
export interface TaskPlacementResult {
  canPlace: boolean;
  score: number;              // 0-100 (適合度)
  reasons: string[];          // 配置可能/不可能な理由
  suggestions: string[];      // 改善提案
  alternativeSlots?: TimeSlot[]; // 代替時間枠
}

// 日次容量状況
export interface DailyCapacityStatus {
  date: string;
  totalAvailableHours: number;
  scheduledHours: number;
  remainingHours: number;
  
  weightCapacity: {
    totalLimit: number;
    scheduled: number;
    remaining: number;
    utilizationRate: number;  // 0-1
  };
  
  taskSlots: {
    lightSlots: { total: number; used: number; remaining: number };
    heavySlots: { total: number; used: number; remaining: number };
  };
  
  riskAssessment: {
    overloadRisk: 'low' | 'medium' | 'high' | 'critical';
    feasibilityScore: number; // 0-100
    recommendations: string[];
  };
}

// タスクと重み情報の結合型
export interface TaskWithWeight extends TaskWeightProfile {
  taskTitle: string;
  taskDescription?: string;
  dueDate?: string;
  status: string;
}

export class ResourceConstraintEngine {
  constructor(
    private userProfile: UserResourceProfile,
    private personalSchedules: PersonalSchedule[] = [],
    private calendarEvents: CalendarEvent[] = []
  ) {}

  /**
   * 指定日の利用可能時間枠を計算
   */
  calculateAvailableSlots(date: string): TimeSlot[] {
    const unavailableSlots = this.getUnavailableSlots(date);
    const workingHours = this.getWorkingHours();
    const productiveHours = this.userProfile.workingPattern.productiveHours;
    
    const availableSlots: TimeSlot[] = [];
    
    // 1時間単位で利用可能性をチェック (6:00-23:00)
    for (let hour = 6; hour < 23; hour++) {
      const timeSlot = this.formatHour(hour);
      const endTimeSlot = this.formatHour(hour + 1);
      
      if (this.isSlotAvailable(timeSlot, endTimeSlot, unavailableSlots, workingHours)) {
        const energyLevel = this.calculateEnergyLevel(timeSlot, productiveHours);
        const availableWeight = this.calculateAvailableWeight(energyLevel);
        const isOptimal = this.isOptimalTime(timeSlot, productiveHours);
        const conflictRisk = this.assessConflictRisk(timeSlot, date);
        
        availableSlots.push({
          startTime: timeSlot,
          endTime: endTimeSlot,
          availableWeight,
          slotType: this.determineSlotType(availableWeight),
          energyLevel,
          isOptimal,
          conflictRisk
        });
      }
    }
    
    return this.mergeConsecutiveSlots(availableSlots);
  }

  /**
   * タスクが指定時間枠に配置可能かチェック
   */
  canScheduleTask(
    task: TaskWithWeight,
    timeSlot: TimeSlot,
    date: string,
    existingTasks: TaskWithWeight[] = [],
    skipAlternatives: boolean = false // 無限ループ防止フラグ
  ): TaskPlacementResult {
    const reasons: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // 1. ウエイト制約チェック
    if (task.estimatedWeight > timeSlot.availableWeight) {
      score -= 50;
      reasons.push(`ウエイト超過: タスク${task.estimatedWeight} > 枠${timeSlot.availableWeight}`);
      suggestions.push('タスクを分割するか、より大きな時間枠を選択してください');
    }

    // 2. 時間制約チェック
    const slotDuration = this.calculateSlotDuration(timeSlot.startTime, timeSlot.endTime);
    if (task.estimatedDuration > slotDuration) {
      score -= 30;
      reasons.push(`時間不足: ${task.estimatedDuration}分 > ${slotDuration}分`);
      if (task.canSplit) {
        suggestions.push('タスクを分割して複数の時間枠に配置可能です');
        score += 15; // 分割可能なら回復
      } else {
        suggestions.push('より長い時間枠を選択してください');
      }
    }

    // 3. エネルギー要求チェック
    if (task.energyRequirement === 'high' && timeSlot.energyLevel === 'low') {
      score -= 25;
      reasons.push('エネルギー不足: 高エネルギー要求タスクを低エネルギー時間に配置');
      suggestions.push('午前中やエネルギーレベルの高い時間帯への配置を推奨');
    }

    // 4. 集中力要求チェック
    if (task.focusRequirement === 'high' && this.userProfile.workingPattern.focusCapacity === 'low') {
      score -= 20;
      reasons.push('集中力要求過多: ユーザーの集中力キャパシティを超過');
      suggestions.push('集中を要するタスクは最も集中できる時間帯に配置してください');
    }

    // 5. 最適時間帯チェック
    if (task.optimalTimeOfDay !== 'flexible' && !this.isOptimalTimeOfDay(timeSlot.startTime, task.optimalTimeOfDay)) {
      score -= 15;
      reasons.push(`非最適時間: ${task.optimalTimeOfDay}推奨タスクを${this.getTimeOfDay(timeSlot.startTime)}に配置`);
      suggestions.push(`${task.optimalTimeOfDay}の時間帯への配置を検討してください`);
    }

    // 6. 中断耐性チェック
    if (task.interruptionTolerance === 'low' && timeSlot.conflictRisk === 'high') {
      score -= 20;
      reasons.push('中断リスク: 中断に敏感なタスクを中断リスクの高い時間に配置');
      suggestions.push('より静かで中断の少ない時間帯を選択してください');
    }

    // 7. 依存関係チェック
    const blockedByTasks = existingTasks.filter(existingTask => 
      task.dependsOnTasks.includes(existingTask.taskId) && 
      existingTask.status !== 'COMPLETE'
    );
    
    if (blockedByTasks.length > 0) {
      score -= 40;
      reasons.push(`依存関係未解決: ${blockedByTasks.length}個の前提タスクが未完了`);
      suggestions.push('依存するタスクを先に完了させる必要があります');
    }

    // 8. 協力要求チェック
    if (task.collaborationNeeded) {
      const timeOfDay = this.getTimeOfDay(timeSlot.startTime);
      if (timeOfDay === 'evening' || timeOfDay === 'early-morning') {
        score -= 15;
        reasons.push('協力困難時間: 他者との協力が必要なタスクを非営業時間に配置');
        suggestions.push('営業時間内での配置を推奨します');
      }
    }

    // 9. リソース要求チェック
    if (task.resourcesNeeded.length > 0) {
      // 簡略化: 特定リソースが利用困難な時間をチェック
      const unavailableResources = this.checkResourceAvailability(task.resourcesNeeded, timeSlot, date);
      if (unavailableResources.length > 0) {
        score -= 10;
        reasons.push(`リソース不足: ${unavailableResources.join(', ')}が利用困難`);
        suggestions.push('必要リソースが利用可能な時間帯への変更を検討してください');
      }
    }

    // 10. ボーナス要因
    if (timeSlot.isOptimal) {
      score += 10;
      reasons.push('最適時間帯: ユーザーの生産性の高い時間帯');
    }

    if (timeSlot.energyLevel === task.energyRequirement) {
      score += 5;
      reasons.push('エネルギーマッチ: 要求エネルギーと時間枠が一致');
    }

    // スコア正規化
    score = Math.max(0, Math.min(100, score));

    // 代替時間枠の提案（無限ループ防止）
    const alternativeSlots = (!skipAlternatives && score < 70) ? 
      this.findAlternativeSlots(task, date, existingTasks) : undefined;

    return {
      canPlace: score >= 50, // 50点以上で配置可能
      score,
      reasons,
      suggestions,
      alternativeSlots
    };
  }

  /**
   * 日次容量制限チェック
   */
  checkDailyCapacity(date: string, scheduledTasks: TaskWithWeight[]): DailyCapacityStatus {
    const dailyCapacity = this.userProfile.dailyCapacity;
    const timeConstraints = this.userProfile.timeConstraints;
    
    // 既定タスクの分析
    const lightTasksCount = scheduledTasks.filter(t => t.estimatedWeight <= 3).length;
    const heavyTasksCount = scheduledTasks.filter(t => t.estimatedWeight > 6).length;
    const totalWeight = scheduledTasks.reduce((sum, t) => sum + t.estimatedWeight, 0);
    const totalDuration = scheduledTasks.reduce((sum, t) => sum + t.estimatedDuration, 0);

    // 利用可能時間計算
    const availableSlots = this.calculateAvailableSlots(date);
    const totalAvailableHours = availableSlots.reduce((sum, slot) => {
      return sum + this.calculateSlotDuration(slot.startTime, slot.endTime);
    }, 0) / 60; // 分から時間に変換

    const scheduledHours = totalDuration / 60;
    const remainingHours = Math.max(0, totalAvailableHours - scheduledHours);

    // 容量状況計算
    const weightUtilization = totalWeight / dailyCapacity.totalWeightLimit;
    const lightSlotsRemaining = Math.max(0, dailyCapacity.lightTaskSlots - lightTasksCount);
    const heavySlotsRemaining = Math.max(0, dailyCapacity.heavyTaskSlots - heavyTasksCount);

    // リスク評価
    let overloadRisk: DailyCapacityStatus['riskAssessment']['overloadRisk'] = 'low';
    const recommendations: string[] = [];
    
    if (weightUtilization > 1.0 || scheduledHours > timeConstraints.maxWorkingHours) {
      overloadRisk = 'critical';
      recommendations.push('容量超過: 緊急にタスクの再配置が必要です');
    } else if (weightUtilization > 0.9 || scheduledHours > timeConstraints.maxWorkingHours * 0.9) {
      overloadRisk = 'high';
      recommendations.push('容量限界近: 新規タスク追加は慎重に検討してください');
    } else if (weightUtilization > 0.7 || scheduledHours > timeConstraints.maxWorkingHours * 0.7) {
      overloadRisk = 'medium';
      recommendations.push('やや高負荷: 優先度の低いタスクの調整を検討してください');
    }

    if (lightSlotsRemaining === 0) {
      recommendations.push('軽タスク枠満杯: 重タスクの分割を検討してください');
    }

    if (heavySlotsRemaining === 0) {
      recommendations.push('重タスク枠満杯: 重要度に応じて他日への移動を検討してください');
    }

    // 実行可能性スコア算出
    const feasibilityScore = Math.max(0, Math.min(100, 
      100 - (weightUtilization - 1) * 100 - 
      Math.max(0, (scheduledHours - timeConstraints.maxWorkingHours) / timeConstraints.maxWorkingHours) * 50
    ));

    return {
      date,
      totalAvailableHours,
      scheduledHours,
      remainingHours,
      weightCapacity: {
        totalLimit: dailyCapacity.totalWeightLimit,
        scheduled: totalWeight,
        remaining: Math.max(0, dailyCapacity.totalWeightLimit - totalWeight),
        utilizationRate: weightUtilization
      },
      taskSlots: {
        lightSlots: {
          total: dailyCapacity.lightTaskSlots,
          used: lightTasksCount,
          remaining: lightSlotsRemaining
        },
        heavySlots: {
          total: dailyCapacity.heavyTaskSlots,
          used: heavyTasksCount,
          remaining: heavySlotsRemaining
        }
      },
      riskAssessment: {
        overloadRisk,
        feasibilityScore,
        recommendations
      }
    };
  }

  // ========== プライベートメソッド ==========

  private getUnavailableSlots(date: string): string[] {
    const unavailable: string[] = [];
    
    // 設定による利用不可時間
    unavailable.push(...this.userProfile.timeConstraints.unavailableHours);
    
    // 個人予定
    const dayPersonalSchedules = this.personalSchedules.filter(ps => ps.date === date);
    dayPersonalSchedules.forEach(ps => {
      if (ps.endTime) {
        unavailable.push(`${ps.time}-${ps.endTime}`);
      } else {
        // 終了時間未指定の場合は1時間と仮定
        const endTime = this.addHours(ps.time, 1);
        unavailable.push(`${ps.time}-${endTime}`);
      }
    });
    
    // カレンダーイベント
    const dayEvents = this.calendarEvents.filter(event => 
      new Date(event.startTime).toDateString() === new Date(date).toDateString()
    );
    dayEvents.forEach(event => {
      const startTime = new Date(event.startTime);
      const endTime = new Date(event.endTime || startTime.getTime() + 60 * 60 * 1000);
      unavailable.push(`${this.formatTime(startTime)}-${this.formatTime(endTime)}`);
    });
    
    return unavailable;
  }

  private getWorkingHours(): string[] {
    return this.userProfile.timeConstraints.preferredWorkHours;
  }

  private calculateEnergyLevel(timeSlot: string, productiveHours: string[]): TimeSlot['energyLevel'] {
    const hour = parseInt(timeSlot.split(':')[0]);
    
    // 生産性高い時間帯
    if (this.isOptimalTime(timeSlot, productiveHours)) {
      return 'high';
    }
    
    // 一般的なエネルギーパターン
    if (hour >= 9 && hour <= 11) return 'high';    // 午前中
    if (hour >= 14 && hour <= 16) return 'medium'; // 午後
    if (hour >= 19 && hour <= 21) return 'medium'; // 夜
    
    return 'low';
  }

  private calculateAvailableWeight(energyLevel: TimeSlot['energyLevel']): number {
    const baseWeight = this.userProfile.dailyCapacity.totalWeightLimit / 8; // 8時間で配分
    
    switch (energyLevel) {
      case 'high': return Math.round(baseWeight * 1.5);
      case 'medium': return Math.round(baseWeight);
      case 'low': return Math.round(baseWeight * 0.5);
      default: return Math.round(baseWeight);
    }
  }

  private determineSlotType(availableWeight: number): TimeSlot['slotType'] {
    if (availableWeight <= 3) return 'light';
    if (availableWeight >= 7) return 'heavy';
    return 'mixed';
  }

  private isSlotAvailable(
    startTime: string, 
    endTime: string, 
    unavailableSlots: string[], 
    workingHours: string[]
  ): boolean {
    // 利用不可時間との衝突チェック
    for (const unavailableSlot of unavailableSlots) {
      if (this.timeSlotsOverlap(startTime, endTime, unavailableSlot)) {
        return false;
      }
    }
    
    // 推奨作業時間帯チェック（完全に外れている場合は利用不可）
    if (workingHours.length > 0) {
      const isInWorkingHours = workingHours.some(workingHour => 
        this.timeSlotsOverlap(startTime, endTime, workingHour)
      );
      if (!isInWorkingHours) {
        return false;
      }
    }
    
    return true;
  }

  private isOptimalTime(timeSlot: string, productiveHours: string[]): boolean {
    return productiveHours.some(ph => this.isTimeInRange(timeSlot, ph));
  }

  private assessConflictRisk(timeSlot: string, date: string): TimeSlot['conflictRisk'] {
    // 簡略化: 曜日と時間帯ベースのリスク評価
    const dayOfWeek = new Date(date).getDay();
    const hour = parseInt(timeSlot.split(':')[0]);
    
    // 平日の営業時間は中断リスク高
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 9 && hour <= 17) {
      return 'high';
    }
    
    // 早朝・夜間は中断リスク低
    if (hour <= 8 || hour >= 20) {
      return 'low';
    }
    
    return 'medium';
  }

  private mergeConsecutiveSlots(slots: TimeSlot[]): TimeSlot[] {
    if (slots.length <= 1) return slots;
    
    const merged: TimeSlot[] = [];
    let current = { ...slots[0] };
    
    for (let i = 1; i < slots.length; i++) {
      const next = slots[i];
      
      // 連続していて、同じ特性なら結合
      if (current.endTime === next.startTime && 
          current.slotType === next.slotType && 
          current.energyLevel === next.energyLevel) {
        current.endTime = next.endTime;
        current.availableWeight += next.availableWeight;
      } else {
        merged.push(current);
        current = { ...next };
      }
    }
    
    merged.push(current);
    return merged;
  }

  private findAlternativeSlots(task: TaskWithWeight, date: string, existingTasks: TaskWithWeight[]): TimeSlot[] {
    // 無限ループ防止: 代替案検索は基本的な時間枠のみ返す
    const basicSlots = this.getBasicTimeSlots(date);
    
    return basicSlots
      .filter(slot => {
        // 無限ループ防止: skipAlternatives = true で代替案検索をスキップ
        const result = this.canScheduleTask(task, slot, date, existingTasks, true);
        return result.score > 70; // より高いスコアの枠のみ
      })
      .slice(0, 3); // 上位3つの代替案
  }

  /**
   * 基本的な時間枠を取得（無限ループ防止用）
   */
  private getBasicTimeSlots(date: string): TimeSlot[] {
    const workingHours = this.getWorkingHours();
    const basicSlots: TimeSlot[] = [];
    
    // 単純に1時間刻みの基本枠を作成
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      
      basicSlots.push({
        startTime,
        endTime,
        availableWeight: 5, // 基本容量
        slotType: 'mixed',
        energyLevel: 'medium',
        isOptimal: false,
        conflictRisk: 'low'
      });
    }
    
    return basicSlots;
  }

  private checkResourceAvailability(resources: string[], timeSlot: TimeSlot, date: string): string[] {
    // 簡略化: 特定時間帯に利用困難なリソースを返す
    const unavailable: string[] = [];
    const hour = parseInt(timeSlot.startTime.split(':')[0]);
    
    if (resources.includes('オフィス') && (hour < 8 || hour > 20)) {
      unavailable.push('オフィス');
    }
    
    if (resources.includes('会議室') && (hour < 9 || hour > 18)) {
      unavailable.push('会議室');
    }
    
    return unavailable;
  }

  private isOptimalTimeOfDay(timeSlot: string, optimalTime: TaskWeightProfile['optimalTimeOfDay']): boolean {
    const hour = parseInt(timeSlot.split(':')[0]);
    
    switch (optimalTime) {
      case 'morning': return hour >= 6 && hour < 12;
      case 'afternoon': return hour >= 12 && hour < 18;
      case 'evening': return hour >= 18 && hour < 24;
      case 'flexible': return true;
      default: return true;
    }
  }

  private getTimeOfDay(timeSlot: string): string {
    const hour = parseInt(timeSlot.split(':')[0]);
    
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 24) return 'evening';
    return 'early-morning';
  }

  // ========== ユーティリティメソッド ==========

  private formatHour(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`;
  }

  private formatTime(date: Date): string {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  private addHours(time: string, hours: number): string {
    const [h, m] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(h + hours, m);
    return this.formatTime(date);
  }

  private calculateSlotDuration(startTime: string, endTime: string): number {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    return endMinutes - startMinutes;
  }

  private timeSlotsOverlap(start1: string, end1: string, timeRange: string): boolean {
    const [rangeStart, rangeEnd] = timeRange.split('-');
    if (!rangeEnd) return false;
    
    const start1Minutes = this.timeToMinutes(start1);
    const end1Minutes = this.timeToMinutes(end1);
    const rangeStartMinutes = this.timeToMinutes(rangeStart);
    const rangeEndMinutes = this.timeToMinutes(rangeEnd);
    
    return start1Minutes < rangeEndMinutes && end1Minutes > rangeStartMinutes;
  }

  private isTimeInRange(time: string, range: string): boolean {
    const [rangeStart, rangeEnd] = range.split('-');
    if (!rangeEnd) return false;
    
    const timeMinutes = this.timeToMinutes(time);
    const rangeStartMinutes = this.timeToMinutes(rangeStart);
    const rangeEndMinutes = this.timeToMinutes(rangeEnd);
    
    return timeMinutes >= rangeStartMinutes && timeMinutes < rangeEndMinutes;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}