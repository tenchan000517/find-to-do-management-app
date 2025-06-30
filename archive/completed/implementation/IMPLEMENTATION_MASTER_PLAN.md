# プロジェクト中心型AIアシスタント付きタスク管理システム - 完全実装計画書

## 📋 計画書概要

**作成日:** 2025-06-14  
**対象システム:** FIND TO DO Management App  
**実装方針:** 既存機能を壊さない段階的アップデート  
**技術スタック:** Next.js 15, PostgreSQL, Prisma, LINE Bot, Google Gemini AI

---

## 🎯 目標仕様

### プロジェクト中心設計の核心理念
- **全要素のプロジェクト紐づけ**: タスク、予定、コネクション、アポがプロジェクトに連携
- **動的進捗管理**: タスクステータス → プロジェクト進捗 → フェーズ変化の連鎖反応
- **AIリソース見積もり**: ユーザー特性 × タスク難易度 × 相性係数 = 予想工数
- **インテリジェントアラート**: 進捗停滞、活動停滞、フェーズ停滞の自動検知
- **ユーザー特性最適化**: 6カテゴリ（営業、クリエイティブ、マーケティング、エンジニアリング、広報、マネジメント）による適性管理

---

## 🏗️ 現在の実装状況（完全把握済み）

### ✅ 既存の強固な基盤

#### **データベース構造（PostgreSQL + Prisma）**
- **11の主要テーブル**: users, tasks, projects, task_collaborators, calendar_events, appointments, connections, knowledge_items, line_integration_logs, discord_metrics, task_archives
- **完全な関係性**: User ↔ Task (owner + collaborators), Project ↔ Task, 全エンティティのCRUD完備
- **5名のユーザー**: 川島、弓木野、漆畑、池本、飯田（LINE User ID紐づけ済み）

#### **API構造（Next.js App Router）**
- **RESTful設計**: `/api/[entity]/route.ts` パターン完備
- **全エンティティCRUD**: tasks, projects, users, calendar, connections, appointments, knowledge
- **LINE Bot統合**: `/api/webhook/line` - Gemini AI付き自然言語処理
- **Discord分析**: `/api/discord/metrics` - コミュニティ指標

#### **UI/UX実装（Next.js + Tailwind）**
- **4種類のKanban**: ステータス別、ユーザー別、プロジェクト別、期限別
- **多様な表示形式**: テーブル、カード、ガントチャート
- **日本語完全対応**: PDCAワークフロー（アイデア→計画→実行→改善→完了→ナレッジ→リスケ）
- **モバイル最適化**: レスポンシブ設計完備

#### **LINE Bot機能**
- **自然言語処理**: Gemini AI + フォールバック regex処理
- **データ自動生成**: schedule, task, project, contact, memo の5タイプ抽出
- **グループチャット対応**: メンション検知、確信度ベース処理
- **通知システム**: リマインド、プッシュメッセージ機能

### ❌ 実装が必要な要素

#### **データ拡張が必要な項目**
- ユーザースキル・プロファイル（6カテゴリ評価）
- QOLウェイト、志向性、適性情報
- プロジェクトフェーズ管理
- KGI/KPI/マイルストーン構造
- AI評価・判定履歴
- アラートシステム
- 関係性マッピング（全エンティティ ↔ プロジェクト）

#### **バックエンド機能の拡張**
- AI分析エンジン（リソース見積もり、成功確率算出、ISSUE度判定）
- アラートエンジン（進捗・活動・フェーズ監視）
- 認証・権限システム
- ジョブキューシステム（setTimeout代替）

#### **フロントエンド機能の拡張**
- ユーザープロファイル設定UI
- プロジェクトリーダー移行機能
- アラート・通知管理UI
- AI分析結果ダッシュボード
- プロジェクト昇華候補管理

---

## 🚀 段階的実装計画（6段階）

### **Phase 1: データ基盤強化（2-3週間）**

#### **1.1 データベーススキーマ拡張（破壊的変更なし）**

**既存テーブル拡張:**
```sql
-- users テーブル拡張
ALTER TABLE users ADD COLUMN skills JSON DEFAULT '{"engineering": 0, "sales": 0, "creative": 0, "marketing": 0, "management": 0, "pr": 0}';
ALTER TABLE users ADD COLUMN preferences JSON DEFAULT '{"qol_weight": 1.0, "target_areas": [], "strengths": [], "weaknesses": []}';
ALTER TABLE users ADD COLUMN work_style JSON DEFAULT '{"focus_time": "morning", "collaboration_preference": "medium", "stress_tolerance": "medium"}';

-- projects テーブル拡張
ALTER TABLE projects ADD COLUMN phase VARCHAR(50) DEFAULT 'concept';
ALTER TABLE projects ADD COLUMN kgi TEXT DEFAULT '';
ALTER TABLE projects ADD COLUMN success_probability FLOAT DEFAULT 0.0;
ALTER TABLE projects ADD COLUMN activity_score FLOAT DEFAULT 0.0;
ALTER TABLE projects ADD COLUMN connection_power INT DEFAULT 0;
ALTER TABLE projects ADD COLUMN last_activity_date TIMESTAMP DEFAULT NOW();
ALTER TABLE projects ADD COLUMN phase_change_date TIMESTAMP DEFAULT NOW();

-- tasks テーブル拡張
ALTER TABLE tasks ADD COLUMN estimated_hours FLOAT DEFAULT 0;
ALTER TABLE tasks ADD COLUMN actual_hours FLOAT DEFAULT 0;
ALTER TABLE tasks ADD COLUMN difficulty_score INT DEFAULT 3;
ALTER TABLE tasks ADD COLUMN ai_issue_level VARCHAR(1) DEFAULT 'C';
ALTER TABLE tasks ADD COLUMN resource_weight FLOAT DEFAULT 1.0;
```

**新規テーブル追加:**
```sql
-- プロジェクト関係性マッピング
CREATE TABLE project_relationships (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  related_type VARCHAR(50) NOT NULL, -- 'task', 'appointment', 'connection', 'calendar'
  related_id TEXT NOT NULL,
  relationship_strength FLOAT DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, related_type, related_id)
);

-- AI評価履歴
CREATE TABLE ai_evaluations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  entity_type VARCHAR(50) NOT NULL,
  entity_id TEXT NOT NULL,
  evaluation_type VARCHAR(50) NOT NULL, -- 'resource_weight', 'success_probability', 'issue_level'
  score FLOAT NOT NULL,
  reasoning TEXT,
  confidence FLOAT DEFAULT 0.0,
  model_version VARCHAR(50) DEFAULT 'gemini-1.5',
  created_at TIMESTAMP DEFAULT NOW()
);

-- アラートシステム
CREATE TABLE project_alerts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL, -- 'progress_stagnation', 'activity_stagnation', 'phase_stagnation', 'workload_risk'
  severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_resolved BOOLEAN DEFAULT FALSE,
  triggered_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ユーザーアラート
CREATE TABLE user_alerts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium',
  message TEXT NOT NULL,
  related_entity_type VARCHAR(50),
  related_entity_id TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- プロジェクトフェーズ履歴
CREATE TABLE project_phase_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  from_phase VARCHAR(50),
  to_phase VARCHAR(50) NOT NULL,
  changed_by TEXT REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **1.2 Prismaスキーマ更新**
```prisma
// prisma/schema.prisma に追加

model project_relationships {
  id                   String   @id @default(cuid())
  projectId            String
  relatedType          String
  relatedId            String
  relationshipStrength Float    @default(1.0)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  projects             projects @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@unique([projectId, relatedType, relatedId])
}

model ai_evaluations {
  id             String   @id @default(cuid())
  entityType     String
  entityId       String
  evaluationType String
  score          Float
  reasoning      String?
  confidence     Float    @default(0.0)
  modelVersion   String   @default("gemini-1.5")
  createdAt      DateTime @default(now())
}

model project_alerts {
  id          String    @id @default(cuid())
  projectId   String
  alertType   String
  severity    String    @default("medium")
  message     String
  isRead      Boolean   @default(false)
  isResolved  Boolean   @default(false)
  triggeredAt DateTime  @default(now())
  resolvedAt  DateTime?
  createdAt   DateTime  @default(now())
  projects    projects  @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

model user_alerts {
  id                String   @id @default(cuid())
  userId            String
  alertType         String
  severity          String   @default("medium")
  message           String
  relatedEntityType String?
  relatedEntityId   String?
  isRead            Boolean  @default(false)
  createdAt         DateTime @default(now())
  users             users    @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model project_phase_history {
  id        String   @id @default(cuid())
  projectId String
  fromPhase String?
  toPhase   String
  changedBy String?
  reason    String?
  createdAt DateTime @default(now())
  projects  projects @relation(fields: [projectId], references: [id], onDelete: Cascade)
  users     users?   @relation(fields: [changedBy], references: [id])
}

// 既存モデルの拡張
model users {
  // 既存フィールド...
  skills               Json                   @default("{}")
  preferences          Json                   @default("{}")
  workStyle            Json                   @default("{}")
  user_alerts          user_alerts[]
  project_phase_history project_phase_history[]
}

model projects {
  // 既存フィールド...
  phase                String                  @default("concept")
  kgi                  String                  @default("")
  successProbability   Float                   @default(0.0)
  activityScore        Float                   @default(0.0)
  connectionPower      Int                     @default(0)
  lastActivityDate     DateTime                @default(now())
  phaseChangeDate      DateTime                @default(now())
  project_relationships project_relationships[]
  project_alerts       project_alerts[]
  project_phase_history project_phase_history[]
}

model tasks {
  // 既存フィールド...
  estimatedHours    Float  @default(0)
  actualHours       Float  @default(0)
  difficultyScore   Int    @default(3)
  aiIssueLevel      String @default("C")
  resourceWeight    Float  @default(1.0)
}
```

#### **1.3 マイグレーション実行**
```bash
npx prisma migrate dev --name "add-ai-features-phase1"
npx prisma generate
```

#### **1.4 型定義更新**
```typescript
// src/lib/types.ts に追加

export interface UserSkills {
  engineering: number;  // 0-10
  sales: number;
  creative: number;
  marketing: number;
  management: number;
  pr: number;
}

export interface UserPreferences {
  qol_weight: number;  // 0.1-2.0
  target_areas: string[];
  strengths: string[];
  weaknesses: string[];
}

export interface WorkStyle {
  focus_time: 'morning' | 'afternoon' | 'evening' | 'night';
  collaboration_preference: 'low' | 'medium' | 'high';
  stress_tolerance: 'low' | 'medium' | 'high';
}

export interface ProjectPhase {
  concept: 'コンセプト';
  planning: '企画';
  negotiation: '商談';
  proposal: '提案';
  closing: 'クロージング';
  execution: '実行';
  monitoring: '監視';
  completion: '完了';
}

export interface ProjectAlert {
  id: string;
  projectId: string;
  alertType: 'progress_stagnation' | 'activity_stagnation' | 'phase_stagnation' | 'workload_risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  isRead: boolean;
  isResolved: boolean;
  triggeredAt: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface AIEvaluation {
  id: string;
  entityType: string;
  entityId: string;
  evaluationType: 'resource_weight' | 'success_probability' | 'issue_level';
  score: number;
  reasoning?: string;
  confidence: number;
  modelVersion: string;
  createdAt: string;
}

// 既存インターフェース拡張
export interface User {
  // 既存フィールド...
  skills?: UserSkills;
  preferences?: UserPreferences;
  workStyle?: WorkStyle;
}

export interface Project {
  // 既存フィールド...
  phase: keyof ProjectPhase;
  kgi: string;
  successProbability: number;
  activityScore: number;
  connectionPower: number;
  lastActivityDate: string;
  phaseChangeDate: string;
}

export interface Task {
  // 既存フィールド...
  estimatedHours: number;
  actualHours: number;
  difficultyScore: number;
  aiIssueLevel: 'A' | 'B' | 'C' | 'D';
  resourceWeight: number;
}
```

### **Phase 2: AIエンジン実装（3-4週間）**

#### **2.1 AI評価エンジン基盤**
```typescript
// src/lib/ai/evaluation-engine.ts
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
    const skills = user.skills || {};
    const workStyle = user.workStyle || {};
    
    // スキル適性計算
    const taskCategory = this.inferTaskCategory(task);
    const skillLevel = skills[taskCategory] || 5;
    const skillMultiplier = Math.max(0.1, 11 - skillLevel) / 5; // スキルが高いほど低い係数
    
    // 相性計算（他タスクとの組み合わせ）
    const compatibilityScore = this.calculateTaskCompatibility(task, relatedTasks, user);
    
    // 基本計算
    const baseHours = task.estimatedHours || this.estimateBaseHours(task);
    const difficultyMultiplier = task.difficultyScore / 5;
    
    const weight = baseHours * difficultyMultiplier * skillMultiplier * compatibilityScore;
    
    const reasoning = `
      基本工数: ${baseHours}h
      難易度係数: ${difficultyMultiplier}
      スキル係数: ${skillMultiplier} (${taskCategory}: ${skillLevel}/10)
      相性係数: ${compatibilityScore}
      最終ウェイト: ${weight.toFixed(2)}h
    `.trim();
    
    return {
      weight: Math.round(weight * 100) / 100,
      confidence: this.calculateConfidence(user, task),
      reasoning
    };
  }

  /**
   * プロジェクトの成功確率を算出
   * 要素: 進捗変化率、フェーズ遷移速度、コネクション増加数
   */
  async calculateSuccessProbability(
    project: Project,
    tasks: Task[],
    connections: any[],
    recentActivity: any[]
  ): Promise<{ probability: number; confidence: number; factors: any }> {
    // 進捗変化率計算
    const progressChangeRate = this.calculateProgressChangeRate(project, tasks);
    
    // フェーズ遷移速度
    const phaseTransitionSpeed = this.calculatePhaseTransitionSpeed(project);
    
    // コネクション増加
    const connectionGrowth = this.calculateConnectionGrowth(project, connections);
    
    // アクティビティスコア
    const activityScore = this.calculateActivityScore(project, recentActivity);
    
    // 重み付き合成確率
    const probability = Math.min(1.0, 
      progressChangeRate * 0.3 +
      phaseTransitionSpeed * 0.25 +
      connectionGrowth * 0.2 +
      activityScore * 0.25
    );
    
    return {
      probability: Math.round(probability * 100) / 100,
      confidence: 0.85,
      factors: {
        progressChangeRate,
        phaseTransitionSpeed,
        connectionGrowth,
        activityScore
      }
    };
  }

  /**
   * タスクのISSUE度を自動判定
   */
  async evaluateIssueLevel(
    task: Task,
    project?: Project,
    userWorkload?: number
  ): Promise<{ level: 'A' | 'B' | 'C' | 'D'; confidence: number; reasoning: string }> {
    let score = 5; // 基準点（C判定）
    const factors = [];

    // プロジェクト関連性
    if (project) {
      if (project.priority === 'A' || project.successProbability > 0.8) {
        score += 2;
        factors.push('高優先度プロジェクト');
      }
    }

    // 期限切迫度
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

    // リソースウェイト
    if (task.resourceWeight > 10) {
      score += 2;
      factors.push('高負荷タスク');
    }

    // ユーザー負荷状況
    if (userWorkload && userWorkload > 1.5) {
      score -= 1;
      factors.push('ユーザー高負荷');
    }

    const level = score >= 9 ? 'A' : score >= 7 ? 'B' : score >= 5 ? 'C' : 'D';
    
    return {
      level,
      confidence: 0.8,
      reasoning: `スコア: ${score}/10 (${factors.join(', ')})`
    };
  }

  private inferTaskCategory(task: Task): keyof UserSkills {
    const title = task.title.toLowerCase();
    const description = task.description.toLowerCase();
    const text = `${title} ${description}`;

    if (text.includes('コード') || text.includes('開発') || text.includes('プログラム')) {
      return 'engineering';
    }
    if (text.includes('営業') || text.includes('商談') || text.includes('顧客')) {
      return 'sales';
    }
    if (text.includes('デザイン') || text.includes('制作') || text.includes('クリエイティブ')) {
      return 'creative';
    }
    if (text.includes('マーケティング') || text.includes('広告') || text.includes('宣伝')) {
      return 'marketing';
    }
    if (text.includes('管理') || text.includes('マネジメント') || text.includes('統括')) {
      return 'management';
    }
    if (text.includes('広報') || text.includes('PR') || text.includes('プレス')) {
      return 'pr';
    }
    
    return 'management'; // デフォルト
  }

  private calculateTaskCompatibility(task: Task, relatedTasks: Task[], user: User): number {
    // 同時進行タスクの相性を計算
    // 異なるカテゴリが混在すると負荷増加
    const categories = relatedTasks.map(t => this.inferTaskCategory(t));
    const uniqueCategories = new Set(categories);
    
    if (uniqueCategories.size <= 2) return 1.0;
    if (uniqueCategories.size === 3) return 1.2;
    return 1.5; // 多カテゴリ同時進行はリソース圧迫
  }

  private calculateProgressChangeRate(project: Project, tasks: Task[]): number {
    // 過去30日の進捗変化を分析
    const recentTasks = tasks.filter(t => {
      const updatedDays = this.getDaysSince(t.updatedAt);
      return updatedDays <= 30;
    });
    
    return Math.min(1.0, recentTasks.length / tasks.length);
  }

  private calculatePhaseTransitionSpeed(project: Project): number {
    const daysSincePhaseChange = this.getDaysSince(project.phaseChangeDate);
    const expectedDays = this.getExpectedPhaseDuration(project.phase);
    
    return Math.max(0, Math.min(1.0, 1 - (daysSincePhaseChange / expectedDays)));
  }

  private calculateConnectionGrowth(project: Project, connections: any[]): number {
    // プロジェクト関連の新規コネクション増加
    return Math.min(1.0, project.connectionPower / 10);
  }

  private calculateActivityScore(project: Project, recentActivity: any[]): number {
    const daysSinceActivity = this.getDaysSince(project.lastActivityDate);
    return Math.max(0, Math.min(1.0, 1 - (daysSinceActivity / 14)));
  }

  private estimateBaseHours(task: Task): number {
    const wordCount = task.title.length + task.description.length;
    return Math.max(1, Math.min(40, wordCount / 20)); // 文字数ベース概算
  }

  private calculateConfidence(user: User, task: Task): number {
    const hasSkills = user.skills && Object.keys(user.skills).length > 0;
    const hasPreferences = user.preferences && Object.keys(user.preferences).length > 0;
    const hasEstimate = task.estimatedHours > 0;
    
    let confidence = 0.5;
    if (hasSkills) confidence += 0.2;
    if (hasPreferences) confidence += 0.15;
    if (hasEstimate) confidence += 0.15;
    
    return Math.min(0.95, confidence);
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
    const durations = {
      concept: 14,
      planning: 21,
      negotiation: 30,
      proposal: 14,
      closing: 7,
      execution: 90,
      monitoring: 60,
      completion: 7
    };
    return durations[phase as keyof typeof durations] || 30;
  }
}
```

#### **2.2 AI評価API実装**
```typescript
// src/app/api/ai/evaluate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AIEvaluationEngine } from '@/lib/ai/evaluation-engine';
import { prismaDataService } from '@/lib/database/prisma-service';

export async function POST(request: NextRequest) {
  try {
    const { entityType, entityId, evaluationType } = await request.json();
    
    const engine = new AIEvaluationEngine(process.env.GEMINI_API_KEY);
    
    switch (evaluationType) {
      case 'resource_weight':
        return await handleResourceWeightEvaluation(engine, entityId);
      case 'success_probability':
        return await handleSuccessProbabilityEvaluation(engine, entityId);
      case 'issue_level':
        return await handleIssueLevelEvaluation(engine, entityId);
      default:
        return NextResponse.json({ error: 'Invalid evaluation type' }, { status: 400 });
    }
  } catch (error) {
    console.error('AI evaluation error:', error);
    return NextResponse.json({ error: 'Evaluation failed' }, { status: 500 });
  }
}

async function handleResourceWeightEvaluation(engine: AIEvaluationEngine, taskId: string) {
  const task = await prismaDataService.getTaskById(taskId);
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const user = await prismaDataService.getUserById(task.userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const relatedTasks = await prismaDataService.getTasksByUserId(task.userId);
  const activeTasks = relatedTasks.filter(t => 
    t.status !== 'COMPLETE' && t.status !== 'DELETE' && t.id !== taskId
  );

  const result = await engine.calculateResourceWeight(user, task, activeTasks);
  
  // 評価結果をDBに保存
  await prismaDataService.createAIEvaluation({
    entityType: 'task',
    entityId: taskId,
    evaluationType: 'resource_weight',
    score: result.weight,
    reasoning: result.reasoning,
    confidence: result.confidence
  });

  // タスクのリソースウェイトを更新
  await prismaDataService.updateTask(taskId, { resourceWeight: result.weight });

  return NextResponse.json(result);
}

async function handleSuccessProbabilityEvaluation(engine: AIEvaluationEngine, projectId: string) {
  const project = await prismaDataService.getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const tasks = await prismaDataService.getTasksByProjectId(projectId);
  const connections = []; // TODO: プロジェクト関連コネクション取得
  const recentActivity = []; // TODO: 最近のアクティビティ取得

  const result = await engine.calculateSuccessProbability(project, tasks, connections, recentActivity);
  
  await prismaDataService.createAIEvaluation({
    entityType: 'project',
    entityId: projectId,
    evaluationType: 'success_probability',
    score: result.probability,
    reasoning: JSON.stringify(result.factors),
    confidence: result.confidence
  });

  await prismaDataService.updateProject(projectId, { 
    successProbability: result.probability 
  });

  return NextResponse.json(result);
}

async function handleIssueLevelEvaluation(engine: AIEvaluationEngine, taskId: string) {
  const task = await prismaDataService.getTaskById(taskId);
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const project = task.projectId ? await prismaDataService.getProjectById(task.projectId) : undefined;
  const userTasks = await prismaDataService.getTasksByUserId(task.userId);
  const userWorkload = userTasks.reduce((sum, t) => sum + (t.resourceWeight || 1), 0);

  const result = await engine.evaluateIssueLevel(task, project, userWorkload);
  
  await prismaDataService.createAIEvaluation({
    entityType: 'task',
    entityId: taskId,
    evaluationType: 'issue_level',
    score: result.level === 'A' ? 4 : result.level === 'B' ? 3 : result.level === 'C' ? 2 : 1,
    reasoning: result.reasoning,
    confidence: result.confidence
  });

  await prismaDataService.updateTask(taskId, { aiIssueLevel: result.level });

  return NextResponse.json(result);
}
```

### **Phase 3: プロジェクト中心機能（2-3週間）**

#### **3.1 関係性マッピングサービス**
```typescript
// src/lib/services/relationship-service.ts
export class RelationshipService {
  
  /**
   * エンティティをプロジェクトに自動紐づけ
   */
  async linkToProject(
    entityType: 'task' | 'appointment' | 'connection' | 'calendar',
    entityId: string,
    projectId?: string,
    strength: number = 1.0
  ): Promise<void> {
    if (!projectId) {
      projectId = await this.inferProjectConnection(entityType, entityId);
    }
    
    if (projectId) {
      await prismaDataService.createProjectRelationship({
        projectId,
        relatedType: entityType,
        relatedId: entityId,
        relationshipStrength: strength
      });
      
      // プロジェクトのアクティビティスコア更新
      await this.updateProjectActivity(projectId);
    }
  }

  /**
   * AI判定によるプロジェクト関連性推論
   */
  private async inferProjectConnection(entityType: string, entityId: string): Promise<string | null> {
    const entity = await this.getEntityById(entityType, entityId);
    if (!entity) return null;

    const projects = await prismaDataService.getAllProjects();
    const scores = [];

    for (const project of projects) {
      const similarity = await this.calculateSimilarity(entity, project);
      scores.push({ projectId: project.id, score: similarity });
    }

    const bestMatch = scores.sort((a, b) => b.score - a.score)[0];
    return bestMatch && bestMatch.score > 0.6 ? bestMatch.projectId : null;
  }

  /**
   * プロジェクトアクティビティスコア更新
   */
  async updateProjectActivity(projectId: string): Promise<void> {
    const relationships = await prismaDataService.getProjectRelationships(projectId);
    const recentActivity = relationships.filter(r => {
      const daysSince = this.getDaysSince(r.createdAt);
      return daysSince <= 30;
    });

    const activityScore = Math.min(1.0, recentActivity.length / 10);
    
    await prismaDataService.updateProject(projectId, {
      activityScore,
      lastActivityDate: new Date().toISOString()
    });
  }

  /**
   * コネクションパワー計算・更新
   */
  async updateConnectionPower(projectId: string): Promise<void> {
    const connections = await this.getProjectConnections(projectId);
    const uniqueCompanies = new Set(connections.map(c => c.company));
    const seniorContacts = connections.filter(c => 
      c.position.includes('部長') || c.position.includes('取締役') || c.position.includes('CEO')
    );

    const connectionPower = uniqueCompanies.size + (seniorContacts.length * 2);
    
    await prismaDataService.updateProject(projectId, { connectionPower });
  }

  private async calculateSimilarity(entity: any, project: Project): Promise<number> {
    // キーワードベースの類似度計算
    const entityText = `${entity.title || entity.name || ''} ${entity.description || ''}`.toLowerCase();
    const projectText = `${project.name} ${project.description}`.toLowerCase();

    const entityWords = new Set(entityText.split(/\s+/));
    const projectWords = new Set(projectText.split(/\s+/));
    
    const intersection = new Set([...entityWords].filter(x => projectWords.has(x)));
    const union = new Set([...entityWords, ...projectWords]);
    
    return intersection.size / union.size;
  }

  private async getEntityById(entityType: string, entityId: string): Promise<any> {
    switch (entityType) {
      case 'task':
        return await prismaDataService.getTaskById(entityId);
      case 'appointment':
        return await prismaDataService.getAppointmentById(entityId);
      case 'connection':
        return await prismaDataService.getConnectionById(entityId);
      case 'calendar':
        return await prismaDataService.getCalendarEventById(entityId);
      default:
        return null;
    }
  }

  private getDaysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
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
}
```

### **Phase 4: アラート・通知システム（2週間）**

#### **4.1 アラートエンジン実装**
```typescript
// src/lib/services/alert-engine.ts
export class AlertEngine {
  
  /**
   * プロジェクトアラートを総合チェック
   */
  async checkProjectAlerts(projectId: string): Promise<ProjectAlert[]> {
    const alerts = [];
    
    alerts.push(...await this.checkActivityStagnation(projectId));
    alerts.push(...await this.checkProgressStagnation(projectId));
    alerts.push(...await this.checkPhaseStagnation(projectId));
    
    // アラートをDBに保存
    for (const alert of alerts) {
      await this.createAlert(alert);
    }
    
    return alerts;
  }

  /**
   * アクティビティ停滞チェック
   */
  async checkActivityStagnation(projectId: string): Promise<ProjectAlert[]> {
    const project = await prismaDataService.getProjectById(projectId);
    if (!project) return [];

    const daysSinceActivity = this.getDaysSince(project.lastActivityDate);
    const expectedInterval = this.getExpectedActivityInterval(project);
    
    if (daysSinceActivity > expectedInterval) {
      return [{
        id: '',
        projectId,
        alertType: 'activity_stagnation',
        severity: daysSinceActivity > expectedInterval * 2 ? 'high' : 'medium',
        message: `${daysSinceActivity}日間アクティビティがありません（期待間隔: ${expectedInterval}日）`,
        isRead: false,
        isResolved: false,
        triggeredAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }];
    }
    
    return [];
  }

  /**
   * 進捗停滞チェック
   */
  async checkProgressStagnation(projectId: string): Promise<ProjectAlert[]> {
    const project = await prismaDataService.getProjectById(projectId);
    const tasks = await prismaDataService.getTasksByProjectId(projectId);
    
    if (!project || tasks.length === 0) return [];

    const recentProgressChanges = tasks.filter(task => {
      const daysSinceUpdate = this.getDaysSince(task.updatedAt);
      return daysSinceUpdate <= 7 && task.status !== 'IDEA';
    });

    const stagnationDays = this.getDaysSince(project.updatedAt);
    const expectedProgressInterval = this.getExpectedProgressInterval(project);
    
    if (stagnationDays > expectedProgressInterval && recentProgressChanges.length === 0) {
      return [{
        id: '',
        projectId,
        alertType: 'progress_stagnation',
        severity: stagnationDays > expectedProgressInterval * 2 ? 'high' : 'medium',
        message: `${stagnationDays}日間進捗更新がありません（期待間隔: ${expectedProgressInterval}日）`,
        isRead: false,
        isResolved: false,
        triggeredAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }];
    }
    
    return [];
  }

  /**
   * フェーズ停滞チェック
   */
  async checkPhaseStagnation(projectId: string): Promise<ProjectAlert[]> {
    const project = await prismaDataService.getProjectById(projectId);
    if (!project) return [];

    const daysSincePhaseChange = this.getDaysSince(project.phaseChangeDate);
    const expectedPhaseDuration = this.getExpectedPhaseDuration(project.phase);
    
    if (daysSincePhaseChange > expectedPhaseDuration) {
      return [{
        id: '',
        projectId,
        alertType: 'phase_stagnation',
        severity: daysSincePhaseChange > expectedPhaseDuration * 1.5 ? 'critical' : 'high',
        message: `${project.phase}フェーズが${daysSincePhaseChange}日継続中（期待期間: ${expectedPhaseDuration}日）`,
        isRead: false,
        isResolved: false,
        triggeredAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }];
    }
    
    return [];
  }

  /**
   * ユーザーワークロードリスクチェック
   */
  async checkUserWorkloadRisk(userId: string): Promise<UserAlert[]> {
    const user = await prismaDataService.getUserById(userId);
    const tasks = await prismaDataService.getTasksByUserId(userId);
    
    if (!user || tasks.length === 0) return [];

    const activeTasks = tasks.filter(t => 
      t.status !== 'COMPLETE' && t.status !== 'DELETE'
    );
    
    const totalWeight = activeTasks.reduce((sum, task) => sum + (task.resourceWeight || 1), 0);
    const qolWeight = user.preferences?.qol_weight || 1.0;
    const adjustedLoad = totalWeight / qolWeight;
    
    if (adjustedLoad > 50) { // 週50時間相当
      const severity = adjustedLoad > 80 ? 'critical' : adjustedLoad > 65 ? 'high' : 'medium';
      
      return [{
        id: '',
        userId,
        alertType: 'workload_risk',
        severity,
        message: `推定ワークロード: ${adjustedLoad.toFixed(1)}時間/週 (QOL調整済み)`,
        relatedEntityType: 'user',
        relatedEntityId: userId,
        isRead: false,
        createdAt: new Date().toISOString()
      }];
    }
    
    return [];
  }

  /**
   * C/D項目過多チェック
   */
  async checkLowPriorityTaskOverload(userId: string): Promise<UserAlert[]> {
    const tasks = await prismaDataService.getTasksByUserId(userId);
    const activeTasks = tasks.filter(t => 
      t.status !== 'COMPLETE' && t.status !== 'DELETE'
    );
    
    const lowPriorityTasks = activeTasks.filter(t => 
      t.priority === 'C' || t.priority === 'D' || t.aiIssueLevel === 'C' || t.aiIssueLevel === 'D'
    );
    
    const lowPriorityRatio = lowPriorityTasks.length / activeTasks.length;
    
    if (lowPriorityRatio > 0.7 && activeTasks.length > 5) {
      return [{
        id: '',
        userId,
        alertType: 'low_priority_overload',
        severity: 'medium',
        message: `アクティブタスクの${Math.round(lowPriorityRatio * 100)}%がC/D項目です (${lowPriorityTasks.length}/${activeTasks.length}件)`,
        relatedEntityType: 'user',
        relatedEntityId: userId,
        isRead: false,
        createdAt: new Date().toISOString()
      }];
    }
    
    return [];
  }

  private async createAlert(alert: ProjectAlert | UserAlert): Promise<void> {
    if ('projectId' in alert) {
      await prismaDataService.createProjectAlert(alert as ProjectAlert);
    } else {
      await prismaDataService.createUserAlert(alert as UserAlert);
    }
  }

  private getExpectedActivityInterval(project: Project): number {
    const intervals = {
      concept: 7,
      planning: 5,
      negotiation: 3,
      proposal: 2,
      closing: 1,
      execution: 3,
      monitoring: 7,
      completion: 14
    };
    return intervals[project.phase as keyof typeof intervals] || 7;
  }

  private getExpectedProgressInterval(project: Project): number {
    const intervals = {
      concept: 14,
      planning: 10,
      negotiation: 7,
      proposal: 5,
      closing: 3,
      execution: 7,
      monitoring: 14,
      completion: 30
    };
    return intervals[project.phase as keyof typeof intervals] || 10;
  }

  private getExpectedPhaseDuration(phase: string): number {
    const durations = {
      concept: 14,
      planning: 21,
      negotiation: 30,
      proposal: 14,
      closing: 7,
      execution: 90,
      monitoring: 60,
      completion: 7
    };
    return durations[phase as keyof typeof durations] || 30;
  }

  private getDaysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  }
}
```

#### **4.2 通知配信システム**
```typescript
// src/lib/services/notification-service.ts
export class NotificationService {
  
  /**
   * アラートに基づく通知配信
   */
  async sendAlertNotifications(): Promise<void> {
    const projects = await prismaDataService.getAllProjects();
    const users = await prismaDataService.getAllUsers();
    
    // プロジェクトアラートチェック
    for (const project of projects) {
      const alerts = await new AlertEngine().checkProjectAlerts(project.id);
      for (const alert of alerts) {
        await this.sendProjectAlert(project, alert);
      }
    }
    
    // ユーザーアラートチェック
    for (const user of users) {
      const alertEngine = new AlertEngine();
      const workloadAlerts = await alertEngine.checkUserWorkloadRisk(user.id);
      const priorityAlerts = await alertEngine.checkLowPriorityTaskOverload(user.id);
      
      for (const alert of [...workloadAlerts, ...priorityAlerts]) {
        await this.sendUserAlert(user, alert);
      }
    }
  }

  private async sendProjectAlert(project: Project, alert: ProjectAlert): Promise<void> {
    const message = `🚨 プロジェクトアラート\n\n` +
      `プロジェクト: ${project.name}\n` +
      `アラート: ${alert.message}\n` +
      `重要度: ${this.getSeverityEmoji(alert.severity)}`;
    
    // プロジェクトメンバーに通知
    for (const memberId of project.teamMembers) {
      const user = await prismaDataService.getUserById(memberId);
      if (user?.lineUserId) {
        await this.sendLineNotification(user.lineUserId, message);
      }
    }
  }

  private async sendUserAlert(user: User, alert: UserAlert): Promise<void> {
    const message = `⚠️ ワークロードアラート\n\n` +
      `${alert.message}\n` +
      `重要度: ${this.getSeverityEmoji(alert.severity)}`;
    
    if (user.lineUserId) {
      await this.sendLineNotification(user.lineUserId, message);
    }
  }

  private async sendLineNotification(lineUserId: string, message: string): Promise<void> {
    try {
      const response = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          to: lineUserId,
          messages: [{
            type: 'text',
            text: message
          }]
        })
      });
      
      if (!response.ok) {
        console.error('LINE notification failed:', await response.text());
      }
    } catch (error) {
      console.error('LINE notification error:', error);
    }
  }

  private getSeverityEmoji(severity: string): string {
    const emojis = {
      low: '🟢 低',
      medium: '🟡 中',
      high: '🟠 高',
      critical: '🔴 緊急'
    };
    return emojis[severity as keyof typeof emojis] || '🟡 中';
  }
}
```

### **Phase 5: UI/UX強化（3週間）**

#### **5.1 ユーザープロファイル設定UI**
```typescript
// src/components/UserProfileModal.tsx
'use client';

import { useState } from 'react';
import { User, UserSkills, UserPreferences, WorkStyle } from '@/lib/types';

interface UserProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: Partial<User>) => Promise<void>;
}

export default function UserProfileModal({ user, isOpen, onClose, onSave }: UserProfileModalProps) {
  const [skills, setSkills] = useState<UserSkills>(user.skills || {
    engineering: 5,
    sales: 5,
    creative: 5,
    marketing: 5,
    management: 5,
    pr: 5
  });

  const [preferences, setPreferences] = useState<UserPreferences>(user.preferences || {
    qol_weight: 1.0,
    target_areas: [],
    strengths: [],
    weaknesses: []
  });

  const [workStyle, setWorkStyle] = useState<WorkStyle>(user.workStyle || {
    focus_time: 'morning',
    collaboration_preference: 'medium',
    stress_tolerance: 'medium'
  });

  const handleSave = async () => {
    await onSave({ skills, preferences, workStyle });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">ユーザープロファイル設定</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {/* スキル評価セクション */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">スキル評価 (1-10)</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(skills).map(([skill, level]) => (
              <div key={skill} className="space-y-2">
                <label className="block text-sm font-medium">
                  {getSkillLabel(skill)}: {level}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={level}
                  onChange={(e) => setSkills(prev => ({
                    ...prev,
                    [skill]: parseInt(e.target.value)
                  }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>苦手</span>
                  <span>得意</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* QOLウェイト設定 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">QOLウェイト設定</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                作業負荷耐性: {preferences.qol_weight} (低い値ほど早期アラート)
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={preferences.qol_weight}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  qol_weight: parseFloat(e.target.value)
                }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>低負荷重視</span>
                <span>高負荷耐性</span>
              </div>
            </div>
          </div>
        </div>

        {/* 目標・志向性設定 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">目標・志向性</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">目標分野</label>
              <select
                multiple
                value={preferences.target_areas}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value);
                  setPreferences(prev => ({ ...prev, target_areas: values }));
                }}
                className="w-full p-2 border rounded-md h-32"
              >
                <option value="engineering">エンジニアリング</option>
                <option value="sales">営業</option>
                <option value="creative">クリエイティブ</option>
                <option value="marketing">マーケティング</option>
                <option value="management">マネジメント</option>
                <option value="pr">広報</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">強み</label>
              <textarea
                value={preferences.strengths.join(', ')}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  strengths: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                }))}
                placeholder="コミュニケーション, 問題解決, ..."
                className="w-full p-2 border rounded-md h-24"
              />
            </div>
          </div>
        </div>

        {/* 作業スタイル設定 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">作業スタイル</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">集中時間帯</label>
              <select
                value={workStyle.focus_time}
                onChange={(e) => setWorkStyle(prev => ({
                  ...prev,
                  focus_time: e.target.value as any
                }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="morning">朝型</option>
                <option value="afternoon">午後型</option>
                <option value="evening">夕方型</option>
                <option value="night">夜型</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">協働傾向</label>
              <select
                value={workStyle.collaboration_preference}
                onChange={(e) => setWorkStyle(prev => ({
                  ...prev,
                  collaboration_preference: e.target.value as any
                }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="low">個人作業重視</option>
                <option value="medium">バランス型</option>
                <option value="high">チーム作業重視</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">ストレス耐性</label>
              <select
                value={workStyle.stress_tolerance}
                onChange={(e) => setWorkStyle(prev => ({
                  ...prev,
                  stress_tolerance: e.target.value as any
                }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="low">低い</option>
                <option value="medium">普通</option>
                <option value="high">高い</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

function getSkillLabel(skill: string): string {
  const labels = {
    engineering: 'エンジニアリング',
    sales: '営業',
    creative: 'クリエイティブ',
    marketing: 'マーケティング',
    management: 'マネジメント',
    pr: '広報'
  };
  return labels[skill as keyof typeof labels] || skill;
}
```

#### **5.2 プロジェクトリーダー移行機能**
```typescript
// src/components/ProjectLeadershipTab.tsx
'use client';

import { useState } from 'react';
import { Project, User } from '@/lib/types';

interface ProjectLeadershipTabProps {
  project: Project;
  users: User[];
  currentLeader?: User;
  onLeaderChange: (projectId: string, newLeaderId: string, reason?: string) => Promise<void>;
}

export default function ProjectLeadershipTab({ 
  project, 
  users, 
  currentLeader,
  onLeaderChange 
}: ProjectLeadershipTabProps) {
  const [selectedNewLeader, setSelectedNewLeader] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('');
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);

  const handleLeaderTransfer = async () => {
    if (!selectedNewLeader) return;
    
    await onLeaderChange(project.id, selectedNewLeader, transferReason);
    setShowTransferModal(false);
    setSelectedNewLeader('');
    setTransferReason('');
  };

  const getLeadershipScore = (user: User): number => {
    const skills = user.skills || {};
    const management = skills.management || 5;
    const experience = user.createdAt ? 
      Math.min(5, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30))) : 0;
    
    return management + experience;
  };

  const recommendedLeaders = users
    .filter(u => u.id !== currentLeader?.id)
    .sort((a, b) => getLeadershipScore(b) - getLeadershipScore(a))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* 現在のリーダー情報 */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">現在のプロジェクトリーダー</h3>
        {currentLeader ? (
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: currentLeader.color }}
            >
              {currentLeader.name.charAt(0)}
            </div>
            <div>
              <div className="font-medium">{currentLeader.name}</div>
              <div className="text-sm text-gray-600">
                マネジメントスキル: {currentLeader.skills?.management || 5}/10
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-600">リーダーが設定されていません</div>
        )}
      </div>

      {/* カンバン操作権限 */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">カンバン操作権限</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span>タスク移動権限</span>
            <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
              リーダーのみ
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>ステータス変更権限</span>
            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
              全メンバー
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>担当者変更権限</span>
            <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              リーダー + 本人
            </span>
          </div>
        </div>
      </div>

      {/* リーダー変更ボタン */}
      <div>
        <button
          onClick={() => setShowTransferModal(true)}
          className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition-colors"
        >
          リーダーを変更
        </button>
      </div>

      {/* リーダー推奨候補 */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">推奨リーダー候補</h3>
        <div className="space-y-3">
          {recommendedLeaders.map(user => (
            <div key={user.id} className="flex items-center justify-between bg-white p-3 rounded-md">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                  style={{ backgroundColor: user.color }}
                >
                  {user.name.charAt(0)}
                </div>
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-gray-600">
                    スコア: {getLeadershipScore(user)}/15
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedNewLeader(user.id);
                  setShowTransferModal(true);
                }}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                選択
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* リーダー変更モーダル */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">リーダー変更</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">新しいリーダー</label>
                <select
                  value={selectedNewLeader}
                  onChange={(e) => setSelectedNewLeader(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">選択してください</option>
                  {users
                    .filter(u => u.id !== currentLeader?.id)
                    .map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} (スコア: {getLeadershipScore(user)}/15)
                      </option>
                    ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">変更理由 (任意)</label>
                <textarea
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="巻き取り、専門性、負荷分散等..."
                  className="w-full p-2 border rounded-md h-20"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                キャンセル
              </button>
              <button
                onClick={handleLeaderTransfer}
                disabled={!selectedNewLeader}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                変更実行
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### **5.3 プロジェクト昇華候補管理UI**
```typescript
// src/components/ProjectPromotionCandidates.tsx
'use client';

import { useState, useEffect } from 'react';

interface PromotionCandidate {
  id: string;
  title: string;
  type: 'line_input' | 'task_cluster' | 'appointment_series';
  confidence: number;
  reasoning: string;
  relatedItems: any[];
  suggestedProject: {
    name: string;
    description: string;
    phase: string;
    priority: 'A' | 'B' | 'C' | 'D';
  };
  createdAt: string;
}

interface ProjectPromotionCandidatesProps {
  candidates: PromotionCandidate[];
  onPromote: (candidateId: string, projectData: any) => Promise<void>;
  onReject: (candidateId: string, reason: string) => Promise<void>;
}

export default function ProjectPromotionCandidates({ 
  candidates, 
  onPromote, 
  onReject 
}: ProjectPromotionCandidatesProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<PromotionCandidate | null>(null);
  const [showPromoteModal, setShowPromoteModal] = useState<boolean>(false);
  const [projectData, setProjectData] = useState<any>({});

  const handlePromote = async () => {
    if (!selectedCandidate) return;
    
    await onPromote(selectedCandidate.id, projectData);
    setShowPromoteModal(false);
    setSelectedCandidate(null);
    setProjectData({});
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getTypeLabel = (type: string): string => {
    const labels = {
      line_input: 'LINE入力',
      task_cluster: 'タスククラスター',
      appointment_series: 'アポ連続'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (candidates.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 text-center">
        <div className="text-gray-400 text-lg">プロジェクト昇華候補はありません</div>
        <div className="text-sm text-gray-500 mt-2">
          関連するタスクやアポが蓄積されると自動的に候補が表示されます
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">🤖 AI判定によるプロジェクト昇華候補</h3>
        <p className="text-sm text-gray-600">
          関連するタスク、アポ、担当者の蓄積により、AIがプロジェクト化を提案します
        </p>
      </div>

      {candidates.map(candidate => (
        <div key={candidate.id} className="bg-white border rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h4 className="font-semibold">{candidate.title}</h4>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {getTypeLabel(candidate.type)}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${getConfidenceColor(candidate.confidence)}`}>
                  確信度: {Math.round(candidate.confidence * 100)}%
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{candidate.reasoning}</p>
              <div className="text-xs text-gray-500">
                関連項目: {candidate.relatedItems.length}件 | 
                作成: {new Date(candidate.createdAt).toLocaleDateString('ja-JP')}
              </div>
            </div>
          </div>

          {/* 提案プロジェクト情報 */}
          <div className="bg-gray-50 p-3 rounded mb-3">
            <h5 className="font-medium mb-2">提案プロジェクト詳細</h5>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">プロジェクト名:</span> {candidate.suggestedProject.name}
              </div>
              <div>
                <span className="font-medium">フェーズ:</span> {candidate.suggestedProject.phase}
              </div>
              <div className="col-span-2">
                <span className="font-medium">説明:</span> {candidate.suggestedProject.description}
              </div>
            </div>
          </div>

          {/* 関連項目一覧 */}
          <div className="mb-3">
            <h5 className="font-medium mb-2">関連項目 ({candidate.relatedItems.length}件)</h5>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {candidate.relatedItems.slice(0, 3).map((item, index) => (
                <div key={index} className="text-xs bg-white p-2 rounded border">
                  {item.type}: {item.title || item.name}
                </div>
              ))}
              {candidate.relatedItems.length > 3 && (
                <div className="text-xs text-gray-500">
                  ...他 {candidate.relatedItems.length - 3} 件
                </div>
              )}
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setSelectedCandidate(candidate);
                setProjectData(candidate.suggestedProject);
                setShowPromoteModal(true);
              }}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
            >
              プロジェクト化する
            </button>
            <button
              onClick={() => onReject(candidate.id, '手動却下')}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              却下
            </button>
          </div>
        </div>
      ))}

      {/* プロジェクト化モーダル */}
      {showPromoteModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">プロジェクト詳細設定</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">プロジェクト名</label>
                <input
                  type="text"
                  value={projectData.name || ''}
                  onChange={(e) => setProjectData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">説明</label>
                <textarea
                  value={projectData.description || ''}
                  onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2 border rounded-md h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">フェーズ</label>
                  <select
                    value={projectData.phase || 'concept'}
                    onChange={(e) => setProjectData(prev => ({ ...prev, phase: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="concept">コンセプト</option>
                    <option value="planning">企画</option>
                    <option value="negotiation">商談</option>
                    <option value="proposal">提案</option>
                    <option value="execution">実行</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">優先度</label>
                  <select
                    value={projectData.priority || 'C'}
                    onChange={(e) => setProjectData(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="A">A - 緊急・重要</option>
                    <option value="B">B - 緊急・重要でない</option>
                    <option value="C">C - 緊急でない・重要</option>
                    <option value="D">D - 緊急でない・重要でない</option>
                  </select>
                </div>
              </div>

              {/* 関連項目の統合設定 */}
              <div>
                <h4 className="font-medium mb-2">関連項目の統合</h4>
                <div className="bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                  {selectedCandidate.relatedItems.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-1">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm">{item.type}: {item.title || item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPromoteModal(false)}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                キャンセル
              </button>
              <button
                onClick={handlePromote}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                プロジェクト作成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

### **Phase 6: 高度な自動化（2-3週間）**

#### **6.1 LINE連携強化**
```typescript
// src/lib/line/enhanced-processor.ts
export class EnhancedLineProcessor {
  
  /**
   * ユーザーライクなコマンド検知
   */
  async detectUserIntent(message: string, userId: string): Promise<{
    intent: string;
    confidence: number;
    entities: any;
    context?: string;
  }> {
    // 文脈を考慮した意図検知
    const context = await this.getUserContext(userId);
    
    // 自然な表現の検知
    const patterns = {
      greeting: /^(こんにちは|おはよう|初めまして|はじめまして)[\s\S]*$/,
      task_creation: /(やる|する|作る|準備|対応|処理)[\s\S]*(必要|した[いの]|しようと思[うい])/,
      schedule_inquiry: /(いつ|何時|スケジュール|予定|空い[てい])/,
      status_update: /(完了|終わ[りっ]た|できた|進捗|状況)/,
      project_discussion: /(プロジェクト|案件|企画|計画)[\s\S]*(について|どう)/
    };

    for (const [intent, pattern] of Object.entries(patterns)) {
      if (pattern.test(message)) {
        const entities = await this.extractEntities(message, intent);
        return {
          intent,
          confidence: 0.8,
          entities,
          context: context?.type
        };
      }
    }

    // 初回連絡の誤判定を回避
    if (context?.isFirstContact && message.includes('初めまして')) {
      return {
        intent: 'greeting',
        confidence: 0.9,
        entities: { is_first_contact: true },
        context: 'first_meeting'
      };
    }

    return {
      intent: 'unknown',
      confidence: 0.1,
      entities: {}
    };
  }

  /**
   * プロジェクト昇華の自動判定
   */
  async evaluateProjectPromotion(relatedItems: any[]): Promise<{
    shouldPromote: boolean;
    confidence: number;
    reasoning: string;
    suggestedProject: any;
  }> {
    // 関連性スコア計算
    const relationshipScore = this.calculateRelationshipScore(relatedItems);
    
    // 継続性評価
    const continuityScore = this.calculateContinuityScore(relatedItems);
    
    // 規模評価
    const scaleScore = this.calculateScaleScore(relatedItems);
    
    const totalScore = (relationshipScore * 0.4) + (continuityScore * 0.3) + (scaleScore * 0.3);
    
    const shouldPromote = totalScore > 0.7;
    
    return {
      shouldPromote,
      confidence: totalScore,
      reasoning: `関連性: ${relationshipScore.toFixed(2)}, 継続性: ${continuityScore.toFixed(2)}, 規模: ${scaleScore.toFixed(2)}`,
      suggestedProject: shouldPromote ? this.generateProjectSuggestion(relatedItems) : null
    };
  }

  /**
   * KGI自動設定システム
   */
  async autoSetKGI(project: any): Promise<{ kgi: string; confidence: number }> {
    const tasks = await this.getProjectTasks(project.id);
    const connections = await this.getProjectConnections(project.id);
    const appointments = await this.getProjectAppointments(project.id);

    // ISSUE度の高いタスクを特定
    const highIssueTasks = tasks.filter(t => t.aiIssueLevel === 'A' || t.priority === 'A');
    
    // ビジネス成果の推定
    const businessOutcome = this.inferBusinessOutcome(project, connections, appointments);
    
    // KGI生成
    let kgi = '';
    if (businessOutcome.type === 'sales') {
      kgi = `${businessOutcome.estimatedValue}万円の売上達成`;
    } else if (businessOutcome.type === 'partnership') {
      kgi = `${connections.length}社との戦略的パートナーシップ構築`;
    } else if (businessOutcome.type === 'product') {
      kgi = `プロダクトリリースと${businessOutcome.estimatedUsers || 1000}ユーザー獲得`;
    } else {
      kgi = `プロジェクト完了と定量的成果創出`;
    }

    return {
      kgi,
      confidence: businessOutcome.confidence
    };
  }

  private async getUserContext(userId: string): Promise<any> {
    // ユーザーの最近の会話履歴を分析
    const recentLogs = await prismaDataService.getRecentLineIntegrationLogs(userId, 10);
    
    return {
      type: this.inferContextType(recentLogs),
      isFirstContact: recentLogs.length === 0,
      recentTopics: this.extractRecentTopics(recentLogs)
    };
  }

  private calculateRelationshipScore(items: any[]): number {
    // アイテム間の関連性を評価
    const keywords = items.flatMap(item => 
      (item.title + ' ' + (item.description || '')).toLowerCase().split(/\s+/)
    );
    
    const uniqueKeywords = new Set(keywords);
    const keywordFrequency = keywords.length / uniqueKeywords.size;
    
    return Math.min(1.0, keywordFrequency / 3); // 3回以上の重複で高スコア
  }

  private calculateContinuityScore(items: any[]): number {
    // 時系列での継続性を評価
    const dates = items.map(item => new Date(item.createdAt)).sort();
    const daySpans = [];
    
    for (let i = 1; i < dates.length; i++) {
      const span = (dates[i].getTime() - dates[i-1].getTime()) / (1000 * 60 * 60 * 24);
      daySpans.push(span);
    }
    
    const avgSpan = daySpans.reduce((sum, span) => sum + span, 0) / daySpans.length;
    return Math.max(0, 1 - (avgSpan / 14)); // 2週間間隔以下で高スコア
  }

  private calculateScaleScore(items: any[]): number {
    // プロジェクト規模を評価
    const taskCount = items.filter(i => i.type === 'task').length;
    const appointmentCount = items.filter(i => i.type === 'appointment').length;
    const connectionCount = items.filter(i => i.type === 'connection').length;
    
    const totalComplexity = taskCount + (appointmentCount * 2) + (connectionCount * 1.5);
    return Math.min(1.0, totalComplexity / 10);
  }

  private generateProjectSuggestion(items: any[]): any {
    const commonKeywords = this.extractCommonKeywords(items);
    const primaryKeyword = commonKeywords[0] || 'プロジェクト';
    
    return {
      name: `${primaryKeyword}プロジェクト`,
      description: `${commonKeywords.join('、')}に関する包括的なプロジェクト`,
      phase: 'planning',
      priority: 'B'
    };
  }

  private extractCommonKeywords(items: any[]): string[] {
    const allText = items.map(item => 
      `${item.title || item.name || ''} ${item.description || ''}`
    ).join(' ');
    
    // 日本語キーワード抽出の簡易実装
    const keywords = allText.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]{2,}/g) || [];
    const frequency = keywords.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([word]) => word);
  }

  private inferBusinessOutcome(project: any, connections: any[], appointments: any[]): any {
    const salesKeywords = ['売上', '収益', '販売', '営業'];
    const partnershipKeywords = ['連携', 'パートナー', '協業', '提携'];
    const productKeywords = ['開発', 'リリース', 'ローンチ', 'サービス'];
    
    const projectText = `${project.name} ${project.description}`.toLowerCase();
    
    if (salesKeywords.some(kw => projectText.includes(kw))) {
      return {
        type: 'sales',
        estimatedValue: this.estimateSalesValue(connections, appointments),
        confidence: 0.8
      };
    } else if (partnershipKeywords.some(kw => projectText.includes(kw))) {
      return {
        type: 'partnership',
        confidence: 0.7
      };
    } else if (productKeywords.some(kw => projectText.includes(kw))) {
      return {
        type: 'product',
        estimatedUsers: 1000,
        confidence: 0.6
      };
    }
    
    return {
      type: 'general',
      confidence: 0.5
    };
  }

  private estimateSalesValue(connections: any[], appointments: any[]): number {
    // 簡易的な売上推定
    const companyCount = new Set(connections.map(c => c.company)).size;
    const scheduledAppointments = appointments.filter(a => a.status === 'scheduled').length;
    
    return Math.max(100, companyCount * 500 + scheduledAppointments * 200);
  }
}
```

---

## ⚠️ 重要な注意事項（エンジニア向け）

### **既存実装の重複回避**

#### **✅ 既に実装済み - 実装不要:**
1. **基本CRUD API** - 全エンティティ（tasks, projects, users, calendar, appointments, connections, knowledge）
2. **Kanban UI** - 4種類完備（ステータス別、ユーザー別、プロジェクト別、期限別）
3. **LINE Bot基盤** - webhook, Gemini AI統合、自然言語処理
4. **データベース構造** - Prisma + PostgreSQL完備
5. **認証システム** - **未実装**（全API公開状態）
6. **レスポンシブUI** - Tailwind CSS完備

#### **❌ 実装禁止行為:**
1. **既存APIの破壊的変更** - エンドポイント削除・大幅変更禁止
2. **既存データベーステーブル削除** - DROP TABLE禁止
3. **既存UIコンポーネントの削除** - 代替なしの削除禁止
4. **認証機能の勝手な追加** - セキュリティ要件確認必須

### **安全な実装ルール**

#### **データベース変更:**
```sql
-- ✅ 安全（追加のみ）
ALTER TABLE users ADD COLUMN new_field JSON DEFAULT '{}';

-- ❌ 危険（既存データ破壊）
ALTER TABLE users DROP COLUMN email;
DROP TABLE tasks;
```

#### **API拡張:**
```typescript
// ✅ 安全（新規エンドポイント）
export async function GET() { /* 新機能 */ }

// ❌ 危険（既存の破壊的変更）
export async function GET() { 
  // 既存のレスポンス形式を変更
  return { newFormat: 'different' }; // 既存UIが壊れる
}
```

#### **UI拡張:**
```typescript
// ✅ 安全（新規コンポーネント）
export default function NewFeatureComponent() { }

// ❌ 危険（既存削除）
// export default function KanbanBoard() { } を削除
```

### **実装前必須チェック**

#### **Phase開始前:**
1. **現在のブランチ確認** - `git branch`でブランチ状態確認
2. **データベースバックアップ** - `pg_dump`でフルバックアップ
3. **既存機能テスト** - 全ページの動作確認
4. **依存関係確認** - `npm list`で競合確認

#### **各変更後:**
1. **マイグレーション確認** - `npx prisma migrate dev`成功確認
2. **型生成** - `npx prisma generate`実行
3. **コンパイル確認** - `npm run build`成功確認
4. **既存機能回帰テスト** - 主要画面の動作確認

### **ロールバック手順**

#### **データベースロールバック:**
```bash
# マイグレーション前に戻す
npx prisma migrate reset
# 特定バージョンに戻す
psql $DATABASE_URL -c "RESTORE DATABASE from 'backup.sql'"
```

#### **コードロールバック:**
```bash
# 特定コミットに戻す
git reset --hard <commit-hash>
# 特定ファイルのみ戻す
git checkout HEAD~1 -- src/specific/file.ts
```

---

## 📊 検証・テスト計画

### **Phase完了時の確認項目**

#### **Phase 1完了時:**
- [ ] 新規テーブル作成成功
- [ ] 既存データ保持確認
- [ ] 新規API エンドポイント動作確認
- [ ] 既存UI全画面正常動作
- [ ] LINE Bot動作継続確認

#### **Phase 2完了時:**
- [ ] AI評価API正常動作
- [ ] リソースウェイト計算精度確認
- [ ] 成功確率算出結果妥当性
- [ ] 既存タスク管理機能無影響

#### **Phase 3完了時:**
- [ ] プロジェクト関係性マッピング動作
- [ ] アクティビティスコア更新確認
- [ ] 既存プロジェクト・タスク関係保持

#### **Phase 4完了時:**
- [ ] アラート生成・配信動作
- [ ] LINE通知配信成功
- [ ] アラート管理UI動作
- [ ] 既存通知機能無影響

#### **Phase 5完了時:**
- [ ] 新規UI全コンポーネント動作
- [ ] 既存UI互換性維持
- [ ] レスポンシブ対応確認
- [ ] ユーザビリティテスト

#### **Phase 6完了時:**
- [ ] 高度自動化機能動作
- [ ] LINE連携強化確認
- [ ] 全システム統合テスト
- [ ] パフォーマンステスト

### **継続監視項目**
- データベース接続性能
- API レスポンス時間
- メモリ使用量
- エラー発生率
- ユーザー満足度

---

## 🎯 成功指標

### **定量指標**
- アラート精度: 90%以上
- AI評価精度: 85%以上
- プロジェクト昇華精度: 80%以上
- システムレスポンス: 2秒以内
- 稼働率: 99.5%以上

### **定性指標**
- ユーザー操作コスト削減体感
- プロジェクト管理効率向上
- アラート有用性認識
- AI判定信頼性評価

---

## 📝 変更履歴

- **2025-06-14**: 初版作成、完全実装計画策定
- **Phase開始時**: 各Phase詳細更新予定

---

**この実装計画は、既存システムの安全性を最優先に、段階的で確実なアップグレードを実現するための完全ガイドです。**