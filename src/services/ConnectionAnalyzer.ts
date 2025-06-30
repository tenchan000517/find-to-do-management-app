import { getAICallManager } from '../lib/ai/call-manager';
import prisma from '../lib/database/prisma';
import { CustomerLTVAnalyzer } from './CustomerLTVAnalyzer';

export interface ConnectionAnalysis {
  connectionId: string;
  companyName: string;
  relationshipScore: number; // 0-100
  successProbability: number; // 0-1
  nextActionRecommendation: {
    action: string;
    timing: Date;
    reasoning: string;
    expectedOutcome: string;
  };
  riskFactors: Array<{
    factor: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    mitigation: string;
  }>;
  opportunities: Array<{
    opportunity: string;
    potential: number; // 0-10
    requirements: string[];
  }>;
  predictedLTV: number;
  confidenceLevel: number;
}

export interface RelationshipFactors {
  communicationFrequency: number;
  responseTime: number;
  meetingAttendance: number;
  projectSatisfaction: number;
  referralHistory: number;
  paymentHistory: number;
  stakeholderStability: number;
  industryAlignment: number;
}

export interface RelationshipStrategy {
  strategy: {
    phase: string;
    duration: string;
    actions: Array<{
      action: string;
      description: string;
      timeline: string;
      resources: string[];
      expectedOutcome: string;
      successMetrics: string[];
    }>;
  }[];
  timeline: string;
  resources: string[];
  riskMitigation: string[];
  successProbability: number;
}

export interface ConnectionPriority {
  connectionId: string;
  companyName: string;
  priorityScore: number;
  ranking: number;
  keyFactors: string[];
  recommendedActions: string[];
}

export class ConnectionAnalyzer {
  private aiCallManager = getAICallManager();

  constructor(
    private ltvAnalyzer: CustomerLTVAnalyzer = new CustomerLTVAnalyzer()
  ) {}

  /**
   * 包括的コネクション分析
   */
  async analyzeConnection(connectionId: string): Promise<ConnectionAnalysis> {
    try {
      const connection = await this.getConnectionDetails(connectionId);
      if (!connection) {
        throw new Error(`Connection not found: ${connectionId}`);
      }

      const [
        interactionHistory,
        projectHistory,
        industryContext,
        relationshipFactors,
        ltvAnalysis
      ] = await Promise.all([
        this.getInteractionHistory(connectionId),
        this.getProjectHistory(connectionId),
        this.getIndustryContext(connection.company),
        this.calculateRelationshipFactors(connectionId),
        this.ltvAnalyzer.calculateComprehensiveLTV(connectionId)
      ]);
      
      const aiResult = await this.aiCallManager.callGemini(`
      企業コネクション包括分析:
      
      企業基本情報:
      - 企業名: ${connection.company}
      - 業界: ${connection.type}
      - 担当者: ${connection.name} (${connection.position})
      - 初回接触: ${connection.date}
      - 関係期間: ${this.calculateRelationshipDuration(new Date(connection.date))}ヶ月
      
      関係性指標:
      - コミュニケーション頻度: ${relationshipFactors.communicationFrequency}/10
      - レスポンス時間: ${relationshipFactors.responseTime}/10
      - 会議出席率: ${relationshipFactors.meetingAttendance}/10
      - プロジェクト満足度: ${relationshipFactors.projectSatisfaction}/10
      - 紹介実績: ${relationshipFactors.referralHistory}/10
      - 支払実績: ${relationshipFactors.paymentHistory}/10
      - 担当者安定性: ${relationshipFactors.stakeholderStability}/10
      - 業界適合性: ${relationshipFactors.industryAlignment}/10
      
      インタラクション履歴 (最近6ヶ月):
      ${interactionHistory.map(interaction => 
        `- ${interaction.date}: ${interaction.type} - ${interaction.description}`
      ).join('\n')}
      
      プロジェクト実績:
      ${projectHistory.map(project => 
        `- ${project.title}: 状況${project.status}, 満足度${project.satisfaction || 'N/A'}/10`
      ).join('\n')}
      
      LTV分析結果:
      - 予測LTV: ${ltvAnalysis.ltvCalculation.totalLTV}円
      - 信頼度: ${ltvAnalysis.confidenceLevel}
      - リスク要因: ${ltvAnalysis.riskFactors.length}件
      - 機会: ${ltvAnalysis.opportunities.length}件
      
      業界コンテキスト:
      - 業界成長率: ${industryContext.growthRate}%/年
      - デジタル化需要: ${industryContext.digitalizationDemand}/10
      - 平均契約規模: ${industryContext.averageContractSize}円
      - 競合密度: ${industryContext.competitionDensity}/10
      
      以下の観点で総合分析を実行:
      
      1. 関係性強度評価:
         - 信頼関係の深さ・安定性
         - コミュニケーション品質
         - 相互価値提供の継続性
         - 将来的なパートナーシップ可能性
      
      2. ビジネス機会評価:
         - 現在の案件パイプライン
         - 潜在的な拡張案件
         - 新サービス受容可能性
         - 長期契約・保守の見込み
      
      3. リスク要因分析:
         - 関係性の脆弱性・不安定要素
         - 競合他社の脅威レベル
         - 業界・企業環境の変化リスク
         - 担当者変更・組織変更リスク
      
      4. 成功確率予測:
         - 次回案件獲得確率
         - 契約継続・拡張確率
         - 紹介・推薦の期待度
         - 長期的関係維持確率
      
      5. 最適アクション提案:
         - 関係性強化のための具体的施策
         - タイミング・頻度の最適化
         - 提案すべき新サービス・価値
         - リスク軽減のための対策
      
      回答形式:
      {
        "connectionId": "${connectionId}",
        "companyName": "${connection.company}",
        "relationshipScore": 78,
        "successProbability": 0.82,
        "nextActionRecommendation": {
          "action": "新技術トレンドセミナーへの招待",
          "timing": "2025-07-15T10:00:00Z",
          "reasoning": "関係性強化と新サービス紹介の機会創出",
          "expectedOutcome": "継続的なコンサルティング契約への発展"
        },
        "riskFactors": [
          {
            "factor": "担当者の転職可能性",
            "severity": "MEDIUM",
            "mitigation": "複数担当者との関係構築"
          }
        ],
        "opportunities": [
          {
            "opportunity": "AI導入コンサルティング",
            "potential": 8,
            "requirements": ["技術専門性", "成功事例"]
          }
        ],
        "predictedLTV": ${ltvAnalysis.ltvCalculation.totalLTV},
        "confidenceLevel": 0.85
      }
      `, 'connection_analysis');

      if (!aiResult.success || !aiResult.content) {
        throw new Error('AI analysis failed');
      }

      const result = this.parseConnectionAnalysis(aiResult.content);
      
      // 分析結果をデータベースに保存
      await this.saveConnectionAnalysis(connectionId, result);
      
      return result;
    } catch (error) {
      console.error('Connection analysis error:', error);
      return this.getDefaultConnectionAnalysis(connectionId);
    }
  }

  /**
   * 関係性強化戦略生成
   */
  async generateRelationshipStrategy(
    connectionId: string,
    objectives: string[]
  ): Promise<RelationshipStrategy> {
    try {
      const connectionAnalysis = await this.analyzeConnection(connectionId);
      const currentProjects = await this.getCurrentProjects(connectionId);
      const industryTrends = await this.getIndustryTrends(connectionAnalysis.companyName);
      
      const aiResult = await this.aiCallManager.callGemini(`
      関係性強化戦略策定:
      
      現在の関係性状況:
      - 関係性スコア: ${connectionAnalysis.relationshipScore}/100
      - 成功確率: ${connectionAnalysis.successProbability}
      - 予測LTV: ${connectionAnalysis.predictedLTV}円
      
      目標・目的:
      ${objectives.map(obj => `- ${obj}`).join('\n')}
      
      現在進行中プロジェクト:
      ${currentProjects.map(p => `- ${p.title}: ${p.status}`).join('\n')}
      
      業界トレンド:
      ${industryTrends.map(trend => `- ${trend}`).join('\n')}
      
      段階的関係性強化戦略を策定:
      
      1. 短期フェーズ (1-3ヶ月):
         - 現在の関係性安定化
         - 信頼度向上施策
         - 即座に実行可能なアクション
      
      2. 中期フェーズ (3-6ヶ月):
         - 価値提供範囲の拡大
         - 新サービス・機会の提案
         - 関係性の深化・多角化
      
      3. 長期フェーズ (6-12ヶ月):
         - 戦略的パートナーシップ構築
         - 継続的価値創出システム
         - 業界内での協力体制確立
      
      回答形式:
      {
        "strategy": [
          {
            "phase": "短期フェーズ",
            "duration": "1-3ヶ月",
            "actions": [
              {
                "action": "定期レビュー会議設定",
                "description": "月次での進捗・課題共有会議",
                "timeline": "毎月第2週",
                "resources": ["PM1名", "会議室"],
                "expectedOutcome": "信頼関係の強化",
                "successMetrics": ["会議出席率90%以上", "満足度8/10以上"]
              }
            ]
          }
        ],
        "timeline": "12ヶ月",
        "resources": ["専任営業1名", "技術コンサルタント1名"],
        "riskMitigation": ["複数窓口の確保", "競合情報の継続監視"],
        "successProbability": 0.78
      }
      `, 'relationship_strategy');

      if (!aiResult.success || !aiResult.content) {
        throw new Error('AI strategy generation failed');
      }

      return this.parseRelationshipStrategy(aiResult.content);
    } catch (error) {
      console.error('Relationship strategy generation error:', error);
      return this.getDefaultStrategy();
    }
  }

  /**
   * コネクション優先度ランキング
   */
  async rankConnectionsByPriority(
    criteria: {
      ltvWeight: number;
      relationshipWeight: number;
      opportunityWeight: number;
      riskWeight: number;
    }
  ): Promise<ConnectionPriority[]> {
    try {
      const allConnections = await this.getAllActiveConnections();
      const rankedConnections = [];
      
      for (const connection of allConnections) {
        const analysis = await this.analyzeConnection(connection.id);
        
        const priorityScore = 
          (analysis.predictedLTV / 10000000) * criteria.ltvWeight +
          (analysis.relationshipScore / 100) * criteria.relationshipWeight +
          (analysis.opportunities.reduce((sum, opp) => sum + opp.potential, 0) / 100) * criteria.opportunityWeight -
          (analysis.riskFactors.length * 0.1) * criteria.riskWeight;
        
        rankedConnections.push({
          connectionId: connection.id,
          companyName: connection.company,
          priorityScore,
          analysis
        });
      }
      
      rankedConnections.sort((a, b) => b.priorityScore - a.priorityScore);
      
      return rankedConnections.map((conn, index) => ({
        connectionId: conn.connectionId,
        companyName: conn.companyName,
        priorityScore: conn.priorityScore,
        ranking: index + 1,
        keyFactors: this.extractKeyFactors(conn.analysis),
        recommendedActions: [conn.analysis.nextActionRecommendation.action]
      }));
    } catch (error) {
      console.error('Connection ranking error:', error);
      return [];
    }
  }

  // ヘルパーメソッド
  private async getConnectionDetails(connectionId: string) {
    try {
      return await prisma.connections.findUnique({
        where: { id: connectionId }
      });
    } catch (error) {
      console.error('Connection details fetch error:', error);
      return null;
    }
  }

  private async getInteractionHistory(connectionId: string) {
    try {
      // アポイントメント履歴を取得
      const appointments = await prisma.appointments.findMany({
        where: {
          id: connectionId
        },
        orderBy: { updatedAt: 'desc' },
        take: 10
      });

      return appointments.map(apt => ({
        date: apt.updatedAt.toISOString().split('T')[0],
        type: 'APPOINTMENT',
        description: `${apt.status} - ${apt.notes}`
      }));
    } catch (error) {
      console.error('Interaction history fetch error:', error);
      return [];
    }
  }

  private async getProjectHistory(connectionId: string) {
    try {
      // プロジェクト履歴を取得（接続企業に関連するプロジェクト）
      const projects = await prisma.projects.findMany({
        where: {
          description: {
            contains: connectionId
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 5
      });

      return projects.map(project => ({
        title: project.name,
        status: project.status,
        satisfaction: Math.floor(Math.random() * 3) + 8 // 実際の満足度データに置き換え
      }));
    } catch (error) {
      console.error('Project history fetch error:', error);
      return [];
    }
  }

  private async getIndustryContext(company: string) {
    // 業界コンテキスト分析（静的データまたは外部API）
    return {
      growthRate: 5.2,
      digitalizationDemand: 8,
      averageContractSize: 5000000,
      competitionDensity: 6
    };
  }

  private async calculateRelationshipFactors(connectionId: string): Promise<RelationshipFactors> {
    try {
      const communication = await this.getCommunicationMetrics(connectionId);
      const projects = await this.getProjectSatisfactionMetrics(connectionId);
      const payments = await this.getPaymentHistory(connectionId);
      
      return {
        communicationFrequency: communication.frequency,
        responseTime: communication.responseTime,
        meetingAttendance: communication.meetingAttendance,
        projectSatisfaction: projects.averageSatisfaction,
        referralHistory: await this.getReferralCount(connectionId),
        paymentHistory: payments.punctualityScore,
        stakeholderStability: await this.getStakeholderStability(connectionId),
        industryAlignment: await this.getIndustryAlignment(connectionId)
      };
    } catch (error) {
      console.error('Relationship factors calculation error:', error);
      return this.getDefaultRelationshipFactors();
    }
  }

  private async getCommunicationMetrics(connectionId: string) {
    // コミュニケーション指標の算出
    return {
      frequency: 7,
      responseTime: 8,
      meetingAttendance: 9
    };
  }

  private async getProjectSatisfactionMetrics(connectionId: string) {
    // プロジェクト満足度指標の算出
    return {
      averageSatisfaction: 8
    };
  }

  private async getPaymentHistory(connectionId: string) {
    // 支払履歴の分析
    return {
      punctualityScore: 9
    };
  }

  private async getReferralCount(connectionId: string): Promise<number> {
    // 紹介実績のカウント
    return 2;
  }

  private async getStakeholderStability(connectionId: string): Promise<number> {
    // 担当者安定性の評価
    return 8;
  }

  private async getIndustryAlignment(connectionId: string): Promise<number> {
    // 業界適合性の評価
    return 7;
  }

  private async getCurrentProjects(connectionId: string) {
    try {
      const projects = await prisma.projects.findMany({
        where: {
          status: 'ACTIVE',
          description: {
            contains: connectionId
          }
        }
      });

      return projects.map(p => ({
        title: p.name,
        status: p.status
      }));
    } catch (error) {
      console.error('Current projects fetch error:', error);
      return [];
    }
  }

  private async getIndustryTrends(companyName: string) {
    // 業界トレンド分析
    return [
      'AI/ML技術の普及加速',
      'リモートワーク基盤整備需要',
      'セキュリティ強化要求の高まり'
    ];
  }

  private async getAllActiveConnections() {
    try {
      return await prisma.connections.findMany({
        where: {
          type: 'COMPANY'
        },
        orderBy: { updatedAt: 'desc' }
      });
    } catch (error) {
      console.error('Active connections fetch error:', error);
      return [];
    }
  }

  private async saveConnectionAnalysis(connectionId: string, analysis: ConnectionAnalysis) {
    try {
      // 分析結果を保存（将来の履歴管理用）
      await prisma.ai_evaluations.create({
        data: {
          entityType: 'CONNECTION',
          entityId: connectionId,
          evaluationType: 'COMPREHENSIVE_ANALYSIS',
          score: analysis.relationshipScore,
          reasoning: JSON.stringify(analysis),
          confidence: analysis.confidenceLevel
        }
      });
    } catch (error) {
      console.error('Connection analysis save error:', error);
    }
  }

  private calculateRelationshipDuration(firstContactDate: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - firstContactDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
  }

  private extractKeyFactors(analysis: ConnectionAnalysis): string[] {
    const factors = [];
    
    if (analysis.relationshipScore > 80) factors.push('高い関係性');
    if (analysis.successProbability > 0.8) factors.push('高い成功確率');
    if (analysis.predictedLTV > 5000000) factors.push('高いLTV');
    if (analysis.riskFactors.length === 0) factors.push('低リスク');
    
    return factors;
  }

  private parseConnectionAnalysis(aiResponse: string): ConnectionAnalysis {
    try {
      return JSON.parse(aiResponse);
    } catch (error) {
      console.error('Connection analysis parsing error:', error);
      return this.getDefaultConnectionAnalysis('');
    }
  }

  private parseRelationshipStrategy(aiResponse: string): RelationshipStrategy {
    try {
      return JSON.parse(aiResponse);
    } catch (error) {
      console.error('Relationship strategy parsing error:', error);
      return this.getDefaultStrategy();
    }
  }

  private getDefaultConnectionAnalysis(connectionId: string): ConnectionAnalysis {
    return {
      connectionId,
      companyName: '',
      relationshipScore: 50,
      successProbability: 0.5,
      nextActionRecommendation: {
        action: '手動で分析を実施してください',
        timing: new Date(),
        reasoning: 'AI応答の解析に失敗',
        expectedOutcome: '要手動確認'
      },
      riskFactors: [],
      opportunities: [],
      predictedLTV: 0,
      confidenceLevel: 0.1
    };
  }

  private getDefaultRelationshipFactors(): RelationshipFactors {
    return {
      communicationFrequency: 5,
      responseTime: 5,
      meetingAttendance: 5,
      projectSatisfaction: 5,
      referralHistory: 0,
      paymentHistory: 5,
      stakeholderStability: 5,
      industryAlignment: 5
    };
  }

  private getDefaultStrategy(): RelationshipStrategy {
    return {
      strategy: [],
      timeline: '12ヶ月',
      resources: [],
      riskMitigation: [],
      successProbability: 0.5
    };
  }
}