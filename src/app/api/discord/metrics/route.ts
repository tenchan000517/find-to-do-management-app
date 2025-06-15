import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const daysParam = searchParams.get('days');
    const days = daysParam ? parseInt(daysParam, 10) : 30;

    if (days < 1 || days > 365) {
      return NextResponse.json(
        { error: '日数は1から365の間で指定してください' },
        { status: 400 }
      );
    }

    const metrics = await prisma.discord_metrics.findMany({
      orderBy: {
        date: 'desc'
      },
      take: days
    });

    const formattedMetrics = metrics.map((metric: any) => ({
      id: metric.id,
      date: metric.date.toISOString().split('T')[0],
      memberCount: metric.memberCount,
      onlineCount: metric.onlineCount,
      dailyMessages: metric.dailyMessages,
      dailyUserMessages: metric.dailyUserMessages,
      dailyStaffMessages: metric.dailyStaffMessages,
      activeUsers: metric.activeUsers,
      engagementScore: metric.engagementScore,
      channelMessageStats: metric.channelMessageStats,
      staffChannelStats: metric.staffChannelStats,
      roleCounts: metric.roleCounts,
      createdAt: metric.createdAt.toISOString(),
      updatedAt: metric.updatedAt.toISOString()
    }));

    return NextResponse.json({
      data: formattedMetrics.reverse(),
      total: formattedMetrics.length,
      daysRequested: days
    });

  } catch (error) {
    console.error('Discord metrics API error:', error);
    return NextResponse.json(
      { error: 'メトリクスデータの取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      date,
      memberCount,
      onlineCount,
      dailyMessages,
      dailyUserMessages,
      dailyStaffMessages,
      activeUsers,
      engagementScore,
      channelMessageStats,
      staffChannelStats,
      roleCounts
    } = body;

    const metric = await prisma.discord_metrics.upsert({
      where: {
        date: new Date(date)
      },
      update: {
        memberCount,
        onlineCount,
        dailyMessages,
        dailyUserMessages,
        dailyStaffMessages,
        activeUsers,
        engagementScore,
        channelMessageStats: channelMessageStats || {},
        staffChannelStats: staffChannelStats || {},
        roleCounts: roleCounts || {},
        updatedAt: new Date()
      },
      create: {
        date: new Date(date),
        memberCount,
        onlineCount,
        dailyMessages,
        dailyUserMessages,
        dailyStaffMessages,
        activeUsers,
        engagementScore,
        channelMessageStats: channelMessageStats || {},
        staffChannelStats: staffChannelStats || {},
        roleCounts: roleCounts || {}
      }
    });

    return NextResponse.json({
      success: true,
      data: metric
    });

  } catch (error) {
    console.error('Discord metrics POST error:', error);
    return NextResponse.json(
      { error: 'メトリクスデータの保存に失敗しました' },
      { status: 500 }
    );
  }
}