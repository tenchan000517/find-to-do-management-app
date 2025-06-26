import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// AI分析データ更新
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const analysis = await prisma.ai_content_analysis.update({
      where: { id },
      data: {
        title: body.title,
        summary: body.summary,
        extracted_tasks: body.extracted_tasks,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('AI content analysis update error:', error);
    return NextResponse.json(
      { error: 'Failed to update AI content analysis' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// AI分析データ削除
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.ai_content_analysis.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('AI content analysis deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete AI content analysis' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}