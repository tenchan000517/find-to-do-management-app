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
import { cache } from '@/lib/cache/memory-cache';
import { getJSTISOString } from '@/lib/utils/datetime-jst';

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

    // キャッシュキー生成
    const cacheKey = `calendar:unified:${searchParams.toString()}`;
    
    // リアルタイム更新のためキャッシュを一時的に無効化
    // const cached = await cache.get(cacheKey);
    // if (cached) {
    //   return NextResponse.json({
    //     ...cached,
    //     _cached: true,
    //     _cacheTimestamp: getJSTISOString()
    //   });
    // }

    // 並列クエリで全データ取得
    const baseWhere = {
      date: {
        gte: query.startDate,
        lte: query.endDate,
      },
      ...(query.userId && { userId: query.userId })
    };

    const queryPromises = [];
    
    // 1. 個人予定取得
    if (query.includePersonal) {
      queryPromises.push(
        prisma.personal_schedules.findMany({
          where: baseWhere,
          select: {
            id: true,
            title: true,
            date: true,
            time: true,
            endTime: true,
            description: true,
            location: true,
            priority: true,
            userId: true,
            isAllDay: true,
            users: {
              select: {
                id: true,
                name: true,
                color: true,
              }
            }
          }
        })
      );
    } else {
      queryPromises.push(Promise.resolve([]));
    }
    
    // 2. カレンダーイベント取得
    if (query.includePublic) {
      queryPromises.push(
        prisma.calendar_events.findMany({
          where: baseWhere,
          select: {
            id: true,
            title: true,
            date: true,
            time: true,
            endTime: true,
            type: true,
            category: true,
            description: true,
            location: true,
            importance: true,
            colorCode: true,
            isAllDay: true,
            userId: true,
            projectId: true,
            taskId: true,
            appointmentId: true,
            users: {
              select: {
                id: true,
                name: true,
                color: true,
              }
            }
          }
        })
      );
    } else {
      queryPromises.push(Promise.resolve([]));
    }
    
    // 3. タスク期限取得
    if (query.includePublic) {
      queryPromises.push(
        prisma.tasks.findMany({
          where: {
            dueDate: {
              gte: query.startDate,
              lte: query.endDate,
            },
            isArchived: false,
            ...(query.userId && { userId: query.userId })
          },
          select: {
            id: true,
            title: true,
            description: true,
            dueDate: true,
            priority: true,
            userId: true,
            projectId: true,
            users: {
              select: {
                id: true,
                name: true,
                color: true,
              }
            }
          }
        })
      );
    } else {
      queryPromises.push(Promise.resolve([]));
    }
    
    // 4. アポイントメント取得
    if (query.includePublic) {
      queryPromises.push(
        prisma.appointments.findMany({
          where: {
            calendar_events: {
              some: {
                date: {
                  gte: query.startDate,
                  lte: query.endDate,
                },
                ...(query.userId && { userId: query.userId })
              }
            }
          },
          select: {
            id: true,
            companyName: true,
            contactName: true,
            priority: true,
            nextAction: true,
            calendar_events: {
              include: {
                users: {
                  select: {
                    id: true,
                    name: true,
                    color: true,
                  }
                }
              }
            }
          }
        })
      );
    } else {
      queryPromises.push(Promise.resolve([]));
    }

    // 並列実行
    const [personalSchedules, calendarEvents, tasks, appointments] = await Promise.all(queryPromises);
    
    // データ変換とマージ
    const events: UnifiedCalendarEvent[] = [];
    const sources = {
      calendar_events: 0,
      personal_schedules: 0,
      tasks: 0,
      appointments: 0,
    };

    // 個人予定の変換
    personalSchedules.forEach((schedule: any) => {
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
        isRecurring: false,
        userId: schedule.userId,
        users: schedule.users ? {
          id: schedule.users.id,
          name: schedule.users.name,
          color: schedule.users.color,
        } : undefined,
        isAllDay: schedule.isAllDay,
        participants: [],
        importance: 0.5,
      });
    });
    sources.personal_schedules = personalSchedules.length;

    // カレンダーイベントの変換（アポイントメント関連以外のみ）
    calendarEvents.forEach((event: any) => {
      // アポイントメント関連のカレンダーイベントは除外（重複防止）
      if (event.appointmentId) {
        sources.appointments++; // カウントのみ
        return;
      }
      
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
        isRecurring: event.isRecurring || false,
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
        participants: event.participants || [],
      });
    });
    sources.calendar_events = calendarEvents.length;

    // タスクの変換
    tasks.forEach((task: any) => {
      if (task.dueDate) {
        events.push({
          id: `task_${task.id}`,
          title: `📋 ${task.title}`,
          date: task.dueDate,
          time: '23:59',
          type: 'DEADLINE' as EventType,
          category: 'TASK_DUE' as EventCategory,
          description: task.description || undefined,
          source: 'tasks',
          isPersonal: false,
          priority: task.priority as PriorityLevel,
          isRecurring: false,
          userId: task.userId,
          projectId: task.projectId || undefined,
          taskId: task.id,
          users: task.users ? {
            id: task.users.id,
            name: task.users.name,
            color: task.users.color,
          } : undefined,
          projects: task.projects ? {
            id: task.projects.id,
            name: task.projects.name,
          } : undefined,
          isAllDay: true,
          participants: [],
          importance: 0.8,
        });
      }
    });
    sources.tasks = tasks.filter((t: any) => t.dueDate).length;

    // アポイントメントの変換
    appointments.forEach((appointment: any) => {
      appointment.calendar_events.forEach((calEvent: any) => {
        events.push({
          id: `appointment_${appointment.id}_${calEvent.id}`,
          title: appointment.nextAction || `🤝 ${appointment.companyName} - ${appointment.contactName}`,
          date: calEvent.date,
          time: calEvent.time,
          endTime: calEvent.endTime || undefined,
          type: 'MEETING' as EventType,
          category: 'APPOINTMENT' as EventCategory,
          description: calEvent.description || `${appointment.companyName}との打ち合わせ`,
          location: calEvent.location || undefined,
          source: 'appointments',
          isPersonal: false,
          priority: appointment.priority as PriorityLevel,
          isRecurring: false,
          userId: calEvent.userId,
          appointmentId: appointment.id,
          users: calEvent.users ? {
            id: calEvent.users.id,
            name: calEvent.users.name,
            color: calEvent.users.color,
          } : undefined,
          appointments: {
            id: appointment.id,
            companyName: appointment.companyName,
            contactName: appointment.contactName,
            priority: appointment.priority as PriorityLevel,
          },
          isAllDay: calEvent.isAllDay,
          participants: calEvent.participants || [],
          importance: 0.7,
        });
      });
    });
    sources.appointments = appointments.reduce((total: number, apt: any) => total + apt.calendar_events.length, 0);

    // イベントを日時順でソート（JST基準）
    events.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return (a.time || '00:00').localeCompare(b.time || '00:00');
    });

    const response: UnifiedCalendarResponse = {
      events,
      totalCount: events.length,
      sources,
    };

    // キャッシュに保存（5分間）
    await cache.set(cacheKey, response, 300);

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