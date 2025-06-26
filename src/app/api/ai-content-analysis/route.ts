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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const analysis = await prisma.ai_content_analysis.create({
      data: {
        source_document_id: body.source_document_id,
        title: body.title || '',
        summary: body.summary || '',
        agenda: body.agenda || '',
        extracted_tasks: body.extracted_tasks || '[]',
        analysis_type: body.analysis_type || 'COMPREHENSIVE',
        confidence_score: body.confidence_score || 1.0,
        model_version: 'manual-entry',
        urgency_level: 'MEDIUM'
      }
    });

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('AI content analysis creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create AI content analysis' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}