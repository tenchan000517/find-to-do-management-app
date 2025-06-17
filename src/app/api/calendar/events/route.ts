import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { CalendarEvent, CreateEventRequest, CalendarFilters, PrismaCalendarEvent, EventCategory, EventType, PriorityLevel } from '@/types/calendar';
import { getTodayJST, getJSTDateAfterDays, getJSTTimestampForID } from '@/lib/utils/datetime-jst';

const prisma = new PrismaClient();

// GET /api/calendar/events - イベント取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const filters: CalendarFilters = {
      startDate: searchParams.get('startDate') || getTodayJST(),
      endDate: searchParams.get('endDate') || getJSTDateAfterDays(30),
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
    const formattedEvents: CalendarEvent[] = events.map((event: any) => ({
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
      // 担当者システム統合
      createdBy: event.createdBy || undefined,
      assignedTo: event.assignedTo || undefined,
      creator: event.creator ? {
        id: event.creator.id,
        name: event.creator.name,
        color: event.creator.color
      } : undefined,
      assignee: event.assignee ? {
        id: event.assignee.id,
        name: event.assignee.name,
        color: event.assignee.color
      } : undefined,
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
    type TaskWithRelations = {
      id: string;
      title: string;
      description: string | null;
      dueDate: string | null;
      userId: string;
      projectId: string | null;
      priority: string;
      status: string;
      users: { id: string; name: string; color: string } | null;
      projects: { id: string; name: string } | null;
    };
    
    const taskEvents: CalendarEvent[] = tasks.map((task: TaskWithRelations) => ({
      id: `task_${task.id}`,
      title: task.title,
      date: task.dueDate || getTodayJST(),
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
    type AppointmentWithCalendarEvents = {
      id: string;
      companyName: string;
      contactName: string;
      priority: string;
      calendar_events: Array<{
        id: string;
        date: string;
        time: string;
        endTime: string | null;
        userId: string | null;
        isRecurring: boolean;
        isAllDay: boolean;
        description: string;
        participants: string[];
        location: string | null;
        users: { id: string; name: string; color: string } | null;
      }>;
    };
    
    const appointmentEvents: CalendarEvent[] = appointments.flatMap((apt: AppointmentWithCalendarEvents) => 
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

    // 個人予定をイベントに変換
    const personalSchedules = await prisma.personal_schedules.findMany({
      where: {
        date: { 
          gte: filters.startDate, 
          lte: filters.endDate 
        },
        ...(filters.userId && { userId: filters.userId })
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

    type PersonalScheduleWithUser = {
      id: string;
      title: string;
      date: string;
      time: string;
      endTime: string | null;
      userId: string | null;
      priority: string | null;
      isAllDay: boolean;
      description: string | null;
      location: string | null;
      users: { id: string; name: string; color: string } | null;
    };
    
    const personalEvents: CalendarEvent[] = personalSchedules.map((ps: PersonalScheduleWithUser) => ({
      id: `personal_${ps.id}`,
      title: ps.title,
      date: ps.date,
      time: ps.time,
      endTime: ps.endTime || undefined,
      type: 'PERSONAL' as EventType,
      userId: ps.userId || undefined,
      category: 'PERSONAL' as EventCategory,
      importance: 0.6,
      priority: ps.priority as PriorityLevel | undefined,
      isRecurring: false,
      isAllDay: ps.isAllDay,
      description: ps.description || '',
      participants: [],
      location: ps.location || undefined,
      users: ps.users ? {
        id: ps.users.id,
        name: ps.users.name,
        color: ps.users.color
      } : undefined
    }));

    // 全イベントを統合
    const allEvents = [...formattedEvents, ...taskEvents, ...appointmentEvents, ...personalEvents];

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
    let eventType: 'MEETING' | 'EVENT' | 'DEADLINE' = 'EVENT';
    
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
        id: `cal_${getJSTTimestampForID()}_${Math.random().toString(36).slice(2, 11)}`,
        title: body.title,
        date: body.date,
        time: body.time,
        endTime: body.endTime || null,
        type: eventType,
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