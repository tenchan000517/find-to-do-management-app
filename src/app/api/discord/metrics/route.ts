import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database/prisma';

// CORS headers for Discord Bot integration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

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
      reactionStats: metric.reactionStats,
      createdAt: metric.createdAt.toISOString(),
      updatedAt: metric.updatedAt.toISOString()
    }));

    return NextResponse.json({
      data: formattedMetrics.reverse(),
      total: formattedMetrics.length,
      daysRequested: days
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Discord metrics API error:', error);
    return NextResponse.json(
      { error: 'メトリクスデータの取得に失敗しました' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authorization check for POST requests
    const authHeader = request.headers.get('authorization');
    const token = process.env.DISCORD_API_TOKEN;
    
    if (token && authHeader !== `Bearer ${token}`) {
      return NextResponse.json(
        { error: '認証エラー: 無効なトークンです' },
        { status: 401, headers: corsHeaders }
      );
    }

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
      roleCounts,
      reactionStats
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
        reactionStats: reactionStats || {},
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
        roleCounts: roleCounts || {},
        reactionStats: reactionStats || {}
      }
    });

    return NextResponse.json({
      success: true,
      data: metric
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Discord metrics POST error:', error);
    return NextResponse.json(
      { error: 'メトリクスデータの保存に失敗しました' },
      { status: 500, headers: corsHeaders }
    );
  }
}