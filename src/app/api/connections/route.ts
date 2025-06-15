import { NextResponse } from 'next/server';
import { prismaDataService } from '@/lib/database/prisma-service';

export async function GET() {
  try {
    const connections = await prismaDataService.getConnections();
    return NextResponse.json(connections);
  } catch (error) {
    console.error('Failed to fetch connections:', error);
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const connection = await prismaDataService.addConnection(body);
    return NextResponse.json(connection);
  } catch (error) {
    console.error('Failed to create connection:', error);
    return NextResponse.json({ error: 'Failed to create connection' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    const connection = await prismaDataService.updateConnection(id, updates);
    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }
    return NextResponse.json(connection);
  } catch (error) {
    console.error('Failed to update connection:', error);
    return NextResponse.json({ error: 'Failed to update connection' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    const success = await prismaDataService.deleteConnection(id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Failed to delete connection:', error);
    return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 });
  }
}