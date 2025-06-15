import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js 15: paramsをawaitで取得
    const { id: taskId } = await params;

    // Archive the task
    const archivedTask = await prisma.tasks.update({
      where: { id: taskId },
      data: { isArchived: true }
    });

    // Create archive record
    await prisma.task_archives.create({
      data: {
        id: `arc_${taskId}_${Date.now()}`,
        originalTaskId: taskId,
        taskData: {
          id: archivedTask.id,
          title: archivedTask.title,
          description: archivedTask.description,
          status: archivedTask.status,
          priority: archivedTask.priority,
          projectId: archivedTask.projectId,
          userId: archivedTask.userId,
          dueDate: archivedTask.dueDate,
          createdAt: archivedTask.createdAt.toISOString(),
          updatedAt: archivedTask.updatedAt.toISOString()
        },
        archiveLevel: 'SOFT'
      }
    });

    return NextResponse.json({ success: true, message: 'Task archived successfully' });
  } catch (error) {
    console.error('Failed to archive task:', error);
    return NextResponse.json({ error: 'Failed to archive task' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js 15: paramsをawaitで取得
    const { id: taskId } = await params;

    // Restore the task
    await prisma.tasks.update({
      where: { id: taskId },
      data: { isArchived: false }
    });

    // Remove from archive
    await prisma.task_archives.delete({
      where: { originalTaskId: taskId }
    });

    return NextResponse.json({ success: true, message: 'Task restored successfully' });
  } catch (error) {
    console.error('Failed to restore task:', error);
    return NextResponse.json({ error: 'Failed to restore task' }, { status: 500 });
  }
}