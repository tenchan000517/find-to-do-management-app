// Phase 3: Real-time metrics endpoint
import { NextResponse } from 'next/server';
import prisma from '@/lib/database/prisma';

export async function GET() {
  try {
    // アクティブユーザー数を計算（30分以内の活動）
    const activeUsers = await prisma.users.count({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000)
        }
      }
    });

    // 今日完了したタスク数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tasksCompleted = await prisma.tasks.count({
      where: {
        status: 'COMPLETE',
        updatedAt: {
          gte: today
        }
      }
    });

    // 進行中のプロジェクト数
    const projectsInProgress = await prisma.projects.count({
      where: {
        status: {
          in: ['PLANNING', 'ACTIVE']
        }
      }
    });

    // 今月の売上計算
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const revenueResult = await prisma.customer_ltv_analysis.aggregate({
      _sum: {
        totalLtv: true
      },
      where: {
        updatedAt: {
          gte: thisMonth
        }
      }
    });

    // 平均リスクスコア
    const riskResult = await prisma.customer_ltv_analysis.aggregate({
      _avg: {
        confidenceScore: true
      },
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 過去7日間
        }
      }
    });

    // システム応答時間（実際の実装では適切な計測方法を使用）
    const responseTime = Math.floor(Math.random() * 50) + 80;

    const metrics = {
      activeUsers,
      tasksCompleted,
      projectsInProgress,
      revenue: Math.round(Number(revenueResult._sum.totalLtv) || 0),
      riskScore: Math.round(((riskResult._avg?.confidenceScore || 0.8) * 10)) / 10,
      responseTime,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching real-time metrics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch metrics',
        activeUsers: 0,
        tasksCompleted: 0,
        projectsInProgress: 0,
        revenue: 0,
        riskScore: 0,
        responseTime: 999
      },
      { status: 500 }
    );
  }
}