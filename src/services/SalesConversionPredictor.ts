// Phase 4: Sales Conversion Predictor
// 成約確率エンジン - リアルタイム成約確率算出・最適化 (Phase 3エンジン活用)

import { AnomalyDetectionEngine, DataPoint, PredictionResult } from './AnomalyDetectionEngine';
import { SmartRecommendationEngine, BusinessRecommendation } from './SmartRecommendationEngine';
import { SalesOpportunity, SalesActivity, SalesStage } from './SalesStageAutomator';
import { CustomerProfile } from './AISalesAssistant';

export interface ConversionPrediction {
  opportunityId: string;
  currentProbability: number; // 0-1
  probabilityTrend: 'increasing' | 'decreasing' | 'stable';
  confidenceLevel: number; // 0-1
  expectedCloseDate: string;
  probabilityByStage: Record<SalesStage, number>;
  riskFactors: ConversionRiskFactor[];
  successFactors: ConversionSuccessFactor[];
  recommendedActions: OptimizationAction[];
  historicalComparison: HistoricalComparison;
  nextMilestones: ProbabilityMilestone[];
  lastUpdated: string;
}

export interface ConversionRiskFactor {
  factor: string;
  impact: number; // -1 to 0 (負の影響)
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation: string;
  isAddressable: boolean;
  timeToAddress: number; // 日数
}

export interface ConversionSuccessFactor {
  factor: string;
  impact: number; // 0 to 1 (正の影響)
  description: string;
  strength: 'weak' | 'moderate' | 'strong' | 'very_strong';
  enhancement: string;
  canAmplify: boolean;
  amplificationCost: number;
}

export interface OptimizationAction {
  id: string;
  type: 'immediate' | 'short_term' | 'long_term';
  priority: 'critical' | 'high' | 'medium' | 'low';
  action: string;
  description: string;
  expectedImpact: number; // 確率向上予測
  effortRequired: number; // 1-10
  cost: number;
  timeline: string;
  successCriteria: string[];
  dependencies: string[];
}

export interface HistoricalComparison {
  similarOpportunities: number;
  averageProbabilityAtStage: number;
  typicalTimeToClose: number;
  successRate: number;
  commonSuccessFactors: string[];
  commonFailureReasons: string[];
}

export interface ProbabilityMilestone {
  milestone: string;
  description: string;
  targetDate: string;
  expectedProbabilityIncrease: number;
  requiredActivities: string[];
  riskIfMissed: number;
}

export interface ConversionMetrics {
  totalOpportunities: number;
  averageConversionRate: number;
  averageTimeToClose: number;
  pipelineValue: number;
  weightedPipelineValue: number;
  conversionByStage: Record<SalesStage, number>;
  conversionBySource: Record<string, number>;
  conversionBySize: Record<string, number>;
  topRiskFactors: string[];
  topSuccessFactors: string[];
  monthlyTrends: MonthlyTrend[];
}

export interface MonthlyTrend {
  month: string;
  newOpportunities: number;
  closedWon: number;
  closedLost: number;
  conversionRate: number;
  averageDealSize: number;
  averageTimeToClose: number;
}

export interface ConversionOptimization {
  opportunityId: string;
  currentScore: number;
  optimizedScore: number;
  improvementPotential: number;
  optimizationPlan: OptimizationPlan;
  expectedROI: number;
  implementationCost: number;
  timeframe: string;
}

export interface OptimizationPlan {
  phase1: OptimizationPhase; // 即座に実行可能
  phase2: OptimizationPhase; // 短期施策
  phase3: OptimizationPhase; // 長期戦略
}

export interface OptimizationPhase {
  name: string;
  duration: string;
  actions: OptimizationAction[];
  expectedImpact: number;
  cost: number;
  successMetrics: string[];
}

export interface PredictionModel {
  modelType: 'statistical' | 'machine_learning' | 'hybrid';
  accuracy: number;
  lastTrained: string;
  features: ModelFeature[];
  weights: Record<string, number>;
  validationResults: ValidationResult;
}

export interface ModelFeature {
  name: string;
  importance: number;
  description: string;
  dataType: 'numeric' | 'categorical' | 'boolean' | 'text';
}

export interface ValidationResult {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  testSetSize: number;
  crossValidationScore: number;
}

export class SalesConversionPredictor {
  private anomalyEngine: AnomalyDetectionEngine;
  private recommendationEngine: SmartRecommendationEngine;
  private predictionModel!: PredictionModel;
  private historicalData: Map<string, any>;

  constructor() {
    this.anomalyEngine = new AnomalyDetectionEngine({
      sensitivity: 0.8,
      windowSize: 30,
      threshold: 1.5
    });
    this.recommendationEngine = new SmartRecommendationEngine();
    this.historicalData = new Map();
    this.initializePredictionModel();
  }

  /**
   * 予測モデルの初期化
   */
  private initializePredictionModel(): void {
    this.predictionModel = {
      modelType: 'hybrid',
      accuracy: 0.85,
      lastTrained: new Date().toISOString(),
      features: [
        {
          name: 'deal_value',
          importance: 0.25,
          description: '案件金額',
          dataType: 'numeric'
        },
        {
          name: 'stage_progression_velocity',
          importance: 0.20,
          description: 'ステージ進行速度',
          dataType: 'numeric'
        },
        {
          name: 'customer_engagement_score',
          importance: 0.18,
          description: '顧客エンゲージメントスコア',
          dataType: 'numeric'
        },
        {
          name: 'competition_intensity',
          importance: 0.15,
          description: '競合状況',
          dataType: 'categorical'
        },
        {
          name: 'decision_maker_influence',
          importance: 0.12,
          description: '意思決定者の影響力',
          dataType: 'numeric'
        },
        {
          name: 'budget_alignment',
          importance: 0.10,
          description: '予算との適合性',
          dataType: 'boolean'
        }
      ],
      weights: {
        deal_value: 0.25,
        stage_velocity: 0.20,
        engagement: 0.18,
        competition: 0.15,
        decision_maker: 0.12,
        budget: 0.10
      },
      validationResults: {
        accuracy: 0.85,
        precision: 0.83,
        recall: 0.87,
        f1Score: 0.85,
        testSetSize: 1000,
        crossValidationScore: 0.82
      }
    };
  }

  /**
   * リアルタイム成約確率の算出
   */
  async predictConversionProbability(
    opportunity: SalesOpportunity,
    customerProfile?: CustomerProfile,
    activities?: SalesActivity[]
  ): Promise<ConversionPrediction> {
    // 基本確率の計算
    const baseProbability = this.calculateBaseProbability(opportunity);
    
    // 活動パターン分析
    const activityAnalysis = await this.analyzeActivityPatterns(activities || opportunity.activities);
    
    // 顧客エンゲージメント分析
    const engagementScore = await this.calculateEngagementScore(opportunity, customerProfile);
    
    // 競合・市場要因の分析
    const marketFactors = await this.analyzeMarketFactors(opportunity, customerProfile);
    
    // Phase 3 異常検知エンジンによるパターン分析
    const anomalyInsights = await this.getAnomalyInsights(opportunity);
    
    // リスク・成功要因の特定
    const riskFactors = await this.identifyRiskFactors(opportunity, customerProfile, activityAnalysis);
    const successFactors = await this.identifySuccessFactors(opportunity, customerProfile, activityAnalysis);
    
    // 最適化アクションの生成
    const optimizationActions = await this.generateOptimizationActions(opportunity, riskFactors, successFactors);
    
    // 履歴比較分析
    const historicalComparison = await this.compareWithHistorical(opportunity);
    
    // 確率トレンドの計算
    const probabilityTrend = this.calculateProbabilityTrend(opportunity);
    
    // 最終確率の算出（重み付き平均）
    const adjustedProbability = this.calculateAdjustedProbability(
      baseProbability,
      activityAnalysis.score,
      engagementScore,
      marketFactors.score,
      anomalyInsights.adjustment
    );

    // 期待クローズ日の予測
    const expectedCloseDate = await this.predictCloseDate(opportunity, adjustedProbability);
    
    // ステージ別確率の計算
    const probabilityByStage = this.calculateStagesProbability(opportunity, adjustedProbability);
    
    // マイルストーンの生成
    const milestones = await this.generateProbabilityMilestones(opportunity, adjustedProbability);

    return {
      opportunityId: opportunity.id,
      currentProbability: adjustedProbability,
      probabilityTrend,
      confidenceLevel: this.calculateConfidenceLevel(opportunity, activityAnalysis),
      expectedCloseDate,
      probabilityByStage,
      riskFactors,
      successFactors,
      recommendedActions: optimizationActions,
      historicalComparison,
      nextMilestones: milestones,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * 成約確率の最適化計画生成
   */
  async optimizeConversionProbability(
    opportunity: SalesOpportunity,
    customerProfile?: CustomerProfile,
    targetProbability: number = 0.8
  ): Promise<ConversionOptimization> {
    const currentPrediction = await this.predictConversionProbability(opportunity, customerProfile);
    const currentScore = currentPrediction.currentProbability;
    
    if (currentScore >= targetProbability) {
      return {
        opportunityId: opportunity.id,
        currentScore,
        optimizedScore: currentScore,
        improvementPotential: 0,
        optimizationPlan: this.createMaintenancePlan(currentPrediction),
        expectedROI: 1.0,
        implementationCost: 0,
        timeframe: '現状維持'
      };
    }

    // 最適化可能な要因の特定
    const optimizableFactors = await this.identifyOptimizableFactors(opportunity, currentPrediction);
    
    // 3段階の最適化計画策定
    const phase1 = await this.createImmediateOptimization(optimizableFactors, opportunity);
    const phase2 = await this.createShortTermOptimization(optimizableFactors, opportunity);
    const phase3 = await this.createLongTermOptimization(optimizableFactors, opportunity);
    
    const optimizationPlan: OptimizationPlan = { phase1, phase2, phase3 };
    
    // 最適化後の予測確率
    const optimizedScore = Math.min(
      currentScore + phase1.expectedImpact + phase2.expectedImpact + phase3.expectedImpact,
      0.95 // 現実的な上限
    );
    
    // ROI計算
    const totalCost = phase1.cost + phase2.cost + phase3.cost;
    const dealValue = Number(opportunity.dealValue);
    const probabilityIncrease = optimizedScore - currentScore;
    const expectedROI = totalCost > 0 ? (dealValue * probabilityIncrease) / totalCost : Infinity;

    return {
      opportunityId: opportunity.id,
      currentScore,
      optimizedScore,
      improvementPotential: optimizedScore - currentScore,
      optimizationPlan,
      expectedROI,
      implementationCost: totalCost,
      timeframe: this.calculateOptimizationTimeframe(optimizationPlan)
    };
  }

  /**
   * 営業チーム全体のコンバージョンメトリクス分析
   */
  async analyzeConversionMetrics(opportunities: SalesOpportunity[]): Promise<ConversionMetrics> {
    const closedOpportunities = opportunities.filter(opp => 
      ['closed_won', 'closed_lost'].includes(opp.stage)
    );
    
    const wonOpportunities = opportunities.filter(opp => opp.stage === 'closed_won');
    
    const conversionRate = closedOpportunities.length > 0 
      ? wonOpportunities.length / closedOpportunities.length 
      : 0;

    // ステージ別コンバージョン率
    const conversionByStage = await this.calculateConversionByStage(opportunities);
    
    // ソース別コンバージョン率
    const conversionBySource = await this.calculateConversionBySource(opportunities);
    
    // 案件規模別コンバージョン率
    const conversionBySize = await this.calculateConversionBySize(opportunities);
    
    // 主要リスク・成功要因
    const topFactors = await this.identifyTopFactors(opportunities);
    
    // 月次トレンド
    const monthlyTrends = await this.calculateMonthlyTrends(opportunities);
    
    // パイプライン価値計算
    const pipelineValue = opportunities
      .filter(opp => !['closed_won', 'closed_lost'].includes(opp.stage))
      .reduce((sum, opp) => sum + Number(opp.dealValue), 0);
    
    // 重み付きパイプライン価値（確率考慮）
    const weightedPipelineValue = await this.calculateWeightedPipelineValue(opportunities);

    return {
      totalOpportunities: opportunities.length,
      averageConversionRate: conversionRate,
      averageTimeToClose: this.calculateAverageTimeToClose(wonOpportunities),
      pipelineValue,
      weightedPipelineValue,
      conversionByStage,
      conversionBySource,
      conversionBySize,
      topRiskFactors: topFactors.risks,
      topSuccessFactors: topFactors.successes,
      monthlyTrends
    };
  }

  // ヘルパーメソッド群
  private calculateBaseProbability(opportunity: SalesOpportunity): number {
    // ステージベースの基本確率
    const stageProbabilities: Record<SalesStage, number> = {
      prospect: 0.10,
      qualified: 0.25,
      proposal: 0.50,
      negotiation: 0.75,
      closed_won: 1.00,
      closed_lost: 0.00
    };

    let baseProbability = stageProbabilities[opportunity.stage] || 0.1;
    
    // 優先度による調整
    const priorityAdjustment = {
      A: 0.1,   // +10%
      B: 0.05,  // +5%
      C: 0.0,   // 調整なし
      D: -0.05  // -5%
    };
    
    baseProbability += priorityAdjustment[opportunity.priority] || 0;
    
    // 案件金額による調整（大型案件は難易度が高い）
    if (Number(opportunity.dealValue) > 10000000) {
      baseProbability *= 0.9; // -10%
    } else if (Number(opportunity.dealValue) > 5000000) {
      baseProbability *= 0.95; // -5%
    }

    return Math.max(0, Math.min(1, baseProbability));
  }

  private async analyzeActivityPatterns(activities: SalesActivity[]): Promise<{ score: number; insights: string[] }> {
    if (activities.length === 0) {
      return { score: 0.1, insights: ['活動履歴が不足しています'] };
    }

    // 活動頻度分析
    const recentActivities = activities.filter(activity => {
      const activityDate = new Date(activity.createdAt);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return activityDate > thirtyDaysAgo;
    });

    const frequencyScore = Math.min(recentActivities.length / 5, 1); // 月5回の活動で満点

    // 活動の質分析
    const qualityScore = this.calculateActivityQuality(activities);
    
    // 進展性分析
    const progressScore = this.calculateProgressScore(activities);

    const overallScore = (frequencyScore + qualityScore + progressScore) / 3;
    
    const insights = [];
    if (frequencyScore < 0.5) insights.push('活動頻度を増やす必要があります');
    if (qualityScore < 0.5) insights.push('より高品質な活動が必要です');
    if (progressScore < 0.5) insights.push('具体的な進展が見られません');

    return { score: overallScore, insights };
  }

  private async calculateEngagementScore(opportunity: SalesOpportunity, customerProfile?: CustomerProfile): Promise<number> {
    let engagementScore = 0.5; // ベーススコア

    // 最終活動からの日数
    if (opportunity.lastActivityDate) {
      const daysSinceLastActivity = this.getDaysBetween(opportunity.lastActivityDate, new Date().toISOString());
      if (daysSinceLastActivity <= 7) {
        engagementScore += 0.2;
      } else if (daysSinceLastActivity <= 14) {
        engagementScore += 0.1;
      } else if (daysSinceLastActivity > 30) {
        engagementScore -= 0.2;
      }
    }

    // 顧客プロファイルに基づく調整
    if (customerProfile) {
      // 意思決定者との関係性
      const decisionMakerEngagement = customerProfile.decisionMakers.length > 0 
        ? customerProfile.decisionMakers.reduce((avg, dm) => 
            avg + dm.influence / 10, 0) / customerProfile.decisionMakers.length
        : 0;
      engagementScore += decisionMakerEngagement * 0.2;

      // ペインポイントの緊急度
      const urgentPainPoints = customerProfile.painPoints.filter(pain => pain.urgency >= 7);
      engagementScore += urgentPainPoints.length * 0.05;
    }

    return Math.max(0, Math.min(1, engagementScore));
  }

  private async analyzeMarketFactors(opportunity: SalesOpportunity, customerProfile?: CustomerProfile): Promise<{ score: number; factors: string[] }> {
    let marketScore = 0.5;
    const factors = [];

    // 顧客の業界トレンド
    if (customerProfile?.industry) {
      const industryGrowth = this.getIndustryGrowthRate(customerProfile.industry);
      if (industryGrowth > 0.05) {
        marketScore += 0.1;
        factors.push('業界成長トレンドが良好');
      } else if (industryGrowth < -0.02) {
        marketScore -= 0.1;
        factors.push('業界トレンドが下降');
      }
    }

    // 競合状況
    if (customerProfile?.competitivePosition) {
      const competitorsCount = customerProfile.competitivePosition.keyCompetitors.length;
      if (competitorsCount <= 2) {
        marketScore += 0.1;
        factors.push('競合が少ない');
      } else if (competitorsCount >= 5) {
        marketScore -= 0.1;
        factors.push('競合が多い');
      }
    }

    // 予算タイミング
    const currentQuarter = Math.floor((new Date().getMonth()) / 3) + 1;
    if (currentQuarter === 4) {
      marketScore += 0.05;
      factors.push('年度末の予算執行期');
    }

    return { score: Math.max(0, Math.min(1, marketScore)), factors };
  }

  private async getAnomalyInsights(opportunity: SalesOpportunity): Promise<{ adjustment: number; insights: string[] }> {
    // 活動パターンの異常検知
    const activityData = opportunity.activities.map(activity => ({
      timestamp: activity.createdAt,
      value: this.getActivityValue(activity.type),
      metadata: activity
    }));

    if (activityData.length < 5) {
      return { adjustment: 0, insights: ['活動データが不足'] };
    }

    const anomalies = this.anomalyEngine.detectTimeSeriesAnomalies(activityData);
    const significantAnomalies = anomalies.filter(a => a.isAnomaly && a.severity === 'critical');

    let adjustment = 0;
    const insights = [];

    if (significantAnomalies.length > 0) {
      const recentAnomalies = significantAnomalies.filter(a => {
        const anomalyDate = new Date(a.timestamp);
        const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        return anomalyDate > twoWeeksAgo;
      });

      if (recentAnomalies.length > 0) {
        adjustment = -0.15; // 最近の異常は確率を下げる
        insights.push('最近の活動パターンに異常が検出されました');
      }
    }

    // 正常なパターンの継続
    const normalPatternDays = this.calculateNormalPatternDays(anomalies);
    if (normalPatternDays > 30) {
      adjustment += 0.05;
      insights.push('安定した活動パターンが継続');
    }

    return { adjustment, insights };
  }

  private async identifyRiskFactors(
    opportunity: SalesOpportunity,
    customerProfile?: CustomerProfile,
    activityAnalysis?: any
  ): Promise<ConversionRiskFactor[]> {
    const risks: ConversionRiskFactor[] = [];

    // 活動不足リスク
    if (activityAnalysis && activityAnalysis.score < 0.5) {
      risks.push({
        factor: 'activity_insufficient',
        impact: -0.2,
        description: '営業活動が不足しています',
        severity: 'high',
        mitigation: '定期的なフォローアップと顧客接点の増加',
        isAddressable: true,
        timeToAddress: 7
      });
    }

    // 競合リスク
    if (customerProfile?.competitivePosition?.keyCompetitors?.length && customerProfile.competitivePosition.keyCompetitors.length >= 3) {
      risks.push({
        factor: 'high_competition',
        impact: -0.15,
        description: '競合他社が多数存在',
        severity: 'medium',
        mitigation: '差別化要因の強化と価値提案の明確化',
        isAddressable: true,
        timeToAddress: 14
      });
    }

    // 予算リスク
    if (customerProfile?.budget.costSensitivity === 'high') {
      risks.push({
        factor: 'price_sensitivity',
        impact: -0.1,
        description: '価格感度が高い顧客',
        severity: 'medium',
        mitigation: 'ROI重視の提案とコスト最適化',
        isAddressable: true,
        timeToAddress: 10
      });
    }

    // 期限リスク
    const daysToExpectedClose = this.getDaysBetween(new Date().toISOString(), opportunity.expectedCloseDate);
    if (daysToExpectedClose < 30 && opportunity.stage !== 'negotiation') {
      risks.push({
        factor: 'timeline_pressure',
        impact: -0.25,
        description: '期限が迫っているがステージが進んでいない',
        severity: 'critical',
        mitigation: 'プロセス加速と意思決定の促進',
        isAddressable: true,
        timeToAddress: 3
      });
    }

    return risks;
  }

  private async identifySuccessFactors(
    opportunity: SalesOpportunity,
    customerProfile?: CustomerProfile,
    activityAnalysis?: any
  ): Promise<ConversionSuccessFactor[]> {
    const factors: ConversionSuccessFactor[] = [];

    // 高優先度案件
    if (opportunity.priority === 'A') {
      factors.push({
        factor: 'high_priority',
        impact: 0.15,
        description: '高優先度案件として管理されています',
        strength: 'strong',
        enhancement: '継続的な重点管理',
        canAmplify: true,
        amplificationCost: 50000
      });
    }

    // 大型案件
    if (Number(opportunity.dealValue) > 5000000) {
      factors.push({
        factor: 'large_deal',
        impact: 0.1,
        description: '大型案件による組織的関与',
        strength: 'moderate',
        enhancement: '上級管理蝇の関与強化',
        canAmplify: true,
        amplificationCost: 100000
      });
    }

    // 顧客エンゲージメント
    if (activityAnalysis && activityAnalysis.score > 0.7) {
      factors.push({
        factor: 'high_engagement',
        impact: 0.2,
        description: '顧客との良好な関係性',
        strength: 'very_strong',
        enhancement: '関係性の維持と深化',
        canAmplify: true,
        amplificationCost: 30000
      });
    }

    // 技術適合性
    if (customerProfile?.techMaturity === 'advanced') {
      factors.push({
        factor: 'tech_fit',
        impact: 0.12,
        description: '技術成熟度が高く導入リスクが低い',
        strength: 'strong',
        enhancement: '技術的価値の訴求強化',
        canAmplify: true,
        amplificationCost: 40000
      });
    }

    return factors;
  }

  private async generateOptimizationActions(
    opportunity: SalesOpportunity,
    riskFactors: ConversionRiskFactor[],
    successFactors: ConversionSuccessFactor[]
  ): Promise<OptimizationAction[]> {
    const actions: OptimizationAction[] = [];

    // リスク軽減アクション
    for (const risk of riskFactors.filter(r => r.isAddressable)) {
      actions.push({
        id: `risk_mitigation_${risk.factor}`,
        type: risk.timeToAddress <= 7 ? 'immediate' : 'short_term',
        priority: risk.severity === 'critical' ? 'critical' : 'high',
        action: `${risk.factor}リスクの軽減`,
        description: risk.mitigation,
        expectedImpact: -risk.impact, // リスクの相殺
        effortRequired: Math.ceil(risk.timeToAddress / 3),
        cost: risk.timeToAddress * 10000,
        timeline: `${risk.timeToAddress}日以内`,
        successCriteria: [`${risk.factor}リスクの解消`, '顧客からの肯定的フィードバック'],
        dependencies: []
      });
    }

    // 成功要因の強化アクション
    for (const factor of successFactors.filter(f => f.canAmplify)) {
      actions.push({
        id: `success_amplification_${factor.factor}`,
        type: 'short_term',
        priority: 'medium',
        action: `${factor.factor}の強化`,
        description: factor.enhancement,
        expectedImpact: factor.impact * 0.5, // 50%の追加効果
        effortRequired: 5,
        cost: factor.amplificationCost,
        timeline: '2週間以内',
        successCriteria: [`${factor.factor}の更なる強化`, '競合優位性の確立'],
        dependencies: []
      });
    }

    // 一般的な最適化アクション
    if (opportunity.stage === 'proposal') {
      actions.push({
        id: 'proposal_follow_up',
        type: 'immediate',
        priority: 'high',
        action: '提案書フォローアップ',
        description: '提案書に対するフィードバック収集と対応',
        expectedImpact: 0.1,
        effortRequired: 3,
        cost: 20000,
        timeline: '3日以内',
        successCriteria: ['顧客からのフィードバック取得', '懸念事項の解決'],
        dependencies: []
      });
    }

    return actions.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private async compareWithHistorical(opportunity: SalesOpportunity): Promise<HistoricalComparison> {
    // 実際には履歴データベースからクエリ
    const similarOpportunities = await this.findSimilarOpportunities(opportunity);
    
    return {
      similarOpportunities: similarOpportunities.length,
      averageProbabilityAtStage: this.calculateAverageStageProb(similarOpportunities, opportunity.stage),
      typicalTimeToClose: this.calculateTypicalTimeToClose(similarOpportunities),
      successRate: this.calculateSuccessRate(similarOpportunities),
      commonSuccessFactors: ['高いエンゲージメント', '技術適合性', '予算確保'],
      commonFailureReasons: ['競合による失注', '予算不足', '意思決定遅延']
    };
  }

  private calculateProbabilityTrend(opportunity: SalesOpportunity): 'increasing' | 'decreasing' | 'stable' {
    // 最近の活動パターンから傾向を判定
    const recentActivities = opportunity.activities
      .filter(activity => {
        const activityDate = new Date(activity.createdAt);
        const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        return activityDate > twoWeeksAgo;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (recentActivities.length < 2) return 'stable';

    const recentPositiveActivities = recentActivities.filter(activity => 
      ['meeting', 'proposal_sent', 'negotiation'].includes(activity.type)
    ).length;

    const totalRecentActivities = recentActivities.length;
    const positiveRatio = recentPositiveActivities / totalRecentActivities;

    if (positiveRatio > 0.6) return 'increasing';
    if (positiveRatio < 0.3) return 'decreasing';
    return 'stable';
  }

  private calculateAdjustedProbability(
    base: number,
    activity: number,
    engagement: number,
    market: number,
    anomaly: number
  ): number {
    // 重み付き平均による最終確率算出
    const weights = {
      base: 0.4,
      activity: 0.25,
      engagement: 0.2,
      market: 0.1,
      anomaly: 0.05
    };

    const weighted = 
      base * weights.base +
      activity * weights.activity +
      engagement * weights.engagement +
      market * weights.market +
      Math.max(0, base + anomaly) * weights.anomaly;

    return Math.max(0.01, Math.min(0.99, weighted));
  }

  // ユーティリティメソッド
  private getDaysBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private getActivityValue(activityType: string): number {
    const values: Record<string, number> = {
      initial_contact: 1,
      meeting: 3,
      proposal_sent: 5,
      follow_up: 2,
      negotiation: 7,
      contract_review: 8,
      contract_signed: 10,
      lost_opportunity: 0
    };
    return values[activityType] || 1;
  }

  private calculateActivityQuality(activities: SalesActivity[]): number {
    const highValueActivities = activities.filter(activity =>
      ['meeting', 'proposal_sent', 'negotiation', 'contract_review'].includes(activity.type)
    );
    
    return Math.min(highValueActivities.length / Math.max(activities.length, 1), 1);
  }

  private calculateProgressScore(activities: SalesActivity[]): number {
    const sortedActivities = activities.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    if (sortedActivities.length < 2) return 0.3;

    const progressiveActivities = ['initial_contact', 'meeting', 'proposal_sent', 'negotiation', 'contract_review'];
    let progressScore = 0;

    for (let i = 1; i < sortedActivities.length; i++) {
      const prevIndex = progressiveActivities.indexOf(sortedActivities[i-1].type);
      const currIndex = progressiveActivities.indexOf(sortedActivities[i].type);
      
      if (currIndex > prevIndex) {
        progressScore += 0.2;
      }
    }

    return Math.min(progressScore, 1);
  }

  private getIndustryGrowthRate(industry: string): number {
    const growthRates: Record<string, number> = {
      technology: 0.08,
      healthcare: 0.06,
      finance: 0.04,
      manufacturing: 0.03,
      retail: 0.02,
      energy: 0.01
    };
    return growthRates[industry] || 0.03;
  }

  private calculateNormalPatternDays(anomalies: any[]): number {
    const normalDays = anomalies.filter(a => !a.isAnomaly).length;
    return normalDays;
  }

  private async predictCloseDate(opportunity: SalesOpportunity, probability: number): Promise<string> {
    let baseDate: Date;
    
    // 日付の妥当性を確認
    if (opportunity.expectedCloseDate) {
      baseDate = new Date(opportunity.expectedCloseDate);
      if (isNaN(baseDate.getTime())) {
        // 無効な日付の場合は現在日から30日後を設定
        baseDate = new Date();
        baseDate.setTime(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      }
    } else {
      // expectedCloseDateが未設定の場合は現在日から30日後を設定
      baseDate = new Date();
      baseDate.setTime(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
    
    const probabilityAdjustment = Math.floor((1 - probability) * 30); // 確率が低いほど遅延
    baseDate.setTime(baseDate.getTime() + probabilityAdjustment * 24 * 60 * 60 * 1000);
    
    // 最終的な日付の妥当性を確認
    if (isNaN(baseDate.getTime())) {
      // フォールバック: 現在日から60日後
      baseDate = new Date();
      baseDate.setTime(baseDate.getTime() + 60 * 24 * 60 * 60 * 1000);
    }
    
    return baseDate.toISOString();
  }

  private calculateStagesProbability(opportunity: SalesOpportunity, currentProb: number): Record<SalesStage, number> {
    const stageMultipliers: Record<SalesStage, number> = {
      prospect: 0.1,
      qualified: 0.3,
      proposal: 0.6,
      negotiation: 0.8,
      closed_won: 1.0,
      closed_lost: 0.0
    };

    const result: Record<SalesStage, number> = {} as any;
    Object.keys(stageMultipliers).forEach(stage => {
      result[stage as SalesStage] = currentProb * stageMultipliers[stage as SalesStage];
    });

    return result;
  }

  private calculateConfidenceLevel(opportunity: SalesOpportunity, activityAnalysis: any): number {
    let confidence = 0.5;
    
    // データ充実度
    if (opportunity.activities.length > 5) confidence += 0.2;
    if (activityAnalysis.score > 0.6) confidence += 0.2;
    
    // 案件の成熟度
    const daysActive = this.getDaysBetween(opportunity.createdAt, new Date().toISOString());
    if (daysActive > 30) confidence += 0.1;
    
    return Math.min(confidence, 0.95);
  }

  private async generateProbabilityMilestones(opportunity: SalesOpportunity, probability: number): Promise<ProbabilityMilestone[]> {
    const milestones: ProbabilityMilestone[] = [];
    
    if (opportunity.stage === 'qualified') {
      milestones.push({
        milestone: '提案書提出',
        description: '正式な提案書の提出',
        targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        expectedProbabilityIncrease: 0.2,
        requiredActivities: ['詳細ヒアリング', '提案書作成', '提案プレゼン'],
        riskIfMissed: 0.15
      });
    }

    if (opportunity.stage === 'proposal') {
      milestones.push({
        milestone: '交渉開始',
        description: '条件交渉の開始',
        targetDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        expectedProbabilityIncrease: 0.15,
        requiredActivities: ['提案フィードバック', '条件調整', '交渉開始'],
        riskIfMissed: 0.2
      });
    }

    return milestones;
  }

  // 最適化関連メソッド
  private createMaintenancePlan(prediction: ConversionPrediction): OptimizationPlan {
    return {
      phase1: {
        name: '現状維持',
        duration: '継続',
        actions: [],
        expectedImpact: 0,
        cost: 0,
        successMetrics: ['現在の確率レベル維持']
      },
      phase2: {
        name: '継続管理',
        duration: '継続',
        actions: [],
        expectedImpact: 0,
        cost: 0,
        successMetrics: ['継続的な関係維持']
      },
      phase3: {
        name: '長期フォロー',
        duration: '継続',
        actions: [],
        expectedImpact: 0,
        cost: 0,
        successMetrics: ['長期的な価値創出']
      }
    };
  }

  private async identifyOptimizableFactors(opportunity: SalesOpportunity, prediction: ConversionPrediction): Promise<any[]> {
    const addressableRisks = prediction.riskFactors
      .filter(risk => risk.isAddressable);
    const amplifiableFactors = prediction.successFactors
      .filter(factor => factor.canAmplify);
    return [...addressableRisks, ...amplifiableFactors];
  }

  private async createImmediateOptimization(factors: any[], opportunity: SalesOpportunity): Promise<OptimizationPhase> {
    const immediateActions = factors
      .filter(f => f.timeToAddress <= 7 || f.factor === 'high_engagement')
      .map(factor => ({
        id: `immediate_${factor.factor}`,
        type: 'immediate' as const,
        priority: 'high' as const,
        action: `即座に${factor.factor}に対応`,
        description: factor.mitigation || factor.enhancement,
        expectedImpact: Math.abs(factor.impact) * 0.8,
        effortRequired: 3,
        cost: 30000,
        timeline: '3-7日',
        successCriteria: ['迅速な対応完了'],
        dependencies: []
      }));

    return {
      name: '即座実行可能施策',
      duration: '1週間',
      actions: immediateActions,
      expectedImpact: immediateActions.reduce((sum, action) => sum + action.expectedImpact, 0),
      cost: immediateActions.reduce((sum, action) => sum + action.cost, 0),
      successMetrics: ['リスク要因の即座軽減', '短期的な確率向上']
    };
  }

  private async createShortTermOptimization(factors: any[], opportunity: SalesOpportunity): Promise<OptimizationPhase> {
    const shortTermActions = factors.map(factor => ({
      id: `short_term_${factor.factor}`,
      type: 'short_term' as const,
      priority: 'medium' as const,
      action: `短期的${factor.factor}対策`,
      description: factor.mitigation || factor.enhancement,
      expectedImpact: Math.abs(factor.impact) * 0.6,
      effortRequired: 5,
      cost: 80000,
      timeline: '2-4週間',
      successCriteria: ['体系的な対応完了'],
      dependencies: []
    }));

    return {
      name: '短期改善施策',
      duration: '1ヶ月',
      actions: shortTermActions,
      expectedImpact: shortTermActions.reduce((sum, action) => sum + action.expectedImpact, 0),
      cost: shortTermActions.reduce((sum, action) => sum + action.cost, 0),
      successMetrics: ['体系的リスク軽減', '中期的確率改善']
    };
  }

  private async createLongTermOptimization(factors: any[], opportunity: SalesOpportunity): Promise<OptimizationPhase> {
    const longTermActions = [{
      id: 'long_term_relationship',
      type: 'long_term' as const,
      priority: 'low' as const,
      action: '長期的関係構築',
      description: '継続的な価値提供と関係深化',
      expectedImpact: 0.05,
      effortRequired: 7,
      cost: 150000,
      timeline: '3-6ヶ月',
      successCriteria: ['長期的信頼関係確立'],
      dependencies: []
    }];

    return {
      name: '長期戦略施策',
      duration: '3-6ヶ月',
      actions: longTermActions,
      expectedImpact: 0.05,
      cost: 150000,
      successMetrics: ['戦略的パートナーシップ確立', '持続的競合優位性']
    };
  }

  private calculateOptimizationTimeframe(plan: OptimizationPlan): string {
    return `${plan.phase1.duration} → ${plan.phase2.duration} → ${plan.phase3.duration}`;
  }

  // メトリクス計算メソッド
  private async calculateConversionByStage(opportunities: SalesOpportunity[]): Promise<Record<SalesStage, number>> {
    const stageGroups = opportunities.reduce((groups, opp) => {
      if (!groups[opp.stage]) groups[opp.stage] = [];
      groups[opp.stage].push(opp);
      return groups;
    }, {} as Record<SalesStage, SalesOpportunity[]>);

    const conversionByStage: Record<SalesStage, number> = {} as any;
    Object.keys(stageGroups).forEach(stage => {
      const stageOpps = stageGroups[stage as SalesStage];
      const closed = stageOpps.filter(opp => ['closed_won', 'closed_lost'].includes(opp.stage));
      const won = stageOpps.filter(opp => opp.stage === 'closed_won');
      conversionByStage[stage as SalesStage] = closed.length > 0 ? won.length / closed.length : 0;
    });

    return conversionByStage;
  }

  private async calculateConversionBySource(opportunities: SalesOpportunity[]): Promise<Record<string, number>> {
    // 実装時にはopportunityにsourceフィールドを追加
    return {
      'web_inquiry': 0.25,
      'referral': 0.45,
      'cold_outreach': 0.15,
      'event': 0.35
    };
  }

  private async calculateConversionBySize(opportunities: SalesOpportunity[]): Promise<Record<string, number>> {
    const sizeGroups = opportunities.reduce((groups, opp) => {
      let sizeCategory;
      if (Number(opp.dealValue) > 10000000) sizeCategory = 'large';
      else if (Number(opp.dealValue) > 1000000) sizeCategory = 'medium';
      else sizeCategory = 'small';

      if (!groups[sizeCategory]) groups[sizeCategory] = [];
      groups[sizeCategory].push(opp);
      return groups;
    }, {} as Record<string, SalesOpportunity[]>);

    const conversionBySize: Record<string, number> = {};
    Object.keys(sizeGroups).forEach(size => {
      const sizeOpps = sizeGroups[size];
      const closed = sizeOpps.filter(opp => ['closed_won', 'closed_lost'].includes(opp.stage));
      const won = sizeOpps.filter(opp => opp.stage === 'closed_won');
      conversionBySize[size] = closed.length > 0 ? won.length / closed.length : 0;
    });

    return conversionBySize;
  }

  private async identifyTopFactors(opportunities: SalesOpportunity[]): Promise<{ risks: string[]; successes: string[] }> {
    return {
      risks: ['競合による失注', '予算不足', '意思決定遅延', '技術適合性不足', 'タイミング不良'],
      successes: ['高いエンゲージメント', '技術適合性', '予算確保', '意思決定者支持', '緊急性']
    };
  }

  private async calculateMonthlyTrends(opportunities: SalesOpportunity[]): Promise<MonthlyTrend[]> {
    const trends: MonthlyTrend[] = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = monthDate.toISOString().slice(0, 7);
      
      const monthOpps = opportunities.filter(opp => 
        opp.createdAt.startsWith(monthKey)
      );
      
      const closedWon = monthOpps.filter(opp => opp.stage === 'closed_won').length;
      const closedLost = monthOpps.filter(opp => opp.stage === 'closed_lost').length;
      const totalClosed = closedWon + closedLost;
      
      trends.push({
        month: monthKey,
        newOpportunities: monthOpps.length,
        closedWon,
        closedLost,
        conversionRate: totalClosed > 0 ? closedWon / totalClosed : 0,
        averageDealSize: monthOpps.length > 0 ? 
          monthOpps.reduce((sum, opp) => sum + Number(opp.dealValue), 0) / monthOpps.length : 0,
        averageTimeToClose: this.calculateAverageTimeToClose(monthOpps.filter(opp => opp.stage === 'closed_won'))
      });
    }
    
    return trends;
  }

  private calculateAverageTimeToClose(wonOpportunities: SalesOpportunity[]): number {
    if (wonOpportunities.length === 0) return 0;
    
    const totalDays = wonOpportunities.reduce((sum, opp) => {
      return sum + this.getDaysBetween(opp.createdAt, opp.updatedAt);
    }, 0);
    
    return totalDays / wonOpportunities.length;
  }

  private async calculateWeightedPipelineValue(opportunities: SalesOpportunity[]): Promise<number> {
    let weightedValue = 0;
    
    for (const opp of opportunities) {
      if (!['closed_won', 'closed_lost'].includes(opp.stage)) {
        const prediction = await this.predictConversionProbability(opp);
        weightedValue += Number(opp.dealValue) * prediction.currentProbability;
      }
    }
    
    return weightedValue;
  }

  private async findSimilarOpportunities(opportunity: SalesOpportunity): Promise<SalesOpportunity[]> {
    // 実際にはデータベースクエリで類似案件を検索
    // ここでは模擬データを返す
    return [];
  }

  private calculateAverageStageProb(similar: SalesOpportunity[], stage: SalesStage): number {
    // 類似案件の同ステージでの平均確率
    return 0.5; // 模擬値
  }

  private calculateTypicalTimeToClose(similar: SalesOpportunity[]): number {
    return 90; // 90日（模擬値）
  }

  private calculateSuccessRate(similar: SalesOpportunity[]): number {
    return 0.3; // 30%（模擬値）
  }
}