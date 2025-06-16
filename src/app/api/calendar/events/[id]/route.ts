import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { CalendarEvent, UpdateEventRequest, EventType, EventCategory } from '@/types/calendar';

const prisma = new PrismaClient();

// GET /api/calendar/events/[id] - 特定イベント取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // 個人予定の場合
    if (id.startsWith('personal_')) {
      const realId = id.replace('personal_', '');
      const personalSchedule = await prisma.personal_schedules.findUnique({
        where: { id: realId },
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

      if (!personalSchedule) {
        return NextResponse.json(
          { error: '個人予定が見つかりません' },
          { status: 404 }
        );
      }

      const formattedEvent: CalendarEvent = {
        id: `personal_${personalSchedule.id}`,
        title: personalSchedule.title,
        date: personalSchedule.date,
        time: personalSchedule.time,
        endTime: personalSchedule.endTime || undefined,
        type: 'PERSONAL' as EventType,
        userId: personalSchedule.userId || undefined,
        category: 'PERSONAL' as EventCategory,
        importance: 0.6,
        priority: personalSchedule.priority,
        isRecurring: false,
        isAllDay: personalSchedule.isAllDay,
        description: personalSchedule.description || '',
        participants: [],
        location: personalSchedule.location || undefined,
        users: personalSchedule.users ? {
          id: personalSchedule.users.id,
          name: personalSchedule.users.name,
          color: personalSchedule.users.color
        } : undefined
      };

      return NextResponse.json(formattedEvent);
    }

    // 通常のカレンダーイベントの場合
    const event = await prisma.calendar_events.findUnique({
      where: { id },
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
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'イベントが見つかりません' },
        { status: 404 }
      );
    }

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

    return NextResponse.json(formattedEvent);

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

// PUT /api/calendar/events/[id] - イベント更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body: UpdateEventRequest = await request.json();

    // 個人予定の場合
    if (id.startsWith('personal_')) {
      const realId = id.replace('personal_', '');
      
      // 既存個人予定確認
      const existingSchedule = await prisma.personal_schedules.findUnique({
        where: { id: realId }
      });

      if (!existingSchedule) {
        return NextResponse.json(
          { error: '個人予定が見つかりません' },
          { status: 404 }
        );
      }

      // 更新データ準備
      const updateData: {
        title?: string;
        date?: string;
        time?: string;
        endTime?: string;
        description?: string;
        location?: string;
        isAllDay?: boolean;
      } = {};
      
      if (body.title !== undefined) updateData.title = body.title;
      if (body.date !== undefined) updateData.date = body.date;
      if (body.time !== undefined) updateData.time = body.time;
      if (body.endTime !== undefined) updateData.endTime = body.endTime;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.location !== undefined) updateData.location = body.location;
      // isAllDayは個人予定では現在未対応だが、将来対応時のため
      // if (body.isAllDay !== undefined) updateData.isAllDay = body.isAllDay;

      // 個人予定更新
      const updatedSchedule = await prisma.personal_schedules.update({
        where: { id: realId },
        data: updateData,
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
        id: `personal_${updatedSchedule.id}`,
        title: updatedSchedule.title,
        date: updatedSchedule.date,
        time: updatedSchedule.time,
        endTime: updatedSchedule.endTime || undefined,
        type: 'PERSONAL' as EventType,
        userId: updatedSchedule.userId || undefined,
        category: 'PERSONAL' as EventCategory,
        importance: 0.6,
        priority: updatedSchedule.priority,
        isRecurring: false,
        isAllDay: updatedSchedule.isAllDay,
        description: updatedSchedule.description || '',
        participants: [],
        location: updatedSchedule.location || undefined,
        users: updatedSchedule.users ? {
          id: updatedSchedule.users.id,
          name: updatedSchedule.users.name,
          color: updatedSchedule.users.color
        } : undefined
      };

      return NextResponse.json(formattedEvent);
    }

    // 通常のカレンダーイベントの場合
    // 既存イベント確認
    const existingEvent = await prisma.calendar_events.findUnique({
      where: { id }
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'イベントが見つかりません' },
        { status: 404 }
      );
    }

    // 更新データ準備
    const updateData: {
      title?: string;
      date?: string;
      time?: string;
      endTime?: string;
      category?: EventCategory;
      importance?: number;
      description?: string;
      participants?: string[];
      location?: string;
      projectId?: string;
      taskId?: string;
      appointmentId?: string;
    } = {};
    
    if (body.title !== undefined) updateData.title = body.title;
    if (body.date !== undefined) updateData.date = body.date;
    if (body.time !== undefined) updateData.time = body.time;
    if (body.endTime !== undefined) updateData.endTime = body.endTime;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.importance !== undefined) updateData.importance = body.importance;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.participants !== undefined) updateData.participants = body.participants;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.projectId !== undefined) updateData.projectId = body.projectId;
    if (body.taskId !== undefined) updateData.taskId = body.taskId;
    if (body.appointmentId !== undefined) updateData.appointmentId = body.appointmentId;

    // イベント更新
    const updatedEvent = await prisma.calendar_events.update({
      where: { id },
      data: updateData,
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
        }
      }
    });

    const formattedEvent: CalendarEvent = {
      id: updatedEvent.id,
      title: updatedEvent.title,
      date: updatedEvent.date,
      time: updatedEvent.time,
      endTime: updatedEvent.endTime || undefined,
      type: updatedEvent.type as EventType,
      userId: updatedEvent.userId || undefined,
      projectId: updatedEvent.projectId || undefined,
      taskId: updatedEvent.taskId || undefined,
      appointmentId: updatedEvent.appointmentId || undefined,
      category: updatedEvent.category as EventCategory,
      importance: updatedEvent.importance,
      isRecurring: updatedEvent.isRecurring,
      recurringPattern: updatedEvent.recurringPattern || undefined,
      colorCode: updatedEvent.colorCode || undefined,
      isAllDay: updatedEvent.isAllDay,
      description: updatedEvent.description,
      participants: updatedEvent.participants,
      location: updatedEvent.location || undefined
    };

    return NextResponse.json(formattedEvent);

  } catch (error) {
    console.error('[Calendar API] PUT Error:', error);
    return NextResponse.json(
      { error: 'イベントの更新に失敗しました' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/calendar/events/[id] - イベント削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // 個人予定の場合
    if (id.startsWith('personal_')) {
      const realId = id.replace('personal_', '');
      
      // 既存個人予定確認
      const existingSchedule = await prisma.personal_schedules.findUnique({
        where: { id: realId }
      });

      if (!existingSchedule) {
        return NextResponse.json(
          { error: '個人予定が見つかりません' },
          { status: 404 }
        );
      }

      // 個人予定削除
      await prisma.personal_schedules.delete({
        where: { id: realId }
      });

      return NextResponse.json(
        { message: '個人予定が削除されました' },
        { status: 200 }
      );
    }

    // 通常のカレンダーイベントの場合
    // 既存イベント確認
    const existingEvent = await prisma.calendar_events.findUnique({
      where: { id }
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'イベントが見つかりません' },
        { status: 404 }
      );
    }

    // イベント削除
    await prisma.calendar_events.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'イベントが削除されました' },
      { status: 200 }
    );

  } catch (error) {
    console.error('[Calendar API] DELETE Error:', error);
    return NextResponse.json(
      { error: 'イベントの削除に失敗しました' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}