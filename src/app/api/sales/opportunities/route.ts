import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');
    const stage = searchParams.get('stage');
    const priority = searchParams.get('priority');

    const where: any = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (stage) {
      where.stage = stage;
    }

    if (priority) {
      where.priority = priority;
    }

    const opportunities = await prisma.sales_opportunities.findMany({
      where,
      include: {
        customer: true,
        sales_activities: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(opportunities);
  } catch (error) {
    console.error('Sales opportunities API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      customerId,
      companyName,
      contactName,
      contactPosition,
      dealValue,
      priority,
      stage,
      expectedCloseDate,
      notes
    } = body;

    const opportunity = await prisma.sales_opportunities.create({
      data: {
        customerId,
        companyName,
        contactName,
        contactPosition,
        dealValue,
        priority,
        stage,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        notes
      },
      include: {
        customer: true
      }
    });

    return NextResponse.json(opportunity, { status: 201 });
  } catch (error) {
    console.error('Sales opportunity creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}