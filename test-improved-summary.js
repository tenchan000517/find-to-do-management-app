// 改良された要約生成ロジックのテスト
const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// DATABASE_URLを設定
process.env.DATABASE_URL = "postgres://neondb_owner:npg_VKJPW8pIfQq0@ep-calm-butterfly-a55pupnn-pooler.us-east-2.aws.neon.tech/neondb?connect_timeout=15&sslmode=require";
process.env.GEMINI_API_KEY = "AIzaSyB2fqjY3f78rr4rmB0oqTc5FMn8lx-79mY";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// 基本要約生成（データが少ない場合）
async function generateBasicSummary(sourceDocumentId, title) {
  const prompt = `
以下のGoogle Docsドキュメントについて基本的な要約を生成してください。

**タイトル:** ${title}
**ドキュメントID:** ${sourceDocumentId}
**状況:** 具体的なタスクやイベントは検出されませんでしたが、何らかの内容が記録されている可能性があります。

**回答形式 (JSON):**
{
  "summary": "ドキュメントに記録されている可能性のある内容について簡潔に説明（200文字程度）"
}

**重要:**
- タイトルに基づいて内容を推測してください
- 「このドキュメントには${title}に関する会議記録、連絡先情報、または議論が含まれている可能性があります」
- 「詳細な内容を確認するには、元のGoogle Docsドキュメントを参照してください」
- といった内容で要約してください
`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.summary || `この「${title}」ドキュメントには会議記録または連絡先情報が含まれている可能性があります。詳細は元のGoogle Docsドキュメントを参照してください。`;
    }
    
    return `この「${title}」ドキュメントには会議記録または連絡先情報が含まれている可能性があります。詳細は元のGoogle Docsドキュメントを参照してください。`;
  } catch (error) {
    console.warn(`基本要約生成エラー:`, error.message);
    return `この「${title}」ドキュメントには会議記録または連絡先情報が含まれている可能性があります。詳細は元のGoogle Docsドキュメントを参照してください。`;
  }
}

async function testImprovedSummary() {
  try {
    console.log('🧪 改良された要約生成ロジックテスト開始');
    
    // 要約が空または「要約未生成」のレコードを1つ取得
    const emptyAnalysis = await prisma.ai_content_analysis.findFirst({
      where: {
        OR: [
          { summary: { equals: '' } },
          { summary: { equals: '要約未生成' } },
          { summary: { equals: '要約を生成できませんでした' } }
        ]
      }
    });

    if (!emptyAnalysis) {
      console.log('❌ テスト対象なし（すべて要約済み）');
      return;
    }

    console.log(`📄 テスト対象: ${emptyAnalysis.id}`);
    console.log(`📝 現在のタイトル: ${emptyAnalysis.title}`);
    console.log(`🔍 ソース: ${emptyAnalysis.source_document_id}`);

    // エンティティ確認
    const tasks = JSON.parse(emptyAnalysis.extracted_tasks || '[]');
    const events = JSON.parse(emptyAnalysis.extracted_events || '[]');
    const projects = JSON.parse(emptyAnalysis.extracted_projects || '[]');
    const contacts = JSON.parse(emptyAnalysis.extracted_contacts || '[]');
    const totalEntities = tasks.length + events.length + projects.length + contacts.length;

    console.log(`🔢 エンティティ数: ${totalEntities}件 (タスク:${tasks.length}, イベント:${events.length}, プロジェクト:${projects.length}, 連絡先:${contacts.length})`);

    if (totalEntities === 0) {
      console.log('🔄 エンティティ未検出 - 基本要約生成を実行');
      
      const basicSummary = await generateBasicSummary(emptyAnalysis.source_document_id, emptyAnalysis.title);
      console.log(`📋 生成された基本要約: ${basicSummary}`);
      
      // データベースを更新
      await prisma.ai_content_analysis.update({
        where: { id: emptyAnalysis.id },
        data: { summary: basicSummary }
      });
      
      console.log('✅ 基本要約をデータベースに保存しました');
    } else {
      console.log('📊 エンティティが存在するため、従来の要約生成ロジックを使用');
    }

    console.log('🎉 テスト完了');

  } catch (error) {
    console.error('❌ テストエラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// テスト実行
testImprovedSummary();