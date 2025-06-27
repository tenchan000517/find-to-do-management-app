import { NextRequest, NextResponse } from 'next/server';
import { getOptionalAuth, requirePermission } from '@/lib/auth/server';
import { PERMISSIONS } from '@/lib/auth/permissions';
import prisma from '@/lib/database/prisma';

export async function GET() {
  const { session, user } = await getOptionalAuth();
  
  try {
    if (session && user) {
      // ログイン済み: 自分に関連するアポイントまたは管理者権限
      const whereClause = user.role === 'ADMIN' || user.role === 'MANAGER'
        ? {} // 管理者: 全アポイント
        : {
            OR: [
              { createdBy: user.id },
              { assignedTo: user.id }
            ]
          };
      
      const appointments = await prisma.appointments.findMany({
        where: whereClause,
        include: {
          creator: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } },
          details: true
        },
        orderBy: { updatedAt: 'desc' }
      });
      
      return NextResponse.json(appointments);
    } else {
      // 未ログイン: 基本情報のみ（機密情報除外）
      const appointments = await prisma.appointments.findMany({
        select: {
          id: true,
          companyName: true,
          status: true,
          priority: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return NextResponse.json(appointments);
    }
  } catch (error) {
    console.error('Appointments API error:', error);
    return NextResponse.json(
      { error: 'アポイント情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // アポイント作成は基本権限必須
  const authResult = await requirePermission(PERMISSIONS.TASK_CREATE);
  if (authResult instanceof NextResponse) return authResult;

  const { user } = authResult;
  
  try {
    const body = await request.json();
    
    const newAppointment = await prisma.appointments.create({
      data: {
        id: `appointment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        companyName: body.companyName,
        contactName: body.contactName,
        phone: body.phone,
        email: body.email,
        status: body.status || 'PENDING',
        priority: body.priority || 'C',
        nextAction: body.nextAction || '',
        notes: body.notes || '',
        createdBy: user.id,
        assignedTo: body.assignedTo || user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json(newAppointment, { status: 201 });
  } catch (error) {
    console.error('Appointment creation error:', error);
    return NextResponse.json(
      { error: 'アポイントの作成に失敗しました' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  // アポイント更新は権限必須
  const authResult = await requirePermission(PERMISSIONS.TASK_UPDATE);
  if (authResult instanceof NextResponse) return authResult;

  const { user } = authResult;
  
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'アポイントIDが必要です' }, { status: 400 });
    }
    
    // アポイントの存在確認と権限チェック
    const existingAppointment = await prisma.appointments.findUnique({
      where: { id },
      select: { 
        id: true, 
        createdBy: true, 
        assignedTo: true
      }
    });
    
    if (!existingAppointment) {
      return NextResponse.json({ error: 'アポイントが見つかりません' }, { status: 404 });
    }
    
    // 管理者、作成者、担当者のみ更新可能
    const canUpdate = user.role === 'ADMIN' || 
                     user.role === 'MANAGER' ||
                     existingAppointment.createdBy === user.id ||
                     existingAppointment.assignedTo === user.id;
    
    if (!canUpdate) {
      return NextResponse.json(
        { error: 'アポイント更新権限がありません' },
        { status: 403 }
      );
    }
    
    const updatedAppointment = await prisma.appointments.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error('Appointment update error:', error);
    return NextResponse.json(
      { error: 'アポイントの更新に失敗しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // アポイント削除は管理者権限必須
  const authResult = await requirePermission(PERMISSIONS.TASK_DELETE);
  if (authResult instanceof NextResponse) return authResult;

  const { user } = authResult;
  
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'アポイントIDが必要です' }, { status: 400 });
    }
    
    // アポイントの存在確認
    const existingAppointment = await prisma.appointments.findUnique({
      where: { id },
      select: { 
        id: true, 
        createdBy: true,
        companyName: true
      }
    });
    
    if (!existingAppointment) {
      return NextResponse.json({ error: 'アポイントが見つかりません' }, { status: 404 });
    }
    
    // 管理者または作成者のみ削除可能
    if (user.role !== 'ADMIN' && existingAppointment.createdBy !== user.id) {
      return NextResponse.json(
        { error: 'アポイント削除権限がありません' },
        { status: 403 }
      );
    }
    
    await prisma.appointments.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Appointment deletion error:', error);
    return NextResponse.json(
      { error: 'アポイントの削除に失敗しました' },
      { status: 500 }
    );
  }
}