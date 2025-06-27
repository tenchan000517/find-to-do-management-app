import { NextResponse } from 'next/server';
import { prismaDataService } from '@/lib/database/prisma-service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appointmentId } = await params;
    const body = await request.json();
    
    console.log('🔄 Reschedule request received:', { appointmentId, body });

    const {
      rescheduleReason,
      markPreviousAsCompleted,
      phaseChange,
      newPhase,
      newScheduledDate,
      newScheduledTime,
      newMeetingLocation,
      newAgenda,
      newParticipants,
      notes
    } = body;

    // 1. 既存のカレンダーイベントを履歴として保持（完了状態に）
    if (markPreviousAsCompleted) {
      const existingEvents = await prisma.calendar_events.findMany({
        where: { appointmentId }
      });
      
      for (const event of existingEvents) {
        await prisma.calendar_events.update({
          where: { id: event.id },
          data: {
            description: `${event.description || ''}\n\n[再スケジュール履歴] 理由: ${rescheduleReason}${notes ? `\n備考: ${notes}` : ''}`,
            // 履歴として保持するためのフラグを追加可能
          }
        });
      }
    }

    // 2. アポイントメントステータスをPENDINGに変更
    await prisma.appointment_details.upsert({
      where: { appointmentId },
      create: {
        appointmentId,
        processingStatus: 'PENDING',
        ...(phaseChange && newPhase && { phaseStatus: newPhase })
      },
      update: {
        processingStatus: 'PENDING',
        ...(phaseChange && newPhase && { phaseStatus: newPhase })
      }
    });

    // 3. 新しい日程が設定されている場合、新しいカレンダーイベントを作成
    if (rescheduleReason === 'リスケ' && newScheduledDate && newScheduledTime) {
      // 既存のアポイントメント情報を取得
      const appointment = await prisma.appointments.findUnique({
        where: { id: appointmentId },
        include: {
          assignee: true,
          details: true
        }
      });

      if (appointment) {
        await prisma.calendar_events.create({
          data: {
            title: `🤝 ${appointment.companyName} - ${appointment.contactName}`,
            date: newScheduledDate,
            time: newScheduledTime,
            location: newMeetingLocation || '',
            description: newAgenda || `${appointment.companyName}との打ち合わせ（再スケジュール）`,
            type: 'MEETING',
            category: 'APPOINTMENT',
            appointmentId,
            userId: appointment.assignedTo || appointment.assignee?.id,
            participants: newParticipants ? newParticipants.split(',').map(p => p.trim()) : [],
            isAllDay: false
          }
        });
      }
    }

    // 4. 次回アポの場合も同様に処理
    if (rescheduleReason === '次のアポ' && newScheduledDate) {
      const appointment = await prisma.appointments.findUnique({
        where: { id: appointmentId },
        include: {
          assignee: true,
          details: true
        }
      });

      if (appointment) {
        await prisma.calendar_events.create({
          data: {
            title: `🤝 ${appointment.companyName} - ${appointment.contactName} (次回アポ)`,
            date: newScheduledDate,
            time: newScheduledTime || '10:00',
            location: newMeetingLocation || '',
            description: newAgenda || `${appointment.companyName}との次回アポイントメント`,
            type: 'MEETING',
            category: 'APPOINTMENT',
            appointmentId,
            userId: appointment.assignedTo || appointment.assignee?.id,
            participants: newParticipants ? newParticipants.split(',').map(p => p.trim()) : [],
            isAllDay: false
          }
        });
      }
    }

    // 5. 再スケジュール履歴をアポイントメントに記録
    const currentNote = await prisma.appointments.findUnique({
      where: { id: appointmentId },
      select: { notes: true }
    });

    const rescheduleLog = `[${new Date().toLocaleDateString('ja-JP')}] 再スケジュール実行
理由: ${rescheduleReason}
${phaseChange ? `フェーズ変更: ${newPhase}` : ''}
${notes ? `備考: ${notes}` : ''}
`;

    await prisma.appointments.update({
      where: { id: appointmentId },
      data: {
        notes: `${currentNote?.notes || ''}\n\n${rescheduleLog}`,
        updatedAt: new Date()
      }
    });

    console.log('✅ Reschedule completed successfully');

    return NextResponse.json({ 
      success: true, 
      message: '再スケジュールが完了しました',
      data: {
        rescheduleReason,
        phaseChange,
        newPhase,
        hasNewEvent: !!(newScheduledDate && (rescheduleReason === 'リスケ' || rescheduleReason === '次のアポ'))
      }
    });

  } catch (error) {
    console.error('Failed to reschedule appointment:', error);
    return NextResponse.json(
      { error: '再スケジュールに失敗しました', details: error },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}