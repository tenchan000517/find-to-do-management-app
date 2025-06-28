import { NextRequest, NextResponse } from 'next/server';
import { ConnectionAnalyzer } from '../../../../services/ConnectionAnalyzer';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const connectionId = url.searchParams.get('connectionId');
    const analysisType = url.searchParams.get('type');

    const analyzer = new ConnectionAnalyzer();

    switch (analysisType) {
      case 'analyze':
        if (!connectionId) {
          return NextResponse.json(
            {
              success: false,
              error: 'VALIDATION_ERROR',
              message: 'connectionId is required for analysis'
            },
            { status: 400 }
          );
        }

        const analysis = await analyzer.analyzeConnection(connectionId);
        return NextResponse.json({
          success: true,
          data: analysis,
          timestamp: new Date().toISOString()
        });

      case 'ranking':
        const ltvWeight = parseFloat(url.searchParams.get('ltvWeight') || '0.3');
        const relationshipWeight = parseFloat(url.searchParams.get('relationshipWeight') || '0.3');
        const opportunityWeight = parseFloat(url.searchParams.get('opportunityWeight') || '0.2');
        const riskWeight = parseFloat(url.searchParams.get('riskWeight') || '0.2');

        const ranking = await analyzer.rankConnectionsByPriority({
          ltvWeight,
          relationshipWeight,
          opportunityWeight,
          riskWeight
        });

        return NextResponse.json({
          success: true,
          data: ranking,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Invalid analysis type. Supported: analyze, ranking'
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Connection analytics API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to perform connection analysis'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionId, objectives } = body;

    if (!connectionId || !objectives || !Array.isArray(objectives)) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'connectionId and objectives (array) are required'
        },
        { status: 400 }
      );
    }

    const analyzer = new ConnectionAnalyzer();
    const strategy = await analyzer.generateRelationshipStrategy(connectionId, objectives);

    return NextResponse.json({
      success: true,
      data: strategy,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Relationship strategy API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to generate relationship strategy'
      },
      { status: 500 }
    );
  }
}