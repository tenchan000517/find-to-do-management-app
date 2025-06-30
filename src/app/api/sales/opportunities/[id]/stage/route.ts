import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const { stage, notes } = body;

    // 有効なステージかチェック
    const validStages = ['prospect', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
    if (!validStages.includes(stage)) {
      return NextResponse.json(
        { error: 'Invalid stage value' },
        { status: 400 }
      );
    }

    const opportunity = await prisma.sales_opportunities.update({
      where: { id },
      data: {
        stage,
        notes: notes || undefined,
        updatedAt: new Date()
      },
      include: {
        customer: true,
        sales_activities: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    // ステージ変更のアクティビティも記録
    await prisma.sales_activities.create({
      data: {
        opportunityId: id,
        type: 'STAGE_CHANGE',
        title: `ステージ変更: ${stage}`,
        description: `ステージを ${stage} に変更しました`,
        outcome: 'NEUTRAL',
        userId: 'system', // 実際にはユーザーIDを使用
        metadata: {
          previousStage: opportunity.stage,
          newStage: stage
        }
      }
    });

    return NextResponse.json(opportunity);
  } catch (error) {
    console.error('Stage update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}