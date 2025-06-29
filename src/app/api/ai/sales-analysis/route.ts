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
        result = await aiSalesAssistant.analyzeCustomer(customerId, salesData);
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
          budget: 5000000,
          timeline: '6ヶ月',
          requirements: ['システム統合', 'データ分析']
        };
        result = await aiSalesAssistant.generateAIProposal(proposalRequest);
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