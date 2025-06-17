import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database/prisma';

/**
 * アポイントメントの担当者変更API
 * PATCH /api/appointments/{id}/assignee
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appointmentId } = await params;
    const body = await request.json();

    // バリデーション
    if (!body.assignedTo) {
      return NextResponse.json({ error: 'assignedTo is required' }, { status: 400 });
    }

    // ユーザーの存在確認
    const assignee = await prisma.users.findUnique({
      where: { id: body.assignedTo },
      select: { id: true, name: true, isActive: true }
    });

    if (!assignee) {
      return NextResponse.json({ error: 'Assignee user not found' }, { status: 404 });
    }

    if (!assignee.isActive) {
      return NextResponse.json({ error: 'Assignee user is not active' }, { status: 400 });
    }

    // アポイントメントの存在確認
    const existingAppointment = await prisma.appointments.findUnique({
      where: { id: appointmentId },
      select: { id: true, companyName: true, contactName: true, assignedTo: true, createdBy: true }
    });

    if (!existingAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // 営業担当者変更
    const updatedAppointment = await prisma.appointments.update({
      where: { id: appointmentId },
      data: {
        assignedTo: body.assignedTo,
        updatedAt: new Date()
      },
      include: {
        creator: {
          select: { id: true, name: true }
        },
        assignee: {
          select: { id: true, name: true }
        }
      }
    });

    // レスポンス用データ整形
    const response = {
      id: updatedAppointment.id,
      companyName: updatedAppointment.companyName,
      contactName: updatedAppointment.contactName,
      assignedTo: updatedAppointment.assignedTo,
      createdBy: updatedAppointment.createdBy,
      creator: updatedAppointment.creator,
      assignee: updatedAppointment.assignee,
      updatedAt: updatedAppointment.updatedAt.toISOString(),
      message: `営業担当者を「${assignee.name}」に変更しました`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Failed to update appointment assignee:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment assignee' }, 
      { status: 500 }
    );
  }
}

/**
 * アポイントメントの担当者情報取得API
 * GET /api/appointments/{id}/assignee
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appointmentId } = await params;

    const appointment = await prisma.appointments.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        companyName: true,
        contactName: true,
        assignedTo: true,
        createdBy: true,
        creator: {
          select: { id: true, name: true }
        },
        assignee: {
          select: { id: true, name: true }
        },
        updatedAt: true
      }
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: appointment.id,
      companyName: appointment.companyName,
      contactName: appointment.contactName,
      assignedTo: appointment.assignedTo,
      createdBy: appointment.createdBy,
      creator: appointment.creator,
      assignee: appointment.assignee,
      updatedAt: appointment.updatedAt?.toISOString()
    });

  } catch (error) {
    console.error('Failed to get appointment assignee:', error);
    return NextResponse.json(
      { error: 'Failed to get appointment assignee' }, 
      { status: 500 }
    );
  }
}