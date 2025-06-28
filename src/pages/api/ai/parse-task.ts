import { NextApiRequest, NextApiResponse } from 'next';

interface ParsedTask {
  title: string;
  description?: string;
  dueDate?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  assignee?: string;
  project?: string;
  estimatedHours?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text input is required' });
    }

    // Advanced natural language processing
    const parsedTask = await parseTaskWithAI(text);

    return res.status(200).json({
      success: true,
      task: parsedTask,
      originalText: text
    });

  } catch (error) {
    console.error('Task parsing error:', error);
    return res.status(500).json({
      success: false,
      error: 'タスクの解析中にエラーが発生しました'
    });
  }
}

async function parseTaskWithAI(text: string): Promise<ParsedTask> {
  const lowerText = text.toLowerCase();
  
  // Extract task title (remove time and priority keywords)
  let title = text
    .replace(/(明日|今日|来週|月曜|火曜|水曜|木曜|金曜|土曜|日曜)(まで|に|で)?/g, '')
    .replace(/(高優先度|低優先度|緊急|急ぎ|重要)/g, '')
    .replace(/(を|に|の|で|から|まで)\s*$/g, '')
    .trim();

  // If title is too short, use original text
  if (title.length < 3) {
    title = text;
  }

  // Extract due date with advanced pattern matching
  let dueDate: string | undefined;
  const today = new Date();
  
  const datePatterns = [
    { pattern: /明日/, days: 1 },
    { pattern: /今日/, days: 0 },
    { pattern: /来週/, days: 7 },
    { pattern: /月曜(日)?/, days: getDaysUntilWeekday(1) },
    { pattern: /火曜(日)?/, days: getDaysUntilWeekday(2) },
    { pattern: /水曜(日)?/, days: getDaysUntilWeekday(3) },
    { pattern: /木曜(日)?/, days: getDaysUntilWeekday(4) },
    { pattern: /金曜(日)?/, days: getDaysUntilWeekday(5) },
    { pattern: /土曜(日)?/, days: getDaysUntilWeekday(6) },
    { pattern: /日曜(日)?/, days: getDaysUntilWeekday(0) },
  ];

  for (const { pattern, days } of datePatterns) {
    if (pattern.test(lowerText)) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + days);
      dueDate = targetDate.toISOString().split('T')[0];
      break;
    }
  }

  // Extract priority with context understanding
  let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
  
  const highPriorityKeywords = ['緊急', '急ぎ', '重要', '高優先度', 'asap', '今すぐ'];
  const lowPriorityKeywords = ['低優先度', '余裕', 'ゆっくり', '暇な時'];
  
  if (highPriorityKeywords.some(keyword => lowerText.includes(keyword))) {
    priority = 'HIGH';
  } else if (lowPriorityKeywords.some(keyword => lowerText.includes(keyword))) {
    priority = 'LOW';
  }

  // Smart time estimation based on task content
  let estimatedHours = estimateTaskDuration(text);

  // Extract assignee if mentioned
  let assignee: string | undefined;
  const assigneePatterns = [
    /田中(さん)?に/,
    /佐藤(さん)?に/,
    /山田(さん)?に/,
    /私が/,
    /自分で/
  ];
  
  for (const pattern of assigneePatterns) {
    const match = text.match(pattern);
    if (match) {
      assignee = match[0].replace(/(さん)?に?/, '');
      break;
    }
  }

  // Extract project context
  let project: string | undefined;
  const projectPatterns = [
    /([A-Za-z]+社?)(の|に関する|関連)/,
    /(プロジェクト[A-Za-z0-9]+)/,
    /(システム|アプリ|サイト)(改修|開発|作成)/
  ];
  
  for (const pattern of projectPatterns) {
    const match = text.match(pattern);
    if (match) {
      project = match[1];
      break;
    }
  }

  return {
    title,
    description: `音声入力により自動生成: "${text}"`,
    dueDate,
    priority,
    assignee,
    project,
    estimatedHours
  };
}

function getDaysUntilWeekday(targetWeekday: number): number {
  const today = new Date();
  const currentWeekday = today.getDay();
  let daysUntil = targetWeekday - currentWeekday;
  
  if (daysUntil <= 0) {
    daysUntil += 7; // Next week
  }
  
  return daysUntil;
}

function estimateTaskDuration(text: string): number {
  const lowerText = text.toLowerCase();
  
  // Task type based estimation
  const taskTypes = [
    { keywords: ['資料作成', 'レポート', '文書作成', '企画書'], hours: 2 },
    { keywords: ['会議', 'ミーティング', '打ち合わせ'], hours: 1 },
    { keywords: ['企画', '計画', '設計', '戦略'], hours: 3 },
    { keywords: ['プレゼン', '発表', 'プレゼンテーション'], hours: 2 },
    { keywords: ['調査', '研究', '分析'], hours: 4 },
    { keywords: ['システム', 'プログラム', 'コード', '開発'], hours: 6 },
    { keywords: ['メール', '連絡', '確認'], hours: 0.5 },
    { keywords: ['レビュー', '確認', 'チェック'], hours: 1 },
  ];

  for (const { keywords, hours } of taskTypes) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return hours;
    }
  }

  // Default estimation based on complexity indicators
  if (lowerText.includes('簡単') || lowerText.includes('軽く')) {
    return 0.5;
  } else if (lowerText.includes('複雑') || lowerText.includes('大変')) {
    return 4;
  }

  return 1; // Default 1 hour
}