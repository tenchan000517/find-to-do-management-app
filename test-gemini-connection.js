const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function testGeminiConnection() {
  try {
    console.log('🔍 Gemini API接続テスト開始');
    
    // 環境変数の確認
    const apiKey = process.env.GEMINI_API_KEY;
    console.log(`📝 APIキー設定状況: ${apiKey ? `設定済み (${apiKey.substring(0, 10)}...)` : '未設定'}`);
    
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEYが設定されていません');
      return;
    }
    
    // Gemini AI初期化
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    console.log('🚀 API呼び出し中...');
    
    // 簡単なテスト用プロンプト
    const testPrompt = '「こんにちは」を英語で言ってください。1単語で答えてください。';
    
    const result = await model.generateContent(testPrompt);
    const response = result.response.text();
    
    console.log('✅ 接続成功！');
    console.log(`📤 送信: ${testPrompt}`);
    console.log(`📥 応答: ${response}`);
    
    // より複雑なテスト（JSON生成）
    console.log('\n🧪 JSON生成テスト...');
    const jsonPrompt = `
以下の文章を要約してください。

文章: 今日は天気が良いので公園に行きました。桜がとても綺麗でした。

回答形式 (JSON):
{
  "summary": "要約文（20文字以内）"
}
`;
    
    const jsonResult = await model.generateContent(jsonPrompt);
    const jsonResponse = jsonResult.response.text();
    
    console.log(`📤 送信: JSON生成テスト`);
    console.log(`📥 応答: ${jsonResponse}`);
    
    // JSON解析テスト
    try {
      const jsonMatch = jsonResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('✅ JSON解析成功:', parsed);
      } else {
        console.log('⚠️ JSON形式が見つかりません');
      }
    } catch (e) {
      console.log('⚠️ JSON解析エラー:', e.message);
    }
    
    console.log('\n🎉 全テスト完了 - Gemini API正常動作');
    
  } catch (error) {
    console.error('❌ 接続エラー:', error.message);
    
    if (error.message.includes('403')) {
      console.error('💡 対策: APIキーが無効か期限切れの可能性があります');
    } else if (error.message.includes('429')) {
      console.error('💡 対策: レート制限に達しています。しばらく待ってから再試行してください');
    } else if (error.message.includes('400')) {
      console.error('💡 対策: リクエスト形式に問題があります');
    } else {
      console.error('💡 対策: ネットワーク接続またはAPI設定を確認してください');
    }
  }
}

// テスト実行
testGeminiConnection();