import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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
    processingStatus?: string;
    relationshipStatus?: string;
    phaseStatus?: string;
    sourceType?: string;
  } | null;
  calendar_events?: {
    id: string;
    date: string;
    time: string;
    location: string | null;
    description: string | null;
    participants: string[];
    createdAt: Date;
  }[];
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type: kanbanType } = await params;
    
    // Get all appointments with details
    const appointments = await prisma.appointments.findMany({
      include: {
        details: true,
        calendar_events: {
          orderBy: { createdAt: 'desc' },
          take: 1, // 最新のイベントのみ取得
          select: {
            id: true,
            date: true,
            time: true,
            location: true,
            description: true,
            participants: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group appointments by kanban type
    let groupedData;
    
    switch (kanbanType) {
      case 'processing':
        groupedData = groupAppointmentsByProcessing(appointments);
        break;
      case 'relationship':
        groupedData = groupAppointmentsByRelationship(appointments);
        break;
      case 'phase':
        groupedData = groupAppointmentsByPhase(appointments);
        break;
      case 'source':
        groupedData = groupAppointmentsBySource(appointments);
        break;
      default:
        return NextResponse.json({ error: 'Invalid kanban type' }, { status: 400 });
    }

    return NextResponse.json(groupedData);
  } catch (error) {
    console.error('Failed to fetch kanban data:', error);
    return NextResponse.json({ error: 'Failed to fetch kanban data' }, { status: 500 });
  }
}

function groupAppointmentsByProcessing(appointments: AppointmentWithDetails[]) {
  const groups: Record<string, AppointmentWithDetails[]> = {
    PENDING: [],
    IN_PROGRESS: [],
    COMPLETED: [],
    FOLLOW_UP: [],
    CLOSED: []
  };

  appointments.forEach(appointment => {
    const status = appointment.details?.processingStatus || 'PENDING';
    if (groups[status]) {
      groups[status].push(appointment);
    }
  });

  // PENDINGカラムは混合ソート：カレンダーイベント日付優先、次に作成日
  if (groups.PENDING) {
    groups.PENDING.sort((a, b) => {
      // カレンダーイベントがあるものを優先
      const aHasEvent = a.calendar_events && a.calendar_events.length > 0;
      const bHasEvent = b.calendar_events && b.calendar_events.length > 0;
      
      if (aHasEvent && !bHasEvent) return -1;
      if (!aHasEvent && bHasEvent) return 1;
      
      // 両方にカレンダーイベントがある場合、イベント日付でソート
      if (aHasEvent && bHasEvent && a.calendar_events && b.calendar_events) {
        const aEventDate = new Date(a.calendar_events[0].date + ' ' + a.calendar_events[0].time);
        const bEventDate = new Date(b.calendar_events[0].date + ' ' + b.calendar_events[0].time);
        return aEventDate.getTime() - bEventDate.getTime(); // 昇順（近い日付が上）
      }
      
      // 両方にカレンダーイベントがない場合、作成日でソート（新しいものが上）
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  return groups;
}

function groupAppointmentsByRelationship(appointments: AppointmentWithDetails[]) {
  const groups: Record<string, AppointmentWithDetails[]> = {
    FIRST_CONTACT: [],
    RAPPORT_BUILDING: [],
    TRUST_ESTABLISHED: [],
    STRATEGIC_PARTNER: [],
    LONG_TERM_CLIENT: []
  };

  appointments.forEach(appointment => {
    const status = appointment.details?.relationshipStatus || 'FIRST_CONTACT';
    if (groups[status]) {
      groups[status].push(appointment);
    }
  });

  return groups;
}

function groupAppointmentsByPhase(appointments: AppointmentWithDetails[]) {
  const groups: Record<string, AppointmentWithDetails[]> = {
    LEAD: [],
    PROSPECT: [],
    PROPOSAL: [],
    NEGOTIATION: [],
    CLOSING: [],
    POST_SALE: []
  };

  appointments.forEach(appointment => {
    const phase = appointment.details?.phaseStatus || 'LEAD';
    if (groups[phase]) {
      groups[phase].push(appointment);
    }
  });

  return groups;
}

function groupAppointmentsBySource(appointments: AppointmentWithDetails[]) {
  const groups: Record<string, AppointmentWithDetails[]> = {
    REFERRAL: [],
    COLD_OUTREACH: [],
    NETWORKING_EVENT: [],
    INBOUND_INQUIRY: [],
    SOCIAL_MEDIA: [],
    EXISTING_CLIENT: [],
    PARTNER_REFERRAL: []
  };

  appointments.forEach(appointment => {
    const source = appointment.details?.sourceType || 'REFERRAL';
    if (groups[source]) {
      groups[source].push(appointment);
    }
  });

  return groups;
}