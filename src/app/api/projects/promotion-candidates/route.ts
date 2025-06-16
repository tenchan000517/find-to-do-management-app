import { NextRequest, NextResponse } from 'next/server';
import { ProjectPromotionEngine } from '@/lib/services/project-promotion-engine';
import { prismaDataService } from '@/lib/database/prisma-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const autoPromotionOnly = searchParams.get('autoPromotionOnly') === 'true';
    const minConfidence = parseFloat(searchParams.get('minConfidence') || '0.6');

    const promotionEngine = new ProjectPromotionEngine();
    const candidates = await promotionEngine.detectPromotionCandidates();

    // フィルタリング
    let filteredCandidates = candidates.filter(c => c.confidence >= minConfidence);
    if (autoPromotionOnly) {
      filteredCandidates = filteredCandidates.filter(c => c.autoPromotionScore >= 0.8);
    }

    return NextResponse.json({
      candidates: filteredCandidates,
      summary: {
        totalCandidates: candidates.length,
        filteredCandidates: filteredCandidates.length,
        autoPromotionReady: candidates.filter(c => c.autoPromotionScore >= 0.8).length,
        highConfidenceCandidates: candidates.filter(c => c.confidence >= 0.8).length
      }
    });
  } catch (error) {
    console.error('Failed to get promotion candidates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, candidateId, projectData } = await request.json();

    const promotionEngine = new ProjectPromotionEngine();

    switch (action) {
      case 'promote_candidate':
        return await handlePromoteCandidate(candidateId, projectData);
      case 'auto_promote_all':
        return await handleAutoPromoteAll(promotionEngine);
      case 'evaluate_candidate':
        return await handleEvaluateCandidate(promotionEngine, candidateId);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Promotion action failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handlePromoteCandidate(candidateId: string, projectData: any) {
  try {
    // プロジェクト作成
    const newProject = await prismaDataService.addProject({
      name: projectData.name,
      description: projectData.description,
      status: 'planning',
      progress: 0,
      startDate: new Date().toISOString().split('T')[0],
      teamMembers: projectData.teamMembers || [],
      priority: projectData.priority || 'C',
      phase: projectData.phase || 'concept',
      kgi: projectData.kgi || ''
    });

    // 関連アイテムをプロジェクトに紐づけ
    if (projectData.relatedItems) {
      for (const item of projectData.relatedItems) {
        if (item.type === 'task') {
          await prismaDataService.updateTask(item.id, { projectId: newProject.id });
        }
        // 他のタイプの関連付けも実装可能
      }
    }

    // 昇華ログ記録（将来実装予定）
    console.log(`Project promotion: candidate ${candidateId} promoted to project ${newProject.id}`);

    return NextResponse.json({
      success: true,
      project: newProject,
      message: 'プロジェクトが正常に作成されました'
    });
  } catch (error) {
    console.error('Failed to promote candidate:', error);
    throw error;
  }
}

async function handleAutoPromoteAll(promotionEngine: ProjectPromotionEngine) {
  try {
    const candidates = await promotionEngine.detectPromotionCandidates();
    
    // バッチ評価用のデータ準備
    const evaluationPromises = candidates.map(candidate => 
      promotionEngine.evaluateAutoPromotion(candidate)
    );
    
    // 並列評価（最大5件ずつ）
    const batchSize = 5;
    const results = [];
    
    for (let i = 0; i < evaluationPromises.length; i += batchSize) {
      const batch = evaluationPromises.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
    }
    
    // 昇華すべきプロジェクトのみフィルタリング
    const toPromote = results
      .map((evaluation, index) => ({
        evaluation,
        candidate: candidates[index]
      }))
      .filter(item => item.evaluation.shouldAutoPromote);
    
    // バッチでプロジェクト作成（Prismaのcreate Manyは使えないので、並列処理）
    const promotionResults = [];
    if (toPromote.length > 0) {
      const projectCreationPromises = toPromote.map(async (item) => {
        try {
          const newProject = await prismaDataService.addProject({
            name: item.candidate.suggestedProject.name,
            description: item.candidate.suggestedProject.description,
            status: 'planning',
            progress: 0,
            startDate: new Date().toISOString().split('T')[0],
            teamMembers: [],
            priority: item.candidate.suggestedProject.priority,
            phase: item.candidate.suggestedProject.phase,
            kgi: item.candidate.suggestedProject.kgi || ''
          });

          return {
            candidateId: item.candidate.id,
            projectId: newProject.id,
            success: true,
            reasoning: item.evaluation.reasoning
          };
        } catch (error) {
          return {
            candidateId: item.candidate.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });

      // 並列プロジェクト作成（最大3件同時）
      const creationBatchSize = 3;
      for (let i = 0; i < projectCreationPromises.length; i += creationBatchSize) {
        const batch = projectCreationPromises.slice(i, i + creationBatchSize);
        const batchResults = await Promise.all(batch);
        promotionResults.push(...batchResults);
      }
    }

    return NextResponse.json({
      success: true,
      results: promotionResults,
      summary: {
        totalCandidates: candidates.length,
        evaluated: results.length,
        autoPromoted: promotionResults.filter(r => r.success).length,
        failed: promotionResults.filter(r => !r.success).length
      }
    });
  } catch (error) {
    console.error('Auto promotion failed:', error);
    throw error;
  }
}

async function handleEvaluateCandidate(promotionEngine: ProjectPromotionEngine, candidateId: string) {
  // 簡易実装（実際の候補を再検出して評価）
  const candidates = await promotionEngine.detectPromotionCandidates();
  const candidate = candidates.find(c => c.id === candidateId);
  
  if (!candidate) {
    return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
  }

  const evaluation = await promotionEngine.evaluateAutoPromotion(candidate);
  
  return NextResponse.json({
    success: true,
    evaluation,
    candidate
  });
}