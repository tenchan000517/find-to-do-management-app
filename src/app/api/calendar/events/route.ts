import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { CalendarEvent, CreateEventRequest, CalendarFilters, PrismaCalendarEvent, EventCategory, EventType, PriorityLevel } from '@/types/calendar';

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
            status: true,
            priority: true
          }
        },
        appointments: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            priority: true
          }
        },
        recurring_rules: true
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ]
    });

    // タスクをcalendar_eventsとして取得
    const tasks = await prisma.tasks.findMany({
      where: {
        dueDate: { 
          not: null,
          gte: filters.startDate, 
          lte: filters.endDate 
        },
        isArchived: false,
        ...(filters.userId && { userId: filters.userId })
      },
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
        }
      }
    });

    // アポをcalendar_eventsとして取得
    const appointments = await prisma.appointments.findMany({
      where: {
        calendar_events: {
          some: {
            date: { gte: filters.startDate, lte: filters.endDate },
            ...(filters.userId && { userId: filters.userId })
          }
        }
      },
      include: { 
        calendar_events: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                color: true
              }
            }
          }
        }
      }
    });

    // レスポンス用にフォーマット
    const formattedEvents: CalendarEvent[] = events.map((event: PrismaCalendarEvent) => ({
      id: event.id,
      title: event.title,
      date: event.date,
      time: event.time,
      endTime: event.endTime || undefined,
      type: event.type as EventType,
      userId: event.userId || undefined,
      projectId: event.projectId || undefined,
      taskId: event.taskId || undefined,
      appointmentId: event.appointmentId || undefined,
      category: 'EVENT' as EventCategory,
      importance: event.importance,
      priority: undefined, // 後でタスクやアポから取得
      isRecurring: event.isRecurring,
      recurringPattern: event.recurringPattern || undefined,
      colorCode: event.colorCode || undefined,
      isAllDay: event.isAllDay,
      description: event.description,
      participants: event.participants,
      location: event.location || undefined,
      // リレーションデータを含める
      users: event.users ? {
        id: event.users.id,
        name: event.users.name,
        color: event.users.color
      } : undefined,
      projects: event.projects ? {
        id: event.projects.id,
        name: event.projects.name,
        priority: undefined
      } : undefined,
      tasks: event.tasks ? {
        id: event.tasks.id,
        title: event.tasks.title,
        status: event.tasks.status,
        priority: event.tasks.priority as PriorityLevel | undefined
      } : undefined,
      appointments: event.appointments ? {
        id: event.appointments.id,
        companyName: event.appointments.companyName,
        contactName: event.appointments.contactName,
        priority: event.appointments.priority as PriorityLevel | undefined
      } : undefined
    }));

    // タスクをイベントに変換
    const taskEvents: CalendarEvent[] = tasks.map(task => ({
      id: `task_${task.id}`,
      title: task.title,
      date: task.dueDate || new Date().toISOString().split('T')[0],
      time: '23:59', // デフォルト時刻
      type: 'DEADLINE' as EventType,
      userId: task.userId,
      projectId: task.projectId || undefined,
      taskId: task.id,
      category: 'TASK_DUE' as EventCategory,
      importance: 0.8, // タスクは高重要度として扱う
      priority: task.priority as PriorityLevel | undefined,
      isRecurring: false,
      isAllDay: false,
      description: task.description || '',
      participants: [],
      users: task.users ? {
        id: task.users.id,
        name: task.users.name,
        color: task.users.color
      } : undefined,
      projects: task.projects ? {
        id: task.projects.id,
        name: task.projects.name,
        priority: undefined
      } : undefined,
      tasks: {
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority as PriorityLevel | undefined
      }
    }));

    // アポをイベントに変換
    const appointmentEvents: CalendarEvent[] = appointments.flatMap(apt => 
      apt.calendar_events.map(ce => ({
        id: `apt_${apt.id}_${ce.id}`,
        title: `${apt.companyName} - ${apt.contactName}`,
        date: ce.date,
        time: ce.time,
        endTime: ce.endTime || undefined,
        type: 'MEETING' as EventType,
        userId: ce.userId || undefined,
        appointmentId: apt.id,
        category: 'APPOINTMENT' as EventCategory,
        importance: 0.7, // アポは高重要度として扱う
        priority: apt.priority as PriorityLevel | undefined,
        isRecurring: ce.isRecurring,
        isAllDay: ce.isAllDay,
        description: ce.description,
        participants: ce.participants,
        location: ce.location || undefined,
        users: ce.users ? {
          id: ce.users.id,
          name: ce.users.name,
          color: ce.users.color
        } : undefined,
        appointments: {
          id: apt.id,
          companyName: apt.companyName,
          contactName: apt.contactName,
          priority: apt.priority as PriorityLevel | undefined
        }
      }))
    );

    // 全イベントを統合
    const allEvents = [...formattedEvents, ...taskEvents, ...appointmentEvents];

    return NextResponse.json({
      events: allEvents,
      totalCount: allEvents.length
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

    // ユーザーIDはリクエストから取得（未指定の場合は全員向けイベント）
    const userId = body.userId || undefined;

    // カテゴリの自動判定
    let autoCategory: EventCategory = body.category;
    let eventType: string = 'EVENT';
    
    if (body.taskId) {
      autoCategory = 'TASK_DUE';
      eventType = 'DEADLINE';
    } else if (body.appointmentId) {
      autoCategory = 'APPOINTMENT';
      eventType = 'MEETING';
    } else if (body.projectId) {
      autoCategory = 'PROJECT';
      eventType = 'EVENT';
    }

    // イベント作成
    const event = await prisma.calendar_events.create({
      data: {
        id: `cal_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        title: body.title,
        date: body.date,
        time: body.time,
        endTime: body.endTime || null,
        type: eventType as any,
        description: body.description || '',
        participants: body.participants || [],
        location: body.location || null,
        userId: userId || null,
        projectId: body.projectId || null,
        taskId: body.taskId || null,
        appointmentId: body.appointmentId || null,
        category: autoCategory,
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
      userId: event.userId || undefined,
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