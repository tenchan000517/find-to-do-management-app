export interface ExtractedData {
  type: 'schedule' | 'task' | 'project' | 'contact' | 'memo';
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

// 簡易データ抽出（AIなし）
export function extractDataFromText(text: string): ExtractedData {
  const command = extractCommand(text);
  
  // 日時抽出の簡易実装
  const datetime = extractDateTime(text);
  
  // 人名抽出の簡易実装
  const attendees = extractAttendees(text);
  
  // 場所抽出の簡易実装
  const location = extractLocation(text);
  
  // 優先度抽出
  const priority = extractPriority(text);
  
  let type: ExtractedData['type'] = 'memo';
  if (command) {
    switch (command) {
      case '予定':
      case 'スケジュール':
      case '会議':
      case 'ミーティング':
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

function extractDateTime(text: string): string | undefined {
  const now = new Date();
  
  // 今日、明日の処理
  if (text.includes('今日')) {
    const timeMatch = text.match(/(\d{1,2}:\d{2}|\d{1,2}時)/);
    if (timeMatch) {
      const time = timeMatch[1].includes(':') ? timeMatch[1] : `${timeMatch[1].replace('時', '')}:00`;
      return `${now.toISOString().split('T')[0]}T${time}:00`;
    }
  }
  
  if (text.includes('明日')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const timeMatch = text.match(/(\d{1,2}:\d{2}|\d{1,2}時)/);
    if (timeMatch) {
      const time = timeMatch[1].includes(':') ? timeMatch[1] : `${timeMatch[1].replace('時', '')}:00`;
      return `${tomorrow.toISOString().split('T')[0]}T${time}:00`;
    }
  }
  
  // 月日と時刻の組み合わせ
  const dateTimeMatch = text.match(/(\d{1,2})[月\/](\d{1,2})[日]?\s*(\d{1,2}:\d{2}|\d{1,2}時)/);
  if (dateTimeMatch) {
    const month = parseInt(dateTimeMatch[1]);
    const day = parseInt(dateTimeMatch[2]);
    const time = dateTimeMatch[3].includes(':') ? dateTimeMatch[3] : `${dateTimeMatch[3].replace('時', '')}:00`;
    
    const year = now.getFullYear();
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${time}:00`;
  }
  
  return undefined;
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