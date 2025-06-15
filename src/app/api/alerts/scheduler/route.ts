import { NextRequest, NextResponse } from 'next/server';
import { alertScheduler } from '@/lib/jobs/alert-scheduler';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'start':
        alertScheduler.startScheduledJobs();
        return NextResponse.json({ success: true, message: 'Scheduler started' });
        
      case 'stop':
        alertScheduler.stopScheduledJobs();
        return NextResponse.json({ success: true, message: 'Scheduler stopped' });
        
      case 'run_manual':
        const results = await alertScheduler.runManualCheck();
        return NextResponse.json({ success: true, results });
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Scheduler action failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    return NextResponse.json({
      status: 'running',
      nextCheck: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    console.error('Failed to get scheduler status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}