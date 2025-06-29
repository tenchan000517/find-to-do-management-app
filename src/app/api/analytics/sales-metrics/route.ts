import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dateFrom, dateTo, customerId, stage } = body;

    const where: any = {};

    if (dateFrom && dateTo) {
      where.createdAt = {
        gte: new Date(dateFrom),
        lte: new Date(dateTo)
      };
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (stage) {
      where.stage = stage;
    }

    // 営業案件の基本統計
    const opportunities = await prisma.sales_opportunities.findMany({
      where,
      include: {
        customer: true,
        sales_activities: true
      }
    });

    // メトリクス計算
    const totalOpportunities = opportunities.length;
    const totalValue = opportunities.reduce((sum, opp) => sum + (opp.dealValue || 0), 0);
    const avgDealSize = totalOpportunities > 0 ? totalValue / totalOpportunities : 0;

    // ステージ別分析
    const stageAnalysis = opportunities.reduce((acc, opp) => {
      const stage = opp.stage;
      if (!acc[stage]) {
        acc[stage] = { count: 0, value: 0 };
      }
      acc[stage].count++;
      acc[stage].value += opp.dealValue || 0;
      return acc;
    }, {} as Record<string, { count: number; value: number }>);

    // 成約率計算
    const wonOpportunities = opportunities.filter(opp => opp.stage === 'closed_won');
    const lostOpportunities = opportunities.filter(opp => opp.stage === 'closed_lost');
    const closedOpportunities = wonOpportunities.length + lostOpportunities.length;
    const conversionRate = closedOpportunities > 0 ? (wonOpportunities.length / closedOpportunities) * 100 : 0;

    // 平均成約日数
    const avgSalesCycle = wonOpportunities.length > 0 
      ? wonOpportunities.reduce((sum, opp) => {
          const created = new Date(opp.createdAt);
          const updated = new Date(opp.updatedAt);
          return sum + (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        }, 0) / wonOpportunities.length
      : 0;

    // 優先度別分析
    const priorityAnalysis = opportunities.reduce((acc, opp) => {
      const priority = opp.priority || 'C';
      if (!acc[priority]) {
        acc[priority] = { count: 0, value: 0, conversionRate: 0 };
      }
      acc[priority].count++;
      acc[priority].value += opp.dealValue || 0;
      return acc;
    }, {} as Record<string, { count: number; value: number; conversionRate: number }>);

    // 優先度別成約率を計算
    Object.keys(priorityAnalysis).forEach(priority => {
      const priorityOpps = opportunities.filter(opp => (opp.priority || 'C') === priority);
      const priorityWon = priorityOpps.filter(opp => opp.stage === 'closed_won');
      const priorityClosed = priorityOpps.filter(opp => ['closed_won', 'closed_lost'].includes(opp.stage));
      priorityAnalysis[priority].conversionRate = priorityClosed.length > 0 
        ? (priorityWon.length / priorityClosed.length) * 100 
        : 0;
    });

    // 月次トレンド分析
    const monthlyTrend = opportunities.reduce((acc, opp) => {
      const month = new Date(opp.createdAt).toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { count: 0, value: 0, won: 0 };
      }
      acc[month].count++;
      acc[month].value += opp.dealValue || 0;
      if (opp.stage === 'closed_won') {
        acc[month].won++;
      }
      return acc;
    }, {} as Record<string, { count: number; value: number; won: number }>);

    const metrics = {
      summary: {
        totalOpportunities,
        totalValue,
        avgDealSize,
        conversionRate,
        avgSalesCycle,
        wonValue: wonOpportunities.reduce((sum, opp) => sum + (opp.dealValue || 0), 0)
      },
      stageAnalysis,
      priorityAnalysis,
      monthlyTrend,
      opportunities: opportunities.map(opp => ({
        id: opp.id,
        companyName: opp.companyName,
        stage: opp.stage,
        priority: opp.priority,
        dealValue: opp.dealValue,
        createdAt: opp.createdAt,
        expectedCloseDate: opp.expectedCloseDate,
        customerIndustry: opp.customer?.industry
      }))
    };

    // メトリクス履歴として保存
    await prisma.sales_metrics_history.create({
      data: {
        dateFrom: dateFrom ? new Date(dateFrom) : null,
        dateTo: dateTo ? new Date(dateTo) : null,
        metrics: JSON.stringify(metrics),
        calculatedAt: new Date()
      }
    });

    return NextResponse.json(metrics);

  } catch (error) {
    console.error('Sales Metrics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}