// Phase 3: Real-time events endpoint
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export async function GET() {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 最近のタスク完了イベント
    const recentTasks = await prisma.task.findMany({
      where: {
        status: 'COMPLETED',
        updatedAt: {
          gte: oneDayAgo
        }
      },
      include: {
        assignee: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 8
    });

    // 最近のプロジェクト更新
    const recentProjects = await prisma.project.findMany({
      where: {
        updatedAt: {
          gte: oneDayAgo
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 5
    });

    // 高リスクアラート
    const riskAlerts = await prisma.customerLtvAnalysis.findMany({
      where: {
        riskScore: {
          gte: 7
        },
        updatedAt: {
          gte: oneDayAgo
        }
      },
      orderBy: {
        riskScore: 'desc'
      },
      take: 3
    });

    // 新規ユーザー
    const newUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: oneDayAgo
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 3
    });

    // 売上更新（今日の新しいLTV分析）
    const revenueUpdates = await prisma.customerLtvAnalysis.findMany({
      where: {
        createdAt: {
          gte: new Date(now.getTime() - 2 * 60 * 60 * 1000) // 過去2時間
        },
        currentLtv: {
          gt: 0
        }
      },
      orderBy: {
        currentLtv: 'desc'
      },
      take: 3
    });

    const events = [
      // タスク完了イベント
      ...recentTasks.map(task => ({
        id: `task-${task.id}-${task.updatedAt.getTime()}`,
        type: 'task-completed' as const,
        timestamp: task.updatedAt.toISOString(),
        userId: task.assigneeId || undefined,
        userName: task.assignee?.name,
        data: {
          title: 'タスク完了',
          description: `"${task.title}" が完了されました`,
          priority: 'medium' as const
        }
      })),

      // プロジェクト更新イベント
      ...recentProjects.map(project => ({
        id: `project-${project.id}-${project.updatedAt.getTime()}`,
        type: 'project-updated' as const,
        timestamp: project.updatedAt.toISOString(),
        data: {
          title: 'プロジェクト更新',
          description: `"${project.name}" が更新されました (進捗: ${project.progress}%)`,
          priority: 'medium' as const,
          value: project.progress
        }
      })),

      // リスクアラート
      ...riskAlerts.map(alert => ({
        id: `risk-${alert.id}-${alert.updatedAt.getTime()}`,
        type: 'risk-alert' as const,
        timestamp: alert.updatedAt.toISOString(),
        data: {
          title: '財務リスクアラート',
          description: `顧客ID ${alert.customerId} のリスクスコア: ${alert.riskScore.toFixed(1)}%`,
          priority: alert.riskScore >= 9 ? 'critical' as const : 'high' as const,
          value: alert.riskScore
        }
      })),

      // 新規ユーザー
      ...newUsers.map(user => ({
        id: `user-${user.id}-${user.createdAt.getTime()}`,
        type: 'user-joined' as const,
        timestamp: user.createdAt.toISOString(),
        userId: user.id,
        userName: user.name,
        data: {
          title: '新規ユーザー',
          description: `${user.name} が参加しました`,
          priority: 'low' as const
        }
      })),

      // 売上更新
      ...revenueUpdates.map(revenue => ({
        id: `revenue-${revenue.id}-${revenue.createdAt.getTime()}`,
        type: 'revenue-update' as const,
        timestamp: revenue.createdAt.toISOString(),
        data: {
          title: '売上更新',
          description: `新規LTV: ¥${revenue.currentLtv.toLocaleString()}`,
          priority: revenue.currentLtv > 100000 ? 'high' as const : 'medium' as const,
          value: revenue.currentLtv,
          change: revenue.ltv12Months - revenue.currentLtv
        }
      }))
    ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching real-time events:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch events',
        events: []
      },
      { status: 500 }
    );
  }
}