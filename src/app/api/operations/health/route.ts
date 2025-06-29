import { NextRequest, NextResponse } from 'next/server';
import { OperationalReadiness } from '@/services/OperationalReadiness';

const operationalReadiness = OperationalReadiness.getInstance();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        const status = await operationalReadiness.getOperationalStatus();
        return NextResponse.json({
          success: true,
          data: status
        });

      case 'health':
        const health = await operationalReadiness.monitorSystemHealth();
        return NextResponse.json({
          success: true,
          data: health
        });

      case 'maintenance':
        const maintenanceTasks = await operationalReadiness.getMaintenanceTasks();
        return NextResponse.json({
          success: true,
          data: maintenanceTasks
        });

      case 'failures':
        const limitParam = searchParams.get('limit');
        const limit = limitParam ? parseInt(limitParam) : 10;
        const failures = await operationalReadiness.getSystemFailures(limit);
        return NextResponse.json({
          success: true,
          data: failures
        });

      case 'procedures':
        const procedures = await operationalReadiness.getOperationalProcedures();
        return NextResponse.json({
          success: true,
          data: procedures
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Operations health API error:', error);
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
      case 'diagnose':
        const { symptoms } = data;
        const diagnosis = await operationalReadiness.diagnoseIssue(symptoms);
        return NextResponse.json({
          success: true,
          data: diagnosis
        });

      case 'suggest_solution':
        const { issue } = data;
        const solutions = await operationalReadiness.suggestSolution(issue);
        return NextResponse.json({
          success: true,
          data: solutions
        });

      case 'generate_runbook':
        const { issueData } = data;
        const runbook = await operationalReadiness.generateRunbook(issueData);
        return NextResponse.json({
          success: true,
          data: runbook
        });

      case 'trigger_maintenance':
        await operationalReadiness.performPreventiveMaintenance();
        return NextResponse.json({
          success: true,
          message: 'Preventive maintenance triggered successfully'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Operations health API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}