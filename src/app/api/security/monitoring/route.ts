import { NextRequest, NextResponse } from 'next/server';
import { IntegratedSecurityManager } from '@/services/IntegratedSecurityManager';

const securityManager = IntegratedSecurityManager.getInstance();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        const status = await securityManager.getSecurityStatus();
        return NextResponse.json({
          success: true,
          data: status
        });

      case 'metrics':
        const metrics = await securityManager.getSecurityMetrics();
        return NextResponse.json({
          success: true,
          data: metrics
        });

      case 'events':
        const hoursParam = searchParams.get('hours');
        const hours = hoursParam ? parseInt(hoursParam) : 24;
        const eventStats = await securityManager.getSecurityEventStats(hours);
        return NextResponse.json({
          success: true,
          data: eventStats
        });

      case 'report':
        const daysParam = searchParams.get('days');
        const days = daysParam ? parseInt(daysParam) : 7;
        const report = await securityManager.getSecurityReport(days);
        return NextResponse.json({
          success: true,
          data: report
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Security monitoring API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'detect_activity':
        const { sessionId, activityAction, metadata } = data;
        const alert = await securityManager.detectSuspiciousActivity(
          sessionId,
          activityAction,
          metadata || {}
        );
        
        return NextResponse.json({
          success: true,
          data: { alert }
        });

      case 'log_event':
        const { event } = data;
        await securityManager.logSecurityEvent(event);
        
        return NextResponse.json({
          success: true,
          message: 'Security event logged successfully'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Security monitoring API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}