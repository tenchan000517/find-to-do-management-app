// Phase 3: Real-time API endpoints for WebSocket fallback
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    switch (type) {
      case 'metrics':
        return await getMetrics();
      case 'events':
        return await getEvents();
      default:
        return await getDashboardData();
    }
  } catch (error) {
    console.error('Realtime API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getMetrics() {
  try {
    // アクティブユーザー数を計算
    const activeUsers = await prisma.user.count({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000) // 30分以内
        }
      }
    });

    // 今日完了したタスク数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tasksCompleted = await prisma.task.count({
      where: {
        status: 'COMPLETED',
        updatedAt: {
          gte: today
        }
      }
    });

    // 進行中のプロジェクト数
    const projectsInProgress = await prisma.project.count({
      where: {
        status: {
          in: ['planning', 'in_progress']
        }
      }
    });

    // 今月の売上（customer_ltv_analysis から取得）
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const revenueResult = await prisma.customerLtvAnalysis.aggregate({
      _sum: {
        currentLtv: true
      },
      where: {
        updatedAt: {
          gte: thisMonth
        }
      }
    });

    // リスクスコアの計算（平均）
    const riskResult = await prisma.customerLtvAnalysis.aggregate({
      _avg: {
        riskScore: true
      }
    });

    const metrics = {
      activeUsers,
      tasksCompleted,
      projectsInProgress,
      revenue: revenueResult._sum.currentLtv || 0,
      riskScore: riskResult._avg.riskScore || 0,
      responseTime: Math.floor(Math.random() * 100) + 50 // 模擬応答時間
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

async function getEvents() {
  try {
    // 最近のタスク完了イベント
    const recentTasks = await prisma.task.findMany({
      where: {
        status: 'COMPLETED',
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24時間以内
        }
      },
      include: {
        assignee: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10
    });

    // 最近のプロジェクト更新
    const recentProjects = await prisma.project.findMany({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 5
    });

    // リスクアラート
    const riskAlerts = await prisma.customerLtvAnalysis.findMany({
      where: {
        riskScore: {
          gte: 7 // 高リスク
        },
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 5
    });

    const events = [
      // タスク完了イベント
      ...recentTasks.map(task => ({
        id: `task-${task.id}`,
        type: 'task-completed' as const,
        timestamp: task.updatedAt.toISOString(),
        userId: task.assigneeId,
        userName: task.assignee?.name,
        data: {
          title: 'タスク完了',
          description: task.title,
          priority: 'medium' as const
        }
      })),

      // プロジェクト更新イベント
      ...recentProjects.map(project => ({
        id: `project-${project.id}`,
        type: 'project-updated' as const,
        timestamp: project.updatedAt.toISOString(),
        data: {
          title: 'プロジェクト更新',
          description: project.name,
          priority: 'medium' as const,
          value: project.progress
        }
      })),

      // リスクアラート
      ...riskAlerts.map(alert => ({
        id: `risk-${alert.id}`,
        type: 'risk-alert' as const,
        timestamp: alert.updatedAt.toISOString(),
        data: {
          title: '財務リスクアラート',
          description: `顧客 ${alert.customerId} のリスクスコアが ${alert.riskScore}% に上昇`,
          priority: alert.riskScore >= 9 ? 'critical' as const : 'high' as const,
          value: alert.riskScore
        }
      }))
    ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

async function getDashboardData() {
  try {
    const [metrics, events] = await Promise.all([
      getMetrics().then(res => res.json()),
      getEvents().then(res => res.json())
    ]);

    return NextResponse.json({
      metrics,
      events,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}