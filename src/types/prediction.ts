// ウエイト・リソースベース自動スケジューリング - 先読み予測システム型定義
// 将来の容量逼迫・破綻リスクを事前予測し、前倒し配置による破綻回避を実現

export interface FuturePrediction {
  id: string;
  userId: string;
  predictionDate: string; // 予測実行日
  
  // 週次容量予測 - 4週間先まで
  weeklyCapacityPrediction: {
    week1: CapacityPrediction;
    week2: CapacityPrediction;
    week3: CapacityPrediction;
    week4: CapacityPrediction;
  };
  
  // 月次トレンド分析
  monthlyTrends: {
    expectedTaskIncrease: number;   // 予想タスク増加率 (-0.5 to 2.0)
    seasonalFactors: number;        // 季節要因 (0.5 to 1.5)
    personalEventImpact: number;    // 個人イベント影響 (0.8 to 1.3)
    workloadPattern: 'increasing' | 'stable' | 'decreasing' | 'cyclical';
  };
  
  // リスクアラート
  riskAlerts: {
    overloadRisk: 'low' | 'medium' | 'high' | 'critical';
    burnoutRisk: 'low' | 'medium' | 'high' | 'critical';
    deadlineMissRisk: 'low' | 'medium' | 'high' | 'critical';
    resourceConflictRisk: 'low' | 'medium' | 'high' | 'critical';
  };
  
  // 推奨アクション
  recommendations: RecommendationItem[];
  
  // 予測精度・信頼性
  predictionAccuracy: {
    historicalAccuracy: number;     // 過去の予測精度 0-1
    confidenceLevel: number;        // 信頼度 0-1
    dataQuality: 'poor' | 'fair' | 'good' | 'excellent';
  };
  
  calculatedAt: string;
  validUntil: string; // 予測有効期限
}

export interface CapacityPrediction {
  weekNumber: number;             // 週番号
  weekStartDate: string;          // 週開始日
  weekEndDate: string;            // 週終了日
  
  // 容量分析
  availableCapacity: number;      // 利用可能容量% (0-1)
  scheduledWeight: number;        // 既定ウエイト
  flexibleWeight: number;         // 調整可能ウエイト
  reservedCapacity: number;       // 予約済み容量%
  
  // 日別詳細
  dailyBreakdown: DailyCapacityBreakdown[];
  
  // リスク日
  riskDays: string[];            // リスクの高い日付配列
  criticalDays: string[];        // 破綻可能性の高い日付配列
  
  // 推奨アクション
  recommendedActions: string[];   // その週の推奨アクション
  
  // 調整提案
  adjustmentSuggestions: {
    tasksToMoveEarlier: string[];  // 前倒し推奨タスクID
    tasksToDefer: string[];        // 延期推奨タスクID
    optimalWorkDays: string[];     // 最適作業日
  };
}

export interface DailyCapacityBreakdown {
  date: string;
  dayOfWeek: string;
  availableHours: number;         // 利用可能時間
  scheduledHours: number;         // 既定作業時間
  utilizationRate: number;        // 利用率 0-1
  capacityStatus: 'underutilized' | 'optimal' | 'near-limit' | 'overloaded';
  conflictingEvents: number;      // 衝突イベント数
  energyLevel: 'low' | 'medium' | 'high'; // 予想エネルギーレベル
}

export interface RecommendationItem {
  id: string;
  type: 'task-scheduling' | 'capacity-adjustment' | 'risk-mitigation' | 'workload-balance';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  actionable: boolean;            // 実行可能か
  estimatedBenefit: string;       // 推定効果
  estimatedEffort: string;        // 推定工数
  dueBy?: string;                // 実行期限
  relatedTaskIds?: string[];      // 関連タスクID
}

// 予測パラメータ設定
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

// 容量状態計算
export function calculateCapacityStatus(utilizationRate: number): DailyCapacityBreakdown['capacityStatus'] {
  if (utilizationRate < 0.5) return 'underutilized';
  if (utilizationRate < 0.8) return 'optimal';
  if (utilizationRate < 1.0) return 'near-limit';
  return 'overloaded';
}

// リスクレベル計算
export function calculateRiskLevel(
  utilizationRate: number,
  conflictCount: number,
  energyLevel: DailyCapacityBreakdown['energyLevel']
): FuturePrediction['riskAlerts']['overloadRisk'] {
  let riskScore = 0;
  
  // 利用率ベース
  if (utilizationRate > 1.2) riskScore += 3;
  else if (utilizationRate > 1.0) riskScore += 2;
  else if (utilizationRate > 0.8) riskScore += 1;
  
  // 衝突ベース
  if (conflictCount > 3) riskScore += 2;
  else if (conflictCount > 1) riskScore += 1;
  
  // エネルギーレベルベース
  if (energyLevel === 'low') riskScore += 1;
  
  if (riskScore >= 5) return 'critical';
  if (riskScore >= 3) return 'high';
  if (riskScore >= 1) return 'medium';
  return 'low';
}

// 予測精度計算
export function calculatePredictionAccuracy(
  historicalPredictions: FuturePrediction[],
  actualOutcomes: any[]
): number {
  if (historicalPredictions.length === 0 || actualOutcomes.length === 0) {
    return 0.5; // デフォルト精度
  }
  
  // 簡略化した精度計算
  // 実際の実装では、予測値と実績値の差異を詳細分析
  const baseAccuracy = 0.75;
  const experienceBonus = Math.min(historicalPredictions.length / 50, 0.2);
  
  return Math.min(baseAccuracy + experienceBonus, 0.95);
}

// 推奨アクション生成
export function generateRecommendations(
  capacityPredictions: CapacityPrediction[],
  riskAlerts: FuturePrediction['riskAlerts'],
  userPreferences?: any
): RecommendationItem[] {
  const recommendations: RecommendationItem[] = [];
  
  // 高リスク週の対応
  const highRiskWeeks = capacityPredictions.filter(week => 
    week.dailyBreakdown.some(day => day.capacityStatus === 'overloaded')
  );
  
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
  
  // 前倒し可能タスクの提案
  const tasksToMoveEarlier = capacityPredictions
    .flatMap(week => week.adjustmentSuggestions.tasksToMoveEarlier)
    .filter((taskId, index, array) => array.indexOf(taskId) === index);
    
  if (tasksToMoveEarlier.length > 0) {
    recommendations.push({
      id: `rec_${Date.now()}_early`,
      type: 'task-scheduling',
      priority: 'medium',
      title: 'タスクの前倒し実行',
      description: `${tasksToMoveEarlier.length}個のタスクを前倒しすることで、将来の負荷を軽減できます。`,
      actionable: true,
      estimatedBenefit: '将来負荷30%削減',
      estimatedEffort: '15分の再配置作業',
      relatedTaskIds: tasksToMoveEarlier
    });
  }
  
  // バーンアウトリスク対応
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
  
  // 効率改善の提案
  const underutilizedWeeks = capacityPredictions.filter(week =>
    week.availableCapacity > 0.3 && week.scheduledWeight < week.availableCapacity * 0.6
  );
  
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

// バリデーション関数
export function validateFuturePrediction(prediction: Partial<FuturePrediction>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 必須フィールドチェック
  if (!prediction.userId) {
    errors.push('ユーザーIDは必須です');
  }
  
  if (!prediction.predictionDate) {
    errors.push('予測日は必須です');
  }
  
  // 日付チェック
  if (prediction.predictionDate && prediction.validUntil) {
    const predictionDate = new Date(prediction.predictionDate);
    const validUntil = new Date(prediction.validUntil);
    
    if (validUntil <= predictionDate) {
      errors.push('有効期限は予測日より後である必要があります');
    }
  }
  
  // 容量予測チェック
  if (prediction.weeklyCapacityPrediction) {
    const weeks = Object.values(prediction.weeklyCapacityPrediction);
    weeks.forEach((week, index) => {
      if (week.availableCapacity < 0 || week.availableCapacity > 1) {
        warnings.push(`第${index + 1}週の利用可能容量が範囲外です (0-1)`);
      }
      
      if (week.scheduledWeight < 0) {
        warnings.push(`第${index + 1}週の既定ウエイトが負の値です`);
      }
    });
  }
  
  // 予測精度チェック
  if (prediction.predictionAccuracy) {
    const accuracy = prediction.predictionAccuracy;
    
    if (accuracy.historicalAccuracy < 0 || accuracy.historicalAccuracy > 1) {
      warnings.push('過去の予測精度は0-1の範囲である必要があります');
    }
    
    if (accuracy.confidenceLevel < 0 || accuracy.confidenceLevel > 1) {
      warnings.push('信頼度は0-1の範囲である必要があります');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// 予測結果作成ヘルパー
export function createFuturePrediction(
  userId: string,
  parameters: PredictionParameters,
  capacityData: any[], // 実際の容量データ
  customSettings?: Partial<FuturePrediction>
): FuturePrediction {
  const now = new Date();
  const predictionDate = now.toISOString().split('T')[0];
  const validUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 1週間有効
  
  // 週次容量予測を生成（簡略化）
  const weeklyCapacityPrediction = {
    week1: createWeeklyCapacity(1, now),
    week2: createWeeklyCapacity(2, now),
    week3: createWeeklyCapacity(3, now),
    week4: createWeeklyCapacity(4, now)
  };
  
  // リスクアラート計算
  const riskAlerts = calculateOverallRisk(weeklyCapacityPrediction);
  
  // 推奨アクション生成
  const recommendations = generateRecommendations(
    Object.values(weeklyCapacityPrediction),
    riskAlerts
  );
  
  return {
    id: `prediction_${userId}_${Date.now()}`,
    userId,
    predictionDate,
    weeklyCapacityPrediction,
    monthlyTrends: {
      expectedTaskIncrease: 0.1, // 10%増加予想
      seasonalFactors: 1.0,       // 季節要因なし
      personalEventImpact: 1.0,   // 個人イベント影響なし
      workloadPattern: 'stable'
    },
    riskAlerts,
    recommendations,
    predictionAccuracy: {
      historicalAccuracy: 0.75,
      confidenceLevel: 0.8,
      dataQuality: 'good'
    },
    calculatedAt: now.toISOString(),
    validUntil,
    ...customSettings
  };
}

// 週次容量予測作成ヘルパー
function createWeeklyCapacity(weekOffset: number, baseDate: Date): CapacityPrediction {
  const weekStart = new Date(baseDate);
  weekStart.setDate(weekStart.getDate() + (weekOffset - 1) * 7);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  // 簡略化した日別予測
  const dailyBreakdown: DailyCapacityBreakdown[] = [];
  for (let day = 0; day < 7; day++) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + day);
    
    const utilizationRate = 0.6 + Math.random() * 0.4; // 60-100%
    
    dailyBreakdown.push({
      date: date.toISOString().split('T')[0],
      dayOfWeek: date.toLocaleDateString('ja-JP', { weekday: 'long' }),
      availableHours: 8,
      scheduledHours: utilizationRate * 8,
      utilizationRate,
      capacityStatus: calculateCapacityStatus(utilizationRate),
      conflictingEvents: Math.floor(Math.random() * 3),
      energyLevel: utilizationRate > 0.8 ? 'low' : 'medium'
    });
  }
  
  return {
    weekNumber: weekOffset,
    weekStartDate: weekStart.toISOString().split('T')[0],
    weekEndDate: weekEnd.toISOString().split('T')[0],
    availableCapacity: 0.8,
    scheduledWeight: 12,
    flexibleWeight: 8,
    reservedCapacity: 0.15,
    dailyBreakdown,
    riskDays: dailyBreakdown
      .filter(day => day.capacityStatus === 'overloaded')
      .map(day => day.date),
    criticalDays: dailyBreakdown
      .filter(day => day.utilizationRate > 1.2)
      .map(day => day.date),
    recommendedActions: ['軽いタスクを前倒し', '重いタスクを分割検討'],
    adjustmentSuggestions: {
      tasksToMoveEarlier: [],
      tasksToDefer: [],
      optimalWorkDays: dailyBreakdown
        .filter(day => day.capacityStatus === 'optimal')
        .map(day => day.date)
    }
  };
}

// 全体リスク計算ヘルパー
function calculateOverallRisk(weeklyPredictions: Record<string, CapacityPrediction>): FuturePrediction['riskAlerts'] {
  const weeks = Object.values(weeklyPredictions);
  
  const overloadDays = weeks.flatMap(week => week.riskDays).length;
  const criticalDays = weeks.flatMap(week => week.criticalDays).length;
  
  return {
    overloadRisk: overloadDays > 5 ? 'high' : overloadDays > 2 ? 'medium' : 'low',
    burnoutRisk: criticalDays > 3 ? 'high' : criticalDays > 1 ? 'medium' : 'low',
    deadlineMissRisk: overloadDays > 3 ? 'medium' : 'low',
    resourceConflictRisk: 'low'
  };
}