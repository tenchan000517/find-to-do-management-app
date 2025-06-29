// Phase 3: Smart Recommendation Engine
// AI駆動のスマート推奨システム

import { AnomalyDetectionEngine } from './AnomalyDetectionEngine';

export interface TaskRecommendation {
  id: string;
  type: 'task-assignment' | 'priority-adjustment' | 'resource-allocation' | 'workflow-optimization';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  effort: 'low' | 'medium' | 'high';
  expectedBenefit: string;
  actionItems: string[];
  deadline?: string;
  assigneeRecommendation?: {
    userId: string;
    userName: string;
    matchScore: number;
    reason: string;
  };
}

export interface ProjectRecommendation {
  id: string;
  type: 'team-composition' | 'timeline-adjustment' | 'scope-modification' | 'risk-mitigation';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  projectId: string;
  recommendations: {
    action: string;
    reason: string;
    priority: number;
  }[];
}

export interface BusinessRecommendation {
  id: string;
  type: 'revenue-optimization' | 'cost-reduction' | 'process-improvement' | 'customer-retention';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  roi: number; // ROI予測 (倍率)
  implementationTime: string;
  steps: string[];
  metrics: string[];
}

export interface UserData {
  id: string;
  name: string;
  mbtiType?: string;
  skills: string[];
  workload: number; // 0-100
  performance: number; // 0-100
  availability: number; // 0-100
  preferences: {
    projectTypes: string[];
    workingHours: string;
    collaborationStyle: string;
  };
}

export interface ProjectData {
  id: string;
  name: string;
  status: string;
  progress: number;
  priority: string;
  startDate: string;
  endDate?: string;
  teamMembers: string[];
  tasks: TaskData[];
  budget?: number;
  actualCost?: number;
}

export interface TaskData {
  id: string;
  title: string;
  status: string;
  priority: string;
  assigneeId?: string;
  createdAt: string;
  dueDate?: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  complexity: number; // 1-10
  dependencies: string[];
}

export class SmartRecommendationEngine {
  private anomalyEngine: AnomalyDetectionEngine;

  constructor() {
    this.anomalyEngine = new AnomalyDetectionEngine();
  }

  /**
   * タスク割り当て推奨
   */
  async recommendTaskAssignments(
    tasks: TaskData[],
    users: UserData[],
    projectContext?: ProjectData
  ): Promise<TaskRecommendation[]> {
    const recommendations: TaskRecommendation[] = [];
    const unassignedTasks = tasks.filter(task => !task.assigneeId && task.status !== 'COMPLETED');
    
    for (const task of unassignedTasks) {
      const assigneeRecommendation = this.findBestAssignee(task, users, projectContext);
      
      if (assigneeRecommendation) {
        recommendations.push({
          id: `task-assign-${task.id}`,
          type: 'task-assignment',
          title: `タスク「${task.title}」の最適な担当者推奨`,
          description: `${assigneeRecommendation.userName}が最適な担当者です`,
          confidence: assigneeRecommendation.matchScore,
          impact: this.getTaskImpact(task),
          effort: 'low',
          expectedBenefit: `完了予測時間の${Math.round((1 - assigneeRecommendation.matchScore) * 20 + 10)}%短縮`,
          actionItems: [
            `${assigneeRecommendation.userName}にタスクを割り当て`,
            'タスクの詳細と期待値を共有',
            '進捗確認スケジュールを設定'
          ],
          deadline: task.dueDate,
          assigneeRecommendation
        });
      }
    }

    // 既存タスクの再配分推奨
    const overloadedUsers = users.filter(user => user.workload > 80);
    for (const user of overloadedUsers) {
      const userTasks = tasks.filter(task => task.assigneeId === user.id && task.status !== 'COMPLETED');
      const redistributableTasks = userTasks
        .filter(task => task.priority !== 'A')
        .sort((a, b) => b.complexity - a.complexity)
        .slice(0, 2);

      for (const task of redistributableTasks) {
        const alternativeAssignee = this.findBestAssignee(
          task, 
          users.filter(u => u.id !== user.id && u.workload < 70),
          projectContext
        );

        if (alternativeAssignee) {
          recommendations.push({
            id: `task-reassign-${task.id}`,
            type: 'task-assignment',
            title: `過負荷状態の${user.name}からタスクを再配分`,
            description: `「${task.title}」を${alternativeAssignee.userName}に再配分することを推奨`,
            confidence: alternativeAssignee.matchScore * 0.8,
            impact: 'medium',
            effort: 'medium',
            expectedBenefit: 'チーム全体の生産性向上と負荷分散',
            actionItems: [
              `${user.name}との調整`,
              `${alternativeAssignee.userName}への引き継ぎ`,
              'タスクの詳細共有と期待値設定'
            ],
            assigneeRecommendation: alternativeAssignee
          });
        }
      }
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * プロジェクト最適化推奨
   */
  async recommendProjectOptimizations(
    projects: ProjectData[],
    users: UserData[]
  ): Promise<ProjectRecommendation[]> {
    const recommendations: ProjectRecommendation[] = [];

    for (const project of projects) {
      // 進捗遅延の検出
      if (this.isProjectDelayed(project)) {
        recommendations.push({
          id: `project-timeline-${project.id}`,
          type: 'timeline-adjustment',
          title: `プロジェクト「${project.name}」の進捗改善推奨`,
          description: '現在の進捗ペースでは期限に間に合わない可能性があります',
          confidence: 0.8,
          impact: 'high',
          projectId: project.id,
          recommendations: [
            {
              action: 'クリティカルパスの見直し',
              reason: '最重要タスクに集中することで進捗を加速',
              priority: 1
            },
            {
              action: '追加リソースの投入',
              reason: '人的リソースを増強して作業を並行化',
              priority: 2
            },
            {
              action: 'スコープの調整',
              reason: '必須機能に絞り込んで期限内完了を確実に',
              priority: 3
            }
          ]
        });
      }

      // チーム構成の最適化
      const teamOptimization = this.analyzeTeamComposition(project, users);
      if (teamOptimization) {
        recommendations.push(teamOptimization);
      }

      // リスク要因の検出
      const riskMitigation = this.identifyProjectRisks(project);
      if (riskMitigation) {
        recommendations.push(riskMitigation);
      }
    }

    return recommendations;
  }

  /**
   * ビジネス最適化推奨
   */
  async recommendBusinessOptimizations(
    revenueData: Array<{timestamp: string; value: number}>,
    customerData: Array<{
      id: string;
      ltv: number;
      churnRisk: number;
      lastActivity: string;
    }>,
    operationalData: {
      avgResponseTime: number;
      customerSatisfaction: number;
      employeeUtilization: number;
    }
  ): Promise<BusinessRecommendation[]> {
    const recommendations: BusinessRecommendation[] = [];

    // 売上最適化
    const revenueAnomalies = this.anomalyEngine.detectTimeSeriesAnomalies(revenueData);
    const negativeAnomalies = revenueAnomalies.filter(a => a.isAnomaly && a.value < a.expectedValue);
    
    if (negativeAnomalies.length > 0) {
      recommendations.push({
        id: 'revenue-optimization-1',
        type: 'revenue-optimization',
        title: '売上減少の早期警告と対策',
        description: '最近の売上データに異常な減少パターンが検出されました',
        confidence: 0.85,
        impact: 'critical',
        roi: 2.5,
        implementationTime: '2-3週間',
        steps: [
          '売上減少の根本原因分析',
          '影響を受けた顧客セグメントの特定',
          'ターゲットリテンションキャンペーンの実施',
          '新規顧客獲得施策の強化'
        ],
        metrics: ['月次売上回復率', '顧客単価向上', '新規顧客獲得数']
      });
    }

    // 顧客維持最適化
    const highChurnRiskCustomers = customerData.filter(c => c.churnRisk > 0.7);
    if (highChurnRiskCustomers.length > 0) {
      recommendations.push({
        id: 'customer-retention-1',
        type: 'customer-retention',
        title: '高リスク顧客の緊急リテンション施策',
        description: `${highChurnRiskCustomers.length}名の顧客に高い離反リスクが検出されています`,
        confidence: 0.9,
        impact: 'high',
        roi: 4.0,
        implementationTime: '1-2週間',
        steps: [
          '高リスク顧客への個別アプローチ',
          'パーソナライズされた価値提案の作成',
          '専任カスタマーサクセス担当者の配置',
          '使用状況改善のための無料コンサルティング提供'
        ],
        metrics: ['顧客維持率', 'NPS改善', 'LTV向上率']
      });
    }

    // プロセス改善
    if (operationalData.avgResponseTime > 500) {
      recommendations.push({
        id: 'process-improvement-1',
        type: 'process-improvement',
        title: 'システム応答時間の最適化',
        description: 'システムの応答時間が目標値を上回っています',
        confidence: 0.7,
        impact: 'medium',
        roi: 1.8,
        implementationTime: '3-4週間',
        steps: [
          'パフォーマンスボトルネックの特定',
          'データベースクエリの最適化',
          'CDN・キャッシュ戦略の見直し',
          'インフラスケーリングの実装'
        ],
        metrics: ['平均応答時間', 'ユーザー満足度', 'システム可用性']
      });
    }

    // コスト削減
    if (operationalData.employeeUtilization < 60) {
      recommendations.push({
        id: 'cost-reduction-1',
        type: 'cost-reduction',
        title: 'リソース利用効率の改善',
        description: '従業員の稼働率が低く、コスト効率の改善余地があります',
        confidence: 0.6,
        impact: 'medium',
        roi: 1.5,
        implementationTime: '4-6週間',
        steps: [
          'タスク配分の見直し',
          'スキルマッチング精度の向上',
          '無駄な会議・プロセスの削減',
          'クロストレーニング実施による柔軟性向上'
        ],
        metrics: ['従業員稼働率', '時間当たり生産性', 'プロジェクト完了速度']
      });
    }

    return recommendations.sort((a, b) => 
      (b.impact === 'critical' ? 4 : b.impact === 'high' ? 3 : b.impact === 'medium' ? 2 : 1) -
      (a.impact === 'critical' ? 4 : a.impact === 'high' ? 3 : a.impact === 'medium' ? 2 : 1)
    );
  }

  // ヘルパーメソッド
  private findBestAssignee(
    task: TaskData, 
    users: UserData[], 
    projectContext?: ProjectData
  ): TaskRecommendation['assigneeRecommendation'] | null {
    const availableUsers = users.filter(user => user.availability > 20 && user.workload < 90);
    
    if (availableUsers.length === 0) return null;

    const scores = availableUsers.map(user => {
      let score = 0;
      
      // 稼働率による評価 (40%の重み)
      const workloadScore = Math.max(0, (100 - user.workload) / 100);
      score += workloadScore * 0.4;
      
      // パフォーマンスによる評価 (30%の重み)
      score += (user.performance / 100) * 0.3;
      
      // 可用性による評価 (20%の重み)
      score += (user.availability / 100) * 0.2;
      
      // MBTIマッチング (10%の重み)
      if (user.mbtiType && task.complexity) {
        const mbtiScore = this.calculateMBTITaskMatch(user.mbtiType, task);
        score += mbtiScore * 0.1;
      }

      return {
        user,
        score,
        reason: this.generateAssignmentReason(user, task, score)
      };
    });

    const bestMatch = scores.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    return {
      userId: bestMatch.user.id,
      userName: bestMatch.user.name,
      matchScore: Math.round(bestMatch.score * 100) / 100,
      reason: bestMatch.reason
    };
  }

  private calculateMBTITaskMatch(mbtiType: string, task: TaskData): number {
    // MBTI×タスクタイプの相性評価
    const mbtiTaskAffinities: Record<string, Record<string, number>> = {
      'INTJ': { analytical: 0.9, planning: 0.8, creative: 0.6, social: 0.4 },
      'ENTJ': { planning: 0.9, leadership: 0.9, analytical: 0.7, social: 0.6 },
      'INFP': { creative: 0.9, social: 0.8, analytical: 0.5, planning: 0.6 },
      'ENFP': { creative: 0.8, social: 0.9, leadership: 0.7, planning: 0.5 },
      // ... 他のMBTIタイプも定義
    };

    const taskType = this.inferTaskType(task);
    const affinities = mbtiTaskAffinities[mbtiType];
    
    return affinities?.[taskType] || 0.5;
  }

  private inferTaskType(task: TaskData): string {
    const title = task.title.toLowerCase();
    
    if (title.includes('分析') || title.includes('調査')) return 'analytical';
    if (title.includes('企画') || title.includes('計画')) return 'planning';
    if (title.includes('デザイン') || title.includes('創造')) return 'creative';
    if (title.includes('コミュニケーション') || title.includes('調整')) return 'social';
    if (title.includes('リード') || title.includes('管理')) return 'leadership';
    
    return 'general';
  }

  private generateAssignmentReason(user: UserData, task: TaskData, score: number): string {
    const reasons = [];
    
    if (user.workload < 50) reasons.push('余裕のある稼働状況');
    if (user.performance > 80) reasons.push('高いパフォーマンス実績');
    if (user.availability > 80) reasons.push('高い可用性');
    
    const taskType = this.inferTaskType(task);
    if (user.mbtiType && this.calculateMBTITaskMatch(user.mbtiType, task) > 0.7) {
      reasons.push(`${taskType}タスクとの高い相性`);
    }
    
    return reasons.length > 0 ? reasons.join('、') + 'により最適' : '総合的な評価により推奨';
  }

  private getTaskImpact(task: TaskData): 'low' | 'medium' | 'high' | 'critical' {
    if (task.priority === 'A') return 'critical';
    if (task.priority === 'B') return 'high';
    if (task.priority === 'C') return 'medium';
    return 'low';
  }

  private isProjectDelayed(project: ProjectData): boolean {
    if (!project.endDate) return false;
    
    const now = new Date();
    const endDate = new Date(project.endDate);
    const totalDuration = endDate.getTime() - new Date(project.startDate).getTime();
    const elapsedTime = now.getTime() - new Date(project.startDate).getTime();
    const expectedProgress = (elapsedTime / totalDuration) * 100;
    
    return project.progress < (expectedProgress - 10); // 10%以上の遅延
  }

  private analyzeTeamComposition(project: ProjectData, users: UserData[]): ProjectRecommendation | null {
    const teamMembers = users.filter(user => project.teamMembers.includes(user.id));
    
    // チームのMBTI多様性分析
    const mbtiTypes = teamMembers.map(m => m.mbtiType).filter(Boolean);
    const uniqueTypes = new Set(mbtiTypes);
    
    if (uniqueTypes.size < 2 && teamMembers.length > 2) {
      return {
        id: `team-composition-${project.id}`,
        type: 'team-composition',
        title: `プロジェクト「${project.name}」のチーム構成最適化`,
        description: 'チームの多様性を高めることで創造性と問題解決能力を向上',
        confidence: 0.7,
        impact: 'medium',
        projectId: project.id,
        recommendations: [
          {
            action: '異なるMBTIタイプのメンバー追加',
            reason: '多様な視点と問題解決アプローチの確保',
            priority: 1
          },
          {
            action: 'チームビルディング活動の実施',
            reason: '異なる性格タイプ間のコラボレーション促進',
            priority: 2
          }
        ]
      };
    }

    return null;
  }

  private identifyProjectRisks(project: ProjectData): ProjectRecommendation | null {
    const risks = [];
    
    // 予算超過リスク
    if (project.budget && project.actualCost && project.actualCost > project.budget * 0.8) {
      risks.push({
        action: '予算管理の強化',
        reason: '現在のペースでは予算超過の可能性',
        priority: 1
      });
    }
    
    // 依存関係のボトルネック
    const criticalTasks = project.tasks.filter(task => 
      task.dependencies.length > 2 && task.status !== 'COMPLETED'
    );
    
    if (criticalTasks.length > 0) {
      risks.push({
        action: '依存関係の見直しと並行化',
        reason: '複数の依存関係により進捗ボトルネックのリスク',
        priority: 2
      });
    }
    
    if (risks.length > 0) {
      return {
        id: `project-risk-${project.id}`,
        type: 'risk-mitigation',
        title: `プロジェクト「${project.name}」のリスク軽減`,
        description: '潜在的なリスク要因が検出されました',
        confidence: 0.8,
        impact: 'high',
        projectId: project.id,
        recommendations: risks
      };
    }
    
    return null;
  }
}