import { prismaDataService } from '@/lib/database/prisma-service';
import { RelationshipService } from './relationship-service';
import { AIEvaluationEngine } from '@/lib/ai/evaluation-engine';

interface PromotionCandidate {
  id: string;
  title: string;
  type: 'line_input' | 'task_cluster' | 'appointment_series' | 'connection_growth';
  confidence: number;
  reasoning: string;
  relatedItems: any[];
  suggestedProject: {
    name: string;
    description: string;
    phase: string;
    priority: 'A' | 'B' | 'C' | 'D';
    kgi?: string;
    estimatedDuration?: number;
  };
  autoPromotionScore: number;
  createdAt: string;
}

export class ProjectPromotionEngine {
  private relationshipService: RelationshipService;
  private aiEngine: AIEvaluationEngine;

  constructor() {
    this.relationshipService = new RelationshipService();
    this.aiEngine = new AIEvaluationEngine(process.env.GEMINI_API_KEY);
  }

  /**
   * 全システムからプロジェクト昇華候補を検出
   */
  async detectPromotionCandidates(): Promise<PromotionCandidate[]> {
    try {
      const candidates: PromotionCandidate[] = [];

      // 並行して各種候補を検出
      const [
        taskClusters,
        appointmentSeries,
        connectionGrowth,
        lineInputClusters
      ] = await Promise.all([
        this.detectTaskClusters(),
        this.detectAppointmentSeries(),
        this.detectConnectionGrowth(),
        this.detectLineInputClusters()
      ]);

      candidates.push(...taskClusters, ...appointmentSeries, ...connectionGrowth, ...lineInputClusters);

      // 自動昇華スコア順でソート
      return candidates.sort((a, b) => b.autoPromotionScore - a.autoPromotionScore);
    } catch (error) {
      console.error('Failed to detect promotion candidates:', error);
      return [];
    }
  }

  /**
   * タスククラスター分析（関連タスクの集合を検出）
   */
  private async detectTaskClusters(): Promise<PromotionCandidate[]> {
    try {
      const tasks = await prismaDataService.getAllTasks();
      const unassignedTasks = tasks.filter(t => !t.projectId && t.status !== 'COMPLETE');
      
      if (unassignedTasks.length < 3) return [];

      // キーワードベースのクラスタリング
      const clusters = this.clusterTasksByKeywords(unassignedTasks);
      const candidates: PromotionCandidate[] = [];

      for (const cluster of clusters) {
        if (cluster.tasks.length >= 3) {
          const confidence = this.calculateClusterConfidence(cluster);
          const autoPromotionScore = this.calculateAutoPromotionScore(cluster.tasks, 'task_cluster');

          if (confidence > 0.6) {
            candidates.push({
              id: this.generateId(),
              title: `${cluster.keyword}関連タスク群`,
              type: 'task_cluster',
              confidence,
              reasoning: `${cluster.tasks.length}件の関連タスクが検出されました（キーワード: ${cluster.keyword}）`,
              relatedItems: cluster.tasks.map(t => ({ type: 'task', id: t.id, title: t.title })),
              suggestedProject: {
                name: `${cluster.keyword}プロジェクト`,
                description: `${cluster.keyword}に関する包括的なプロジェクト`,
                phase: 'planning',
                priority: this.inferProjectPriority(cluster.tasks),
                kgi: await this.generateKGI(cluster),
                estimatedDuration: this.estimateProjectDuration(cluster.tasks)
              },
              autoPromotionScore,
              createdAt: new Date().toISOString()
            });
          }
        }
      }

      return candidates;
    } catch (error) {
      console.error('Task cluster detection failed:', error);
      return [];
    }
  }

  /**
   * アポイント連続性分析（連続するアポイントメントを検出）
   */
  private async detectAppointmentSeries(): Promise<PromotionCandidate[]> {
    try {
      const appointments = await prismaDataService.getAppointments();
      const companies = this.groupAppointmentsByCompany(appointments);
      const candidates: PromotionCandidate[] = [];

      for (const [company, companyAppointments] of companies.entries()) {
        if (companyAppointments.length >= 2) {
          const recentAppointments = companyAppointments.filter(a => {
            const daysSince = this.getDaysSince(a.createdAt);
            return daysSince <= 30; // 30日以内
          });

          if (recentAppointments.length >= 2) {
            const confidence = Math.min(0.95, 0.5 + (recentAppointments.length * 0.15));
            const autoPromotionScore = this.calculateAutoPromotionScore(recentAppointments, 'appointment_series');

            candidates.push({
              id: this.generateId(),
              title: `${company}との商談プロジェクト`,
              type: 'appointment_series',
              confidence,
              reasoning: `${company}との${recentAppointments.length}回の継続的なアポイントメントが検出されました`,
              relatedItems: recentAppointments.map(a => ({ 
                type: 'appointment', 
                id: a.id, 
                title: `${a.contactName}との${a.nextAction}` 
              })),
              suggestedProject: {
                name: `${company}商談プロジェクト`,
                description: `${company}との商談・提案・クロージングプロジェクト`,
                phase: this.inferAppointmentPhase(recentAppointments),
                priority: this.inferAppointmentPriority(recentAppointments),
                kgi: `${company}との契約締結`,
                estimatedDuration: 90 // 3ヶ月
              },
              autoPromotionScore,
              createdAt: new Date().toISOString()
            });
          }
        }
      }

      return candidates;
    } catch (error) {
      console.error('Appointment series detection failed:', error);
      return [];
    }
  }

  /**
   * コネクション成長分析（ネットワーク拡大を検出）
   */
  private async detectConnectionGrowth(): Promise<PromotionCandidate[]> {
    try {
      const connections = await prismaDataService.getConnections();
      const companies = this.groupConnectionsByCompany(connections);
      const candidates: PromotionCandidate[] = [];

      for (const [company, companyConnections] of companies.entries()) {
        const recentConnections = companyConnections.filter(c => {
          const daysSince = this.getDaysSince(c.createdAt);
          return daysSince <= 60; // 60日以内
        });

        if (recentConnections.length >= 3) {
          const seniorContacts = recentConnections.filter(c =>
            c.position.includes('部長') || c.position.includes('取締役') || 
            c.position.includes('CEO') || c.position.includes('代表')
          );

          const confidence = Math.min(0.9, 0.4 + (recentConnections.length * 0.1) + (seniorContacts.length * 0.2));
          const autoPromotionScore = this.calculateAutoPromotionScore(recentConnections, 'connection_growth');

          if (confidence > 0.6) {
            candidates.push({
              id: this.generateId(),
              title: `${company}パートナーシップ戦略`,
              type: 'connection_growth',
              confidence,
              reasoning: `${company}との${recentConnections.length}件のコネクション（うち${seniorContacts.length}件が上級職）が形成されました`,
              relatedItems: recentConnections.map(c => ({ 
                type: 'connection', 
                id: c.id, 
                title: `${c.name}（${c.position}）` 
              })),
              suggestedProject: {
                name: `${company}パートナーシップ`,
                description: `${company}との戦略的パートナーシップ構築プロジェクト`,
                phase: 'negotiation',
                priority: seniorContacts.length > 0 ? 'A' : 'B',
                kgi: `${company}との正式パートナーシップ締結`,
                estimatedDuration: 120 // 4ヶ月
              },
              autoPromotionScore,
              createdAt: new Date().toISOString()
            });
          }
        }
      }

      return candidates;
    } catch (error) {
      console.error('Connection growth detection failed:', error);
      return [];
    }
  }

  /**
   * LINE入力クラスター分析（関連するLINE入力を検出）
   */
  private async detectLineInputClusters(): Promise<PromotionCandidate[]> {
    try {
      // LINE統合ログ機能は将来実装予定のため、現在は空の結果を返す
      console.log('LINE input cluster detection: Feature not yet implemented');
      return [];
    } catch (error) {
      console.error('LINE input cluster detection failed:', error);
      return [];
    }
  }

  /**
   * 自動昇華判定（高スコア候補の自動プロジェクト化）
   */
  async evaluateAutoPromotion(candidate: PromotionCandidate): Promise<{
    shouldAutoPromote: boolean;
    reasoning: string;
    confidence: number;
  }> {
    try {
      let shouldPromote = false;
      let reasoning = '';

      // 自動昇華条件チェック
      if (candidate.autoPromotionScore >= 0.8 && candidate.confidence >= 0.85) {
        shouldPromote = true;
        reasoning = '高い確信度と自動昇華スコアにより自動実行を推奨';
      } else if (candidate.type === 'appointment_series' && candidate.confidence >= 0.8) {
        shouldPromote = true;
        reasoning = '継続的な商談活動により緊急性が高く自動実行を推奨';
      } else if (candidate.relatedItems.length >= 10) {
        shouldPromote = true;
        reasoning = '大量の関連項目により重要性が高く自動実行を推奨';
      } else {
        reasoning = 'マニュアル確認が必要なレベル';
      }

      return {
        shouldAutoPromote: shouldPromote,
        reasoning,
        confidence: Math.min(0.95, candidate.confidence + 0.1)
      };
    } catch (error) {
      console.error('Auto promotion evaluation failed:', error);
      return {
        shouldAutoPromote: false,
        reasoning: 'エラーにより自動実行を停止',
        confidence: 0.0
      };
    }
  }

  // ===== プライベートメソッド =====

  private clusterTasksByKeywords(tasks: any[]): Array<{ keyword: string; tasks: any[] }> {
    const keywordMap = new Map<string, any[]>();

    for (const task of tasks) {
      const keywords = this.extractKeywords(task.title + ' ' + task.description);
      for (const keyword of keywords) {
        if (!keywordMap.has(keyword)) {
          keywordMap.set(keyword, []);
        }
        keywordMap.get(keyword)!.push(task);
      }
    }

    return Array.from(keywordMap.entries())
      .map(([keyword, tasks]) => ({ keyword, tasks }))
      .filter(cluster => cluster.tasks.length >= 3);
  }

  private extractKeywords(text: string): string[] {
    // 日本語キーワード抽出（簡易実装）
    const keywords = text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]{2,}/g) || [];
    const frequency = keywords.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(frequency)
      .filter(([word, count]) => count >= 2 && word.length >= 2)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  private calculateClusterConfidence(cluster: { keyword: string; tasks: any[] }): number {
    const keywordFrequency = cluster.tasks.filter(task => 
      (task.title + ' ' + task.description).includes(cluster.keyword)
    ).length;
    
    const confidence = Math.min(0.95, (keywordFrequency / cluster.tasks.length) * 0.8 + 0.2);
    return confidence;
  }

  private calculateAutoPromotionScore(items: any[], type: string): number {
    let baseScore = 0.4;

    switch (type) {
      case 'task_cluster':
        baseScore += Math.min(0.4, items.length * 0.05); // タスク数による加点
        break;
      case 'appointment_series':
        baseScore += Math.min(0.5, items.length * 0.1); // アポ継続性による加点
        break;
      case 'connection_growth':
        baseScore += Math.min(0.3, items.length * 0.05); // コネクション数による加点
        break;
      case 'line_input':
        baseScore += Math.min(0.3, items.length * 0.02); // 入力頻度による加点
        break;
    }

    return Math.min(1.0, baseScore);
  }

  private groupAppointmentsByCompany(appointments: any[]): Map<string, any[]> {
    const companyMap = new Map<string, any[]>();
    
    for (const appointment of appointments) {
      const company = appointment.companyName;
      if (!companyMap.has(company)) {
        companyMap.set(company, []);
      }
      companyMap.get(company)!.push(appointment);
    }
    
    return companyMap;
  }

  private groupConnectionsByCompany(connections: any[]): Map<string, any[]> {
    const companyMap = new Map<string, any[]>();
    
    for (const connection of connections) {
      const company = connection.company;
      if (!companyMap.has(company)) {
        companyMap.set(company, []);
      }
      companyMap.get(company)!.push(connection);
    }
    
    return companyMap;
  }

  private clusterLineInputsByTime(logs: any[]): Array<{ timeRange: string; logs: any[] }> {
    // 7日間の時間窓でクラスタリング
    const clusters = [];
    const sortedLogs = logs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    let currentCluster: any[] = [];
    let clusterStartTime: Date | null = null;

    for (const log of sortedLogs) {
      const logTime = new Date(log.createdAt);
      
      if (!clusterStartTime || (logTime.getTime() - clusterStartTime.getTime()) > (7 * 24 * 60 * 60 * 1000)) {
        if (currentCluster.length > 0) {
          clusters.push({
            timeRange: `${clusterStartTime?.toLocaleDateString()} - ${new Date(currentCluster[currentCluster.length - 1].createdAt).toLocaleDateString()}`,
            logs: currentCluster
          });
        }
        currentCluster = [log];
        clusterStartTime = logTime;
      } else {
        currentCluster.push(log);
      }
    }

    if (currentCluster.length > 0) {
      clusters.push({
        timeRange: `${clusterStartTime?.toLocaleDateString()} - ${new Date(currentCluster[currentCluster.length - 1].createdAt).toLocaleDateString()}`,
        logs: currentCluster
      });
    }

    return clusters;
  }

  private extractCommonKeywords(extractedDataArray: any[]): string[] {
    const allText = extractedDataArray
      .map(data => `${data.title || ''} ${data.description || ''}`)
      .join(' ');
    
    return this.extractKeywords(allText);
  }

  private inferProjectPriority(tasks: any[]): 'A' | 'B' | 'C' | 'D' {
    const highPriorityTasks = tasks.filter(t => t.priority === 'A' || t.aiIssueLevel === 'A');
    if (highPriorityTasks.length >= tasks.length * 0.5) return 'A';
    
    const mediumPriorityTasks = tasks.filter(t => t.priority === 'B' || t.aiIssueLevel === 'B');
    if (mediumPriorityTasks.length >= tasks.length * 0.5) return 'B';
    
    return 'C';
  }

  private inferAppointmentPhase(appointments: any[]): string {
    const statuses = appointments.map(a => a.status);
    
    if (statuses.includes('scheduled')) return 'closing';
    if (statuses.includes('interested')) return 'proposal';
    if (statuses.includes('contacted')) return 'negotiation';
    
    return 'concept';
  }

  private inferAppointmentPriority(appointments: any[]): 'A' | 'B' | 'C' | 'D' {
    const highValueIndicators = appointments.filter(a => 
      a.priority === 'A' || a.status === 'scheduled' || a.status === 'interested'
    );
    
    if (highValueIndicators.length >= appointments.length * 0.5) return 'A';
    return 'B';
  }

  private estimateProjectDuration(tasks: any[]): number {
    const totalEstimatedHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 5), 0);
    return Math.max(30, Math.min(180, Math.ceil(totalEstimatedHours / 8))); // 8時間/日換算
  }

  private async generateKGI(cluster: { keyword: string; tasks: any[] }): Promise<string> {
    const taskTitles = cluster.tasks.map(t => t.title).join('、');
    return `${cluster.keyword}関連の全タスク完了による成果創出`;
  }

  private async generateKGIFromLineInputs(extractedDataArray: any[]): Promise<string> {
    const keywords = this.extractCommonKeywords(extractedDataArray);
    if (keywords.length > 0) {
      return `${keywords[0]}プロジェクトの成功による目標達成`;
    }
    return 'プロジェクト目標の達成';
  }

  private getDaysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}