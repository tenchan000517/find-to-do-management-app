import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { 
  PersonalSchedule, 
  CreateScheduleRequest, 
  ScheduleListQuery,
  ScheduleListResponse,
  CreateScheduleResponse,
  PriorityLevel 
} from '@/types/personal-schedule';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const query: ScheduleListQuery = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      userId: searchParams.get('userId') || undefined,
      priority: (searchParams.get('priority') as PriorityLevel) || undefined,
    };

    const where: any = {};

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.startDate && query.endDate) {
      where.date = {
        gte: query.startDate,
        lte: query.endDate,
      };
    } else if (query.startDate) {
      where.date = {
        gte: query.startDate,
      };
    } else if (query.endDate) {
      where.date = {
        lte: query.endDate,
      };
    }

    const [schedules, totalCount] = await Promise.all([
      prisma.personal_schedules.findMany({
        where,
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
      }),
      prisma.personal_schedules.count({ where }),
    ]);

    const formattedSchedules: PersonalSchedule[] = schedules.map((schedule) => ({
      id: schedule.id,
      title: schedule.title,
      date: schedule.date,
      time: schedule.time,
      endTime: schedule.endTime || undefined,
      description: schedule.description || undefined,
      location: schedule.location || undefined,
      userId: schedule.userId,
      priority: schedule.priority as PriorityLevel,
      isAllDay: schedule.isAllDay,
      createdAt: schedule.createdAt.toISOString(),
      updatedAt: schedule.updatedAt.toISOString(),
    }));

    const response: ScheduleListResponse = {
      schedules: formattedSchedules,
      totalCount,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('スケジュール取得エラー:', error);
    return NextResponse.json(
      { error: 'スケジュールの取得に失敗しました' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateScheduleRequest = await request.json();

    // バリデーション
    if (!body.title || !body.date || !body.time || !body.userId) {
      return NextResponse.json(
        { error: 'title, date, time, userId は必須項目です' },
        { status: 400 }
      );
    }

    // 日付フォーマット検証
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(body.date)) {
      return NextResponse.json(
        { error: 'date は YYYY-MM-DD 形式で入力してください' },
        { status: 400 }
      );
    }

    // 時刻フォーマット検証
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(body.time)) {
      return NextResponse.json(
        { error: 'time は HH:mm 形式で入力してください' },
        { status: 400 }
      );
    }

    if (body.endTime && !timeRegex.test(body.endTime)) {
      return NextResponse.json(
        { error: 'endTime は HH:mm 形式で入力してください' },
        { status: 400 }
      );
    }

    // ユーザー存在確認
    const userExists = await prisma.users.findUnique({
      where: { id: body.userId },
    });

    if (!userExists) {
      return NextResponse.json(
        { error: '指定されたユーザーが見つかりません' },
        { status: 404 }
      );
    }

    const newSchedule = await prisma.personal_schedules.create({
      data: {
        title: body.title,
        date: body.date,
        time: body.time,
        endTime: body.endTime || null,
        description: body.description || '',
        location: body.location || null,
        userId: body.userId,
        priority: body.priority || 'C',
        isAllDay: body.isAllDay || false,
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    const formattedSchedule: PersonalSchedule = {
      id: newSchedule.id,
      title: newSchedule.title,
      date: newSchedule.date,
      time: newSchedule.time,
      endTime: newSchedule.endTime || undefined,
      description: newSchedule.description || undefined,
      location: newSchedule.location || undefined,
      userId: newSchedule.userId,
      priority: newSchedule.priority as PriorityLevel,
      isAllDay: newSchedule.isAllDay,
      createdAt: newSchedule.createdAt.toISOString(),
      updatedAt: newSchedule.updatedAt.toISOString(),
    };

    const response: CreateScheduleResponse = {
      schedule: formattedSchedule,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('スケジュール作成エラー:', error);
    return NextResponse.json(
      { error: 'スケジュールの作成に失敗しました' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body: CreateScheduleRequest = await request.json();

    // バリデーション
    if (!body.title || !body.date || !body.time || !body.userId) {
      return NextResponse.json(
        { error: 'title, date, time, userId は必須項目です' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('id');

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'id パラメータが必要です' },
        { status: 400 }
      );
    }

    // スケジュール存在確認
    const existingSchedule = await prisma.personal_schedules.findUnique({
      where: { id: scheduleId },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { error: '指定されたスケジュールが見つかりません' },
        { status: 404 }
      );
    }

    const updatedSchedule = await prisma.personal_schedules.update({
      where: { id: scheduleId },
      data: {
        title: body.title,
        date: body.date,
        time: body.time,
        endTime: body.endTime || null,
        description: body.description || '',
        location: body.location || null,
        priority: body.priority || 'C',
        isAllDay: body.isAllDay || false,
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    const formattedSchedule: PersonalSchedule = {
      id: updatedSchedule.id,
      title: updatedSchedule.title,
      date: updatedSchedule.date,
      time: updatedSchedule.time,
      endTime: updatedSchedule.endTime || undefined,
      description: updatedSchedule.description || undefined,
      location: updatedSchedule.location || undefined,
      userId: updatedSchedule.userId,
      priority: updatedSchedule.priority as PriorityLevel,
      isAllDay: updatedSchedule.isAllDay,
      createdAt: updatedSchedule.createdAt.toISOString(),
      updatedAt: updatedSchedule.updatedAt.toISOString(),
    };

    return NextResponse.json({ schedule: formattedSchedule });
  } catch (error) {
    console.error('スケジュール更新エラー:', error);
    return NextResponse.json(
      { error: 'スケジュールの更新に失敗しました' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('id');

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'id パラメータが必要です' },
        { status: 400 }
      );
    }

    // スケジュール存在確認
    const existingSchedule = await prisma.personal_schedules.findUnique({
      where: { id: scheduleId },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { error: '指定されたスケジュールが見つかりません' },
        { status: 404 }
      );
    }

    await prisma.personal_schedules.delete({
      where: { id: scheduleId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('スケジュール削除エラー:', error);
    return NextResponse.json(
      { error: 'スケジュールの削除に失敗しました' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}