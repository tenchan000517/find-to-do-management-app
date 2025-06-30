import { NextRequest, NextResponse } from 'next/server';
import { SystemIntegrator } from '@/services/SystemIntegrator';

export async function GET(request: NextRequest) {
  try {
    const systemIntegrator = SystemIntegrator.getInstance();
    const systemStatus = await systemIntegrator.getSystemStatus();
    
    return NextResponse.json({
      success: true,
      data: systemStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('System integration API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get system integration status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    const systemIntegrator = SystemIntegrator.getInstance();
    
    switch (action) {
      case 'validate':
        const integrationStatus = await systemIntegrator.validateSystemIntegration();
        return NextResponse.json({
          success: true,
          data: { integrationStatus },
          message: 'System integration validation completed'
        });
        
      case 'optimize':
        const performanceMetrics = await systemIntegrator.optimizeSystemPerformance();
        return NextResponse.json({
          success: true,
          data: { performanceMetrics },
          message: 'System performance optimization completed'
        });
        
      case 'sync':
        const consistencyResult = await systemIntegrator.implementDataConsistency();
        return NextResponse.json({
          success: true,
          data: consistencyResult,
          message: 'Data consistency implementation completed'
        });
        
      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid action',
            validActions: ['validate', 'optimize', 'sync']
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('System integration action error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to execute system integration action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}