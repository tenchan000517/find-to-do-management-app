import { prismaDataService } from '@/lib/database/prisma-service';
import { AIEvaluationEngine } from '@/lib/ai/evaluation-engine';

interface KGISuggestion {
  kgi: string;
  reasoning: string;
  confidence: number;
  expectedValue?: number;
  expectedTimeline?: string;
  successMetrics: string[];
}

export class KGIGenerator {
  private aiEngine: AIEvaluationEngine;

  constructor() {
    this.aiEngine = new AIEvaluationEngine(process.env.GEMINI_API_KEY);
  }

  /**
   * プロジェクトのKGIを自動生成
   */
  async generateKGI(projectId: string): Promise<KGISuggestion> {
    try {
      const project = await prismaDataService.getProjectById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // プロジェクト関連データ収集
      const [tasks, connections, appointments] = await Promise.all([
        this.getHighIssueTasksInProject(projectId),
        this.getProjectConnections(projectId),
        this.getProjectAppointments(projectId)
      ]);

      // ビジネス成果タイプ推定
      const businessOutcome = this.inferBusinessOutcome(project, tasks, connections, appointments);
      
      // KGI生成
      const kgiSuggestion = await this.generateKGIByOutcomeType(businessOutcome, project);
      
      return kgiSuggestion;
    } catch (error) {
      console.error('KGI generation failed:', error);
      return {
        kgi: 'プロジェクト目標の達成',
        reasoning: 'エラーによりデフォルトKGIを設定',
        confidence: 0.3,
        successMetrics: ['プロジェクト完了率']
      };
    }
  }

  /**
   * 全プロジェクトのKGI自動設定
   */
  async autoSetKGIForAllProjects(): Promise<{
    updated: number;
    failed: number;
    results: Array<{ projectId: string; success: boolean; kgi?: string; error?: string }>;
  }> {
    try {
      const projects = await prismaDataService.getProjects();
      const results = [];
      let updated = 0;
      let failed = 0;

      for (const project of projects) {
        try {
          // 既にKGIが設定されている場合はスキップ
          if (project.kgi && project.kgi.trim().length > 0) {
            continue;
          }

          const kgiSuggestion = await this.generateKGI(project.id);
          
          // 確信度が十分高い場合のみ自動設定
          if (kgiSuggestion.confidence >= 0.7) {
            await prismaDataService.updateProject(project.id, {
              kgi: kgiSuggestion.kgi
            });

            results.push({
              projectId: project.id,
              success: true,
              kgi: kgiSuggestion.kgi
            });
            updated++;
          }
        } catch (error) {
          results.push({
            projectId: project.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          failed++;
        }
      }

      return { updated, failed, results };
    } catch (error) {
      console.error('Bulk KGI auto-setting failed:', error);
      throw error;
    }
  }

  // ===== プライベートメソッド =====

  private async getHighIssueTasksInProject(projectId: string): Promise<any[]> {
    const tasks = await prismaDataService.getTasksByProjectId(projectId);
    return tasks.filter(t => t.priority === 'A' || t.aiIssueLevel === 'A');
  }

  private async getProjectConnections(projectId: string): Promise<any[]> {
    const relationships = await prismaDataService.getProjectRelationships(projectId);
    const connectionIds = relationships
      .filter(r => r.relatedType === 'connection')
      .map(r => r.relatedId);
    
    const connections = [];
    for (const id of connectionIds) {
      const connection = await prismaDataService.getConnectionById(id);
      if (connection) connections.push(connection);
    }
    
    return connections;
  }

  private async getProjectAppointments(projectId: string): Promise<any[]> {
    const relationships = await prismaDataService.getProjectRelationships(projectId);
    const appointmentIds = relationships
      .filter(r => r.relatedType === 'appointment')
      .map(r => r.relatedId);
    
    const appointments = [];
    for (const id of appointmentIds) {
      const appointment = await prismaDataService.getAppointmentById(id);
      if (appointment) appointments.push(appointment);
    }
    
    return appointments;
  }

  private inferBusinessOutcome(
    project: any, 
    tasks: any[], 
    connections: any[], 
    appointments: any[]
  ): {
    type: 'sales' | 'partnership' | 'product' | 'internal' | 'marketing';
    confidence: number;
    data: any;
  } {
    const projectText = `${project.name} ${project.description}`.toLowerCase();
    const taskTexts = tasks.map(t => `${t.title} ${t.description}`).join(' ').toLowerCase();
    const allText = `${projectText} ${taskTexts}`;

    // キーワードベース分類
    const salesKeywords = ['売上', '収益', '販売', '営業', '商談', '契約', '受注'];
    const partnershipKeywords = ['連携', 'パートナー', '協業', '提携', '共同', 'アライアンス'];
    const productKeywords = ['開発', 'リリース', 'ローンチ', 'サービス', 'プロダクト', '機能'];
    const marketingKeywords = ['マーケティング', '宣伝', '広告', 'PR', '認知', 'ブランド'];

    const salesScore = this.calculateKeywordScore(allText, salesKeywords);
    const partnershipScore = this.calculateKeywordScore(allText, partnershipKeywords);
    const productScore = this.calculateKeywordScore(allText, productKeywords);
    const marketingScore = this.calculateKeywordScore(allText, marketingKeywords);

    // 最高スコアのタイプを選択
    const scores = [
      { type: 'sales', score: salesScore, data: { appointments, estimatedValue: this.estimateSalesValue(connections, appointments) }},
      { type: 'partnership', score: partnershipScore, data: { connections, companies: new Set(connections.map(c => c.company)).size }},
      { type: 'product', score: productScore, data: { tasks, features: tasks.length }},
      { type: 'marketing', score: marketingScore, data: { tasks, campaigns: tasks.filter(t => t.title.includes('キャンペーン')).length }}
    ];

    const bestMatch = scores.sort((a, b) => b.score - a.score)[0];
    
    return {
      type: bestMatch.type as any,
      confidence: Math.min(0.95, bestMatch.score + 0.3),
      data: bestMatch.data
    };
  }

  private calculateKeywordScore(text: string, keywords: string[]): number {
    const matches = keywords.filter(keyword => text.includes(keyword));
    return matches.length / keywords.length;
  }

  private async generateKGIByOutcomeType(
    outcome: { type: string; confidence: number; data: any },
    project: any
  ): Promise<KGISuggestion> {
    switch (outcome.type) {
      case 'sales':
        return {
          kgi: `${outcome.data.estimatedValue}万円の売上達成`,
          reasoning: `${outcome.data.appointments.length}件のアポイントメントと商談活動から売上目標を設定`,
          confidence: outcome.confidence,
          expectedValue: outcome.data.estimatedValue,
          expectedTimeline: this.calculateTimeline(project.phase),
          successMetrics: ['売上金額', '契約件数', '商談成約率']
        };

      case 'partnership':
        return {
          kgi: `${outcome.data.companies}社との戦略的パートナーシップ締結`,
          reasoning: `${outcome.data.connections.length}件のコネクションから戦略的パートナーシップ目標を設定`,
          confidence: outcome.confidence,
          expectedTimeline: this.calculateTimeline(project.phase),
          successMetrics: ['パートナー企業数', '連携プロジェクト数', '相互価値創出額']
        };

      case 'product':
        return {
          kgi: `プロダクトリリースと${this.estimateUserTarget(outcome.data)}ユーザー獲得`,
          reasoning: `${outcome.data.features}件の開発タスクからプロダクト目標を設定`,
          confidence: outcome.confidence,
          expectedTimeline: this.calculateTimeline(project.phase),
          successMetrics: ['ユーザー数', '機能完成度', 'ユーザー満足度']
        };

      case 'marketing':
        return {
          kgi: `ブランド認知向上と${this.estimateLeadTarget(outcome.data)}件のリード獲得`,
          reasoning: `${outcome.data.campaigns}件のマーケティング活動から認知・獲得目標を設定`,
          confidence: outcome.confidence,
          expectedTimeline: this.calculateTimeline(project.phase),
          successMetrics: ['ブランド認知率', 'リード獲得数', 'コンバージョン率']
        };

      default:
        return {
          kgi: `プロジェクト完了と定量的成果創出`,
          reasoning: '汎用的なプロジェクト目標を設定',
          confidence: 0.5,
          expectedTimeline: this.calculateTimeline(project.phase),
          successMetrics: ['プロジェクト完了率', '目標達成度']
        };
    }
  }

  private estimateSalesValue(connections: any[], appointments: any[]): number {
    const companyCount = new Set(connections.map(c => c.company)).size;
    const scheduledAppointments = appointments.filter(a => a.status === 'scheduled').length;
    const interestedAppointments = appointments.filter(a => a.status === 'interested').length;
    
    return Math.max(100, companyCount * 500 + scheduledAppointments * 300 + interestedAppointments * 150);
  }

  private estimateUserTarget(data: any): number {
    const baseTarget = 1000;
    const featureMultiplier = Math.max(1, data.features * 0.5);
    return Math.round(baseTarget * featureMultiplier);
  }

  private estimateLeadTarget(data: any): number {
    const baseTarget = 100;
    const campaignMultiplier = Math.max(1, data.campaigns * 2);
    return Math.round(baseTarget * campaignMultiplier);
  }

  private calculateTimeline(phase: string): string {
    const timelines: Record<string, string> = {
      concept: '6ヶ月',
      planning: '4ヶ月',
      negotiation: '3ヶ月',
      proposal: '2ヶ月',
      closing: '1ヶ月',
      execution: '6ヶ月',
      monitoring: '3ヶ月',
      completion: '1ヶ月'
    };
    return timelines[phase] || '3ヶ月';
  }
}