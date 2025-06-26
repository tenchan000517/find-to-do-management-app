import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@line/bot-sdk';

// Discord通知データの型定義
interface DiscordNotificationData {
  type: 'new_member' | 'introduction' | 'staff_absence' | 'announcement' | 'test';
  channel: string;
  user?: {
    name: string;
    id: string;
    avatar?: string;
  };
  message?: {
    content: string;
    timestamp: string;
    jump_url: string;
  };
  notification_message: string;
  absence_duration?: {
    hours: number;
    minutes: number;
    total_minutes: number;
  };
}

// LINE送信先設定（環境変数で設定）
const ADMIN_LINE_USER_ID = process.env.ADMIN_LINE_USER_ID || 'U123456789'; // 個人宛
const ADMIN_LINE_GROUP_ID = process.env.ADMIN_LINE_GROUP_ID; // グループ宛（オプション）

// Discord通知をLINEメッセージに変換
function createDiscordNotificationMessage(data: DiscordNotificationData): string {
  const emoji = getEmojiForNotificationType(data.type);
  const timestamp = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
  
  let message = `${emoji} ${data.notification_message}\n\n`;
  
  if (data.user) {
    message += `👤 ユーザー: ${data.user.name}\n`;
  }
  
  message += `📍 チャンネル: ${data.channel}\n`;
  
  if (data.message) {
    // メッセージ内容を100文字で切り詰め
    const content = data.message.content.length > 100 
      ? data.message.content.substring(0, 100) + '...'
      : data.message.content;
    message += `💬 メッセージ: "${content}"\n`;
    message += `🔗 Discordで確認: ${data.message.jump_url}\n`;
  }
  
  if (data.absence_duration) {
    message += `⏱️ 不在時間: ${data.absence_duration.hours}時間${data.absence_duration.minutes}分\n`;
    message += `📝 メンバーからの発言に運営の応答がありません\n\n`;
    message += `対応をお願いします 🙏\n`;
  }
  
  message += `\n⏰ ${timestamp}`;
  
  return message;
}

// 通知タイプに応じた絵文字を取得
function getEmojiForNotificationType(type: string): string {
  switch (type) {
    case 'new_member': return '🎉';
    case 'introduction': return '📝';
    case 'staff_absence': return '⚠️';
    case 'announcement': return '📢';
    case 'test': return '🧪';
    default: return '📬';
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Discord notification webhook received');
    console.log('Environment check - ADMIN_LINE_USER_ID:', process.env.ADMIN_LINE_USER_ID ? 'Set' : 'Not set');
    console.log('Environment check - ADMIN_LINE_GROUP_ID:', process.env.ADMIN_LINE_GROUP_ID ? 'Set' : 'Not set');
    
    // リクエストボディの解析
    const notificationData: DiscordNotificationData = await request.json();
    
    console.log('Notification data:', {
      type: notificationData.type,
      channel: notificationData.channel,
      user: notificationData.user?.name
    });
    
    // 必須フィールドの検証
    if (!notificationData.type || !notificationData.channel || !notificationData.notification_message) {
      return NextResponse.json(
        { error: 'Missing required fields: type, channel, notification_message' },
        { status: 400 }
      );
    }
    
    // LINEメッセージの作成
    const lineMessage = createDiscordNotificationMessage(notificationData);
    
    // LINE管理者に通知送信
    try {
      // LINE SDK設定
      if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
        throw new Error('LINE_CHANNEL_ACCESS_TOKEN not configured');
      }
      
      const lineConfig = {
        channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
        channelSecret: process.env.LINE_CHANNEL_SECRET!,
      };
      const client = new Client(lineConfig);

      // LINE通知送信（個人・グループ両方）
      const sendPromises = [];
      
      console.log('Sending to USER ID:', ADMIN_LINE_USER_ID);
      console.log('Sending to GROUP ID:', ADMIN_LINE_GROUP_ID);
      
      // 個人宛送信
      if (ADMIN_LINE_USER_ID) {
        sendPromises.push(
          client.pushMessage(ADMIN_LINE_USER_ID, {
            type: 'text',
            text: lineMessage
          })
        );
      }
      
      // グループ宛送信（設定されている場合）
      if (ADMIN_LINE_GROUP_ID) {
        sendPromises.push(
          client.pushMessage(ADMIN_LINE_GROUP_ID, {
            type: 'text',
            text: lineMessage
          })
        );
      }
      
      // 並列送信実行
      await Promise.all(sendPromises);
      
      console.log('Discord notification sent to LINE successfully');
      
      return NextResponse.json({
        success: true,
        message: 'Discord notification sent to LINE',
        timestamp: new Date().toISOString()
      });
      
    } catch (lineError) {
      console.error('Failed to send LINE notification:', lineError);
      
      return NextResponse.json({
        error: 'Failed to send LINE notification',
        details: lineError instanceof Error ? lineError.message : 'Unknown error'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Discord notification webhook error:', error);
    
    return NextResponse.json({
      error: 'Invalid request format',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 });
  }
}

// GET メソッドでの動作確認
export async function GET() {
  return NextResponse.json({
    status: 'Discord notifications webhook is running',
    endpoint: '/api/webhook/discord-notifications',
    methods: ['POST'],
    timestamp: new Date().toISOString()
  });
}