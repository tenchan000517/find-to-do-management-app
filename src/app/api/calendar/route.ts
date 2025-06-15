import { NextResponse } from 'next/server';
import { prismaDataService } from '@/lib/database/prisma-service';

export async function GET() {
  try {
    const events = await prismaDataService.getCalendarEvents();
    return NextResponse.json(events);
  } catch (error) {
    console.error('Failed to fetch calendar events:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const event = await prismaDataService.addCalendarEvent(body);
    return NextResponse.json(event);
  } catch (error) {
    console.error('Failed to create calendar event:', error);
    return NextResponse.json({ error: 'Failed to create calendar event' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    const event = await prismaDataService.updateCalendarEvent(id, updates);
    if (!event) {
      return NextResponse.json({ error: 'Calendar event not found' }, { status: 404 });
    }
    return NextResponse.json(event);
  } catch (error) {
    console.error('Failed to update calendar event:', error);
    return NextResponse.json({ error: 'Failed to update calendar event' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    const success = await prismaDataService.deleteCalendarEvent(id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Failed to delete calendar event:', error);
    return NextResponse.json({ error: 'Failed to delete calendar event' }, { status: 500 });
  }
}