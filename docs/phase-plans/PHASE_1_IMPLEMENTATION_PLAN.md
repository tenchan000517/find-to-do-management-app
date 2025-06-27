# Phase 1: 認証システム基盤・ユーザー管理強化 実装計画書

**フェーズ期間**: 3日間  
**実装日**: 2025年6月28日 〜 2025年6月30日  
**担当エンジニア**: 認証システム担当  
**前提条件**: 既存システムの認証基盤を理解している

---

## 🎯 **Phase 1 実装目標**

### **1.1 主要機能実装**
- **学生リソース管理機能**: 週次コミット時間ベースの負荷計算
- **MBTI統合チーム最適化**: 既存mbti.jsonを活用した最適チーム編成
- **ユーザープロファイル拡張**: 学生情報・MBTI情報の統合管理

### **1.2 技術要件**
- 既存認証システムとの完全互換性維持
- データベース拡張のみ（破壊的変更なし）
- 既存AIエンジンの活用・拡張

---

## 📋 **Phase 1 実装チェックリスト**

### **1.1 データベース拡張 (0.5日)**
- [ ] usersテーブル拡張実装
- [ ] student_resourcesテーブル作成
- [ ] 既存データ移行スクリプト作成
- [ ] データ整合性確認

### **1.2 学生リソース管理システム (1日)**
- [ ] StudentResourceManager クラス実装
- [ ] 負荷計算ロジック実装
- [ ] 最適アサイン機能実装
- [ ] API エンドポイント作成

### **1.3 MBTI統合システム (1日)**
- [ ] MBTITeamOptimizer クラス実装
- [ ] 既存mbti.json活用ロジック実装
- [ ] チーム編成API実装
- [ ] 相性計算エンジン実装

### **1.4 フロントエンド統合 (0.5日)**
- [ ] ユーザープロファイル画面拡張
- [ ] MBTI情報表示機能
- [ ] リソース管理UI実装
- [ ] 既存画面との統合

---

## 🔧 **詳細実装ガイド**

### **1.1 データベース拡張**

#### **1.1.1 usersテーブル拡張**
```sql
-- Phase 1: usersテーブル拡張
ALTER TABLE users ADD COLUMN weekly_commit_hours INTEGER DEFAULT 20;
ALTER TABLE users ADD COLUMN current_load_percentage FLOAT DEFAULT 0.0;
ALTER TABLE users ADD COLUMN mbti_type VARCHAR(4) DEFAULT NULL;
ALTER TABLE users ADD COLUMN student_resource_data JSONB DEFAULT '{}';

-- インデックス作成
CREATE INDEX idx_users_weekly_commit_hours ON users(weekly_commit_hours);
CREATE INDEX idx_users_mbti_type ON users(mbti_type);
CREATE INDEX idx_users_current_load ON users(current_load_percentage);
```

#### **1.1.2 student_resourcesテーブル作成**
```sql
-- 学生リソース詳細管理テーブル
CREATE TABLE student_resources (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  
  -- 時間管理
  weekly_commit_hours INTEGER DEFAULT 20,
  current_load_percentage FLOAT DEFAULT 0.0,
  semester_availability JSONB DEFAULT '{}',
  emergency_available_hours JSONB DEFAULT '{}',
  
  -- スキル・適性
  technical_skills JSONB DEFAULT '[]',
  soft_skills JSONB DEFAULT '[]',
  learning_preferences JSONB DEFAULT '{}',
  project_experience JSONB DEFAULT '[]',
  
  -- パフォーマンス
  task_completion_rate FLOAT DEFAULT 1.0,
  quality_score FLOAT DEFAULT 1.0,
  collaboration_score FLOAT DEFAULT 1.0,
  
  -- メタデータ
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- インデックス作成
CREATE INDEX idx_student_resources_user_id ON student_resources(user_id);
CREATE INDEX idx_student_resources_load ON student_resources(current_load_percentage);
CREATE INDEX idx_student_resources_skills ON student_resources USING GIN (technical_skills);
```

#### **1.1.3 プロジェクトリソース配分テーブル**
```sql
-- プロジェクトリソース配分テーブル
CREATE TABLE project_resource_allocation (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR(255) NOT NULL,
  student_resource_id VARCHAR(255) NOT NULL,
  
  -- 配分情報
  allocated_hours INTEGER NOT NULL,
  role_in_project VARCHAR(100) NOT NULL,
  responsibility_level VARCHAR(50) DEFAULT 'MEMBER',
  
  -- 評価
  effectiveness_score FLOAT DEFAULT 1.0,
  contribution_score FLOAT DEFAULT 1.0,
  satisfaction_score FLOAT DEFAULT 1.0,
  
  -- 期間
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP DEFAULT NULL,
  
  -- メタデータ
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (student_resource_id) REFERENCES student_resources(id) ON DELETE CASCADE
);

-- インデックス作成
CREATE INDEX idx_project_allocation_project ON project_resource_allocation(project_id);
CREATE INDEX idx_project_allocation_student ON project_resource_allocation(student_resource_id);
CREATE INDEX idx_project_allocation_active ON project_resource_allocation(end_date) WHERE end_date IS NULL;
```

### **1.2 学生リソース管理システム実装**

#### **1.2.1 StudentResourceManager クラス**
```typescript
// src/services/StudentResourceManager.ts
import { AI_SERVICE } from './ai-service';
import { TASK_SERVICE } from './task-service';
import { PROJECT_SERVICE } from './project-service';

export interface StudentResource {
  id: string;
  userId: string;
  weeklyCommitHours: number;
  currentLoadPercentage: number;
  semesterAvailability: Record<string, number>;
  technicalSkills: string[];
  softSkills: string[];
  taskCompletionRate: number;
  qualityScore: number;
  collaborationScore: number;
}

export interface ResourceAllocationRequest {
  projectId: string;
  requiredHours: number;
  requiredSkills: string[];
  preferredRole: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  deadline: Date;
}

export interface OptimalAllocation {
  recommendedUsers: Array<{
    userId: string;
    userName: string;
    allocationScore: number;
    expectedHours: number;
    reasonForRecommendation: string;
    riskFactors: string[];
  }>;
  allocationStrategy: string;
  expectedOutcome: string;
  alternativeOptions: string[];
}

export class StudentResourceManager {
  constructor(
    private aiService: typeof AI_SERVICE,
    private taskService: typeof TASK_SERVICE,
    private projectService: typeof PROJECT_SERVICE
  ) {}

  /**
   * ユーザーの現在の負荷率を計算
   */
  async calculateUserLoad(userId: string): Promise<number> {
    const user = await this.getUser(userId);
    const studentResource = await this.getStudentResource(userId);
    const activeTasks = await this.getUserActiveTasks(userId);
    const activeProjects = await this.getUserActiveProjects(userId);

    // 既存データ活用: estimatedHours × difficultyScore
    const taskWeightedHours = activeTasks.reduce((sum, task) => {
      const difficultyMultiplier = (task.difficultyScore || 5) / 5;
      const resourceWeight = task.resourceWeight || 1.0;
      return sum + (task.estimatedHours * difficultyMultiplier * resourceWeight);
    }, 0);

    // プロジェクト配分時間
    const projectAllocatedHours = activeProjects.reduce((sum, allocation) => 
      sum + allocation.allocatedHours, 0
    );

    const totalWeightedHours = taskWeightedHours + projectAllocatedHours;
    const weeklyCapacity = studentResource?.weeklyCommitHours || user.weeklyCommitHours || 20;

    return Math.min((totalWeightedHours / weeklyCapacity) * 100, 100);
  }

  /**
   * 最適なリソース配分を計算
   */
  async optimizeResourceAllocation(
    request: ResourceAllocationRequest
  ): Promise<OptimalAllocation> {
    const availableStudents = await this.getAvailableStudents(request);
    const skillMatrix = await this.buildSkillMatrix(availableStudents);
    
    // 各学生の適合度を評価
    const evaluations = await Promise.all(
      availableStudents.map(student => 
        this.evaluateStudentFitness(student, request)
      )
    );

    // AI による最適化判断
    const aiRecommendation = await this.aiService.evaluateWithGemini(`
    プロジェクトリソース配分最適化:
    
    プロジェクト要件:
    - プロジェクトID: ${request.projectId}
    - 必要工数: ${request.requiredHours}時間
    - 必要スキル: ${request.requiredSkills.join(', ')}
    - 希望役割: ${request.preferredRole}
    - 緊急度: ${request.urgency}
    - 締切: ${request.deadline.toISOString()}
    
    利用可能学生評価:
    ${evaluations.map(eval => `
    - ${eval.student.name}:
      - 現在負荷: ${eval.currentLoad}%
      - スキル適合度: ${eval.skillMatch}/10
      - 品質スコア: ${eval.qualityScore}/10
      - 協調性スコア: ${eval.collaborationScore}/10
      - 完了率: ${eval.completionRate}%
    `).join('\n')}
    
    以下の基準で最適な配分を提案:
    1. 負荷バランス (80%以下推奨)
    2. スキル適合度 (7/10以上推奨)
    3. 品質・協調性 (各7/10以上推奨)
    4. 過去の成果 (完了率80%以上推奨)
    5. 学習機会提供
    6. チーム構成のバランス
    
    回答形式:
    {
      "recommendedUsers": [
        {
          "userId": "user_id",
          "userName": "ユーザー名",
          "allocationScore": 9.2,
          "expectedHours": 10,
          "reasonForRecommendation": "高いスキル適合度と適切な負荷バランス",
          "riskFactors": ["締切がタイト", "他プロジェクトとの重複"]
        }
      ],
      "allocationStrategy": "メイン担当者1名 + サポート1名の体制",
      "expectedOutcome": "品質とスケジュールの両立が期待される",
      "alternativeOptions": ["外部リソース活用", "フェーズ分割実装"]
    }
    `);

    return this.parseOptimalAllocation(aiRecommendation);
  }

  /**
   * 学生の適合度評価
   */
  private async evaluateStudentFitness(
    student: StudentResource,
    request: ResourceAllocationRequest
  ): Promise<StudentFitnessEvaluation> {
    const currentLoad = await this.calculateUserLoad(student.userId);
    const skillMatch = this.calculateSkillMatch(student.technicalSkills, request.requiredSkills);
    
    return {
      student,
      currentLoad,
      skillMatch,
      qualityScore: student.qualityScore * 10,
      collaborationScore: student.collaborationScore * 10,
      completionRate: student.taskCompletionRate * 100,
      availableHours: this.calculateAvailableHours(student, request.deadline),
      riskFactors: this.identifyRiskFactors(student, request)
    };
  }

  /**
   * スキル適合度計算
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
   * 利用可能時間計算
   */
  private calculateAvailableHours(
    student: StudentResource,
    deadline: Date
  ): number {
    const weeksUntilDeadline = Math.ceil(
      (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 7)
    );
    
    const weeklyAvailable = student.weeklyCommitHours * 
      (1 - (student.currentLoadPercentage / 100));
    
    return Math.max(weeklyAvailable * weeksUntilDeadline, 0);
  }

  /**
   * リスク要因特定
   */
  private identifyRiskFactors(
    student: StudentResource,
    request: ResourceAllocationRequest
  ): string[] {
    const risks: string[] = [];
    
    if (student.currentLoadPercentage > 80) {
      risks.push('高負荷状態');
    }
    
    if (student.taskCompletionRate < 0.8) {
      risks.push('完了率が低い');
    }
    
    if (student.qualityScore < 0.7) {
      risks.push('品質スコアが低い');
    }
    
    if (request.urgency === 'HIGH' && student.currentLoadPercentage > 60) {
      risks.push('緊急案件との負荷競合');
    }
    
    return risks;
  }

  // ヘルパーメソッド
  private async getUser(userId: string) {
    // 既存のuser service を活用
    return await this.userService.getUser(userId);
  }

  private async getStudentResource(userId: string): Promise<StudentResource | null> {
    const query = `
      SELECT * FROM student_resources 
      WHERE user_id = $1
    `;
    const result = await this.db.query(query, [userId]);
    return result.rows[0] || null;
  }

  private async getUserActiveTasks(userId: string) {
    return await this.taskService.getActiveTasks(userId);
  }

  private async getUserActiveProjects(userId: string) {
    const query = `
      SELECT * FROM project_resource_allocation 
      WHERE student_resource_id = (
        SELECT id FROM student_resources WHERE user_id = $1
      ) AND end_date IS NULL
    `;
    const result = await this.db.query(query, [userId]);
    return result.rows;
  }

  private async getAvailableStudents(request: ResourceAllocationRequest) {
    const query = `
      SELECT sr.*, u.name, u.email 
      FROM student_resources sr
      JOIN users u ON sr.user_id = u.id
      WHERE sr.current_load_percentage < 90
      ORDER BY sr.current_load_percentage ASC
    `;
    const result = await this.db.query(query);
    return result.rows;
  }

  private parseOptimalAllocation(aiResponse: string): OptimalAllocation {
    try {
      return JSON.parse(aiResponse);
    } catch (error) {
      console.error('AI response parsing error:', error);
      return {
        recommendedUsers: [],
        allocationStrategy: 'AI応答の解析に失敗しました',
        expectedOutcome: '手動で配分を検討してください',
        alternativeOptions: ['手動配分', '外部リソース検討']
      };
    }
  }
}

// 型定義
interface StudentFitnessEvaluation {
  student: StudentResource;
  currentLoad: number;
  skillMatch: number;
  qualityScore: number;
  collaborationScore: number;
  completionRate: number;
  availableHours: number;
  riskFactors: string[];
}
```

### **1.3 MBTI統合システム実装**

#### **1.3.1 MBTITeamOptimizer クラス**
```typescript
// src/services/MBTITeamOptimizer.ts
import { AI_SERVICE } from './ai-service';
import mbtiData from '../../public/data/mbti.json';

export interface MBTIProfile {
  type: string;
  personalityTraits: {
    independence: number;
    strategic_thinking: number;
    leadership_tendency: number;
    detail_orientation: number;
    innovation_preference: number;
  };
  taskPreferences: {
    complex_problem_solving: number;
    routine_tasks: number;
    creative_tasks: number;
    analytical_tasks: number;
    leadership_tasks: number;
  };
  teamCompatibility: Record<string, number>;
  optimalRoles: string[];
  stressFactors: string[];
  motivationFactors: string[];
}

export interface TeamOptimizationRequest {
  projectId: string;
  projectType: string;
  requiredRoles: string[];
  teamSize: number;
  projectDuration: number;
  complexityLevel: number;
  availableMembers: string[];
}

export interface OptimalTeam {
  members: Array<{
    userId: string;
    userName: string;
    mbtiType: string;
    assignedRole: string;
    compatibilityScore: number;
    contributionExpected: string;
    developmentOpportunity: string;
  }>;
  teamCompatibilityScore: number;
  predictedDynamics: string;
  potentialChallenges: string[];
  managementTips: string[];
  alternativeCompositions: string[];
}

export class MBTITeamOptimizer {
  private mbtiProfiles: Record<string, MBTIProfile>;

  constructor(private aiService: typeof AI_SERVICE) {
    this.mbtiProfiles = mbtiData.mbti_types;
  }

  /**
   * 最適チーム編成を生成
   */
  async optimizeTeamComposition(
    request: TeamOptimizationRequest
  ): Promise<OptimalTeam> {
    const availableMembers = await this.getAvailableMembersWithMBTI(request.availableMembers);
    const roleRequirements = await this.analyzeRoleRequirements(request.requiredRoles, request.projectType);
    
    // AI による最適化判断
    const teamOptimization = await this.aiService.evaluateWithGemini(`
    MBTI チーム編成最適化:
    
    プロジェクト情報:
    - タイプ: ${request.projectType}
    - 必要役割: ${request.requiredRoles.join(', ')}
    - チームサイズ: ${request.teamSize}名
    - プロジェクト期間: ${request.projectDuration}週間
    - 複雑度: ${request.complexityLevel}/10
    
    利用可能メンバー:
    ${availableMembers.map(member => `
    - ${member.name} (${member.mbtiType}):
      ${this.formatMBTIProfile(member.mbtiType)}
    `).join('\n')}
    
    役割要件分析:
    ${roleRequirements.map(req => `
    - ${req.role}: ${req.requirements.join(', ')}
    `).join('\n')}
    
    以下の基準で最適なチーム編成を提案:
    
    1. 役割適性マッチング
       - 各MBTIタイプの強みを活かした役割配分
       - タスク適性スコアを考慮
    
    2. チーム内バランス
       - 性格の多様性確保
       - 相互補完的な組み合わせ
       - リーダーシップ・サポート役のバランス
    
    3. 相性・協調性
       - MBTI相性マトリックス活用
       - コミュニケーションスタイルの適合
       - 価値観・動機の整合性
    
    4. 成長・開発機会
       - 各メンバーの学習機会提供
       - 苦手分野への挑戦サポート
       - キャリア発展への貢献
    
    5. プロジェクト成功要因
       - 複雑度に対する適応力
       - 期間内完了への適性
       - 品質確保への貢献
    
    回答形式:
    {
      "members": [
        {
          "userId": "user_id",
          "userName": "ユーザー名",
          "mbtiType": "INTJ",
          "assignedRole": "テクニカルリード",
          "compatibilityScore": 8.5,
          "contributionExpected": "戦略的技術判断と品質管理",
          "developmentOpportunity": "チームコミュニケーション向上"
        }
      ],
      "teamCompatibilityScore": 8.2,
      "predictedDynamics": "分析志向と実行力のバランス取れたチーム",
      "potentialChallenges": ["初期段階のコミュニケーション調整"],
      "managementTips": ["定期的な1on1で個別フォロー実施"],
      "alternativeCompositions": ["よりクリエイティブ重視の構成も検討可能"]
    }
    `);

    return this.parseTeamOptimization(teamOptimization);
  }

  /**
   * MBTI相性分析
   */
  async analyzeTeamCompatibility(mbtiTypes: string[]): Promise<{
    overallScore: number;
    pairwiseScores: Record<string, number>;
    strengths: string[];
    challenges: string[];
    recommendations: string[];
  }> {
    const pairwiseScores: Record<string, number> = {};
    let totalScore = 0;
    let pairCount = 0;

    // 全ペア組み合わせの相性を計算
    for (let i = 0; i < mbtiTypes.length; i++) {
      for (let j = i + 1; j < mbtiTypes.length; j++) {
        const type1 = mbtiTypes[i];
        const type2 = mbtiTypes[j];
        const compatibility = this.mbtiProfiles[type1]?.teamCompatibility[type2] || 5;
        
        pairwiseScores[`${type1}-${type2}`] = compatibility;
        totalScore += compatibility;
        pairCount++;
      }
    }

    const overallScore = pairCount > 0 ? totalScore / pairCount : 5;

    // AI による詳細分析
    const analysis = await this.aiService.evaluateWithGemini(`
    MBTI チーム相性分析:
    
    チーム構成: ${mbtiTypes.join(', ')}
    
    ペア相性スコア:
    ${Object.entries(pairwiseScores).map(([pair, score]) => 
      `${pair}: ${score}/10`
    ).join('\n')}
    
    全体相性スコア: ${overallScore.toFixed(1)}/10
    
    以下の観点で分析:
    1. チームの強み（相性の良い組み合わせから生まれる効果）
    2. 潜在的課題（相性の悪い組み合わせへの対策）
    3. マネジメント推奨事項
    
    回答形式:
    {
      "strengths": ["強み1", "強み2"],
      "challenges": ["課題1", "課題2"],
      "recommendations": ["推奨事項1", "推奨事項2"]
    }
    `);

    const parsedAnalysis = this.parseCompatibilityAnalysis(analysis);

    return {
      overallScore,
      pairwiseScores,
      ...parsedAnalysis
    };
  }

  /**
   * 個人MBTI分析
   */
  async analyzeIndividualMBTI(userId: string): Promise<{
    mbtiType: string;
    profile: MBTIProfile;
    strengths: string[];
    developmentAreas: string[];
    optimalRoles: string[];
    teamContributions: string[];
    managementTips: string[];
  }> {
    const user = await this.getUser(userId);
    const mbtiType = user.mbtiType;
    
    if (!mbtiType || !this.mbtiProfiles[mbtiType]) {
      throw new Error(`MBTI type not found for user ${userId}`);
    }

    const profile = this.mbtiProfiles[mbtiType];
    
    const analysis = await this.aiService.evaluateWithGemini(`
    個人MBTI分析: ${mbtiType}
    
    基本プロファイル:
    ${this.formatMBTIProfile(mbtiType)}
    
    以下の観点で分析:
    1. 主要な強み（最も活かせる能力・特性）
    2. 成長機会（伸ばすべき分野）
    3. 最適な役割・ポジション
    4. チームへの貢献方法
    5. 効果的なマネジメント方法
    
    回答形式:
    {
      "strengths": ["強み1", "強み2"],
      "developmentAreas": ["成長分野1", "成長分野2"],
      "optimalRoles": ["最適役割1", "最適役割2"],
      "teamContributions": ["チーム貢献1", "チーム貢献2"],
      "managementTips": ["マネジメントtip1", "tip2"]
    }
    `);

    const parsedAnalysis = this.parseIndividualAnalysis(analysis);

    return {
      mbtiType,
      profile,
      ...parsedAnalysis
    };
  }

  // ヘルパーメソッド
  private async getAvailableMembersWithMBTI(userIds: string[]) {
    const query = `
      SELECT id, name, email, mbti_type 
      FROM users 
      WHERE id = ANY($1) AND mbti_type IS NOT NULL
    `;
    const result = await this.db.query(query, [userIds]);
    return result.rows;
  }

  private async analyzeRoleRequirements(roles: string[], projectType: string) {
    return roles.map(role => ({
      role,
      requirements: this.extractRoleRequirements(role, projectType)
    }));
  }

  private extractRoleRequirements(role: string, projectType: string): string[] {
    const roleRequirements: Record<string, string[]> = {
      'プロジェクトマネージャー': ['leadership_tasks', 'strategic_thinking', 'communication'],
      'テクニカルリード': ['complex_problem_solving', 'analytical_tasks', 'technical_expertise'],
      'デザイナー': ['creative_tasks', 'innovation_preference', 'user_empathy'],
      'エンジニア': ['analytical_tasks', 'detail_orientation', 'technical_skills'],
      'QA': ['detail_orientation', 'analytical_tasks', 'quality_focus'],
      'マーケター': ['creative_tasks', 'communication', 'strategic_thinking']
    };

    return roleRequirements[role] || ['general_skills'];
  }

  private formatMBTIProfile(mbtiType: string): string {
    const profile = this.mbtiProfiles[mbtiType];
    if (!profile) return 'プロファイル不明';

    return `
      独立性: ${profile.personalityTraits.independence}/10
      戦略思考: ${profile.personalityTraits.strategic_thinking}/10
      リーダーシップ: ${profile.personalityTraits.leadership_tendency}/10
      詳細志向: ${profile.personalityTraits.detail_orientation}/10
      革新性: ${profile.personalityTraits.innovation_preference}/10
      
      タスク適性:
      - 複雑問題解決: ${profile.taskPreferences.complex_problem_solving}/10
      - 創造的作業: ${profile.taskPreferences.creative_tasks}/10
      - 分析作業: ${profile.taskPreferences.analytical_tasks}/10
      - リーダーシップ: ${profile.taskPreferences.leadership_tasks}/10
      
      最適役割: ${profile.optimalRoles.join(', ')}
      動機要因: ${profile.motivationFactors.join(', ')}
    `;
  }

  private parseTeamOptimization(aiResponse: string): OptimalTeam {
    try {
      return JSON.parse(aiResponse);
    } catch (error) {
      console.error('Team optimization parsing error:', error);
      return {
        members: [],
        teamCompatibilityScore: 5,
        predictedDynamics: 'AI応答の解析に失敗しました',
        potentialChallenges: ['手動でチーム編成を検討してください'],
        managementTips: ['個別の MBTI 分析を参考にしてください'],
        alternativeCompositions: ['異なる組み合わせを検討してください']
      };
    }
  }

  private parseCompatibilityAnalysis(aiResponse: string) {
    try {
      return JSON.parse(aiResponse);
    } catch (error) {
      return {
        strengths: ['AI応答の解析に失敗'],
        challenges: ['手動で相性を評価してください'],
        recommendations: ['個別分析を参考にしてください']
      };
    }
  }

  private parseIndividualAnalysis(aiResponse: string) {
    try {
      return JSON.parse(aiResponse);
    } catch (error) {
      return {
        strengths: ['AI応答の解析に失敗'],
        developmentAreas: ['手動で分析してください'],
        optimalRoles: ['MBTI資料を参考にしてください'],
        teamContributions: ['個別相談を実施してください'],
        managementTips: ['従来の方法を継続してください']
      };
    }
  }
}
```

### **1.4 API エンドポイント実装**

#### **1.4.1 学生リソース管理API**
```typescript
// src/pages/api/student-resources/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { StudentResourceManager } from '../../../services/StudentResourceManager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const resourceManager = new StudentResourceManager();

  switch (req.method) {
    case 'GET':
      return handleGetStudentResources(req, res, resourceManager);
    case 'POST':
      return handleCreateStudentResource(req, res, resourceManager);
    case 'PUT':
      return handleUpdateStudentResource(req, res, resourceManager);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetStudentResources(
  req: NextApiRequest,
  res: NextApiResponse,
  resourceManager: StudentResourceManager
) {
  try {
    const { userId } = req.query;
    
    if (userId) {
      const load = await resourceManager.calculateUserLoad(userId as string);
      const resource = await resourceManager.getStudentResource(userId as string);
      
      return res.status(200).json({
        studentResource: resource,
        currentLoad: load
      });
    } else {
      const allResources = await resourceManager.getAllStudentResources();
      return res.status(200).json({ studentResources: allResources });
    }
  } catch (error) {
    console.error('Error fetching student resources:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// src/pages/api/student-resources/optimize.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const resourceManager = new StudentResourceManager();
    const optimizationRequest = req.body;
    
    const result = await resourceManager.optimizeResourceAllocation(optimizationRequest);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error optimizing resource allocation:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

#### **1.4.2 MBTI チーム最適化API**
```typescript
// src/pages/api/mbti/team-optimization.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { MBTITeamOptimizer } from '../../../services/MBTITeamOptimizer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const optimizer = new MBTITeamOptimizer();
    const optimizationRequest = req.body;
    
    const result = await optimizer.optimizeTeamComposition(optimizationRequest);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error optimizing team composition:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// src/pages/api/mbti/compatibility.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const optimizer = new MBTITeamOptimizer();
    const { mbtiTypes } = req.body;
    
    const compatibility = await optimizer.analyzeTeamCompatibility(mbtiTypes);
    
    return res.status(200).json(compatibility);
  } catch (error) {
    console.error('Error analyzing team compatibility:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// src/pages/api/mbti/individual/[userId].ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const optimizer = new MBTITeamOptimizer();
    const { userId } = req.query;
    
    const analysis = await optimizer.analyzeIndividualMBTI(userId as string);
    
    return res.status(200).json(analysis);
  } catch (error) {
    console.error('Error analyzing individual MBTI:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## 🧪 **Phase 1 テスト計画**

### **1.1 単体テスト**
```typescript
// __tests__/StudentResourceManager.test.ts
import { StudentResourceManager } from '../src/services/StudentResourceManager';

describe('StudentResourceManager', () => {
  let resourceManager: StudentResourceManager;

  beforeEach(() => {
    resourceManager = new StudentResourceManager();
  });

  test('calculateUserLoad should return correct load percentage', async () => {
    const userId = 'test-user-1';
    const load = await resourceManager.calculateUserLoad(userId);
    
    expect(load).toBeGreaterThanOrEqual(0);
    expect(load).toBeLessThanOrEqual(100);
  });

  test('optimizeResourceAllocation should return valid recommendations', async () => {
    const request = {
      projectId: 'test-project',
      requiredHours: 20,
      requiredSkills: ['React', 'TypeScript'],
      preferredRole: 'Frontend Developer',
      urgency: 'MEDIUM',
      deadline: new Date('2025-07-15')
    };

    const result = await resourceManager.optimizeResourceAllocation(request);
    
    expect(result.recommendedUsers).toBeInstanceOf(Array);
    expect(result.allocationStrategy).toBeTruthy();
  });
});

// __tests__/MBTITeamOptimizer.test.ts
import { MBTITeamOptimizer } from '../src/services/MBTITeamOptimizer';

describe('MBTITeamOptimizer', () => {
  let optimizer: MBTITeamOptimizer;

  beforeEach(() => {
    optimizer = new MBTITeamOptimizer();
  });

  test('optimizeTeamComposition should return valid team', async () => {
    const request = {
      projectId: 'test-project',
      projectType: 'Web Development',
      requiredRoles: ['Project Manager', 'Developer'],
      teamSize: 3,
      projectDuration: 8,
      complexityLevel: 7,
      availableMembers: ['user1', 'user2', 'user3', 'user4']
    };

    const result = await optimizer.optimizeTeamComposition(request);
    
    expect(result.members).toBeInstanceOf(Array);
    expect(result.teamCompatibilityScore).toBeGreaterThan(0);
  });

  test('analyzeTeamCompatibility should calculate correct scores', async () => {
    const mbtiTypes = ['INTJ', 'ENFP', 'ISTJ'];
    
    const compatibility = await optimizer.analyzeTeamCompatibility(mbtiTypes);
    
    expect(compatibility.overallScore).toBeGreaterThan(0);
    expect(compatibility.pairwiseScores).toBeTruthy();
  });
});
```

### **1.2 統合テスト**
```typescript
// __tests__/integration/Phase1Integration.test.ts
import { StudentResourceManager } from '../../src/services/StudentResourceManager';
import { MBTITeamOptimizer } from '../../src/services/MBTITeamOptimizer';

describe('Phase 1 Integration Tests', () => {
  test('Resource allocation and MBTI optimization should work together', async () => {
    const resourceManager = new StudentResourceManager();
    const mbtiOptimizer = new MBTITeamOptimizer();

    // 1. リソース最適化
    const resourceRequest = {
      projectId: 'integration-test',
      requiredHours: 40,
      requiredSkills: ['JavaScript', 'React'],
      preferredRole: 'Full Stack Developer',
      urgency: 'MEDIUM',
      deadline: new Date('2025-08-01')
    };

    const resourceResult = await resourceManager.optimizeResourceAllocation(resourceRequest);
    
    // 2. MBTI チーム最適化
    const teamRequest = {
      projectId: 'integration-test',
      projectType: 'Web Application',
      requiredRoles: ['Developer', 'Designer'],
      teamSize: 2,
      projectDuration: 6,
      complexityLevel: 6,
      availableMembers: resourceResult.recommendedUsers.map(u => u.userId)
    };

    const teamResult = await mbtiOptimizer.optimizeTeamComposition(teamRequest);
    
    expect(teamResult.members.length).toBeGreaterThan(0);
    expect(teamResult.teamCompatibilityScore).toBeGreaterThan(5);
  });
});
```

---

## 📊 **Phase 1 成功指標**

### **1.1 定量指標**
- [ ] **データベース拡張**: エラーなしで完了
- [ ] **API レスポンス時間**: < 500ms
- [ ] **テストカバレッジ**: 80%以上
- [ ] **TypeScript エラー**: 0件
- [ ] **ESLint エラー**: 0件

### **1.2 機能指標**
- [ ] **負荷計算精度**: 既存タスクデータとの整合性 95%
- [ ] **MBTI チーム最適化**: 相性スコア 7.0以上
- [ ] **リソース推奨精度**: 適切な推奨 80%以上

### **1.3 運用指標**
- [ ] **既存機能**: 100%動作維持
- [ ] **データ整合性**: 破綻なし
- [ ] **パフォーマンス**: 既存レベル維持

---

## ⚠️ **Phase 1 注意事項・制約**

### **1.1 技術制約**
- 既存認証システムとの互換性必須
- データベース破壊的変更禁止
- 既存APIとの後方互換性維持

### **1.2 データ制約**
- 既存ユーザーデータの完全保持
- MBTIタイプの段階的設定（強制なし）
- 学生リソースデータの任意入力

### **1.3 運用制約**
- 段階的展開（強制移行なし）
- 既存ワークフロー維持
- ユーザー混乱の最小化

---

## 🚀 **Phase 1 完了基準**

### **1.1 機能完了基準**
1. **データベース拡張完了**
   - [ ] テーブル作成成功
   - [ ] インデックス設定完了
   - [ ] 既存データ整合性確保

2. **StudentResourceManager 実装完了**
   - [ ] 負荷計算機能動作
   - [ ] 最適化推奨機能動作
   - [ ] API エンドポイント動作

3. **MBTITeamOptimizer 実装完了**
   - [ ] チーム最適化機能動作
   - [ ] 相性分析機能動作
   - [ ] 個人分析機能動作

### **1.2 品質完了基準**
- [ ] 全テスト通過
- [ ] コードレビュー完了
- [ ] ドキュメント整備完了
- [ ] セキュリティチェック完了

### **1.3 運用完了基準**
- [ ] 本番環境デプロイ成功
- [ ] 監視・ログ設定完了
- [ ] ロールバック手順確認完了

---

**次のアクション**: Phase 1 実装開始準備完了。担当エンジニアはこの計画書に従って実装を開始してください。