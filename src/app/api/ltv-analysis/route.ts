// Phase 2: LTV Analysis API Endpoints
import { NextRequest, NextResponse } from 'next/server';
import CustomerLTVAnalyzer from '../../../services/CustomerLTVAnalyzer';

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

    if (!connectionId) {
      return NextResponse.json(
        { error: 'connectionId is required' },
        { status: 400 }
      );
    }

    // 既存のLTV分析結果を取得（実装は後で追加）
    return NextResponse.json({
      success: true,
      data: null,
      message: 'LTV分析履歴の取得機能は実装中です'
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