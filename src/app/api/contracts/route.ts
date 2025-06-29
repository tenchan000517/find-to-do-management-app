import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');

    const where: any = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (status) {
      where.status = status;
    }

    const contracts = await prisma.contracts.findMany({
      where,
      include: {
        customer: true,
        sales_opportunity: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(contracts);
  } catch (error) {
    console.error('Contracts API error:', error);
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
      opportunityId,
      contractType,
      value,
      terms,
      startDate,
      endDate,
      status,
      notes
    } = body;

    const contract = await prisma.contracts.create({
      data: {
        customerId,
        opportunityId,
        contractType,
        value,
        terms,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'draft',
        notes
      },
      include: {
        customer: true,
        sales_opportunity: true
      }
    });

    // 契約作成時にバックオフィスタスクも自動生成
    const backOfficeTask = await prisma.tasks.create({
      data: {
        title: `契約処理: ${contract.customer?.companyName}`,
        description: `契約ID: ${contract.id} の処理を行う`,
        type: 'CONTRACT_PROCESSING',
        priority: 'HIGH',
        status: 'TODO',
        userId: 'system', // 実際には担当者IDを使用
        estimatedHours: 2,
        metadata: {
          contractId: contract.id,
          customerId: contract.customerId,
          automaticallyGenerated: true
        }
      }
    });

    return NextResponse.json({
      contract,
      backOfficeTask
    }, { status: 201 });
  } catch (error) {
    console.error('Contract creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}