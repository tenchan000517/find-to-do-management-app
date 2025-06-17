import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    
    const {
      scheduledDate,
      scheduledTime,
      meetingLocation,
      agenda,
      participants
    } = body;

    // アポイントメント更新
    const appointment = await prisma.appointments.update({
      where: { id },
      data: {
        notes: `議題: ${agenda || ''}\n参加者: ${participants || ''}\n場所: ${meetingLocation || ''}`
      }
    });

    // カレンダーイベント作成
    if (scheduledDate && scheduledTime) {
      await prisma.calendar_events.create({
        data: {
          id: `cal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: `${appointment.companyName} - ${appointment.contactName}`,
          date: scheduledDate,
          time: scheduledTime,
          participants: participants ? participants.split(',').map((p: string) => p.trim()) : [],
          type: 'MEETING',
          description: agenda || `${appointment.companyName}との打ち合わせ`,
          location: meetingLocation,
          createdBy: appointment.assignedTo || 'user1',
          assignedTo: appointment.assignedTo || 'user1',
          appointmentId: appointment.id
        }
      });
    }

    // ステータス更新（簡略化）
    await prisma.appointments.update({
      where: { id },
      data: {
        status: 'SCHEDULED'
      }
    });

    return NextResponse.json({ 
      success: true, 
      appointment,
      message: 'アポイントメントの日程が設定されました'
    });

  } catch (error) {
    console.error('Failed to schedule appointment:', error);
    return NextResponse.json(
      { error: 'アポイントメントの日程設定に失敗しました' },
      { status: 500 }
    );
  }
}