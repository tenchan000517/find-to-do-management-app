import { NextRequest, NextResponse } from 'next/server';
import { AISalesAssistant } from '../../../../lib/services/ai-sales-assistant';

/**
 * AI営業アシスタントAPI
 * POST /api/sales/assistant
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, customerId, data } = body;

    if (!action || !customerId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'MISSING_PARAMETERS',
          message: 'action and customerId parameters are required'
        },
        { status: 400 }
      );
    }

    console.log('🤖 Processing AI sales assistant request:', action);

    const aiAssistant = new AISalesAssistant();
    let result;

    switch (action) {
      case 'customer_insights':
        result = await aiAssistant.generateCustomerInsights(customerId);
        break;

      case 'generate_proposal':
        if (!data?.projectRequirements) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'MISSING_PROJECT_REQUIREMENTS',
              message: 'projectRequirements is required for proposal generation'
            },
            { status: 400 }
          );
        }
        result = await aiAssistant.generateCustomizedProposal(customerId, data.projectRequirements);
        break;

      case 'negotiation_plan':
        if (!data?.proposalId || !data?.currentStage) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'MISSING_NEGOTIATION_DATA',
              message: 'proposalId and currentStage are required for negotiation planning'
            },
            { status: 400 }
          );
        }
        result = await aiAssistant.generateNegotiationPlan(customerId, data.proposalId, data.currentStage);
        break;

      case 'objection_response':
        if (!data?.objection) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'MISSING_OBJECTION',
              message: 'objection text is required'
            },
            { status: 400 }
          );
        }
        result = await aiAssistant.generateObjectionResponse(data.objection, customerId, data.context);
        break;

      case 'closing_strategy':
        if (!data?.dealStage || data?.successProbability === undefined) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'MISSING_CLOSING_DATA',
              message: 'dealStage and successProbability are required for closing strategy'
            },
            { status: 400 }
          );
        }
        result = await aiAssistant.generateClosingStrategy(customerId, data.dealStage, data.successProbability);
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
      message: `AI sales assistant '${action}' completed successfully`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ AI sales assistant failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'AI_ASSISTANT_ERROR',
        message: 'AI sales assistant processing failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * 顧客インサイト取得API
 * GET /api/sales/assistant?customerId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'MISSING_CUSTOMER_ID',
          message: 'customerId parameter is required'
        },
        { status: 400 }
      );
    }

    console.log('🔍 Generating customer insights for:', customerId);

    const aiAssistant = new AISalesAssistant();
    const insights = await aiAssistant.generateCustomerInsights(customerId);

    return NextResponse.json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Customer insights generation failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'INSIGHTS_ERROR',
        message: 'Failed to generate customer insights',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}