import { NextRequest, NextResponse } from 'next/server';
import { SuccessProbabilityEngine } from '../../../../lib/services/success-probability-engine';

/**
 * 成約確率計算API
 * GET /api/sales/probability?appointmentId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const appointmentId = searchParams.get('appointmentId');

    if (!appointmentId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'MISSING_APPOINTMENT_ID',
          message: 'appointmentId parameter is required'
        },
        { status: 400 }
      );
    }

    console.log('🎯 Calculating success probability for appointment:', appointmentId);

    const successEngine = new SuccessProbabilityEngine();
    const prediction = await successEngine.calculateSuccessProbability(appointmentId);

    return NextResponse.json({
      success: true,
      data: prediction,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Success probability calculation failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'CALCULATION_ERROR',
        message: 'Failed to calculate success probability',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * 成約確率更新API
 * POST /api/sales/probability
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointmentId, manualProbability, factors, notes } = body;

    if (!appointmentId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'MISSING_APPOINTMENT_ID',
          message: 'appointmentId is required'
        },
        { status: 400 }
      );
    }

    console.log('📊 Updating success probability for appointment:', appointmentId);

    const successEngine = new SuccessProbabilityEngine();
    
    // 手動確率が指定されている場合は記録
    if (manualProbability !== undefined) {
      // 手動確率の記録ロジック（実装省略）
      console.log('Manual probability set:', manualProbability);
    }

    // 再計算実行
    const updatedPrediction = await successEngine.calculateSuccessProbability(appointmentId);

    return NextResponse.json({
      success: true,
      data: updatedPrediction,
      message: 'Success probability updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Success probability update failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'UPDATE_ERROR',
        message: 'Failed to update success probability',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}