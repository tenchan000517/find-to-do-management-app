import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const relationship = await prisma.task_relationships.findUnique({
      where: { id },
      include: {
        sourceTask: {
          include: {
            projects: true,
          },
        },
        targetTask: {
          include: {
            projects: true,
          },
        },
        project: true,
      },
    });

    if (!relationship) {
      return NextResponse.json(
        {
          success: false,
          error: 'Task relationship not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: relationship,
    });
  } catch (error) {
    console.error('Error fetching task relationship:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch task relationship',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { sourceTaskId, targetTaskId, projectId, relationshipType } = body;

    // 関係性の存在確認
    const existingRelationship = await prisma.task_relationships.findUnique({
      where: { id },
    });

    if (!existingRelationship) {
      return NextResponse.json(
        {
          success: false,
          error: 'Task relationship not found',
        },
        { status: 404 }
      );
    }

    // 関係性タイプの検証
    if (relationshipType) {
      const validTypes = ['TRANSFERABLE', 'SIMULTANEOUS', 'DEPENDENT'];
      if (!validTypes.includes(relationshipType)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid relationship type',
          },
          { status: 400 }
        );
      }
    }

    // ソースタスクの存在確認
    if (sourceTaskId) {
      const sourceTask = await prisma.tasks.findUnique({
        where: { id: sourceTaskId },
      });

      if (!sourceTask) {
        return NextResponse.json(
          {
            success: false,
            error: 'Source task not found',
          },
          { status: 404 }
        );
      }
    }

    // ターゲットタスクが指定されている場合の存在確認
    if (targetTaskId) {
      const targetTask = await prisma.tasks.findUnique({
        where: { id: targetTaskId },
      });

      if (!targetTask) {
        return NextResponse.json(
          {
            success: false,
            error: 'Target task not found',
          },
          { status: 404 }
        );
      }

      // 自己参照チェック
      const finalSourceTaskId = sourceTaskId || existingRelationship.sourceTaskId;
      if (finalSourceTaskId === targetTaskId) {
        return NextResponse.json(
          {
            success: false,
            error: 'Source and target tasks cannot be the same',
          },
          { status: 400 }
        );
      }
    }

    // プロジェクトが指定されている場合の存在確認
    if (projectId) {
      const project = await prisma.projects.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        return NextResponse.json(
          {
            success: false,
            error: 'Project not found',
          },
          { status: 404 }
        );
      }
    }

    // 更新データの準備
    const updateData: any = {};
    if (sourceTaskId !== undefined) updateData.sourceTaskId = sourceTaskId;
    if (targetTaskId !== undefined) updateData.targetTaskId = targetTaskId;
    if (projectId !== undefined) updateData.projectId = projectId;
    if (relationshipType !== undefined) updateData.relationshipType = relationshipType;

    // 重複チェック（更新後の値で）
    const finalSourceTaskId = sourceTaskId || existingRelationship.sourceTaskId;
    const finalTargetTaskId = targetTaskId !== undefined ? targetTaskId : existingRelationship.targetTaskId;
    const finalProjectId = projectId !== undefined ? projectId : existingRelationship.projectId;
    const finalRelationshipType = relationshipType || existingRelationship.relationshipType;

    const duplicateRelationship = await prisma.task_relationships.findFirst({
      where: {
        id: { not: id },
        sourceTaskId: finalSourceTaskId,
        targetTaskId: finalTargetTaskId,
        projectId: finalProjectId,
        relationshipType: finalRelationshipType,
      },
    });

    if (duplicateRelationship) {
      return NextResponse.json(
        {
          success: false,
          error: 'Relationship with these parameters already exists',
        },
        { status: 409 }
      );
    }

    // 関係性を更新
    const updatedRelationship = await prisma.task_relationships.update({
      where: { id },
      data: updateData,
      include: {
        sourceTask: {
          include: {
            projects: true,
          },
        },
        targetTask: {
          include: {
            projects: true,
          },
        },
        project: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedRelationship,
      message: 'Task relationship updated successfully',
    });
  } catch (error) {
    console.error('Error updating task relationship:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update task relationship',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // 関係性の存在確認
    const existingRelationship = await prisma.task_relationships.findUnique({
      where: { id },
    });

    if (!existingRelationship) {
      return NextResponse.json(
        {
          success: false,
          error: 'Task relationship not found',
        },
        { status: 404 }
      );
    }

    // 関係性を削除
    await prisma.task_relationships.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Task relationship deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting task relationship:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete task relationship',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}