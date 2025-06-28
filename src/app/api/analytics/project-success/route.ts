import { NextRequest, NextResponse } from 'next/server';
import { ProjectSuccessPredictor } from '../../../../services/ProjectSuccessPredictor';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    const analysisType = url.searchParams.get('type');

    if (!projectId) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'projectId is required'
        },
        { status: 400 }
      );
    }

    const predictor = new ProjectSuccessPredictor();

    switch (analysisType) {
      case 'predict':
        const analysis = await predictor.predictProjectSuccess(projectId);
        return NextResponse.json({
          success: true,
          data: analysis,
          timestamp: new Date().toISOString()
        });

      case 'monitor':
        const monitoring = await predictor.monitorProjectHealth(projectId);
        return NextResponse.json({
          success: true,
          data: monitoring,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Invalid analysis type. Supported: predict, monitor'
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Project success analysis API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to perform project success analysis'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, proposedChanges } = body;

    if (!projectId || !proposedChanges || !Array.isArray(proposedChanges)) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'projectId and proposedChanges (array) are required'
        },
        { status: 400 }
      );
    }

    // proposedChanges のバリデーション
    for (const change of proposedChanges) {
      if (!change.factor || typeof change.targetValue !== 'number' || 
          typeof change.implementationCost !== 'number' || 
          typeof change.timeRequired !== 'number') {
        return NextResponse.json(
          {
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Each proposed change must have factor (string), targetValue (number), implementationCost (number), and timeRequired (number)'
          },
          { status: 400 }
        );
      }
    }

    const predictor = new ProjectSuccessPredictor();
    const simulation = await predictor.simulateImprovements(projectId, proposedChanges);

    return NextResponse.json({
      success: true,
      data: simulation,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Project improvement simulation API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to simulate project improvements'
      },
      { status: 500 }
    );
  }
}