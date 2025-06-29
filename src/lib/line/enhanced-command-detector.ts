import { prismaDataService } from '@/lib/database/prisma-service';
import { getAICallManager } from '@/lib/ai/call-manager';
import { SalesMessageProcessor } from './sales-message-processor';

interface CommandDetectionResult {
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  context?: string;
  response: string;
  actions?: Array<{
    type: string;
    data: any;
  }>;
}

export class EnhancedCommandDetector {
  private aiCallManager = getAICallManager();
  private salesProcessor = new SalesMessageProcessor();
  
  /**
   * 高度なユーザーインテント検知
   */
  async detectUserIntent(
    message: string, 
    userId: string, 
    groupId?: string
  ): Promise<CommandDetectionResult> {
    try {
      // ユーザーコンテキスト取得
      const userContext = await this.getUserContext(userId);
      
      // 営業関連メッセージかチェック
      const salesResult = await this.checkSalesMessage(message, userId, groupId);
      if (salesResult.confidence > 0.6) {
        return salesResult;
      }
      
      // 自然な表現の詳細検知
      const intent = await this.analyzeNaturalLanguage(message, userContext);
      
      // アクションプラン生成
      const actions = await this.generateActionPlan(intent);
      
      // 返答メッセージ生成
      const response = await this.generateResponse(intent, userContext);
      
      return {
        intent: intent.type,
        confidence: intent.confidence,
        entities: intent.entities,
        context: userContext?.currentProject,
        response,
        actions
      };
    } catch (error) {
      console.error('Intent detection failed:', error);
      return {
        intent: 'unknown',
        confidence: 0.1,
        entities: {},
        response: '申し訳ございませんが、メッセージを理解できませんでした。もう一度お試しください。'
      };
    }
  }

  /**
   * 自然言語解析（高度版）
   */
  private async analyzeNaturalLanguage(message: string, context: any): Promise<{
    type: string;
    confidence: number;
    entities: Record<string, any>;
  }> {
    const patterns = {
      // 挨拶・初回コンタクト
      greeting_first_time: {
        pattern: /^(初めまして|はじめまして|初回|新規).*(相談|お願い|依頼|ミーティング)/,
        confidence: 0.9,
        entities: { is_first_contact: true, purpose: 'business_meeting' }
      },
      greeting_followup: {
        pattern: /(お疲れ様|おつかれ|こんにちは|おはよう|こんばんは)(?!.*初めまして)/,
        confidence: 0.8,
        entities: { is_greeting: true }
      },

      // プロジェクト管理
      project_status_inquiry: {
        pattern: /(プロジェクト|案件).*(状況|進捗|どう|いかが|どんな感じ)/,
        confidence: 0.85,
        entities: { inquiry_type: 'project_status' }
      },
      project_creation: {
        pattern: /(新しい|新規).*(プロジェクト|案件).*(作|始|開始)/,
        confidence: 0.9,
        entities: { action: 'create_project' }
      },
      
      // タスク管理
      task_completion: {
        pattern: /(完了|終わった|できた|やった|済んだ|仕上がった).*(タスク|作業|仕事)/,
        confidence: 0.9,
        entities: { action: 'complete_task' }
      },
      task_assignment: {
        pattern: /(お願い|依頼|やって|担当|アサイン).*(タスク|作業|仕事)/,
        confidence: 0.85,
        entities: { action: 'assign_task' }
      },
      task_deadline_concern: {
        pattern: /(間に合う|間に合わない|期限|締切|遅れ).*(心配|不安|大丈夫|やばい)/,
        confidence: 0.8,
        entities: { concern_type: 'deadline' }
      },

      // スケジュール管理
      meeting_scheduling: {
        pattern: /(会議|ミーティング|打ち合わせ|面談).*(いつ|時間|スケジュール|予定|調整)/,
        confidence: 0.85,
        entities: { action: 'schedule_meeting' }
      },
      availability_check: {
        pattern: /(空いて|空き|都合|時間ある|予定ある|忙しい).*(いつ|どう|明日|来週|今日)/,
        confidence: 0.8,
        entities: { inquiry_type: 'availability' }
      },

      // 問題・課題報告
      issue_report: {
        pattern: /(問題|課題|トラブル|困った|エラー|うまくいかない|詰まった)/,
        confidence: 0.9,
        entities: { action: 'report_issue', urgency: 'medium' }
      },
      urgent_issue: {
        pattern: /(緊急|急ぎ|すぐ|至急|やばい|大変|ヤバイ).*(問題|トラブル|エラー)/,
        confidence: 0.95,
        entities: { action: 'report_issue', urgency: 'high' }
      },

      // 相談・質問
      consultation_request: {
        pattern: /(相談|質問|聞きたい|教えて|どうしたら|どうすれば)/,
        confidence: 0.8,
        entities: { action: 'consultation' }
      },
      
      // 確認・承認
      approval_request: {
        pattern: /(確認|チェック|見て|承認|OK|オーケー).*(お願い|してもらえる|もらえる)/,
        confidence: 0.85,
        entities: { action: 'approval_request' }
      }
    };

    // パターンマッチング実行
    for (const [intentType, config] of Object.entries(patterns)) {
      if (config.pattern.test(message)) {
        // 追加のエンティティ抽出
        const additionalEntities = await this.extractAdditionalEntities(message, intentType);
        
        return {
          type: intentType,
          confidence: config.confidence,
          entities: { ...config.entities, ...additionalEntities }
        };
      }
    }

    // 文脈ベースの推論
    if (context?.currentProject) {
      const contextBasedIntent = await this.inferFromContext(message, context);
      if (contextBasedIntent.confidence > 0.6) {
        return contextBasedIntent;
      }
    }

    return {
      type: 'general_inquiry',
      confidence: 0.4,
      entities: { text: message }
    };
  }

  /**
   * 追加エンティティ抽出
   */
  private async extractAdditionalEntities(message: string, intentType: string): Promise<Record<string, any>> {
    const entities: Record<string, any> = {};

    // 時間表現抽出
    const timePatterns = {
      today: /(今日|本日)/,
      tomorrow: /(明日|あした)/,
      this_week: /(今週|週内)/,
      next_week: /(来週|次週)/,
      specific_time: /(\d{1,2})[時:](\d{1,2})?/
    };

    for (const [timeType, pattern] of Object.entries(timePatterns)) {
      if (pattern.test(message)) {
        entities.time_reference = timeType;
        if (timeType === 'specific_time') {
          const match = message.match(pattern);
          entities.specific_time = match ? match[0] : null;
        }
        break;
      }
    }

    // 人名抽出
    const namePattern = /([\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]{2,})さん/g;
    const names = Array.from(message.matchAll(namePattern), m => m[1]);
    if (names.length > 0) {
      entities.mentioned_people = names;
    }

    // 優先度表現
    const priorityPatterns = {
      high: /(緊急|急ぎ|すぐ|至急|重要)/,
      medium: /(普通|通常|いつも通り)/,
      low: /(後で|いつでも|時間がある時)/
    };

    for (const [priority, pattern] of Object.entries(priorityPatterns)) {
      if (pattern.test(message)) {
        entities.priority = priority;
        break;
      }
    }

    // アポイントメント関連エンティティ
    const appointmentPatterns = {
      completion: /(アポ|面談|商談|ミーティング).*(終了|完了|終わった|済んだ)/,
      follow_up: /(フォロー|追跡|連絡|次回)/,
      outcome_positive: /(良かった|成功|上手く|順調|好感触|前向き)/,
      outcome_negative: /(微妙|厳しい|難しい|興味なし|断られた)/,
      should_save: /(繋がり|コネクション|関係|保存|記録)/
    };

    for (const [key, pattern] of Object.entries(appointmentPatterns)) {
      if (pattern.test(message)) {
        entities[key] = true;
      }
    }

    // 会社名・人名の抽出
    const companyPattern = /(株式会社|合同会社|有限会社|[A-Za-z]+)([\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\w]+)/g;
    const companyMatches = Array.from(message.matchAll(companyPattern));
    if (companyMatches.length > 0) {
      entities.companies = companyMatches.map(m => m[0]);
    }

    // 評価・スコア表現
    const scorePattern = /(\d+)([点点数スコア]|\/10)/;
    const scoreMatch = message.match(scorePattern);
    if (scoreMatch) {
      entities.score = parseInt(scoreMatch[1]);
    }

    return entities;
  }

  /**
   * アクションプラン生成
   */
  private async generateActionPlan(intent: {
    type: string;
    confidence: number;
    entities: Record<string, any>;
  }): Promise<Array<{ type: string; data: any }>> {
    const actions = [];

    switch (intent.type) {
      case 'task_completion':
        actions.push({
          type: 'search_incomplete_tasks',
          data: { user_context: true }
        });
        break;

      case 'project_status_inquiry':
        actions.push({
          type: 'get_project_status',
          data: { include_alerts: true }
        });
        break;

      case 'appointment_completion':
        actions.push({
          type: 'mark_appointment_complete',
          data: { 
            appointment_id: intent.entities.appointment_id,
            outcome: intent.entities.outcome,
            create_connection: intent.entities.should_save_connection
          }
        });
        break;

      case 'appointment_follow_up':
        actions.push({
          type: 'schedule_follow_up',
          data: {
            appointment_id: intent.entities.appointment_id,
            follow_up_date: intent.entities.follow_up_date,
            follow_up_action: intent.entities.follow_up_action
          }
        });
        break;

      case 'connection_update':
        actions.push({
          type: 'update_connection_strength',
          data: {
            connection_name: intent.entities.connection_name,
            company: intent.entities.company,
            relationship_strength: intent.entities.relationship_strength,
            notes: intent.entities.notes
          }
        });
        break;

      case 'meeting_scheduling':
        actions.push({
          type: 'check_calendar_availability',
          data: { time_reference: intent.entities.time_reference }
        });
        break;

      case 'issue_report':
        actions.push({
          type: 'create_high_priority_task',
          data: { 
            urgency: intent.entities.urgency,
            auto_assign: true 
          }
        });
        break;

      case 'greeting_first_time':
        actions.push({
          type: 'create_initial_meeting',
          data: { 
            purpose: intent.entities.purpose,
            auto_schedule: true 
          }
        });
        break;
    }

    return actions;
  }

  /**
   * レスポンス生成
   */
  private async generateResponse(intent: any, context: any): Promise<string> {
    const userName = context?.user?.name || 'さん';
    
    const responses: Record<string, string> = {
      greeting_first_time: `初めまして、${userName}！ご連絡ありがとうございます。お打ち合わせの件、承知いたしました。スケジュール調整をさせていただきますね。`,
      
      greeting_followup: `お疲れ様です、${userName}！今日も一日頑張りましょう。何かお手伝いできることがあればお知らせください。`,
      
      project_status_inquiry: `${userName}、プロジェクトの状況をお調べしますね。現在の進捗状況とアラートをまとめてお知らせします。`,
      
      task_completion: `お疲れ様です！完了されたタスクを確認させていただきます。素晴らしい進捗ですね。`,
      
      meeting_scheduling: `承知いたしました、${userName}。ミーティングの調整をいたします。皆様のスケジュールを確認してご提案しますね。`,
      
      issue_report: `${userName}、お疲れ様です。問題をご報告いただきありがとうございます。すぐに対応いたします。詳細を整理して関係者に共有しますね。`,
      
      urgent_issue: `${userName}、緊急の件承知いたしました！最優先で対応いたします。関係者にも緊急で連絡いたします。`,
      
      consultation_request: `${userName}、ご相談の件、承知いたしました。詳しくお聞かせください。最適な解決策を一緒に考えましょう。`,
      
      general_inquiry: `${userName}、ご連絡ありがとうございます。詳細を確認させていただき、適切に対応いたします。`
    };

    return responses[intent.type] || responses.general_inquiry;
  }

  /**
   * ユーザーコンテキスト取得
   */
  private async getUserContext(userId: string): Promise<any> {
    try {
      const user = await prismaDataService.getUserByLineId(userId);
      if (!user) return null;

      const recentTasks = await prismaDataService.getTasksByUserId(user.id);
      const activeTasks = recentTasks.filter(t => t.status !== 'COMPLETE' && t.status !== 'DELETE');
      
      const currentProject = activeTasks.length > 0 && activeTasks[0].projectId 
        ? await prismaDataService.getProjectById(activeTasks[0].projectId) 
        : null;

      return {
        user,
        activeTasks,
        currentProject,
        taskCount: activeTasks.length,
        urgentTasks: activeTasks.filter(t => t.priority === 'A').length
      };
    } catch (error) {
      console.error('Failed to get user context:', error);
      return null;
    }
  }

  /**
   * 文脈ベース推論
   */
  private async inferFromContext(message: string, context: any): Promise<{
    type: string;
    confidence: number;
    entities: Record<string, any>;
  }> {
    // プロジェクト文脈での推論
    if (context.currentProject) {
      const projectName = context.currentProject.name.toLowerCase();
      if (message.toLowerCase().includes(projectName)) {
        return {
          type: 'project_specific_inquiry',
          confidence: 0.7,
          entities: { 
            project_id: context.currentProject.id,
            project_name: context.currentProject.name 
          }
        };
      }
    }

    // 緊急タスクがある場合の推論
    if (context.urgentTasks > 0) {
      const urgentKeywords = ['急ぎ', '緊急', 'やばい', '遅れ'];
      if (urgentKeywords.some(keyword => message.includes(keyword))) {
        return {
          type: 'urgent_task_inquiry',
          confidence: 0.8,
          entities: { urgent_task_count: context.urgentTasks }
        };
      }
    }

    return {
      type: 'context_unclear',
      confidence: 0.3,
      entities: {}
    };
  }

  /**
   * 営業関連メッセージチェック
   */
  private async checkSalesMessage(
    message: string, 
    userId: string, 
    groupId?: string
  ): Promise<CommandDetectionResult> {
    try {
      // 営業キーワードチェック
      const salesKeywords = [
        '契約', '成約', '提案', '見積', '商談', '営業', '顧客', 
        '予算', 'アポ', 'ミーティング', '成功確率', '競合',
        'クロージング', 'フォローアップ', '決定権者', 'LTV'
      ];

      const hasSalesKeywords = salesKeywords.some(keyword => 
        message.includes(keyword)
      );

      if (!hasSalesKeywords) {
        return {
          intent: 'non_sales',
          confidence: 0.1,
          entities: {},
          response: ''
        };
      }

      // 営業メッセージ処理
      const salesResult = await this.salesProcessor.processSalesMessage(
        { 
          source: { userId, groupId }, 
          type: 'message',
          message: { type: 'text', text: message }
        } as any, 
        message
      );

      return {
        intent: 'sales_message',
        confidence: 0.9,
        entities: { sales_result: salesResult },
        response: salesResult.responseMessage,
        actions: salesResult.actions.map(action => ({
          type: action.type,
          data: action.data
        }))
      };

    } catch (error) {
      console.error('Sales message check failed:', error);
      return {
        intent: 'sales_error',
        confidence: 0.1,
        entities: {},
        response: '営業システムで問題が発生しました。'
      };
    }
  }
}