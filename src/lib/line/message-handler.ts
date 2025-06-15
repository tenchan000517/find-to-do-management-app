import { dataService } from '../data-service';

// Helper function to convert old priority values to new ones
const convertPriority = (oldPriority?: string): 'A' | 'B' | 'C' | 'D' => {
  switch (oldPriority) {
    case 'high': return 'A';
    case 'medium': return 'B';
    case 'low': return 'D';
    default: return 'C';
  }
};

export interface MentionInfo {
  index: number;
  length: number;
  userId: string;
  type: 'user';
  isSelf: boolean;
}

export interface ProcessedMessage {
  originalText: string;
  cleanText: string;
  isMentioned: boolean;
  command?: string;
  parameters?: string[];
  confidence: number;
}

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

export interface LineIntegrationLog {
  id: string;
  messageId: string;
  groupId: string;
  userId: string;
  originalMessage: string;
  processedMessage: string;
  extractedData?: ExtractedData;
  processingStatus: 'pending' | 'processed' | 'failed' | 'manual_review';
  confidence: number;
  createdItems: Array<{
    type: 'project' | 'task' | 'event' | 'connection';
    id: string;
  }>;
  userConfirmation?: boolean;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export function processMessage(text: string, mention?: any): ProcessedMessage {
  // メンション検知
  const isMentioned = mention?.mentionees?.some(
    (m: MentionInfo) => m.isSelf === true
  ) || false;
  
  // メンション部分を除去してクリーンなテキストを生成
  let cleanText = text;
  if (mention?.mentionees) {
    // 後ろから削除（インデックスがずれないように）
    mention.mentionees
      .sort((a: MentionInfo, b: MentionInfo) => b.index - a.index)
      .forEach((m: MentionInfo) => {
        if (m.isSelf) {
          cleanText = cleanText.substring(0, m.index) + 
                    cleanText.substring(m.index + m.length);
        }
      });
  }
  
  cleanText = cleanText.trim();
  
  // コマンド解析
  const command = extractCommand(cleanText);
  const parameters = extractParameters(cleanText, command);
  
  return {
    originalText: text,
    cleanText,
    isMentioned,
    command,
    parameters,
    confidence: calculateConfidence(cleanText, command)
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

function extractParameters(text: string, command?: string): string[] {
  if (!command) return [];
  
  // コマンド部分を除去して残りをパラメータとして取得
  const commandLength = command.length;
  const parameterText = text.substring(commandLength).trim();
  
  // 簡単なパラメータ分割（実際にはもっと複雑な解析が必要）
  return parameterText.split(/\s+/).filter(p => p.length > 0);
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

export async function generateDataFromExtraction(
  extracted: ExtractedData,
  messageInfo: {
    messageId: string;
    groupId: string;
    userId: string;
    originalMessage: string;
  }
): Promise<string[]> {
  const createdIds: string[] = [];
  
  try {
    switch (extracted.type) {
      case 'schedule':
        if (extracted.datetime) {
          const event = await dataService.addCalendarEvent({
            title: extracted.title,
            description: extracted.description || '',
            date: extracted.datetime,
            time: new Date(extracted.datetime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
            startTime: extracted.datetime,
            participants: [],
            type: 'meeting',
            location: extracted.location,
          });
          createdIds.push(event.id);
        }
        break;
        
      case 'task':
        const task = await dataService.addTask({
          title: extracted.title,
          description: extracted.description || '',
          userId: messageInfo.userId,
          status: 'IDEA' as const,
          priority: convertPriority(extracted.priority),
          isArchived: false,
          dueDate: extracted.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
        createdIds.push(task.id);
        break;
        
      case 'project':
        const project = await dataService.addProject({
          name: extracted.title,
          description: extracted.description || '',
          status: 'planning',
          progress: 0,
          priority: (extracted.priority === 'high' ? 'A' : extracted.priority === 'low' ? 'D' : 'C') as 'A' | 'B' | 'C' | 'D',
          startDate: new Date().toISOString(),
          endDate: undefined,
          teamMembers: [],
        });
        createdIds.push(project.id);
        break;
        
      case 'contact':
        const connection = await dataService.addConnection({
          name: extracted.title,
          position: '未設定',
          company: extracted.description || '未設定',
          type: 'company',
          date: new Date().toISOString(),
          location: extracted.location || 'LINE',
          description: extracted.description || '',
          conversation: messageInfo.originalMessage,
          potential: '要確認',
        });
        createdIds.push(connection.id);
        break;
    }
    
    return createdIds;
    
  } catch (error) {
    console.error('Data generation error:', error);
    throw error;
  }
}

/**
 * アポイントメント関連のアクション実行
 */
export async function executeAppointmentAction(action: { type: string; data: any }): Promise<string> {
  switch (action.type) {
    case 'mark_appointment_complete':
      try {
        const response = await fetch(`/api/appointments/${action.data.appointment_id}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            outcome: action.data.outcome || 'アポイントメント完了',
            createConnection: action.data.create_connection || false,
            connectionData: action.data.connection_data || {}
          })
        });
        
        if (response.ok) {
          return 'アポイントメントを完了しました！結果が記録されました。';
        } else {
          return 'アポイントメントの完了処理でエラーが発生しました。';
        }
      } catch (error) {
        return 'アポイントメント処理中にエラーが発生しました。';
      }

    case 'schedule_follow_up':
      try {
        // フォローアップアポイントメントの作成
        const followUpData = {
          companyName: action.data.company || '継続案件',
          contactName: action.data.contact_name || '担当者',
          phone: '',
          email: '',
          nextAction: action.data.follow_up_action || 'フォローアップミーティング',
          notes: `前回からの継続。フォロー予定日: ${action.data.follow_up_date}`,
          priority: 'B'
        };

        const response = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(followUpData)
        });

        if (response.ok) {
          return `フォローアップが${action.data.follow_up_date}に設定されました。`;
        } else {
          return 'フォローアップの設定でエラーが発生しました。';
        }
      } catch (error) {
        return 'フォローアップ設定中にエラーが発生しました。';
      }

    case 'update_connection_strength':
      try {
        // コネクション情報の更新
        const connectionData = {
          name: action.data.connection_name,
          company: action.data.company,
          position: '',
          date: new Date().toISOString().split('T')[0],
          location: 'アップデート',
          description: `関係値更新: ${action.data.relationship_strength}`,
          conversation: action.data.notes || 'LINE経由での関係値アップデート',
          potential: `関係値: ${action.data.relationship_strength}/10`,
          type: 'COMPANY',
          updatedAt: new Date()
        };

        const response = await fetch('/api/connections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(connectionData)
        });

        if (response.ok) {
          return `${action.data.connection_name}さんとの関係値を更新しました。`;
        } else {
          return 'コネクション更新でエラーが発生しました。';
        }
      } catch (error) {
        return 'コネクション更新中にエラーが発生しました。';
      }

    default:
      return '不明なアクションです。';
  }
}