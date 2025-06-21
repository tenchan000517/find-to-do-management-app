// GA4統合SEOインサイトAPI
import { NextRequest, NextResponse } from 'next/server';
import { seoAnalysisService } from '@/lib/services/seo-analysis-service';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // URL形式の簡単なバリデーション
    try {
      new URL(url);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // SEO分析実行
    const analysis = await seoAnalysisService.analyzePage(url);

    // GA4データと統合するための追加分析
    const enhancedAnalysis = {
      ...analysis,
      integrationData: {
        timestamp: new Date().toISOString(),
        analysisType: 'seo_insights',
        source: 'integrated_analytics'
      },
      actionableInsights: generateActionableInsights(analysis),
      priorityMatrix: generatePriorityMatrix(analysis)
    };

    return NextResponse.json({
      success: true,
      data: enhancedAnalysis,
      metadata: {
        analyzedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    });

  } catch (error) {
    console.error('SEO insights API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to analyze SEO insights',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// アクションable insights生成
function generateActionableInsights(analysis: any) {
  // 高インパクト＆低工数の改善提案を優先
  const quickWins = (analysis.recommendations || [])
    .filter((rec: any) => rec.impact > 12 && rec.effort === 'low')
    .map((rec: any) => ({
      type: 'quick_win',
      title: rec.title,
      description: rec.description,
      expectedImpact: `${rec.impact}% SEOスコア向上見込み`,
      timeToImplement: '1-2時間',
      category: 'immediate_action'
    }));

  // 重要な技術的問題
  const criticalIssues = (analysis.topIssues || [])
    .filter((issue: any) => issue.severity === 'high')
    .map((issue: any) => ({
      type: 'critical_fix',
      title: `緊急対応: ${issue.category}`,
      description: issue.message,
      expectedImpact: 'SEOランキングに直接影響',
      timeToImplement: '即座に対応',
      category: 'urgent_fix'
    }));

  // 長期戦略提案
  const strategicImprovements = (analysis.recommendations || [])
    .filter((rec: any) => rec.impact > 15)
    .slice(0, 3)
    .map((rec: any) => ({
      type: 'strategic_improvement',
      title: rec.title,
      description: rec.description,
      expectedImpact: `${rec.impact}% 長期的な検索流入向上`,
      timeToImplement: rec.effort === 'high' ? '1-2週間' : '3-5日',
      category: 'strategic_planning'
    }));

  return {
    quickWins,
    criticalIssues,
    strategicImprovements,
    summary: {
      totalActionItems: quickWins.length + criticalIssues.length + strategicImprovements.length,
      estimatedImpact: calculateTotalImpact(analysis.recommendations),
      timeToComplete: estimateTimeToComplete(quickWins, criticalIssues, strategicImprovements)
    }
  };
}

// 優先度マトリックス生成
function generatePriorityMatrix(analysis: any) {
  const matrix = {
    highImpactLowEffort: [] as any[],
    highImpactHighEffort: [] as any[],
    lowImpactLowEffort: [] as any[],
    lowImpactHighEffort: [] as any[]
  };

  (analysis.recommendations || []).forEach((rec: any) => {
    const isHighImpact = rec.impact > 12;
    const isHighEffort = rec.effort === 'high';

    if (isHighImpact && !isHighEffort) {
      matrix.highImpactLowEffort.push(rec);
    } else if (isHighImpact && isHighEffort) {
      matrix.highImpactHighEffort.push(rec);
    } else if (!isHighImpact && !isHighEffort) {
      matrix.lowImpactLowEffort.push(rec);
    } else {
      matrix.lowImpactHighEffort.push(rec);
    }
  });

  return {
    ...matrix,
    recommendations: {
      immediate: 'まず高インパクト・低工数の改善から実施',
      shortTerm: '次に高インパクト・高工数の改善を計画的に実施',
      longTerm: '余裕があれば低インパクト・低工数の改善も実施',
      avoid: '低インパクト・高工数の改善は優先度が低い'
    }
  };
}

function calculateTotalImpact(recommendations: any[]): string {
  if (!recommendations.length) return '情報なし';
  const totalImpact = recommendations.reduce((sum, rec) => sum + rec.impact, 0);
  const avgImpact = Math.round(totalImpact / recommendations.length);
  
  if (avgImpact > 15) return '高（大幅な改善が期待される）';
  if (avgImpact > 10) return '中（明確な改善が期待される）';
  return '低（段階的な改善が期待される）';
}

function estimateTimeToComplete(quickWins: any[], criticalIssues: any[], strategicImprovements: any[]): string {
  const quickWinHours = quickWins.length * 2;
  const criticalHours = criticalIssues.length * 1;
  const strategicHours = strategicImprovements.length * 20;
  
  const totalHours = quickWinHours + criticalHours + strategicHours;
  const days = Math.ceil(totalHours / 8);
  
  if (days <= 1) return '1日以内';
  if (days <= 7) return `${days}日程度`;
  if (days <= 14) return '1-2週間';
  return '2週間以上';
}