import { NextResponse } from 'next/server';
import { prismaDataService } from '@/lib/database/prisma-service';

export async function GET() {
  try {
    const knowledge = await prismaDataService.getKnowledge();
    return NextResponse.json(knowledge);
  } catch (error) {
    console.error('Failed to fetch knowledge items:', error);
    return NextResponse.json({ error: 'Failed to fetch knowledge items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const knowledge = await prismaDataService.addKnowledge(body);
    return NextResponse.json(knowledge);
  } catch (error) {
    console.error('Failed to create knowledge item:', error);
    return NextResponse.json({ error: 'Failed to create knowledge item' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    const knowledge = await prismaDataService.updateKnowledge(id, updates);
    if (!knowledge) {
      return NextResponse.json({ error: 'Knowledge item not found' }, { status: 404 });
    }
    return NextResponse.json(knowledge);
  } catch (error) {
    console.error('Failed to update knowledge item:', error);
    return NextResponse.json({ error: 'Failed to update knowledge item' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    const success = await prismaDataService.deleteKnowledge(id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Failed to delete knowledge item:', error);
    return NextResponse.json({ error: 'Failed to delete knowledge item' }, { status: 500 });
  }
}