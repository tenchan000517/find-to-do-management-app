import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database/prisma';
import { AISalesAssistant } from '@/services/AISalesAssistant';

const aiSalesAssistant = new AISalesAssistant();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, analysisType } = body;

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // 顧客の営業データを取得
    const salesData = await prisma.sales_opportunities.findMany({
      where: { customerId },
      include: {
        sales_activities: true
      },
      orderBy: { createdAt: 'desc' }
    });

    let result;

    switch (analysisType) {
      case 'customer_profile':
        result = await aiSalesAssistant.analyzeCustomer(customerId);
        break;
      
      case 'customer_insights':
        result = await aiSalesAssistant.generateCustomerInsights(customerId, salesData);
        break;
      
      case 'competitive_analysis':
        result = await aiSalesAssistant.performCompetitiveAnalysis(customerId, 'digital_transformation');
        break;
      
      case 'ai_proposal':
        const proposalRequest = {
          customerId,
          solutionType: 'process_automation' as const,
          objectives: ['効率化', 'コスト削減'],
          constraints: ['既存システムとの互換性', 'セキュリティ要件'],
          successMetrics: ['処理時間50%短縮', 'エラー率90%削減'],
          budgetConstraints: 5000000,
          timelineRequirements: '6ヶ月'
        };
        result = await aiSalesAssistant.generateProposal(proposalRequest);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid analysis type' },
          { status: 400 }
        );
    }

    // 分析結果をデータベースに保存（履歴として）
    await prisma.ai_analysis_history.create({
      data: {
        customerId,
        analysisType,
        result: JSON.stringify(result),
        executedAt: new Date()
      }
    });

    return NextResponse.json({
      customerId,
      analysisType,
      result,
      executedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Sales Analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}