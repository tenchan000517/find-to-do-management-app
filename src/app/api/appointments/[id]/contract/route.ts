import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    
    const {
      contractAmount,
      contractTerms,
      paymentTerms,
      deliveryTimeline,
      projectDetails,
      backofficeConfig,
      automaticTasks
    } = body;

    // アポイントメント更新（契約情報追加）
    const appointment = await prisma.appointments.update({
      where: { id },
      data: {
        notes: `${contractTerms}\n支払条件: ${paymentTerms}\n納期: ${deliveryTimeline}`
      }
    });

    const results: any = {
      appointment,
      createdProject: null,
      createdTasks: [],
      message: '契約処理が完了しました'
    };

    // プロジェクト作成
    if (projectDetails && projectDetails.name) {
      const project = await prisma.projects.create({
        data: {
          id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: projectDetails.name,
          description: projectDetails.description || '',
          status: 'PLANNING',
          progress: 0,
          startDate: projectDetails.startDate || new Date().toISOString().split('T')[0],
          endDate: projectDetails.estimatedDuration ? 
            new Date(Date.now() + (90 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0] : // デフォルト3ヶ月後
            null,
          teamMembers: projectDetails.teamMembers || [],
          priority: projectDetails.priority || 'A',
          createdBy: appointment.assignedTo || 'user1',
          assignedTo: appointment.assignedTo || 'user1',
          kgi: `${appointment.companyName}案件 - 契約金額: ${contractAmount}万円`,
          successProbability: 95, // 契約段階なので高い成功確率
          activityScore: 100,
          connectionPower: 80
        }
      });
      results.createdProject = project;

      // プロジェクトIDをアポイントメントのノートに追加
      await prisma.appointments.update({
        where: { id },
        data: {
          notes: `${appointment.notes}\nプロジェクトID: ${project.id}`
        }
      });
    }

    // 自動タスク生成
    const tasksToCreate = [];

    // 契約関連のデフォルトタスク
    const defaultContractTasks = [
      {
        title: '契約書作成・送付',
        description: `${appointment.companyName}様との契約書を作成し、送付する`,
        priority: 'A' as const,
        status: 'PLAN' as const
      },
      {
        title: '契約書締結・回収',
        description: `${appointment.companyName}様から署名済み契約書を回収する`,
        priority: 'A' as const,
        status: 'PLAN' as const
      }
    ];

    tasksToCreate.push(...defaultContractTasks);

    // バックオフィス設定に基づくタスク生成
    if (backofficeConfig?.createInvoiceTasks) {
      tasksToCreate.push({
        title: '請求書発行',
        description: `${appointment.companyName}様への請求書を発行する (${backofficeConfig.invoiceSchedule})`,
        priority: 'A' as const,
        status: 'PLAN' as const
      });
    }

    if (backofficeConfig?.createDeliveryTasks) {
      tasksToCreate.push({
        title: '納品準備',
        description: `${appointment.companyName}様への納品準備 (${backofficeConfig.deliverySchedule})`,
        priority: 'B' as const,
        status: 'PLAN' as const
      });
    }

    if (backofficeConfig?.createFollowUpTasks) {
      tasksToCreate.push({
        title: 'フォローアップ',
        description: `${appointment.companyName}様へのフォローアップ (${backofficeConfig.followUpSchedule})`,
        priority: 'C' as const,
        status: 'PLAN' as const
      });
    }

    // カスタム自動タスク追加
    if (automaticTasks && automaticTasks.length > 0) {
      automaticTasks.forEach((taskTitle: string) => {
        tasksToCreate.push({
          title: taskTitle,
          description: `${appointment.companyName}様案件: ${taskTitle}`,
          priority: 'B' as const,
          status: 'PLAN' as const
        });
      });
    }

    // タスク一括作成
    for (const taskData of tasksToCreate) {
      const task = await prisma.tasks.create({
        data: {
          id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...taskData,
          projectId: results.createdProject?.id,
          userId: appointment.assignedTo || 'user1', // レガシーフィールド
          createdBy: appointment.assignedTo || 'user1',
          assignedTo: appointment.assignedTo || 'user1',
          dueDate: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0], // 1週間後
          isArchived: false
        }
      });
      results.createdTasks.push(task);
    }

    // 人脈管理にコネクション追加
    try {
      await prisma.connections.create({
        data: {
          id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          date: new Date().toISOString(),
          location: 'オフィス',
          company: appointment.companyName,
          name: appointment.contactName,
          position: '担当者', // デフォルト
          type: 'COMPANY',
          description: `契約成立: ${contractAmount}万円`,
          conversation: `${appointment.companyName}様との契約が成立しました。`,
          potential: `継続取引・追加案件の可能性あり`,
          businessCard: '',
          createdBy: appointment.assignedTo || 'user1',
          assignedTo: appointment.assignedTo || 'user1',
          updatedAt: new Date()
        }
      });
    } catch (connectionError) {
      console.warn('Failed to create connection:', connectionError);
      // コネクション作成の失敗は契約処理全体を止めない
    }

    return NextResponse.json({ 
      success: true, 
      ...results
    });

  } catch (error) {
    console.error('Failed to process contract:', error);
    return NextResponse.json(
      { error: '契約処理に失敗しました' },
      { status: 500 }
    );
  }
}