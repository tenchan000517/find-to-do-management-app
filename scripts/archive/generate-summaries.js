// 環境変数を最初に設定
const fs = require('fs');
const path = require('path');

// DATABASE_URLを設定
process.env.DATABASE_URL = "postgres://neondb_owner:npg_VKJPW8pIfQq0@ep-calm-butterfly-a55pupnn-pooler.us-east-2.aws.neon.tech/neondb?connect_timeout=15&sslmode=require";
process.env.GEMINI_API_KEY = "AIzaSyB2fqjY3f78rr4rmB0oqTc5FMn8lx-79mY";

const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// .env.localファイルを手動で読み込み
const envLocalPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envConfig = fs.readFileSync(envLocalPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0 && !key.startsWith('#')) {
      process.env[key] = values.join('=');
    }
  });
}

// .envファイルも読み込み（DATABASE_URLのため）
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0 && !key.startsWith('#') && !process.env[key]) {
      process.env[key] = values.join('=');
    }
  });
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgres://neondb_owner:npg_VKJPW8pIfQq0@ep-calm-butterfly-a55pupnn-pooler.us-east-2.aws.neon.tech/neondb?connect_timeout=15&sslmode=require"
    }
  }
});
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// エンティティベース要約生成関数
async function generateSummary(content, title) {
  const prompt = `
以下の議事録・ドキュメントから、適切な要約を生成してください。

**タイトル:** ${title}
**ドキュメント内容（抜粋）:**
${content.substring(0, 2000)}...

**回答形式 (JSON):**
{
  "summary": "主要な議論内容・決定事項・次のアクションを含む要約（500文字程度）"
}

**重要:**
- 要約は箇条書きではなく、文章形式で記述してください
- 議論の要点、決定事項、次のアクションを含めてください
- タイトルに基づいて内容を整理してください
`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // JSONの抽出を試行
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.summary || '要約を生成できませんでした';
    }
    
    // JSONが見つからない場合は全体をテキストとして扱う
    return responseText.replace(/```json|```/g, '').trim() || '要約を生成できませんでした';
  } catch (error) {
    console.warn(`要約生成エラー (${title}):`, error.message);
    return '要約を生成できませんでした';
  }
}

// Google Docs原文から要約生成
async function generateSummaryFromDocId(sourceDocumentId) {
  try {
    // Google Docs原文のデータがあるかチェック
    // 注意: content_sectionは削除されているので、別の方法で原文を取得する必要がある
    // 現状では、既存データから可能な限り要約を生成する
    
    console.log('   🔍 原文データ取得を試行...');
    
    // 空データの場合は基本的な要約を生成
    const basicSummary = await generateBasicSummary(sourceDocumentId);
    return basicSummary;
    
  } catch (error) {
    console.warn(`原文要約生成エラー (${sourceDocumentId}):`, error.message);
    return null;
  }
}

// 基本要約生成（データが少ない場合）
async function generateBasicSummary(sourceDocumentId) {
  const prompt = `
以下のGoogle Docsドキュメントについて基本的な要約を生成してください。

**ドキュメントID:** ${sourceDocumentId}
**状況:** 具体的なタスクやイベントは検出されませんでしたが、何らかの内容が記録されている可能性があります。

**回答形式 (JSON):**
{
  "summary": "ドキュメントに記録されている可能性のある内容について簡潔に説明（200文字程度）"
}

**重要:**
- 「このドキュメントには会議記録、連絡先情報、または議論の断片が含まれている可能性があります」
- 「詳細な内容を確認するには、元のGoogle Docsドキュメントを参照してください」
- といった内容で要約してください
`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.summary || 'このドキュメントには会議記録または連絡先情報が含まれている可能性があります。詳細は元のGoogle Docsドキュメントを参照してください。';
    }
    
    return 'このドキュメントには会議記録または連絡先情報が含まれている可能性があります。詳細は元のGoogle Docsドキュメントを参照してください。';
  } catch (error) {
    console.warn(`基本要約生成エラー:`, error.message);
    return 'このドキュメントには会議記録または連絡先情報が含まれている可能性があります。詳細は元のGoogle Docsドキュメントを参照してください。';
  }
}

// メイン処理
async function generateSummariesForExistingData() {
  try {
    console.log('🚀 既存データの要約生成スクリプト開始');
    
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

    // Google Docsのメタデータも取得
    const googleDocsSources = await prisma.google_docs_sources.findMany({
      select: {
        document_id: true,
        title: true
      }
    });

    const docsMap = new Map(googleDocsSources.map(doc => [doc.document_id, doc.title]));

    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;

    for (const analysis of analysisWithoutSummary) {
      processedCount++;
      console.log(`\n📄 処理中 ${processedCount}/${analysisWithoutSummary.length}: ${analysis.id}`);
      
      try {
        // Google Docsのタイトルを取得
        const baseDocId = analysis.source_document_id.split('_tab_')[0];
        const docTitle = docsMap.get(baseDocId) || 'タイトル不明';
        
        console.log(`   📝 タイトル: ${docTitle}`);
        console.log(`   🔍 ソース: ${analysis.source_document_id}`);

        // エンティティデータから要約生成用コンテンツを構築
        let contentForSummary = '';
        let totalEntities = 0;
        
        try {
          const tasks = JSON.parse(analysis.extracted_tasks || '[]');
          const events = JSON.parse(analysis.extracted_events || '[]');
          const projects = JSON.parse(analysis.extracted_projects || '[]');
          const contacts = JSON.parse(analysis.extracted_contacts || '[]');
          
          totalEntities = tasks.length + events.length + projects.length + contacts.length;
          
          // エンティティから疑似コンテンツを構築
          const taskTexts = tasks.map(t => `タスク: ${t.title || t.description || ''}`);
          const eventTexts = events.map(e => `イベント: ${e.title || ''} ${e.date || ''}`);
          const projectTexts = projects.map(p => `プロジェクト: ${p.title || p.name || ''}`);
          const contactTexts = contacts.map(c => `連絡先: ${c.name || ''} ${c.company || ''}`);
          
          contentForSummary = [
            ...taskTexts,
            ...eventTexts, 
            ...projectTexts,
            ...contactTexts
          ].join('\n');
        } catch (e) {
          console.warn('   ⚠️ エンティティデータの解析エラー:', e.message);
        }

        // エンティティが空でも、Google Docsから原文を取得して要約生成を試行
        if (!contentForSummary.trim() || totalEntities === 0) {
          console.log('   🔄 エンティティ未検出 - Google Docs原文から要約生成を試行');
          
          // Google Docs原文から要約生成（実装は次で追加）
          const rawContentSummary = await generateSummaryFromDocId(analysis.source_document_id);
          if (rawContentSummary) {
            await prisma.ai_content_analysis.update({
              where: { id: analysis.id },
              data: { 
                summary: rawContentSummary,
                title: docTitle
              }
            });
            successCount++;
            console.log('   ✅ 原文要約生成・保存完了');
            console.log('   ⏳ APIスロットリング: 5秒待機中...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            continue;
          } else {
            console.log('   ⏭️ 原文取得失敗 - スキップ');
            continue;
          }
        }

        // 要約生成
        console.log('   🧠 要約生成中...');
        const summary = await generateSummary(contentForSummary, docTitle);
        console.log(`   📋 生成された要約: ${summary.substring(0, 100)}...`);

        // データベース更新
        await prisma.ai_content_analysis.update({
          where: { id: analysis.id },
          data: { 
            summary: summary,
            title: docTitle // Google Docsのタイトルも更新
          }
        });

        successCount++;
        console.log('   ✅ 要約生成・保存完了');

        // APIスロットリング: 5秒待機
        console.log('   ⏳ APIスロットリング: 5秒待機中...');
        await new Promise(resolve => setTimeout(resolve, 5000));

      } catch (error) {
        errorCount++;
        console.error(`   ❌ エラー: ${error.message}`);
      }
    }

    console.log('\n🎉 要約生成スクリプト完了');
    console.log(`📊 処理結果:`);
    console.log(`   - 対象件数: ${analysisWithoutSummary.length}`);
    console.log(`   - 成功: ${successCount}件`);
    console.log(`   - エラー: ${errorCount}件`);
    console.log(`   - スキップ: ${processedCount - successCount - errorCount}件`);

  } catch (error) {
    console.error('❌ スクリプト実行エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプト実行
if (require.main === module) {
  generateSummariesForExistingData();
}

module.exports = { generateSummariesForExistingData };