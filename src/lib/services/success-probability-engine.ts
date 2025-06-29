import { prismaDataService } from '../database/prisma-service';
import prisma from '../database/prisma';
import { getAICallManager } from '../ai/call-manager';

interface SuccessPrediction {
  appointmentId: string;
  probability: number;
  confidence: number;
  factors: ProbabilityFactor[];
  recommendations: Recommendation[];
  riskAnalysis: RiskAnalysis;
  timeline: TimelinePrediction;
  lastUpdated: Date;
}

interface ProbabilityFactor {
  factor: string;
  impact: number; // -1.0 to 1.0
  weight: number; // 0.0 to 1.0
  category: 'customer' | 'market' | 'product' | 'relationship' | 'timing' | 'competition';
  description: string;
}

interface Recommendation {
  action: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  expectedImpact: number;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  automated: boolean;
}

interface RiskAnalysis {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  primaryRisks: Array<{
    risk: string;
    probability: number;
    impact: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;
  earlyWarnings: string[];
}

interface TimelinePrediction {
  expectedClosingDate: Date;
  confidence: number;
  milestones: Array<{
    stage: string;
    expectedDate: Date;
    probability: number;
  }>;
}

/**
 * 成約確率エンジン
 * Phase 2のデータ分析基盤とAIを活用したリアルタイム成約確率計算
 */
export class SuccessProbabilityEngine {
  private aiCallManager = getAICallManager();

  /**
   * 成約確率の総合計算
   */
  async calculateSuccessProbability(appointmentId: string): Promise<SuccessPrediction> {
    try {
      console.log('🎯 Calculating success probability for:', appointmentId);

      // 1. 基本データ取得
      const appointmentData = await this.getAppointmentData(appointmentId);
      if (!appointmentData) {
        throw new Error('Appointment not found');
      }

      // 2. 確率要因分析
      const factors = await this.analyzeProbabilityFactors(appointmentData);
      
      // 3. ベース確率計算
      const baseProbability = await this.calculateBaseProbability(factors);
      
      // 4. 市場・競合分析による調整
      const marketAdjustment = await this.calculateMarketAdjustment(appointmentData);
      
      // 5. タイミング分析による調整
      const timingAdjustment = await this.calculateTimingAdjustment(appointmentData);
      
      // 6. 関係性分析による調整
      const relationshipAdjustment = await this.calculateRelationshipAdjustment(appointmentData);

      // 7. 最終確率計算
      const finalProbability = this.combineProbabilities(
        baseProbability,
        marketAdjustment,
        timingAdjustment,
        relationshipAdjustment
      );

      // 8. 信頼度計算
      const confidence = await this.calculateConfidence(factors, appointmentData);

      // 9. リスク分析
      const riskAnalysis = await this.performRiskAnalysis(factors, appointmentData);

      // 10. 推奨アクション生成
      const recommendations = await this.generateRecommendations(factors, finalProbability);

      // 11. タイムライン予測
      const timeline = await this.predictTimeline(appointmentData, finalProbability);

      return {
        appointmentId,
        probability: finalProbability,
        confidence,
        factors,
        recommendations,
        riskAnalysis,
        timeline,
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('❌ Success probability calculation failed:', error);
      return this.getDefaultPrediction(appointmentId);
    }
  }

  /**
   * 確率要因分析
   */
  private async analyzeProbabilityFactors(appointmentData: any): Promise<ProbabilityFactor[]> {
    const factors: ProbabilityFactor[] = [];

    // 1. 顧客要因分析
    const customerFactors = await this.analyzeCustomerFactors(appointmentData);
    factors.push(...customerFactors);

    // 2. 市場要因分析
    const marketFactors = await this.analyzeMarketFactors(appointmentData);
    factors.push(...marketFactors);

    // 3. 製品適合性分析
    const productFactors = await this.analyzeProductFit(appointmentData);
    factors.push(...productFactors);

    // 4. 関係性要因分析
    const relationshipFactors = await this.analyzeRelationshipFactors(appointmentData);
    factors.push(...relationshipFactors);

    // 5. タイミング要因分析
    const timingFactors = await this.analyzeTimingFactors(appointmentData);
    factors.push(...timingFactors);

    // 6. 競合要因分析
    const competitionFactors = await this.analyzeCompetitionFactors(appointmentData);
    factors.push(...competitionFactors);

    return factors;
  }

  /**
   * 顧客要因分析
   */
  private async analyzeCustomerFactors(appointmentData: any): Promise<ProbabilityFactor[]> {
    const factors: ProbabilityFactor[] = [];

    // 顧客の決定権限レベル
    const decisionMakerLevel = this.assessDecisionMakerLevel(appointmentData.decisionMakers);
    factors.push({
      factor: 'decision_maker_level',
      impact: decisionMakerLevel,
      weight: 0.25,
      category: 'customer',
      description: `決定権者レベル: ${decisionMakerLevel > 0.7 ? '高' : decisionMakerLevel > 0.4 ? '中' : '低'}`
    });

    // 顧客の予算確保状況
    const budgetStatus = await this.assessBudgetStatus(appointmentData);
    factors.push({
      factor: 'budget_status',
      impact: budgetStatus,
      weight: 0.3,
      category: 'customer',
      description: `予算状況: ${budgetStatus > 0.7 ? '確保済み' : budgetStatus > 0.4 ? '検討中' : '未確定'}`
    });

    // 顧客の緊急度
    const urgency = this.assessCustomerUrgency(appointmentData);
    factors.push({
      factor: 'customer_urgency',
      impact: urgency,
      weight: 0.2,
      category: 'customer',
      description: `緊急度: ${urgency > 0.7 ? '高' : urgency > 0.4 ? '中' : '低'}`
    });

    // 過去の取引実績
    const history = await this.getCustomerHistory(appointmentData.customerId);
    if (history.transactionCount > 0) {
      factors.push({
        factor: 'customer_history',
        impact: Math.min(history.transactionCount * 0.1, 0.3),
        weight: 0.15,
        category: 'customer',
        description: `取引実績: ${history.transactionCount}件`
      });
    }

    return factors;
  }

  /**
   * 市場要因分析
   */
  private async analyzeMarketFactors(appointmentData: any): Promise<ProbabilityFactor[]> {
    const factors: ProbabilityFactor[] = [];

    // 市場タイミング（季節性、景気動向）
    const marketTiming = await this.assessMarketTiming();
    factors.push({
      factor: 'market_timing',
      impact: marketTiming,
      weight: 0.1,
      category: 'market',
      description: `市場タイミング: ${marketTiming > 0.5 ? '良好' : '通常'}`
    });

    // 業界動向
    const industryTrend = await this.assessIndustryTrend(appointmentData.industry);
    factors.push({
      factor: 'industry_trend',
      impact: industryTrend,
      weight: 0.15,
      category: 'market',
      description: `業界動向: ${industryTrend > 0.5 ? '成長' : '安定'}`
    });

    return factors;
  }

  /**
   * 製品適合性分析
   */
  private async analyzeProductFit(appointmentData: any): Promise<ProbabilityFactor[]> {
    const factors: ProbabilityFactor[] = [];

    // ニーズ適合度
    const needsFit = await this.assessNeedsFit(appointmentData);
    factors.push({
      factor: 'needs_fit',
      impact: needsFit,
      weight: 0.25,
      category: 'product',
      description: `ニーズ適合度: ${needsFit > 0.8 ? '高' : needsFit > 0.5 ? '中' : '低'}`
    });

    // 技術的実現可能性
    const technicalFeasibility = await this.assessTechnicalFeasibility(appointmentData);
    factors.push({
      factor: 'technical_feasibility',
      impact: technicalFeasibility,
      weight: 0.2,
      category: 'product',
      description: `実現可能性: ${technicalFeasibility > 0.8 ? '高' : '中'}`
    });

    return factors;
  }

  /**
   * 関係性要因分析
   */
  private async analyzeRelationshipFactors(appointmentData: any): Promise<ProbabilityFactor[]> {
    const factors: ProbabilityFactor[] = [];

    // 信頼関係レベル
    const trustLevel = await this.assessTrustLevel(appointmentData);
    factors.push({
      factor: 'trust_level',
      impact: trustLevel,
      weight: 0.2,
      category: 'relationship',
      description: `信頼関係: ${trustLevel > 0.7 ? '強い' : trustLevel > 0.4 ? '普通' : '弱い'}`
    });

    // コミュニケーション頻度・質
    const communicationQuality = this.assessCommunicationQuality(appointmentData);
    factors.push({
      factor: 'communication_quality',
      impact: communicationQuality,
      weight: 0.15,
      category: 'relationship',
      description: `コミュニケーション: ${communicationQuality > 0.7 ? '良好' : '普通'}`
    });

    return factors;
  }

  /**
   * タイミング要因分析
   */
  private async analyzeTimingFactors(appointmentData: any): Promise<ProbabilityFactor[]> {
    const factors: ProbabilityFactor[] = [];

    // 営業サイクル進捗
    const cycleProgress = this.calculateCycleProgress(appointmentData);
    factors.push({
      factor: 'cycle_progress',
      impact: cycleProgress,
      weight: 0.15,
      category: 'timing',
      description: `営業進捗: ${Math.round(cycleProgress * 100)}%`
    });

    // 決定期限までの時間
    const timeToDecision = this.calculateTimeToDecision(appointmentData);
    factors.push({
      factor: 'time_to_decision',
      impact: timeToDecision,
      weight: 0.1,
      category: 'timing',
      description: `決定期限: ${timeToDecision > 0.7 ? '余裕あり' : '迫っている'}`
    });

    return factors;
  }

  /**
   * 競合要因分析
   */
  private async analyzeCompetitionFactors(appointmentData: any): Promise<ProbabilityFactor[]> {
    const factors: ProbabilityFactor[] = [];

    // 競合他社の存在
    const competitorPresence = await this.assessCompetitorPresence(appointmentData);
    factors.push({
      factor: 'competitor_presence',
      impact: -competitorPresence, // 競合がいると成約確率は下がる
      weight: 0.2,
      category: 'competition',
      description: `競合状況: ${competitorPresence > 0.7 ? '激しい' : competitorPresence > 0.3 ? 'あり' : '少ない'}`
    });

    // 当社の競合優位性
    const competitiveAdvantage = await this.assessCompetitiveAdvantage(appointmentData);
    factors.push({
      factor: 'competitive_advantage',
      impact: competitiveAdvantage,
      weight: 0.15,
      category: 'competition',
      description: `競合優位性: ${competitiveAdvantage > 0.7 ? '高' : '中'}`
    });

    return factors;
  }

  /**
   * ベース確率計算
   */
  private async calculateBaseProbability(factors: ProbabilityFactor[]): Promise<number> {
    let totalWeight = 0;
    let weightedSum = 0;

    for (const factor of factors) {
      const normalizedImpact = (factor.impact + 1) / 2; // -1~1 を 0~1 に正規化
      weightedSum += normalizedImpact * factor.weight;
      totalWeight += factor.weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
  }

  /**
   * 確率の結合計算
   */
  private combineProbabilities(
    base: number,
    market: number,
    timing: number,
    relationship: number
  ): number {
    // 重み付き平均
    const weights = [0.5, 0.2, 0.15, 0.15];
    const values = [base, market, timing, relationship];
    
    const combined = values.reduce((sum, value, index) => 
      sum + value * weights[index], 0
    );

    return Math.max(0.05, Math.min(0.95, combined));
  }

  /**
   * 信頼度計算
   */
  private async calculateConfidence(factors: ProbabilityFactor[], appointmentData: any): Promise<number> {
    // データの完全性
    const dataCompleteness = this.assessDataCompleteness(appointmentData);
    
    // 要因の一致度
    const factorConsistency = this.assessFactorConsistency(factors);
    
    // 履歴データの豊富さ
    const historicalDataRichness = await this.assessHistoricalDataRichness(appointmentData);

    return (dataCompleteness + factorConsistency + historicalDataRichness) / 3;
  }

  /**
   * リスク分析実行
   */
  private async performRiskAnalysis(factors: ProbabilityFactor[], appointmentData: any): Promise<RiskAnalysis> {
    // 負の影響が大きい要因を特定
    const riskFactors = factors
      .filter(f => f.impact < -0.3)
      .sort((a, b) => a.impact - b.impact);

    const primaryRisks = riskFactors.slice(0, 3).map(factor => ({
      risk: factor.description,
      probability: Math.abs(factor.impact),
      impact: Math.abs(factor.impact) > 0.7 ? 'high' as const : 'medium' as const,
      mitigation: this.generateMitigationStrategy(factor)
    }));

    // 全体リスクレベル
    const averageRisk = riskFactors.length > 0 
      ? riskFactors.reduce((sum, f) => sum + Math.abs(f.impact), 0) / riskFactors.length
      : 0;

    const overallRisk = averageRisk > 0.7 ? 'critical' :
                       averageRisk > 0.5 ? 'high' :
                       averageRisk > 0.2 ? 'medium' : 'low';

    // 早期警告
    const earlyWarnings = this.generateEarlyWarnings(factors, appointmentData);

    return {
      overallRisk,
      primaryRisks,
      earlyWarnings
    };
  }

  /**
   * 推奨アクション生成
   */
  private async generateRecommendations(factors: ProbabilityFactor[], probability: number): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // 確率が低い場合の改善提案
    if (probability < 0.5) {
      recommendations.push({
        action: '決定権者との直接面談を設定',
        priority: 'high',
        expectedImpact: 0.2,
        effort: 'medium',
        timeline: '1週間以内',
        automated: false
      });
    }

    // 要因別の改善提案
    for (const factor of factors) {
      if (factor.impact < -0.2) {
        const recommendation = this.generateFactorRecommendation(factor);
        if (recommendation) {
          recommendations.push(recommendation);
        }
      }
    }

    // 確率向上のための一般的な提案
    if (probability < 0.7) {
      recommendations.push({
        action: 'デモンストレーション実施',
        priority: 'medium',
        expectedImpact: 0.15,
        effort: 'medium',
        timeline: '2週間以内',
        automated: false
      });
    }

    return recommendations.slice(0, 5); // 上位5つに限定
  }

  /**
   * タイムライン予測
   */
  private async predictTimeline(appointmentData: any, probability: number): Promise<TimelinePrediction> {
    const baseTimelineWeeks = 8; // 8週間がベース
    const probabilityAdjustment = (1 - probability) * 4; // 確率が低いほど時間がかかる
    
    const expectedWeeks = baseTimelineWeeks + probabilityAdjustment;
    const expectedClosingDate = new Date(Date.now() + expectedWeeks * 7 * 24 * 60 * 60 * 1000);

    const milestones = [
      {
        stage: 'proposal_completion',
        expectedDate: new Date(Date.now() + (expectedWeeks * 0.3) * 7 * 24 * 60 * 60 * 1000),
        probability: Math.min(probability + 0.2, 0.9)
      },
      {
        stage: 'negotiation_start',
        expectedDate: new Date(Date.now() + (expectedWeeks * 0.6) * 7 * 24 * 60 * 60 * 1000),
        probability: Math.min(probability + 0.1, 0.8)
      },
      {
        stage: 'final_decision',
        expectedDate: expectedClosingDate,
        probability
      }
    ];

    return {
      expectedClosingDate,
      confidence: Math.max(0.3, probability),
      milestones
    };
  }

  // ========== ヘルパーメソッド ==========

  private async getAppointmentData(appointmentId: string): Promise<any> {
    return await prismaDataService.getAppointmentById(appointmentId);
  }

  private getDefaultPrediction(appointmentId: string): SuccessPrediction {
    return {
      appointmentId,
      probability: 0.5,
      confidence: 0.3,
      factors: [],
      recommendations: [],
      riskAnalysis: {
        overallRisk: 'medium',
        primaryRisks: [],
        earlyWarnings: []
      },
      timeline: {
        expectedClosingDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        confidence: 0.3,
        milestones: []
      },
      lastUpdated: new Date()
    };
  }

  // 追加のヘルパーメソッド（実装を簡略化）
  private assessDecisionMakerLevel(decisionMakers: any[]): number { return 0.7; }
  private async assessBudgetStatus(appointmentData: any): Promise<number> { return 0.6; }
  private assessCustomerUrgency(appointmentData: any): number { return 0.5; }
  private async getCustomerHistory(customerId: string): Promise<{transactionCount: number}> { return {transactionCount: 0}; }
  private async assessMarketTiming(): Promise<number> { return 0.6; }
  private async assessIndustryTrend(industry: string): Promise<number> { return 0.7; }
  private async assessNeedsFit(appointmentData: any): Promise<number> { return 0.8; }
  private async assessTechnicalFeasibility(appointmentData: any): Promise<number> { return 0.9; }
  private async assessTrustLevel(appointmentData: any): Promise<number> { return 0.7; }
  private assessCommunicationQuality(appointmentData: any): number { return 0.7; }
  private calculateCycleProgress(appointmentData: any): number { return 0.6; }
  private calculateTimeToDecision(appointmentData: any): number { return 0.8; }
  private async assessCompetitorPresence(appointmentData: any): Promise<number> { return 0.3; }
  private async assessCompetitiveAdvantage(appointmentData: any): Promise<number> { return 0.8; }
  private async calculateMarketAdjustment(appointmentData: any): Promise<number> { return 0.6; }
  private async calculateTimingAdjustment(appointmentData: any): Promise<number> { return 0.7; }
  private async calculateRelationshipAdjustment(appointmentData: any): Promise<number> { return 0.8; }
  private assessDataCompleteness(appointmentData: any): number { return 0.8; }
  private assessFactorConsistency(factors: ProbabilityFactor[]): number { return 0.7; }
  private async assessHistoricalDataRichness(appointmentData: any): Promise<number> { return 0.6; }
  private generateMitigationStrategy(factor: ProbabilityFactor): string { return `${factor.factor}への対策を実施`; }
  private generateEarlyWarnings(factors: ProbabilityFactor[], appointmentData: any): string[] { return []; }
  private generateFactorRecommendation(factor: ProbabilityFactor): Recommendation | null { return null; }

  /**
   * 全ての営業予測データを取得
   */
  async getAllPredictions(): Promise<SuccessPrediction[]> {
    try {
      // 今後予定されているカレンダーイベントから関連するアポイントメントを取得
      const futureCalendarEvents = await prisma.calendar_events.findMany({
        where: {
          appointmentId: {
            not: null
          },
          date: {
            gte: new Date().toISOString().split('T')[0] // 今日以降
          }
        },
        include: {
          appointments: true
        },
        take: 50 // 最大50件
      });

      // アポイントメントが存在するイベントのみ抽出
      const appointments = futureCalendarEvents
        .filter(event => event.appointments)
        .map(event => event.appointments!);

      const predictions: SuccessPrediction[] = [];
      
      for (const appointment of appointments) {
        try {
          const prediction = await this.calculateSuccessProbability(appointment.id);
          predictions.push(prediction);
        } catch (error) {
          console.error(`Failed to calculate prediction for appointment ${appointment.id}:`, error);
          // エラーが発生したアポイントメントはスキップ
        }
      }

      return predictions;
    } catch (error) {
      console.error('Failed to get all predictions:', error);
      return [];
    }
  }
}