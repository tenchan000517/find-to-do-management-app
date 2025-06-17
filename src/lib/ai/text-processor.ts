export interface ExtractedData {
  type: 'personal_schedule' | 'schedule' | 'task' | 'project' | 'contact' | 'memo';
  title: string;
  description?: string;
  datetime?: string;
  attendees?: string[];
  location?: string;
  priority?: 'high' | 'medium' | 'low';
  assignee?: string;
  deadline?: string;
  confidence: number;
}

import { getAICallManager } from './call-manager';

// Gemini AIを使用した高精度抽出（AI Call Manager経由）
export async function extractDataFromTextWithAI(text: string): Promise<ExtractedData> {
  // Gemini APIキーが設定されていない場合は簡易抽出にフォールバック
  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY not found, using simple extraction');
    return extractDataFromTextSimple(text);
  }

  try {
    const aiCallManager = getAICallManager();
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const prompt = `
以下のLINEメッセージから、プロジェクト管理に必要な情報を抽出してください。

今日の日付: ${today.getFullYear()}-${(today.getMonth()+1).toString().padStart(2,'0')}-${today.getDate().toString().padStart(2,'0')}
明日の日付: ${tomorrow.getFullYear()}-${(tomorrow.getMonth()+1).toString().padStart(2,'0')}-${tomorrow.getDate().toString().padStart(2,'0')}

メッセージ: "${text}"

種類の判定基準:
- personal_schedule: 「予定」と明示された個人的なスケジュール（例：明日の予定、個人的な用事）
- schedule: 「イベント」と明示されたパブリックなイベント（例：チームイベント、会議、共有予定）
- task: 作業タスク、TODO、完了すべき作業
- project: プロジェクト管理、長期計画
- contact: 人脈、連絡先情報
- memo: メモ、記録、ナレッジ

注意: 
- メッセージで「予定」という言葉が使われたら personal_schedule、「イベント」という言葉が使われたら schedule として分類する
- 「明日」という言葉が含まれている場合は、明日の日付 (${tomorrow.toISOString().split('T')[0]}) を使用する
- 時刻が指定されていない場合は、00:00:00 を使用する

抽出すべき情報:
1. 種類 (personal_schedule/schedule/task/project/contact/memo)
2. タイトル (日時情報を除いた内容部分)
3. 説明
4. 日時 (ISO 8601形式、相対日付は具体的な日付に変換)
5. 参加者
6. 場所
7. 優先度 (high/medium/low)
8. 担当者
9. 期限
10. 信頼度 (0-1)

タイトル抽出の重要な注意事項:
- 「明日 池本さんとの会議」→ タイトル: 「池本さんとの会議」
- 「6月20日企画会議」→ タイトル: 「6月20日企画会議」（日付がタイトルの一部）
- 「明後日 14時 歯医者」→ タイトル: 「歯医者」
- 「来週火曜日 打ち合わせ」→ タイトル: 「打ち合わせ」
- 日時が文の最初にある場合は除去、日時がタイトルに含まれる場合は保持

以下のJSON形式でのみ回答してください:
{
  "type": "personal_schedule|schedule|task|project|contact|memo",
  "title": "string",
  "description": "string",
  "datetime": "YYYY-MM-DDTHH:mm:ss (任意)",
  "attendees": ["string", "string"] (任意),
  "location": "string (任意)",
  "priority": "high|medium|low (任意)",
  "assignee": "string (任意)",
  "deadline": "YYYY-MM-DD (任意)",
  "confidence": 0.0-1.0
}

重要: JSON以外の文字は含めず、純粋なJSONオブジェクトのみを返してください。
`;

    const result = await aiCallManager.callGemini(
      prompt,
      'text_extraction',
      { 
        useCache: true, 
        cacheKey: `text_extract_${text.substring(0, 50)}`,
        timeout: 15000
      }
    );

    if (!result.success || !result.content) {
      throw new Error(result.error || 'No response from Gemini AI');
    }

    // JSONパースを試行（Markdownコードブロックが含まれている場合は除去）
    let jsonContent = result.content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const extracted = JSON.parse(jsonContent) as ExtractedData;
    
    // バリデーション
    if (!extracted.type || !extracted.title) {
      throw new Error('Invalid response format from Gemini AI');
    }

    return extracted;

  } catch (error) {
    console.error('AI extraction error:', error);
    console.log('Falling back to simple extraction');
    return await extractDataFromTextSimple(text);
  }
}

// 簡易抽出（AIなし）
async function extractDataFromTextSimple(text: string): Promise<ExtractedData> {
  const command = extractCommand(text);
  
  // 日時抽出の簡易実装
  const datetime = await extractDateTime(text);
  
  // 人名抽出の簡易実装
  const attendees = extractAttendees(text);
  
  // 場所抽出の簡易実装
  const location = extractLocation(text);
  
  // 優先度抽出
  const priority = extractPriority(text);
  
  let type: ExtractedData['type'] = 'memo';
  
  // 予定/イベントの判定（優先度高）
  if (/予定/.test(text)) {
    type = 'personal_schedule';
  } else if (/(イベント|会議|ミーティング|打ち合わせ)/.test(text)) {
    type = 'schedule';
  } else if (command) {
    switch (command) {
      case 'スケジュール':
      case 'アポ':
        type = 'schedule';
        break;
      case 'タスク':
      case '作業':
      case '仕事':
      case 'TODO':
      case 'やること':
        type = 'task';
        break;
      case 'プロジェクト':
      case '案件':
      case 'PJ':
        type = 'project';
        break;
      case '人脈':
      case '連絡先':
      case 'コンタクト':
      case '名刺':
        type = 'contact';
        break;
    }
  }
  
  return {
    type,
    title: extractTitle(text, command),
    description: text,
    datetime,
    attendees,
    location,
    priority,
    confidence: calculateConfidence(text, command)
  };
}

function extractCommand(text: string): string | undefined {
  const commandPatterns = [
    /^(予定|スケジュール|会議|ミーティング|アポ)/,
    /^(タスク|作業|仕事|TODO|やること)/,
    /^(プロジェクト|案件|PJ)/,
    /^(人脈|連絡先|コンタクト|名刺)/,
    /^(議事録|メモ|記録|要約)/
  ];
  
  for (const pattern of commandPatterns) {
    if (pattern.test(text)) {
      return text.match(pattern)?.[1];
    }
  }
  
  return undefined;
}

async function extractDateTime(text: string): Promise<string | undefined> {
  try {
    const { dateTimeParser } = await import('@/lib/line/datetime-parser');
    const parsed = await dateTimeParser.parse(text);
    
    if (parsed.confidence >= 0.3) {
      // JST基準でISO形式を作成
      return `${parsed.date}T${parsed.time}:00`;
    }
    
    console.log(`⚠️ AI日時解析信頼度低: "${text}" (confidence: ${parsed.confidence})`);
    return undefined;
  } catch (error) {
    console.error('❌ AI日時解析エラー:', error);
    return undefined;
  }
}

function extractAttendees(text: string): string[] {
  const attendees: string[] = [];
  
  // 「〜さん」「〜君」「〜さま」パターン
  const nameMatches = text.match(/(\w+)(?:さん|君|さま|部長|課長|主任)/g);
  if (nameMatches) {
    nameMatches.forEach(match => {
      const name = match.replace(/(さん|君|さま|部長|課長|主任)$/, '');
      if (name && !attendees.includes(name)) {
        attendees.push(name);
      }
    });
  }
  
  // 「〜と」パターン
  const withMatches = text.match(/(\w+)と/g);
  if (withMatches) {
    withMatches.forEach(match => {
      const name = match.replace('と', '');
      if (name && !attendees.includes(name)) {
        attendees.push(name);
      }
    });
  }
  
  return attendees;
}

function extractLocation(text: string): string | undefined {
  const locationPatterns = [
    /会議室[A-Z\d]/,
    /オンライン/,
    /Zoom/,
    /Teams/,
    /Slack/,
    /オフィス/,
    /\w+駅/,
    /\w+ホテル/
  ];
  
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return undefined;
}

function extractPriority(text: string): 'high' | 'medium' | 'low' {
  if (/緊急|至急|重要/.test(text)) {
    return 'high';
  }
  if (/優先|急ぎ/.test(text)) {
    return 'medium';
  }
  return 'low';
}

function extractTitle(text: string, command?: string): string {
  let title = text;
  
  // コマンド部分を除去
  if (command) {
    title = title.replace(new RegExp(`^${command}\\s*`), '');
  }
  
  // 日時表現を除去（但し、タイトルの一部の場合は保持）
  const dateTimePatterns = [
    /\b\d{1,2}\/\d{1,2}\s+\d{1,2}時\b/g,  // 6/20 14時
    /\b\d{1,2}月\d{1,2}日\s+\d{1,2}時\b/g,  // 6月20日 14時
    /\b明日\s+\d{1,2}時\b/g,  // 明日 14時
    /\b今日\s+\d{1,2}時\b/g,  // 今日 14時
    /\b明後日\s+\d{1,2}時\b/g,  // 明後日 14時
    /\b\d{1}日後\s+\d{1,2}時\b/g,  // 3日後 14時
    /\b来週\w+\s+\d{1,2}時\b/g,  // 来週火曜 14時
    /\b午前\s*\d{1,2}時\b/g,  // 午前10時
    /\b午後\s*\d{1,2}時\b/g,  // 午後2時
  ];
  
  // コンテキストを考慮した除去ロジック
  for (const pattern of dateTimePatterns) {
    // 日時表現が文の最初にある場合のみ除去
    if (title.match(new RegExp(`^${pattern.source.replace(/\\b/g, '').replace(/\//g, '\\/')}`))) {
      title = title.replace(pattern, '').trim();
    }
  }
  
  // 単体日時パターンを除去（文中位置問わず）
  const singleTimePatterns = [
    /^\d{1,2}時$/,  // 14時（単体）
    /^\d{1,2}:\d{2}$/,  // 14:30（単体）
    /^明日$/,  // 明日（単体）
    /^今日$/,  // 今日（単体）
    /^明後日$/,  // 明後日（単体）
    /^\d{1}日後$/,  // 3日後（単体）
  ];
  
  for (const pattern of singleTimePatterns) {
    if (pattern.test(title.trim())) {
      // 単体日時表現の場合は元テキストからコンテキストを抽出
      const contextMatch = text.match(/(?:明日|今日|明後日|\d{1}日後).+?([ぁ-んァ-ヶー\w\s]+)/);
      if (contextMatch && contextMatch[1]) {
        title = contextMatch[1].trim();
      }
      break;
    }
  }
  
  // 余分な空白を削除
  title = title.replace(/\s+/g, ' ').trim();
  
  // 長すぎる場合は最初の50文字
  if (title.length > 50) {
    title = title.substring(0, 50) + '...';
  }
  
  return title || '無題';
}

function calculateConfidence(text: string, command?: string): number {
  let confidence = 0.1; // ベース信頼度
  
  if (command) {
    confidence += 0.3; // コマンドがある場合
  }
  
  // 日時表現の検出
  if (/\d{1,2}[月\/]\d{1,2}[日]?|\d{1,2}時|\d{1,2}:\d{2}|明日|今日|来週|来月/.test(text)) {
    confidence += 0.2;
  }
  
  // 人名の検出（さん、君、さま等）
  if (/\w+さん|\w+君|\w+さま|\w+部長|\w+課長/.test(text)) {
    confidence += 0.2;
  }
  
  // 場所の検出
  if (/会議室|オンライン|Zoom|Teams|Slack|オフィス|駅|ホテル/.test(text)) {
    confidence += 0.1;
  }
  
  // 優先度の検出
  if (/緊急|至急|重要|優先|急ぎ/.test(text)) {
    confidence += 0.1;
  }
  
  return Math.min(confidence, 1.0);
}