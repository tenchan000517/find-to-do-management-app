import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database/prisma';

/**
 * タスクの担当者変更API
 * PATCH /api/tasks/{id}/assignee
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
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

    // タスクの存在確認
    const existingTask = await prisma.tasks.findUnique({
      where: { id: taskId },
      select: { id: true, title: true, assignedTo: true, createdBy: true }
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // 担当者変更（更新者IDも記録したい場合は将来的に追加）
    const updatedTask = await prisma.tasks.update({
      where: { id: taskId },
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
        },
        projects: {
          select: { id: true, name: true }
        }
      }
    });

    // レスポンス用データ整形
    const response = {
      id: updatedTask.id,
      title: updatedTask.title,
      assignedTo: updatedTask.assignedTo,
      createdBy: updatedTask.createdBy,
      creator: updatedTask.creator,
      assignee: updatedTask.assignee,
      project: updatedTask.projects,
      updatedAt: updatedTask.updatedAt.toISOString(),
      message: `担当者を「${assignee.name}」に変更しました`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Failed to update task assignee:', error);
    return NextResponse.json(
      { error: 'Failed to update task assignee' }, 
      { status: 500 }
    );
  }
}

/**
 * タスクの担当者情報取得API
 * GET /api/tasks/{id}/assignee
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;

    const task = await prisma.tasks.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        title: true,
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

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: task.id,
      title: task.title,
      assignedTo: task.assignedTo,
      createdBy: task.createdBy,
      creator: task.creator,
      assignee: task.assignee,
      updatedAt: task.updatedAt?.toISOString()
    });

  } catch (error) {
    console.error('Failed to get task assignee:', error);
    return NextResponse.json(
      { error: 'Failed to get task assignee' }, 
      { status: 500 }
    );
  }
}