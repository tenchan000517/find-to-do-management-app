import { NextResponse } from 'next/server';
import { prismaDataService } from '@/lib/database/prisma-service';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const appointment = await prismaDataService.getAppointmentById(params.id);
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }
    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Failed to fetch appointment:', error);
    return NextResponse.json({ error: 'Failed to fetch appointment' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const appointment = await prismaDataService.updateAppointment(params.id, body);
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }
    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Failed to update appointment:', error);
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const success = await prismaDataService.deleteAppointment(params.id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Failed to delete appointment:', error);
    return NextResponse.json({ error: 'Failed to delete appointment' }, { status: 500 });
  }
}