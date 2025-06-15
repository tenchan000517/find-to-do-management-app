import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }

) {
  try {
    const { id: taskId } = await params;

    const body = await request.json();

    if (!body.userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Check if collaboration already exists
    const existingCollaboration = await prisma.task_collaborators.findUnique({
      where: {
        taskId_userId: {
          taskId: taskId,
          userId: body.userId
        }
      }
    });

    if (existingCollaboration) {
      return NextResponse.json({ error: 'User is already a collaborator' }, { status: 400 });
    }

    const collaborator = await prisma.task_collaborators.create({
      data: {
        id: `collab_${taskId}_${body.userId}_${Date.now()}`,
        taskId: taskId,
        userId: body.userId
      },
      include: {
        users: true
      }
    });

    return NextResponse.json({
      id: collaborator.id,
      taskId: collaborator.taskId,
      userId: collaborator.userId,
      user: collaborator.users,
      createdAt: collaborator.createdAt.toISOString()
    });
  } catch (error) {
    console.error('Failed to add collaborator:', error);
    return NextResponse.json({ error: 'Failed to add collaborator' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    await prisma.task_collaborators.delete({
      where: {
        taskId_userId: {
          taskId: taskId,
          userId: userId
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove collaborator:', error);
    return NextResponse.json({ error: 'Failed to remove collaborator' }, { status: 500 });
  }
}