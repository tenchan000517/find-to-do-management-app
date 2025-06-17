import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database/prisma';

/**
 * プロジェクトの担当者変更API
 * PATCH /api/projects/{id}/assignee
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
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

    // プロジェクトの存在確認
    const existingProject = await prisma.projects.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, assignedTo: true, createdBy: true, teamMembers: true }
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // 担当者をチームメンバーに追加（まだ含まれていない場合）
    const updatedTeamMembers = existingProject.teamMembers.includes(body.assignedTo)
      ? existingProject.teamMembers
      : [...existingProject.teamMembers, body.assignedTo];

    // プロジェクトマネージャー変更
    const updatedProject = await prisma.projects.update({
      where: { id: projectId },
      data: {
        assignedTo: body.assignedTo,
        teamMembers: updatedTeamMembers,
        updatedAt: new Date()
      },
      include: {
        creator: {
          select: { id: true, name: true }
        },
        manager: {
          select: { id: true, name: true }
        }
      }
    });

    // レスポンス用データ整形
    const response = {
      id: updatedProject.id,
      name: updatedProject.name,
      assignedTo: updatedProject.assignedTo,
      createdBy: updatedProject.createdBy,
      creator: updatedProject.creator,
      manager: updatedProject.manager,
      teamMembers: updatedProject.teamMembers,
      updatedAt: updatedProject.updatedAt.toISOString(),
      message: `プロジェクトマネージャーを「${assignee.name}」に変更しました`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Failed to update project assignee:', error);
    return NextResponse.json(
      { error: 'Failed to update project assignee' }, 
      { status: 500 }
    );
  }
}

/**
 * プロジェクトの担当者情報取得API
 * GET /api/projects/{id}/assignee
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const project = await prisma.projects.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        assignedTo: true,
        createdBy: true,
        teamMembers: true,
        creator: {
          select: { id: true, name: true }
        },
        manager: {
          select: { id: true, name: true }
        },
        updatedAt: true
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: project.id,
      name: project.name,
      assignedTo: project.assignedTo,
      createdBy: project.createdBy,
      creator: project.creator,
      manager: project.manager,
      teamMembers: project.teamMembers,
      updatedAt: project.updatedAt?.toISOString()
    });

  } catch (error) {
    console.error('Failed to get project assignee:', error);
    return NextResponse.json(
      { error: 'Failed to get project assignee' }, 
      { status: 500 }
    );
  }
}