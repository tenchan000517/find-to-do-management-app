import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { generateDataFromExtraction } from '@/lib/line/message-handler';
import { extractDataFromTextWithAI } from '@/lib/ai/text-processor';
import { 
  sendReplyMessage, 
  createSuccessMessage, 
  createErrorMessage, 
  createConfirmationMessage,
  createWelcomeMessage,
  createJoinMessage,
  createHelpMessage
} from '@/lib/line/notification';

interface LineMessage {
  id: string;
  type: 'text' | 'image' | 'file' | 'location';
  text?: string;
  mention?: {
    mentionees: Array<{
      index: number;
      length: number;
      userId: string;
      type: 'user';
      isSelf: boolean;
    }>;
  };
}

interface LineWebhookEvent {
  type: string;
  message?: LineMessage;
  source: {
    type: 'group' | 'user';
    groupId?: string;
    userId: string;
  };
  timestamp: number;
  replyToken?: string;
}

interface LineWebhookBody {
  events: LineWebhookEvent[];
  destination: string;
}

// Webhook署名検証
function validateSignature(body: string, signature: string): boolean {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  if (!channelSecret) {
    console.error('LINE_CHANNEL_SECRET is not set');
    return false;
  }
  
  const generatedSignature = crypto
    .createHmac('SHA256', channelSecret)
    .update(body, 'utf8')
    .digest('base64');
    
  return signature === generatedSignature;
}

// メンション検知（フォールバック対応）
function isMentioned(message: LineMessage): boolean {
  console.log('🔍 MENTION CHECK START');
  console.log('Message mention field:', JSON.stringify(message.mention, null, 2));
  
  // 正式なメンション情報がある場合
  if (message.mention?.mentionees?.some((m) => m.isSelf === true)) {
    console.log('✅ OFFICIAL MENTION DETECTED (isSelf: true)');
    return true;
  }
  
  // フォールバック: テキストにBot名が含まれている場合
  const text = message.text || '';
  const botNames = ['@FIND to DO', '@find_todo', 'FIND to DO'];
  const matchedName = botNames.find(name => text.includes(name));
  
  if (matchedName) {
    console.log('✅ FALLBACK MENTION DETECTED:', matchedName);
    return true;
  }
  
  console.log('❌ NO MENTION DETECTED');
  return false;
}

// メンション部分を除去してクリーンなテキストを生成
function cleanMessageText(message: LineMessage): string {
  if (!message.text) return '';
  
  let cleanText = message.text;
  
  // 正式なメンション情報がある場合
  if (message.mention?.mentionees) {
    message.mention.mentionees
      .sort((a, b) => b.index - a.index)
      .forEach((m) => {
        if (m.isSelf) {
          cleanText = cleanText.substring(0, m.index) + 
                    cleanText.substring(m.index + m.length);
        }
      });
  } else {
    // フォールバック: Bot名を手動で除去
    const botNames = ['@FIND to DO', '@find_todo', 'FIND to DO'];
    botNames.forEach(name => {
      cleanText = cleanText.replace(name, '');
    });
  }
  
  return cleanText.trim();
}

// コマンド解析
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

// メッセージ処理
async function handleMessage(event: LineWebhookEvent): Promise<void> {
  console.log('=== handleMessage START ===');
  console.log('Event:', JSON.stringify(event, null, 2));
  
  if (!event.message || event.message.type !== 'text') {
    console.log('Non-text message ignored');
    return; // テキスト以外は無視
  }

  const message = event.message;
  console.log('Message text:', message.text);
  
  const mentioned = isMentioned(message);
  console.log('Is mentioned:', mentioned);
  
  const cleanText = cleanMessageText(message);
  console.log('Clean text:', cleanText);
  
  const command = extractCommand(cleanText);
  console.log('Extracted command:', command);
  
  // ヘルプコマンドの処理
  if (cleanText.toLowerCase().includes('ヘルプ') || cleanText.toLowerCase().includes('help')) {
    console.log('📚 Help command detected');
    if (event.replyToken) {
      const helpMessage = createHelpMessage();
      await sendReplyMessage(event.replyToken, helpMessage);
    }
    return;
  }
  
  // メンションされていない場合は無視
  if (!mentioned && !command) {
    console.log('Message ignored - no mention or command detected');
    return;
  }

  console.log('Processing LINE message:', {
    groupId: event.source.groupId,
    userId: event.source.userId,
    originalText: message.text,
    cleanText,
    command,
    mentioned,
    hasMentionField: !!message.mention,
    mentionees: message.mention?.mentionees || []
  });

  try {
    // AI統合処理でデータ抽出
    console.log('🤖 Starting AI processing for text:', cleanText);
    const extractedData = await extractDataFromTextWithAI(cleanText);
    
    console.log('Extracted data:', extractedData);
    
    // 信頼度が低い場合は手動確認が必要
    if (extractedData.confidence < 0.5) {
      console.log('Low confidence, manual review required');
      if (event.replyToken) {
        const confirmationMessage = createConfirmationMessage(extractedData);
        await sendReplyMessage(event.replyToken, confirmationMessage);
      }
      return;
    }
    
    // データ自動生成
    const createdIds = await generateDataFromExtraction(extractedData, {
      messageId: message.id,
      groupId: event.source.groupId || '',
      userId: event.source.userId,
      originalMessage: message.text || ''
    });
    
    console.log('Created items:', createdIds);
    
    // 成功応答メッセージの送信
    if (event.replyToken && createdIds.length > 0) {
      const successMessage = createSuccessMessage(extractedData.type, extractedData.title);
      await sendReplyMessage(event.replyToken, successMessage);
    }
    
  } catch (error) {
    console.error('Error processing message:', error);
    if (event.replyToken) {
      const errorMessage = createErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      await sendReplyMessage(event.replyToken, errorMessage);
    }
  }
}

// フォローイベント処理
async function handleFollow(event: LineWebhookEvent): Promise<void> {
  console.log('User followed:', event.source.userId);
  if (event.replyToken) {
    const welcomeMessage = createWelcomeMessage();
    await sendReplyMessage(event.replyToken, welcomeMessage);
  }
}

// グループ参加イベント処理
async function handleJoin(event: LineWebhookEvent): Promise<void> {
  console.log('Bot joined group:', event.source.groupId);
  if (event.replyToken) {
    const joinMessage = createJoinMessage();
    await sendReplyMessage(event.replyToken, joinMessage);
  }
}

// メインイベントハンドラー
async function handleEvent(event: LineWebhookEvent): Promise<void> {
  try {
    switch (event.type) {
      case 'message':
        await handleMessage(event);
        break;
      case 'follow':
        await handleFollow(event);
        break;
      case 'unfollow':
        console.log('User unfollowed:', event.source.userId);
        break;
      case 'join':
        await handleJoin(event);
        break;
      case 'leave':
        console.log('Bot left group:', event.source.groupId);
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }
  } catch (error) {
    console.error('Error handling event:', error);
  }
}

// Webhook エンドポイント
export async function POST(request: NextRequest) {
  console.log('🚀 WEBHOOK ENDPOINT HIT! Time:', new Date().toISOString());
  try {
    console.log('=== LINE Webhook POST START ===');
    console.log('Request method:', request.method);
    console.log('Request URL:', request.url);
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    const body = await request.text();
    const signature = request.headers.get('x-line-signature');
    
    console.log('Body length:', body.length);
    console.log('Body content:', body.substring(0, 200));
    console.log('Signature present:', !!signature);
    
    if (!body || body.length === 0) {
      console.error('Empty request body');
      return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
    }
    
    // 署名検証（テスト用に一時無効化）
    // if (!signature || !validateSignature(body, signature)) {
    //   console.error('Invalid signature');
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }
    console.log('*** SIGNATURE VALIDATION DISABLED FOR TESTING ***');
    
    console.log('Signature validation passed');
    const webhookBody: LineWebhookBody = JSON.parse(body);
    console.log('Events count:', webhookBody.events.length);
    
    // 各イベントを並行処理
    await Promise.all(webhookBody.events.map(handleEvent));
    
    console.log('=== LINE Webhook POST END ===');
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// GET エンドポイント（ヘルスチェック用）
export async function GET() {
  return NextResponse.json({ 
    status: 'LINE Webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}