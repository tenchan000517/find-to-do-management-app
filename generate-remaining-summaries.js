// 残りの要約生成（改良版ロジック適用）
const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// DATABASE_URLを設定
process.env.DATABASE_URL = "postgres://neondb_owner:npg_VKJPW8pIfQq0@ep-calm-butterfly-a55pupnn-pooler.us-east-2.aws.neon.tech/neondb?connect_timeout=15&sslmode=require";
process.env.GEMINI_API_KEY = "AIzaSyB2fqjY3f78rr4rmB0oqTc5FMn8lx-79mY";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// 基本要約生成（エンティティが空の場合）
async function generateBasicSummary(sourceDocumentId, title) {
  const prompt = `
以下のGoogle Docsドキュメントについて適切な要約を生成してください。

**タイトル:** ${title || 'タイトル不明'}
**ドキュメントID:** ${sourceDocumentId}
**状況:** 具体的なタスクやイベントは検出されませんでしたが、タイトルから内容を推測して要約してください。

**回答形式 (JSON):**
{
  "summary": "タイトルに基づく内容推測と要約（300文字程度）"
}

**重要:**
- タイトルから推測される内容について記述してください
- 会議、議論、連絡先情報、計画等の可能性を含めてください
- 「詳細は元のGoogle Docsドキュメントを参照」を含めてください
`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.summary || `この「${title || 'ドキュメント'}」には関連する情報が記録されている可能性があります。詳細は元のGoogle Docsドキュメントを参照してください。`;
    }
    
    return `この「${title || 'ドキュメント'}」には関連する情報が記録されている可能性があります。詳細は元のGoogle Docsドキュメントを参照してください。`;
  } catch (error) {
    console.warn(`基本要約生成エラー:`, error.message);
    return `この「${title || 'ドキュメント'}」には関連する情報が記録されている可能性があります。詳細は元のGoogle Docsドキュメントを参照してください。`;
  }
}

// エンティティベース要約生成
async function generateEntitySummary(content, title) {
  const prompt = `
以下の議事録・ドキュメントから、適切な要約を生成してください。

**タイトル:** ${title}
**抽出されたエンティティ情報:**
${content}

**回答形式 (JSON):**
{
  "summary": "主要な議論内容・決定事項・次のアクションを含む要約（400文字程度）"
}

**重要:**
- 要約は箇条書きではなく、文章形式で記述してください
- エンティティ情報に基づいて議論内容を推測してください
`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.summary || '要約を生成できませんでした';
    }
    
    return responseText.replace(/```json|```/g, '').trim() || '要約を生成できませんでした';
  } catch (error) {
    console.warn(`エンティティ要約生成エラー:`, error.message);
    return '要約を生成できませんでした';
  }
}

async function generateRemainingSummaries() {
  try {
    console.log('🔄 残り要約生成スクリプト開始（改良版ロジック）');
    
    // 要約が空の分析結果を取得
    const analysisWithoutSummary = await prisma.ai_content_analysis.findMany({
      where: {
        OR: [
          { summary: { equals: '' } },
          { summary: { equals: '要約未生成' } },
          { summary: { equals: '要約を生成できませんでした' } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 要約生成対象: ${analysisWithoutSummary.length}件`);

    if (analysisWithoutSummary.length === 0) {
      console.log('✅ すべてのデータに要約が存在します');
      return;
    }

    let processedCount = 0;
    let successCount = 0;
    let entityBasedCount = 0;
    let basicSummaryCount = 0;

    for (const analysis of analysisWithoutSummary) {
      processedCount++;
      console.log(`\n📄 処理中 ${processedCount}/${analysisWithoutSummary.length}: ${analysis.id}`);
      console.log(`   📝 タイトル: ${analysis.title || 'タイトル不明'}`);
      console.log(`   🔍 ソース: ${analysis.source_document_id}`);

      try {
        // エンティティデータを確認
        const tasks = JSON.parse(analysis.extracted_tasks || '[]');
        const events = JSON.parse(analysis.extracted_events || '[]');
        const projects = JSON.parse(analysis.extracted_projects || '[]');
        const contacts = JSON.parse(analysis.extracted_contacts || '[]');
        const totalEntities = tasks.length + events.length + projects.length + contacts.length;

        console.log(`   🔢 エンティティ数: ${totalEntities}件`);

        let summary;

        if (totalEntities === 0) {
          // エンティティが空の場合：基本要約生成
          console.log('   🔄 エンティティ未検出 - 基本要約生成');
          summary = await generateBasicSummary(analysis.source_document_id, analysis.title);
          basicSummaryCount++;
        } else {
          // エンティティがある場合：エンティティベース要約生成
          console.log('   🧠 エンティティベース要約生成');
          const entityContent = [
            ...tasks.map(t => `タスク: ${t.title || t.description || ''}`),
            ...events.map(e => `イベント: ${e.title || ''} ${e.date || ''}`),
            ...projects.map(p => `プロジェクト: ${p.title || p.name || ''}`),
            ...contacts.map(c => `連絡先: ${c.name || ''} ${c.company || ''}`)
          ].join('\n');
          
          summary = await generateEntitySummary(entityContent, analysis.title);
          entityBasedCount++;
        }

        console.log(`   📋 生成された要約: ${summary.substring(0, 100)}...`);

        // データベース更新
        await prisma.ai_content_analysis.update({
          where: { id: analysis.id },
          data: { summary: summary }
        });

        successCount++;
        console.log('   ✅ 要約生成・保存完了');
        console.log('   ⏳ APIスロットリング: 3秒待機中...');
        await new Promise(resolve => setTimeout(resolve, 3000));

      } catch (error) {
        console.error(`   ❌ エラー: ${error.message}`);
      }
    }

    console.log('\n🎉 残り要約生成完了');
    console.log(`📊 処理結果:`);
    console.log(`   - 対象件数: ${analysisWithoutSummary.length}`);
    console.log(`   - 成功: ${successCount}件`);
    console.log(`   - エンティティベース: ${entityBasedCount}件`);
    console.log(`   - 基本要約: ${basicSummaryCount}件`);

  } catch (error) {
    console.error('❌ スクリプト実行エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプト実行
generateRemainingSummaries();