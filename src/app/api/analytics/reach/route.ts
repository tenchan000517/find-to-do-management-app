import { NextRequest, NextResponse } from 'next/server';
import { RealisticReachCalculator } from '../../../../services/RealisticReachCalculator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      eventType,
      targetDate,
      duration,
      location,
      targetAudience,
      contentQuality
    } = body;

    // バリデーション
    if (!eventType || !targetDate || !duration || !location || !targetAudience) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Required fields: eventType, targetDate, duration, location, targetAudience'
        },
        { status: 400 }
      );
    }

    if (contentQuality && (contentQuality < 1 || contentQuality > 10)) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'contentQuality must be between 1 and 10'
        },
        { status: 400 }
      );
    }

    const calculator = new RealisticReachCalculator();
    
    const reachAnalysis = await calculator.calculateComprehensiveEventReach({
      eventType,
      targetDate: new Date(targetDate),
      duration: Number(duration),
      location,
      targetAudience,
      contentQuality: Number(contentQuality) || 7
    });

    return NextResponse.json({
      success: true,
      data: reachAnalysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Reach analysis API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to calculate reach analysis'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const analysisType = url.searchParams.get('type');

    const calculator = new RealisticReachCalculator();

    switch (analysisType) {
      case 'community-growth':
        const growthAnalysis = await calculator.analyzeCommunityGrowth();
        return NextResponse.json({
          success: true,
          data: growthAnalysis,
          timestamp: new Date().toISOString()
        });

      case 'content-optimization':
        const contentType = url.searchParams.get('contentType') || 'general';
        const targetMetrics = JSON.parse(url.searchParams.get('targetMetrics') || '{}');
        
        const optimization = await calculator.optimizeContentStrategy(contentType, targetMetrics);
        return NextResponse.json({
          success: true,
          data: optimization,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Invalid analysis type. Supported: community-growth, content-optimization'
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to perform analytics'
      },
      { status: 500 }
    );
  }
}