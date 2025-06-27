// Phase 1: Student Resource Management System
// Implementation Date: 2025-06-27
// Description: Core service for managing student resources, load calculation, and optimal allocation

import prisma from '../lib/database/prisma';
import { AIEvaluationEngine } from '../lib/ai/evaluation-engine';

export interface StudentResource {
  id: string;
  userId: string;
  weeklyCommitHours: number;
  currentLoadPercentage: number;
  semesterAvailability: Record<string, number>;
  emergencyAvailableHours: Record<string, number>;
  technicalSkills: string[];
  softSkills: string[];
  learningPreferences: Record<string, any>;
  projectExperience: Array<any>;
  taskCompletionRate: number;
  qualityScore: number;
  collaborationScore: number;
  mbtiAnalysis: Record<string, any>;
  personalityStrengths: string[];
  optimalRoles: string[];
  stressFactors: string[];
  motivationFactors: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ResourceAllocationRequest {
  projectId: string;
  requiredHours: number;
  requiredSkills: string[];
  preferredRole: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  deadline: Date;
  projectType?: string;
  complexityLevel?: number;
  teamSize?: number;
}

export interface OptimalAllocation {
  recommendedUsers: Array<{
    userId: string;
    userName: string;
    allocationScore: number;
    expectedHours: number;
    reasonForRecommendation: string;
    riskFactors: string[];
    compatibilityScore: number;
    skillMatchScore: number;
    availabilityScore: number;
  }>;
  allocationStrategy: string;
  expectedOutcome: string;
  alternativeOptions: string[];
  teamDynamicsAnalysis: string;
  successProbability: number;
}

export interface StudentFitnessEvaluation {
  student: StudentResource;
  user: any;
  currentLoad: number;
  skillMatch: number;
  qualityScore: number;
  collaborationScore: number;
  completionRate: number;
  availableHours: number;
  riskFactors: string[];
  strengthFactors: string[];
  overallScore: number;
}

export class StudentResourceManager {
  private aiEngine: AIEvaluationEngine;

  constructor() {
    this.aiEngine = new AIEvaluationEngine();
  }

  /**
   * Calculate user's current load percentage based on active tasks and allocations
   */
  async calculateUserLoad(userId: string): Promise<number> {
    try {
      const user = await this.getUser(userId);
      const studentResource = await this.getStudentResource(userId);
      const activeTasks = await this.getUserActiveTasks(userId);
      const activeProjectAllocations = await this.getUserActiveProjectAllocations(userId);

      // Calculate weighted hours from tasks
      const taskWeightedHours = activeTasks.reduce((sum, task) => {
        const difficultyMultiplier = (task.difficultyScore || 5) / 5;
        const resourceWeight = task.resourceWeight || 1.0;
        return sum + (task.estimatedHours * difficultyMultiplier * resourceWeight);
      }, 0);

      // Calculate hours from project allocations
      const projectAllocatedHours = activeProjectAllocations.reduce((sum, allocation) => 
        sum + allocation.allocatedHours, 0
      );

      const totalWeightedHours = taskWeightedHours + projectAllocatedHours;
      const weeklyCapacity = studentResource?.weeklyCommitHours || user?.weeklyCommitHours || 20;

      const loadPercentage = Math.min((totalWeightedHours / weeklyCapacity) * 100, 100);

      // Update the load percentage in the database
      await this.updateStudentResourceLoad(userId, loadPercentage);

      return loadPercentage;
    } catch (error) {
      console.error('Error calculating user load:', error);
      return 0;
    }
  }

  /**
   * Find optimal resource allocation for a project
   */
  async optimizeResourceAllocation(
    request: ResourceAllocationRequest
  ): Promise<OptimalAllocation> {
    try {
      const availableStudents = await this.getAvailableStudents(request);
      
      // Evaluate each student's fitness for the request
      const evaluations = await Promise.all(
        availableStudents.map(student => 
          this.evaluateStudentFitness(student, request)
        )
      );

      // Sort by overall score
      evaluations.sort((a, b) => b.overallScore - a.overallScore);

      // Use AI for advanced optimization analysis
      const aiRecommendation = await this.getAIOptimizationRecommendation(request, evaluations);

      return aiRecommendation;
    } catch (error) {
      console.error('Error optimizing resource allocation:', error);
      return {
        recommendedUsers: [],
        allocationStrategy: 'エラーが発生しました',
        expectedOutcome: '手動で配分を検討してください',
        alternativeOptions: ['手動配分', '外部リソース検討'],
        teamDynamicsAnalysis: '分析できませんでした',
        successProbability: 0
      };
    }
  }

  /**
   * Evaluate student fitness for a specific allocation request
   */
  private async evaluateStudentFitness(
    studentResource: StudentResource,
    request: ResourceAllocationRequest
  ): Promise<StudentFitnessEvaluation> {
    const user = await this.getUser(studentResource.userId);
    const currentLoad = await this.calculateUserLoad(studentResource.userId);
    const skillMatch = this.calculateSkillMatch(studentResource.technicalSkills, request.requiredSkills);
    const availableHours = this.calculateAvailableHours(studentResource, request.deadline);
    const riskFactors = this.identifyRiskFactors(studentResource, request, currentLoad);
    const strengthFactors = this.identifyStrengthFactors(studentResource, request);

    // Calculate overall score (weighted combination of factors)
    const overallScore = this.calculateOverallScore({
      skillMatch,
      currentLoad,
      availableHours,
      qualityScore: studentResource.qualityScore * 10,
      collaborationScore: studentResource.collaborationScore * 10,
      completionRate: studentResource.taskCompletionRate * 100,
      urgency: request.urgency,
      riskFactors: riskFactors.length,
      strengthFactors: strengthFactors.length
    });

    return {
      student: studentResource,
      user: user || { id: studentResource.userId, name: 'Unknown User' },
      currentLoad,
      skillMatch,
      qualityScore: studentResource.qualityScore * 10,
      collaborationScore: studentResource.collaborationScore * 10,
      completionRate: studentResource.taskCompletionRate * 100,
      availableHours,
      riskFactors,
      strengthFactors,
      overallScore
    };
  }

  /**
   * Calculate skill match score between user skills and required skills
   */
  private calculateSkillMatch(userSkills: string[], requiredSkills: string[]): number {
    if (requiredSkills.length === 0) return 10;
    
    const matches = requiredSkills.filter(skill => 
      userSkills.some(userSkill => 
        userSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(userSkill.toLowerCase())
      )
    );
    
    return (matches.length / requiredSkills.length) * 10;
  }

  /**
   * Calculate available hours until deadline
   */
  private calculateAvailableHours(
    student: StudentResource,
    deadline: Date
  ): number {
    const weeksUntilDeadline = Math.max(
      Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 7)),
      1
    );
    
    const weeklyAvailable = student.weeklyCommitHours * 
      (1 - (student.currentLoadPercentage / 100));
    
    return Math.max(weeklyAvailable * weeksUntilDeadline, 0);
  }

  /**
   * Identify risk factors for assignment
   */
  private identifyRiskFactors(
    student: StudentResource,
    request: ResourceAllocationRequest,
    currentLoad: number
  ): string[] {
    const risks: string[] = [];
    
    if (currentLoad > 80) {
      risks.push('高負荷状態（80%超過）');
    }
    
    if (student.taskCompletionRate < 0.8) {
      risks.push('完了率が低い（80%未満）');
    }
    
    if (student.qualityScore < 0.7) {
      risks.push('品質スコアが低い（0.7未満）');
    }
    
    if (student.collaborationScore < 0.7) {
      risks.push('協調性スコアが低い（0.7未満）');
    }
    
    if (request.urgency === 'HIGH' && currentLoad > 60) {
      risks.push('緊急案件での負荷競合');
    }

    const weeksToDeadline = (request.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 7);
    if (weeksToDeadline < 2 && request.requiredHours > 20) {
      risks.push('短期間での大量作業');
    }
    
    return risks;
  }

  /**
   * Identify strength factors for assignment
   */
  private identifyStrengthFactors(
    student: StudentResource,
    request: ResourceAllocationRequest
  ): string[] {
    const strengths: string[] = [];
    
    if (student.taskCompletionRate >= 0.9) {
      strengths.push('高い完了率');
    }
    
    if (student.qualityScore >= 0.8) {
      strengths.push('高品質な成果物');
    }
    
    if (student.collaborationScore >= 0.8) {
      strengths.push('優秀な協調性');
    }

    const skillMatch = this.calculateSkillMatch(student.technicalSkills, request.requiredSkills);
    if (skillMatch >= 8) {
      strengths.push('高いスキル適合度');
    }

    if (student.currentLoadPercentage < 50) {
      strengths.push('余裕のあるリソース');
    }
    
    return strengths;
  }

  /**
   * Calculate overall fitness score
   */
  private calculateOverallScore(factors: {
    skillMatch: number;
    currentLoad: number;
    availableHours: number;
    qualityScore: number;
    collaborationScore: number;
    completionRate: number;
    urgency: string;
    riskFactors: number;
    strengthFactors: number;
  }): number {
    // Base score from key metrics (0-10 scale)
    let score = 0;
    
    // Skill match (30% weight)
    score += factors.skillMatch * 0.3;
    
    // Load factor (20% weight) - lower load is better
    const loadScore = Math.max(0, 10 - (factors.currentLoad / 10));
    score += loadScore * 0.2;
    
    // Quality metrics (25% weight)
    const qualityAvg = (factors.qualityScore + factors.collaborationScore + factors.completionRate) / 3;
    score += (qualityAvg / 10) * 2.5;
    
    // Availability (15% weight)
    const availabilityScore = Math.min(10, factors.availableHours / 10);
    score += availabilityScore * 0.15;
    
    // Risk/Strength adjustment (10% weight)
    const riskPenalty = factors.riskFactors * 0.5;
    const strengthBonus = factors.strengthFactors * 0.3;
    score += (strengthBonus - riskPenalty) * 0.1;
    
    // Urgency adjustment
    if (factors.urgency === 'HIGH' && factors.currentLoad > 70) {
      score *= 0.8; // Penalty for high load on urgent tasks
    }
    
    return Math.max(0, Math.min(10, score));
  }

  /**
   * Get AI-powered optimization recommendation
   */
  private async getAIOptimizationRecommendation(
    request: ResourceAllocationRequest,
    evaluations: StudentFitnessEvaluation[]
  ): Promise<OptimalAllocation> {
    try {
      const prompt = `
プロジェクトリソース配分最適化分析:

プロジェクト要件:
- プロジェクトID: ${request.projectId}
- 必要工数: ${request.requiredHours}時間
- 必要スキル: ${request.requiredSkills.join(', ')}
- 希望役割: ${request.preferredRole}
- 緊急度: ${request.urgency}
- 締切: ${request.deadline.toISOString().split('T')[0]}
- チームサイズ: ${request.teamSize || '指定なし'}

利用可能学生評価:
${evaluations.slice(0, 8).map((evaluation, index) => `
${index + 1}. ${evaluation.user.name}:
   - 総合スコア: ${evaluation.overallScore.toFixed(2)}/10
   - 現在負荷: ${evaluation.currentLoad.toFixed(1)}%
   - スキル適合度: ${evaluation.skillMatch.toFixed(1)}/10
   - 品質スコア: ${evaluation.qualityScore.toFixed(1)}/10
   - 協調性: ${evaluation.collaborationScore.toFixed(1)}/10
   - 完了率: ${evaluation.completionRate.toFixed(1)}%
   - 利用可能時間: ${evaluation.availableHours.toFixed(1)}h
   - 強み: ${evaluation.strengthFactors.join(', ') || 'なし'}
   - リスク: ${evaluation.riskFactors.join(', ') || 'なし'}
   - 技術スキル: ${evaluation.student.technicalSkills.join(', ')}
`).join('\n')}

以下の基準で最適な配分を提案してください:

1. 負荷バランス (推奨80%以下)
2. スキル適合度 (推奨7/10以上)
3. 品質・協調性 (推奨各7/10以上)
4. 完了実績 (推奨80%以上)
5. チーム構成のバランス
6. 学習機会の提供
7. リスク最小化

回答形式 (JSON):
{
  "recommendedUsers": [
    {
      "userId": "user_id",
      "userName": "ユーザー名",
      "allocationScore": 9.2,
      "expectedHours": 15,
      "reasonForRecommendation": "高いスキル適合度と適切な負荷バランス",
      "riskFactors": ["締切がタイト"],
      "compatibilityScore": 8.5,
      "skillMatchScore": 9.0,
      "availabilityScore": 8.0
    }
  ],
  "allocationStrategy": "メイン担当者1名 + サポート1名の体制を推奨",
  "expectedOutcome": "品質とスケジュールの両立が期待される",
  "alternativeOptions": ["外部リソース活用", "フェーズ分割実装"],
  "teamDynamicsAnalysis": "スキルレベルのバランスが良く、協調的な開発が期待できる",
  "successProbability": 0.85
}
`;

      const aiResult = await this.aiEngine.calculateResourceWeight(
        evaluations[0]?.user || {},
        { title: 'Resource Allocation', description: prompt } as any,
        []
      );
      return this.parseOptimalAllocation(aiResult.reasoning, evaluations);
    } catch (error) {
      console.error('AI optimization error:', error);
      return this.createFallbackAllocation(evaluations);
    }
  }

  /**
   * Parse AI response and validate the allocation
   */
  private parseOptimalAllocation(
    aiResponse: string,
    evaluations: StudentFitnessEvaluation[]
  ): OptimalAllocation {
    try {
      const parsed = JSON.parse(aiResponse);
      
      // Validate and enrich the response
      if (parsed.recommendedUsers && Array.isArray(parsed.recommendedUsers)) {
        parsed.recommendedUsers = parsed.recommendedUsers.map((user: any) => {
          const evaluation = evaluations.find(evaluation => evaluation.user.id === user.userId);
          if (evaluation) {
            return {
              ...user,
              compatibilityScore: user.compatibilityScore || evaluation.overallScore,
              skillMatchScore: user.skillMatchScore || evaluation.skillMatch,
              availabilityScore: user.availabilityScore || Math.min(10, evaluation.availableHours / 10)
            };
          }
          return user;
        });
      }
      
      return {
        recommendedUsers: parsed.recommendedUsers || [],
        allocationStrategy: parsed.allocationStrategy || '分析結果を確認してください',
        expectedOutcome: parsed.expectedOutcome || '期待される成果を確認してください',
        alternativeOptions: parsed.alternativeOptions || [],
        teamDynamicsAnalysis: parsed.teamDynamicsAnalysis || '詳細分析が必要です',
        successProbability: parsed.successProbability || 0.5
      };
    } catch (error) {
      console.error('AI response parsing error:', error);
      return this.createFallbackAllocation(evaluations);
    }
  }

  /**
   * Create fallback allocation when AI fails
   */
  private createFallbackAllocation(evaluations: StudentFitnessEvaluation[]): OptimalAllocation {
    const topCandidates = evaluations.slice(0, 3).map(evaluation => ({
      userId: evaluation.user.id,
      userName: evaluation.user.name,
      allocationScore: evaluation.overallScore,
      expectedHours: Math.min(evaluation.availableHours, 20),
      reasonForRecommendation: `総合スコア ${evaluation.overallScore.toFixed(1)}/10`,
      riskFactors: evaluation.riskFactors,
      compatibilityScore: evaluation.overallScore,
      skillMatchScore: evaluation.skillMatch,
      availabilityScore: Math.min(10, evaluation.availableHours / 10)
    }));

    return {
      recommendedUsers: topCandidates,
      allocationStrategy: 'スコアベースの自動選択',
      expectedOutcome: 'AI分析は利用できませんが、基本評価による推奨',
      alternativeOptions: ['手動選択', 'より詳細な分析'],
      teamDynamicsAnalysis: '詳細なチーム分析は手動で実施してください',
      successProbability: topCandidates.length > 0 ? topCandidates[0].allocationScore / 10 : 0.5
    };
  }

  // Data access methods
  private async getUser(userId: string) {
    return await prisma.users.findFirst({
      where: { id: userId }
    });
  }

  async getStudentResource(userId: string): Promise<StudentResource | null> {
    const result = await prisma.student_resources.findFirst({
      where: { userId: userId }
    });
    
    if (!result) return null;
    
    return {
      id: result.id,
      userId: result.userId,
      weeklyCommitHours: result.weeklyCommitHours,
      currentLoadPercentage: result.currentLoadPercentage,
      semesterAvailability: (result.semesterAvailability as Record<string, number>) || {},
      emergencyAvailableHours: (result.emergencyAvailableHours as Record<string, number>) || {},
      technicalSkills: (result.technicalSkills as string[]) || [],
      softSkills: (result.softSkills as string[]) || [],
      learningPreferences: (result.learningPreferences as Record<string, any>) || {},
      projectExperience: (result.projectExperience as Array<any>) || [],
      taskCompletionRate: result.taskCompletionRate,
      qualityScore: result.qualityScore,
      collaborationScore: result.collaborationScore,
      mbtiAnalysis: (result.mbtiAnalysis as Record<string, any>) || {},
      personalityStrengths: (result.personalityStrengths as string[]) || [],
      optimalRoles: (result.optimalRoles as string[]) || [],
      stressFactors: (result.stressFactors as string[]) || [],
      motivationFactors: (result.motivationFactors as string[]) || [],
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    };
  }

  private async getUserActiveTasks(userId: string) {
    return await prisma.tasks.findMany({
      where: {
        userId: userId,
        status: { in: ['IDEA', 'PLAN', 'DO', 'CHECK'] },
        isArchived: false
      }
    });
  }

  private async getUserActiveProjectAllocations(userId: string) {
    const studentResource = await this.getStudentResource(userId);
    if (!studentResource) return [];
    
    return await prisma.project_resource_allocation.findMany({
      where: {
        studentResourceId: studentResource.id,
        endDate: null
      }
    });
  }

  private async getAvailableStudents(request: ResourceAllocationRequest): Promise<StudentResource[]> {
    const results = await prisma.$queryRaw`
      SELECT sr.*, u.name, u.email 
      FROM student_resources sr
      JOIN users u ON sr.user_id = u.id
      WHERE sr.current_load_percentage < 95
      ORDER BY sr.current_load_percentage ASC, sr.quality_score DESC
      LIMIT 20
    `;
    
    return (results as any[]).map((result: any) => ({
      id: result.id,
      userId: result.user_id,
      weeklyCommitHours: result.weekly_commit_hours,
      currentLoadPercentage: result.current_load_percentage,
      semesterAvailability: result.semester_availability || {},
      emergencyAvailableHours: result.emergency_available_hours || {},
      technicalSkills: result.technical_skills || [],
      softSkills: result.soft_skills || [],
      learningPreferences: result.learning_preferences || {},
      projectExperience: result.project_experience || [],
      taskCompletionRate: result.task_completion_rate,
      qualityScore: result.quality_score,
      collaborationScore: result.collaboration_score,
      mbtiAnalysis: result.mbti_analysis || {},
      personalityStrengths: result.personality_strengths || [],
      optimalRoles: result.optimal_roles || [],
      stressFactors: result.stress_factors || [],
      motivationFactors: result.motivation_factors || [],
      createdAt: result.created_at,
      updatedAt: result.updated_at,
      user: {
        id: result.user_id,
        name: result.name,
        email: result.email
      }
    }));
  }

  private async updateStudentResourceLoad(userId: string, loadPercentage: number) {
    await prisma.student_resources.upsert({
      where: { userId: userId },
      update: { currentLoadPercentage: loadPercentage },
      create: {
        userId: userId,
        currentLoadPercentage: loadPercentage,
        weeklyCommitHours: 20,
        taskCompletionRate: 1.0,
        qualityScore: 1.0,
        collaborationScore: 1.0
      }
    });
  }

  /**
   * Get all student resources for admin view
   */
  async getAllStudentResources(): Promise<StudentResource[]> {
    const results = await prisma.$queryRaw`
      SELECT sr.*, u.name, u.email 
      FROM student_resources sr
      JOIN users u ON sr.user_id = u.id
      ORDER BY sr.current_load_percentage DESC
    `;
    
    return (results as any[]).map((result: any) => ({
      id: result.id,
      userId: result.user_id,
      weeklyCommitHours: result.weekly_commit_hours,
      currentLoadPercentage: result.current_load_percentage,
      semesterAvailability: result.semester_availability || {},
      emergencyAvailableHours: result.emergency_available_hours || {},
      technicalSkills: result.technical_skills || [],
      softSkills: result.soft_skills || [],
      learningPreferences: result.learning_preferences || {},
      projectExperience: result.project_experience || [],
      taskCompletionRate: result.task_completion_rate,
      qualityScore: result.quality_score,
      collaborationScore: result.collaboration_score,
      mbtiAnalysis: result.mbti_analysis || {},
      personalityStrengths: result.personality_strengths || [],
      optimalRoles: result.optimal_roles || [],
      stressFactors: result.stress_factors || [],
      motivationFactors: result.motivation_factors || [],
      createdAt: result.created_at,
      updatedAt: result.updated_at,
      user: {
        id: result.user_id,
        name: result.name,
        email: result.email
      }
    }));
  }

  /**
   * Update student resource data
   */
  async updateStudentResource(userId: string, data: Partial<StudentResource>): Promise<StudentResource | null> {
    const updateData: any = {};
    
    if (data.weeklyCommitHours !== undefined) updateData.weeklyCommitHours = data.weeklyCommitHours;
    if (data.technicalSkills !== undefined) updateData.technicalSkills = data.technicalSkills;
    if (data.softSkills !== undefined) updateData.softSkills = data.softSkills;
    if (data.learningPreferences !== undefined) updateData.learningPreferences = data.learningPreferences;
    if (data.projectExperience !== undefined) updateData.projectExperience = data.projectExperience;
    if (data.taskCompletionRate !== undefined) updateData.taskCompletionRate = data.taskCompletionRate;
    if (data.qualityScore !== undefined) updateData.qualityScore = data.qualityScore;
    if (data.collaborationScore !== undefined) updateData.collaborationScore = data.collaborationScore;

    await prisma.student_resources.update({
      where: { userId: userId },
      data: updateData
    });

    return await this.getStudentResource(userId);
  }
}

// Export singleton instance
export const STUDENT_RESOURCE_MANAGER = new StudentResourceManager();