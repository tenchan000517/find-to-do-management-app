import { User, Task, UserSkills } from '@/lib/types';
import { getAICallManager } from './call-manager';

export class AIEvaluationEngine {
  private aiCallManager = getAICallManager();
  
  constructor(private geminiApiKey?: string) {}

  /**
   * ユーザー特性とタスクからリソースウェイトを計算
   * 計算式: (基本工数 × 難易度係数 × スキル逆数 × 相性係数)
   */
  async calculateResourceWeight(
    user: User,
    task: Task,
    relatedTasks: Task[] = []
  ): Promise<{ weight: number; confidence: number; reasoning: string }> {
    try {
      const skills = user.skills || this.getDefaultSkills();
      const workStyle = user.workStyle || {};
      
      // 1. タスクカテゴリ推定
      const taskCategory = this.inferTaskCategory(task);
      const skillLevel = skills[taskCategory] || 5;
      
      // 2. スキル適性計算（スキルが高いほど低い係数）
      const skillMultiplier = Math.max(0.1, (11 - skillLevel) / 5);
      
      // 3. 相性計算（他タスクとの組み合わせ）
      const compatibilityScore = this.calculateTaskCompatibility(task, relatedTasks, user);
      
      // 4. 基本工数推定
      const baseHours = task.estimatedHours || this.estimateBaseHours(task);
      const difficultyMultiplier = (task.difficultyScore || 3) / 5;
      
      // 5. 最終計算
      const weight = baseHours * difficultyMultiplier * skillMultiplier * compatibilityScore;
      
      const reasoning = this.buildReasoningText({
        taskCategory,
        skillLevel,
        baseHours,
        difficultyMultiplier,
        skillMultiplier,
        compatibilityScore,
        weight
      });
      
      return {
        weight: Math.round(weight * 100) / 100,
        confidence: this.calculateConfidence(user, task),
        reasoning
      };
    } catch (error) {
      console.error('Resource weight calculation error:', error);
      return {
        weight: task.estimatedHours || 5,
        confidence: 0.3,
        reasoning: 'エラーによりデフォルト値を使用'
      };
    }
  }

  /**
   * プロジェクトの成功確率を算出
   * 要素: 進捗変化率、フェーズ遷移速度、コネクション増加数、アクティビティ
   */
  async calculateSuccessProbability(
    project: any,
    tasks: Task[],
    connections: any[] = [],
    recentActivity: any[] = []
  ): Promise<{ probability: number; confidence: number; factors: any }> {
    try {
      // 1. 進捗変化率計算
      const progressChangeRate = this.calculateProgressChangeRate(project, tasks);
      
      // 2. フェーズ遷移速度
      const phaseTransitionSpeed = this.calculatePhaseTransitionSpeed(project);
      
      // 3. コネクション成長
      const connectionGrowth = this.calculateConnectionGrowth(project, connections);
      
      // 4. アクティビティスコア
      const activityScore = this.calculateActivityScore(project, recentActivity);
      
      // 5. 重み付き合成確率
      const probability = Math.min(1.0, Math.max(0.0,
        progressChangeRate * 0.3 +
        phaseTransitionSpeed * 0.25 +
        connectionGrowth * 0.2 +
        activityScore * 0.25
      ));
      
      const factors = {
        progressChangeRate,
        phaseTransitionSpeed,
        connectionGrowth,
        activityScore,
        weights: { progress: 0.3, phase: 0.25, connection: 0.2, activity: 0.25 }
      };
      
      return {
        probability: Math.round(probability * 100) / 100,
        confidence: 0.85,
        factors
      };
    } catch (error) {
      console.error('Success probability calculation error:', error);
      return {
        probability: 0.5,
        confidence: 0.3,
        factors: { error: 'Calculation failed' }
      };
    }
  }

  /**
   * タスクのISSUE度を自動判定（AI強化版）
   */
  async evaluateIssueLevel(
    task: Task,
    project?: any,
    userWorkload?: number
  ): Promise<{ level: 'A' | 'B' | 'C' | 'D'; confidence: number; reasoning: string }> {
    try {
      // 従来のロジック計算
      let score = 5; // 基準点（C判定）
      const factors = [];

      // 1. プロジェクト関連性
      if (project) {
        if (project.priority === 'A' || (project.successProbability && project.successProbability > 0.8)) {
          score += 2;
          factors.push('高優先度プロジェクト');
        }
        if (project.phase === 'closing' || project.phase === 'negotiation') {
          score += 1;
          factors.push('重要フェーズ');
        }
      }

      // 2. 期限切迫度
      if (task.dueDate) {
        const daysToDeadline = this.getDaysToDeadline(task.dueDate);
        if (daysToDeadline <= 3) {
          score += 3;
          factors.push('期限切迫');
        } else if (daysToDeadline <= 7) {
          score += 1;
          factors.push('期限近接');
        }
      }

      // 3. リソースウェイト
      if (task.resourceWeight && task.resourceWeight > 10) {
        score += 2;
        factors.push('高負荷タスク');
      }

      // 4. ユーザー負荷状況
      if (userWorkload && userWorkload > 40) { // 週40時間超
        score -= 1;
        factors.push('ユーザー高負荷状態');
      }

      // 5. タスク優先度
      if (task.priority === 'A') {
        score += 2;
        factors.push('最優先タスク');
      }

      // AI による追加分析（複雑なケースのみ）
      if (factors.length >= 3 || (task.description && task.description.length > 100)) {
        try {
          const aiAnalysis = await this.getAIIssueAnalysis(task, project, factors);
          if (aiAnalysis.success && aiAnalysis.content) {
            const aiData = JSON.parse(aiAnalysis.content);
            if (aiData.adjustmentScore !== undefined) {
              score += aiData.adjustmentScore;
              factors.push(`AI分析: ${aiData.reasoning}`);
            }
          }
        } catch (aiError) {
          console.warn('AI analysis failed, using rule-based result:', aiError);
        }
      }

      const level = score >= 9 ? 'A' : score >= 7 ? 'B' : score >= 5 ? 'C' : 'D';
      
      return {
        level,
        confidence: 0.8,
        reasoning: `評価スコア: ${score}/10 (${factors.join(', ')})`
      };
    } catch (error) {
      console.error('Issue level evaluation error:', error);
      return {
        level: 'C',
        confidence: 0.3,
        reasoning: 'エラーによりデフォルト評価'
      };
    }
  }

  /**
   * AI による詳細 ISSUE 分析
   */
  private async getAIIssueAnalysis(task: Task, project?: any, factors: string[] = []) {
    const prompt = `
タスクの緊急度・重要度を分析してください。

タスク情報:
- タイトル: ${task.title}
- 説明: ${task.description || '記載なし'}
- 優先度: ${task.priority}
- 期限: ${task.dueDate || '未設定'}

プロジェクト情報:
${project ? `
- 名前: ${project.name}
- フェーズ: ${project.phase}
- 優先度: ${project.priority}
- 成功確率: ${project.successProbability}
` : '関連プロジェクトなし'}

既存の評価要素: ${factors.join(', ')}

以下の形式のJSONで回答してください:
{
  "adjustmentScore": -2から+2の範囲で調整値,
  "reasoning": "調整理由の簡潔な説明"
}

特に注目すべき点:
- ビジネスインパクト
- 他タスクへの依存関係
- リスクの大きさ
- 緊急性と重要性のバランス
`;

    return await this.aiCallManager.callGemini(
      prompt,
      'issue_level_analysis',
      { useCache: true, cacheKey: `issue_${task.id}_${JSON.stringify(factors)}` }
    );
  }

  // ===== プライベートメソッド =====

  private inferTaskCategory(task: Task): keyof UserSkills {
    const text = `${task.title} ${task.description}`.toLowerCase();
    
    // キーワードベースのカテゴリ推定
    if (text.match(/(コード|開発|プログラム|実装|デバッグ|テスト)/)) return 'engineering';
    if (text.match(/(営業|商談|顧客|提案|クロージング)/)) return 'sales';
    if (text.match(/(デザイン|制作|クリエイティブ|UI|UX)/)) return 'creative';
    if (text.match(/(マーケティング|広告|宣伝|SNS|SEO)/)) return 'marketing';
    if (text.match(/(管理|マネジメント|統括|進捗|計画)/)) return 'management';
    if (text.match(/(広報|PR|プレス|メディア|発表)/)) return 'pr';
    
    return 'management'; // デフォルト
  }

  private calculateTaskCompatibility(task: Task, relatedTasks: Task[], user: User): number {
    if (relatedTasks.length === 0) return 1.0;
    
    // 同時進行タスクのカテゴリ分析
    const currentCategory = this.inferTaskCategory(task);
    const relatedCategories = relatedTasks.map(t => this.inferTaskCategory(t));
    const uniqueCategories = new Set([currentCategory, ...relatedCategories]);
    
    // カテゴリの多様性による負荷増加
    if (uniqueCategories.size <= 2) return 1.0;  // 集中作業
    if (uniqueCategories.size === 3) return 1.2; // 中程度の切り替え負荷
    return 1.5; // 高い切り替え負荷
  }

  private calculateProgressChangeRate(project: any, tasks: Task[]): number {
    if (tasks.length === 0) return 0;
    
    // 過去30日間の進捗変化を分析
    const recentTasks = tasks.filter(t => {
      const updatedDays = this.getDaysSince(t.updatedAt);
      return updatedDays <= 30 && t.status !== 'IDEA';
    });
    
    return Math.min(1.0, recentTasks.length / Math.max(1, tasks.length));
  }

  private calculatePhaseTransitionSpeed(project: any): number {
    if (!project.phaseChangeDate) return 0.5;
    
    const daysSincePhaseChange = this.getDaysSince(project.phaseChangeDate);
    const expectedDays = this.getExpectedPhaseDuration(project.phase || 'concept');
    
    // フェーズ期間が適切範囲内かを評価
    return Math.max(0, Math.min(1.0, 1 - (daysSincePhaseChange / expectedDays)));
  }

  private calculateConnectionGrowth(project: any, connections: any[]): number {
    const connectionPower = project.connectionPower || 0;
    return Math.min(1.0, connectionPower / 10);
  }

  private calculateActivityScore(project: any, recentActivity: any[]): number {
    if (!project.lastActivityDate) return 0.3;
    
    const daysSinceActivity = this.getDaysSince(project.lastActivityDate);
    return Math.max(0, Math.min(1.0, 1 - (daysSinceActivity / 14)));
  }

  private estimateBaseHours(task: Task): number {
    // 文字数とキーワードベースの工数推定
    const titleLength = task.title.length;
    const descLength = task.description.length;
    const totalChars = titleLength + descLength;
    
    // 複雑度キーワード検出
    const complexityKeywords = ['開発', '設計', '分析', '調査', '企画'];
    const hasComplexity = complexityKeywords.some(kw => 
      task.title.includes(kw) || task.description.includes(kw)
    );
    
    let baseHours = Math.max(1, Math.min(40, totalChars / 20));
    if (hasComplexity) baseHours *= 1.5;
    
    return Math.round(baseHours * 100) / 100;
  }

  private calculateConfidence(user: User, task: Task): number {
    let confidence = 0.5;
    
    // ユーザー情報の充実度
    if (user.skills && Object.keys(user.skills).length > 0) confidence += 0.2;
    if (user.preferences && Object.keys(user.preferences).length > 0) confidence += 0.1;
    if (user.workStyle && Object.keys(user.workStyle).length > 0) confidence += 0.1;
    
    // タスク情報の充実度
    if (task.estimatedHours && task.estimatedHours > 0) confidence += 0.1;
    if (task.description && task.description.length > 10) confidence += 0.1;
    
    return Math.min(0.95, confidence);
  }

  private buildReasoningText(params: any): string {
    return `
カテゴリ: ${params.taskCategory}
スキルレベル: ${params.skillLevel}/10
基本工数: ${params.baseHours}時間
難易度係数: ${params.difficultyMultiplier}
スキル係数: ${params.skillMultiplier.toFixed(2)}
相性係数: ${params.compatibilityScore}
最終ウェイト: ${params.weight.toFixed(2)}時間
    `.trim();
  }

  private getDaysToDeadline(dueDate: string): number {
    const due = new Date(dueDate);
    const now = new Date();
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  private getDaysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  }

  private getExpectedPhaseDuration(phase: string): number {
    const durations: Record<string, number> = {
      concept: 14,
      planning: 21,
      negotiation: 30,
      proposal: 14,
      closing: 7,
      execution: 90,
      monitoring: 60,
      completion: 7
    };
    return durations[phase] || 30;
  }

  private getDefaultSkills(): UserSkills {
    return {
      engineering: 5,
      sales: 5,
      creative: 5,
      marketing: 5,
      management: 5,
      pr: 5
    };
  }
}