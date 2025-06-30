import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database/prisma';
import { SalesConversionPredictor } from '@/services/SalesConversionPredictor';

const conversionPredictor = new SalesConversionPredictor();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { opportunityId, predictionType } = body;

    if (!opportunityId) {
      return NextResponse.json(
        { error: 'Opportunity ID is required' },
        { status: 400 }
      );
    }

    // 営業案件データを取得
    const opportunity = await prisma.sales_opportunities.findUnique({
      where: { id: opportunityId },
      include: {
        customer: true,
        sales_activities: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!opportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    // 顧客プロファイルの構築
    const customerProfile = {
      id: opportunity.customerId,
      companyName: opportunity.customer?.companyName || '',
      industry: opportunity.customer?.industry || '',
      companySize: opportunity.customer?.employees || 0,
      revenue: opportunity.customer?.revenue || 0,
      employees: opportunity.customer?.employees || 0,
      businessModel: opportunity.customer?.businessModel || 'B2B',
      customerPersona: {
        primaryNeeds: [],
        challenges: [],
        goals: [],
        decisionCriteria: []
      },
      budget: {
        amount: 0,
        costSensitivity: 'medium' as const,
        approvalProcess: 'standard',
        budgetCycle: 'annual'
      },
      decisionMakers: [], // 実際には別テーブルから取得
      painPoints: [], // 実際には別テーブルから取得
      competitivePosition: {
        keyCompetitors: [],
        competitiveAdvantages: [],
        marketChallenges: [],
        differentiationNeeds: []
      },
      riskFactors: [],
      opportunities: [],
      techMaturity: 'intermediate' as const
    };

    let result;

    switch (predictionType) {
      case 'conversion_probability':
        // Prismaから取得したデータをSalesOpportunity型に変換
        const salesOpp = {
          ...opportunity,
          activities: opportunity.sales_activities || [],
          dealValue: Number(opportunity.dealValue),
          riskScore: 0,
          probabilityScore: 0
        } as any;
        result = await conversionPredictor.predictConversionProbability(
          salesOpp,
          customerProfile as any
        );
        break;
      
      case 'optimization':
        // Prismaから取得したデータをSalesOpportunity型に変換
        const salesOppOpt = {
          ...opportunity,
          activities: opportunity.sales_activities || [],
          dealValue: Number(opportunity.dealValue),
          riskScore: 0,
          probabilityScore: 0
        } as any;
        result = await conversionPredictor.optimizeConversionProbability(
          salesOppOpt,
          customerProfile as any
        );
        break;
      
      case 'metrics_analysis':
        const opportunities = await prisma.sales_opportunities.findMany({
          where: { customerId: opportunity.customerId },
          include: { sales_activities: true }
        });
        // Prismaから取得したデータをSalesOpportunity型に変換
        const salesOpps = opportunities.map(opp => ({
          ...opp,
          activities: opp.sales_activities || [],
          dealValue: Number(opp.dealValue),
          riskScore: 0,
          probabilityScore: 0
        })) as any[];
        result = await conversionPredictor.analyzeConversionMetrics(salesOpps);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid prediction type' },
          { status: 400 }
        );
    }

    // 予測結果をデータベースに保存
    await prisma.conversion_predictions.create({
      data: {
        opportunityId,
        predictionType,
        probability: (result as any)?.currentProbability || (result as any)?.currentScore || 0,
        result: JSON.stringify(result),
        executedAt: new Date()
      }
    });

    return NextResponse.json({
      opportunityId,
      predictionType,
      result,
      executedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Conversion Prediction error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}