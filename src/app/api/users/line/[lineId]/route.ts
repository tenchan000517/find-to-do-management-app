import { NextRequest, NextResponse } from 'next/server';
import { prismaDataService } from '@/lib/database/prisma-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lineId: string }> }
) {
  try {
    const { lineId } = await params;
    
    if (!lineId) {
      return NextResponse.json({ error: 'LINE ID is required' }, { status: 400 });
    }

    const user = await prismaDataService.getUserByLineId(lineId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to get user by LINE ID:', error);
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 });
  }
}