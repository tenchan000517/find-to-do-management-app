// Phase 2: LTV Analysis API Endpoints
import { NextRequest, NextResponse } from 'next/server';
import CustomerLTVAnalyzer from '../../../services/CustomerLTVAnalyzer';
import prisma from '@/lib/database/prisma';

const ltvAnalyzer = new CustomerLTVAnalyzer();

export async function POST(request: NextRequest) {
  try {
    const { connectionId, analysisType } = await request.json();

    if (!connectionId) {
      return NextResponse.json(
        { error: 'connectionId is required' },
        { status: 400 }
      );
    }

    let result;
    
    switch (analysisType) {
      case 'comprehensive':
        result = await ltvAnalyzer.calculateComprehensiveLTV(connectionId);
        break;
      
      default:
        result = await ltvAnalyzer.calculateComprehensiveLTV(connectionId);
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('LTV Analysis API Error:', error);
    return NextResponse.json(
      { 
        error: 'LTV分析の実行に失敗しました',
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');

    // 特定の顧客のLTV分析を取得
    if (connectionId) {
      const ltvData = await prisma.customer_ltv_analysis.findMany({
        where: { connectionId },
        include: {
          connection: true,
          creator: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json({
        success: true,
        data: ltvData.map(data => ({
          id: data.id,
          customerId: data.connectionId,
          customerName: data.connection?.company || data.connection?.name || 'Unknown',
          currentLTV: Number(data.totalLtv),
          predictedLTV: Number(data.discountedLtv),
          averageOrderValue: Number(data.initialProjectValue),
          purchaseFrequency: data.continuationProbability,
          customerLifespan: data.relationshipDurationYears,
          profitMargin: calculateProfitMargin(data),
          segment: calculateSegmentFromLTV(Number(data.totalLtv)),
          riskFactors: data.riskFactors,
          opportunities: data.opportunities,
          recommendedActions: data.recommendedActions,
          confidenceScore: data.confidenceScore,
          analysisDate: data.analysisDate,
          createdBy: data.creator?.name
        }))
      });
    }

    // 全顧客のLTV分析概要を取得
    const allLtvData = await prisma.customer_ltv_analysis.findMany({
      include: {
        connection: true
      },
      orderBy: { totalLtv: 'desc' }
    });

    if (allLtvData.length === 0) {
      return NextResponse.json({ 
        analysis: [], 
        message: "LTV分析データがありません" 
      });
    }

    const ltvAnalysis = allLtvData.map(data => ({
      customerId: data.connectionId,
      customerName: data.connection?.company || data.connection?.name || 'Unknown',
      currentLTV: Number(data.totalLtv),
      predictedLTV: Number(data.discountedLtv),
      averageOrderValue: Number(data.initialProjectValue),
      purchaseFrequency: data.continuationProbability,
      customerLifespan: data.relationshipDurationYears || 12,
      profitMargin: calculateProfitMargin(data),
      segment: calculateSegmentFromLTV(Number(data.totalLtv)),
      analysisDate: data.analysisDate
    }));

    return NextResponse.json({ 
      success: true,
      analysis: ltvAnalysis,
      summary: {
        totalCustomers: ltvAnalysis.length,
        totalLTV: ltvAnalysis.reduce((sum, item) => sum + item.currentLTV, 0),
        averageLTV: ltvAnalysis.reduce((sum, item) => sum + item.currentLTV, 0) / ltvAnalysis.length,
        segmentDistribution: {
          A: ltvAnalysis.filter(item => item.segment === 'A').length,
          B: ltvAnalysis.filter(item => item.segment === 'B').length,
          C: ltvAnalysis.filter(item => item.segment === 'C').length,
          D: ltvAnalysis.filter(item => item.segment === 'D').length
        }
      }
    });

  } catch (error) {
    console.error('LTV Analysis GET API Error:', error);
    return NextResponse.json(
      { 
        error: 'LTV分析履歴の取得に失敗しました',
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

// ヘルパー関数
function calculateProfitMargin(ltvData: any): number {
  // 簡易的な利益率計算（実際のコスト構造に基づいて調整）
  const baseMargin = 0.3; // 30%ベース利益率
  const riskAdjustment = Math.max(0, 0.2 - (ltvData.confidenceScore * 0.2));
  return Math.round((baseMargin - riskAdjustment) * 100); // パーセンテージで返す
}

function calculateSegmentFromLTV(ltv: number): 'A' | 'B' | 'C' | 'D' {
  if (ltv > 2000000) return 'A';
  if (ltv > 1000000) return 'B';
  if (ltv > 500000) return 'C';
  return 'D';
}