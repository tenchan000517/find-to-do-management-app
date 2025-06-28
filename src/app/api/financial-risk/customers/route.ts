import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    // connectionsテーブルから顧客データを取得（既存テーブル活用）
    const connections = await prisma.connections.findMany({
      include: {
        ltv_analysis: true,
        creator: true,
        assignee: true
      }
    });

    if (connections.length === 0) {
      return NextResponse.json({ 
        customers: [], 
        message: "顧客データがありません" 
      });
    }

    // 顧客データにリスクスコアとセグメントを計算して追加
    const customersWithRisk = connections.map(connection => {
      const ltvData = connection.ltv_analysis?.[0];
      const riskScore = calculateRiskScore(connection, ltvData);
      const segment = calculateABCSegment(connection, ltvData);
      
      return {
        id: connection.id,
        name: connection.company || connection.name,
        email: connection.email,
        phone: connection.phone,
        totalRevenue: ltvData ? Number(ltvData.totalLtv) : 0,
        monthlyRevenue: calculateMonthlyRevenue(connection, ltvData),
        lastContactDate: connection.updatedAt,
        contractValue: ltvData ? Number(ltvData.initialProjectValue) : 0,
        customerSince: connection.createdAt,
        riskScore,
        segment,
        connectionType: connection.type,
        location: connection.location,
        description: connection.description,
        potential: connection.potential,
        paymentHistory: generatePaymentHistory(connection, ltvData)
      };
    });

    return NextResponse.json({ customers: customersWithRisk });
  } catch (error) {
    console.error('Financial risk customers API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// リスクスコア計算関数
function calculateRiskScore(connection: any, ltvData: any): number {
  let score = 0;
  
  // LTVデータの有無
  if (!ltvData) {
    score += 30; // LTV分析なし
  } else {
    // LTV継続確率の評価
    const continuationProb = ltvData.continuationProbability || 0;
    if (continuationProb < 0.3) score += 40;
    else if (continuationProb < 0.5) score += 25;
    else if (continuationProb < 0.7) score += 15;
    else if (continuationProb < 0.9) score += 5;
  }
  
  // 最新取引からの経過時間
  const daysSinceLastContact = (Date.now() - new Date(connection.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceLastContact > 180) score += 30;
  else if (daysSinceLastContact > 90) score += 20;
  else if (daysSinceLastContact > 30) score += 10;
  
  // 顧客タイプの評価
  if (connection.type === 'STUDENT') score += 15; // 学生は一般的にリスクが高い
  
  // プロジェクト価値の評価
  const projectValue = ltvData ? Number(ltvData.initialProjectValue) : 0;
  if (projectValue === 0) score += 25;
  else if (projectValue < 100000) score += 15;
  else if (projectValue < 500000) score += 10;
  
  // ポテンシャル評価
  if (connection.potential && connection.potential.includes('低')) score += 15;
  if (connection.potential && connection.potential.includes('高')) score -= 10;
  
  return Math.min(100, Math.max(0, score));
}

// ABCセグメント計算関数
function calculateABCSegment(connection: any, ltvData: any): 'A' | 'B' | 'C' | 'D' {
  const ltv = ltvData ? Number(ltvData.totalLtv) : 0;
  const riskScore = calculateRiskScore(connection, ltvData);
  
  if (ltv > 2000000 && riskScore < 20) return 'A';
  if (ltv > 1000000 && riskScore < 40) return 'B';
  if (ltv > 300000 && riskScore < 60) return 'C';
  return 'D';
}

// 月次売上計算関数
function calculateMonthlyRevenue(connection: any, ltvData: any): number {
  if (!ltvData) return 0;
  
  const annualProjects = ltvData.averageProjectsPerYear || 1;
  const avgProjectValue = Number(ltvData.initialProjectValue) || 0;
  
  return Math.round((annualProjects * avgProjectValue) / 12);
}

// 支払い履歴生成関数（サンプルデータ）
function generatePaymentHistory(connection: any, ltvData: any): any[] {
  if (!ltvData) return [];
  
  const history = [];
  const projectValue = Number(ltvData.initialProjectValue) || 0;
  const projectsPerYear = ltvData.averageProjectsPerYear || 1;
  
  // 過去6ヶ月のサンプル支払い履歴を生成
  for (let i = 0; i < Math.min(6, Math.floor(projectsPerYear * 0.5)); i++) {
    const paymentDate = new Date();
    paymentDate.setMonth(paymentDate.getMonth() - i);
    
    history.push({
      id: `payment_${connection.id}_${i}`,
      customerId: connection.id,
      amount: Math.round(projectValue * (0.8 + Math.random() * 0.4)), // ±20%の変動
      paymentDate: paymentDate.toISOString(),
      dueDate: paymentDate.toISOString(),
      status: Math.random() > 0.1 ? 'paid' : 'pending', // 90%は支払い済み
      invoiceNumber: `INV-${connection.id}-${i + 1}`
    });
  }
  
  return history.reverse(); // 古い順にソート
}