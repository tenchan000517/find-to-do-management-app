/**
 * LINE ボット送信機能
 * 
 * LINEクライアントの初期化と各種メッセージ送信を担当
 * notification.tsから分離・責任を明確化
 */

export interface NotificationSchedule {
  type: 'task_reminder' | 'meeting_reminder' | 'project_update';
  targetTime: string;
  groupId: string;
  message: string;
  data: any;
}

// LINE Botクライアント（実際のAPIキーが設定されている場合のみ有効）
let lineClient: any = null;

/**
 * LINEクライアントの初期化（遅延ロード）
 * 環境変数が設定されていない場合は無効化
 */
async function initializeLineClient() {
  if (lineClient) return lineClient;

  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
    console.warn('LINE_CHANNEL_ACCESS_TOKEN not found, notifications disabled');
    return null;
  }

  try {
    // 動的インポートでLINE Bot SDKを読み込み
    const { Client } = await import('@line/bot-sdk');

    lineClient = new Client({
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    });

    return lineClient;
  } catch (error) {
    console.error('Failed to initialize LINE client:', error);
    return null;
  }
}

/**
 * グループに通知を送信
 * @param groupId 送信先グループID
 * @param message 送信メッセージ
 * @returns 送信成功フラグ
 */
export async function sendGroupNotification(
  groupId: string,
  message: string
): Promise<boolean> {
  try {
    const client = await initializeLineClient();
    if (!client) {
      console.warn('LINE client not available, notification skipped');
      return false;
    }

    await client.pushMessage(groupId, {
      type: 'text',
      text: message
    });

    console.log('Notification sent to group:', groupId);
    return true;
  } catch (error) {
    console.error('Notification send error:', error);
    return false;
  }
}

/**
 * 返信メッセージを送信
 * @param replyToken 返信トークン
 * @param message 返信メッセージ
 * @returns 送信成功フラグ
 */
export async function sendReplyMessage(
  replyToken: string,
  message: string
): Promise<boolean> {
  try {
    const client = await initializeLineClient();
    if (!client) {
      console.warn('LINE client not available, reply skipped');
      return false;
    }

    await client.replyMessage(replyToken, {
      type: 'text',
      text: message
    });

    console.log('Reply sent');
    return true;
  } catch (error) {
    console.error('Reply send error:', error);
    return false;
  }
}

/**
 * フレックスメッセージを送信（リッチなUI）
 * @param replyToken 返信トークン
 * @param altText 代替テキスト
 * @param flexContent Flexメッセージコンテンツ
 * @returns 送信成功フラグ
 */
export async function sendFlexMessage(
  replyToken: string,
  altText: string,
  flexContent: any
): Promise<boolean> {
  try {
    const client = await initializeLineClient();
    if (!client) {
      console.warn('LINE client not available, flex message skipped');
      return false;
    }

    // Debug: Log the exact JSON being sent to LINE API
    const messagePayload = {
      type: 'flex',
      altText: altText,
      contents: flexContent
    };

    console.log('🔍 Sending Flex message to LINE API:');
    console.log('Alt text:', altText);
    console.log('Flex content JSON:', JSON.stringify(flexContent, null, 2));

    // Validate JSON structure before sending
    try {
      JSON.parse(JSON.stringify(flexContent));
      console.log('✅ JSON validation passed');
    } catch (jsonError) {
      console.error('❌ JSON validation failed:', jsonError);
      throw new Error(`Invalid JSON structure: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
    }

    // Normalize Unicode characters for LINE API compatibility
    const normalizeUnicode = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj.normalize('NFC'); // Canonical decomposition, then canonical composition
      } else if (Array.isArray(obj)) {
        return obj.map(normalizeUnicode);
      } else if (typeof obj === 'object' && obj !== null) {
        const normalized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          normalized[normalizeUnicode(key)] = normalizeUnicode(value);
        }
        return normalized;
      }
      return obj;
    };

    const normalizedContent = normalizeUnicode(flexContent);
    const normalizedPayload = {
      type: 'flex',
      altText: altText.normalize('NFC'),
      contents: normalizedContent
    };

    await client.replyMessage(replyToken, normalizedPayload);

    console.log('✅ Flex message sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Flex message send error:', error);

    // Enhanced error logging for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    // Log additional details about the error
    if (error && typeof error === 'object' && 'response' in error) {
      console.error('LINE API response error:', error.response);
    }

    return false;
  }
}

/**
 * リマインダーをスケジュール
 * @param schedule スケジュール設定
 */
export async function scheduleReminder(schedule: NotificationSchedule): Promise<void> {
  // 実際の実装では、バックグラウンドジョブシステム（Node-cron、Bull Queue等）を使用
  // ここでは簡易的な実装

  const reminderMessage = formatReminderMessage(schedule);

  // 現在時刻との差分を計算
  const targetTime = new Date(schedule.targetTime);
  const currentTime = new Date();
  const delay = targetTime.getTime() - currentTime.getTime();

  if (delay > 0) {
    // 将来の時刻の場合、setTimeoutでスケジュール
    setTimeout(async () => {
      await sendGroupNotification(schedule.groupId, reminderMessage);
    }, delay);

    console.log(`Reminder scheduled for ${schedule.targetTime}`);
  } else {
    // 過去の時刻の場合、即座に送信
    await sendGroupNotification(schedule.groupId, reminderMessage);
  }
}

/**
 * リマインダーメッセージのフォーマット
 * @param schedule スケジュール設定
 * @returns フォーマット済みメッセージ
 */
function formatReminderMessage(schedule: NotificationSchedule): string {
  switch (schedule.type) {
    case 'task_reminder':
      return `📋 タスクリマインダー
${schedule.data.title}
期限: ${schedule.data.dueDate}
担当: ${schedule.data.assignee}`;

    case 'meeting_reminder':
      return `🕐 会議リマインダー
${schedule.data.title}
開始: ${schedule.data.datetime}
場所: ${schedule.data.location || 'オンライン'}`;

    case 'project_update':
      return `📊 プロジェクト更新
${schedule.data.name}
進捗: ${schedule.data.progress}%
ステータス: ${schedule.data.status}`;

    default:
      return schedule.message;
  }
}