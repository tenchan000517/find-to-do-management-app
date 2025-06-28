# LINE Bot 公式ドキュメント準拠セットアップガイド

## 概要

このガイドは、FIND to DO管理アプリとLINEグループを連携させるLINE Botの実装手順を、LINE公式ドキュメントに準拠して説明します。

## 前提条件

### 必要なアカウント・環境
- LINE Business Account
- LINE Developers アカウント
- Next.js 15 開発環境
- HTTPS対応のサーバー環境（本番用）

### 技術要件
- Node.js 18+
- TypeScript
- Next.js 15 (App Router)
- PostgreSQL/Firebase (Phase 2)

## 1. LINE Official Account 作成

### 1.1 アカウント作成手順

1. **LINE Business Account作成**
   ```
   https://www.linebiz.com/jp/entry/
   ```
   - 必要情報入力
   - SMS認証完了

2. **LINE Official Account Manager設定**
   ```
   https://manager.line.biz/
   ```
   - アカウント名: "FIND to DO Bot"
   - アカウント種別: 一般アカウント
   - 業種: ソフトウェア・アプリケーション

### 1.2 基本設定

```typescript
// アカウント設定項目
interface OfficialAccountSettings {
  accountName: "FIND to DO Bot";
  statusMessage: "プロジェクト管理を効率化するボットです";
  profileImage: "find_todo_logo.png";
  backgroundImage: "find_todo_background.png";
  
  // 重要: グループ参加設定
  allowGroupChat: true;
  allowMultiPersonChat: true;
  
  // Webhook設定
  useWebhook: true;
  webhookReplyMode: true;
}
```

## 2. LINE Developers Channel作成

### 2.1 Channel作成

**注意**: 2024年9月4日以降、LINE DevelopersコンソールからMessaging APIチャンネルを直接作成することはできません。先にLINE Official Accountを作成する必要があります。

1. **LINE Developers Console**
   ```
   https://developers.line.biz/console/
   ```

2. **Provider作成**
   - Provider名: "FIND to DO"
   - 説明: "プロジェクト管理アプリケーション"

3. **Messaging API Channel作成**
   - Channel名: "FIND to DO Bot"
   - Channel説明: "LINE連携プロジェクト管理ボット"
   - 大業種: コンピュータ・通信・機器
   - 小業種: ソフトウェア・アプリケーション

### 2.2 Channel設定

```typescript
// Channel設定情報
interface ChannelSettings {
  channelId: string;          // Channel ID
  channelSecret: string;      // Channel Secret
  channelAccessToken: string; // Channel Access Token v2.1
  
  // Webhook設定
  webhookUrl: "https://find-todo-app.com/api/webhook/line";
  useWebhook: true;
  webhookRedelivery: true;
  
  // 機能設定
  allowBotToJoinGroupChats: true;
  scanQRCodeInChatEnabled: false;
  
  // 応答設定
  autoReplyMessage: false;
  greetingMessage: true;
}
```

## 3. Webhook実装

### 3.1 Next.js API Route作成

```typescript
// /src/app/api/webhook/line/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Client, middleware, MiddlewareConfig, WebhookEvent } from '@line/bot-sdk';
import crypto from 'crypto';

const config: MiddlewareConfig = {
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
};

const client = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
});

// Webhook署名検証
function validateSignature(body: string, signature: string): boolean {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  if (!channelSecret) return false;
  
  const generatedSignature = crypto
    .createHmac('SHA256', channelSecret)
    .update(body)
    .digest('base64');
    
  return signature === generatedSignature;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-line-signature');
    
    if (!signature || !validateSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    const events: WebhookEvent[] = JSON.parse(body).events;
    
    // 各イベントを並行処理
    await Promise.all(events.map(handleEvent));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleEvent(event: WebhookEvent) {
  switch (event.type) {
    case 'message':
      await handleMessage(event);
      break;
    case 'follow':
      await handleFollow(event);
      break;
    case 'unfollow':
      await handleUnfollow(event);
      break;
    case 'join':
      await handleJoin(event);
      break;
    case 'leave':
      await handleLeave(event);
      break;
  }
}
```

### 3.2 メッセージハンドリング

```typescript
// /src/lib/line/message-handler.ts
import { MessageEvent, TextMessage } from '@line/bot-sdk';

interface MentionInfo {
  index: number;
  length: number;
  userId: string;
  type: 'user';
  isSelf: boolean;
}

interface ProcessedMessage {
  originalText: string;
  cleanText: string;
  isMentioned: boolean;
  command?: string;
  parameters?: string[];
  confidence: number;
}

export async function handleMessage(event: MessageEvent) {
  if (event.message.type !== 'text') {
    return; // テキスト以外は無視
  }
  
  const textMessage = event.message as TextMessage;
  const processed = await processMessage(textMessage, event.source);
  
  // メンションされていない場合は無視
  if (!processed.isMentioned && !processed.command) {
    return;
  }
  
  // コマンド実行
  await executeCommand(processed, event);
}

function processMessage(message: TextMessage, source: any): ProcessedMessage {
  const text = message.text;
  const mention = (message as any).mention;
  
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
```

### 3.3 AI統合処理

```typescript
// /src/lib/ai/text-processor.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

export async function extractDataFromText(text: string): Promise<ExtractedData> {
  const prompt = `
以下のLINEメッセージから、プロジェクト管理に必要な情報を抽出してください。

メッセージ: "${text}"

抽出すべき情報:
1. 種類 (schedule/task/project/contact/memo)
2. タイトル
3. 説明
4. 日時 (ISO 8601形式)
5. 参加者
6. 場所
7. 優先度 (high/medium/low)
8. 担当者
9. 期限
10. 信頼度 (0-1)

JSON形式で回答してください:
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'あなたは日本語のプロジェクト管理アシスタントです。LINEメッセージから構造化データを抽出します。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });
    
    const extracted = JSON.parse(response.choices[0].message.content || '{}');
    return extracted as ExtractedData;
    
  } catch (error) {
    console.error('AI extraction error:', error);
    return {
      type: 'memo',
      title: text.substring(0, 50),
      description: text,
      confidence: 0.1
    };
  }
}
```

## 4. データベース統合

### 4.1 LINE連携データモデル

```typescript
// /src/lib/types/line-integration.ts
export interface LineIntegrationLog {
  id: string;
  messageId: string;
  groupId: string;
  userId: string;
  originalMessage: string;
  processedMessage: string;
  extractedData: ExtractedData;
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

export interface LineGroupSettings {
  groupId: string;
  groupName: string;
  isActive: boolean;
  allowedOperations: ('schedule' | 'task' | 'project' | 'contact')[];
  confidenceThreshold: number;
  requireConfirmation: boolean;
  defaultAssignee?: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}
```

### 4.2 自動データ生成

```typescript
// /src/lib/line/data-generator.ts
import { ExtractedData } from '@/lib/ai/text-processor';
import { dataService } from '@/lib/data-service';

export async function generateDataFromExtraction(
  extracted: ExtractedData,
  lineLog: LineIntegrationLog
): Promise<string[]> {
  const createdIds: string[] = [];
  
  try {
    switch (extracted.type) {
      case 'schedule':
        if (extracted.datetime) {
          const event = await dataService.addCalendarEvent({
            title: extracted.title,
            description: extracted.description || '',
            date: extracted.datetime.split('T')[0],
            time: extracted.datetime.split('T')[1]?.substring(0, 5) || '09:00',
            type: 'meeting',
            participants: extracted.attendees || [],
            location: extracted.location,
          });
          createdIds.push(event.id);
        }
        break;
        
      case 'task':
        const task = await dataService.addTask({
          title: extracted.title,
          description: extracted.description || '',
          assignee: extracted.assignee || '未割り当て',
          status: 0,
          priority: extracted.priority || 'medium',
          dueDate: extracted.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
        createdIds.push(task.id);
        break;
        
      case 'project':
        const project = await dataService.addProject({
          name: extracted.title,
          description: extracted.description || '',
          status: 'planning',
          progress: 0,
          priority: extracted.priority || 'medium',
          startDate: new Date().toISOString().split('T')[0],
          teamMembers: extracted.attendees || [],
        });
        createdIds.push(project.id);
        break;
        
      case 'contact':
        const connection = await dataService.addConnection({
          name: extracted.title,
          position: '未設定',
          company: extracted.description || '未設定',
          type: 'company',
          date: new Date().toISOString().split('T')[0],
          location: extracted.location || 'LINE',
          description: extracted.description || '',
          conversation: lineLog.originalMessage,
          potential: '要確認',
        });
        createdIds.push(connection.id);
        break;
    }
    
    // ログ更新
    await updateLineIntegrationLog(lineLog.id, {
      processingStatus: 'processed',
      createdItems: createdIds.map(id => ({
        type: extracted.type as any,
        id
      }))
    });
    
    return createdIds;
    
  } catch (error) {
    console.error('Data generation error:', error);
    await updateLineIntegrationLog(lineLog.id, {
      processingStatus: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}
```

## 5. セキュリティ実装

### 5.1 環境変数設定

```bash
# .env.local
LINE_CHANNEL_SECRET=your_channel_secret_here
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token_here
OPENAI_API_KEY=your_openai_api_key_here

# Webhook URL (本番環境)
NEXT_PUBLIC_WEBHOOK_URL=https://find-todo-app.com/api/webhook/line
```

### 5.2 署名検証

```typescript
// /src/lib/line/security.ts
import crypto from 'crypto';

export function validateLineSignature(
  body: string, 
  signature: string, 
  channelSecret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('SHA256', channelSecret)
    .update(body, 'utf8')
    .digest('base64');
    
  return signature === expectedSignature;
}

export function sanitizeMessage(message: string): string {
  // XSS対策
  return message
    .replace(/[<>\"'&]/g, (match) => {
      const escapeMap: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return escapeMap[match];
    })
    .trim()
    .substring(0, 1000); // 最大長制限
}
```

## 6. 通知・リマインド機能

### 6.1 自動通知システム

```typescript
// /src/lib/line/notification.ts
import { Client } from '@line/bot-sdk';

const client = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
});

export interface NotificationSchedule {
  type: 'task_reminder' | 'meeting_reminder' | 'project_update';
  targetTime: string;
  groupId: string;
  message: string;
  data: any;
}

export async function sendGroupNotification(
  groupId: string, 
  message: string
): Promise<void> {
  try {
    await client.pushMessage(groupId, {
      type: 'text',
      text: message
    });
  } catch (error) {
    console.error('Notification send error:', error);
  }
}

export async function scheduleReminder(schedule: NotificationSchedule): Promise<void> {
  // バックグラウンドジョブとして実装
  // Node-cronまたはBull Queueを使用
  
  const reminderMessage = formatReminderMessage(schedule);
  await sendGroupNotification(schedule.groupId, reminderMessage);
}

function formatReminderMessage(schedule: NotificationSchedule): string {
  switch (schedule.type) {
    case 'task_reminder':
      return `📋 タスクリマインダー\n${schedule.data.title}\n期限: ${schedule.data.dueDate}\n担当: ${schedule.data.assignee}`;
      
    case 'meeting_reminder':
      return `🕐 会議リマインダー\n${schedule.data.title}\n開始: ${schedule.data.datetime}\n場所: ${schedule.data.location}`;
      
    case 'project_update':
      return `📊 プロジェクト更新\n${schedule.data.name}\n進捗: ${schedule.data.progress}%\nステータス: ${schedule.data.status}`;
      
    default:
      return schedule.message;
  }
}
```

## 7. テスト・デプロイメント

### 7.1 開発環境テスト

```typescript
// /src/lib/line/__tests__/webhook.test.ts
import { handleMessage } from '../message-handler';
import { extractDataFromText } from '../../ai/text-processor';

describe('LINE Webhook', () => {
  test('メンション検知テスト', async () => {
    const mockEvent = {
      type: 'message',
      message: {
        type: 'text',
        text: '@find_todo 予定 明日14時 大和さんと打ち合わせ',
        mention: {
          mentionees: [{
            index: 0,
            length: 9,
            userId: 'bot_user_id',
            type: 'user',
            isSelf: true
          }]
        }
      },
      source: { type: 'group', groupId: 'test_group' }
    };
    
    const result = await handleMessage(mockEvent as any);
    expect(result.isMentioned).toBe(true);
    expect(result.command).toBe('予定');
  });
  
  test('AI抽出テスト', async () => {
    const text = '明日14時から大和さんと企画の打ち合わせ';
    const result = await extractDataFromText(text);
    
    expect(result.type).toBe('schedule');
    expect(result.attendees).toContain('大和');
    expect(result.confidence).toBeGreaterThan(0.7);
  });
});
```

### 7.2 本番デプロイメント

```bash
# Vercel デプロイ設定
# vercel.json
{
  "functions": {
    "app/api/webhook/line/route.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "LINE_CHANNEL_SECRET": "@line_channel_secret",
    "LINE_CHANNEL_ACCESS_TOKEN": "@line_channel_access_token",
    "OPENAI_API_KEY": "@openai_api_key"
  }
}
```

## 8. 運用・監視

### 8.1 ログ・監視

```typescript
// /src/lib/monitoring/logger.ts
export interface WebhookLog {
  timestamp: string;
  groupId: string;
  userId: string;
  messageType: string;
  processingTime: number;
  success: boolean;
  error?: string;
}

export function logWebhookEvent(log: WebhookLog): void {
  console.log(`[LINE Webhook] ${log.timestamp}`, {
    group: log.groupId,
    user: log.userId,
    type: log.messageType,
    duration: `${log.processingTime}ms`,
    status: log.success ? 'SUCCESS' : 'ERROR',
    error: log.error
  });
  
  // 外部監視サービス連携 (Sentry, DataDog等)
  if (!log.success && log.error) {
    // エラー通知
  }
}
```

### 8.2 パフォーマンス最適化

```typescript
// /src/lib/line/performance.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// メッセージ重複処理防止
export async function isDuplicateMessage(messageId: string): Promise<boolean> {
  const exists = await redis.exists(`processed:${messageId}`);
  if (exists) return true;
  
  await redis.setex(`processed:${messageId}`, 300, '1'); // 5分間キャッシュ
  return false;
}

// レート制限
export async function checkRateLimit(userId: string): Promise<boolean> {
  const key = `rate_limit:${userId}`;
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, 60); // 1分間のウィンドウ
  }
  
  return count <= 30; // 1分間に30メッセージまで
}
```

## まとめ

このセットアップガイドに従って実装することで、以下の機能が実現されます：

1. **LINE Botの基本機能**
   - グループチャット参加
   - メンション検知
   - 通常会話の無視

2. **AI統合機能**
   - 自然言語からのデータ抽出
   - 高精度な情報認識
   - 自動データ生成

3. **セキュリティ**
   - Webhook署名検証
   - レート制限
   - XSS対策

4. **運用機能**
   - ログ・監視
   - エラーハンドリング
   - パフォーマンス最適化

このガイドはLINE公式ドキュメントに準拠し、実際の運用に必要な全ての要素を含んでいます。

---

**作成日**: 2025年1月13日  
**バージョン**: v1.0  
**対応LINE Bot SDK**: @line/bot-sdk v8.x  
**更新予定**: 四半期ごと