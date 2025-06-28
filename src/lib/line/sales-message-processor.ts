import { LineWebhookEvent } from './webhook-validator';
import { SalesNLPEnhancer } from './sales-nlp-enhancer';
import { SalesAutomationEngine } from '../services/sales-automation-engine';
import { SuccessProbabilityEngine } from '../services/success-probability-engine';
import { AISalesAssistant } from '../services/ai-sales-assistant';
import { sendReplyMessage, sendPushMessage } from './notification';
import sessionManager from './session-manager';

interface SalesProcessingResult {
  success: boolean;
  responseMessage: string;
  actions: SalesAction[];
  follow_up_required: boolean;
  automated_tasks: AutomatedTask[];
}

interface SalesAction {
  type: 'update_deal' | 'create_task' | 'schedule_meeting' | 'send_notification' | 'generate_report';
  data: any;
  priority: 'high' | 'medium' | 'low';
  automated: boolean;
}

interface AutomatedTask {
  description: string;
  scheduled_date: Date;
  assignee: string;
  category: 'follow_up' | 'analysis' | 'reporting' | 'relationship_management';
}

/**
 * 営業特化メッセージ処理システム
 * 既存のLINE Bot基盤に営業機能を統合
 */
export class SalesMessageProcessor {
  private salesNLP = new SalesNLPEnhancer();
  private automationEngine = new SalesAutomationEngine();
  private successEngine = new SuccessProbabilityEngine();
  private aiAssistant = new AISalesAssistant();

  /**
   * 営業メッセージの総合処理
   */
  async processSalesMessage(event: LineWebhookEvent, cleanedText: string): Promise<SalesProcessingResult> {
    try {
      console.log('🎯 Processing sales message:', cleanedText);

      // 1. 営業意図分析
      const salesIntent = await this.salesNLP.analyzeSalesIntent(
        cleanedText,
        event.source.userId,
        { groupId: event.source.groupId }
      );

      console.log('🔍 Sales intent detected:', salesIntent.type, `(${Math.round(salesIntent.confidence * 100)}%)`);

      // 2. 信頼度チェック
      if (salesIntent.confidence < 0.6) {
        return await this.handleGeneralSalesInquiry(event, cleanedText);
      }

      // 3. 営業意図別処理
      const result = await this.routeSalesIntent(event, salesIntent, cleanedText);

      // 4. フォローアップタスク生成
      const followUpTasks = await this.generateFollowUpTasks(salesIntent, result);

      // 5. 自動化アクション実行
      await this.executeAutomatedActions(result.actions);

      return {
        ...result,
        automated_tasks: followUpTasks
      };

    } catch (error) {
      console.error('❌ Sales message processing failed:', error);
      return {
        success: false,
        responseMessage: '申し訳ございませんが、営業システムで問題が発生しました。しばらく後にお試しください。',
        actions: [],
        follow_up_required: false,
        automated_tasks: []
      };
    }
  }

  /**
   * 営業意図別ルーティング
   */
  private async routeSalesIntent(
    event: LineWebhookEvent,
    salesIntent: any,
    originalText: string
  ): Promise<SalesProcessingResult> {
    switch (salesIntent.type) {
      case 'contract_completion':
        return await this.handleContractCompletion(event, salesIntent);

      case 'contract_pending':
      case 'contract_lost':
        return await this.handleContractUpdate(event, salesIntent);

      case 'proposal_positive':
      case 'proposal_concerns':
        return await this.handleProposalFeedback(event, salesIntent);

      case 'budget_discussion':
      case 'budget_approved':
      case 'budget_concerns':
        return await this.handleBudgetDiscussion(event, salesIntent);

      case 'follow_up_reminder':
        return await this.handleFollowUpRequest(event, salesIntent);

      case 'competitor_mention':
        return await this.handleCompetitorIntelligence(event, salesIntent);

      case 'success_probability_high':
      case 'success_probability_medium':
      case 'success_probability_low':
        return await this.handleSuccessProbabilityUpdate(event, salesIntent);

      case 'activity_report':
        return await this.handleActivityReport(event, salesIntent);

      case 'next_action_planning':
        return await this.handleNextActionPlanning(event, salesIntent);

      default:
        return await this.handleGeneralSalesInquiry(event, originalText);
    }
  }

  /**
   * 契約成立処理
   */
  private async handleContractCompletion(event: LineWebhookEvent, salesIntent: any): Promise<SalesProcessingResult> {
    try {
      console.log('🎉 Processing contract completion');

      // 契約金額抽出
      const contractAmount = this.extractContractAmount(salesIntent.entities);
      
      // 自動処理実行
      const automationResult = await this.automationEngine.processContractCompletion({
        appointmentId: await this.getCurrentAppointmentId(event.source.userId),
        contractAmount: contractAmount || 500000, // デフォルト50万円
        contractTerms: salesIntent.entities.contract_terms,
        decisionMakers: salesIntent.entities.decision_makers || [],
        successFactors: salesIntent.entities.success_factors || []
      });

      // 成功通知メッセージ作成
      const celebrationMessage = this.createCelebrationMessage(contractAmount, automationResult);

      // チーム通知
      const actions: SalesAction[] = [
        {
          type: 'send_notification',
          data: { 
            message: `🎉 成約報告: ${contractAmount?.toLocaleString() || '未記録'}円の契約が成立しました！`,
            priority: 'celebration'
          },
          priority: 'high',
          automated: true
        },
        {
          type: 'generate_report',
          data: { type: 'success_analysis', contractAmount },
          priority: 'medium',
          automated: true
        },
        {
          type: 'update_deal',
          data: { status: 'won', amount: contractAmount },
          priority: 'high',
          automated: true
        }
      ];

      return {
        success: true,
        responseMessage: celebrationMessage,
        actions,
        follow_up_required: true,
        automated_tasks: []
      };

    } catch (error) {
      console.error('Contract completion processing failed:', error);
      return {
        success: false,
        responseMessage: '契約成立の処理中にエラーが発生しました。手動で確認をお願いします。',
        actions: [],
        follow_up_required: true,
        automated_tasks: []
      };
    }
  }

  /**
   * 契約状況更新処理
   */
  private async handleContractUpdate(event: LineWebhookEvent, salesIntent: any): Promise<SalesProcessingResult> {
    const status = salesIntent.type === 'contract_pending' ? 'pending' : 'lost';
    const appointmentId = await this.getCurrentAppointmentId(event.source.userId);

    if (status === 'lost') {
      // 失注処理
      const lossData = {
        reason: salesIntent.entities.loss_reason || '詳細不明',
        competitor: salesIntent.entities.competitor,
        priceIssue: salesIntent.entities.price_concern || false,
        timingIssue: salesIntent.entities.timing_issue || false,
        featureConcerns: salesIntent.entities.feature_concerns || [],
        relationshipScore: 0.7 // デフォルト値
      };

      await this.automationEngine.processLostDeal(appointmentId, lossData);
    }

    const responseMessage = status === 'pending' 
      ? '承知いたしました。進捗状況を更新し、適切なフォローアップを設定いたします。'
      : '残念ですが、今回の結果を分析し、今後に活用させていただきます。関係性は継続して維持いたします。';

    return {
      success: true,
      responseMessage,
      actions: [
        {
          type: 'update_deal',
          data: { status, details: salesIntent.entities },
          priority: 'high',
          automated: true
        }
      ],
      follow_up_required: true,
      automated_tasks: []
    };
  }

  /**
   * 提案フィードバック処理
   */
  private async handleProposalFeedback(event: LineWebhookEvent, salesIntent: any): Promise<SalesProcessingResult> {
    const sentiment = salesIntent.type === 'proposal_positive' ? 'positive' : 'concerns';
    const appointmentId = await this.getCurrentAppointmentId(event.source.userId);

    // 成功確率更新
    await this.successEngine.calculateSuccessProbability(appointmentId);

    const responseMessage = sentiment === 'positive'
      ? '素晴らしいフィードバックをありがとうございます！次のステップに進ませていただきます。'
      : 'ご懸念をお聞かせいただき、ありがとうございます。詳細を確認し、改善案をご提案いたします。';

    const actions: SalesAction[] = [
      {
        type: 'update_deal',
        data: { stage: 'proposal_feedback', sentiment, feedback: salesIntent.entities },
        priority: 'high',
        automated: true
      }
    ];

    if (sentiment === 'concerns') {
      actions.push({
        type: 'create_task',
        data: { 
          title: '提案改善対応',
          description: '顧客懸念への対応策検討',
          priority: 'high'
        },
        priority: 'high',
        automated: false
      });
    }

    return {
      success: true,
      responseMessage,
      actions,
      follow_up_required: true,
      automated_tasks: []
    };
  }

  /**
   * 予算議論処理
   */
  private async handleBudgetDiscussion(event: LineWebhookEvent, salesIntent: any): Promise<SalesProcessingResult> {
    const budgetStatus = salesIntent.type;
    const amounts = salesIntent.entities.yen_values || [];

    let responseMessage = '';
    const actions: SalesAction[] = [];

    switch (budgetStatus) {
      case 'budget_approved':
        responseMessage = 'ご予算承認いただき、ありがとうございます！契約手続きを進めさせていただきます。';
        actions.push({
          type: 'update_deal',
          data: { stage: 'closing', budget_approved: true },
          priority: 'high',
          automated: true
        });
        break;

      case 'budget_concerns':
        responseMessage = '予算についてご相談いただき、ありがとうございます。最適なプランをご提案いたします。';
        actions.push({
          type: 'create_task',
          data: { 
            title: '予算調整提案作成',
            description: '予算に合わせたプラン再検討',
            priority: 'high'
          },
          priority: 'high',
          automated: false
        });
        break;

      default:
        responseMessage = '予算についてお話しいただき、ありがとうございます。詳細を確認し、最適なご提案をいたします。';
    }

    return {
      success: true,
      responseMessage,
      actions,
      follow_up_required: true,
      automated_tasks: []
    };
  }

  /**
   * フォローアップ要請処理
   */
  private async handleFollowUpRequest(event: LineWebhookEvent, salesIntent: any): Promise<SalesProcessingResult> {
    const followUpType = salesIntent.entities.follow_up_type || 'general';
    const urgency = salesIntent.entities.urgency_level || 'medium';

    // フォローアップタスク作成
    const actions: SalesAction[] = [
      {
        type: 'create_task',
        data: {
          title: `フォローアップ対応`,
          description: `${followUpType}に関するフォローアップ`,
          priority: urgency === 'urgent' ? 'high' : 'medium',
          dueDate: urgency === 'urgent' ? new Date(Date.now() + 24 * 60 * 60 * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        priority: urgency === 'urgent' ? 'high' : 'medium',
        automated: true
      }
    ];

    return {
      success: true,
      responseMessage: 'フォローアップを承知いたしました。適切なタイミングでご連絡いたします。',
      actions,
      follow_up_required: false,
      automated_tasks: []
    };
  }

  /**
   * 競合情報処理
   */
  private async handleCompetitorIntelligence(event: LineWebhookEvent, salesIntent: any): Promise<SalesProcessingResult> {
    const competitor = salesIntent.entities.competitor_name;
    const information = salesIntent.entities.competitor_info;

    const actions: SalesAction[] = [
      {
        type: 'update_deal',
        data: { 
          competitor_information: { competitor, information },
          competitive_situation: true
        },
        priority: 'medium',
        automated: true
      },
      {
        type: 'create_task',
        data: {
          title: '競合対策準備',
          description: `${competitor}への対策検討`,
          priority: 'high'
        },
        priority: 'high',
        automated: false
      }
    ];

    return {
      success: true,
      responseMessage: '競合情報をありがとうございます。分析して適切な対策を検討いたします。',
      actions,
      follow_up_required: true,
      automated_tasks: []
    };
  }

  /**
   * 成功確率更新処理
   */
  private async handleSuccessProbabilityUpdate(event: LineWebhookEvent, salesIntent: any): Promise<SalesProcessingResult> {
    const probabilityEstimate = salesIntent.entities.probability_estimate || 0.5;
    const confidenceLevel = salesIntent.entities.confidence_level || 'medium';

    const responseMessage = `成約確率を${Math.round(probabilityEstimate * 100)}%として記録いたします。それに応じた戦略を調整いたします。`;

    return {
      success: true,
      responseMessage,
      actions: [
        {
          type: 'update_deal',
          data: { success_probability: probabilityEstimate, confidence: confidenceLevel },
          priority: 'medium',
          automated: true
        }
      ],
      follow_up_required: false,
      automated_tasks: []
    };
  }

  /**
   * 営業活動報告処理
   */
  private async handleActivityReport(event: LineWebhookEvent, salesIntent: any): Promise<SalesProcessingResult> {
    const activityType = salesIntent.entities.activity_type || 'general';
    const outcome = salesIntent.entities.outcome || 'completed';

    return {
      success: true,
      responseMessage: '営業活動のご報告ありがとうございます。記録に残し、次のアクションを検討いたします。',
      actions: [
        {
          type: 'update_deal',
          data: { 
            latest_activity: { type: activityType, outcome, date: new Date() },
            activity_logged: true
          },
          priority: 'medium',
          automated: true
        }
      ],
      follow_up_required: true,
      automated_tasks: []
    };
  }

  /**
   * 次アクション計画処理
   */
  private async handleNextActionPlanning(event: LineWebhookEvent, salesIntent: any): Promise<SalesProcessingResult> {
    const nextAction = salesIntent.entities.next_action || 'follow_up';
    const timeline = salesIntent.entities.timeline || '1週間以内';

    return {
      success: true,
      responseMessage: `次のアクション「${nextAction}」を${timeline}で計画いたします。`,
      actions: [
        {
          type: 'create_task',
          data: {
            title: `次アクション: ${nextAction}`,
            description: `営業プロセス次ステップの実行`,
            timeline: timeline
          },
          priority: 'medium',
          automated: true
        }
      ],
      follow_up_required: false,
      automated_tasks: []
    };
  }

  /**
   * 一般営業問い合わせ処理
   */
  private async handleGeneralSalesInquiry(event: LineWebhookEvent, text: string): Promise<SalesProcessingResult> {
    // AI営業アシスタントによる分析・回答
    try {
      const customerId = await this.getCustomerId(event.source.userId);
      if (customerId) {
        // 顧客固有の対応
        const insights = await this.aiAssistant.generateCustomerInsights(customerId);
        const responseMessage = this.generatePersonalizedResponse(text, insights);

        return {
          success: true,
          responseMessage,
          actions: [],
          follow_up_required: false,
          automated_tasks: []
        };
      }
    } catch (error) {
      console.error('AI sales assistant failed:', error);
    }

    // フォールバック対応
    return {
      success: true,
      responseMessage: 'ご連絡ありがとうございます。詳細を確認し、適切にご対応いたします。営業担当から改めてご連絡いたします。',
      actions: [
        {
          type: 'create_task',
          data: {
            title: '営業問い合わせ対応',
            description: `顧客からの問い合わせ: ${text.substring(0, 100)}...`,
            priority: 'medium'
          },
          priority: 'medium',
          automated: false
        }
      ],
      follow_up_required: true,
      automated_tasks: []
    };
  }

  // ========== ヘルパーメソッド ==========

  /**
   * 契約金額抽出
   */
  private extractContractAmount(entities: any): number | null {
    if (!entities.yen_values || entities.yen_values.length === 0) return null;
    
    const amounts = entities.yen_values.map((item: any) => {
      const value = parseInt(item.value.replace(/,/g, ''));
      const unit = item.unit;
      
      if (unit === '万円') return value * 10000;
      if (unit === '千円') return value * 1000;
      return value;
    });

    return Math.max(...amounts);
  }

  /**
   * 現在のアポイントメントID取得
   */
  private async getCurrentAppointmentId(userId: string): Promise<string> {
    // 実装: 最新のアポイントメントIDを取得
    return `appointment_${userId}_${Date.now()}`;
  }

  /**
   * 顧客ID取得
   */
  private async getCustomerId(userId: string): Promise<string | null> {
    // 実装: LINE UserIDから顧客IDを取得
    return null;
  }

  /**
   * 祝賀メッセージ作成
   */
  private createCelebrationMessage(amount: number | null, automationResult: any): string {
    const amountText = amount ? `${amount.toLocaleString()}円` : '未記録';
    
    return `🎉 おめでとうございます！

💰 契約金額: ${amountText}
📊 自動処理: ${automationResult.success ? '完了' : '一部処理中'}

チーム全体で素晴らしい成果を上げました！
システムが自動で以下を処理しています：
• 財務データ更新
• プロジェクト作成
• LTV分析更新
• 成功ナレッジ生成

おつかれさまでした！🙌`;
  }

  /**
   * パーソナライズされた回答生成
   */
  private generatePersonalizedResponse(text: string, insights: any): string {
    // 顧客インサイトに基づく回答生成
    return '詳細を確認し、お客様に最適なご提案をさせていただきます。';
  }

  /**
   * フォローアップタスク生成
   */
  private async generateFollowUpTasks(salesIntent: any, result: SalesProcessingResult): Promise<AutomatedTask[]> {
    const tasks: AutomatedTask[] = [];

    // 重要な営業アクションには自動フォローアップを設定
    if (['contract_completion', 'proposal_positive', 'budget_approved'].includes(salesIntent.type)) {
      tasks.push({
        description: '成約後フォローアップ',
        scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1週間後
        assignee: 'sales_team',
        category: 'follow_up'
      });
    }

    return tasks;
  }

  /**
   * 自動化アクション実行
   */
  private async executeAutomatedActions(actions: SalesAction[]): Promise<void> {
    for (const action of actions.filter(a => a.automated)) {
      try {
        await this.executeAction(action);
      } catch (error) {
        console.error(`Failed to execute automated action ${action.type}:`, error);
      }
    }
  }

  /**
   * アクション実行
   */
  private async executeAction(action: SalesAction): Promise<void> {
    switch (action.type) {
      case 'update_deal':
        // 案件情報更新
        console.log('Updating deal:', action.data);
        break;

      case 'create_task':
        // タスク作成
        console.log('Creating task:', action.data);
        break;

      case 'send_notification':
        // 通知送信
        console.log('Sending notification:', action.data);
        break;

      case 'generate_report':
        // レポート生成
        console.log('Generating report:', action.data);
        break;

      default:
        console.log('Unknown action type:', action.type);
    }
  }
}