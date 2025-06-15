import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { 
  UnifiedCalendarEvent, 
  UnifiedCalendarQuery,
  UnifiedCalendarResponse,
  EventType,
  EventCategory,
  PriorityLevel 
} from '@/types/calendar';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const query: UnifiedCalendarQuery = {
      startDate: searchParams.get('startDate') || '',
      endDate: searchParams.get('endDate') || '',
      userId: searchParams.get('userId') || undefined,
      includePersonal: searchParams.get('includePersonal') !== 'false',
      includePublic: searchParams.get('includePublic') !== 'false',
    };

    if (!query.startDate || !query.endDate) {
      return NextResponse.json(
        { error: 'startDate と endDate は必須項目です' },
        { status: 400 }
      );
    }

    const events: UnifiedCalendarEvent[] = [];
    const sources = {
      calendar_events: 0,
      personal_schedules: 0,
      tasks: 0,
      appointments: 0,
    };

    // 1. 個人予定の取得
    if (query.includePersonal) {
      const personalWhere: any = {
        date: {
          gte: query.startDate,
          lte: query.endDate,
        },
      };

      if (query.userId) {
        personalWhere.userId = query.userId;
      }

      const personalSchedules = await prisma.personal_schedules.findMany({
        where: personalWhere,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
        orderBy: [
          { date: 'asc' },
          { time: 'asc' },
        ],
      });

      personalSchedules.forEach((schedule) => {
        events.push({
          id: schedule.id,
          title: schedule.title,
          date: schedule.date,
          time: schedule.time,
          endTime: schedule.endTime || undefined,
          type: 'EVENT' as EventType,
          category: 'PERSONAL' as EventCategory,
          description: schedule.description || undefined,
          location: schedule.location || undefined,
          source: 'personal_schedules',
          isPersonal: true,
          priority: schedule.priority as PriorityLevel,
          userId: schedule.userId,
          users: schedule.users ? {
            id: schedule.users.id,
            name: schedule.users.name,
            color: schedule.users.color,
          } : undefined,
          isAllDay: schedule.isAllDay,
        });
      });

      sources.personal_schedules = personalSchedules.length;
    }

    // 2. パブリックイベントの取得
    if (query.includePublic) {
      const calendarWhere: any = {
        date: {
          gte: query.startDate,
          lte: query.endDate,
        },
      };

      if (query.userId) {
        calendarWhere.userId = query.userId;
      }

      const calendarEvents = await prisma.calendar_events.findMany({
        where: calendarWhere,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          projects: {
            select: {
              id: true,
              name: true,
              priority: true,
            },
          },
          tasks: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
            },
          },
          appointments: {
            select: {
              id: true,
              companyName: true,
              contactName: true,
              priority: true,
            },
          },
        },
        orderBy: [
          { date: 'asc' },
          { time: 'asc' },
        ],
      });

      calendarEvents.forEach((event) => {
        events.push({
          id: event.id,
          title: event.title,
          date: event.date,
          time: event.time,
          endTime: event.endTime || undefined,
          type: event.type as EventType,
          category: event.category as EventCategory,
          description: event.description || undefined,
          location: event.location || undefined,
          source: 'calendar_events',
          isPersonal: false,
          userId: event.userId || undefined,
          projectId: event.projectId || undefined,
          taskId: event.taskId || undefined,
          appointmentId: event.appointmentId || undefined,
          users: event.users ? {
            id: event.users.id,
            name: event.users.name,
            color: event.users.color,
          } : undefined,
          colorCode: event.colorCode || undefined,
          isAllDay: event.isAllDay,
          importance: event.importance,
        });
      });

      sources.calendar_events = calendarEvents.length;
    }

    // 3. タスク期限の取得（オプション）
    if (query.includePublic) {
      const taskWhere: any = {
        dueDate: {
          gte: query.startDate,
          lte: query.endDate,
        },
        isArchived: false,
      };

      if (query.userId) {
        taskWhere.userId = query.userId;
      }

      const tasks = await prisma.tasks.findMany({
        where: taskWhere,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          projects: {
            select: {
              id: true,
              name: true,
              priority: true,
            },
          },
        },
        orderBy: [
          { dueDate: 'asc' },
        ],
      });

      tasks.forEach((task) => {
        if (task.dueDate) {
          events.push({
            id: `task_${task.id}`,
            title: `📋 ${task.title}`,
            date: task.dueDate,
            time: '23:59', // タスク期限は終日扱い
            type: 'DEADLINE' as EventType,
            category: 'TASK_DUE' as EventCategory,
            description: task.description || undefined,
            source: 'tasks',
            isPersonal: false,
            priority: task.priority as PriorityLevel,
            userId: task.userId,
            projectId: task.projectId || undefined,
            taskId: task.id,
            users: {
              id: task.users.id,
              name: task.users.name,
              color: task.users.color,
            },
            isAllDay: true,
          });
        }
      });

      sources.tasks = tasks.filter(t => t.dueDate).length;
    }

    // 4. アポイントメントの取得（オプション）
    if (query.includePublic) {
      // ここではアポイントメントが関連するcalendar_eventsを取得
      // 別途アポイントメント専用の日付フィールドがあれば、そちらも考慮
      const appointmentEvents = await prisma.calendar_events.findMany({
        where: {
          appointmentId: { not: null },
          date: {
            gte: query.startDate,
            lte: query.endDate,
          },
        },
        include: {
          appointments: {
            select: {
              id: true,
              companyName: true,
              contactName: true,
              priority: true,
            },
          },
          users: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      });

      appointmentEvents.forEach((event) => {
        if (event.appointments) {
          // 既にcalendar_eventsとして追加されているので、ここでは重複を避ける
          // sources.appointmentsのカウントのみ行う
          sources.appointments++;
        }
      });
    }

    // イベントを日時順でソート
    events.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

    const response: UnifiedCalendarResponse = {
      events,
      totalCount: events.length,
      sources,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('統合カレンダー取得エラー:', error);
    return NextResponse.json(
      { error: '統合カレンダーの取得に失敗しました' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}