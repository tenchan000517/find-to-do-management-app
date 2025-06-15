import { NextRequest, NextResponse } from 'next/server';
import { prismaDataService } from '@/lib/database/prisma-service';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action, type } = await request.json();

    if (!type || !['project', 'user'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Must be project or user' }, { status: 400 });
    }

    switch (action) {
      case 'mark_read':
        if (type === 'project') {
          await prismaDataService.updateProjectAlert(id, { isRead: true });
        } else {
          await prismaDataService.updateUserAlert(id, { isRead: true });
        }
        break;
        
      case 'resolve':
        if (type === 'project') {
          await prismaDataService.updateProjectAlert(id, { 
            isResolved: true, 
            resolvedAt: new Date().toISOString() 
          });
        } else {
          await prismaDataService.updateUserAlert(id, { isRead: true });
        }
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update alert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}