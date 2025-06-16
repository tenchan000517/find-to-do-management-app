import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const analyses = await prisma.ai_content_analysis.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(analyses);
  } catch (error) {
    console.error('AI content analysis fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI content analysis' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}