import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const customer = await prisma.customers.findUnique({
      where: { id },
      include: {
        sales_opportunities: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        contracts: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      customerId: customer.id,
      companyName: customer.companyName,
      industry: customer.industry,
      revenue: customer.revenue,
      employees: customer.employees,
      businessModel: customer.businessModel,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      salesHistory: customer.sales_opportunities,
      contractHistory: customer.contracts
    });
  } catch (error) {
    console.error('Customer API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const {
      companyName,
      industry,
      revenue,
      employees,
      businessModel
    } = body;

    const customer = await prisma.customers.update({
      where: { id },
      data: {
        companyName,
        industry,
        revenue,
        employees,
        businessModel,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Customer update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}