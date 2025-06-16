// レコメンドエンジン - AI分析結果から実用的な提案を生成
import { PrismaClient } from '@prisma/client';
import { AdvancedAnalysisResult, HighConfidenceTask, HighConfidenceEvent, ProjectCandidate, HighConfidenceConnection } from './advanced-content-analyzer';

const prisma = new PrismaClient();

// レコメンデーション型定義
export interface Recommendation {
  id: string;
  type: 'TASK_CREATION' | 'PROJECT_CREATION' | 'EVENT_SCHEDULING' | 'APPOINTMENT_BOOKING' | 'CONTACT_ADDITION' | 'KNOWLEDGE_TAGGING' | 'PRIORITY_ADJUSTMENT';
  title: string;
  description: string;
  suggestedData: any;
  relevanceScore: number;
  priorityScore: number;
  implementationEase: number;
  estimatedImpact: 'LOW' | 'MEDIUM' | 'HIGH';
  quickAction?: QuickAction;
}

export interface QuickAction {
  label: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH';
  payload: any;
}

// レコメンドエンジンクラス
export class RecommendationEngine {
  private static instance: RecommendationEngine;
  
  static getInstance(): RecommendationEngine {
    if (!this.instance) {
      this.instance = new RecommendationEngine();
    }
    return this.instance;
  }

  // AI分析結果からレコメンデーション生成
  async generateRecommendations(
    analysisResult: AdvancedAnalysisResult,
    sourceDocumentId: string,
    analysisId: string
  ): Promise<Recommendation[]> {
    console.log(`💡 レコメンド生成開始: 信頼度=${analysisResult.overallInsights.confidence}`);

    const recommendations: Recommendation[] = [];

    try {
      // 1. タスク作成レコメンド
      const taskRecommendations = await this.generateTaskRecommendations(analysisResult.highConfidenceEntities.tasks, analysisId);
      recommendations.push(...taskRecommendations);

      // 2. イベント/予定作成レコメンド
      const eventRecommendations = await this.generateEventRecommendations(analysisResult.highConfidenceEntities.events, analysisId);
      recommendations.push(...eventRecommendations);

      // 3. プロジェクト作成レコメンド
      const projectRecommendations = await this.generateProjectRecommendations(analysisResult.projectCandidates, analysisId);
      recommendations.push(...projectRecommendations);

      // 4. 連絡先追加レコメンド
      const contactRecommendations = await this.generateContactRecommendations(analysisResult.highConfidenceEntities.connections, analysisId);
      recommendations.push(...contactRecommendations);

      // 5. コンテキストベースレコメンド
      const contextRecommendations = await this.generateContextualRecommendations(analysisResult, sourceDocumentId, analysisId);
      recommendations.push(...contextRecommendations);

      // 6. 優先度・関連性スコアリング
      const scoredRecommendations = await this.scoreRecommendations(recommendations, analysisResult);

      // 7. データベースに保存
      await this.saveRecommendations(scoredRecommendations, analysisId);

      console.log(`✅ レコメンド生成完了: ${scoredRecommendations.length}件`);
      return scoredRecommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);

    } catch (error) {
      console.error('❌ レコメンド生成エラー:', error);
      return [];
    }
  }

  // タスク作成レコメンデーション
  private async generateTaskRecommendations(tasks: HighConfidenceTask[], analysisId: string): Promise<Recommendation[]> {
    return tasks
      .filter(task => task.confidence > 0.5) // 信頼度50%以上のみ
      .map((task, index) => ({
        id: `task_${analysisId}_${index}`,
        type: 'TASK_CREATION' as const,
        title: `タスク作成: ${task.title}`,
        description: `「${task.title}」のタスクを作成することをお勧めします。${task.description ? `詳細: ${task.description}` : ''}`,
        suggestedData: {
          title: task.title,
          description: task.description,
          priority: task.priority,
          dueDate: task.dueDate,
          estimatedHours: task.estimatedHours,
          userId: task.assignee, // 担当者が特定されている場合
          status: 'IDEA'
        },
        relevanceScore: task.confidence * 0.8,
        priorityScore: this.calculateTaskPriorityScore(task),
        implementationEase: 0.9, // タスク作成は比較的簡単
        estimatedImpact: this.estimateTaskImpact(task),
        quickAction: {
          label: 'ワンクリック作成',
          endpoint: '/api/tasks',
          method: 'POST',
          payload: {
            title: task.title,
            description: task.description,
            priority: task.priority,
            dueDate: task.dueDate,
            estimatedHours: task.estimatedHours,
            status: 'IDEA'
          }
        }
      }));
  }

  // イベント作成レコメンデーション
  private async generateEventRecommendations(events: HighConfidenceEvent[], analysisId: string): Promise<Recommendation[]> {
    return events
      .filter(event => event.confidence > 0.6)
      .map((event, index) => ({
        id: `event_${analysisId}_${index}`,
        type: event.type === 'MEETING' ? 'APPOINTMENT_BOOKING' as const : 'EVENT_SCHEDULING' as const,
        title: `${event.type === 'MEETING' ? 'ミーティング予約' : 'イベント登録'}: ${event.title}`,
        description: `「${event.title}」を${event.date}${event.time ? ` ${event.time}` : ''}に${event.type === 'MEETING' ? '予約' : '登録'}することをお勧めします。`,
        suggestedData: {
          title: event.title,
          date: event.date,
          time: event.time,
          endTime: event.endTime,
          location: event.location,
          participants: event.participants,
          type: event.type,
          description: `AI分析により抽出されたイベント。参加者: ${event.participants.join(', ')}`
        },
        relevanceScore: event.confidence * 0.85,
        priorityScore: this.calculateEventPriorityScore(event),
        implementationEase: 0.7,
        estimatedImpact: event.type === 'MEETING' ? 'HIGH' : 'MEDIUM',
        quickAction: {
          label: 'カレンダーに追加',
          endpoint: '/api/calendar',
          method: 'POST',
          payload: {
            title: event.title,
            date: event.date,
            time: event.time,
            endTime: event.endTime,
            type: event.type,
            description: `AI抽出: ${event.participants.join(', ')}`,
            participants: event.participants,
            location: event.location
          }
        }
      }));
  }

  // プロジェクト作成レコメンデーション
  private async generateProjectRecommendations(projects: ProjectCandidate[], analysisId: string): Promise<Recommendation[]> {
    return projects
      .filter(project => project.confidence > 0.4)
      .map((project, index) => ({
        id: `project_${analysisId}_${index}`,
        type: 'PROJECT_CREATION' as const,
        title: `プロジェクト作成: ${project.name}`,
        description: `「${project.name}」のプロジェクトを作成することをお勧めします。${project.description ? `概要: ${project.description}` : ''}`,
        suggestedData: {
          name: project.name,
          description: project.description,
          phase: project.phase,
          priority: project.priority,
          status: 'PLANNING'
        },
        relevanceScore: project.confidence * 0.7,
        priorityScore: this.calculateProjectPriorityScore(project),
        implementationEase: 0.6,
        estimatedImpact: 'HIGH',
        quickAction: {
          label: 'プロジェクト作成',
          endpoint: '/api/projects',
          method: 'POST',
          payload: {
            name: project.name,
            description: project.description,
            phase: project.phase,
            priority: project.priority,
            startDate: new Date().toISOString().split('T')[0],
            status: 'PLANNING'
          }
        }
      }));
  }

  // 連絡先追加レコメンデーション
  private async generateContactRecommendations(contacts: HighConfidenceConnection[], analysisId: string): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    for (const [index, contact] of contacts.entries()) {
      if (contact.confidence < 0.5) continue;

      // 既存連絡先との重複チェック
      const existingConnection = await this.checkExistingContact(contact);
      if (existingConnection) continue;

      recommendations.push({
        id: `contact_${analysisId}_${index}`,
        type: 'CONTACT_ADDITION' as const,
        title: `連絡先追加: ${contact.name}`,
        description: `${contact.name}${contact.company ? ` (${contact.company})` : ''}の連絡先を追加することをお勧めします。`,
        suggestedData: {
          name: contact.name,
          company: contact.company,
          position: contact.position,
          email: contact.email,
          phone: contact.phone,
          type: contact.type,
          description: 'AI分析により抽出された連絡先',
          conversation: '',
          potential: '要評価'
        },
        relevanceScore: contact.confidence * 0.6,
        priorityScore: this.calculateContactPriorityScore(contact),
        implementationEase: 0.8,
        estimatedImpact: 'MEDIUM',
        quickAction: {
          label: '連絡先追加',
          endpoint: '/api/connections',
          method: 'POST',
          payload: {
            name: contact.name,
            company: contact.company || '',
            position: contact.position || '',
            type: contact.type,
            description: 'AI分析により抽出',
            conversation: '',
            potential: '要評価',
            date: new Date().toISOString().split('T')[0],
            location: 'AI抽出'
          }
        }
      });
    }

    return recommendations;
  }

  // コンテキストベースレコメンデーション
  private async generateContextualRecommendations(
    analysisResult: AdvancedAnalysisResult,
    sourceDocumentId: string,
    analysisId: string
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // 1. 緊急度に基づくタグ追加レコメンド
    if (analysisResult.overallInsights.urgencyLevel === 'HIGH' || analysisResult.overallInsights.urgencyLevel === 'CRITICAL') {
      recommendations.push({
        id: `urgent_tag_${analysisId}`,
        type: 'KNOWLEDGE_TAGGING' as const,
        title: '緊急タグの追加',
        description: `このコンテンツは緊急度が${analysisResult.overallInsights.urgencyLevel}です。適切なタグを追加して優先管理することをお勧めします。`,
        suggestedData: {
          documentId: sourceDocumentId,
          tagsToAdd: ['緊急', analysisResult.overallInsights.urgencyLevel.toLowerCase()],
          priority: 'A'
        },
        relevanceScore: 0.8,
        priorityScore: 0.9,
        implementationEase: 0.9,
        estimatedImpact: 'HIGH',
        quickAction: {
          label: '緊急タグ追加',
          endpoint: `/api/google-docs/${sourceDocumentId}/tags`,
          method: 'PATCH',
          payload: {
            tagsToAdd: ['緊急', analysisResult.overallInsights.urgencyLevel.toLowerCase()]
          }
        }
      });
    }

    // 2. ビジネス価値に基づく優先度調整レコメンド
    if (analysisResult.overallInsights.businessValue > 0.7) {
      recommendations.push({
        id: `high_value_${analysisId}`,
        type: 'PRIORITY_ADJUSTMENT' as const,
        title: '高ビジネス価値コンテンツの優先管理',
        description: `このコンテンツは高いビジネス価値(${Math.round(analysisResult.overallInsights.businessValue * 100)}%)を持っています。優先的にフォローアップすることをお勧めします。`,
        suggestedData: {
          documentId: sourceDocumentId,
          priorityLevel: 'A',
          followUpRequired: true
        },
        relevanceScore: analysisResult.overallInsights.businessValue,
        priorityScore: 0.8,
        implementationEase: 0.7,
        estimatedImpact: 'HIGH'
      });
    }

    // 3. キーワードベースの関連コンテンツリンク
    if (analysisResult.overallInsights.keyTopics.length > 3) {
      recommendations.push({
        id: `keyword_link_${analysisId}`,
        type: 'KNOWLEDGE_TAGGING' as const,
        title: 'キーワードタグの自動設定',
        description: `抽出されたキーワード(${analysisResult.overallInsights.keyTopics.slice(0, 3).join(', ')})を自動タグとして設定することで、関連コンテンツとの連携を強化できます。`,
        suggestedData: {
          documentId: sourceDocumentId,
          tagsToAdd: analysisResult.overallInsights.keyTopics.slice(0, 5)
        },
        relevanceScore: 0.6,
        priorityScore: 0.5,
        implementationEase: 0.9,
        estimatedImpact: 'MEDIUM',
        quickAction: {
          label: 'キーワードタグ追加',
          endpoint: `/api/google-docs/${sourceDocumentId}/tags`,
          method: 'PATCH',
          payload: {
            tagsToAdd: analysisResult.overallInsights.keyTopics.slice(0, 5)
          }
        }
      });
    }

    return recommendations;
  }

  // レコメンデーションスコアリング
  private async scoreRecommendations(
    recommendations: Recommendation[],
    analysisResult: AdvancedAnalysisResult
  ): Promise<Recommendation[]> {
    return recommendations.map(rec => {
      // 全体の信頼度を考慮してスコア調整
      const confidenceMultiplier = Math.max(0.3, analysisResult.overallInsights.confidence);
      
      rec.relevanceScore *= confidenceMultiplier;
      rec.priorityScore *= confidenceMultiplier;

      // 緊急度による優先度ブースト
      if (analysisResult.overallInsights.urgencyLevel === 'CRITICAL') {
        rec.priorityScore *= 1.3;
      } else if (analysisResult.overallInsights.urgencyLevel === 'HIGH') {
        rec.priorityScore *= 1.15;
      }

      // ビジネス価値による関連性ブースト
      if (analysisResult.overallInsights.businessValue > 0.6) {
        rec.relevanceScore *= 1.2;
      }

      return rec;
    });
  }

  // データベースへのレコメンデーション保存
  private async saveRecommendations(recommendations: Recommendation[], analysisId: string): Promise<void> {
    try {
      const savePromises = recommendations.map(rec => 
        prisma.content_recommendations.create({
          data: {
            analysis_id: analysisId,
            recommendation_type: rec.type,
            title: rec.title,
            description: rec.description,
            suggested_data: rec.suggestedData,
            target_entity_type: this.mapTypeToEntity(rec.type),
            status: 'PENDING',
            relevance_score: rec.relevanceScore,
            priority_score: rec.priorityScore,
            implementation_ease: rec.implementationEase
          }
        })
      );

      await Promise.all(savePromises);
      console.log(`💾 レコメンデーション保存完了: ${recommendations.length}件`);

    } catch (error) {
      console.error('❌ レコメンデーション保存エラー:', error);
    }
  }

  // ユーティリティ関数群
  private calculateTaskPriorityScore(task: HighConfidenceTask): number {
    let score = 0.5;
    
    if (task.priority === 'A') score += 0.3;
    else if (task.priority === 'B') score += 0.2;
    else if (task.priority === 'C') score += 0.1;
    
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const now = new Date();
      const daysUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysUntilDue <= 1) score += 0.3;
      else if (daysUntilDue <= 7) score += 0.2;
      else if (daysUntilDue <= 30) score += 0.1;
    }
    
    return Math.min(1.0, score);
  }

  private calculateEventPriorityScore(event: HighConfidenceEvent): number {
    let score = 0.5;
    
    if (event.type === 'MEETING') score += 0.2;
    else if (event.type === 'EVENT') score += 0.1;
    
    if (event.participants.length > 2) score += 0.2;
    if (event.location) score += 0.1;
    
    return Math.min(1.0, score);
  }

  private calculateProjectPriorityScore(project: ProjectCandidate): number {
    let score = 0.5;
    
    if (project.priority === 'A') score += 0.3;
    else if (project.priority === 'B') score += 0.2;
    
    if (project.keyStakeholders.length > 1) score += 0.2;
    if (project.monetizationScore > 0.8) score += 0.1;
    
    return Math.min(1.0, score);
  }

  private calculateContactPriorityScore(contact: HighConfidenceConnection): number {
    let score = 0.3;
    
    if (contact.email) score += 0.2;
    if (contact.phone) score += 0.2;
    if (contact.company) score += 0.2;
    if (contact.position) score += 0.1;
    
    return Math.min(1.0, score);
  }

  private estimateTaskImpact(task: HighConfidenceTask): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (task.priority === 'A') return 'HIGH';
    if (task.priority === 'B') return 'MEDIUM';
    return 'LOW';
  }

  private async checkExistingContact(contact: HighConfidenceConnection): Promise<boolean> {
    try {
      const existing = await prisma.connections.findFirst({
        where: {
          OR: [
            { name: { contains: contact.name } },
            ...(contact.email ? [{ description: { contains: contact.email } }] : [])
          ]
        }
      });
      
      return !!existing;
    } catch (error) {
      console.warn('既存連絡先チェックエラー:', error);
      return false;
    }
  }

  private mapTypeToEntity(type: string): string {
    const mapping: Record<string, string> = {
      'TASK_CREATION': 'task',
      'PROJECT_CREATION': 'project',
      'EVENT_SCHEDULING': 'event',
      'APPOINTMENT_BOOKING': 'appointment',
      'CONTACT_ADDITION': 'contact',
      'KNOWLEDGE_TAGGING': 'knowledge',
      'PRIORITY_ADJUSTMENT': 'priority'
    };
    
    return mapping[type] || 'unknown';
  }
}

// ファクトリー関数
export const createRecommendationEngine = () => RecommendationEngine.getInstance();