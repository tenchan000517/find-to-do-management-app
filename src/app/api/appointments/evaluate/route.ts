import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AppointmentEvaluator } from '@/lib/ai/appointment-evaluator';

const prisma = new PrismaClient();

type AppointmentWithDetails = {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  status: string;
  lastContact: string | null;
  nextAction: string;
  notes: string;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
  details: {
    budgetInfo?: string;
    timeline?: string;
    decisionMakers?: string[];
    painPoints?: string[];
    competitors?: string[];
    contractValue?: number | null;
    proposalStatus?: string;
  } | null;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { appointmentIds } = body;

    if (!appointmentIds || !Array.isArray(appointmentIds)) {
      return NextResponse.json({ error: 'appointmentIds array is required' }, { status: 400 });
    }

    // Get appointments with details
    const appointments = await prisma.appointments.findMany({
      where: {
        id: { in: appointmentIds }
      },
      include: {
        details: true
      }
    });

    if (appointments.length === 0) {
      return NextResponse.json({ error: 'No appointments found' }, { status: 404 });
    }

    // Evaluate appointments using AI
    const evaluator = new AppointmentEvaluator();
    const evaluations = await evaluator.batchEvaluateAppointments(
      appointments.map((app: AppointmentWithDetails) => ({
        id: app.id,
        companyName: app.companyName,
        contactName: app.contactName,
        notes: app.notes,
        priority: app.priority,
        details: app.details ? {
          budgetInfo: app.details.budgetInfo,
          timeline: app.details.timeline,
          decisionMakers: app.details.decisionMakers,
          painPoints: app.details.painPoints,
          competitors: app.details.competitors,
          contractValue: app.details.contractValue,
          proposalStatus: app.details.proposalStatus
        } : undefined
      }))
    );

    // Update appointment details with evaluations using transaction
    const updateOperations = appointments
      .map((appointment: AppointmentWithDetails) => {
        const evaluation = evaluations.get(appointment.id);
        if (!evaluation) return null;

        return prisma.appointment_details.upsert({
          where: { appointmentId: appointment.id },
          create: {
            appointmentId: appointment.id,
            importance: evaluation.importance,
            businessValue: evaluation.businessValue,
            closingProbability: evaluation.closingProbability,
            followUpActions: evaluation.nextActions,
            internalNotes: evaluation.reasoning
          },
          update: {
            importance: evaluation.importance,
            businessValue: evaluation.businessValue,
            closingProbability: evaluation.closingProbability,
            followUpActions: evaluation.nextActions,
            internalNotes: evaluation.reasoning
          }
        });
      })
      .filter((op): op is NonNullable<typeof op> => op !== null);

    // Execute all updates in a single transaction for better performance
    const results = await prisma.$transaction(updateOperations);

    return NextResponse.json({
      success: true,
      evaluatedCount: results.length,
      evaluations: Object.fromEntries(evaluations)
    });
  } catch (error) {
    console.error('Failed to evaluate appointments:', error);
    return NextResponse.json({ error: 'Failed to evaluate appointments' }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get all appointments that need evaluation (no details or old evaluations)
    const appointments = await prisma.appointments.findMany({
      include: {
        details: true
      },
      where: {
        OR: [
          { details: null },
          { 
            details: {
              importance: 0
            }
          }
        ]
      }
    });

    const appointmentIds = appointments.map((app: { id: string }) => app.id);

    return NextResponse.json({
      needsEvaluation: appointmentIds.length,
      appointmentIds
    });
  } catch (error) {
    console.error('Failed to get evaluation status:', error);
    return NextResponse.json({ error: 'Failed to get evaluation status' }, { status: 500 });
  }
}