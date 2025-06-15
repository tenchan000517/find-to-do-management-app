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
    const autoPromotionResults = [];

    for (const candidate of candidates) {
      const evaluation = await promotionEngine.evaluateAutoPromotion(candidate);
      
      if (evaluation.shouldAutoPromote) {
        try {
          const newProject = await prismaDataService.addProject({
            name: candidate.suggestedProject.name,
            description: candidate.suggestedProject.description,
            status: 'planning',
            progress: 0,
            startDate: new Date().toISOString().split('T')[0],
            teamMembers: [],
            priority: candidate.suggestedProject.priority,
            phase: candidate.suggestedProject.phase,
            kgi: candidate.suggestedProject.kgi || ''
          });

          autoPromotionResults.push({
            candidateId: candidate.id,
            projectId: newProject.id,
            success: true,
            reasoning: evaluation.reasoning
          });
        } catch (error) {
          autoPromotionResults.push({
            candidateId: candidate.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      results: autoPromotionResults,
      summary: {
        totalCandidates: candidates.length,
        autoPromoted: autoPromotionResults.filter(r => r.success).length,
        failed: autoPromotionResults.filter(r => !r.success).length
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