import { NextRequest, NextResponse } from 'next/server';
import { getOptionalAuth, requirePermission } from '@/lib/auth/server';
import { PERMISSIONS } from '@/lib/auth/permissions';
import prisma from '@/lib/database/prisma';

export async function GET() {
  const { session, user } = await getOptionalAuth();
  
  try {
    if (session && user) {
      // ログイン済み: 役割に応じたフィルタリング
      const whereClause = user.role === 'ADMIN' || user.role === 'MANAGER' 
        ? {} // 管理者: 全プロジェクト
        : {
            OR: [
              { createdBy: user.id },
              { assignedTo: user.id },
              { teamMembers: { has: user.id } }
            ]
          };
      
      const projects = await prisma.projects.findMany({
        where: whereClause,
        include: {
          creator: { select: { id: true, name: true, color: true } },
          manager: { select: { id: true, name: true, color: true } }
        },
        orderBy: { updatedAt: 'desc' }
      });
      
      return NextResponse.json(projects);
    } else {
      // 未ログイン: 公開プロジェクトのみ（既存機能保持）
      const projects = await prisma.projects.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          progress: true,
          startDate: true,
          endDate: true,
          priority: true,
          phase: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { updatedAt: 'desc' }
      });
      
      return NextResponse.json(projects);
    }
  } catch (error) {
    console.error('Projects API error:', error);
    return NextResponse.json(
      { error: 'プロジェクト情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // プロジェクト作成は権限必須
  const authResult = await requirePermission(PERMISSIONS.PROJECT_CREATE);
  if (authResult instanceof NextResponse) return authResult;

  const { user } = authResult;
  
  try {
    const body = await request.json();
    
    const newProject = await prisma.projects.create({
      data: {
        id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: body.name,
        description: body.description || '',
        status: body.status || 'PLANNING',
        priority: body.priority || 'C',
        startDate: body.startDate,
        endDate: body.endDate,
        phase: body.phase || 'concept',
        teamMembers: body.teamMembers || [],
        createdBy: user.id,
        assignedTo: body.assignedTo || user.id,
        progress: body.progress || 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Project creation error:', error);
    return NextResponse.json(
      { error: 'プロジェクトの作成に失敗しました' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  // プロジェクト更新は権限必須
  const authResult = await requirePermission(PERMISSIONS.PROJECT_UPDATE);
  if (authResult instanceof NextResponse) return authResult;

  const { user } = authResult;
  
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'プロジェクトIDが必要です' }, { status: 400 });
    }
    
    // プロジェクトの存在確認と権限チェック
    const existingProject = await prisma.projects.findUnique({
      where: { id },
      select: { 
        id: true, 
        createdBy: true, 
        assignedTo: true, 
        teamMembers: true 
      }
    });
    
    if (!existingProject) {
      return NextResponse.json({ error: 'プロジェクトが見つかりません' }, { status: 404 });
    }
    
    // 管理者、作成者、担当者、チームメンバーのみ更新可能
    const canUpdate = user.role === 'ADMIN' || 
                     user.role === 'MANAGER' ||
                     existingProject.createdBy === user.id ||
                     existingProject.assignedTo === user.id ||
                     (existingProject.teamMembers as string[])?.includes(user.id);
    
    if (!canUpdate) {
      return NextResponse.json(
        { error: 'プロジェクト更新権限がありません' },
        { status: 403 }
      );
    }
    
    const updatedProject = await prisma.projects.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Project update error:', error);
    return NextResponse.json(
      { error: 'プロジェクトの更新に失敗しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // プロジェクト削除は管理者権限必須
  const authResult = await requirePermission(PERMISSIONS.PROJECT_DELETE);
  if (authResult instanceof NextResponse) return authResult;

  const { user } = authResult;
  
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'プロジェクトIDが必要です' }, { status: 400 });
    }
    
    // プロジェクトの存在確認
    const existingProject = await prisma.projects.findUnique({
      where: { id },
      select: { 
        id: true, 
        createdBy: true, 
        name: true 
      }
    });
    
    if (!existingProject) {
      return NextResponse.json({ error: 'プロジェクトが見つかりません' }, { status: 404 });
    }
    
    // 管理者または作成者のみ削除可能
    if (user.role !== 'ADMIN' && existingProject.createdBy !== user.id) {
      return NextResponse.json(
        { error: 'プロジェクト削除権限がありません' },
        { status: 403 }
      );
    }
    
    await prisma.projects.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Project deletion error:', error);
    return NextResponse.json(
      { error: 'プロジェクトの削除に失敗しました' },
      { status: 500 }
    );
  }
}