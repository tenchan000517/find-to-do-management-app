import { NextRequest, NextResponse } from 'next/server';
import { getJSTISOString } from '@/lib/utils/datetime-jst';
import { 
  validateSignature,
  parseWebhookBody,
  createWebhookResponse,
  type LineWebhookBody,
  type LineWebhookEvent
} from '@/lib/line/webhook-validator';
import { handleMessage } from '@/lib/line/message-processor';
import { handlePostback } from '@/lib/line/postback-handler';
import { 
  sendReplyMessage,
  createWelcomeMessage,
  createJoinMessage
} from '@/lib/line/notification';



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
      case 'postback':
        await handlePostback(event);
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
  console.log('🚀 WEBHOOK ENDPOINT HIT! Time:', getJSTISOString());
  
  try {
    console.log('=== LINE Webhook POST START ===');
    
    // リクエスト解析
    const parseResult = await parseWebhookBody(request);
    if (!parseResult.success) {
      return parseResult.error!;
    }
    
    const { body, parsedBody } = parseResult;
    const signature = request.headers.get('x-line-signature');
    
    // 署名検証
    if (!signature || !validateSignature(body!, signature)) {
      console.error('Invalid signature');
      return createWebhookResponse('Invalid signature', 401);
    }
    
    console.log('Signature validation passed');
    console.log('Events count:', parsedBody!.events.length);
    
    // 各イベントを並行処理
    await Promise.all(parsedBody!.events.map(handleEvent));
    
    console.log('=== LINE Webhook POST END ===');
    return createWebhookResponse('Success');
    
  } catch (error) {
    console.error('Webhook error:', error);
    return createWebhookResponse('Internal server error', 500);
  }
}


// GET エンドポイント（ヘルスチェック用）
export async function GET() {
  return NextResponse.json({ 
    status: 'LINE Webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}