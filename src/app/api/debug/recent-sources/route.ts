import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // recent_* のデータを詳細取得
    const recentSources = await prisma.google_docs_sources.findMany({
      where: {
        document_id: {
          contains: 'recent_'
        }
      },
      select: {
        document_id: true,
        title: true,
        sync_status: true,
        trigger_type: true,
        last_synced: true,
        createdAt: true,
        updatedAt: true,
        last_error: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 対応するAI分析データも取得
    const analysisData = await Promise.all(
      recentSources.map(async (source) => {
        const analysis = await prisma.ai_content_analysis.findFirst({
          where: {
            source_document_id: source.document_id
          },
          select: {
            id: true,
            createdAt: true,
            confidence_score: true,
            analysis_type: true
          }
        });
        
        return {
          source,
          analysis
        };
      })
    );

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      recentSourcesCount: recentSources.length,
      data: analysisData
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug info', details: (error as Error).message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}