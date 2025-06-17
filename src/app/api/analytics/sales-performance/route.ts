import { NextRequest, NextResponse } from 'next/server';
import { prismaDataService } from '@/lib/database/prisma-service';
import { SalesMetrics, TrendData } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '30'; // デフォルト30日
    
    // アポイントメントデータ取得（全て取得して後でフィルタ）
    const allAppointments = await prismaDataService.getAppointments();
    
    // プロジェクトデータ取得（全て取得して後でフィルタ）
    const allProjects = await prismaDataService.getProjects();
    
    // 期間フィルタリング
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    
    const appointments = allAppointments.filter(apt => 
      new Date(apt.createdAt) >= startDate
    );
    
    const projects = allProjects.filter(proj => 
      new Date(proj.createdAt) >= startDate
    );

    // 営業メトリクス計算
    const metrics = calculateSalesMetrics(appointments, projects);

    // トレンドデータ計算
    const trends = await calculateTrends(parseInt(period));

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        trends,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Sales performance API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sales performance data' },
      { status: 500 }
    );
  }
}

function calculateSalesMetrics(appointments: any[], projects: any[]): SalesMetrics {
  const closedAppointments = appointments.filter(apt => 
    apt.details?.phaseStatus === 'CLOSED'
  );
  
  const totalAppointments = appointments.length;
  const closedCount = closedAppointments.length;
  
  const conversionRate = totalAppointments > 0 ? (closedCount / totalAppointments) * 100 : 0;
  
  // 平均案件規模計算
  const contractValues = appointments
    .filter(apt => apt.details?.contractValue)
    .map(apt => apt.details.contractValue);
  const averageDealSize = contractValues.length > 0 
    ? contractValues.reduce((sum, val) => sum + val, 0) / contractValues.length 
    : 0;

  // 営業サイクル長計算（日数）
  const salesCycles = closedAppointments
    .filter(apt => apt.createdAt && apt.updatedAt)
    .map(apt => {
      const created = new Date(apt.createdAt);
      const updated = new Date(apt.updatedAt);
      return Math.floor((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    });
  const salesCycleLength = salesCycles.length > 0
    ? salesCycles.reduce((sum, cycle) => sum + cycle, 0) / salesCycles.length
    : 0;

  // パイプライン関連計算
  const pipelineAppointments = appointments.filter(apt => 
    apt.details?.phaseStatus && apt.details.phaseStatus !== 'CLOSED'
  );
  const totalPipelineValue = pipelineAppointments
    .filter(apt => apt.details?.contractValue)
    .reduce((sum, apt) => sum + apt.details.contractValue, 0);

  const pipelineVelocity = totalPipelineValue / Math.max(pipelineAppointments.length, 1);

  // 顧客生涯価値（簡易計算）
  const customerLifetimeValue = averageDealSize * 1.5; // 平均的な継続率を考慮

  // 月次売上（プロジェクトベース）
  const currentMonth = new Date().getMonth();
  const monthlyProjects = projects.filter(project => {
    const createdMonth = new Date(project.createdAt).getMonth();
    return createdMonth === currentMonth;
  });
  const monthlyRecurringRevenue = monthlyProjects.length * averageDealSize * 0.1; // 月次換算

  // 勝率・失注率
  const wonDeals = appointments.filter(apt => apt.details?.phaseStatus === 'CLOSED').length;
  const lostDeals = appointments.filter(apt => apt.details?.processingStatus === 'CLOSED' && apt.details?.phaseStatus !== 'CLOSED').length;
  const totalCompletedDeals = wonDeals + lostDeals;
  
  const winRate = totalCompletedDeals > 0 ? (wonDeals / totalCompletedDeals) * 100 : 0;
  const lossRate = totalCompletedDeals > 0 ? (lostDeals / totalCompletedDeals) * 100 : 0;

  const activeDeals = pipelineAppointments.length;
  const averageTimeToClose = salesCycleLength;

  return {
    conversionRate: Math.round(conversionRate * 100) / 100,
    averageDealSize: Math.round(averageDealSize),
    salesCycleLength: Math.round(salesCycleLength * 100) / 100,
    pipelineVelocity: Math.round(pipelineVelocity),
    customerLifetimeValue: Math.round(customerLifetimeValue),
    monthlyRecurringRevenue: Math.round(monthlyRecurringRevenue),
    totalPipelineValue: Math.round(totalPipelineValue),
    winRate: Math.round(winRate * 100) / 100,
    lossRate: Math.round(lossRate * 100) / 100,
    activeDeals,
    averageTimeToClose: Math.round(averageTimeToClose * 100) / 100,
  };
}

async function calculateTrends(days: number): Promise<{
  revenueGrowth: TrendData[];
  pipelineHealth: TrendData[];
  conversionRates: TrendData[];
  averageDealSizes: TrendData[];
}> {
  const periods = Math.min(days / 7, 12); // 最大12週間
  const trends = {
    revenueGrowth: [] as TrendData[],
    pipelineHealth: [] as TrendData[],
    conversionRates: [] as TrendData[],
    averageDealSizes: [] as TrendData[],
  };

  for (let i = periods - 1; i >= 0; i--) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - (i * 7));
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 7);

    // 全データから週次フィルタリング
    const allAppointments = await prismaDataService.getAppointments();
    const allProjects = await prismaDataService.getProjects();
    
    const weeklyAppointments = allAppointments.filter(apt => {
      const createdDate = new Date(apt.createdAt);
      return createdDate >= startDate && createdDate < endDate;
    });

    const weeklyProjects = allProjects.filter(proj => {
      const createdDate = new Date(proj.createdAt);
      return createdDate >= startDate && createdDate < endDate;
    });

    const weeklyMetrics = calculateSalesMetrics(weeklyAppointments, weeklyProjects);
    const period = `${startDate.getMonth() + 1}/${startDate.getDate()}`;

    trends.revenueGrowth.push({
      period,
      value: weeklyMetrics.monthlyRecurringRevenue,
    });

    trends.pipelineHealth.push({
      period,
      value: weeklyMetrics.totalPipelineValue,
    });

    trends.conversionRates.push({
      period,
      value: weeklyMetrics.conversionRate,
    });

    trends.averageDealSizes.push({
      period,
      value: weeklyMetrics.averageDealSize,
    });
  }

  // 前期比計算
  trends.revenueGrowth.forEach((item, index) => {
    if (index > 0) {
      const previous = trends.revenueGrowth[index - 1];
      item.previousValue = previous.value;
      item.change = item.value - previous.value;
      item.changePercent = previous.value > 0 ? (item.change / previous.value) * 100 : 0;
    }
  });

  trends.conversionRates.forEach((item, index) => {
    if (index > 0) {
      const previous = trends.conversionRates[index - 1];
      item.previousValue = previous.value;
      item.change = item.value - previous.value;
      item.changePercent = previous.value > 0 ? (item.change / previous.value) * 100 : 0;
    }
  });

  return trends;
}