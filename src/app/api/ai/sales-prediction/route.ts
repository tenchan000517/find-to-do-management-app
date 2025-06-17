import { NextRequest, NextResponse } from 'next/server';
import { prismaDataService } from '@/lib/database/prisma-service';
import { SalesPrediction, PredictionFactors, ActionItem } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const appointmentId = searchParams.get('appointmentId');

    if (appointmentId) {
      // 単一案件の予測
      const prediction = await generateSinglePrediction(appointmentId);
      return NextResponse.json({ success: true, data: prediction });
    } else {
      // 全案件の予測
      const predictions = await generateAllPredictions();
      return NextResponse.json({ success: true, data: predictions });
    }
  } catch (error) {
    console.error('Sales prediction API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate sales predictions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { appointmentIds } = await request.json();
    
    if (!appointmentIds || !Array.isArray(appointmentIds)) {
      return NextResponse.json(
        { success: false, error: 'appointmentIds array is required' },
        { status: 400 }
      );
    }

    const predictions = await Promise.all(
      appointmentIds.map((id: string) => generateSinglePrediction(id))
    );

    const validPredictions = predictions.filter((p: any) => p !== null) as SalesPrediction[];
    const actionItems = generateActionItems(validPredictions);

    return NextResponse.json({
      success: true,
      data: {
        predictions: validPredictions,
        actionItems,
      },
    });
  } catch (error) {
    console.error('Sales prediction POST API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process prediction request' },
      { status: 500 }
    );
  }
}

async function generateSinglePrediction(appointmentId: string): Promise<SalesPrediction | null> {
  try {
    const appointment = await prismaDataService.getAppointmentById(appointmentId);

    if (!appointment) {
      return null;
    }

    // 過去データから統計情報を取得
    const historicalData = await getHistoricalSalesData();
    
    // 予測因子計算
    const factors = calculatePredictionFactors(appointment, historicalData);
    
    // 成約確率計算（軽量AIアルゴリズム）
    const closingProbability = calculateClosingProbability(factors);
    
    // 売上予測
    const predictedRevenue = appointment.details?.contractValue || 0;
    
    // 競合リスク評価
    const competitorRisk = assessCompetitorRisk(appointment, factors);
    
    // 最適フォロータイミング
    const optimalFollowUpTiming = calculateOptimalFollowUpTiming(appointment, historicalData);
    
    // 推奨アクション生成
    const recommendedActions = generateRecommendedActions(appointment, factors, closingProbability);
    
    // 信頼度スコア
    const confidenceScore = calculateConfidenceScore(factors, historicalData.totalSamples);

    return {
      appointmentId,
      closingProbability,
      predictedRevenue,
      recommendedActions,
      competitorRisk,
      optimalFollowUpTiming,
      confidenceScore,
      lastUpdated: new Date().toISOString(),
      factors,
    };
  } catch (error) {
    console.error(`Failed to generate prediction for appointment ${appointmentId}:`, error);
    return null;
  }
}

async function generateAllPredictions(): Promise<SalesPrediction[]> {
  const allAppointments = await prismaDataService.getAppointments();
  
  // アクティブな案件のみフィルタ
  const activeAppointments = allAppointments.filter((apt: any) => 
    apt.details?.phaseStatus && apt.details.phaseStatus !== 'CLOSED'
  );

  const predictions = await Promise.all(
    activeAppointments.map((apt: any) => generateSinglePrediction(apt.id))
  );

  return predictions.filter((p: any) => p !== null) as SalesPrediction[];
}

function calculatePredictionFactors(appointment: any, historicalData: any): PredictionFactors {
  const details = appointment.details || {};
  
  // 営業フェーズスコア（0-100）
  const phaseScores: { [key: string]: number } = {
    'CONTACT': 10,
    'MEETING': 30,
    'PROPOSAL': 60,
    'CONTRACT': 85,
    'CLOSED': 100,
  };
  const salesPhaseScore = phaseScores[details.phaseStatus] || 10;

  // 関係性スコア（0-100）
  const relationshipScores: { [key: string]: number } = {
    'FIRST_CONTACT': 20,
    'RAPPORT_BUILDING': 40,
    'TRUST_ESTABLISHED': 70,
    'STRATEGIC_PARTNER': 90,
    'LONG_TERM_CLIENT': 95,
  };
  const relationshipScore = relationshipScores[details.relationshipStatus] || 20;

  // エンゲージメントスコア（アクティビティベース）
  const daysSinceLastContact = appointment.lastContact 
    ? Math.floor((Date.now() - new Date(appointment.lastContact).getTime()) / (1000 * 60 * 60 * 24))
    : 30;
  const engagementScore = Math.max(0, 100 - (daysSinceLastContact * 2));

  // 競合状況スコア（低いほど良い）
  const competitionScore = details.competitors && details.competitors.length > 0 
    ? Math.max(20, 100 - (details.competitors.length * 15))
    : 80;

  // 案件価値スコア
  const businessValueScore = details.businessValue || 50;

  // タイムライン圧力（緊急度）
  const timelinePressure = details.timeline?.includes('急') ? 80 : 
                          details.timeline?.includes('月内') ? 60 : 40;

  return {
    salesPhaseScore,
    relationshipScore,
    engagementScore,
    competitionScore,
    businessValueScore,
    timelinePressure,
  };
}

function calculateClosingProbability(factors: PredictionFactors): number {
  // 重み付きスコア計算（軽量AIアプローチ）
  const weights = {
    salesPhase: 0.25,
    relationship: 0.20,
    engagement: 0.15,
    competition: 0.15,
    businessValue: 0.15,
    timeline: 0.10,
  };

  const weightedScore = 
    (factors.salesPhaseScore * weights.salesPhase) +
    (factors.relationshipScore * weights.relationship) +
    (factors.engagementScore * weights.engagement) +
    (factors.competitionScore * weights.competition) +
    (factors.businessValueScore * weights.businessValue) +
    (factors.timelinePressure * weights.timeline);

  // 0-100の範囲に正規化
  return Math.min(100, Math.max(0, Math.round(weightedScore)));
}

function assessCompetitorRisk(appointment: any, factors: PredictionFactors): 'low' | 'medium' | 'high' {
  const competitorCount = appointment.details?.competitors?.length || 0;
  const competitionScore = factors.competitionScore;
  
  if (competitorCount === 0 && competitionScore > 80) return 'low';
  if (competitorCount <= 2 && competitionScore > 60) return 'medium';
  return 'high';
}

function calculateOptimalFollowUpTiming(appointment: any, historicalData: any): string {
  const phaseStatus = appointment.details?.phaseStatus || 'CONTACT';
  const daysSinceLastContact = appointment.lastContact 
    ? Math.floor((Date.now() - new Date(appointment.lastContact).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const followUpIntervals: { [key: string]: number } = {
    'CONTACT': 3,
    'MEETING': 5,
    'PROPOSAL': 7,
    'CONTRACT': 2,
  };

  const recommendedInterval = followUpIntervals[phaseStatus] || 5;
  const nextFollowUp = new Date();
  nextFollowUp.setDate(nextFollowUp.getDate() + recommendedInterval);

  if (daysSinceLastContact > recommendedInterval * 2) {
    return '今すぐフォローアップが必要';
  }

  return `${nextFollowUp.toLocaleDateString('ja-JP')} までにフォローアップ`;
}

function generateRecommendedActions(appointment: any, factors: PredictionFactors, probability: number): string[] {
  const actions: string[] = [];
  const phaseStatus = appointment.details?.phaseStatus || 'CONTACT';

  // フェーズ別推奨アクション
  if (phaseStatus === 'CONTACT' && factors.engagementScore < 50) {
    actions.push('追加のコンタクトを取り、関心度を確認する');
  }

  if (phaseStatus === 'MEETING' && factors.relationshipScore < 60) {
    actions.push('信頼関係構築のためのフォローアップミーティングを設定');
  }

  if (phaseStatus === 'PROPOSAL' && probability < 70) {
    actions.push('提案内容の見直しと競合優位性の強化');
  }

  if (phaseStatus === 'CONTRACT' && factors.timelinePressure < 50) {
    actions.push('契約締結の緊急性を高めるインセンティブを提案');
  }

  // 競合リスク対応
  if (factors.competitionScore < 60) {
    actions.push('競合分析と差別化ポイントの明確化');
  }

  // エンゲージメント改善
  if (factors.engagementScore < 40) {
    actions.push('顧客エンゲージメント向上のための施策実行');
  }

  // 高確率案件の加速
  if (probability > 80) {
    actions.push('高確率案件として契約締結を加速');
  }

  return actions.length > 0 ? actions : ['定期的なフォローアップを継続'];
}

function calculateConfidenceScore(factors: PredictionFactors, sampleSize: number): number {
  // データ品質による信頼度
  const dataQuality = Math.min(100, sampleSize * 2);
  
  // 因子の一貫性による信頼度
  const factorValues = Object.values(factors);
  const factorVariance = factorValues.reduce((sum, val, _, arr) => {
    const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
    return sum + Math.pow(val - mean, 2);
  }, 0) / factorValues.length;
  
  const consistencyScore = Math.max(0, 100 - factorVariance);
  
  // 総合信頼度
  return Math.round((dataQuality * 0.3 + consistencyScore * 0.7));
}

async function getHistoricalSalesData() {
  const allAppointments = await prismaDataService.getAppointments();
  
  const closedAppointments = allAppointments.filter((apt: any) => 
    apt.details?.phaseStatus === 'CLOSED'
  );

  const successfulCount = closedAppointments.filter((apt: any) => 
    apt.details?.processingStatus === 'COMPLETED'
  ).length;

  return {
    totalSamples: closedAppointments.length,
    successRate: closedAppointments.length > 0 ? successfulCount / closedAppointments.length : 0,
    averageSalesCycle: 30, // 仮の値
    averageDealSize: 1000000, // 仮の値
  };
}

function generateActionItems(predictions: SalesPrediction[]): ActionItem[] {
  const actionItems: ActionItem[] = [];
  
  // 高確率案件の加速
  const highProbabilityDeals = predictions.filter(p => p.closingProbability > 80);
  highProbabilityDeals.forEach(deal => {
    actionItems.push({
      id: `accelerate-${deal.appointmentId}`,
      type: 'contract',
      priority: 'high',
      title: '高確率案件の契約加速',
      description: `成約確率${deal.closingProbability}%の案件を優先的に契約締結`,
      appointmentId: deal.appointmentId,
      estimatedImpact: deal.predictedRevenue,
    });
  });

  // リスク案件のフォローアップ
  const riskDeals = predictions.filter(p => 
    p.closingProbability < 50 && p.competitorRisk === 'high'
  );
  riskDeals.forEach(deal => {
    actionItems.push({
      id: `risk-${deal.appointmentId}`,
      type: 'risk_mitigation',
      priority: 'medium',
      title: 'リスク案件の挽回施策',
      description: '競合リスクが高い案件の差別化強化',
      appointmentId: deal.appointmentId,
      estimatedImpact: deal.predictedRevenue * 0.5,
    });
  });

  return actionItems;
}