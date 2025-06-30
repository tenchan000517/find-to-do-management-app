// Phase 3: Advanced Anomaly Detection Engine
// 異常検知・予測分析エンジン

export interface AnomalyDetectionConfig {
  sensitivity: number; // 感度 (0.1 - 1.0)
  windowSize: number; // 分析ウィンドウサイズ (日数)
  threshold: number; // 異常判定閾値
}

export interface DataPoint {
  timestamp: string;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface AnomalyResult {
  timestamp: string;
  value: number;
  isAnomaly: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  expectedValue: number;
  deviation: number;
  context: {
    trend: 'increasing' | 'decreasing' | 'stable';
    seasonality: boolean;
    changePoint: boolean;
  };
}

export interface PredictionResult {
  timestamp: string;
  predictedValue: number;
  confidence: number;
  lowerBound: number;
  upperBound: number;
  influencingFactors: string[];
}

export class AnomalyDetectionEngine {
  private config: AnomalyDetectionConfig;

  constructor(config: Partial<AnomalyDetectionConfig> = {}) {
    this.config = {
      sensitivity: 0.7,
      windowSize: 30,
      threshold: 2.0,
      ...config
    };
  }

  /**
   * 統計的異常検知 (Z-score + IQR)
   */
  detectStatisticalAnomalies(data: DataPoint[]): AnomalyResult[] {
    if (data.length < 10) {
      return data.map(point => ({
        timestamp: point.timestamp,
        value: point.value,
        isAnomaly: false,
        severity: 'low' as const,
        confidence: 0,
        expectedValue: point.value,
        deviation: 0,
        context: {
          trend: 'stable' as const,
          seasonality: false,
          changePoint: false
        }
      }));
    }

    const values = data.map(d => d.value);
    const mean = this.calculateMean(values);
    const std = this.calculateStandardDeviation(values, mean);
    const q1 = this.calculatePercentile(values, 25);
    const q3 = this.calculatePercentile(values, 75);
    const iqr = q3 - q1;

    return data.map(point => {
      const zScore = Math.abs((point.value - mean) / std);
      const iqrScore = Math.abs(point.value - mean) / (iqr * 1.5);
      
      const isZAnomaly = zScore > this.config.threshold;
      const isIQRAnomaly = point.value < (q1 - 1.5 * iqr) || point.value > (q3 + 1.5 * iqr);
      
      const isAnomaly = isZAnomaly || isIQRAnomaly;
      const confidence = Math.max(zScore / 4, iqrScore) * this.config.sensitivity;
      
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (confidence > 0.8) severity = 'critical';
      else if (confidence > 0.6) severity = 'high';
      else if (confidence > 0.4) severity = 'medium';

      return {
        timestamp: point.timestamp,
        value: point.value,
        isAnomaly,
        severity,
        confidence: Math.min(confidence, 1),
        expectedValue: mean,
        deviation: Math.abs(point.value - mean),
        context: this.analyzeContext(data, data.indexOf(point))
      };
    });
  }

  /**
   * 時系列異常検知 (移動平均 + 変化点検出)
   */
  detectTimeSeriesAnomalies(data: DataPoint[]): AnomalyResult[] {
    if (data.length < this.config.windowSize) {
      return this.detectStatisticalAnomalies(data);
    }

    const results: AnomalyResult[] = [];
    const windowSize = Math.min(this.config.windowSize, data.length / 2);

    for (let i = windowSize; i < data.length; i++) {
      const window = data.slice(i - windowSize, i);
      const windowValues = window.map(d => d.value);
      const mean = this.calculateMean(windowValues);
      const std = this.calculateStandardDeviation(windowValues, mean);
      
      const currentValue = data[i].value;
      const deviation = Math.abs(currentValue - mean);
      const normalizedDeviation = std > 0 ? deviation / std : 0;
      
      // 変化点検出
      const recentTrend = this.calculateTrend(data.slice(i - 5, i));
      const historicalTrend = this.calculateTrend(window);
      const changePoint = Math.abs(recentTrend - historicalTrend) > 0.5;
      
      const isAnomaly = normalizedDeviation > this.config.threshold || changePoint;
      const confidence = Math.min(normalizedDeviation / 3, 1) * this.config.sensitivity;
      
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (confidence > 0.8 || changePoint) severity = 'critical';
      else if (confidence > 0.6) severity = 'high';
      else if (confidence > 0.4) severity = 'medium';

      results.push({
        timestamp: data[i].timestamp,
        value: currentValue,
        isAnomaly,
        severity,
        confidence,
        expectedValue: mean,
        deviation,
        context: {
          trend: recentTrend > 0.1 ? 'increasing' : recentTrend < -0.1 ? 'decreasing' : 'stable',
          seasonality: this.detectSeasonality(window),
          changePoint
        }
      });
    }

    return results;
  }

  /**
   * 売上予測モデル (線形回帰 + 季節性調整)
   */
  predictRevenue(historicalData: DataPoint[], daysAhead: number = 30): PredictionResult[] {
    if (historicalData.length < 14) {
      throw new Error('予測には最低14日分のデータが必要です');
    }

    const values = historicalData.map(d => d.value);
    const trend = this.calculateTrend(historicalData);
    const seasonality = this.calculateSeasonality(historicalData);
    const baseline = this.calculateMean(values.slice(-7)); // 直近7日の平均

    const predictions: PredictionResult[] = [];
    const lastDate = new Date(historicalData[historicalData.length - 1].timestamp);

    for (let i = 1; i <= daysAhead; i++) {
      const futureDate = new Date(lastDate);
      futureDate.setDate(lastDate.getDate() + i);
      
      // 基本予測値 (トレンド + ベースライン)
      const trendComponent = trend * i;
      const seasonalComponent = this.getSeasonalAdjustment(seasonality, i);
      const predictedValue = baseline + trendComponent + seasonalComponent;
      
      // 信頼区間の計算
      const uncertainty = Math.min(i * 0.1, 0.5); // 時間が経つほど不確実性が増加
      const confidence = Math.max(0.1, 1 - uncertainty);
      const errorMargin = predictedValue * uncertainty;
      
      predictions.push({
        timestamp: futureDate.toISOString(),
        predictedValue: Math.max(0, predictedValue),
        confidence,
        lowerBound: Math.max(0, predictedValue - errorMargin),
        upperBound: predictedValue + errorMargin,
        influencingFactors: this.getInfluencingFactors(historicalData, i)
      });
    }

    return predictions;
  }

  /**
   * タスク完了率予測
   */
  predictTaskCompletion(
    taskData: Array<{
      createdDate: string;
      completedDate?: string;
      priority: string;
      complexity: number;
    }>
  ): PredictionResult[] {
    const completionTimes = taskData
      .filter(task => task.completedDate)
      .map(task => {
        const created = new Date(task.createdDate);
        const completed = new Date(task.completedDate!);
        return {
          duration: (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24), // 日数
          priority: task.priority,
          complexity: task.complexity
        };
      });

    if (completionTimes.length < 5) {
      return [];
    }

    // 優先度・複雑度別の平均完了時間
    const avgCompletionTime = this.calculateMean(completionTimes.map(t => t.duration));
    const priorityFactors = this.calculatePriorityFactors(completionTimes);
    
    const predictions: PredictionResult[] = [];
    const incompleteTasks = taskData.filter(task => !task.completedDate);

    incompleteTasks.forEach(task => {
      const priorityFactor = priorityFactors[task.priority] || 1;
      const complexityFactor = task.complexity / 5; // 1-10 scale normalized
      
      const estimatedDays = avgCompletionTime * priorityFactor * complexityFactor;
      const confidence = Math.max(0.3, 1 - (complexityFactor * 0.3));
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + estimatedDays);
      
      predictions.push({
        timestamp: futureDate.toISOString(),
        predictedValue: estimatedDays,
        confidence,
        lowerBound: estimatedDays * 0.7,
        upperBound: estimatedDays * 1.5,
        influencingFactors: [
          `優先度: ${task.priority}`,
          `複雑度: ${task.complexity}/10`,
          `過去の平均: ${avgCompletionTime.toFixed(1)}日`
        ]
      });
    });

    return predictions.sort((a, b) => a.predictedValue - b.predictedValue);
  }

  /**
   * 顧客離反予測
   */
  predictCustomerChurn(
    customerData: Array<{
      customerId: string;
      lastActivity: string;
      totalValue: number;
      activityFrequency: number;
      supportTickets: number;
      paymentDelays: number;
    }>
  ): Array<{
    customerId: string;
    churnProbability: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    daysUntilChurn: number;
    recommendedActions: string[];
  }> {
    return customerData.map(customer => {
      const daysSinceLastActivity = (Date.now() - new Date(customer.lastActivity).getTime()) / (1000 * 60 * 60 * 24);
      
      // チャーンスコア計算
      let churnScore = 0;
      
      // 最終活動からの日数
      if (daysSinceLastActivity > 30) churnScore += 0.3;
      if (daysSinceLastActivity > 60) churnScore += 0.2;
      
      // 活動頻度
      if (customer.activityFrequency < 0.5) churnScore += 0.2;
      
      // サポートチケット数
      if (customer.supportTickets > 5) churnScore += 0.1;
      
      // 支払い遅延
      if (customer.paymentDelays > 2) churnScore += 0.2;
      
      // 取引額（低い場合はリスク）
      if (customer.totalValue < 10000) churnScore += 0.1;
      
      const churnProbability = Math.min(churnScore, 1);
      
      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      if (churnProbability > 0.8) riskLevel = 'critical';
      else if (churnProbability > 0.6) riskLevel = 'high';
      else if (churnProbability > 0.4) riskLevel = 'medium';
      else riskLevel = 'low';
      
      const daysUntilChurn = Math.max(7, 90 - (churnProbability * 90));
      
      const recommendedActions = this.getChurnPreventionActions(customer, churnProbability);
      
      return {
        customerId: customer.customerId,
        churnProbability,
        riskLevel,
        daysUntilChurn: Math.round(daysUntilChurn),
        recommendedActions
      };
    }).sort((a, b) => b.churnProbability - a.churnProbability);
  }

  // ヘルパーメソッド
  private calculateMean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateStandardDeviation(values: number[], mean: number): number {
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  private calculateTrend(data: DataPoint[]): number {
    if (data.length < 2) return 0;
    
    const values = data.map(d => d.value);
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  private calculateSeasonality(data: DataPoint[]): number[] {
    // 簡単な週次季節性の検出
    const weeklyAverages = new Array(7).fill(0);
    const weeklyCount = new Array(7).fill(0);
    
    data.forEach(point => {
      const dayOfWeek = new Date(point.timestamp).getDay();
      weeklyAverages[dayOfWeek] += point.value;
      weeklyCount[dayOfWeek]++;
    });
    
    return weeklyAverages.map((sum, i) => 
      weeklyCount[i] > 0 ? sum / weeklyCount[i] : 0
    );
  }

  private getSeasonalAdjustment(seasonality: number[], dayOffset: number): number {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + dayOffset);
    const dayOfWeek = futureDate.getDay();
    const overallMean = this.calculateMean(seasonality);
    return seasonality[dayOfWeek] - overallMean;
  }

  private detectSeasonality(data: DataPoint[]): boolean {
    if (data.length < 14) return false;
    
    const seasonality = this.calculateSeasonality(data);
    const variance = this.calculateStandardDeviation(seasonality, this.calculateMean(seasonality));
    return variance > (this.calculateMean(seasonality) * 0.1);
  }

  private analyzeContext(data: DataPoint[], index: number): {
    trend: 'increasing' | 'decreasing' | 'stable';
    seasonality: boolean;
    changePoint: boolean;
  } {
    const windowSize = Math.min(10, index);
    const window = data.slice(Math.max(0, index - windowSize), index + 1);
    
    const trend = this.calculateTrend(window);
    const seasonality = this.detectSeasonality(window);
    
    // 変化点検出 (前後の分散を比較)
    const changePoint = index > 5 && index < data.length - 5 ? 
      this.detectChangePoint(data, index) : false;
    
    return {
      trend: trend > 0.1 ? 'increasing' : trend < -0.1 ? 'decreasing' : 'stable',
      seasonality,
      changePoint
    };
  }

  private detectChangePoint(data: DataPoint[], index: number): boolean {
    const before = data.slice(Math.max(0, index - 5), index);
    const after = data.slice(index, Math.min(data.length, index + 5));
    
    if (before.length < 3 || after.length < 3) return false;
    
    const beforeMean = this.calculateMean(before.map(d => d.value));
    const afterMean = this.calculateMean(after.map(d => d.value));
    const beforeStd = this.calculateStandardDeviation(before.map(d => d.value), beforeMean);
    
    return Math.abs(afterMean - beforeMean) > (beforeStd * 2);
  }

  private getInfluencingFactors(data: DataPoint[], daysAhead: number): string[] {
    const factors = ['過去のトレンド'];
    
    if (this.detectSeasonality(data)) {
      factors.push('季節性パターン');
    }
    
    if (daysAhead <= 7) {
      factors.push('短期予測');
    } else if (daysAhead <= 30) {
      factors.push('中期予測');
    } else {
      factors.push('長期予測');
    }
    
    return factors;
  }

  private calculatePriorityFactors(data: Array<{duration: number; priority: string}>): Record<string, number> {
    const priorityGroups = data.reduce((groups, item) => {
      if (!groups[item.priority]) groups[item.priority] = [];
      groups[item.priority].push(item.duration);
      return groups;
    }, {} as Record<string, number[]>);
    
    const overallMean = this.calculateMean(data.map(d => d.duration));
    
    const factors: Record<string, number> = {};
    Object.keys(priorityGroups).forEach(priority => {
      const priorityMean = this.calculateMean(priorityGroups[priority]);
      factors[priority] = priorityMean / overallMean;
    });
    
    return factors;
  }

  private getChurnPreventionActions(
    customer: any, 
    churnProbability: number
  ): string[] {
    const actions = [];
    
    if (churnProbability > 0.8) {
      actions.push('緊急: 即座にカスタマーサクセスチームが連絡');
      actions.push('特別割引またはインセンティブの提供');
    }
    
    if (churnProbability > 0.6) {
      actions.push('パーソナライズされたリテンションキャンペーン');
      actions.push('プロダクト使用状況の改善提案');
    }
    
    if (customer.supportTickets > 3) {
      actions.push('専任サポート担当者の割り当て');
    }
    
    if (customer.activityFrequency < 0.3) {
      actions.push('再エンゲージメントキャンペーンの実施');
    }
    
    if (customer.paymentDelays > 1) {
      actions.push('支払い条件の見直し・相談');
    }
    
    return actions;
  }
}