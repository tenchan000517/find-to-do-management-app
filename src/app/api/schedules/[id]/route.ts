import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { 
  PersonalSchedule, 
  UpdateScheduleRequest, 
  ScheduleDetailResponse,
  DeleteResponse,
  PriorityLevel 
} from '@/types/personal-schedule';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const schedule = await prisma.personal_schedules.findUnique({
      where: { id },
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

    if (!schedule) {
      return NextResponse.json(
        { error: '指定されたスケジュールが見つかりません' },
        { status: 404 }
      );
    }

    const formattedSchedule: PersonalSchedule = {
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
    };

    const response: ScheduleDetailResponse = {
      schedule: formattedSchedule,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('スケジュール詳細取得エラー:', error);
    return NextResponse.json(
      { error: 'スケジュールの取得に失敗しました' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: Partial<UpdateScheduleRequest> = await request.json();

    // スケジュール存在確認
    const existingSchedule = await prisma.personal_schedules.findUnique({
      where: { id },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { error: '指定されたスケジュールが見つかりません' },
        { status: 404 }
      );
    }

    // 更新データの準備
    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.date !== undefined) {
      // 日付フォーマット検証
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(body.date)) {
        return NextResponse.json(
          { error: 'date は YYYY-MM-DD 形式で入力してください' },
          { status: 400 }
        );
      }
      updateData.date = body.date;
    }
    if (body.time !== undefined) {
      // 時刻フォーマット検証
      const timeRegex = /^\d{2}:\d{2}$/;
      if (!timeRegex.test(body.time)) {
        return NextResponse.json(
          { error: 'time は HH:mm 形式で入力してください' },
          { status: 400 }
        );
      }
      updateData.time = body.time;
    }
    if (body.endTime !== undefined) {
      if (body.endTime) {
        const timeRegex = /^\d{2}:\d{2}$/;
        if (!timeRegex.test(body.endTime)) {
          return NextResponse.json(
            { error: 'endTime は HH:mm 形式で入力してください' },
            { status: 400 }
          );
        }
      }
      updateData.endTime = body.endTime || null;
    }
    if (body.description !== undefined) updateData.description = body.description || '';
    if (body.location !== undefined) updateData.location = body.location || null;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.isAllDay !== undefined) updateData.isAllDay = body.isAllDay;

    // 必須項目の検証
    if (updateData.title === '') {
      return NextResponse.json(
        { error: 'title は必須項目です' },
        { status: 400 }
      );
    }

    const updatedSchedule = await prisma.personal_schedules.update({
      where: { id },
      data: updateData,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // スケジュール存在確認
    const existingSchedule = await prisma.personal_schedules.findUnique({
      where: { id },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { error: '指定されたスケジュールが見つかりません' },
        { status: 404 }
      );
    }

    await prisma.personal_schedules.delete({
      where: { id },
    });

    const response: DeleteResponse = {
      success: true,
    };

    return NextResponse.json(response);
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