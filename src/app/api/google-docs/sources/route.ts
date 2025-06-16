import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const sources = await prisma.google_docs_sources.findMany({
      select: {
        document_id: true,
        document_url: true,
        title: true
      }
    });

    return NextResponse.json(sources);
  } catch (error) {
    console.error('Google Docs sources fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Google Docs sources' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}