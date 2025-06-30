import { prismaDataService } from '../database/prisma-service';
import { getAICallManager } from '../ai/call-manager';

interface SalesIntent {
  type: string;
  confidence: number;
  entities: Record<string, any>;
  salesContext: SalesContext;
  actions: SalesAction[];
}

interface SalesContext {
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closing' | 'follow_up';
  connectionInfo?: any;
  appointmentInfo?: any;
  projectInfo?: any;
  successProbability?: number;
}

interface SalesAction {
  type: string;
  priority: 'high' | 'medium' | 'low';
  data: any;
  automated: boolean;
}

/**
 * 営業特化NLP機能拡張
 * 既存のEnhancedCommandDetectorを営業プロセス自動化で拡張
 */
export class SalesNLPEnhancer {
  private aiCallManager = getAICallManager();

  /**
   * 営業特化意図分析
   */
  async analyzeSalesIntent(
    message: string,
    userId: string,
    context?: any
  ): Promise<SalesIntent> {
    try {
      // 営業コンテキスト取得
      const salesContext = await this.getSalesContext(userId, message);
      
      // 営業特化意図検知
      const intent = await this.detectSalesIntent(message, salesContext);
      
      // 営業アクション生成
      const actions = await this.generateSalesActions(intent, salesContext);
      
      return {
        type: intent.type,
        confidence: intent.confidence,
        entities: intent.entities,
        salesContext,
        actions
      };
    } catch (error) {
      console.error('Sales intent analysis failed:', error);
      return {
        type: 'sales_unknown',
        confidence: 0.1,
        entities: {},
        salesContext: { stage: 'prospecting' },
        actions: []
      };
    }
  }

  /**
   * 営業特化意図検知
   */
  private async detectSalesIntent(message: string, context: SalesContext): Promise<{
    type: string;
    confidence: number;
    entities: Record<string, any>;
  }> {
    const salesPatterns = {
      // 契約・成約関連
      contract_completion: {
        pattern: /(契約|成約|決定|成立|決まった|サイン|署名).*(完了|終了|済み|やった|できた)/,
        confidence: 0.95,
        entities: { outcome: 'success', requires_update: true }
      },
      contract_pending: {
        pattern: /(契約|成約).*(検討中|保留|待ち|考える|相談)/,
        confidence: 0.85,
        entities: { outcome: 'pending', follow_up_needed: true }
      },
      contract_lost: {
        pattern: /(契約|成約).*(ダメ|断られた|厳しい|難しい|見送り|他社)/,
        confidence: 0.9,
        entities: { outcome: 'lost', requires_analysis: true }
      },

      // 商談・提案関連
      proposal_positive: {
        pattern: /(提案|企画|プレゼン).*(良かった|好評|興味|前向き|検討|面白い)/,
        confidence: 0.85,
        entities: { sentiment: 'positive', stage: 'negotiation' }
      },
      proposal_concerns: {
        pattern: /(提案|企画|プレゼン).*(心配|懸念|不安|課題|問題|厳しい)/,
        confidence: 0.8,
        entities: { sentiment: 'concerns', requires_revision: true }
      },
      
      // 見積もり・予算関連
      budget_discussion: {
        pattern: /(見積|予算|金額|価格|費用|コスト).*(相談|確認|質問|交渉)/,
        confidence: 0.9,
        entities: { topic: 'budget', requires_calculation: true }
      },
      budget_approved: {
        pattern: /(見積|予算|金額).*(OK|承認|大丈夫|問題ない|通った)/,
        confidence: 0.95,
        entities: { budget_status: 'approved', stage: 'closing' }
      },
      budget_concerns: {
        pattern: /(見積|予算|金額).*(高い|厳しい|オーバー|予算内|下げて)/,
        confidence: 0.85,
        entities: { budget_status: 'concerns', requires_revision: true }
      },

      // フォローアップ・関係性管理
      follow_up_reminder: {
        pattern: /(フォロー|追跡|連絡|確認).*(必要|やって|お願い|忘れずに)/,
        confidence: 0.8,
        entities: { action: 'follow_up', automated: true }
      },
      relationship_building: {
        pattern: /(関係|繋がり|コネクション).*(大切|維持|継続|深める)/,
        confidence: 0.7,
        entities: { focus: 'relationship', long_term: true }
      },

      // 競合・市場情報
      competitor_mention: {
        pattern: /(競合|他社|ライバル).*(情報|話|聞いた|検討|比較)/,
        confidence: 0.8,
        entities: { intelligence_type: 'competitor', requires_analysis: true }
      },
      market_opportunity: {
        pattern: /(機会|チャンス|タイミング|新規|展開).*(良い|最適|今|すぐ)/,
        confidence: 0.75,
        entities: { opportunity_type: 'market', urgency: 'high' }
      },

      // 意思決定者・プロセス
      decision_maker_info: {
        pattern: /(決定権|決裁|承認).*(誰|どなた|部長|社長|役員)/,
        confidence: 0.85,
        entities: { focus: 'decision_maker', stage: 'qualification' }
      },
      approval_process: {
        pattern: /(承認|決裁).*(プロセス|流れ|手順|時間|期間)/,
        confidence: 0.8,
        entities: { focus: 'process', timeline_important: true }
      },

      // 成功確率・予測
      success_probability_high: {
        pattern: /(確実|間違いない|100%|必ず|絶対).*(成約|決まる|いける)/,
        confidence: 0.9,
        entities: { probability_estimate: 0.9, confidence_level: 'high' }
      },
      success_probability_medium: {
        pattern: /(多分|おそらく|たぶん|50%|半々).*(成約|決まる|いける)/,
        confidence: 0.7,
        entities: { probability_estimate: 0.5, confidence_level: 'medium' }
      },
      success_probability_low: {
        pattern: /(厳しい|難しい|微妙|20%|低い).*(成約|決まる)/,
        confidence: 0.8,
        entities: { probability_estimate: 0.2, confidence_level: 'low' }
      },

      // 営業活動報告
      activity_report: {
        pattern: /(アポ|商談|営業|訪問).*(完了|終了|やった|行った|済み)/,
        confidence: 0.8,
        entities: { activity_type: 'completed', requires_logging: true }
      },
      next_action_planning: {
        pattern: /(次|今度|次回).*(アポ|会議|提案|連絡|やること)/,
        confidence: 0.75,
        entities: { planning_type: 'next_action', requires_scheduling: true }
      }
    };

    // パターンマッチング実行
    for (const [intentType, config] of Object.entries(salesPatterns)) {
      if (config.pattern.test(message)) {
        // 営業特化エンティティ抽出
        const additionalEntities = await this.extractSalesEntities(message, intentType);
        
        return {
          type: intentType,
          confidence: config.confidence,
          entities: { ...config.entities, ...additionalEntities }
        };
      }
    }

    // 売上・数値情報の検知
    const revenueIntent = await this.detectRevenueIntent(message);
    if (revenueIntent.confidence > 0.7) {
      return revenueIntent;
    }

    // 営業段階別の文脈推論
    const stageBasedIntent = await this.inferFromSalesStage(message, context);
    if (stageBasedIntent.confidence > 0.6) {
      return stageBasedIntent;
    }

    return {
      type: 'sales_general',
      confidence: 0.4,
      entities: { raw_message: message }
    };
  }

  /**
   * 営業特化エンティティ抽出
   */
  private async extractSalesEntities(message: string, intentType: string): Promise<Record<string, any>> {
    const entities: Record<string, any> = {};

    // 金額・数値抽出
    const amountPatterns = {
      yen: /([0-9,]+)\s*(円|万円|千円)/g,
      percent: /([0-9]+)\s*(%|パーセント|％)/g,
      count: /([0-9]+)\s*(件|社|名|人)/g
    };

    for (const [type, pattern] of Object.entries(amountPatterns)) {
      const matches = Array.from(message.matchAll(pattern));
      if (matches.length > 0) {
        entities[`${type}_values`] = matches.map(m => ({
          value: m[1].replace(/,/g, ''),
          unit: m[2],
          full_match: m[0]
        }));
      }
    }

    // 期間・日付抽出
    const timePatterns = {
      deadline: /(今月末|来月|年度末|四半期|Q[1-4])/g,
      duration: /([0-9]+)\s*(日|週間|ヶ月|年)/g,
      specific_date: /([0-9]{1,2})\/([0-9]{1,2})|([0-9]{1,2})月([0-9]{1,2})日/g
    };

    for (const [type, pattern] of Object.entries(timePatterns)) {
      const matches = Array.from(message.matchAll(pattern));
      if (matches.length > 0) {
        entities[`${type}_references`] = matches.map(m => m[0]);
      }
    }

    // 企業・人名抽出（営業特化）
    const businessPatterns = {
      company_formal: /(株式会社|合同会社|有限会社)\s*([\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\w]+)/g,
      company_casual: /([\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]{2,})\s*(さん|社|会社)/g,
      title_person: /(社長|部長|課長|係長|主任|取締役|専務|常務)\s*([\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]{2,})(\s*さん)?/g
    };

    for (const [type, pattern] of Object.entries(businessPatterns)) {
      const matches = Array.from(message.matchAll(pattern));
      if (matches.length > 0) {
        entities[type] = matches.map(m => ({
          full_match: m[0],
          name: m[1] || m[2],
          title: type === 'title_person' ? m[1] : null
        }));
      }
    }

    // 感情・評価表現
    const sentimentPatterns = {
      very_positive: /(素晴らしい|最高|完璧|満足|感動|興奮)/,
      positive: /(良い|いい|気に入った|興味深い|面白い|魅力的)/,
      neutral: /(普通|まあまあ|そこそこ|悪くない)/,
      negative: /(微妙|いまいち|心配|不安|厳しい)/,
      very_negative: /(ダメ|最悪|無理|断る|やめる)/
    };

    for (const [sentiment, pattern] of Object.entries(sentimentPatterns)) {
      if (pattern.test(message)) {
        entities.sentiment_level = sentiment;
        entities.sentiment_score = this.getSentimentScore(sentiment);
        break;
      }
    }

    // 緊急度・優先度
    const urgencyPatterns = {
      urgent: /(緊急|急ぎ|すぐ|至急|今すぐ|即座)/,
      high: /(重要|大切|優先|先に)/,
      normal: /(通常|普通|いつも通り)/,
      low: /(後で|時間がある時|余裕がある時)/
    };

    for (const [urgency, pattern] of Object.entries(urgencyPatterns)) {
      if (pattern.test(message)) {
        entities.urgency_level = urgency;
        break;
      }
    }

    return entities;
  }

  /**
   * 売上・収益意図検知
   */
  private async detectRevenueIntent(message: string): Promise<{
    type: string;
    confidence: number;
    entities: Record<string, any>;
  }> {
    // 売上・収益関連のパターン
    const revenuePatterns = {
      monthly_revenue: /(今月|月商|月売上).*(達成|予想|目標|実績)/,
      quarterly_revenue: /(四半期|Q[1-4]).*(売上|収益|実績)/,
      project_revenue: /(案件|プロジェクト).*(売上|収益|利益)/,
      commission_discussion: /(手数料|コミッション|報酬).*(計算|支払|確認)/
    };

    for (const [type, pattern] of Object.entries(revenuePatterns)) {
      if (pattern.test(message)) {
        const entities = await this.extractSalesEntities(message, type);
        return {
          type: `revenue_${type}`,
          confidence: 0.85,
          entities: { ...entities, revenue_topic: type }
        };
      }
    }

    return { type: 'non_revenue', confidence: 0.1, entities: {} };
  }

  /**
   * 営業段階別文脈推論
   */
  private async inferFromSalesStage(message: string, context: SalesContext): Promise<{
    type: string;
    confidence: number;
    entities: Record<string, any>;
  }> {
    const stageInferences = {
      prospecting: {
        keywords: ['新規', '開拓', '見込み', 'リード', '紹介'],
        confidence: 0.7,
        next_stage: 'qualification'
      },
      qualification: {
        keywords: ['予算', '決定権', 'ニーズ', '課題', 'タイムライン'],
        confidence: 0.8,
        next_stage: 'proposal'
      },
      proposal: {
        keywords: ['提案', '企画', 'プレゼン', '見積', 'デモ'],
        confidence: 0.85,
        next_stage: 'negotiation'
      },
      negotiation: {
        keywords: ['交渉', '条件', '調整', '検討', '相談'],
        confidence: 0.8,
        next_stage: 'closing'
      },
      closing: {
        keywords: ['契約', '成約', '決定', 'サイン', '署名'],
        confidence: 0.9,
        next_stage: 'follow_up'
      },
      follow_up: {
        keywords: ['フォロー', 'アフター', '継続', '更新', 'サポート'],
        confidence: 0.7,
        next_stage: 'prospecting'
      }
    };

    const currentStageInfo = stageInferences[context.stage];
    if (currentStageInfo) {
      const hasKeywords = currentStageInfo.keywords.some(keyword => 
        message.toLowerCase().includes(keyword)
      );

      if (hasKeywords) {
        return {
          type: `stage_${context.stage}_activity`,
          confidence: currentStageInfo.confidence,
          entities: {
            current_stage: context.stage,
            suggested_next_stage: currentStageInfo.next_stage,
            stage_progression: true
          }
        };
      }
    }

    return { type: 'stage_unclear', confidence: 0.3, entities: {} };
  }

  /**
   * 営業アクション生成
   */
  private async generateSalesActions(intent: any, context: SalesContext): Promise<SalesAction[]> {
    const actions: SalesAction[] = [];

    switch (intent.type) {
      case 'contract_completion':
        actions.push(
          {
            type: 'update_deal_status',
            priority: 'high',
            data: { status: 'won', outcome: intent.entities.outcome },
            automated: true
          },
          {
            type: 'generate_revenue_report',
            priority: 'high',
            data: { include_ltv_update: true },
            automated: true
          },
          {
            type: 'create_success_knowledge',
            priority: 'medium',
            data: { capture_success_factors: true },
            automated: true
          }
        );
        break;

      case 'contract_lost':
        actions.push(
          {
            type: 'update_deal_status',
            priority: 'high',
            data: { status: 'lost', outcome: intent.entities.outcome },
            automated: true
          },
          {
            type: 'analyze_loss_factors',
            priority: 'medium',
            data: { competitor_analysis: true },
            automated: true
          },
          {
            type: 'schedule_relationship_maintenance',
            priority: 'low',
            data: { follow_up_period: '6_months' },
            automated: false
          }
        );
        break;

      case 'proposal_positive':
        actions.push(
          {
            type: 'update_success_probability',
            priority: 'high',
            data: { probability_increase: 0.2 },
            automated: true
          },
          {
            type: 'schedule_follow_up',
            priority: 'high',
            data: { action_type: 'closing_preparation' },
            automated: false
          }
        );
        break;

      case 'budget_concerns':
        actions.push(
          {
            type: 'generate_alternative_proposal',
            priority: 'high',
            data: { focus: 'cost_optimization' },
            automated: false
          },
          {
            type: 'analyze_pricing_flexibility',
            priority: 'medium',
            data: { include_competitor_pricing: true },
            automated: true
          }
        );
        break;

      case 'follow_up_reminder':
        actions.push(
          {
            type: 'create_follow_up_task',
            priority: 'medium',
            data: { auto_schedule: true },
            automated: true
          }
        );
        break;

      case 'competitor_mention':
        actions.push(
          {
            type: 'update_competitor_intelligence',
            priority: 'medium',
            data: { source: 'customer_feedback' },
            automated: true
          },
          {
            type: 'prepare_competitive_analysis',
            priority: 'medium',
            data: { include_differentiation: true },
            automated: false
          }
        );
        break;
    }

    return actions;
  }

  /**
   * 営業コンテキスト取得
   */
  private async getSalesContext(userId: string, message: string): Promise<SalesContext> {
    try {
      const user = await prismaDataService.getUserByLineId(userId);
      if (!user) {
        return { stage: 'prospecting' };
      }

      // 最近のアポイント・営業活動を取得
      const allAppointments = await prismaDataService.getAppointments();
      const recentAppointments = allAppointments.filter(apt => apt.assignedTo === user.id || apt.createdBy === user.id);
      const allConnections = await prismaDataService.getConnections();
      const activeConnections = allConnections.filter(conn => conn.assignedTo === user.id || conn.createdBy === user.id);
      
      // 進行中のプロジェクト・商談を特定
      const activeProjects = recentAppointments
        .filter(apt => apt.status === 'pending' || apt.status === 'interested' || apt.status === 'scheduled')
        .slice(0, 5);

      // 営業段階推定
      const currentStage = this.estimateSalesStage(activeProjects, message);
      
      // 成功確率計算
      const successProbability = await this.calculateSuccessProbability(activeProjects);

      return {
        stage: currentStage,
        appointmentInfo: activeProjects[0] || null,
        connectionInfo: activeConnections[0] || null,
        successProbability
      };
    } catch (error) {
      console.error('Failed to get sales context:', error);
      return { stage: 'prospecting' };
    }
  }

  /**
   * 営業段階推定
   */
  private estimateSalesStage(appointments: any[], message: string): SalesContext['stage'] {
    if (appointments.length === 0) return 'prospecting';

    const latestAppointment = appointments[0];
    
    // メッセージ内容から段階を推定
    const stageKeywords = {
      qualification: ['予算', '決定権', 'ニーズ', '課題'],
      proposal: ['提案', '企画', '見積', 'プレゼン'],
      negotiation: ['交渉', '条件', '検討', '調整'],
      closing: ['契約', '成約', '決定', 'サイン'],
      follow_up: ['フォロー', '継続', '関係', '維持']
    };

    for (const [stage, keywords] of Object.entries(stageKeywords)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        return stage as SalesContext['stage'];
      }
    }

    // アポイント回数による推定
    if (appointments.length >= 3) return 'negotiation';
    if (appointments.length >= 2) return 'proposal';
    return 'qualification';
  }

  /**
   * 成功確率計算
   */
  private async calculateSuccessProbability(appointments: any[]): Promise<number> {
    if (appointments.length === 0) return 0.1;

    let probability = 0.3; // ベース確率

    // アポイント回数による確率上昇
    probability += Math.min(appointments.length * 0.15, 0.4);

    // 最新アポイントの結果による調整
    const latestAppointment = appointments[0];
    if (latestAppointment?.notes) {
      const positiveKeywords = ['前向き', '興味', '検討', '良い'];
      const negativeKeywords = ['厳しい', '難しい', '微妙', '他社'];
      
      const positiveCount = positiveKeywords.filter(keyword => 
        latestAppointment.notes.includes(keyword)
      ).length;
      
      const negativeCount = negativeKeywords.filter(keyword => 
        latestAppointment.notes.includes(keyword)
      ).length;

      probability += (positiveCount * 0.1) - (negativeCount * 0.15);
    }

    return Math.max(0.05, Math.min(0.95, probability));
  }

  /**
   * 感情スコア取得
   */
  private getSentimentScore(sentiment: string): number {
    const scores = {
      'very_positive': 1.0,
      'positive': 0.7,
      'neutral': 0.5,
      'negative': 0.3,
      'very_negative': 0.1
    };
    return scores[sentiment as keyof typeof scores] || 0.5;
  }
}