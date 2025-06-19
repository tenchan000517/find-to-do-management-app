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
      participants,
      // Additional form fields from flow modal
      salesPhase,
      relationshipStatus,
      createNextAppointment,
      nextAppointmentDate,
      nextAppointmentPurpose,
      nextAppointmentRelationshipStatus
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

      // 二回目以降のアポイントメント自動関係性進行
      const existingEvents = await prisma.calendar_events.findMany({
        where: { appointmentId: appointment.id },
        orderBy: { createdAt: 'desc' }
      });

      // 2回目以降の場合、関係性ステータスを「関係性構築」に自動更新
      if (existingEvents.length >= 1) {
        await prisma.appointment_details.upsert({
          where: { appointmentId: appointment.id },
          create: {
            appointmentId: appointment.id,
            relationshipStatus: 'RAPPORT_BUILDING'
          },
          update: {
            relationshipStatus: 'RAPPORT_BUILDING'
          }
        });
        
        console.log('✅ 自動関係性進行:', appointment.companyName, '→ 関係性構築');
      }
    }

    // アポイントメント詳細の更新（processingStatusとフォームデータ）
    const appointmentDetailsData: any = {
      processingStatus: 'IN_PROGRESS' // 進行中ステータスを設定
    };

    // フローモーダルからの追加フィールドを処理
    if (salesPhase) appointmentDetailsData.phaseStatus = salesPhase;
    if (relationshipStatus) appointmentDetailsData.relationshipStatus = relationshipStatus;

    await prisma.appointment_details.upsert({
      where: { appointmentId: appointment.id },
      create: {
        appointmentId: appointment.id,
        ...appointmentDetailsData
      },
      update: appointmentDetailsData
    });

    console.log('✅ 進行中ステータス更新:', appointment.companyName, '→ IN_PROGRESS');

    // 次回アポイントメント作成
    if (createNextAppointment && nextAppointmentDate && nextAppointmentPurpose) {
      const nextAppointment = await prisma.appointments.create({
        data: {
          id: `apt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          companyName: appointment.companyName,
          contactName: appointment.contactName,
          phone: appointment.phone || '',
          email: appointment.email || '',
          nextAction: nextAppointmentPurpose,
          priority: appointment.priority || 'C',
          status: 'PENDING',
          assignedTo: appointment.assignedTo || 'user1',
          createdBy: appointment.assignedTo || 'user1'
        }
      });

      // 次回アポイントメントの詳細も設定
      await prisma.appointment_details.create({
        data: {
          appointmentId: nextAppointment.id,
          processingStatus: 'PENDING',
          relationshipStatus: nextAppointmentRelationshipStatus || 'RAPPORT_BUILDING'
        }
      });

      console.log('✅ 次回アポイントメント作成:', nextAppointment.id);
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