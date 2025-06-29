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
      companyName: opportunity.customer?.companyName || '',
      industry: opportunity.customer?.industry || '',
      companySize: opportunity.customer?.employees || 0,
      decisionMakers: [], // 実際には別テーブルから取得
      painPoints: [], // 実際には別テーブルから取得
      competitivePosition: {
        keyCompetitors: [],
        competitiveAdvantages: [],
        marketChallenges: [],
        differentiationNeeds: []
      },
      riskFactors: [],
      opportunities: []
    };

    let result;

    switch (predictionType) {
      case 'conversion_probability':
        result = await conversionPredictor.predictConversionProbability(
          opportunity,
          customerProfile
        );
        break;
      
      case 'optimization':
        result = await conversionPredictor.optimizeConversionProbability(
          opportunity,
          customerProfile
        );
        break;
      
      case 'metrics_analysis':
        const opportunities = await prisma.sales_opportunities.findMany({
          where: { customerId: opportunity.customerId },
          include: { sales_activities: true }
        });
        result = await conversionPredictor.analyzeConversionMetrics(opportunities);
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
        probability: result.currentProbability || result.currentScore || 0,
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