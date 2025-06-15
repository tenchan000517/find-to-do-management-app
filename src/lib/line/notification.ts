export interface NotificationSchedule {
  type: 'task_reminder' | 'meeting_reminder' | 'project_update';
  targetTime: string;
  groupId: string;
  message: string;
  data: any;
}

// LINE Botクライアント（実際のAPIキーが設定されている場合のみ有効）
let lineClient: any = null;

// クライアントの初期化（遅延ロード）
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

// グループに通知を送信
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

// 返信メッセージを送信
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

// フレックスメッセージを送信（リッチなUI）
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

    await client.replyMessage(replyToken, {
      type: 'flex',
      altText: altText,
      contents: flexContent
    });
    
    console.log('Flex message sent');
    return true;
  } catch (error) {
    console.error('Flex message send error:', error);
    return false;
  }
}

// リマインダーをスケジュール
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

// リマインダーメッセージのフォーマット
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

// 成功通知メッセージの作成
export function createSuccessMessage(type: string, title: string): string {
  const typeMap: { [key: string]: string } = {
    schedule: '📅 予定',
    task: '📋 タスク',
    project: '📊 プロジェクト',
    contact: '👤 人脈',
    memo: '📝 メモ'
  };
  
  const typeText = typeMap[type] || '📝 データ';
  
  return `✅ ${typeText}を登録しました！

タイトル: ${title}

詳細はアプリで確認できます 👉 https://find-to-do-management-app.vercel.app/`;
}

// エラー通知メッセージの作成
export function createErrorMessage(error: string): string {
  return `❌ 処理中にエラーが発生しました

エラー: ${error}

もう一度お試しいただくか、手動でアプリに入力してください。`;
}

// 確認要求メッセージの作成
export function createConfirmationMessage(extractedData: any): string {
  return `🤖 以下の内容で登録しますか？

種類: ${extractedData.type}
タイトル: ${extractedData.title}
${extractedData.datetime ? `日時: ${extractedData.datetime}` : ''}
${extractedData.attendees ? `参加者: ${extractedData.attendees.join(', ')}` : ''}
${extractedData.location ? `場所: ${extractedData.location}` : ''}

信頼度: ${Math.round(extractedData.confidence * 100)}%

「はい」「OK」で確定、「いいえ」「キャンセル」で取消`;
}

// ウェルカムメッセージ
export function createWelcomeMessage(): string {
  return `🎉 FIND to DO Botにご登録いただき、ありがとうございます！

このボットでできること:
📅 予定の自動登録
📋 タスクの作成
📊 プロジェクト管理
👤 人脈情報の記録

使い方:
@find_todo [種類] [内容]

例:
@find_todo 予定 明日14時 田中さんと打ち合わせ
@find_todo タスク 企画書作成 来週金曜まで
@find_todo 人脈 山田太郎 ABC商事 営業部長

まずはお試しください！`;
}

// グループ参加メッセージ
export function createJoinMessage(): string {
  return `👋 FIND to DO Botがグループに参加しました！

メンション(@find_todo)でボットを呼び出せます。
予定やタスクの管理をサポートします。

詳しい使い方: @FIND to DO ヘルプ`;
}

// ヘルプメッセージ
export function createHelpMessage(): string {
  return `📚 FIND to DO Bot 使い方ガイド

🔹 基本的な使い方
@FIND to DO [内容] でメッセージを送信

🔹 機能一覧
📅 **予定登録**
例: @FIND to DO 明日14時 田中さんと会議
例: @FIND to DO 予定 来週火曜 プレゼン準備

📋 **タスク作成**  
例: @FIND to DO タスク 企画書作成 来週金曜まで
例: @FIND to DO やること 資料整理

📊 **プロジェクト管理**
例: @FIND to DO プロジェクト 新サービス開発
例: @FIND to DO 案件 ABC商事との契約

👤 **人脈記録**
例: @FIND to DO 人脈 山田太郎 ABC商事 営業部長

📝 **メモ作成**
例: @FIND to DO メモ 今日の気づき

🔹 特殊コマンド
• @FIND to DO ヘルプ → この画面を表示

🤖 AI機能で自動的に内容を解析し、適切な形で登録します。
信頼度が低い場合は確認メッセージを送信します。`;
}