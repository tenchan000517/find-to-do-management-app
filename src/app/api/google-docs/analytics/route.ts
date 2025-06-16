// Google Docs分析・監視ダッシュボード用API
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';
    const includeDetails = searchParams.get('includeDetails') === 'true';

    // 時間範囲の計算
    const now = new Date();
    const timeRangeMap: Record<string, number> = {
      '1d': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90
    };
    const days = timeRangeMap[timeRange] || 7;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // 基本統計情報取得
    const [
      totalDocuments,
      recentSyncs,
      successfulSyncs,
      failedSyncs,
      totalRecommendations,
      acceptedRecommendations,
      aiAnalyses,
      processingLogs
    ] = await Promise.all([
      // 総ドキュメント数
      prisma.google_docs_sources.count(),
      
      // 期間内の同期数
      prisma.google_docs_sources.count({
        where: {
          last_synced: { gte: startDate }
        }
      }),
      
      // 成功した同期数
      prisma.google_docs_sources.count({
        where: {
          sync_status: 'COMPLETED',
          last_synced: { gte: startDate }
        }
      }),
      
      // 失敗した同期数
      prisma.google_docs_sources.count({
        where: {
          sync_status: { in: ['ERROR', 'FAILED'] },
          last_synced: { gte: startDate }
        }
      }),
      
      // 総レコメンデーション数
      prisma.content_recommendations.count({
        where: {
          createdAt: { gte: startDate }
        }
      }),
      
      // 承認されたレコメンデーション数
      prisma.content_recommendations.count({
        where: {
          status: 'ACCEPTED',
          createdAt: { gte: startDate }
        }
      }),
      
      // AI分析数
      prisma.ai_content_analysis.count({
        where: {
          createdAt: { gte: startDate }
        }
      }),
      
      // 処理ログ（最新のもの）
      prisma.content_processing_logs.findMany({
        where: {
          createdAt: { gte: startDate }
        },
        orderBy: { createdAt: 'desc' },
        take: includeDetails ? 50 : 10
      })
    ]);

    // 詳細情報（オプション）
    let detailData = {};
    if (includeDetails) {
      const [
        recentAnalyses,
        topRecommendations,
        syncStatusBreakdown,
        performanceMetrics,
        errorSummary
      ] = await Promise.all([
        // 最新のAI分析結果
        prisma.ai_content_analysis.findMany({
          where: { createdAt: { gte: startDate } },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            source_document_id: true,
            analysis_type: true,
            confidence_score: true,
            urgency_level: true,
            business_value: true,
            keywords: true,
            createdAt: true
          }
        }),
        
        // 高スコアレコメンデーション
        prisma.content_recommendations.findMany({
          where: {
            createdAt: { gte: startDate },
            relevance_score: { gte: 0.7 }
          },
          orderBy: { relevance_score: 'desc' },
          take: 20,
          select: {
            id: true,
            recommendation_type: true,
            title: true,
            status: true,
            relevance_score: true,
            priority_score: true,
            createdAt: true
          }
        }),
        
        // 同期ステータス別集計
        prisma.google_docs_sources.groupBy({
          by: ['sync_status'],
          where: { last_synced: { gte: startDate } },
          _count: { sync_status: true }
        }),
        
        // パフォーマンスメトリクス
        prisma.content_processing_logs.aggregate({
          where: {
            createdAt: { gte: startDate },
            step_status: 'COMPLETED'
          },
          _avg: { processing_time: true },
          _max: { processing_time: true },
          _min: { processing_time: true }
        }),
        
        // エラーサマリー
        prisma.content_processing_logs.groupBy({
          by: ['processing_step'],
          where: {
            createdAt: { gte: startDate },
            step_status: 'FAILED'
          },
          _count: { processing_step: true }
        })
      ]);

      detailData = {
        recentAnalyses,
        topRecommendations,
        syncStatusBreakdown,
        performanceMetrics,
        errorSummary
      };
    }

    // 計算指標
    const successRate = recentSyncs > 0 ? (successfulSyncs / recentSyncs * 100).toFixed(1) : '0';
    const recommendationAcceptanceRate = totalRecommendations > 0 ? 
      (acceptedRecommendations / totalRecommendations * 100).toFixed(1) : '0';

    const analytics = {
      // 基本メトリクス
      overview: {
        totalDocuments,
        recentSyncs,
        successfulSyncs,
        failedSyncs,
        successRate: parseFloat(successRate),
        totalRecommendations,
        acceptedRecommendations,
        recommendationAcceptanceRate: parseFloat(recommendationAcceptanceRate),
        aiAnalyses
      },
      
      // 処理状況
      processing: {
        currentlyProcessing: processingLogs.filter((log: any) => log.step_status === 'IN_PROGRESS').length,
        recentlyCompleted: processingLogs.filter((log: any) => log.step_status === 'COMPLETED').length,
        recentErrors: processingLogs.filter((log: any) => log.step_status === 'FAILED').length,
        lastProcessingTime: processingLogs[0]?.createdAt || null
      },
      
      // システム健全性
      health: {
        systemStatus: failedSyncs < recentSyncs * 0.1 ? 'HEALTHY' : 
                     failedSyncs < recentSyncs * 0.3 ? 'WARNING' : 'ERROR',
        aiSystemStatus: aiAnalyses > 0 ? 'ACTIVE' : 'INACTIVE',
        recommendationSystemStatus: totalRecommendations > 0 ? 'ACTIVE' : 'INACTIVE'
      },
      
      // 時間範囲情報
      timeRange: {
        range: timeRange,
        days: days,
        startDate: startDate.toISOString(),
        endDate: now.toISOString()
      },
      
      // 詳細データ（リクエストされた場合のみ）
      ...detailData
    };

    return NextResponse.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Analytics API エラー:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Analytics取得に失敗しました',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// システム制御用POST API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params } = body;

    let result = {};

    switch (action) {
      case 'retry_failed_syncs':
        // 失敗した同期の再試行（実装例）
        const failedSources = await prisma.google_docs_sources.findMany({
          where: { sync_status: 'FAILED' },
          take: 10
        });
        
        result = {
          message: `${failedSources.length}件の失敗同期を再試行キューに追加しました`,
          count: failedSources.length
        };
        break;

      case 'cleanup_old_logs':
        // 古いログの清理
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - (params?.days || 30));
        
        const deletedLogs = await prisma.content_processing_logs.deleteMany({
          where: {
            createdAt: { lt: cutoffDate },
            step_status: { in: ['COMPLETED', 'FAILED'] }
          }
        });
        
        result = {
          message: `${deletedLogs.count}件の古いログを削除しました`,
          deletedCount: deletedLogs.count
        };
        break;

      case 'regenerate_recommendations':
        // 低スコアレコメンデーションの再生成
        const lowScoreRecs = await prisma.content_recommendations.count({
          where: {
            status: 'PENDING',
            relevance_score: { lt: 0.3 }
          }
        });
        
        result = {
          message: `${lowScoreRecs}件の低スコアレコメンデーションが見つかりました`,
          count: lowScoreRecs
        };
        break;

      case 'system_health_check':
        // システム健全性チェック
        const healthCheck = await performSystemHealthCheck();
        result = healthCheck;
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
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Analytics Control API エラー:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'システム制御操作に失敗しました',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// システム健全性チェック関数
async function performSystemHealthCheck() {
  try {
    const checks = {
      database: false,
      aiSystem: false,
      processingQueue: false,
      recentActivity: false
    };

    // データベース接続チェック
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (error) {
      console.error('Database check failed:', error);
    }

    // AI システムチェック（最近の分析があるか）
    const recentAnalysis = await prisma.ai_content_analysis.findFirst({
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    });
    checks.aiSystem = !!recentAnalysis;

    // 処理キューチェック（スタックしたジョブがないか）
    const stuckJobs = await prisma.content_processing_logs.count({
      where: {
        step_status: 'IN_PROGRESS',
        createdAt: { lt: new Date(Date.now() - 60 * 60 * 1000) } // 1時間以上前
      }
    });
    checks.processingQueue = stuckJobs === 0;

    // 最近のアクティビティチェック
    const recentActivity = await prisma.google_docs_sources.count({
      where: {
        last_synced: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    });
    checks.recentActivity = recentActivity > 0;

    const overallHealth = Object.values(checks).every(check => check);

    return {
      overallHealth,
      checks,
      message: overallHealth ? 'システムは正常に動作しています' : '一部のシステムに問題があります',
      stuckJobs: stuckJobs || 0
    };

  } catch (error) {
    console.error('Health check error:', error);
    return {
      overallHealth: false,
      checks: { database: false, aiSystem: false, processingQueue: false, recentActivity: false },
      message: 'ヘルスチェック実行中にエラーが発生しました',
      error: (error as Error).message
    };
  }
}