# Phase 2: AIエンジン実装 - 実装ガイド

**実装期間:** 3-4週間  
**目標:** AI評価エンジンの段階的導入  
**前提条件:** Phase 1完了、`docs/PHASE1_DATA_FOUNDATION.md` 実装済み

---

## 🎯 Phase 2の実装目標

1. **AIリソースウェイト計算エンジン** - ユーザー特性×タスク難易度
2. **プロジェクト成功確率算出エンジン** - 進捗×フェーズ×コネクション
3. **タスクISSUE度自動判定** - A/B/C/D自動分類
4. **AI評価API実装** - 段階的評価機能提供
5. **評価結果のDB保存・履歴管理** - 判定根拠の透明性確保

---

## 📋 Phase 2開始前チェックリスト

- [ ] Phase 1完了確認: `docs/PHASE1_DATA_FOUNDATION.md` チェックリスト✅
- [ ] 新規テーブル存在確認: `SELECT COUNT(*) FROM ai_evaluations;`
- [ ] ユーザープロファイルAPI動作確認: `GET /api/users/[id]/profile`
- [ ] 既存機能正常動作確認: 全ページアクセスOK
- [ ] Gemini API Key設定確認: `echo $GEMINI_API_KEY`

---

## 🧠 AIエンジン実装

### **2.1 AIリソースウェイト計算エンジン**

**src/lib/ai/evaluation-engine.ts（新規作成）:**
```typescript
import { User, Task, UserSkills } from '@/lib/types';

export class AIEvaluationEngine {
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
   * タスクのISSUE度を自動判定
   */
  async evaluateIssueLevel(
    task: Task,
    project?: any,
    userWorkload?: number
  ): Promise<{ level: 'A' | 'B' | 'C' | 'D'; confidence: number; reasoning: string }> {
    try {
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
```

### **2.2 AI評価API実装**

**src/app/api/ai/evaluate/route.ts（新規作成）:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { AIEvaluationEngine } from '@/lib/ai/evaluation-engine';
import { prismaDataService } from '@/lib/database/prisma-service';

export async function POST(request: NextRequest) {
  try {
    const { entityType, entityId, evaluationType } = await request.json();
    
    // 入力値検証
    if (!entityType || !entityId || !evaluationType) {
      return NextResponse.json({ 
        error: 'Missing required fields: entityType, entityId, evaluationType' 
      }, { status: 400 });
    }

    const engine = new AIEvaluationEngine(process.env.GEMINI_API_KEY);
    
    switch (evaluationType) {
      case 'resource_weight':
        return await handleResourceWeightEvaluation(engine, entityId);
      case 'success_probability':
        return await handleSuccessProbabilityEvaluation(engine, entityId);
      case 'issue_level':
        return await handleIssueLevelEvaluation(engine, entityId);
      default:
        return NextResponse.json({ 
          error: 'Invalid evaluation type. Must be: resource_weight, success_probability, or issue_level' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error('AI evaluation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleResourceWeightEvaluation(engine: AIEvaluationEngine, taskId: string) {
  // 1. タスク取得
  const task = await prismaDataService.getTaskById(taskId);
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // 2. ユーザー取得
  const user = await prismaDataService.getUserById(task.userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // 3. 関連タスク取得（同じユーザーのアクティブタスク）
  const relatedTasks = await prismaDataService.getTasksByUserId(task.userId);
  const activeTasks = relatedTasks.filter(t => 
    t.status !== 'COMPLETE' && t.status !== 'DELETE' && t.id !== taskId
  );

  // 4. AI評価実行
  const result = await engine.calculateResourceWeight(user, task, activeTasks);
  
  // 5. 評価結果をDBに保存
  await prismaDataService.createAIEvaluation({
    entityType: 'task',
    entityId: taskId,
    evaluationType: 'resource_weight',
    score: result.weight,
    reasoning: result.reasoning,
    confidence: result.confidence
  });

  // 6. タスクのリソースウェイト更新
  await prismaDataService.updateTask(taskId, { 
    resourceWeight: result.weight 
  });

  return NextResponse.json(result);
}

async function handleSuccessProbabilityEvaluation(engine: AIEvaluationEngine, projectId: string) {
  // 1. プロジェクト取得
  const project = await prismaDataService.getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // 2. プロジェクト関連データ取得
  const tasks = await prismaDataService.getTasksByProjectId(projectId);
  // TODO: プロジェクト関連のコネクションとアクティビティを取得
  const connections: any[] = [];
  const recentActivity: any[] = [];

  // 3. AI評価実行
  const result = await engine.calculateSuccessProbability(project, tasks, connections, recentActivity);
  
  // 4. 評価結果をDBに保存
  await prismaDataService.createAIEvaluation({
    entityType: 'project',
    entityId: projectId,
    evaluationType: 'success_probability',
    score: result.probability,
    reasoning: JSON.stringify(result.factors),
    confidence: result.confidence
  });

  // 5. プロジェクトの成功確率更新
  await prismaDataService.updateProject(projectId, { 
    successProbability: result.probability 
  });

  return NextResponse.json(result);
}

async function handleIssueLevelEvaluation(engine: AIEvaluationEngine, taskId: string) {
  // 1. タスク取得
  const task = await prismaDataService.getTaskById(taskId);
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // 2. プロジェクト取得（任意）
  const project = task.projectId ? await prismaDataService.getProjectById(task.projectId) : undefined;

  // 3. ユーザーワークロード計算
  const userTasks = await prismaDataService.getTasksByUserId(task.userId);
  const userWorkload = userTasks
    .filter(t => t.status !== 'COMPLETE' && t.status !== 'DELETE')
    .reduce((sum, t) => sum + (t.resourceWeight || 1), 0);

  // 4. AI評価実行
  const result = await engine.evaluateIssueLevel(task, project, userWorkload);
  
  // 5. 評価結果をDBに保存
  const scoreMap = { A: 4, B: 3, C: 2, D: 1 };
  await prismaDataService.createAIEvaluation({
    entityType: 'task',
    entityId: taskId,
    evaluationType: 'issue_level',
    score: scoreMap[result.level],
    reasoning: result.reasoning,
    confidence: result.confidence
  });

  // 6. タスクのISSUE度更新
  await prismaDataService.updateTask(taskId, { 
    aiIssueLevel: result.level 
  });

  return NextResponse.json(result);
}
```

### **2.3 AI評価バッチ処理API**

**src/app/api/ai/batch-evaluate/route.ts（新規作成）:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { AIEvaluationEngine } from '@/lib/ai/evaluation-engine';
import { prismaDataService } from '@/lib/database/prisma-service';

export async function POST(request: NextRequest) {
  try {
    const { target } = await request.json(); // 'all_tasks', 'all_projects', 'specific_user'
    
    const engine = new AIEvaluationEngine(process.env.GEMINI_API_KEY);
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    if (target === 'all_tasks') {
      const tasks = await prismaDataService.getAllTasks();
      
      for (const task of tasks) {
        try {
          results.processed++;
          
          const user = await prismaDataService.getUserById(task.userId);
          if (!user) continue;

          const userTasks = await prismaDataService.getTasksByUserId(task.userId);
          const activeTasks = userTasks.filter(t => 
            t.status !== 'COMPLETE' && t.status !== 'DELETE' && t.id !== task.id
          );

          // リソースウェイト評価
          const weightResult = await engine.calculateResourceWeight(user, task, activeTasks);
          await prismaDataService.updateTask(task.id, { resourceWeight: weightResult.weight });

          // ISSUE度評価
          const project = task.projectId ? await prismaDataService.getProjectById(task.projectId) : undefined;
          const userWorkload = userTasks.reduce((sum, t) => sum + (t.resourceWeight || 1), 0);
          const issueResult = await engine.evaluateIssueLevel(task, project, userWorkload);
          await prismaDataService.updateTask(task.id, { aiIssueLevel: issueResult.level });

          results.successful++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Task ${task.id}: ${error}`);
        }
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Batch evaluation error:', error);
    return NextResponse.json({ error: 'Batch evaluation failed' }, { status: 500 });
  }
}
```

---

## ✅ Phase 2完了検証

### **必須チェックリスト:**
- [ ] AIエンジン実装完了
  - [ ] `src/lib/ai/evaluation-engine.ts` 作成・動作確認
  - [ ] リソースウェイト計算テスト実行
  - [ ] 成功確率算出テスト実行
  - [ ] ISSUE度判定テスト実行
- [ ] AI評価API動作確認
  - [ ] `POST /api/ai/evaluate` テスト（3種類の評価）
  - [ ] `POST /api/ai/batch-evaluate` テスト
  - [ ] エラーハンドリング確認
- [ ] データベース更新確認
  - [ ] `ai_evaluations` テーブルにデータ保存確認
  - [ ] タスクの `resourceWeight`, `aiIssueLevel` 更新確認
  - [ ] プロジェクトの `successProbability` 更新確認
- [ ] 既存機能無影響確認
  - [ ] 全ページ正常動作
  - [ ] Kanban表示正常
  - [ ] LINE Bot継続動作

### **API動作確認方法:**
```bash
# リソースウェイト評価テスト
curl -X POST "http://localhost:3000/api/ai/evaluate" \
  -H "Content-Type: application/json" \
  -d '{"entityType":"task","entityId":"[実際のタスクID]","evaluationType":"resource_weight"}'

# 成功確率評価テスト
curl -X POST "http://localhost:3000/api/ai/evaluate" \
  -H "Content-Type: application/json" \
  -d '{"entityType":"project","entityId":"[実際のプロジェクトID]","evaluationType":"success_probability"}'

# バッチ評価テスト
curl -X POST "http://localhost:3000/api/ai/batch-evaluate" \
  -H "Content-Type: application/json" \
  -d '{"target":"all_tasks"}'
```

### **Phase 2完了報告テンプレート:**
```markdown
## Phase 2実装完了報告

### 実装内容
✅ AIエンジン実装: evaluation-engine.ts（3種類の評価機能）
✅ AI評価API: /api/ai/evaluate（単発評価）
✅ バッチ評価API: /api/ai/batch-evaluate（一括評価）
✅ データベース連携: 評価結果自動保存・更新

### 検証結果
✅ リソースウェイト計算: XX件のタスクで平均精度85%
✅ 成功確率算出: XX件のプロジェクトで評価完了
✅ ISSUE度判定: XX件のタスクでA-D分類完了
✅ 既存機能無影響: 全機能正常動作確認

### パフォーマンス
✅ 単発評価応答時間: 平均XXms
✅ バッチ評価処理時間: XX件/分
✅ データベース負荷: 正常範囲内

### 次Phase準備状況
✅ Phase 3開始準備完了
次回実装: docs/PHASE3_PROJECT_RELATIONSHIPS.md 参照
```

---

**Phase 2完了後、`docs/PHASE3_PROJECT_RELATIONSHIPS.md` に進んでください。**