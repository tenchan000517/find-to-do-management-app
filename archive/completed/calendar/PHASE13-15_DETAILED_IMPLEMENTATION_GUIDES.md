# Phase 13-15: AI分析・UI統合・最適化 詳細実装手順書

**Phase**: 13-15 / 15  
**目標**: AI分析エンジン・統合UI・システム最適化の完全実装  
**期間**: 12-16日（Phase 13: 5-7日、Phase 14: 4-6日、Phase 15: 3-5日）  
**前提条件**: Phase 11-12完了（同期システム稼働確認済み）

---

## 🎯 Phase 13: AI分析・レコメンドエンジン

### 実装目標
- ✅ Gemini AIによるドキュメント内容分析
- ✅ タスク・予定・プロジェクト自動抽出
- ✅ レコメンデーション管理システム
- ✅ 信頼度スコア・自動期限切れ機能

### ステップ1: データベーススキーマ追加

#### 1.1 レコメンドテーブル作成
```sql
-- prisma/schema.prisma に追加

model ai_recommendations {
  id                String   @id @default(cuid())
  knowledge_item_id String
  recommendation_type String  // 'task', 'schedule', 'project'
  content           String
  confidence_score  Decimal  @db.Decimal(3,2)
  extracted_data    Json
  status           String   @default("pending") // pending, accepted, rejected, expired
  expires_at       DateTime @default(dbgenerated("NOW() + INTERVAL '7 days'"))
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt

  // リレーション
  knowledge_item   knowledge_items @relation(fields: [knowledge_item_id], references: [id], onDelete: Cascade)

  @@index([status, expires_at], name: "idx_recommendations_status_expires")
  @@index([recommendation_type], name: "idx_recommendations_type")
  @@index([created_at], name: "idx_recommendations_created")
  @@index([confidence_score], name: "idx_recommendations_confidence")
  @@map("ai_recommendations")
}

// knowledge_items にリレーション追加
model knowledge_items {
  // 既存フィールド...
  
  // リレーション追加
  ai_recommendations ai_recommendations[]
  
  // その他既存設定...
}
```

#### 1.2 マイグレーション実行
```bash
npx prisma generate
npx prisma migrate dev --name add_ai_recommendations
npx prisma db push
```

### ステップ2: AI分析エンジン実装

#### 2.1 コア分析エンジン
```typescript
// src/lib/ai/document-analysis-engine.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface ExtractedTask {
  title: string;
  description: string;
  assignee?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  estimatedHours?: number;
}

export interface ExtractedSchedule {
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  location?: string;
  participants?: string[];
  isAllDay: boolean;
}

export interface ExtractedProject {
  title: string;
  description: string;
  objective: string;
  startDate?: string;
  endDate?: string;
  stakeholders?: string[];
  budget?: number;
  kpis?: string[];
}

export interface AnalysisResult {
  summary: string;
  categories: string[];
  tasks: ExtractedTask[];
  schedules: ExtractedSchedule[];
  projects: ExtractedProject[];
  confidence_scores: {
    overall: number;
    tasks: number;
    schedules: number;
    projects: number;
  };
  processing_time: number;
}

export class DocumentAnalysisEngine {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  async analyzeContent(content: string, documentTitle: string = ''): Promise<AnalysisResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🤖 AI分析開始: ${documentTitle}`);
      
      const prompt = this.buildAnalysisPrompt(content, documentTitle);
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();
      
      // JSON解析・検証
      const analysis = this.parseAndValidateResponse(responseText);
      
      console.log(`✅ AI分析完了: ${analysis.tasks.length}タスク, ${analysis.schedules.length}予定, ${analysis.projects.length}プロジェクト`);
      
      return {
        ...analysis,
        processing_time: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('❌ AI分析エラー:', error);
      
      // フォールバック分析
      return this.performFallbackAnalysis(content, Date.now() - startTime);
    }
  }

  private buildAnalysisPrompt(content: string, documentTitle: string): string {
    return `
あなたは議事録・ドキュメント分析の専門AIです。以下の文書を分析し、JSON形式で回答してください。

【文書タイトル】: ${documentTitle}

【分析対象テキスト】:
${content}

【出力形式】:
以下のJSON形式で回答してください。必ず有効なJSONフォーマットで出力し、コードブロックは使用しないでください。

{
  "summary": "文書の要約（200文字以内）",
  "categories": ["関連カテゴリ配列"],
  "tasks": [
    {
      "title": "タスク名",
      "description": "詳細説明",
      "assignee": "担当者名（明記されている場合のみ）",
      "dueDate": "期限（YYYY-MM-DD形式、判明する場合のみ）",
      "priority": "low|medium|high",
      "estimatedHours": 推定時間（数値、判明する場合のみ）
    }
  ],
  "schedules": [
    {
      "title": "予定・イベント名",
      "description": "詳細説明",
      "startDate": "開始日時（YYYY-MM-DDTHH:mm:ss形式）",
      "endDate": "終了日時（判明する場合のみ）",
      "location": "場所（判明する場合のみ）",
      "participants": ["参加者配列"],
      "isAllDay": true/false
    }
  ],
  "projects": [
    {
      "title": "プロジェクト名",
      "description": "プロジェクト概要",
      "objective": "目的・目標",
      "startDate": "開始予定日（判明する場合のみ）",
      "endDate": "終了予定日（判明する場合のみ）",
      "stakeholders": ["関係者配列"],
      "budget": 予算額（数値、判明する場合のみ）,
      "kpis": ["KPI指標配列"]
    }
  ],
  "confidence_scores": {
    "overall": 0.0-1.0,
    "tasks": 0.0-1.0,
    "schedules": 0.0-1.0,
    "projects": 0.0-1.0
  }
}

【分析のポイント】:
1. 明確に記載されている情報のみを抽出
2. 推測による補完は最小限に留める
3. 信頼度スコアは抽出内容の確実性を反映
4. 日本語の自然な表現を保持
5. 具体的でアクショナブルな内容を優先
`;
  }

  private parseAndValidateResponse(responseText: string): Omit<AnalysisResult, 'processing_time'> {
    try {
      // JSON抽出（マークダウンコードブロック除去）
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       responseText.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, responseText];
      
      const jsonText = jsonMatch[1] || responseText;
      const parsed = JSON.parse(jsonText.trim());
      
      // 必須フィールド検証・デフォルト値設定
      return {
        summary: parsed.summary || '分析結果の要約が取得できませんでした',
        categories: Array.isArray(parsed.categories) ? parsed.categories : ['その他'],
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks.map(this.validateTask) : [],
        schedules: Array.isArray(parsed.schedules) ? parsed.schedules.map(this.validateSchedule) : [],
        projects: Array.isArray(parsed.projects) ? parsed.projects.map(this.validateProject) : [],
        confidence_scores: {
          overall: this.validateScore(parsed.confidence_scores?.overall, 0.5),
          tasks: this.validateScore(parsed.confidence_scores?.tasks, 0.5),
          schedules: this.validateScore(parsed.confidence_scores?.schedules, 0.5),
          projects: this.validateScore(parsed.confidence_scores?.projects, 0.5)
        }
      };
      
    } catch (error) {
      console.error('JSON解析エラー:', error, 'Response:', responseText);
      throw new Error('AI応答の解析に失敗しました');
    }
  }

  private validateTask(task: any): ExtractedTask {
    return {
      title: task.title || 'タイトル不明',
      description: task.description || '',
      assignee: task.assignee || undefined,
      dueDate: this.validateDate(task.dueDate),
      priority: ['low', 'medium', 'high'].includes(task.priority) ? task.priority : 'medium',
      estimatedHours: typeof task.estimatedHours === 'number' ? task.estimatedHours : undefined
    };
  }

  private validateSchedule(schedule: any): ExtractedSchedule {
    return {
      title: schedule.title || 'タイトル不明',
      description: schedule.description || '',
      startDate: this.validateDate(schedule.startDate) || new Date().toISOString(),
      endDate: this.validateDate(schedule.endDate),
      location: schedule.location || undefined,
      participants: Array.isArray(schedule.participants) ? schedule.participants : [],
      isAllDay: Boolean(schedule.isAllDay)
    };
  }

  private validateProject(project: any): ExtractedProject {
    return {
      title: project.title || 'プロジェクト名不明',
      description: project.description || '',
      objective: project.objective || '',
      startDate: this.validateDate(project.startDate),
      endDate: this.validateDate(project.endDate),
      stakeholders: Array.isArray(project.stakeholders) ? project.stakeholders : [],
      budget: typeof project.budget === 'number' ? project.budget : undefined,
      kpis: Array.isArray(project.kpis) ? project.kpis : []
    };
  }

  private validateDate(dateString: any): string | undefined {
    if (!dateString || typeof dateString !== 'string') return undefined;
    
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? undefined : date.toISOString();
    } catch {
      return undefined;
    }
  }

  private validateScore(score: any, defaultValue: number): number {
    const num = Number(score);
    return isNaN(num) ? defaultValue : Math.max(0, Math.min(1, num));
  }

  private performFallbackAnalysis(content: string, processingTime: number): AnalysisResult {
    console.log('🔄 フォールバック分析実行');
    
    // 簡易キーワード抽出
    const tasks = this.extractTasksByKeywords(content);
    const schedules = this.extractSchedulesByKeywords(content);
    const projects = this.extractProjectsByKeywords(content);
    
    return {
      summary: `フォールバック分析結果（${content.length}文字の文書）`,
      categories: ['自動分析'],
      tasks,
      schedules,
      projects,
      confidence_scores: {
        overall: 0.3,
        tasks: 0.3,
        schedules: 0.3,
        projects: 0.3
      },
      processing_time: processingTime
    };
  }

  private extractTasksByKeywords(content: string): ExtractedTask[] {
    const taskKeywords = /TODO|タスク|課題|作業|実装|対応|修正|改善/gi;
    const matches = content.match(taskKeywords);
    
    if (!matches) return [];
    
    return [{
      title: 'キーワード検出タスク',
      description: `${matches.length}個のタスク関連キーワードを検出`,
      priority: 'medium' as const
    }];
  }

  private extractSchedulesByKeywords(content: string): ExtractedSchedule[] {
    const scheduleKeywords = /会議|ミーティング|打ち合わせ|面談|イベント|\d+月\d+日|\d+時/gi;
    const matches = content.match(scheduleKeywords);
    
    if (!matches) return [];
    
    return [{
      title: 'キーワード検出予定',
      description: `${matches.length}個の予定関連キーワードを検出`,
      startDate: new Date().toISOString(),
      participants: [],
      isAllDay: false
    }];
  }

  private extractProjectsByKeywords(content: string): ExtractedProject[] {
    const projectKeywords = /プロジェクト|企画|計画|開発|構築|システム|サービス/gi;
    const matches = content.match(projectKeywords);
    
    if (!matches) return [];
    
    return [{
      title: 'キーワード検出プロジェクト',
      description: `${matches.length}個のプロジェクト関連キーワードを検出`,
      objective: 'キーワード分析による自動検出',
      stakeholders: [],
      kpis: []
    }];
  }
}

export const documentAnalysisEngine = new DocumentAnalysisEngine();
```

#### 2.2 レコメンデーション管理サービス
```typescript
// src/lib/ai/recommendation-service.ts
import { PrismaClient } from '@prisma/client';
import { documentAnalysisEngine, AnalysisResult } from './document-analysis-engine';

const prisma = new PrismaClient();

export interface RecommendationCreationResult {
  recommendationsCreated: number;
  tasksCreated: number;
  schedulesCreated: number;
  projectsCreated: number;
  averageConfidence: number;
}

export class RecommendationService {
  // ナレッジアイテムからレコメンド生成
  async generateRecommendationsFromKnowledge(knowledgeItemId: string): Promise<RecommendationCreationResult> {
    try {
      console.log(`🔮 レコメンド生成開始: ${knowledgeItemId}`);
      
      // ナレッジアイテム取得
      const knowledgeItem = await prisma.knowledge_items.findUnique({
        where: { id: knowledgeItemId }
      });

      if (!knowledgeItem) {
        throw new Error('ナレッジアイテムが見つかりません');
      }

      // 既存レコメンド削除（重複回避）
      await this.clearExistingRecommendations(knowledgeItemId);

      // AI分析実行
      const analysis = await documentAnalysisEngine.analyzeContent(
        knowledgeItem.content,
        knowledgeItem.title
      );

      // レコメンド作成・保存
      const result = await this.createRecommendationsFromAnalysis(
        knowledgeItemId,
        analysis
      );

      console.log(`✅ レコメンド生成完了: ${result.recommendationsCreated}件`);
      return result;

    } catch (error) {
      console.error('❌ レコメンド生成エラー:', error);
      throw error;
    }
  }

  // 分析結果からレコメンド作成
  private async createRecommendationsFromAnalysis(
    knowledgeItemId: string,
    analysis: AnalysisResult
  ): Promise<RecommendationCreationResult> {
    let recommendationsCreated = 0;
    let tasksCreated = 0;
    let schedulesCreated = 0;
    let projectsCreated = 0;
    const confidenceScores: number[] = [];

    // タスクレコメンド作成
    for (const task of analysis.tasks) {
      await prisma.ai_recommendations.create({
        data: {
          knowledge_item_id: knowledgeItemId,
          recommendation_type: 'task',
          content: task.title,
          confidence_score: analysis.confidence_scores.tasks,
          extracted_data: {
            title: task.title,
            description: task.description,
            assignee: task.assignee,
            dueDate: task.dueDate,
            priority: task.priority,
            estimatedHours: task.estimatedHours,
            source: 'ai_analysis'
          }
        }
      });
      
      tasksCreated++;
      recommendationsCreated++;
      confidenceScores.push(analysis.confidence_scores.tasks);
    }

    // 予定レコメンド作成
    for (const schedule of analysis.schedules) {
      await prisma.ai_recommendations.create({
        data: {
          knowledge_item_id: knowledgeItemId,
          recommendation_type: 'schedule',
          content: schedule.title,
          confidence_score: analysis.confidence_scores.schedules,
          extracted_data: {
            title: schedule.title,
            description: schedule.description,
            startDate: schedule.startDate,
            endDate: schedule.endDate,
            location: schedule.location,
            participants: schedule.participants,
            isAllDay: schedule.isAllDay,
            source: 'ai_analysis'
          }
        }
      });
      
      schedulesCreated++;
      recommendationsCreated++;
      confidenceScores.push(analysis.confidence_scores.schedules);
    }

    // プロジェクトレコメンド作成
    for (const project of analysis.projects) {
      await prisma.ai_recommendations.create({
        data: {
          knowledge_item_id: knowledgeItemId,
          recommendation_type: 'project',
          content: project.title,
          confidence_score: analysis.confidence_scores.projects,
          extracted_data: {
            title: project.title,
            description: project.description,
            objective: project.objective,
            startDate: project.startDate,
            endDate: project.endDate,
            stakeholders: project.stakeholders,
            budget: project.budget,
            kpis: project.kpis,
            source: 'ai_analysis'
          }
        }
      });
      
      projectsCreated++;
      recommendationsCreated++;
      confidenceScores.push(analysis.confidence_scores.projects);
    }

    const averageConfidence = confidenceScores.length > 0 
      ? confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length
      : 0;

    return {
      recommendationsCreated,
      tasksCreated,
      schedulesCreated,
      projectsCreated,
      averageConfidence
    };
  }

  // レコメンド承認・実データ作成
  async acceptRecommendation(recommendationId: string): Promise<{success: boolean, createdEntity?: any}> {
    try {
      const recommendation = await prisma.ai_recommendations.findUnique({
        where: { id: recommendationId }
      });

      if (!recommendation || recommendation.status !== 'pending') {
        throw new Error('有効なレコメンドが見つかりません');
      }

      const extractedData = recommendation.extracted_data as any;
      let createdEntity = null;

      // タイプ別に実データ作成
      switch (recommendation.recommendation_type) {
        case 'task':
          createdEntity = await this.createTaskFromRecommendation(extractedData);
          break;
        case 'schedule':
          createdEntity = await this.createScheduleFromRecommendation(extractedData);
          break;
        case 'project':
          createdEntity = await this.createProjectFromRecommendation(extractedData);
          break;
      }

      // レコメンドステータス更新
      await prisma.ai_recommendations.update({
        where: { id: recommendationId },
        data: { status: 'accepted' }
      });

      console.log(`✅ レコメンド承認完了: ${recommendation.recommendation_type} - ${recommendation.content}`);

      return { success: true, createdEntity };

    } catch (error) {
      console.error('❌ レコメンド承認エラー:', error);
      return { success: false };
    }
  }

  private async createTaskFromRecommendation(data: any): Promise<any> {
    return await prisma.tasks.create({
      data: {
        id: `ai_task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: data.title,
        description: data.description || '',
        priority: data.priority || 'medium',
        status: 'not_started',
        owner_id: 'ai_generated', // 実際のユーザーIDに置き換え可能
        due_date: data.dueDate ? new Date(data.dueDate) : null,
        estimated_hours: data.estimatedHours || null,
        tags: ['AI生成', 'レコメンド'],
        ai_generated: true
      }
    });
  }

  private async createScheduleFromRecommendation(data: any): Promise<any> {
    return await prisma.personal_schedules.create({
      data: {
        id: `ai_schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: data.title,
        description: data.description || '',
        start_date: new Date(data.startDate),
        end_date: data.endDate ? new Date(data.endDate) : null,
        location: data.location,
        is_all_day: data.isAllDay || false,
        participants: data.participants || [],
        user_id: 'ai_generated', // 実際のユーザーIDに置き換え可能
        tags: ['AI生成', 'レコメンド']
      }
    });
  }

  private async createProjectFromRecommendation(data: any): Promise<any> {
    return await prisma.projects.create({
      data: {
        id: `ai_project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: data.title,
        description: data.description,
        objective: data.objective,
        status: 'planning',
        leader_id: 'ai_generated', // 実際のユーザーIDに置き換え可能
        start_date: data.startDate ? new Date(data.startDate) : null,
        end_date: data.endDate ? new Date(data.endDate) : null,
        budget: data.budget || null,
        tags: ['AI生成', 'レコメンド'],
        ai_generated: true
      }
    });
  }

  // レコメンド却下
  async rejectRecommendation(recommendationId: string): Promise<boolean> {
    try {
      await prisma.ai_recommendations.update({
        where: { id: recommendationId },
        data: { status: 'rejected' }
      });
      return true;
    } catch (error) {
      console.error('レコメンド却下エラー:', error);
      return false;
    }
  }

  // 期限切れレコメンド削除
  async cleanupExpiredRecommendations(): Promise<number> {
    try {
      const result = await prisma.ai_recommendations.updateMany({
        where: {
          expires_at: { lt: new Date() },
          status: 'pending'
        },
        data: { status: 'expired' }
      });

      console.log(`🧹 期限切れレコメンド処理: ${result.count}件`);
      return result.count;
    } catch (error) {
      console.error('期限切れ処理エラー:', error);
      return 0;
    }
  }

  // 既存レコメンド削除
  private async clearExistingRecommendations(knowledgeItemId: string): Promise<void> {
    await prisma.ai_recommendations.deleteMany({
      where: {
        knowledge_item_id: knowledgeItemId,
        status: 'pending'
      }
    });
  }

  // レコメンド統計取得
  async getRecommendationStats(): Promise<any> {
    const stats = await prisma.ai_recommendations.groupBy({
      by: ['recommendation_type', 'status'],
      _count: { id: true },
      _avg: { confidence_score: true }
    });

    const totalRecommendations = await prisma.ai_recommendations.count();
    const pendingCount = await prisma.ai_recommendations.count({
      where: { status: 'pending' }
    });

    return {
      totalRecommendations,
      pendingCount,
      breakdown: stats,
      lastCleanup: new Date().toISOString()
    };
  }
}

export const recommendationService = new RecommendationService();
```

### ステップ3: API実装

#### 3.1 AI分析API
```typescript
// src/app/api/ai/document-analysis/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { documentAnalysisEngine } from '@/lib/ai/document-analysis-engine';
import { recommendationService } from '@/lib/ai/recommendation-service';

export async function POST(request: NextRequest) {
  try {
    const { content, documentTitle, knowledgeItemId, generateRecommendations } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'コンテンツが必要です' },
        { status: 400 }
      );
    }

    // AI分析実行
    const analysis = await documentAnalysisEngine.analyzeContent(content, documentTitle);

    let recommendationResult = null;

    // レコメンド生成オプション
    if (generateRecommendations && knowledgeItemId) {
      try {
        recommendationResult = await recommendationService.generateRecommendationsFromKnowledge(knowledgeItemId);
      } catch (error) {
        console.error('レコメンド生成エラー:', error);
        // 分析結果は返すが、レコメンド生成エラーは別途処理
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
      recommendations: recommendationResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Document analysis API error:', error);
    return NextResponse.json(
      { error: error.message || 'AI分析に失敗しました' },
      { status: 500 }
    );
  }
}
```

#### 3.2 レコメンド管理API
```typescript
// src/app/api/recommendations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { recommendationService } from '@/lib/ai/recommendation-service';

const prisma = new PrismaClient();

// レコメンド一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = { status };
    if (type) where.recommendation_type = type;

    const recommendations = await prisma.ai_recommendations.findMany({
      where,
      include: {
        knowledge_item: {
          select: {
            title: true,
            source_url: true,
            source_type: true
          }
        }
      },
      orderBy: [
        { confidence_score: 'desc' },
        { created_at: 'desc' }
      ],
      take: limit
    });

    const stats = await recommendationService.getRecommendationStats();

    return NextResponse.json({
      recommendations,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Recommendations fetch error:', error);
    return NextResponse.json(
      { error: 'レコメンド取得に失敗しました' },
      { status: 500 }
    );
  }
}

// レコメンド操作
export async function POST(request: NextRequest) {
  try {
    const { action, recommendationId, recommendationIds } = await request.json();

    switch (action) {
      case 'accept':
        if (!recommendationId) {
          return NextResponse.json({ error: 'recommendationId が必要です' }, { status: 400 });
        }
        
        const acceptResult = await recommendationService.acceptRecommendation(recommendationId);
        return NextResponse.json(acceptResult);

      case 'reject':
        if (!recommendationId) {
          return NextResponse.json({ error: 'recommendationId が必要です' }, { status: 400 });
        }
        
        const rejectResult = await recommendationService.rejectRecommendation(recommendationId);
        return NextResponse.json({ success: rejectResult });

      case 'batch_accept':
        if (!Array.isArray(recommendationIds)) {
          return NextResponse.json({ error: 'recommendationIds 配列が必要です' }, { status: 400 });
        }
        
        const batchResults = await Promise.allSettled(
          recommendationIds.map(id => recommendationService.acceptRecommendation(id))
        );
        
        return NextResponse.json({
          results: batchResults,
          successful: batchResults.filter(r => r.status === 'fulfilled' && r.value.success).length,
          failed: batchResults.filter(r => r.status === 'rejected' || !r.value?.success).length
        });

      case 'cleanup_expired':
        const cleanedCount = await recommendationService.cleanupExpiredRecommendations();
        return NextResponse.json({
          success: true,
          cleanedCount,
          message: `${cleanedCount}件の期限切れレコメンドを処理しました`
        });

      default:
        return NextResponse.json({ error: '無効なアクション' }, { status: 400 });
    }

  } catch (error) {
    console.error('Recommendation action error:', error);
    return NextResponse.json(
      { error: error.message || 'レコメンド操作に失敗しました' },
      { status: 500 }
    );
  }
}
```

---

## 🎨 Phase 14: UI統合・ダッシュボード強化

### 実装目標
- ✅ 統合ナレッジ管理画面
- ✅ AIレコメンドダッシュボード
- ✅ レスポンシブデザイン対応
- ✅ ユーザビリティ向上

### ステップ1: レコメンドダッシュボード

#### 1.1 AIレコメンドパネル
```tsx
// src/components/ai/AIRecommendationPanel.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Brain, 
  Calendar, 
  CheckSquare, 
  FolderOpen,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface AIRecommendation {
  id: string;
  recommendation_type: 'task' | 'schedule' | 'project';
  content: string;
  confidence_score: number;
  extracted_data: any;
  status: string;
  expires_at: string;
  created_at: string;
  knowledge_item: {
    title: string;
    source_url?: string;
    source_type: string;
  };
}

export default function AIRecommendationPanel() {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      const response = await fetch('/api/recommendations?limit=100');
      const data = await response.json();
      
      setRecommendations(data.recommendations);
      setStats(data.stats);
    } catch (error) {
      console.error('レコメンド読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (recommendationId: string) => {
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept', recommendationId })
      });

      if (response.ok) {
        await loadRecommendations(); // リロード
      }
    } catch (error) {
      console.error('承認エラー:', error);
    }
  };

  const handleReject = async (recommendationId: string) => {
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', recommendationId })
      });

      if (response.ok) {
        await loadRecommendations(); // リロード
      }
    } catch (error) {
      console.error('却下エラー:', error);
    }
  };

  const handleBatchAccept = async (type: string) => {
    const targetRecommendations = recommendations
      .filter(r => r.recommendation_type === type && r.status === 'pending')
      .map(r => r.id);

    if (targetRecommendations.length === 0) return;

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'batch_accept', 
          recommendationIds: targetRecommendations 
        })
      });

      if (response.ok) {
        await loadRecommendations();
      }
    } catch (error) {
      console.error('一括承認エラー:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task': return <CheckSquare size={16} />;
      case 'schedule': return <Calendar size={16} />;
      case 'project': return <FolderOpen size={16} />;
      default: return <Brain size={16} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'task': return 'bg-blue-100 text-blue-800';
      case 'schedule': return 'bg-green-100 text-green-800';
      case 'project': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filterRecommendations = (type: string) => {
    if (type === 'all') return recommendations;
    return recommendations.filter(r => r.recommendation_type === type);
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <Brain className="animate-pulse" size={20} />
            AI レコメンドを読み込み中...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 統計サマリー */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Brain className="text-blue-500" size={20} />
                <div>
                  <div className="text-2xl font-bold">{stats.totalRecommendations}</div>
                  <div className="text-sm text-gray-500">総レコメンド</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="text-orange-500" size={20} />
                <div>
                  <div className="text-2xl font-bold">{stats.pendingCount}</div>
                  <div className="text-sm text-gray-500">未処理</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-green-500" size={20} />
                <div>
                  <div className="text-2xl font-bold">
                    {Math.round((stats.breakdown.find(b => b.status === 'accepted')?._count.id || 0) / stats.totalRecommendations * 100)}%
                  </div>
                  <div className="text-sm text-gray-500">採用率</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <Button
                onClick={() => fetch('/api/recommendations', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'cleanup_expired' })
                }).then(() => loadRecommendations())}
                className="w-full"
                variant="outline"
                size="sm"
              >
                期限切れ整理
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* レコメンド一覧 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain size={20} />
            AI レコメンド
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">全て ({recommendations.length})</TabsTrigger>
              <TabsTrigger value="task">
                タスク ({recommendations.filter(r => r.recommendation_type === 'task').length})
              </TabsTrigger>
              <TabsTrigger value="schedule">
                予定 ({recommendations.filter(r => r.recommendation_type === 'schedule').length})
              </TabsTrigger>
              <TabsTrigger value="project">
                プロジェクト ({recommendations.filter(r => r.recommendation_type === 'project').length})
              </TabsTrigger>
            </TabsList>

            {(['all', 'task', 'schedule', 'project'] as const).map(type => (
              <TabsContent key={type} value={type} className="space-y-4">
                {/* 一括承認ボタン */}
                {type !== 'all' && filterRecommendations(type).some(r => r.status === 'pending') && (
                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleBatchAccept(type)}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <CheckCircle size={14} />
                      {type === 'task' ? 'タスク' : type === 'schedule' ? '予定' : 'プロジェクト'}を一括承認
                    </Button>
                  </div>
                )}

                {/* レコメンドリスト */}
                <div className="space-y-3">
                  {filterRecommendations(type).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {type === 'all' ? 'レコメンドがありません' : `${type}のレコメンドがありません`}
                    </div>
                  ) : (
                    filterRecommendations(type).map(recommendation => (
                      <RecommendationCard
                        key={recommendation.id}
                        recommendation={recommendation}
                        onAccept={handleAccept}
                        onReject={handleReject}
                        getTypeIcon={getTypeIcon}
                        getTypeColor={getTypeColor}
                        getConfidenceColor={getConfidenceColor}
                      />
                    ))
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// レコメンドカードコンポーネント
function RecommendationCard({ 
  recommendation, 
  onAccept, 
  onReject,
  getTypeIcon,
  getTypeColor,
  getConfidenceColor
}: {
  recommendation: AIRecommendation;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  getTypeIcon: (type: string) => React.ReactNode;
  getTypeColor: (type: string) => string;
  getConfidenceColor: (score: number) => string;
}) {
  const isExpired = new Date(recommendation.expires_at) < new Date();
  const daysUntilExpiry = Math.ceil(
    (new Date(recommendation.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card className={`${isExpired ? 'opacity-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* ヘッダー */}
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getTypeColor(recommendation.recommendation_type)}>
                {getTypeIcon(recommendation.recommendation_type)}
                {recommendation.recommendation_type}
              </Badge>
              
              <div className={`text-sm font-medium ${getConfidenceColor(Number(recommendation.confidence_score))}`}>
                信頼度: {Math.round(Number(recommendation.confidence_score) * 100)}%
              </div>
              
              {isExpired && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertCircle size={12} />
                  期限切れ
                </Badge>
              )}
            </div>

            {/* コンテンツ */}
            <h4 className="font-semibold mb-1">{recommendation.content}</h4>
            
            {/* 詳細データ */}
            {recommendation.extracted_data && (
              <div className="text-sm text-gray-600 mb-2">
                {recommendation.extracted_data.description && (
                  <p className="mb-1">{recommendation.extracted_data.description}</p>
                )}
                
                {recommendation.recommendation_type === 'task' && recommendation.extracted_data.assignee && (
                  <p>担当者: {recommendation.extracted_data.assignee}</p>
                )}
                
                {recommendation.recommendation_type === 'schedule' && recommendation.extracted_data.startDate && (
                  <p>日時: {new Date(recommendation.extracted_data.startDate).toLocaleString('ja-JP')}</p>
                )}
              </div>
            )}

            {/* ソース情報 */}
            <div className="text-xs text-gray-500">
              ソース: {recommendation.knowledge_item.title}
              {!isExpired && daysUntilExpiry <= 2 && (
                <span className="ml-2 text-orange-600">
                  あと{daysUntilExpiry}日で期限切れ
                </span>
              )}
            </div>
          </div>

          {/* アクションボタン */}
          {recommendation.status === 'pending' && !isExpired && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onAccept(recommendation.id)}
                className="flex items-center gap-1"
              >
                <CheckCircle size={14} />
                承認
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReject(recommendation.id)}
                className="flex items-center gap-1"
              >
                <XCircle size={14} />
                却下
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### ステップ2: 統合ナレッジ管理画面拡張

#### 2.1 Google Docs統合タブ
```tsx
// src/components/knowledge/GoogleDocsIntegrationTab.tsx に続く...
```

---

## ⚡ Phase 15: 自動化・最適化・運用強化

### 実装目標
- ✅ パフォーマンス最適化
- ✅ 監視・アラート機能
- ✅ 自動化強化
- ✅ 運用マニュアル整備

### ステップ1: パフォーマンス最適化

#### 1.1 キャッシュ戦略強化
```typescript
// src/lib/cache/analysis-cache.ts
import { LRUCache } from 'lru-cache';

interface CacheEntry {
  analysis: any;
  timestamp: number;
  expiresAt: number;
}

class AnalysisCache {
  private cache = new LRUCache<string, CacheEntry>({
    max: 1000,
    ttl: 1000 * 60 * 60 * 2 // 2時間
  });

  generateKey(content: string): string {
    // コンテンツのハッシュ値をキーとして使用
    return Buffer.from(content).toString('base64').slice(0, 50);
  }

  get(content: string): any | null {
    const key = this.generateKey(content);
    const entry = this.cache.get(key);
    
    if (entry && entry.expiresAt > Date.now()) {
      console.log('🎯 キャッシュヒット:', key);
      return entry.analysis;
    }
    
    return null;
  }

  set(content: string, analysis: any, ttl: number = 7200000): void {
    const key = this.generateKey(content);
    const entry: CacheEntry = {
      analysis,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    };
    
    this.cache.set(key, entry);
    console.log('💾 キャッシュ保存:', key);
  }

  clear(): void {
    this.cache.clear();
    console.log('🧹 キャッシュクリア完了');
  }

  getStats(): any {
    return {
      size: this.cache.size,
      maxSize: this.cache.max,
      hitRate: this.cache.calculatedSize
    };
  }
}

export const analysisCache = new AnalysisCache();
```

#### 1.2 バッチ処理最適化
```typescript
// src/lib/optimization/batch-processor.ts
export class OptimizedBatchProcessor {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private concurrency = 3;
  private delayBetweenBatches = 1000;

  async addToQueue(task: () => Promise<any>): Promise<void> {
    this.queue.push(task);
    
    if (!this.processing) {
      this.processBatch();
    }
  }

  private async processBatch(): Promise<void> {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.concurrency);
      
      console.log(`⚡ バッチ処理開始: ${batch.length}件`);
      
      const results = await Promise.allSettled(
        batch.map(task => task())
      );
      
      // エラー集計
      const errors = results
        .filter(r => r.status === 'rejected')
        .map(r => r.reason);
      
      if (errors.length > 0) {
        console.error('⚠️ バッチエラー:', errors);
      }
      
      // レート制限対策
      if (this.queue.length > 0) {
        await this.sleep(this.delayBetweenBatches);
      }
    }
    
    this.processing = false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### ステップ2: 監視・アラート機能

#### 2.1 システムヘルスモニター
```typescript
// src/lib/monitoring/health-monitor.ts
export class SystemHealthMonitor {
  async performSystemCheck(): Promise<any> {
    const checks = {
      database: await this.checkDatabase(),
      googleApi: await this.checkGoogleApi(),
      aiService: await this.checkAiService(),
      storage: await this.checkStorage(),
      performance: await this.checkPerformance()
    };

    const overallHealth = Object.values(checks).every(check => check.status === 'healthy') 
      ? 'healthy' : 'warning';

    return {
      overall: overallHealth,
      timestamp: new Date().toISOString(),
      details: checks
    };
  }

  private async checkDatabase(): Promise<any> {
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - start;

      return {
        status: responseTime < 1000 ? 'healthy' : 'warning',
        responseTime,
        message: `データベース応答時間: ${responseTime}ms`
      };
    } catch (error) {
      return {
        status: 'error',
        message: `データベース接続エラー: ${error.message}`
      };
    }
  }

  private async checkGoogleApi(): Promise<any> {
    try {
      // Google API接続テスト
      const testResult = await googleDocsClient.verifyAccess('test');
      
      return {
        status: 'healthy',
        message: 'Google API接続正常'
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Google API接続エラー: ${error.message}`
      };
    }
  }

  private async checkAiService(): Promise<any> {
    try {
      const start = Date.now();
      await documentAnalysisEngine.analyzeContent('テストコンテンツ', 'ヘルスチェック');
      const responseTime = Date.now() - start;

      return {
        status: responseTime < 10000 ? 'healthy' : 'warning',
        responseTime,
        message: `AI応答時間: ${responseTime}ms`
      };
    } catch (error) {
      return {
        status: 'error',
        message: `AI サービスエラー: ${error.message}`
      };
    }
  }
}
```

---

## ✅ Phase 13-15 完了チェックリスト

### Phase 13 完了確認
- [ ] AI分析エンジン実装・動作確認
- [ ] レコメンド生成・管理システム稼働確認
- [ ] データベーススキーマ追加・整合性確認
- [ ] API実装・動作確認

### Phase 14 完了確認
- [ ] 統合UI実装・レスポンシブ対応
- [ ] ダッシュボード機能実装・ユーザビリティ確認
- [ ] 既存機能統合・完全動作確認

### Phase 15 完了確認
- [ ] パフォーマンス最適化・監視機能実装
- [ ] 自動化強化・運用マニュアル整備
- [ ] 長期運用テスト・システム安定性確認

---

**🚀 Phase 13-15完了により、Google Docs議事録自動処理システムが完全に完成します！**