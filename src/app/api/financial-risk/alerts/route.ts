import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    // 実際のデータから動的にリスクアラートを生成
    const alerts = await generateRiskAlerts();
    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Financial risk alerts API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateRiskAlerts() {
  const alerts = [];
  
  // 1. 低LTV・高リスク顧客アラート
  const lowLtvCustomers = await prisma.customer_ltv_analysis.findMany({
    where: {
      OR: [
        { totalLtv: { lt: 300000 } },
        { continuationProbability: { lt: 0.4 } }
      ]
    },
    include: {
      connection: true
    },
    take: 10
  });

  lowLtvCustomers.forEach(customer => {
    const severity = Number(customer.totalLtv) < 100000 ? 'critical' : 'high';
    alerts.push({
      id: `low_ltv_${customer.id}`,
      type: 'low_ltv',
      severity,
      customerId: customer.connectionId,
      title: `低LTV顧客: ${customer.connection?.company || customer.connection?.name}`,
      description: `LTV: ¥${Number(customer.totalLtv).toLocaleString()}, 継続確率: ${(customer.continuationProbability * 100).toFixed(1)}%`,
      suggestedActions: [
        '関係強化のためのフォローアップ',
        '追加サービスの提案',
        'リテンション戦略の実行'
      ],
      impact: Number(customer.totalLtv),
      resolved: false,
      createdAt: new Date()
    });
  });

  // 2. 長期間連絡なし顧客アラート
  const staleConnections = await prisma.connections.findMany({
    where: {
      updatedAt: {
        lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90日前
      }
    },
    include: {
      ltv_analysis: true
    },
    take: 15
  });

  staleConnections.forEach(connection => {
    const daysSinceContact = Math.floor((Date.now() - new Date(connection.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
    const ltv = connection.ltv_analysis?.[0] ? Number(connection.ltv_analysis[0].totalLtv) : 0;
    
    const severity = daysSinceContact > 180 ? 'critical' : daysSinceContact > 120 ? 'high' : 'medium';
    alerts.push({
      id: `stale_contact_${connection.id}`,
      type: 'stale_contact',
      severity,
      customerId: connection.id,
      title: `長期未接触: ${connection.company || connection.name}`,
      description: `最終接触から${daysSinceContact}日経過`,
      suggestedActions: [
        '定期的なチェックイン',
        '価値提供コンテンツの送付',
        '新しいニーズの確認'
      ],
      impact: ltv,
      resolved: false,
      createdAt: new Date()
    });
  });

  // 3. プロジェクト予算オーバーアラート
  const budgetOverruns = await prisma.project_financial_details.findMany({
    where: {
      // 予算超過の可能性が高いプロジェクト
      riskBufferPercentage: { gt: 0.2 }
    },
    include: {
      project: true
    },
    take: 10
  });

  budgetOverruns.forEach(financial => {
    const overrunRisk = financial.riskBufferPercentage * 100;
    const severity = overrunRisk > 30 ? 'critical' : overrunRisk > 20 ? 'high' : 'medium';
    
    alerts.push({
      id: `budget_risk_${financial.id}`,
      type: 'budget_overrun',
      severity,
      projectId: financial.projectId,
      title: `予算超過リスク: ${financial.project.name}`,
      description: `リスクバッファ: ${overrunRisk.toFixed(1)}%`,
      suggestedActions: [
        'スコープの再確認',
        'リソース配分の最適化',
        '追加予算の確保検討'
      ],
      impact: Number(financial.baseContractValue),
      resolved: false,
      createdAt: new Date()
    });
  });

  // 4. 売上減少トレンドアラート
  const recentLtvTrend = await calculateLtvTrend();
  if (recentLtvTrend.decline > 15) {
    alerts.push({
      id: 'ltv_decline_trend',
      type: 'revenue_decline',
      severity: recentLtvTrend.decline > 30 ? 'critical' : 'high',
      title: 'LTV減少トレンド検知',
      description: `過去3ヶ月で平均LTVが${recentLtvTrend.decline.toFixed(1)}%減少`,
      suggestedActions: [
        '顧客満足度調査の実施',
        'サービス品質の向上',
        '新規顧客獲得の強化'
      ],
      impact: recentLtvTrend.impactAmount,
      resolved: false,
      createdAt: new Date()
    });
  }

  // 5. 高価値顧客の継続確率低下アラート
  const highValueAtRisk = await prisma.customer_ltv_analysis.findMany({
    where: {
      AND: [
        { totalLtv: { gt: 1000000 } },
        { continuationProbability: { lt: 0.6 } }
      ]
    },
    include: {
      connection: true
    },
    take: 5
  });

  highValueAtRisk.forEach(customer => {
    alerts.push({
      id: `high_value_risk_${customer.id}`,
      type: 'high_value_at_risk',
      severity: 'critical',
      customerId: customer.connectionId,
      title: `高価値顧客リスク: ${customer.connection?.company || customer.connection?.name}`,
      description: `LTV: ¥${Number(customer.totalLtv).toLocaleString()}, 継続確率: ${(customer.continuationProbability * 100).toFixed(1)}%`,
      suggestedActions: [
        '緊急ミーティングの設定',
        'エグゼクティブレベルでの関係強化',
        '専用サポートチームの配置'
      ],
      impact: Number(customer.totalLtv),
      resolved: false,
      createdAt: new Date()
    });
  });

  return alerts.sort((a, b) => {
    // 重要度順でソート
    const severityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
    const severityDiff = severityOrder[b.severity as keyof typeof severityOrder] - severityOrder[a.severity as keyof typeof severityOrder];
    if (severityDiff !== 0) return severityDiff;
    
    // 影響額順でソート
    return (b.impact || 0) - (a.impact || 0);
  });
}

async function calculateLtvTrend() {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const recentLtv = await prisma.customer_ltv_analysis.aggregate({
    where: {
      createdAt: { gte: threeMonthsAgo }
    },
    _avg: { totalLtv: true },
    _count: true
  });
  
  const previousLtv = await prisma.customer_ltv_analysis.aggregate({
    where: {
      createdAt: { gte: sixMonthsAgo, lt: threeMonthsAgo }
    },
    _avg: { totalLtv: true },
    _count: true
  });
  
  const recent = Number(recentLtv._avg.totalLtv || 0);
  const previous = Number(previousLtv._avg.totalLtv || 0);
  
  const decline = previous > 0 ? ((previous - recent) / previous) * 100 : 0;
  
  return {
    decline: Math.max(0, decline),
    impactAmount: (previous - recent) * (recentLtv._count || 0)
  };
}