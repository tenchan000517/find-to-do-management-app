// レコメンデーション管理API - 取得・操作・ワンクリック実行
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// レコメンデーション一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const minRelevance = parseFloat(searchParams.get('minRelevance') || '0');
    const type = searchParams.get('type');

    // フィルター条件構築
    const where: any = {
      relevance_score: { gte: minRelevance }
    };

    if (status !== 'ALL') {
      where.status = status;
    }

    if (type) {
      where.recommendation_type = type;
    }

    // レコメンデーション取得
    const [recommendations, total] = await Promise.all([
      prisma.content_recommendations.findMany({
        where,
        orderBy: [
          { priority_score: 'desc' },
          { relevance_score: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit,
        skip: offset
      }),
      prisma.content_recommendations.count({ where })
    ]);

    // 各レコメンデーションに追加情報を付与
    const enrichedRecommendations = await Promise.all(
      recommendations.map(async (rec: any) => {
        // 関連するAI分析情報を取得
        const analysis = await prisma.ai_content_analysis.findUnique({
          where: { id: rec.analysis_id },
          select: {
            source_document_id: true,
            confidence_score: true,
            urgency_level: true,
            business_value: true,
            keywords: true
          }
        });

        // 元ドキュメント情報を取得
        const sourceDoc = analysis ? await prisma.google_docs_sources.findUnique({
          where: { document_id: analysis.source_document_id },
          select: {
            title: true,
            document_url: true,
            last_modified: true
          }
        }) : null;

        return {
          ...rec,
          analysis: analysis,
          sourceDocument: sourceDoc,
          // 実行可能性スコア計算
          executabilityScore: calculateExecutabilityScore(rec),
          // 推定インパクト
          estimatedImpact: estimateImpact(rec, analysis)
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        recommendations: enrichedRecommendations,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        },
        filters: {
          status,
          type,
          minRelevance
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ レコメンデーション取得エラー:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'レコメンデーション取得に失敗しました',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// レコメンデーション操作（承認・拒否・実行）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, recommendationId, params } = body;

    const recommendation = await prisma.content_recommendations.findUnique({
      where: { id: recommendationId }
    });

    if (!recommendation) {
      return NextResponse.json(
        { success: false, error: 'レコメンデーションが見つかりません' },
        { status: 404 }
      );
    }

    let result: any = {};

    switch (action) {
      case 'accept':
        // レコメンデーション承認
        await prisma.content_recommendations.update({
          where: { id: recommendationId },
          data: {
            status: 'ACCEPTED',
            accepted_at: new Date(),
            user_feedback: params?.feedback || null
          }
        });
        
        result = {
          message: 'レコメンデーションを承認しました',
          status: 'ACCEPTED'
        };
        break;

      case 'reject':
        // レコメンデーション拒否
        await prisma.content_recommendations.update({
          where: { id: recommendationId },
          data: {
            status: 'REJECTED',
            rejected_at: new Date(),
            user_feedback: params?.feedback || null
          }
        });
        
        result = {
          message: 'レコメンデーションを拒否しました',
          status: 'REJECTED'
        };
        break;

      case 'execute':
        // ワンクリック実行
        const executionResult = await executeRecommendation(recommendation, params);
        
        if (executionResult.success) {
          await prisma.content_recommendations.update({
            where: { id: recommendationId },
            data: {
              status: 'IMPLEMENTED',
              accepted_at: new Date(),
              created_entity_id: executionResult.entityId
            }
          });
        }
        
        result = executionResult;
        break;

      case 'batch_accept':
        // 複数レコメンデーション一括承認
        const ids = params?.recommendationIds || [];
        if (!Array.isArray(ids)) {
          return NextResponse.json(
            { success: false, error: 'recommendationIds は配列である必要があります' },
            { status: 400 }
          );
        }

        const batchResult = await prisma.content_recommendations.updateMany({
          where: { 
            id: { in: ids },
            status: 'PENDING'
          },
          data: {
            status: 'ACCEPTED',
            accepted_at: new Date()
          }
        });

        result = {
          message: `${batchResult.count}件のレコメンデーションを一括承認しました`,
          updatedCount: batchResult.count
        };
        break;

      default:
        return NextResponse.json(
          { success: false, error: `未知のアクション: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      recommendationId,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ レコメンデーション操作エラー:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'レコメンデーション操作に失敗しました',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// ワンクリック実行機能
async function executeRecommendation(recommendation: any, params: any = {}) {
  try {
    console.log(`🚀 レコメンデーション実行開始: ${recommendation.recommendation_type}`);

    const suggestedData = recommendation.suggested_data;
    let entityId: string | null = null;

    switch (recommendation.recommendation_type) {
      case 'TASK_CREATION':
        // タスク作成
        const task = await prisma.tasks.create({
          data: {
            id: `rec_task_${Date.now()}`,
            title: suggestedData.title,
            description: suggestedData.description || '',
            priority: suggestedData.priority || 'C',
            status: 'IDEA',
            userId: params.userId || 'ai-generated', // 実際のユーザーIDに置き換え
            dueDate: suggestedData.dueDate || null,
            estimatedHours: suggestedData.estimatedHours || 0,
            projectId: suggestedData.projectId || null
          }
        });
        
        entityId = task.id;
        console.log(`✅ タスク作成完了: ${task.title} (${task.id})`);
        break;

      case 'PROJECT_CREATION':
        // プロジェクト作成
        const project = await prisma.projects.create({
          data: {
            id: `rec_proj_${Date.now()}`,
            name: suggestedData.name,
            description: suggestedData.description || '',
            status: 'PLANNING',
            phase: suggestedData.phase || 'concept',
            priority: suggestedData.priority || 'C',
            startDate: suggestedData.startDate || new Date().toISOString().split('T')[0],
            endDate: suggestedData.endDate || null,
            teamMembers: suggestedData.teamMembers || [],
            progress: 0
          }
        });
        
        entityId = project.id;
        console.log(`✅ プロジェクト作成完了: ${project.name} (${project.id})`);
        break;

      case 'EVENT_SCHEDULING':
        // イベント作成
        const event = await prisma.calendar_events.create({
          data: {
            id: `rec_event_${Date.now()}`,
            title: suggestedData.title,
            date: suggestedData.date,
            time: suggestedData.time || '09:00',
            endTime: suggestedData.endTime || null,
            type: suggestedData.type || 'EVENT',
            description: suggestedData.description || '',
            participants: suggestedData.participants || [],
            location: suggestedData.location || null,
            category: 'EVENT',
            importance: 0.5
          }
        });
        
        entityId = event.id;
        console.log(`✅ イベント作成完了: ${event.title} (${event.id})`);
        break;

      case 'CONTACT_ADDITION':
        // 連絡先追加
        const contact = await prisma.connections.create({
          data: {
            id: `rec_contact_${Date.now()}`,
            name: suggestedData.name,
            company: suggestedData.company || '',
            position: suggestedData.position || '',
            type: suggestedData.type || 'COMPANY',
            description: suggestedData.description || 'AI推奨により追加',
            conversation: suggestedData.conversation || '',
            potential: suggestedData.potential || '要評価',
            date: new Date().toISOString().split('T')[0],
            location: 'AI分析',
            updatedAt: new Date()
          }
        });
        
        entityId = contact.id;
        console.log(`✅ 連絡先追加完了: ${contact.name} (${contact.id})`);
        break;

      case 'APPOINTMENT_BOOKING':
        // アポイントメント作成
        const appointment = await prisma.appointments.create({
          data: {
            id: `rec_appt_${Date.now()}`,
            companyName: suggestedData.companyName || suggestedData.title,
            contactName: suggestedData.contactName || 'AI抽出',
            phone: suggestedData.phone || '',
            email: suggestedData.email || '',
            status: 'PENDING',
            nextAction: 'AI分析により生成されたアポイントメント',
            notes: suggestedData.description || '',
            priority: suggestedData.priority || 'C'
          }
        });
        
        entityId = appointment.id;
        console.log(`✅ アポイントメント作成完了: ${appointment.companyName} (${appointment.id})`);
        break;

      default:
        throw new Error(`未対応のレコメンデーションタイプ: ${recommendation.recommendation_type}`);
    }

    return {
      success: true,
      message: `${recommendation.recommendation_type}の実行が完了しました`,
      entityId,
      entityType: recommendation.target_entity_type
    };

  } catch (error) {
    console.error('❌ レコメンデーション実行エラー:', error);
    
    return {
      success: false,
      error: (error as Error).message || 'レコメンデーション実行に失敗しました'
    };
  }
}

// 実行可能性スコア計算
function calculateExecutabilityScore(recommendation: any): number {
  let score = 0.5;

  // 実装の容易さを考慮
  score += recommendation.implementation_ease * 0.3;
  
  // データの完全性を考慮
  const suggestedData = recommendation.suggested_data;
  const requiredFields = getRequiredFieldsForType(recommendation.recommendation_type);
  const completeness = requiredFields.filter(field => suggestedData[field]).length / requiredFields.length;
  score += completeness * 0.4;
  
  // 関連性スコアを考慮
  score += recommendation.relevance_score * 0.3;

  return Math.min(1.0, Math.max(0.0, score));
}

// 推定インパクト計算
function estimateImpact(recommendation: any, analysis: any): 'LOW' | 'MEDIUM' | 'HIGH' {
  let impactScore = 0;

  // 優先度スコアを考慮
  impactScore += recommendation.priority_score * 30;
  
  // ビジネス価値を考慮
  if (analysis?.business_value) {
    impactScore += analysis.business_value * 40;
  }
  
  // 緊急度を考慮
  if (analysis?.urgency_level) {
    const urgencyMap: Record<string, number> = { 'CRITICAL': 30, 'HIGH': 20, 'MEDIUM': 10, 'LOW': 5, 'VERY_LOW': 0 };
    impactScore += urgencyMap[analysis.urgency_level as string] || 0;
  }

  if (impactScore >= 70) return 'HIGH';
  if (impactScore >= 40) return 'MEDIUM';
  return 'LOW';
}

// レコメンデーションタイプ別必須フィールド
function getRequiredFieldsForType(type: string): string[] {
  const fieldMap: Record<string, string[]> = {
    'TASK_CREATION': ['title', 'description'],
    'PROJECT_CREATION': ['name', 'description'],
    'EVENT_SCHEDULING': ['title', 'date'],
    'APPOINTMENT_BOOKING': ['companyName', 'contactName'],
    'CONTACT_ADDITION': ['name', 'company'],
    'KNOWLEDGE_TAGGING': ['documentId', 'tagsToAdd'],
    'PRIORITY_ADJUSTMENT': ['documentId', 'priorityLevel']
  };
  
  return fieldMap[type] || [];
}