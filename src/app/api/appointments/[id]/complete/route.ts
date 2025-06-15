import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appointmentId } = await params;
    const body = await request.json();
    const { 
      outcome, 
      followUpActions, 
      createConnection = false,
      connectionData,
      nextAppointment
    } = body;

    // Start transaction for appointment completion
    const result = await prisma.$transaction(async (tx) => {
      // Update appointment status
      const appointment = await tx.appointments.update({
        where: { id: appointmentId },
        data: {
          status: 'SCHEDULED' as const
        }
      });

      // Update appointment details
      await tx.appointment_details.upsert({
        where: { appointmentId },
        create: {
          appointmentId,
          processingStatus: 'COMPLETED',
          followUpActions: followUpActions || [],
          internalNotes: outcome || ''
        },
        update: {
          processingStatus: 'COMPLETED',
          followUpActions: followUpActions || [],
          internalNotes: outcome || ''
        }
      });

      // Create connection if requested
      let connection = null;
      if (createConnection && connectionData) {
        connection = await tx.connections.create({
          data: {
            id: connectionData.id || `conn_${appointmentId}_${Date.now()}`,
            name: connectionData.name || appointment.contactName,
            company: connectionData.company || appointment.companyName,
            position: connectionData.position || '',
            date: new Date().toISOString().split('T')[0],
            location: connectionData.location || 'アポイントメント',
            description: connectionData.description || `Created from appointment: ${appointment.contactName}`,
            conversation: connectionData.conversation || appointment.notes,
            potential: connectionData.potential || '要フォローアップ',
            type: 'COMPANY' as const,
            updatedAt: new Date()
          }
        });
      }

      // Create follow-up appointment if specified
      let followUp = null;
      if (nextAppointment) {
        followUp = await tx.appointments.create({
          data: {
            id: `app_${appointmentId}_followup_${Date.now()}`,
            companyName: nextAppointment.companyName || appointment.companyName,
            contactName: nextAppointment.contactName || appointment.contactName,
            phone: nextAppointment.phone || appointment.phone,
            email: nextAppointment.email || appointment.email,
            nextAction: nextAppointment.nextAction,
            notes: nextAppointment.notes || `Follow-up from: ${appointmentId}`,
            priority: nextAppointment.priority || 'B'
          }
        });
      }

      return {
        appointment,
        connection,
        followUp
      };
    });

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Failed to complete appointment:', error);
    return NextResponse.json({ error: 'Failed to complete appointment' }, { status: 500 });
  }
}