import { NextRequest, NextResponse } from 'next/server';
import { SalesAutomationEngine } from '../../../../lib/services/sales-automation-engine';

/**
 * 営業自動化処理API
 * POST /api/sales/automation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    if (!action || !data) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'MISSING_PARAMETERS',
          message: 'action and data parameters are required'
        },
        { status: 400 }
      );
    }

    console.log('🔄 Processing sales automation:', action);

    const automationEngine = new SalesAutomationEngine();
    let result;

    switch (action) {
      case 'contract_completion':
        result = await automationEngine.processContractCompletion(data);
        break;

      case 'deal_progress':
        result = await automationEngine.trackDealProgress(data.appointmentId, data.progressData);
        break;

      case 'deal_loss':
        result = await automationEngine.processLostDeal(data.appointmentId, data.lossData);
        break;

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'INVALID_ACTION',
            message: `Unknown action: ${action}`
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `Sales automation '${action}' completed successfully`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Sales automation failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'AUTOMATION_ERROR',
        message: 'Sales automation processing failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}