// Phase 2: Financial Risk Assessment API Endpoints
import { NextRequest, NextResponse } from 'next/server';
import CustomerLTVAnalyzer from '../../../services/CustomerLTVAnalyzer';

const ltvAnalyzer = new CustomerLTVAnalyzer();

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const result = await ltvAnalyzer.assessFinancialRisk(projectId);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Financial Risk Assessment API Error:', error);
    return NextResponse.json(
      { 
        error: '財務リスク評価の実行に失敗しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}