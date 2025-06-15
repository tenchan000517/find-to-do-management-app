import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appointmentId } = await params;
    
    const appointment = await prisma.appointments.findUnique({
      where: { id: appointmentId },
      include: {
        details: true
      }
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Failed to fetch appointment details:', error);
    return NextResponse.json({ error: 'Failed to fetch appointment details' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appointmentId } = await params;
    const body = await request.json();

    // Verify appointment exists
    const appointment = await prisma.appointments.findUnique({
      where: { id: appointmentId }
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Create or update appointment details
    const details = await prisma.appointment_details.upsert({
      where: { appointmentId },
      create: {
        appointmentId,
        ...body
      },
      update: body
    });

    return NextResponse.json(details);
  } catch (error) {
    console.error('Failed to create/update appointment details:', error);
    return NextResponse.json({ error: 'Failed to create/update appointment details' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appointmentId } = await params;
    const body = await request.json();

    const details = await prisma.appointment_details.update({
      where: { appointmentId },
      data: body
    });

    return NextResponse.json(details);
  } catch (error) {
    console.error('Failed to update appointment details:', error);
    return NextResponse.json({ error: 'Failed to update appointment details' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appointmentId } = await params;

    await prisma.appointment_details.delete({
      where: { appointmentId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete appointment details:', error);
    return NextResponse.json({ error: 'Failed to delete appointment details' }, { status: 500 });
  }
}