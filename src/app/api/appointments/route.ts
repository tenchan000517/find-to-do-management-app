import { NextResponse } from 'next/server';
import { prismaDataService } from '@/lib/database/prisma-service';

export async function GET() {
  try {
    const appointments = await prismaDataService.getAppointments();
    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Failed to fetch appointments:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const appointment = await prismaDataService.addAppointment(body);
    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Failed to create appointment:', error);
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    const appointment = await prismaDataService.updateAppointment(id, updates);
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }
    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Failed to update appointment:', error);
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    const success = await prismaDataService.deleteAppointment(id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Failed to delete appointment:', error);
    return NextResponse.json({ error: 'Failed to delete appointment' }, { status: 500 });
  }
}