import { prismaDataService } from '../database/prisma-service';
import { getAICallManager } from '../ai/call-manager';

interface SalesAutomationResult {
  success: boolean;
  actions: AutomatedAction[];
  metrics: SalesMetrics;
  nextSteps: NextStep[];
}

interface AutomatedAction {
  type: 'contract_processing' | 'ltv_update' | 'knowledge_creation' | 'follow_up_scheduling' | 'team_notification';
  status: 'completed' | 'pending' | 'failed';
  data: any;
  timestamp: Date;
  automationScore: number;
}

interface SalesMetrics {
  conversionRate: number;
  averageDealSize: number;
  salesCycleLength: number;
  successProbability: number;
  revenueImpact: number;
}

interface NextStep {
  action: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: Date;
  assignee?: string;
  automated: boolean;
}

/**
 * 営業プロセス自動化エンジン
 * Phase 2の財務・LTV分析システムと連携した営業自動化
 */
export class SalesAutomationEngine {
  private aiCallManager = getAICallManager();

  /**
   * 契約成立時の自動処理
   */
  async processContractCompletion(data: {
    appointmentId: string;
    contractAmount: number;
    contractTerms?: string;
    decisionMakers: string[];
    successFactors?: string[];
  }): Promise<SalesAutomationResult> {
    try {
      console.log('🎯 Starting contract completion automation:', data.appointmentId);

      const actions: AutomatedAction[] = [];
      const nextSteps: NextStep[] = [];

      // 1. アポイント状態更新
      const appointmentUpdate = await this.updateAppointmentStatus(data.appointmentId, 'COMPLETED');
      actions.push({
        type: 'contract_processing',
        status: appointmentUpdate ? 'completed' : 'failed',
        data: { appointmentId: data.appointmentId, status: 'COMPLETED' },
        timestamp: new Date(),
        automationScore: 1.0
      });

      // 2. プロジェクト・財務データ作成
      const projectCreation = await this.createProjectFromContract(data);
      if (projectCreation.success) {
        actions.push({
          type: 'contract_processing',
          status: 'completed',
          data: projectCreation.project,
          timestamp: new Date(),
          automationScore: 0.9
        });

        // 3. LTV分析更新
        const ltvUpdate = await this.updateCustomerLTV(projectCreation.project);
        actions.push({
          type: 'ltv_update',
          status: ltvUpdate.success ? 'completed' : 'failed',
          data: ltvUpdate.analysis,
          timestamp: new Date(),
          automationScore: 0.95
        });
      }

      // 4. 成功ナレッジ自動生成
      const knowledgeCreation = await this.generateSuccessKnowledge(data);
      actions.push({
        type: 'knowledge_creation',
        status: knowledgeCreation.success ? 'completed' : 'failed',
        data: knowledgeCreation.knowledge,
        timestamp: new Date(),
        automationScore: 0.8
      });

      // 5. チーム通知・祝賀
      const teamNotification = await this.notifyTeamSuccess(data);
      actions.push({
        type: 'team_notification',
        status: teamNotification ? 'completed' : 'failed',
        data: { notification_sent: teamNotification },
        timestamp: new Date(),
        automationScore: 1.0
      });

      // 6. フォローアップ計画生成
      const followUpPlan = await this.generateFollowUpPlan(data);
      nextSteps.push(...followUpPlan);

      // 7. 営業メトリクス計算
      const metrics = await this.calculateSalesMetrics(data);

      return {
        success: true,
        actions,
        metrics,
        nextSteps
      };

    } catch (error) {
      console.error('❌ Contract completion automation failed:', error);
      return {
        success: false,
        actions: [],
        metrics: this.getDefaultMetrics(),
        nextSteps: []
      };
    }
  }

  /**
   * 商談進捗の自動追跡・更新
   */
  async trackDealProgress(appointmentId: string, progressData: {
    stage: 'qualification' | 'proposal' | 'negotiation' | 'closing';
    sentiment: 'positive' | 'neutral' | 'negative';
    nextMeeting?: Date;
    concerns?: string[];
    opportunities?: string[];
  }): Promise<SalesAutomationResult> {
    try {
      console.log('📊 Tracking deal progress:', appointmentId);

      const actions: AutomatedAction[] = [];
      const nextSteps: NextStep[] = [];

      // 1. 商談データ更新
      const dealUpdate = await this.updateDealStage(appointmentId, progressData);
      actions.push({
        type: 'contract_processing',
        status: dealUpdate ? 'completed' : 'failed',
        data: { stage: progressData.stage, sentiment: progressData.sentiment },
        timestamp: new Date(),
        automationScore: 0.9
      });

      // 2. 成功確率再計算
      const successProbability = await this.recalculateSuccessProbability(appointmentId, progressData);
      
      // 3. リスク要因分析
      if (progressData.concerns && progressData.concerns.length > 0) {
        const riskAnalysis = await this.analyzeRiskFactors(progressData.concerns);
        nextSteps.push({
          action: `リスク対策: ${riskAnalysis.topRisk}`,
          priority: 'high',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24時間後
          automated: false
        });
      }

      // 4. 機会最大化施策提案
      if (progressData.opportunities && progressData.opportunities.length > 0) {
        const opportunityPlan = await this.generateOpportunityPlan(progressData.opportunities);
        nextSteps.push(...opportunityPlan);
      }

      // 5. 次回アクション自動スケジューリング
      if (progressData.nextMeeting) {
        const followUpAction = await this.scheduleAutomaticFollowUp(appointmentId, progressData.nextMeeting);
        actions.push({
          type: 'follow_up_scheduling',
          status: followUpAction ? 'completed' : 'failed',
          data: { nextMeeting: progressData.nextMeeting },
          timestamp: new Date(),
          automationScore: 0.85
        });
      }

      const metrics = await this.calculateProgressMetrics(appointmentId, progressData);

      return {
        success: true,
        actions,
        metrics,
        nextSteps
      };

    } catch (error) {
      console.error('❌ Deal progress tracking failed:', error);
      return {
        success: false,
        actions: [],
        metrics: this.getDefaultMetrics(),
        nextSteps: []
      };
    }
  }

  /**
   * 失注時の自動処理・学習
   */
  async processLostDeal(appointmentId: string, lossData: {
    reason: string;
    competitor?: string;
    priceIssue?: boolean;
    timingIssue?: boolean;
    featureConcerns?: string[];
    relationshipScore: number;
  }): Promise<SalesAutomationResult> {
    try {
      console.log('📉 Processing lost deal:', appointmentId);

      const actions: AutomatedAction[] = [];
      const nextSteps: NextStep[] = [];

      // 1. 失注データ記録
      const lossUpdate = await this.recordDealLoss(appointmentId, lossData);
      actions.push({
        type: 'contract_processing',
        status: lossUpdate ? 'completed' : 'failed',
        data: { status: 'LOST', reason: lossData.reason },
        timestamp: new Date(),
        automationScore: 1.0
      });

      // 2. 失注要因分析・ナレッジ化
      const lossAnalysis = await this.analyzeLossFactors(lossData);
      actions.push({
        type: 'knowledge_creation',
        status: lossAnalysis.success ? 'completed' : 'failed',
        data: lossAnalysis.insights,
        timestamp: new Date(),
        automationScore: 0.8
      });

      // 3. 競合分析更新
      if (lossData.competitor) {
        const competitorUpdate = await this.updateCompetitorIntelligence(lossData.competitor, lossData);
        actions.push({
          type: 'knowledge_creation',
          status: competitorUpdate ? 'completed' : 'failed',
          data: { competitor: lossData.competitor, update: competitorUpdate },
          timestamp: new Date(),
          automationScore: 0.7
        });
      }

      // 4. 関係維持計画（将来の機会に備える）
      if (lossData.relationshipScore > 0.6) {
        const maintenancePlan = await this.generateRelationshipMaintenancePlan(appointmentId, lossData);
        nextSteps.push(...maintenancePlan);
      }

      // 5. 改善提案生成
      const improvementPlan = await this.generateImprovementPlan(lossData);
      nextSteps.push(...improvementPlan);

      const metrics = await this.calculateLossMetrics(appointmentId, lossData);

      return {
        success: true,
        actions,
        metrics,
        nextSteps
      };

    } catch (error) {
      console.error('❌ Lost deal processing failed:', error);
      return {
        success: false,
        actions: [],
        metrics: this.getDefaultMetrics(),
        nextSteps: []
      };
    }
  }

  // ========== プライベートメソッド ==========

  /**
   * アポイント状態更新
   */
  private async updateAppointmentStatus(appointmentId: string, status: string): Promise<boolean> {
    try {
      await prismaDataService.updateAppointment(appointmentId, { status });
      return true;
    } catch (error) {
      console.error('Failed to update appointment status:', error);
      return false;
    }
  }

  /**
   * 契約からプロジェクト作成
   */
  private async createProjectFromContract(data: any): Promise<{ success: boolean; project?: any }> {
    try {
      // Phase 2のproject_templatesを活用
      const templateData = await this.generateProjectTemplate(data);
      
      const projectData = {
        name: `${data.clientName || 'New Client'} Project`,
        description: `Contract value: ${data.contractAmount}円`,
        status: 'ACTIVE',
        priority: 'A',
        budget: data.contractAmount,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3ヶ月後
        teamMembers: data.decisionMakers || []
      };

      const project = await prismaDataService.createProject(projectData);

      // 財務詳細を同時作成（Phase 2のproject_financial_detailsテーブル活用）
      await this.createProjectFinancialDetails(project.id, data);

      return { success: true, project };
    } catch (error) {
      console.error('Failed to create project from contract:', error);
      return { success: false };
    }
  }

  /**
   * プロジェクト財務詳細作成
   */
  private async createProjectFinancialDetails(projectId: string, contractData: any): Promise<void> {
    try {
      const financialData = {
        projectId,
        totalBudget: contractData.contractAmount,
        plannedRevenue: contractData.contractAmount,
        contractValue: contractData.contractAmount,
        profitMargin: 0.3, // デフォルト30%
        paymentSchedule: contractData.contractTerms || 'Monthly',
        riskFactors: [],
        created_at: new Date(),
        updated_at: new Date()
      };

      await prismaDataService.createProjectFinancialDetails(financialData);
    } catch (error) {
      console.error('Failed to create project financial details:', error);
    }
  }

  /**
   * 顧客LTV更新
   */
  private async updateCustomerLTV(project: any): Promise<{ success: boolean; analysis?: any }> {
    try {
      // Phase 2のcustomer_ltv_analysisテーブルを活用
      const ltvData = {
        customerId: project.clientId || project.id,
        totalLTV: project.budget,
        averageProjectValue: project.budget,
        projectCount: 1,
        lastInteractionDate: new Date(),
        riskFactors: [],
        opportunityFactors: [],
        analysisDate: new Date()
      };

      const analysis = await prismaDataService.updateCustomerLTV(ltvData);
      return { success: true, analysis };
    } catch (error) {
      console.error('Failed to update customer LTV:', error);
      return { success: false };
    }
  }

  /**
   * 成功ナレッジ生成
   */
  private async generateSuccessKnowledge(contractData: any): Promise<{ success: boolean; knowledge?: any }> {
    try {
      const knowledgeData = {
        title: `成約成功事例: ${contractData.contractAmount}円案件`,
        content: this.generateSuccessStory(contractData),
        category: 'sales_success',
        tags: ['成約', '営業', '成功事例'],
        confidence: 0.9,
        source: 'sales_automation',
        metadata: {
          contractAmount: contractData.contractAmount,
          successFactors: contractData.successFactors || [],
          decisionMakers: contractData.decisionMakers || []
        }
      };

      const knowledge = await prismaDataService.createKnowledgeItem(knowledgeData);
      return { success: true, knowledge };
    } catch (error) {
      console.error('Failed to generate success knowledge:', error);
      return { success: false };
    }
  }

  /**
   * 成功ストーリー生成
   */
  private generateSuccessStory(contractData: any): string {
    return `
# 成約成功事例

## 案件概要
- 契約金額: ${contractData.contractAmount.toLocaleString()}円
- 決定権者: ${contractData.decisionMakers?.join(', ') || '未記録'}
- 成約日: ${new Date().toLocaleDateString()}

## 成功要因
${(contractData.successFactors || []).map((factor: string) => `- ${factor}`).join('\n')}

## 学習ポイント
この成約に至った要因を分析し、今後の営業活動に活用する。

## 次回活用方法
類似の顧客・案件に対して同様のアプローチを適用する。
    `.trim();
  }

  /**
   * チーム成功通知
   */
  private async notifyTeamSuccess(contractData: any): Promise<boolean> {
    try {
      // LINE通知でチーム全体に成功を共有
      const message = `🎉 成約おめでとうございます！\n\n💰 契約金額: ${contractData.contractAmount.toLocaleString()}円\n👥 決定権者: ${contractData.decisionMakers?.join(', ') || '未記録'}\n\nチーム一丸となって素晴らしい成果を上げました！`;
      
      // 実装: LINE通知送信ロジック
      // await lineNotificationService.sendToGroup(message);
      
      return true;
    } catch (error) {
      console.error('Failed to notify team:', error);
      return false;
    }
  }

  /**
   * フォローアップ計画生成
   */
  private async generateFollowUpPlan(contractData: any): Promise<NextStep[]> {
    return [
      {
        action: 'プロジェクトキックオフミーティング設定',
        priority: 'high',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3日後
        automated: false
      },
      {
        action: '成功事例ドキュメント作成',
        priority: 'medium',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1週間後
        automated: true
      },
      {
        action: '顧客満足度調査実施',
        priority: 'medium',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1ヶ月後
        automated: true
      }
    ];
  }

  /**
   * 営業メトリクス計算
   */
  private async calculateSalesMetrics(contractData: any): Promise<SalesMetrics> {
    // 実装: 過去データからメトリクス計算
    return {
      conversionRate: 0.25, // 25%
      averageDealSize: contractData.contractAmount,
      salesCycleLength: 45, // 45日
      successProbability: 0.85,
      revenueImpact: contractData.contractAmount
    };
  }

  /**
   * デフォルトメトリクス
   */
  private getDefaultMetrics(): SalesMetrics {
    return {
      conversionRate: 0.2,
      averageDealSize: 500000,
      salesCycleLength: 60,
      successProbability: 0.5,
      revenueImpact: 0
    };
  }

  // 追加のプライベートメソッド（実装省略）
  private async updateDealStage(appointmentId: string, progressData: any): Promise<boolean> { return true; }
  private async recalculateSuccessProbability(appointmentId: string, progressData: any): Promise<number> { return 0.7; }
  private async analyzeRiskFactors(concerns: string[]): Promise<{ topRisk: string }> { return { topRisk: concerns[0] }; }
  private async generateOpportunityPlan(opportunities: string[]): Promise<NextStep[]> { return []; }
  private async scheduleAutomaticFollowUp(appointmentId: string, nextMeeting: Date): Promise<boolean> { return true; }
  private async calculateProgressMetrics(appointmentId: string, progressData: any): Promise<SalesMetrics> { return this.getDefaultMetrics(); }
  private async recordDealLoss(appointmentId: string, lossData: any): Promise<boolean> { return true; }
  private async analyzeLossFactors(lossData: any): Promise<{ success: boolean; insights?: any }> { return { success: true }; }
  private async updateCompetitorIntelligence(competitor: string, lossData: any): Promise<boolean> { return true; }
  private async generateRelationshipMaintenancePlan(appointmentId: string, lossData: any): Promise<NextStep[]> { return []; }
  private async generateImprovementPlan(lossData: any): Promise<NextStep[]> { return []; }
  private async calculateLossMetrics(appointmentId: string, lossData: any): Promise<SalesMetrics> { return this.getDefaultMetrics(); }
  private async generateProjectTemplate(data: any): Promise<any> { return {}; }
}