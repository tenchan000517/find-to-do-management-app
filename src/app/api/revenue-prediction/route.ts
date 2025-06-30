// Phase 2: Revenue Prediction API Endpoints
import { NextRequest, NextResponse } from 'next/server';
import CustomerLTVAnalyzer from '../../../services/CustomerLTVAnalyzer';

const ltvAnalyzer = new CustomerLTVAnalyzer();

export async function POST(request: NextRequest) {
  try {
    const { projectId, baseContract, projectDetails } = await request.json();

    if (!projectId || !baseContract) {
      return NextResponse.json(
        { error: 'projectId and baseContract are required' },
        { status: 400 }
      );
    }

    const result = await ltvAnalyzer.predictProjectRevenue(
      projectId,
      baseContract,
      projectDetails || {}
    );

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Revenue Prediction API Error:', error);
    return NextResponse.json(
      { 
        error: '収益予測の実行に失敗しました',
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}