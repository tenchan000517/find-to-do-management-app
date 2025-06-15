import { NextRequest, NextResponse } from 'next/server';
import { prismaDataService } from '@/lib/database/prisma-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // プロジェクト基本情報
    const project = await prismaDataService.getProjectById(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // 関連データ取得
    const tasks = await prismaDataService.getTasksByProjectId(id);
    const relationships = await prismaDataService.getProjectRelationships(id);
    const alerts = await prismaDataService.getProjectAlerts(id);

    // 統計計算
    const analytics = {
      project: {
        ...project,
        taskCount: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'COMPLETE').length,
        highPriorityTasks: tasks.filter(t => t.priority === 'A' || t.aiIssueLevel === 'A').length
      },
      relationships: {
        total: relationships.length,
        byType: relationships.reduce((acc, r) => {
          acc[r.relatedType] = (acc[r.relatedType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      alerts: {
        total: alerts.length,
        unread: alerts.filter(a => !a.isRead).length,
        bySeverity: alerts.reduce((acc, a) => {
          acc[a.severity] = (acc[a.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      timeline: await getProjectTimeline(id),
      recommendations: await generateRecommendations(project, tasks, alerts)
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Failed to get project analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getProjectTimeline(projectId: string): Promise<any[]> {
  // プロジェクトフェーズ履歴取得
  const phaseHistory = await prismaDataService.getProjectPhaseHistory(projectId);
  return phaseHistory.map(h => ({
    date: h.createdAt,
    type: 'phase_change',
    from: h.fromPhase,
    to: h.toPhase,
    reason: h.reason
  }));
}

async function generateRecommendations(project: any, tasks: any[], alerts: any[]): Promise<string[]> {
  const recommendations = [];

  // 進捗停滞の推奨
  if (project.successProbability < 0.5) {
    recommendations.push('プロジェクトの成功確率が低下しています。フェーズ見直しを検討してください。');
  }

  // タスクの偏りチェック
  const highPriorityRatio = tasks.filter(t => t.aiIssueLevel === 'A').length / tasks.length;
  if (highPriorityRatio > 0.5) {
    recommendations.push('高優先度タスクが集中しています。リソース配分の調整が必要です。');
  }

  // アラート対応
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.isResolved);
  if (criticalAlerts.length > 0) {
    recommendations.push('緊急アラートが未解決です。即座の対応が必要です。');
  }

  // タスク完了率チェック
  const completionRate = tasks.filter(t => t.status === 'COMPLETE').length / tasks.length;
  if (completionRate < 0.3 && tasks.length > 5) {
    recommendations.push('タスク完了率が低下しています。チーム体制の見直しを推奨します。');
  }

  // アクティビティスコアチェック
  if (project.activityScore < 0.3) {
    recommendations.push('プロジェクトの活動度が低下しています。定期的なチェックイン会議を設定してください。');
  }

  return recommendations;
}