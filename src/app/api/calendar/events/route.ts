import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { CalendarEvent, CreateEventRequest, CalendarFilters, PrismaCalendarEvent, EventCategory, EventType } from '@/types/calendar';

const prisma = new PrismaClient();

// GET /api/calendar/events - イベント取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const filters: CalendarFilters = {
      startDate: searchParams.get('startDate') || new Date().toISOString().split('T')[0],
      endDate: searchParams.get('endDate') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      userId: searchParams.get('userId') || undefined,
      projectId: searchParams.get('projectId') || undefined,
      category: searchParams.get('category') as EventCategory || undefined,
      includeRecurring: searchParams.get('includeRecurring') === 'true'
    };

    // 基本フィルター条件
    const whereConditions: {
      date: { gte: string; lte: string };
      userId?: string;
      projectId?: string;
      category?: EventCategory;
    } = {
      date: {
        gte: filters.startDate,
        lte: filters.endDate
      }
    };

    if (filters.userId) {
      whereConditions.userId = filters.userId;
    }

    if (filters.projectId) {
      whereConditions.projectId = filters.projectId;
    }

    if (filters.category) {
      whereConditions.category = filters.category;
    }

    // イベント取得
    const events = await prisma.calendar_events.findMany({
      where: whereConditions,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        projects: {
          select: {
            id: true,
            name: true
          }
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        appointments: {
          select: {
            id: true,
            companyName: true,
            contactName: true
          }
        },
        recurring_rules: true
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ]
    });

    // レスポンス用にフォーマット
    const formattedEvents: CalendarEvent[] = events.map((event: PrismaCalendarEvent) => ({
      id: event.id,
      title: event.title,
      date: event.date,
      time: event.time,
      endTime: event.endTime || undefined,
      type: event.type as EventType,
      userId: event.userId,
      projectId: event.projectId || undefined,
      taskId: event.taskId || undefined,
      appointmentId: event.appointmentId || undefined,
      category: event.category as EventCategory,
      importance: event.importance,
      isRecurring: event.isRecurring,
      recurringPattern: event.recurringPattern || undefined,
      colorCode: event.colorCode || undefined,
      isAllDay: event.isAllDay,
      description: event.description,
      participants: event.participants,
      location: event.location || undefined
    }));

    return NextResponse.json({
      events: formattedEvents,
      totalCount: formattedEvents.length
    });

  } catch (error) {
    console.error('[Calendar API] GET Error:', error);
    return NextResponse.json(
      { error: 'イベントの取得に失敗しました' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/calendar/events - イベント作成
export async function POST(request: NextRequest) {
  try {
    const body: CreateEventRequest = await request.json();

    // バリデーション
    if (!body.title || !body.date || !body.time) {
      return NextResponse.json(
        { error: 'タイトル、日付、時刻は必須です' },
        { status: 400 }
      );
    }

    // デフォルトユーザーID設定（後でJWT認証に変更予定）
    const userId = 'user_kawashima';

    // イベント作成
    const event = await prisma.calendar_events.create({
      data: {
        id: `cal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: body.title,
        date: body.date,
        time: body.time,
        endTime: body.endTime || null,
        type: 'EVENT', // デフォルト
        description: body.description || '',
        participants: body.participants || [],
        location: body.location || null,
        userId: userId,
        projectId: body.projectId || null,
        taskId: body.taskId || null,
        appointmentId: body.appointmentId || null,
        category: body.category,
        importance: body.importance || 0.5,
        isRecurring: !!body.recurringRule,
        recurringPattern: null, // 繰り返しは後のフェーズで実装
        colorCode: null,
        isAllDay: false
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    const formattedEvent: CalendarEvent = {
      id: event.id,
      title: event.title,
      date: event.date,
      time: event.time,
      endTime: event.endTime || undefined,
      type: event.type as EventType,
      userId: event.userId,
      projectId: event.projectId || undefined,
      taskId: event.taskId || undefined,
      appointmentId: event.appointmentId || undefined,
      category: event.category as EventCategory,
      importance: event.importance,
      isRecurring: event.isRecurring,
      recurringPattern: event.recurringPattern || undefined,
      colorCode: event.colorCode || undefined,
      isAllDay: event.isAllDay,
      description: event.description,
      participants: event.participants,
      location: event.location || undefined
    };

    return NextResponse.json(formattedEvent, { status: 201 });

  } catch (error) {
    console.error('[Calendar API] POST Error:', error);
    return NextResponse.json(
      { error: 'イベントの作成に失敗しました' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}