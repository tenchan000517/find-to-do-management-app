// Phase 4: Sales Stage Automator
// 営業ステージ自動進行管理システム - Phase 3 異常検知エンジン連携

import { AnomalyDetectionEngine, AnomalyResult } from './AnomalyDetectionEngine';
import { SmartRecommendationEngine, BusinessRecommendation } from './SmartRecommendationEngine';

export interface SalesOpportunity {
  id: string;
  companyName: string;
  contactName: string;
  contactPosition?: string;
  dealValue: number;
  priority: 'A' | 'B' | 'C' | 'D';
  stage: SalesStage;
  expectedCloseDate: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  activities: SalesActivity[];
  riskScore: number;
  probabilityScore: number;
  lastActivityDate?: string;
}

export type SalesStage = 
  | 'prospect'      // 見込み客
  | 'qualified'     // 有効リード
  | 'proposal'      // 提案
  | 'negotiation'   // 交渉
  | 'closed_won'    // 受注
  | 'closed_lost';  // 失注

export interface SalesActivity {
  id: string;
  opportunityId: string;
  type: SalesActivityType;
  title: string;
  description?: string;
  outcome?: string;
  createdAt: string;
  scheduledDate?: string;
  completedAt?: string;
  userId: string;
  metadata: Record<string, any>;
}

export type SalesActivityType =
  | 'initial_contact'   // 初回接触
  | 'meeting'          // 商談
  | 'proposal_sent'    // 提案書送付
  | 'follow_up'        // フォローアップ
  | 'negotiation'      // 交渉
  | 'contract_review'  // 契約確認
  | 'contract_signed'  // 契約締結
  | 'lost_opportunity'; // 失注

export interface StageProgressionRule {
  fromStage: SalesStage;
  toStage: SalesStage;
  conditions: ProgressionCondition[];
  automaticProgression: boolean;
  requiredActivities: SalesActivityType[];
  minimumDaysInStage: number;
  warningThreshold: number; // 日数
  escalationThreshold: number; // 日数
}

export interface ProgressionCondition {
  type: 'activity_count' | 'activity_outcome' | 'time_elapsed' | 'deal_value' | 'priority' | 'custom';
  operator: 'gte' | 'lte' | 'eq' | 'contains' | 'exists';
  value: any;
  weight: number; // 条件の重み (0-1)
}

export interface AutomationResult {
  opportunityId: string;
  action: 'stage_progression' | 'risk_alert' | 'follow_up_reminder' | 'escalation';
  previousStage?: SalesStage;
  newStage?: SalesStage;
  reason: string;
  confidence: number;
  recommendedActions: string[];
  createdTasks?: AutomatedTask[];
}

export interface AutomatedTask {
  id: string;
  title: string;
  description: string;
  assigneeId?: string;
  dueDate: string;
  priority: 'A' | 'B' | 'C' | 'D';
  type: 'follow_up' | 'proposal' | 'contract' | 'analysis' | 'escalation';
  linkedOpportunityId: string;
  automationSource: string;
}

export interface SalesMetrics {
  totalOpportunities: number;
  activeOpportunities: number;
  conversionRate: number;
  averageDealSize: number;
  averageSalesCycle: number;
  stageDistribution: Record<SalesStage, number>;
  riskDistribution: Record<string, number>;
  pipelineValue: number;
  forecastedRevenue: number;
}

export class SalesStageAutomator {
  private anomalyEngine: AnomalyDetectionEngine;
  private recommendationEngine: SmartRecommendationEngine;
  private progressionRules!: StageProgressionRule[];

  constructor() {
    this.anomalyEngine = new AnomalyDetectionEngine({
      sensitivity: 0.8,
      windowSize: 30,
      threshold: 2.0
    });
    this.recommendationEngine = new SmartRecommendationEngine();
    this.initializeProgressionRules();
  }

  /**
   * 営業ステージ進行ルールの初期化
   */
  private initializeProgressionRules(): void {
    this.progressionRules = [
      {
        fromStage: 'prospect',
        toStage: 'qualified',
        automaticProgression: true,
        requiredActivities: ['initial_contact'],
        minimumDaysInStage: 1,
        warningThreshold: 7,
        escalationThreshold: 14,
        conditions: [
          {
            type: 'activity_count',
            operator: 'gte',
            value: 1,
            weight: 0.6
          },
          {
            type: 'activity_outcome',
            operator: 'contains',
            value: ['positive', 'interested'],
            weight: 0.4
          }
        ]
      },
      {
        fromStage: 'qualified',
        toStage: 'proposal',
        automaticProgression: true,
        requiredActivities: ['meeting'],
        minimumDaysInStage: 3,
        warningThreshold: 14,
        escalationThreshold: 21,
        conditions: [
          {
            type: 'activity_count',
            operator: 'gte',
            value: 2,
            weight: 0.5
          },
          {
            type: 'deal_value',
            operator: 'gte',
            value: 100000,
            weight: 0.3
          },
          {
            type: 'activity_outcome',
            operator: 'contains',
            value: ['needs_identified', 'budget_confirmed'],
            weight: 0.2
          }
        ]
      },
      {
        fromStage: 'proposal',
        toStage: 'negotiation',
        automaticProgression: false, // 手動確認が必要
        requiredActivities: ['proposal_sent'],
        minimumDaysInStage: 7,
        warningThreshold: 21,
        escalationThreshold: 30,
        conditions: [
          {
            type: 'activity_outcome',
            operator: 'contains',
            value: ['proposal_reviewed', 'feedback_received'],
            weight: 0.7
          },
          {
            type: 'time_elapsed',
            operator: 'gte',
            value: 7,
            weight: 0.3
          }
        ]
      },
      {
        fromStage: 'negotiation',
        toStage: 'closed_won',
        automaticProgression: false,
        requiredActivities: ['contract_review'],
        minimumDaysInStage: 3,
        warningThreshold: 14,
        escalationThreshold: 30,
        conditions: [
          {
            type: 'activity_outcome',
            operator: 'contains',
            value: ['contract_agreed', 'terms_accepted'],
            weight: 0.8
          },
          {
            type: 'activity_count',
            operator: 'gte',
            value: 1,
            weight: 0.2
          }
        ]
      }
    ];
  }

  /**
   * 営業案件の自動監視・進行処理
   */
  async processAutomaticProgression(opportunities: SalesOpportunity[]): Promise<AutomationResult[]> {
    const results: AutomationResult[] = [];

    for (const opportunity of opportunities) {
      try {
        // リスク分析
        const riskAnalysis = await this.analyzeOpportunityRisk(opportunity);
        
        // ステージ進行チェック
        const progressionResult = await this.checkStageProgression(opportunity);
        if (progressionResult) {
          results.push(progressionResult);
        }

        // 異常検知による警告
        const anomalyResult = await this.detectOpportunityAnomalies(opportunity);
        if (anomalyResult) {
          results.push(anomalyResult);
        }

        // フォローアップリマインダー
        const reminderResult = await this.checkFollowUpReminders(opportunity);
        if (reminderResult) {
          results.push(reminderResult);
        }

        // エスカレーション判定
        const escalationResult = await this.checkEscalationNeeded(opportunity);
        if (escalationResult) {
          results.push(escalationResult);
        }

      } catch (error) {
        console.error(`Error processing opportunity ${opportunity.id}:`, error);
      }
    }

    return results;
  }

  /**
   * 営業案件のリスク分析
   */
  async analyzeOpportunityRisk(opportunity: SalesOpportunity): Promise<number> {
    let riskScore = 0;

    // 最終活動からの経過日数
    if (opportunity.lastActivityDate) {
      const daysSinceLastActivity = this.getDaysBetween(opportunity.lastActivityDate, new Date().toISOString());
      if (daysSinceLastActivity > 30) riskScore += 0.3;
      else if (daysSinceLastActivity > 14) riskScore += 0.2;
      else if (daysSinceLastActivity > 7) riskScore += 0.1;
    }

    // 期限切れリスク
    const daysToClose = this.getDaysBetween(new Date().toISOString(), opportunity.expectedCloseDate);
    if (daysToClose < 0) riskScore += 0.4; // 期限切れ
    else if (daysToClose < 7) riskScore += 0.2; // 期限まで1週間

    // ステージでの滞在期間
    const daysInCurrentStage = this.getDaysBetween(opportunity.updatedAt, new Date().toISOString());
    const rule = this.getProgressionRule(opportunity.stage);
    if (rule && daysInCurrentStage > rule.escalationThreshold) {
      riskScore += 0.3;
    }

    // 活動頻度の分析
    const recentActivities = opportunity.activities.filter(activity => {
      const activityDate = new Date(activity.createdAt);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return activityDate > thirtyDaysAgo;
    });

    if (recentActivities.length === 0) riskScore += 0.2;
    else if (recentActivities.length < 2) riskScore += 0.1;

    // 案件金額による重み付け
    if (opportunity.dealValue > 1000000) {
      riskScore *= 1.2; // 高額案件はリスクを高く評価
    }

    return Math.min(riskScore, 1.0);
  }

  /**
   * ステージ進行のチェック
   */
  async checkStageProgression(opportunity: SalesOpportunity): Promise<AutomationResult | null> {
    const rule = this.getProgressionRule(opportunity.stage);
    if (!rule) return null;

    const progressionScore = this.calculateProgressionScore(opportunity, rule);
    
    if (progressionScore >= 0.8 && rule.automaticProgression) {
      // 自動進行
      const tasks = await this.createStageProgressionTasks(opportunity, rule.toStage);
      
      return {
        opportunityId: opportunity.id,
        action: 'stage_progression',
        previousStage: opportunity.stage,
        newStage: rule.toStage,
        reason: `自動進行条件を満たしました (スコア: ${Math.round(progressionScore * 100)}%)`,
        confidence: progressionScore,
        recommendedActions: [
          `営業ステージを「${this.getStageDisplayName(rule.toStage)}」に更新`,
          '次ステージのアクションプランを確認',
          '必要に応じて関係者に通知'
        ],
        createdTasks: tasks
      };
    } else if (progressionScore >= 0.6 && !rule.automaticProgression) {
      // 手動確認推奨
      return {
        opportunityId: opportunity.id,
        action: 'stage_progression',
        previousStage: opportunity.stage,
        newStage: rule.toStage,
        reason: `ステージ進行の確認が必要です (スコア: ${Math.round(progressionScore * 100)}%)`,
        confidence: progressionScore,
        recommendedActions: [
          '営業担当者による手動確認を実施',
          'ステージ進行の妥当性を検証',
          '必要に応じてステージを更新'
        ]
      };
    }

    return null;
  }

  /**
   * 異常検知による警告
   */
  async detectOpportunityAnomalies(opportunity: SalesOpportunity): Promise<AutomationResult | null> {
    // 活動パターンの分析
    const activityData = opportunity.activities.map(activity => ({
      timestamp: activity.createdAt,
      value: this.getActivityValue(activity.type),
      metadata: { type: activity.type, outcome: activity.outcome }
    }));

    if (activityData.length < 5) return null;

    const anomalies = this.anomalyEngine.detectTimeSeriesAnomalies(activityData);
    const criticalAnomalies = anomalies.filter(a => a.isAnomaly && a.severity === 'critical');

    if (criticalAnomalies.length > 0) {
      return {
        opportunityId: opportunity.id,
        action: 'risk_alert',
        reason: '営業活動パターンに異常が検出されました',
        confidence: Math.max(...criticalAnomalies.map(a => a.confidence)),
        recommendedActions: [
          '営業担当者との面談を設定',
          '案件の詳細状況を確認',
          '必要に応じてサポートを提供',
          'リスク軽減策の実施'
        ]
      };
    }

    return null;
  }

  /**
   * フォローアップリマインダーのチェック
   */
  async checkFollowUpReminders(opportunity: SalesOpportunity): Promise<AutomationResult | null> {
    if (!opportunity.lastActivityDate) return null;

    const daysSinceLastActivity = this.getDaysBetween(opportunity.lastActivityDate, new Date().toISOString());
    const rule = this.getProgressionRule(opportunity.stage);

    if (rule && daysSinceLastActivity >= rule.warningThreshold) {
      const tasks = await this.createFollowUpTasks(opportunity);
      
      return {
        opportunityId: opportunity.id,
        action: 'follow_up_reminder',
        reason: `${daysSinceLastActivity}日間活動がありません`,
        confidence: 0.9,
        recommendedActions: [
          '顧客への積極的なフォローアップ',
          '案件の現状確認',
          '次のアクションプランの策定'
        ],
        createdTasks: tasks
      };
    }

    return null;
  }

  /**
   * エスカレーション判定
   */
  async checkEscalationNeeded(opportunity: SalesOpportunity): Promise<AutomationResult | null> {
    const rule = this.getProgressionRule(opportunity.stage);
    if (!rule) return null;

    const daysInStage = this.getDaysBetween(opportunity.updatedAt, new Date().toISOString());
    const riskScore = await this.analyzeOpportunityRisk(opportunity);

    if (daysInStage >= rule.escalationThreshold || riskScore > 0.7) {
      const tasks = await this.createEscalationTasks(opportunity);
      
      return {
        opportunityId: opportunity.id,
        action: 'escalation',
        reason: `エスカレーションが必要です (ステージ滞在: ${daysInStage}日, リスク: ${Math.round(riskScore * 100)}%)`,
        confidence: Math.min(riskScore + 0.3, 1.0),
        recommendedActions: [
          'マネージャーによる案件レビュー',
          '顧客との関係性の再評価',
          '戦略的アプローチの見直し',
          '必要に応じて追加リソースの投入'
        ],
        createdTasks: tasks
      };
    }

    return null;
  }

  /**
   * 営業メトリクスの計算
   */
  async calculateSalesMetrics(opportunities: SalesOpportunity[]): Promise<SalesMetrics> {
    const activeOpportunities = opportunities.filter(opp => 
      !['closed_won', 'closed_lost'].includes(opp.stage)
    );

    const wonOpportunities = opportunities.filter(opp => opp.stage === 'closed_won');
    const totalClosed = opportunities.filter(opp => 
      ['closed_won', 'closed_lost'].includes(opp.stage)
    );

    const conversionRate = totalClosed.length > 0 ? wonOpportunities.length / totalClosed.length : 0;
    const averageDealSize = wonOpportunities.length > 0 
      ? wonOpportunities.reduce((sum, opp) => sum + opp.dealValue, 0) / wonOpportunities.length 
      : 0;

    // 営業サイクルの計算
    const salesCycles = wonOpportunities.map(opp => {
      const created = new Date(opp.createdAt);
      const won = new Date(opp.updatedAt);
      return this.getDaysBetween(opp.createdAt, opp.updatedAt);
    });
    const averageSalesCycle = salesCycles.length > 0 
      ? salesCycles.reduce((sum, cycle) => sum + cycle, 0) / salesCycles.length 
      : 0;

    // ステージ分布
    const stageDistribution = opportunities.reduce((dist, opp) => {
      dist[opp.stage] = (dist[opp.stage] || 0) + 1;
      return dist;
    }, {} as Record<SalesStage, number>);

    // リスク分布
    const riskDistribution = opportunities.reduce((dist, opp) => {
      const riskLevel = opp.riskScore > 0.7 ? 'high' : opp.riskScore > 0.4 ? 'medium' : 'low';
      dist[riskLevel] = (dist[riskLevel] || 0) + 1;
      return dist;
    }, {} as Record<string, number>);

    const pipelineValue = activeOpportunities.reduce((sum, opp) => sum + opp.dealValue, 0);
    const forecastedRevenue = activeOpportunities.reduce((sum, opp) => {
      const probabilityByStage = {
        prospect: 0.1,
        qualified: 0.25,
        proposal: 0.5,
        negotiation: 0.75
      };
      return sum + (opp.dealValue * (probabilityByStage[opp.stage as keyof typeof probabilityByStage] || 0));
    }, 0);

    return {
      totalOpportunities: opportunities.length,
      activeOpportunities: activeOpportunities.length,
      conversionRate,
      averageDealSize,
      averageSalesCycle,
      stageDistribution,
      riskDistribution,
      pipelineValue,
      forecastedRevenue
    };
  }

  // ヘルパーメソッド
  private getProgressionRule(stage: SalesStage): StageProgressionRule | null {
    return this.progressionRules.find(rule => rule.fromStage === stage) || null;
  }

  private calculateProgressionScore(opportunity: SalesOpportunity, rule: StageProgressionRule): number {
    let score = 0;

    for (const condition of rule.conditions) {
      const conditionMet = this.evaluateCondition(opportunity, condition);
      if (conditionMet) {
        score += condition.weight;
      }
    }

    // 必須活動のチェック
    const hasRequiredActivities = rule.requiredActivities.every(activityType =>
      opportunity.activities.some(activity => activity.type === activityType)
    );

    if (!hasRequiredActivities) {
      score *= 0.5; // 必須活動がない場合はスコアを半減
    }

    // 最小滞在期間のチェック
    const daysInStage = this.getDaysBetween(opportunity.updatedAt, new Date().toISOString());
    if (daysInStage < rule.minimumDaysInStage) {
      score *= 0.3; // 最小期間未満の場合はスコアを大幅減
    }

    return Math.min(score, 1.0);
  }

  private evaluateCondition(opportunity: SalesOpportunity, condition: ProgressionCondition): boolean {
    switch (condition.type) {
      case 'activity_count':
        const activityCount = opportunity.activities.length;
        return this.compareValues(activityCount, condition.operator, condition.value);

      case 'activity_outcome':
        const outcomes = opportunity.activities.map(a => a.outcome).filter(Boolean);
        if (condition.operator === 'contains') {
          return condition.value.some((val: string) => outcomes.some(outcome => outcome?.includes(val)));
        }
        return false;

      case 'time_elapsed':
        const daysInStage = this.getDaysBetween(opportunity.updatedAt, new Date().toISOString());
        return this.compareValues(daysInStage, condition.operator, condition.value);

      case 'deal_value':
        return this.compareValues(opportunity.dealValue, condition.operator, condition.value);

      case 'priority':
        const priorityValues = { A: 4, B: 3, C: 2, D: 1 };
        const currentPriority = priorityValues[opportunity.priority];
        const targetPriority = priorityValues[condition.value as keyof typeof priorityValues];
        return this.compareValues(currentPriority, condition.operator, targetPriority);

      default:
        return false;
    }
  }

  private compareValues(actual: number, operator: string, expected: number): boolean {
    switch (operator) {
      case 'gte': return actual >= expected;
      case 'lte': return actual <= expected;
      case 'eq': return actual === expected;
      default: return false;
    }
  }

  private getActivityValue(activityType: SalesActivityType): number {
    const values = {
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

  private getDaysBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private getStageDisplayName(stage: SalesStage): string {
    const displayNames = {
      prospect: '見込み客',
      qualified: '有効リード',
      proposal: '提案',
      negotiation: '交渉',
      closed_won: '受注',
      closed_lost: '失注'
    };
    return displayNames[stage];
  }

  private async createStageProgressionTasks(opportunity: SalesOpportunity, newStage: SalesStage): Promise<AutomatedTask[]> {
    const tasks: AutomatedTask[] = [];
    const baseId = `${opportunity.id}_${newStage}_${Date.now()}`;

    switch (newStage) {
      case 'qualified':
        tasks.push({
          id: `${baseId}_needs_analysis`,
          title: 'ニーズ分析の実施',
          description: `${opportunity.companyName}のニーズを詳細に分析し、提案準備を開始してください。`,
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'B',
          type: 'follow_up',
          linkedOpportunityId: opportunity.id,
          automationSource: 'stage_progression'
        });
        break;

      case 'proposal':
        tasks.push({
          id: `${baseId}_proposal_creation`,
          title: '提案書作成',
          description: `${opportunity.companyName}向けの提案書を作成してください。`,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'A',
          type: 'proposal',
          linkedOpportunityId: opportunity.id,
          automationSource: 'stage_progression'
        });
        break;

      case 'negotiation':
        tasks.push({
          id: `${baseId}_negotiation_prep`,
          title: '交渉準備',
          description: `${opportunity.companyName}との交渉準備を行ってください。`,
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'A',
          type: 'follow_up',
          linkedOpportunityId: opportunity.id,
          automationSource: 'stage_progression'
        });
        break;

      case 'closed_won':
        tasks.push({
          id: `${baseId}_contract_finalization`,
          title: '契約手続き完了',
          description: `${opportunity.companyName}との契約手続きを完了してください。`,
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'A',
          type: 'contract',
          linkedOpportunityId: opportunity.id,
          automationSource: 'stage_progression'
        });
        break;
    }

    return tasks;
  }

  private async createFollowUpTasks(opportunity: SalesOpportunity): Promise<AutomatedTask[]> {
    const tasks: AutomatedTask[] = [];
    const baseId = `${opportunity.id}_followup_${Date.now()}`;

    tasks.push({
      id: baseId,
      title: `フォローアップ: ${opportunity.companyName}`,
      description: `${opportunity.companyName}への積極的なフォローアップを実施してください。`,
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'B',
      type: 'follow_up',
      linkedOpportunityId: opportunity.id,
      automationSource: 'follow_up_reminder'
    });

    return tasks;
  }

  private async createEscalationTasks(opportunity: SalesOpportunity): Promise<AutomatedTask[]> {
    const tasks: AutomatedTask[] = [];
    const baseId = `${opportunity.id}_escalation_${Date.now()}`;

    tasks.push({
      id: baseId,
      title: `エスカレーション対応: ${opportunity.companyName}`,
      description: `${opportunity.companyName}案件のエスカレーション対応を実施してください。`,
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'A',
      type: 'escalation',
      linkedOpportunityId: opportunity.id,
      automationSource: 'escalation'
    });

    return tasks;
  }
}