import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sourceTaskId = url.searchParams.get('sourceTaskId');
    const projectId = url.searchParams.get('projectId');

    let relationships;

    if (sourceTaskId) {
      // 特定のタスクの関係性を取得
      relationships = await prisma.task_relationships.findMany({
        where: {
          sourceTaskId: sourceTaskId,
        },
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
    } else if (projectId) {
      // 特定のプロジェクトの関係性を取得
      relationships = await prisma.task_relationships.findMany({
        where: {
          projectId: projectId,
        },
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
    } else {
      // 全ての関係性を取得
      relationships = await prisma.task_relationships.findMany({
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
    }

    return NextResponse.json({
      success: true,
      data: relationships,
    });
  } catch (error) {
    console.error('Error fetching task relationships:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch task relationships',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sourceTaskId, targetTaskId, projectId, relationshipType } = body;

    // 必須フィールドの検証
    if (!sourceTaskId || !relationshipType) {
      return NextResponse.json(
        {
          success: false,
          error: 'sourceTaskId and relationshipType are required',
        },
        { status: 400 }
      );
    }

    // 関係性タイプの検証
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

    // ソースタスクの存在確認
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
      if (sourceTaskId === targetTaskId) {
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

    // 重複チェック
    const existingRelationship = await prisma.task_relationships.findFirst({
      where: {
        sourceTaskId,
        targetTaskId: targetTaskId || null,
        projectId: projectId || null,
        relationshipType,
      },
    });

    if (existingRelationship) {
      return NextResponse.json(
        {
          success: false,
          error: 'Relationship already exists',
        },
        { status: 409 }
      );
    }

    // 関係性を作成
    const relationship = await prisma.task_relationships.create({
      data: {
        sourceTaskId,
        targetTaskId: targetTaskId || null,
        projectId: projectId || null,
        relationshipType,
      },
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
      data: relationship,
      message: 'Task relationship created successfully',
    });
  } catch (error) {
    console.error('Error creating task relationship:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create task relationship',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}