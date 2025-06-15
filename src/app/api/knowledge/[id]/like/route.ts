import { NextResponse } from 'next/server';
import { prismaDataService } from '@/lib/database/prisma-service';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // いいね数を増加
    const updated = await prismaDataService.updateKnowledge(id, {
      likes: await getIncrementedLikes(id)
    });

    if (!updated) {
      return NextResponse.json({ error: 'Knowledge item not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to like knowledge item:', error);
    return NextResponse.json({ error: 'Failed to like knowledge item' }, { status: 500 });
  }
}

async function getIncrementedLikes(id: string): Promise<number> {
  try {
    const knowledge = await prismaDataService.getKnowledge();
    const item = knowledge.find(k => k.id === id);
    return (item?.likes || 0) + 1;
  } catch (error) {
    console.error('Failed to get current likes:', error);
    return 1;
  }
}