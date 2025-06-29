import { NextRequest, NextResponse } from 'next/server';
import { OperationalReadiness } from '@/services/OperationalReadiness';

const operationalReadiness = OperationalReadiness.getInstance();

export async function GET(request: NextRequest) {
  try {
    const tasks = await operationalReadiness.getMaintenanceTasks();
    
    return NextResponse.json({
      success: true,
      data: {
        tasks,
        summary: {
          total: tasks.length,
          pending: tasks.filter(t => t.status === 'PENDING').length,
          running: tasks.filter(t => t.status === 'RUNNING').length,
          completed: tasks.filter(t => t.status === 'COMPLETED').length,
          failed: tasks.filter(t => t.status === 'FAILED').length
        }
      }
    });
  } catch (error) {
    console.error('Maintenance API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'trigger_all':
        await operationalReadiness.performPreventiveMaintenance();
        return NextResponse.json({
          success: true,
          message: 'All maintenance tasks triggered successfully'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Maintenance API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}