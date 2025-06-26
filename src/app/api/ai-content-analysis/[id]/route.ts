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
        agenda: body.agenda,
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

// AI分析データ削除（関連データ含む）
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 削除対象のAI分析データを取得
    const analysis = await prisma.ai_content_analysis.findUnique({
      where: { id },
      select: { source_document_id: true }
    });
    
    if (!analysis) {
      return NextResponse.json({ error: 'AI分析データが見つかりません' }, { status: 404 });
    }

    console.log(`🗑️ AI分析データ削除開始: ${id} (source: ${analysis.source_document_id})`);

    // トランザクションで関連データを一括削除
    await prisma.$transaction(async (tx) => {
      // 1. レコメンデーション削除
      const recommendationsResult = await tx.content_recommendations.deleteMany({
        where: { analysis_id: id }
      });
      console.log(`🗑️ レコメンデーション削除: ${recommendationsResult.count}件`);
      
      // 2. 処理ログ削除
      const logsResult = await tx.content_processing_logs.deleteMany({
        where: { source_document_id: analysis.source_document_id }
      });
      console.log(`🗑️ 処理ログ削除: ${logsResult.count}件`);
      
      // 3. 自動生成ナレッジアイテム削除
      const knowledgeResult = await tx.knowledge_items.deleteMany({
        where: {
          AND: [
            { source_document_id: analysis.source_document_id },
            { auto_generated: true }
          ]
        }
      });
      console.log(`🗑️ 自動生成ナレッジ削除: ${knowledgeResult.count}件`);
      
      // 4. AI分析データ本体を削除
      await tx.ai_content_analysis.delete({
        where: { id }
      });
      console.log(`✅ AI分析データ削除完了: ${id}`);
    });

    return NextResponse.json({ 
      success: true,
      message: 'AI分析データと関連データを削除しました'
    });
  } catch (error) {
    console.error('❌ AI content analysis deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete AI content analysis and related data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}