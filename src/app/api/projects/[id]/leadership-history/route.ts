import { NextRequest, NextResponse } from 'next/server';
import { prismaDataService } from '@/lib/database/prisma-service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const projectId = params.id;

    // 実際の実装では、専用のleadership_historyテーブルから取得
    // 今回は簡易実装として、現在のプロジェクトリーダー情報を返す
    const project = await prismaDataService.getProjectById(projectId);
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // 簡易実装: プロジェクト作成時に最初のメンバーがリーダーになったとして履歴を生成
    const leadershipHistory = [];
    if (project.teamMembers.length > 0) {
      leadershipHistory.push({
        id: `${projectId}-initial`,
        toLeader: project.teamMembers[0],
        reason: 'プロジェクト作成時の初期設定',
        timestamp: project.createdAt
      });
    }

    return NextResponse.json(leadershipHistory);
  } catch (error) {
    console.error('Failed to get leadership history:', error);
    return NextResponse.json(
      { error: 'Failed to get leadership history' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const projectId = params.id;
    const body = await request.json();
    const { newLeaderId, reason } = body;

    if (!newLeaderId) {
      return NextResponse.json(
        { error: 'New leader ID is required' },
        { status: 400 }
      );
    }

    // プロジェクトのチームメンバー順序を更新（先頭をリーダーとする）
    const project = await prismaDataService.getProjectById(projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // 新しいリーダーを先頭に移動
    const updatedTeamMembers = [
      newLeaderId,
      ...project.teamMembers.filter((id: string) => id !== newLeaderId)
    ];

    await prismaDataService.updateProject(projectId, {
      teamMembers: updatedTeamMembers
    });

    // 履歴記録（実際の実装では専用テーブルに保存）
    const historyEntry = {
      id: `${projectId}-${Date.now()}`,
      fromLeader: project.teamMembers[0] || null,
      toLeader: newLeaderId,
      reason: reason || '理由なし',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      history: historyEntry
    });
  } catch (error) {
    console.error('Failed to transfer leadership:', error);
    return NextResponse.json(
      { error: 'Failed to transfer leadership' },
      { status: 500 }
    );
  }
}