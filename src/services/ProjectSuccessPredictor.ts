import { getAICallManager } from '../lib/ai/call-manager';
import prisma from '../lib/database/prisma';
import { MBTITeamOptimizer } from './MBTITeamOptimizer';

export interface ProjectSuccessAnalysis {
  projectId: string;
  successProbability: number; // 0-1
  confidenceLevel: number; // 0-1
  successFactors: Array<{
    factor: string;
    impact: number; // -10 to +10
    current: number; // 0-10
    optimal: number; // 0-10
    actionable: boolean;
  }>;
  riskAssessment: {
    technicalRisk: number;
    scheduleRisk: number;
    resourceRisk: number;
    stakeholderRisk: number;
    overallRisk: number;
  };
  improvementRecommendations: Array<{
    area: string;
    recommendation: string;
    expectedImpact: number;
    implementationEffort: 'LOW' | 'MEDIUM' | 'HIGH';
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  benchmarkComparison: {
    similarProjects: number;
    industryAverage: number;
    performanceRanking: string;
  };
}

export interface ProjectHealthMonitoring {
  currentHealth: {
    score: number;
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    alerts: Array<{
      level: 'WARNING' | 'CRITICAL';
      message: string;
      actionRequired: string;
    }>;
  };
  weeklyTrend: Array<{
    week: string;
    healthScore: number;
    keyEvents: string[];
  }>;
  predictiveAlerts: Array<{
    timeframe: string;
    probability: number;
    issue: string;
    preemptiveActions: string[];
  }>;
}

export interface ProjectImprovementSimulation {
  scenarios: Array<{
    name: string;
    changes: string[];
    newSuccessProbability: number;
    improvementGain: number;
    totalCost: number;
    timeToImplement: number;
    roi: number;
  }>;
  recommendedScenario: string;
  alternativeOptions: string[];
}

export class ProjectSuccessPredictor {
  private aiCallManager = getAICallManager();

  constructor(
    private mbtiOptimizer: MBTITeamOptimizer = new MBTITeamOptimizer()
  ) {}

  /**
   * プロジェクト成功確率予測分析
   */
  async predictProjectSuccess(projectId: string): Promise<ProjectSuccessAnalysis> {
    try {
      const project = await this.getProjectDetails(projectId);
      if (!project) {
        throw new Error(`Project not found: ${projectId}`);
      }

      const [
        teamAnalysis,
        stakeholderAnalysis,
        technicalAnalysis,
        historicalComparisons,
        resourceAnalysis
      ] = await Promise.all([
        this.analyzeProjectTeam(projectId),
        this.analyzeStakeholders(projectId),
        this.analyzeTechnicalFactors(projectId),
        this.findSimilarProjects(project),
        this.analyzeResourceAllocation(projectId)
      ]);
      
      const aiResult = await this.aiCallManager.callGemini(`
      プロジェクト成功確率予測分析:
      
      プロジェクト基本情報:
      - プロジェクト名: ${project.name}
      - 期間: ${project.startDate} ～ ${project.endDate || '未定'}
      - フェーズ: ${project.phase}
      - 進捗率: ${project.progress}%
      - 優先度: ${project.priority}
      - ステータス: ${project.status}
      
      チーム分析:
      - チームサイズ: ${teamAnalysis.size}名
      - 平均経験レベル: ${teamAnalysis.averageExperience}/10
      - スキル適合度: ${teamAnalysis.skillMatch}/10
      - チーム安定性: ${teamAnalysis.stability}/10
      - コミュニケーション効率: ${teamAnalysis.communication}/10
      - MBTI適合性: ${teamAnalysis.mbtiCompatibility}/10
      
      ステークホルダー分析:
      - 関与レベル: ${stakeholderAnalysis.engagementLevel}/10
      - 意思決定速度: ${stakeholderAnalysis.decisionSpeed}/10
      - 要件明確度: ${stakeholderAnalysis.requirementClarity}/10
      - 変更頻度リスク: ${stakeholderAnalysis.changeFrequency}/10
      
      技術的要因:
      - 技術新規性: ${technicalAnalysis.novelty}/10
      - アーキテクチャ複雑度: ${technicalAnalysis.architectureComplexity}/10
      - 統合難易度: ${technicalAnalysis.integrationDifficulty}/10
      - パフォーマンス要件: ${technicalAnalysis.performanceRequirements}/10
      
      リソース配分:
      - 人的リソース充足度: ${resourceAnalysis.humanResources}/10
      - 技術リソース充足度: ${resourceAnalysis.technicalResources}/10
      - 予算余裕度: ${resourceAnalysis.budgetBuffer}/10
      - スケジュール余裕度: ${resourceAnalysis.scheduleBuffer}/10
      
      類似プロジェクト実績:
      ${historicalComparisons.map(p => 
        `- ${p.name}: 成功度${p.successScore || '不明'}/10, 期間比${p.duration || '不明'}`
      ).join('\n')}
      
      以下の観点で多次元成功要因分析を実行:
      
      1. 技術的成功要因:
         - アーキテクチャ適切性
         - 技術選択の妥当性
         - 開発プロセスの効率性
         - 品質管理の充実度
      
      2. プロジェクト管理要因:
         - スケジュール管理精度
         - リスク管理の有効性
         - コミュニケーション体制
         - 変更管理プロセス
      
      3. チーム・人的要因:
         - チームスキルの適合性
         - モチベーション・エンゲージメント
         - 協調性・チームワーク
         - リーダーシップの質
      
      4. ステークホルダー要因:
         - 要件の明確性・安定性
         - 意思決定の迅速性
         - フィードバックの質・頻度
         - 期待値管理の適切性
      
      5. 外部・環境要因:
         - 市場・業界環境の安定性
         - 競合状況・技術トレンド
         - 組織・政治的要因
         - 経済・規制環境
      
      各要因の現状評価と改善可能性を分析し、実行可能な改善策を提案:
      
      回答形式:
      {
        "projectId": "${projectId}",
        "successProbability": 0.78,
        "confidenceLevel": 0.85,
        "successFactors": [
          {
            "factor": "チーム技術スキル",
            "impact": 8,
            "current": 7,
            "optimal": 9,
            "actionable": true
          },
          {
            "factor": "要件明確性",
            "impact": 7,
            "current": 6,
            "optimal": 9,
            "actionable": true
          }
        ],
        "riskAssessment": {
          "technicalRisk": 6,
          "scheduleRisk": 4,
          "resourceRisk": 3,
          "stakeholderRisk": 5,
          "overallRisk": 4.5
        },
        "improvementRecommendations": [
          {
            "area": "技術スキル強化",
            "recommendation": "React上級研修の実施",
            "expectedImpact": 0.15,
            "implementationEffort": "MEDIUM",
            "priority": "HIGH"
          },
          {
            "area": "要件定義強化",
            "recommendation": "ステークホルダーとの定期レビュー会議設定",
            "expectedImpact": 0.12,
            "implementationEffort": "LOW",
            "priority": "HIGH"
          }
        ],
        "benchmarkComparison": {
          "similarProjects": 12,
          "industryAverage": 0.72,
          "performanceRanking": "ABOVE_AVERAGE"
        }
      }
      `, 'project_success_prediction');

      if (!aiResult.success || !aiResult.content) {
        throw new Error('AI analysis failed');
      }

      const result = this.parseSuccessAnalysis(aiResult.content);
      await this.saveSuccessAnalysis(projectId, result);
      
      return result;
    } catch (error) {
      console.error('Project success prediction error:', error);
      return this.getDefaultSuccessAnalysis(projectId);
    }
  }

  /**
   * リアルタイム成功確率監視
   */
  async monitorProjectHealth(projectId: string): Promise<ProjectHealthMonitoring> {
    try {
      const [
        currentMetrics,
        weeklyHistory,
        upcomingMilestones
      ] = await Promise.all([
        this.getCurrentProjectMetrics(projectId),
        this.getWeeklyProjectMetrics(projectId),
        this.getUpcomingMilestones(projectId)
      ]);
      
      const aiResult = await this.aiCallManager.callGemini(`
      プロジェクトヘルス監視分析:
      
      現在の指標:
      ${Object.entries(currentMetrics).map(([key, value]) => 
        `- ${key}: ${value}`
      ).join('\n')}
      
      過去4週間のトレンド:
      ${weeklyHistory.map(week => 
        `- ${week.date}: スコア${week.healthScore}, 主要イベント: ${week.events.join(', ')}`
      ).join('\n')}
      
      今後のマイルストーン:
      ${upcomingMilestones.map(milestone => 
        `- ${milestone.title}: ${milestone.dueDate}, リスク${milestone.riskLevel}`
      ).join('\n')}
      
      健康度評価と予測的アラート生成:
      
      1. 現在の健康度スコア算出 (0-100)
      2. トレンド分析 (改善/安定/悪化)
      3. 警告・重要アラートの特定
      4. 予測的問題の早期発見
      5. 具体的な対策アクション提案
      
      回答形式:
      {
        "currentHealth": {
          "score": 78,
          "trend": "STABLE",
          "alerts": [
            {
              "level": "WARNING",
              "message": "スケジュール遅延の兆候",
              "actionRequired": "リソース配分の見直し"
            }
          ]
        },
        "weeklyTrend": [
          {
            "week": "2025-06-23",
            "healthScore": 75,
            "keyEvents": ["要件変更", "新メンバー参加"]
          }
        ],
        "predictiveAlerts": [
          {
            "timeframe": "2週間以内",
            "probability": 0.7,
            "issue": "技術的ボトルネック",
            "preemptiveActions": ["技術レビュー実施", "エキスパート相談"]
          }
        ]
      }
      `, 'project_health_monitoring');

      if (!aiResult.success || !aiResult.content) {
        throw new Error('AI health monitoring failed');
      }

      return this.parseHealthMonitoring(aiResult.content);
    } catch (error) {
      console.error('Project health monitoring error:', error);
      return this.getDefaultHealthMonitoring();
    }
  }

  /**
   * 成功要因最適化シミュレーション
   */
  async simulateImprovements(
    projectId: string,
    proposedChanges: Array<{
      factor: string;
      targetValue: number;
      implementationCost: number;
      timeRequired: number;
    }>
  ): Promise<ProjectImprovementSimulation> {
    try {
      const currentAnalysis = await this.predictProjectSuccess(projectId);
      
      const aiResult = await this.aiCallManager.callGemini(`
      プロジェクト改善シミュレーション:
      
      現在の成功確率: ${currentAnalysis.successProbability}
      
      提案変更:
      ${proposedChanges.map(change => 
        `- ${change.factor}: ${change.targetValue} (コスト: ${change.implementationCost}円, 期間: ${change.timeRequired}日)`
      ).join('\n')}
      
      複数シナリオでの効果シミュレーション:
      
      1. 個別改善シナリオ（各変更を単独実行）
      2. 段階的実行シナリオ（優先度順に実行）
      3. 全面実行シナリオ（すべての変更を実行）
      4. コスト最適化シナリオ（ROI最大化）
      
      各シナリオで以下を算出:
      - 新しい成功確率
      - 改善効果
      - 実装コスト
      - 実装期間
      - ROI (投資対効果)
      
      回答形式:
      {
        "scenarios": [
          {
            "name": "技術スキル強化のみ",
            "changes": ["React研修実施"],
            "newSuccessProbability": 0.85,
            "improvementGain": 0.07,
            "totalCost": 500000,
            "timeToImplement": 14,
            "roi": 1.4
          },
          {
            "name": "段階的改善",
            "changes": ["React研修", "要件レビュー強化"],
            "newSuccessProbability": 0.88,
            "improvementGain": 0.10,
            "totalCost": 800000,
            "timeToImplement": 21,
            "roi": 1.25
          }
        ],
        "recommendedScenario": "段階的改善",
        "alternativeOptions": ["技術スキル強化のみ", "全面実行"]
      }
      `, 'project_improvement_simulation');

      if (!aiResult.success || !aiResult.content) {
        throw new Error('AI simulation failed');
      }

      return this.parseSimulationResults(aiResult.content);
    } catch (error) {
      console.error('Improvement simulation error:', error);
      return this.getDefaultSimulation();
    }
  }

  // ヘルパーメソッド
  private async getProjectDetails(projectId: string) {
    try {
      return await prisma.projects.findUnique({
        where: { id: projectId },
        include: {
          tasks: true,
          project_phase_history: true
        }
      });
    } catch (error) {
      console.error('Project details fetch error:', error);
      return null;
    }
  }

  private async analyzeProjectTeam(projectId: string) {
    try {
      const project = await prisma.projects.findUnique({
        where: { id: projectId },
        include: { tasks: true }
      });

      if (!project) return this.getDefaultTeamAnalysis();

      const teamMembers = project.teamMembers || [];
      const mbtiAnalysis = await this.mbtiOptimizer.optimizeTeamComposition({
        projectId,
        projectType: 'DEVELOPMENT',
        requiredRoles: ['DEVELOPER', 'DESIGNER'],
        teamSize: teamMembers.length,
        projectDuration: 90, // デフォルト値
        complexityLevel: 5,  // デフォルト値
        availableMembers: teamMembers
      });

      return {
        size: teamMembers.length,
        averageExperience: 7, // 実際の経験値データに置き換え
        skillMatch: 8,
        stability: 9,
        communication: 7,
        mbtiCompatibility: mbtiAnalysis.teamCompatibilityScore
      };
    } catch (error) {
      console.error('Team analysis error:', error);
      return this.getDefaultTeamAnalysis();
    }
  }

  private async analyzeStakeholders(projectId: string) {
    // ステークホルダー分析
    return {
      engagementLevel: 7,
      decisionSpeed: 6,
      requirementClarity: 8,
      changeFrequency: 4
    };
  }

  private async analyzeTechnicalFactors(projectId: string) {
    // 技術的要因分析
    return {
      novelty: 6,
      architectureComplexity: 7,
      integrationDifficulty: 5,
      performanceRequirements: 8
    };
  }

  private async findSimilarProjects(project: any) {
    try {
      const similarProjects = await prisma.projects.findMany({
        where: {
          status: 'COMPLETED',
          phase: project.phase,
          NOT: { id: project.id }
        },
        orderBy: { updatedAt: 'desc' },
        take: 5
      });

      return similarProjects.map(p => ({
        name: p.name,
        successScore: Math.floor(Math.random() * 3) + 7, // 実際の成功スコアに置き換え
        duration: `${Math.floor(Math.random() * 50) + 80}%` // 計画対実績比
      }));
    } catch (error) {
      console.error('Similar projects search error:', error);
      return [];
    }
  }

  private async analyzeResourceAllocation(projectId: string) {
    // リソース配分分析
    return {
      humanResources: 8,
      technicalResources: 7,
      budgetBuffer: 6,
      scheduleBuffer: 5
    };
  }

  private async getCurrentProjectMetrics(projectId: string) {
    try {
      const project = await prisma.projects.findUnique({
        where: { id: projectId },
        include: { tasks: true }
      });

      if (!project) return {};

      const totalTasks = project.tasks.length;
      const completedTasks = project.tasks.filter(t => t.status === 'COMPLETE').length;
      
      return {
        progress: project.progress,
        taskCompletion: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        phase: project.phase,
        priority: project.priority,
        teamSize: project.teamMembers.length
      };
    } catch (error) {
      console.error('Current project metrics error:', error);
      return {};
    }
  }

  private async getWeeklyProjectMetrics(projectId: string) {
    // 週次プロジェクト指標の履歴
    return [
      {
        date: '2025-06-23',
        healthScore: 75,
        events: ['要件変更', '新メンバー参加']
      },
      {
        date: '2025-06-16',
        healthScore: 78,
        events: ['マイルストーン達成']
      }
    ];
  }

  private async getUpcomingMilestones(projectId: string) {
    try {
      const milestones = await prisma.tasks.findMany({
        where: {
          projectId,
          status: { in: ['PLAN', 'DO'] },
          dueDate: { not: null }
        },
        orderBy: { dueDate: 'asc' },
        take: 5
      });

      return milestones.map(m => ({
        title: m.title,
        dueDate: m.dueDate,
        riskLevel: m.priority === 'A' ? 'HIGH' : m.priority === 'B' ? 'MEDIUM' : 'LOW'
      }));
    } catch (error) {
      console.error('Upcoming milestones fetch error:', error);
      return [];
    }
  }

  private async saveSuccessAnalysis(projectId: string, analysis: ProjectSuccessAnalysis) {
    try {
      await prisma.ai_evaluations.create({
        data: {
          entityType: 'PROJECT',
          entityId: projectId,
          evaluationType: 'SUCCESS_PREDICTION',
          score: analysis.successProbability,
          reasoning: JSON.stringify(analysis),
          confidence: analysis.confidenceLevel
        }
      });
    } catch (error) {
      console.error('Success analysis save error:', error);
    }
  }

  private parseSuccessAnalysis(aiResponse: string): ProjectSuccessAnalysis {
    try {
      return JSON.parse(aiResponse);
    } catch (error) {
      console.error('Success analysis parsing error:', error);
      return this.getDefaultSuccessAnalysis('');
    }
  }

  private parseHealthMonitoring(aiResponse: string): ProjectHealthMonitoring {
    try {
      return JSON.parse(aiResponse);
    } catch (error) {
      console.error('Health monitoring parsing error:', error);
      return this.getDefaultHealthMonitoring();
    }
  }

  private parseSimulationResults(aiResponse: string): ProjectImprovementSimulation {
    try {
      return JSON.parse(aiResponse);
    } catch (error) {
      console.error('Simulation results parsing error:', error);
      return this.getDefaultSimulation();
    }
  }

  private getDefaultSuccessAnalysis(projectId: string): ProjectSuccessAnalysis {
    return {
      projectId,
      successProbability: 0.5,
      confidenceLevel: 0.5,
      successFactors: [],
      riskAssessment: {
        technicalRisk: 5,
        scheduleRisk: 5,
        resourceRisk: 5,
        stakeholderRisk: 5,
        overallRisk: 5
      },
      improvementRecommendations: [],
      benchmarkComparison: {
        similarProjects: 0,
        industryAverage: 0.5,
        performanceRanking: 'AVERAGE'
      }
    };
  }

  private getDefaultTeamAnalysis() {
    return {
      size: 0,
      averageExperience: 5,
      skillMatch: 5,
      stability: 5,
      communication: 5,
      mbtiCompatibility: 5
    };
  }

  private getDefaultHealthMonitoring(): ProjectHealthMonitoring {
    return {
      currentHealth: {
        score: 50,
        trend: 'STABLE',
        alerts: []
      },
      weeklyTrend: [],
      predictiveAlerts: []
    };
  }

  private getDefaultSimulation(): ProjectImprovementSimulation {
    return {
      scenarios: [],
      recommendedScenario: '',
      alternativeOptions: []
    };
  }
}