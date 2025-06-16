// テストデータ簡単削除API
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { action, documentId } = await request.json();
    
    if (action === 'cleanup_google_docs_test_data') {
      // Google Docs関連テストデータのみ削除
      const results = await Promise.all([
        // Google Docsソース削除
        prisma.google_docs_sources.deleteMany({
          where: {
            OR: [
              { document_id: { startsWith: 'test-' } },
              { document_id: { startsWith: 'comprehensive-test-' } },
              { title: { contains: 'テスト' } },
              { title: { contains: 'test' } }
            ]
          }
        }),
        
        // AI分析結果削除
        prisma.ai_content_analysis.deleteMany({
          where: {
            source_document_id: { startsWith: 'test-' }
          }
        }),
        
        // レコメンデーション削除
        prisma.content_recommendations.deleteMany({
          where: {
            analysis_id: {
              in: await prisma.ai_content_analysis.findMany({
                where: { source_document_id: { startsWith: 'test-' } },
                select: { id: true }
              }).then(items => items.map(item => item.id))
            }
          }
        }),
        
        // ナレッジアイテム削除（自動生成のみ）
        prisma.knowledge_items.deleteMany({
          where: {
            AND: [
              { auto_generated: true },
              {
                OR: [
                  { title: { contains: 'テスト' } },
                  { source_document_id: { startsWith: 'test-' } }
                ]
              }
            ]
          }
        })
      ]);
      
      return NextResponse.json({
        success: true,
        message: 'Google Docs関連テストデータを削除しました',
        deletedCounts: {
          googleDocsSources: results[0].count,
          aiAnalyses: results[1].count,
          recommendations: results[2].count,
          knowledgeItems: results[3].count
        }
      });
    }
    
    if (action === 'cleanup_specific_document' && documentId) {
      // 特定ドキュメントのデータ削除
      const results = await Promise.all([
        prisma.google_docs_sources.deleteMany({
          where: { document_id: documentId }
        }),
        
        prisma.ai_content_analysis.deleteMany({
          where: { source_document_id: documentId }
        }),
        
        prisma.knowledge_items.deleteMany({
          where: { source_document_id: documentId }
        })
      ]);
      
      return NextResponse.json({
        success: true,
        message: `ドキュメント ${documentId} のデータを削除しました`,
        deletedCounts: {
          googleDocsSources: results[0].count,
          aiAnalyses: results[1].count,
          knowledgeItems: results[2].count
        }
      });
    }
    
    return NextResponse.json({
      success: false,
      error: '不正なアクションです'
    }, { status: 400 });
    
  } catch (error) {
    console.error('❌ テストデータ削除エラー:', error);
    
    return NextResponse.json({
      success: false,
      error: 'テストデータ削除に失敗しました',
      details: (error as Error).message
    }, { status: 500 });
  }
}

// 削除候補データの確認
export async function GET() {
  try {
    const testDataCounts = await Promise.all([
      prisma.google_docs_sources.count({
        where: {
          OR: [
            { document_id: { startsWith: 'test-' } },
            { title: { contains: 'テスト' } }
          ]
        }
      }),
      
      prisma.ai_content_analysis.count({
        where: { source_document_id: { startsWith: 'test-' } }
      }),
      
      prisma.knowledge_items.count({
        where: {
          AND: [
            { auto_generated: true },
            { title: { contains: 'テスト' } }
          ]
        }
      })
    ]);
    
    return NextResponse.json({
      success: true,
      testDataCounts: {
        googleDocsSources: testDataCounts[0],
        aiAnalyses: testDataCounts[1],
        knowledgeItems: testDataCounts[2]
      },
      message: '削除候補のテストデータ件数'
    });
    
  } catch (error) {
    console.error('❌ テストデータ確認エラー:', error);
    
    return NextResponse.json({
      success: false,
      error: 'テストデータ確認に失敗しました'
    }, { status: 500 });
  }
}