import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createAdvancedContentAnalyzer } from '@/lib/ai/advanced-content-analyzer';
import { createRecommendationEngine } from '@/lib/ai/recommendation-engine';

const prisma = new PrismaClient();
const advancedAnalyzer = createAdvancedContentAnalyzer();
const recommendationEngine = createRecommendationEngine();

// 環境設定
const isDevelopment = process.env.NODE_ENV === 'development';
const WEBHOOK_CONFIG = {
  enableAuth: !isDevelopment, // 開発中は認証無効
  apiKey: process.env.GAS_WEBHOOK_API_KEY,
  enableRateLimit: false, // GASは信頼できるソースなので制限なし
  maxContentLength: 100000,
  enableLogging: true,
  // 🛡️ 安全テストモード設定
  enableSafeMode: false, // プロダクションモード（データベース保存あり）
  enableDryRun: false    // 本番実行（分析結果を保存）
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // リクエストボディ取得
    const payload = await request.json();
    
    if (WEBHOOK_CONFIG.enableLogging) {
      console.log(`📨 GAS Webhook受信: ${payload.title || 'タイトル不明'} (${payload.triggerType || 'unknown'})`);
    }
    
    // 基本検証
    const validation = validateWebhookPayload(payload);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
    // 認証チェック（設定により有効/無効）
    if (WEBHOOK_CONFIG.enableAuth) {
      if (!payload.apiKey || payload.apiKey !== WEBHOOK_CONFIG.apiKey) {
        console.warn('❌ GAS Webhook認証失敗');
        return NextResponse.json(
          { error: '認証に失敗しました' },
          { status: 401 }
        );
      }
    } else {
      console.log('🔧 開発モード: 認証スキップ');
    }
    
    // 重複チェック（コンテンツハッシュベース）
    const isDuplicate = await checkForDuplicateContent(
      payload.documentId, 
      payload.contentHash
    );
    
    if (isDuplicate && payload.triggerType !== 'manual') {
      return NextResponse.json({
        success: true,
        message: '既存データ、処理をスキップしました（メタデータ保持）',
        skipped: true,
        reason: 'already_processed'
      });
    }
    
    // メイン処理実行
    const result = await processGASWebhook(payload);
    
    const processingTime = Date.now() - startTime;
    
    // 成功レスポンス
    return NextResponse.json({
      success: true,
      message: 'ドキュメント処理完了',
      result,
      processingTime,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    const processingTime = Date.now() - startTime;
    
    console.error('❌ GAS Webhook処理エラー:', error);
    
    // エラーレスポンス
    return NextResponse.json(
      { 
        error: (error as Error).message || 'Webhook処理に失敗しました',
        processingTime,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// ペイロード検証
function validateWebhookPayload(payload: any): {isValid: boolean, error?: string} {
  // 必須フィールドチェック
  const requiredFields = ['documentId', 'title', 'content', 'url', 'lastModified'];
  
  for (const field of requiredFields) {
    if (!payload[field]) {
      return { isValid: false, error: `${field} が必要です` };
    }
  }
  
  // コンテンツ長チェック
  if (payload.content.length > WEBHOOK_CONFIG.maxContentLength) {
    return { 
      isValid: false, 
      error: `コンテンツが長すぎます (${payload.content.length}文字 > ${WEBHOOK_CONFIG.maxContentLength}文字)` 
    };
  }
  
  // 最小コンテンツ長チェック
  if (payload.content.trim().length < 50) {
    return { isValid: false, error: 'コンテンツが短すぎます' };
  }
  
  return { isValid: true };
}

// 重複チェック
async function checkForDuplicateContent(documentId: string, contentHash?: string): Promise<boolean> {
  if (!contentHash) return false;
  
  try {
    const existing = await prisma.google_docs_sources.findUnique({
      where: { document_id: documentId },
      select: { content_hash: true }
    });
    
    return existing?.content_hash === contentHash;
  } catch (error) {
    console.warn('重複チェックエラー:', error);
    return false; // エラー時は処理を続行
  }
}

// メイン処理
async function processGASWebhook(payload: any) {
  const { 
    documentId, 
    title, 
    content, 
    url, 
    lastModified, 
    triggerType, 
    wordCount,
    contentHash,
    gasVersion 
  } = payload;

  // 🛡️ 安全テストモード判定
  if (WEBHOOK_CONFIG.enableSafeMode) {
    console.log('🛡️ 安全テストモード: データベース保存をスキップ');
    return await processSafeMode(payload);
  }

  try {
    // 1. Google Docsソース情報更新/作成
    await prisma.google_docs_sources.upsert({
      where: { document_id: documentId },
      update: {
        title,
        document_url: url,
        last_modified: new Date(lastModified),
        last_synced: new Date(),
        sync_status: 'SYNCING',
        trigger_type: triggerType,
        word_count: wordCount || content.length,
        gas_version: gasVersion || '2.0',
        content_hash: contentHash,
        error_message: null
      },
      create: {
        document_id: documentId,
        document_url: url,
        title,
        last_modified: new Date(lastModified),
        sync_status: 'SYNCING',
        trigger_type: triggerType,
        word_count: wordCount || content.length,
        gas_version: gasVersion || '2.0',
        content_hash: contentHash,
        page_count: 0
      }
    });

    // 2. AI分析結果の重複チェック（自動処理時のみスキップ）
    const existingAnalysis = await prisma.ai_content_analysis.findFirst({
      where: {
        source_document_id: documentId
      }
    });
    
    if (existingAnalysis && triggerType !== 'manual') {
      console.log(`📋 既存AI分析データ保持: ${documentId}`);
      // メタデータのみ更新して終了
      await prisma.google_docs_sources.update({
        where: { document_id: documentId },
        data: {
          sync_status: 'COMPLETED',
          last_synced: new Date()
        }
      });
      
      return {
        documentId,
        title,
        skipped: true,
        reason: 'analysis_exists',
        message: 'AI分析済み、メタデータ保持'
      };
    }
    
    // マニュアル実行時または新規データの場合、既存分析を削除して再処理
    let deletedAnalysisCount = { count: 0 };
    if (existingAnalysis && triggerType === 'manual') {
      deletedAnalysisCount = await prisma.ai_content_analysis.deleteMany({
        where: {
          source_document_id: documentId
        }
      });
      console.log(`🔄 マニュアル実行: 既存AI分析削除 ${deletedAnalysisCount.count}件`);
    }

    // 3. Google Docsコンテンツは ai_content_analysis テーブルで処理
    // knowledge_items テーブルは使用しない（設計修正）

    // 4. AI分析実行（新機能）
    const aiAnalysisResult = await performAdvancedAIAnalysis(
      documentId,
      content,
      title
    );

    // 5. レコメンデーション生成（新機能）
    const recommendations = await generateRecommendations(
      aiAnalysisResult,
      documentId
    );

    // 6. ソース情報更新（完了状態）
    await prisma.google_docs_sources.update({
      where: { document_id: documentId },
      data: {
        sync_status: 'COMPLETED',
        page_count: aiAnalysisResult?.sections?.length || 0,
        last_synced: new Date()
      }
    });

    console.log(`✅ 処理完了: ${title} - AI分析実行、${recommendations.length}件のレコメンド作成`);

    return {
      documentId,
      title,
      aiAnalysisPerformed: !!aiAnalysisResult,
      sectionsAnalyzed: aiAnalysisResult?.sections?.length || 0,
      tasksExtracted: aiAnalysisResult?.highConfidenceEntities?.tasks?.length || 0,
      eventsExtracted: aiAnalysisResult?.highConfidenceEntities?.events?.length || 0,
      deletedItems: deletedAnalysisCount.count,
      recommendationsGenerated: recommendations.length,
      topRecommendations: recommendations.slice(0, 3).map(r => ({
        type: r.type,
        title: r.title,
        relevanceScore: r.relevanceScore
      })),
      triggerType,
      wordCount: content.length,
      gasVersion
    };

  } catch (error: unknown) {
    // エラー状態を記録
    await prisma.google_docs_sources.update({
      where: { document_id: documentId },
      data: {
        sync_status: 'ERROR',
        last_error: (error as Error).message
      }
    });
    
    throw error;
  }
}

// 設計修正: createKnowledgeFromContent関数を削除
// Google Docsデータは ai_content_analysis テーブルで処理

// 設計修正: 不要なヘルパー関数を削除
// コンテンツ分割・カテゴリ分類・タグ抽出は ai_content_analysis で処理

// Phase 12: 高度AI分析実行
async function performAdvancedAIAnalysis(
  documentId: string,
  content: string,
  title: string
): Promise<any> {
  try {
    console.log(`🧠 AI分析開始: ${title}`);

    // 処理ログ記録開始
    const logId = await prisma.content_processing_logs.create({
      data: {
        source_document_id: documentId,
        processing_step: 'AI_ANALYSIS',
        step_status: 'IN_PROGRESS',
        input_data: { contentLength: content.length, title },
        system_version: '2.0'
      }
    });

    // 高精度AI分析実行
    const analysisResult = await advancedAnalyzer.analyzeContent(content, title);

    // AI分析結果をデータベースに保存
    const aiAnalysis = await prisma.ai_content_analysis.create({
      data: {
        source_document_id: documentId,
        title: title, // Google Docsのタイトルをそのまま使用
        summary: analysisResult.overallInsights.summary || '要約未生成',
        agenda: analysisResult.overallInsights.agenda || '',
        analysis_type: 'COMPREHENSIVE',
        extracted_tasks: JSON.stringify(analysisResult.highConfidenceEntities.tasks),
        extracted_events: JSON.stringify(analysisResult.highConfidenceEntities.events),
        extracted_projects: JSON.stringify(analysisResult.projectCandidates),
        extracted_contacts: JSON.stringify(analysisResult.highConfidenceEntities.connections),
        extracted_dates: JSON.stringify([]),
        confidence_score: analysisResult.overallInsights.confidence,
        model_version: 'gemini-2.0-flash',
        keywords: analysisResult.overallInsights.keyTopics,
        sentiment_score: 0,
        urgency_level: analysisResult.overallInsights.urgencyLevel,
        business_value: analysisResult.overallInsights.businessValue,
        recommendations: JSON.stringify([]),
        auto_suggestions: JSON.stringify(analysisResult.sections.map(s => s.topics).flat())
      }
    });

    // 処理ログ更新（成功）
    await prisma.content_processing_logs.update({
      where: { id: logId.id },
      data: {
        step_status: 'COMPLETED',
        output_data: {
          analysisId: aiAnalysis.id,
          tasksFound: analysisResult.highConfidenceEntities.tasks.length,
          eventsFound: analysisResult.highConfidenceEntities.events.length,
          projectsFound: analysisResult.projectCandidates.length,
          contactsFound: analysisResult.highConfidenceEntities.connections.length,
          confidence: analysisResult.overallInsights.confidence,
          sectionsAnalyzed: analysisResult.sections.length,
          clustersFormed: analysisResult.clusters.length
        },
        processing_time: Date.now() - new Date(logId.createdAt).getTime()
      }
    });

    console.log(`✅ AI分析完了: 信頼度=${analysisResult.overallInsights.confidence}, ID=${aiAnalysis.id}`);
    
    return {
      ...analysisResult,
      analysisId: aiAnalysis.id
    };

  } catch (error) {
    console.error('❌ AI分析エラー:', error);
    
    // エラーログ記録
    await prisma.content_processing_logs.create({
      data: {
        source_document_id: documentId,
        processing_step: 'AI_ANALYSIS',
        step_status: 'FAILED',
        error_message: (error as Error).message,
        input_data: { contentLength: content.length, title }
      }
    });

    return null;
  }
}

// Phase 12: レコメンデーション生成
async function generateRecommendations(
  aiAnalysisResult: any,
  documentId: string
): Promise<any[]> {
  if (!aiAnalysisResult) {
    console.log('⏭️ AI分析結果がないため、レコメンド生成をスキップ');
    return [];
  }

  try {
    console.log(`💡 レコメンド生成開始: 分析ID=${aiAnalysisResult.analysisId}`);

    // 処理ログ記録開始
    const logId = await prisma.content_processing_logs.create({
      data: {
        source_document_id: documentId,
        processing_step: 'RECOMMENDATION_GENERATION',
        step_status: 'IN_PROGRESS',
        input_data: {
          analysisId: aiAnalysisResult.analysisId,
          tasksFound: aiAnalysisResult.highConfidenceEntities.tasks.length,
          eventsFound: aiAnalysisResult.highConfidenceEntities.events.length,
          projectsFound: aiAnalysisResult.projectCandidates.length
        }
      }
    });

    // レコメンド生成実行
    const recommendations = await recommendationEngine.generateRecommendations(
      aiAnalysisResult,
      documentId,
      aiAnalysisResult.analysisId
    );

    // 処理ログ更新（成功）
    await prisma.content_processing_logs.update({
      where: { id: logId.id },
      data: {
        step_status: 'COMPLETED',
        output_data: {
          recommendationsGenerated: recommendations.length,
          highPriorityCount: recommendations.filter(r => r.priorityScore > 0.7).length,
          avgRelevanceScore: recommendations.reduce((sum, r) => sum + r.relevanceScore, 0) / recommendations.length || 0
        },
        processing_time: Date.now() - new Date(logId.createdAt).getTime()
      }
    });

    console.log(`✅ レコメンド生成完了: ${recommendations.length}件`);
    return recommendations;

  } catch (error) {
    console.error('❌ レコメンド生成エラー:', error);
    
    // エラーログ記録
    await prisma.content_processing_logs.create({
      data: {
        source_document_id: documentId,
        processing_step: 'RECOMMENDATION_GENERATION',
        step_status: 'FAILED',
        error_message: (error as Error).message,
        input_data: { analysisId: aiAnalysisResult?.analysisId }
      }
    });

    return [];
  }
}

// 🛡️ 安全テストモード処理（データベース保存なし）
async function processSafeMode(payload: any) {
  const { documentId, title, content, triggerType, wordCount } = payload;
  
  console.log('🛡️ ===== 安全テストモード実行中 =====');
  console.log(`📄 ドキュメント: ${title}`);
  console.log(`📊 文字数: ${wordCount || content.length}文字`);
  console.log(`🔄 トリガー: ${triggerType}`);
  
  try {
    // AI分析のみ実行（データベース保存なし）
    const aiAnalysisResult = await performAIAnalysisOnly(content, title);
    
    // レコメンド生成のみ実行（データベース保存なし）
    const recommendations = await generateRecommendationsOnly(aiAnalysisResult, documentId);
    
    console.log('🔍 ===== AI分析結果（プレビュー） =====');
    if (aiAnalysisResult) {
      console.log(`🧠 信頼度: ${aiAnalysisResult.overallInsights?.confidence || 0}`);
      console.log(`📋 検出タスク: ${aiAnalysisResult.highConfidenceEntities?.tasks?.length || 0}件`);
      console.log(`📅 検出イベント: ${aiAnalysisResult.highConfidenceEntities?.events?.length || 0}件`);
      console.log(`🎯 プロジェクト候補: ${aiAnalysisResult.projectCandidates?.length || 0}件`);
    }
    
    console.log('💡 ===== レコメンド結果（プレビュー） =====');
    console.log(`📝 生成レコメンド: ${recommendations.length}件`);
    
    recommendations.slice(0, 3).forEach((rec, i) => {
      console.log(`${i + 1}. ${rec.type}: ${rec.title} (関連性: ${rec.relevanceScore})`);
    });
    
    console.log('🛡️ ===== 安全テストモード完了 =====');
    console.log('💾 データベースには何も保存されていません');
    
    return {
      safeMode: true,
      documentId,
      title,
      aiAnalysisPreview: aiAnalysisResult ? {
        confidence: aiAnalysisResult.overallInsights?.confidence || 0,
        tasksDetected: aiAnalysisResult.highConfidenceEntities?.tasks?.length || 0,
        eventsDetected: aiAnalysisResult.highConfidenceEntities?.events?.length || 0,
        projectCandidates: aiAnalysisResult.projectCandidates?.length || 0
      } : null,
      recommendationsPreview: recommendations.slice(0, 5).map(r => ({
        type: r.type,
        title: r.title,
        relevanceScore: r.relevanceScore
      })),
      totalRecommendations: recommendations.length,
      message: 'データベースには保存されていません（安全テストモード）'
    };
    
  } catch (error) {
    console.error('❌ 安全テストモードエラー:', error);
    return {
      safeMode: true,
      error: (error as Error).message,
      message: 'テストモードでもエラーが発生しました'
    };
  }
}

// AI分析のみ実行（データベース保存なし）
async function performAIAnalysisOnly(content: string, title: string) {
  try {
    console.log('🧠 AI分析開始（テストモード）');
    const analysisResult = await advancedAnalyzer.analyzeContent(content, title);
    console.log('✅ AI分析完了（テストモード）');
    return analysisResult;
  } catch (error) {
    console.error('❌ AI分析エラー（テストモード）:', error);
    return null;
  }
}

// レコメンド生成のみ実行（データベース保存なし）
async function generateRecommendationsOnly(aiAnalysisResult: any, documentId: string) {
  if (!aiAnalysisResult) return [];
  
  try {
    console.log('💡 レコメンド生成開始（テストモード）');
    const recommendations = await recommendationEngine.generateRecommendations(
      aiAnalysisResult,
      documentId,
      'test-analysis-id-' + Date.now()
    );
    console.log(`✅ レコメンド生成完了（テストモード）: ${recommendations.length}件`);
    return recommendations;
  } catch (error) {
    console.error('❌ レコメンド生成エラー（テストモード）:', error);
    return [];
  }
}