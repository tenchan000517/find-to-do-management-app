import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { 
  KanbanMoveHandler, 
  validateKanbanMove,
  formatKanbanResponse,
  KanbanCache
} from '@/lib/utils/kanban-utils';

const prisma = new PrismaClient();

interface KanbanMoveRequest {
  itemType: 'task' | 'appointment' | 'project';
  itemId: string;
  sourceColumn: string;
  targetColumn: string;
  kanbanType?: 'status' | 'processing' | 'relationship' | 'phase' | 'source' | 'user' | 'project';
  userId?: string;
}

export async function POST(request: NextRequest) {
  const moveHandler = new KanbanMoveHandler(prisma);
  
  try {
    const body: KanbanMoveRequest = await request.json();
    const { itemType, itemId, targetColumn, kanbanType, userId } = body;

    // 基本バリデーション
    if (!itemType || !itemId || !targetColumn) {
      return NextResponse.json(
        formatKanbanResponse(false, null, '', 'itemType, itemId, targetColumn は必須項目です'),
        { status: 400 }
      );
    }

    // カンバン移動の妥当性検証
    if (kanbanType) {
      const validation = validateKanbanMove(itemType, kanbanType, targetColumn);
      if (!validation.isValid) {
        return NextResponse.json(
          formatKanbanResponse(false, null, '', validation.error),
          { status: 400 }
        );
      }
    }

    // キャッシュキーの生成と無効化
    const cacheKey = `kanban:${itemType}:${itemId}`;
    KanbanCache.invalidate(cacheKey);

    // 楽観的更新での移動処理実行
    const updateResult = await moveHandler.executeWithOptimisticUpdate(
      async () => {
        switch (itemType) {
          case 'task':
            return await handleTaskMove(itemId, targetColumn, kanbanType);
          case 'appointment':
            return await handleAppointmentMove(itemId, targetColumn, kanbanType);
          case 'project':
            return await handleProjectMove(itemId, targetColumn);
          default:
            throw new Error(`サポートされていないアイテムタイプ: ${itemType}`);
        }
      }
    );

    if (!updateResult.success) {
      return NextResponse.json(
        formatKanbanResponse(false, null, '', updateResult.error),
        { status: updateResult.status || 500 }
      );
    }

    // 成功時はキャッシュを更新
    KanbanCache.set(cacheKey, updateResult.data, 300);

    return NextResponse.json(
      formatKanbanResponse(true, updateResult.data, updateResult.message)
    );

  } catch (error) {
    console.error('カンバン移動エラー:', error);
    return NextResponse.json(
      formatKanbanResponse(false, null, '', 'カンバン移動処理に失敗しました'),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function handleTaskMove(
  taskId: string, 
  targetColumn: string, 
  kanbanType?: string
) {
  try {
    // タスクの存在確認
    const existingTask = await prisma.tasks.findUnique({
      where: { id: taskId },
      include: {
        creator: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        projects: { select: { id: true, name: true } }
      }
    });

    if (!existingTask) {
      return { success: false, error: 'タスクが見つかりません', status: 404 };
    }

    const updateData: Record<string, unknown> = {};

    // カンバンタイプに応じた更新処理
    switch (kanbanType) {
      case 'status':
        // ステータス変更
        if (!['IDEA', 'PLAN', 'DO', 'CHECK', 'COMPLETE', 'KNOWLEDGE', 'DELETE'].includes(targetColumn)) {
          return { success: false, error: '無効なステータスです', status: 400 };
        }
        updateData.status = targetColumn;
        break;
      
      case 'user':
        // 担当者変更
        if (targetColumn === 'unassigned') {
          updateData.assignedTo = null;
        } else {
          // ユーザーの存在確認
          const assignee = await prisma.users.findUnique({
            where: { id: targetColumn },
            select: { id: true, name: true, isActive: true }
          });
          
          if (!assignee || !assignee.isActive) {
            return { success: false, error: '有効な担当者が見つかりません', status: 404 };
          }
          
          updateData.assignedTo = targetColumn;
        }
        break;
      
      case 'project':
        // プロジェクト変更
        if (targetColumn === 'no_project') {
          updateData.projectId = null;
        } else {
          // プロジェクトの存在確認
          const project = await prisma.projects.findUnique({
            where: { id: targetColumn },
            select: { id: true, name: true }
          });
          
          if (!project) {
            return { success: false, error: 'プロジェクトが見つかりません', status: 404 };
          }
          
          updateData.projectId = targetColumn;
        }
        break;
      
      default:
        updateData.status = targetColumn;
    }

    // タスク更新
    const updatedTask = await prisma.tasks.update({
      where: { id: taskId },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        creator: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        projects: { select: { id: true, name: true } }
      }
    });

    return {
      success: true,
      data: updatedTask,
      message: `タスクを${kanbanType === 'status' ? 'ステータス' : kanbanType === 'user' ? '担当者' : 'プロジェクト'}「${targetColumn}」に移動しました`
    };

  } catch (error) {
    console.error('タスク移動エラー:', error);
    return { success: false, error: 'タスクの移動に失敗しました' };
  }
}

async function handleAppointmentMove(
  appointmentId: string,
  targetColumn: string,
  kanbanType?: string
) {
  try {
    // アポイントメントの存在確認
    const existingAppointment = await prisma.appointments.findUnique({
      where: { id: appointmentId },
      include: {
        details: true,
        creator: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } }
      }
    });

    if (!existingAppointment) {
      return { success: false, error: 'アポイントメントが見つかりません', status: 404 };
    }

    const updateData: Record<string, unknown> = {};
    const detailsUpdateData: Record<string, unknown> = {};

    // カンバンタイプに応じた詳細ステータス更新
    switch (kanbanType) {
      case 'processing':
        if (!['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FOLLOW_UP', 'CLOSED'].includes(targetColumn)) {
          return { success: false, error: '無効な処理ステータスです', status: 400 };
        }
        detailsUpdateData.processingStatus = targetColumn;
        break;
      
      case 'relationship':
        if (!['FIRST_CONTACT', 'RAPPORT_BUILDING', 'TRUST_ESTABLISHED', 'STRATEGIC_PARTNER', 'LONG_TERM_CLIENT'].includes(targetColumn)) {
          return { success: false, error: '無効な関係ステータスです', status: 400 };
        }
        detailsUpdateData.relationshipStatus = targetColumn;
        break;
      
      case 'phase':
        if (!['LEAD', 'PROSPECT', 'PROPOSAL', 'NEGOTIATION', 'CLOSING', 'POST_SALE'].includes(targetColumn)) {
          return { success: false, error: '無効なフェーズステータスです', status: 400 };
        }
        detailsUpdateData.phaseStatus = targetColumn;
        break;
      
      case 'source':
        if (!['REFERRAL', 'COLD_OUTREACH', 'NETWORKING_EVENT', 'INBOUND_INQUIRY', 'SOCIAL_MEDIA', 'EXISTING_CLIENT', 'PARTNER_REFERRAL'].includes(targetColumn)) {
          return { success: false, error: '無効なソースタイプです', status: 400 };
        }
        detailsUpdateData.sourceType = targetColumn;
        break;
      
      default:
        updateData.status = targetColumn;
    }

    // アポイントメント詳細更新
    if (Object.keys(detailsUpdateData).length > 0) {
      if (existingAppointment.details) {
        await prisma.appointment_details.update({
          where: { appointmentId },
          data: detailsUpdateData
        });
      } else {
        await prisma.appointment_details.create({
          data: {
            appointmentId,
            ...detailsUpdateData
          }
        });
      }
    }

    // アポイントメント本体更新
    const updatedAppointment = await prisma.appointments.update({
      where: { id: appointmentId },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        details: true,
        creator: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } }
      }
    });

    return {
      success: true,
      data: updatedAppointment,
      message: `アポイントメントを${kanbanType}「${targetColumn}」に移動しました`
    };

  } catch (error) {
    console.error('アポイントメント移動エラー:', error);
    return { success: false, error: 'アポイントメントの移動に失敗しました' };
  }
}

async function handleProjectMove(
  projectId: string,
  targetColumn: string
) {
  try {
    // プロジェクトの存在確認
    const existingProject = await prisma.projects.findUnique({
      where: { id: projectId }
    });

    if (!existingProject) {
      return { success: false, error: 'プロジェクトが見つかりません', status: 404 };
    }

    const updateData: Record<string, unknown> = {};

    // ステータス変更
    if (!['planning', 'active', 'on_hold', 'completed'].includes(targetColumn)) {
      return { success: false, error: '無効なプロジェクトステータスです', status: 400 };
    }
    
    updateData.status = targetColumn;

    // プロジェクト更新
    const updatedProject = await prisma.projects.update({
      where: { id: projectId },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    return {
      success: true,
      data: updatedProject,
      message: `プロジェクトをステータス「${targetColumn}」に移動しました`
    };

  } catch (error) {
    console.error('プロジェクト移動エラー:', error);
    return { success: false, error: 'プロジェクトの移動に失敗しました' };
  }
}