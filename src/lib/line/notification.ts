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
    personal_schedule: '📅 予定',
    schedule: '🎯 イベント',
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
• @FIND to DO @コマンド → ボタンテスト

🤖 AI機能で自動的に内容を解析し、適切な形で登録します。
信頼度が低い場合は確認メッセージを送信します。`;
}

// テスト用ボタンメッセージ
export async function createTestButtonMessage(replyToken: string): Promise<boolean> {
  const flexContent = {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '🧪 ボタンテスト',
          weight: 'bold',
          size: 'xl',
          margin: 'md'
        },
        {
          type: 'text',
          text: 'LINEボタン機能のテストです。どちらかのボタンを押してください。',
          wrap: true,
          color: '#666666',
          size: 'sm',
          margin: 'md'
        }
      ]
    },
    footer: {
      type: 'box',
      layout: 'horizontal',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          style: 'primary',
          height: 'sm',
          action: {
            type: 'postback',
            label: 'YES',
            data: 'test_yes'
          }
        },
        {
          type: 'button',
          style: 'secondary',
          height: 'sm',
          action: {
            type: 'postback',
            label: 'NO',
            data: 'test_no'
          }
        }
      ]
    }
  };

  return await sendFlexMessage(replyToken, 'ボタンテスト', flexContent);
}

// 分類確認ボタンメッセージ
export async function createClassificationConfirmMessage(replyToken: string, extractedData: any): Promise<boolean> {
  const typeMap: { [key: string]: string } = {
    personal_schedule: '📅 予定',
    schedule: '🎯 イベント',
    task: '📋 タスク',
    project: '📊 プロジェクト',
    contact: '👤 人脈',
    memo: '📝 メモ'
  };
  
  const typeText = typeMap[extractedData.type] || '📝 データ';
  const confidence = Math.round(extractedData.confidence * 100);
  
  const flexContent = {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '🤖 分類確認',
          weight: 'bold',
          size: 'xl',
          margin: 'md'
        },
        {
          type: 'text',
          text: `以下の分類で正しいですか？`,
          wrap: true,
          color: '#666666',
          size: 'sm',
          margin: 'md'
        },
        {
          type: 'separator',
          margin: 'md'
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'md',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: '種類:',
                  size: 'sm',
                  color: '#555555',
                  flex: 1
                },
                {
                  type: 'text',
                  text: typeText,
                  size: 'sm',
                  color: '#111111',
                  flex: 2
                }
              ]
            },
            {
              type: 'box',
              layout: 'horizontal',
              margin: 'sm',
              contents: [
                {
                  type: 'text',
                  text: 'タイトル:',
                  size: 'sm',
                  color: '#555555',
                  flex: 1
                },
                {
                  type: 'text',
                  text: extractedData.title || '(不明)',
                  size: 'sm',
                  color: '#111111',
                  flex: 2,
                  wrap: true
                }
              ]
            },
            {
              type: 'box',
              layout: 'horizontal',
              margin: 'sm',
              contents: [
                {
                  type: 'text',
                  text: '信頼度:',
                  size: 'sm',
                  color: '#555555',
                  flex: 1
                },
                {
                  type: 'text',
                  text: `${confidence}%`,
                  size: 'sm',
                  color: confidence > 70 ? '#00C851' : confidence > 50 ? '#FF8800' : '#FF4444',
                  flex: 2
                }
              ]
            }
          ]
        }
      ]
    },
    footer: {
      type: 'box',
      layout: 'horizontal',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          style: 'primary',
          height: 'sm',
          action: {
            type: 'postback',
            label: '✅ 正しい',
            data: `classification_confirm_${extractedData.type}`
          }
        },
        {
          type: 'button',
          style: 'secondary',
          height: 'sm',
          action: {
            type: 'postback',
            label: '🔄 修正',
            data: 'classification_change'
          }
        }
      ]
    }
  };

  return await sendFlexMessage(replyToken, '分類確認', flexContent);
}

// 再分類選択ボタンメッセージ
export async function createReclassificationMessage(replyToken: string): Promise<boolean> {
  const flexContent = {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '🔄 種類を選択',
          weight: 'bold',
          size: 'xl',
          margin: 'md'
        },
        {
          type: 'text',
          text: '正しい種類を選択してください',
          wrap: true,
          color: '#666666',
          size: 'sm',
          margin: 'md'
        }
      ]
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'xs',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          spacing: 'xs',
          contents: [
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '📅 予定',
                data: 'reclassify_personal_schedule'
              }
            },
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '🎯 イベント',
                data: 'reclassify_schedule'
              }
            }
          ]
        },
        {
          type: 'box',
          layout: 'horizontal',
          spacing: 'xs',
          contents: [
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '📋 タスク',
                data: 'reclassify_task'
              }
            },
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '📊 プロジェクト',
                data: 'reclassify_project'
              }
            }
          ]
        },
        {
          type: 'box',
          layout: 'horizontal',
          spacing: 'xs',
          contents: [
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '👤 人脈',
                data: 'reclassify_contact'
              }
            },
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '📝 メモ',
                data: 'reclassify_memo'
              }
            }
          ]
        }
      ]
    }
  };

  return await sendFlexMessage(replyToken, '種類選択', flexContent);
}

// 完了メッセージ（ダッシュボードリンク付き）
export async function createCompletionMessage(replyToken: string, type: string): Promise<boolean> {
  const typeMap: { [key: string]: string } = {
    personal_schedule: '📅 予定',
    schedule: '🎯 イベント',
    task: '📋 タスク',
    project: '📊 プロジェクト',
    contact: '👤 人脈',
    memo: '📝 メモ'
  };
  
  const typeText = typeMap[type] || '📝 データ';
  
  const flexContent = {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '✅ 登録完了',
          weight: 'bold',
          size: 'xl',
          color: '#00C851',
          margin: 'md'
        },
        {
          type: 'text',
          text: `${typeText}として登録しました！`,
          wrap: true,
          color: '#333333',
          size: 'md',
          margin: 'md'
        },
        {
          type: 'separator',
          margin: 'md'
        },
        {
          type: 'text',
          text: '🎯 次のアクション',
          weight: 'bold',
          size: 'md',
          margin: 'md'
        },
        {
          type: 'text',
          text: '• このままLINEで続けて登録\n• ダッシュボードで詳細を編集',
          wrap: true,
          color: '#666666',
          size: 'sm',
          margin: 'sm'
        }
      ]
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          spacing: 'sm',
          contents: [
            {
              type: 'button',
              style: 'primary',
              height: 'sm',
              action: {
                type: 'uri',
                label: '📊 ダッシュボード',
                uri: 'https://find-to-do-management-app.vercel.app/'
              },
              flex: 1
            },
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '📝 詳細入力',
                data: `start_detailed_input_${type}`
              },
              flex: 1
            }
          ]
        },
        {
          type: 'text',
          text: 'または、このまま次の項目をメッセージで送信してください',
          wrap: true,
          color: '#999999',
          size: 'xs',
          align: 'center',
          margin: 'sm'
        }
      ]
    }
  };

  return await sendFlexMessage(replyToken, '登録完了', flexContent);
}

// 詳細入力開始メッセージ - 項目選択式
export async function startDetailedInputFlow(replyToken: string, type: string): Promise<boolean> {
  const flowConfigs = {
    schedule: {
      title: '📅 予定の詳細入力',
      description: '追加したい項目を選択してください',
      fields: [
        { key: 'title', name: '📋 タイトル', description: '予定のタイトル' },
        { key: 'eventType', name: '📝 種類', description: '予定の種類（会議/イベント/締切）' },
        { key: 'datetime', name: '📅 日時', description: '会議や予定の日時' },
        { key: 'location', name: '📍 場所', description: '開催場所や会議室' },
        { key: 'attendees', name: '👥 参加者', description: '参加メンバー' },
        { key: 'description', name: '📝 内容', description: '詳細説明やアジェンダ' }
      ]
    },
    task: {
      title: '📋 タスクの詳細入力',
      description: '追加したい項目を選択してください',
      fields: [
        { key: 'title', name: '📋 タイトル', description: 'タスクのタイトル' },
        { key: 'projectId', name: '📊 プロジェクト', description: '所属プロジェクト' },
        { key: 'deadline', name: '⏰ 期限', description: '完了期限' },
        { key: 'priority', name: '🎯 優先度', description: '重要度レベル' },
        { key: 'assignee', name: '👤 担当者', description: '責任者や担当者' },
        { key: 'estimatedHours', name: '⏱️ 工数', description: '予想作業時間' },
        { key: 'description', name: '📄 詳細', description: '具体的な作業内容' }
      ]
    },
    project: {
      title: '📊 プロジェクトの詳細入力',
      description: '追加したい項目を選択してください',
      fields: [
        { key: 'title', name: '📋 タイトル', description: 'プロジェクトのタイトル' },
        { key: 'startDate', name: '📅 開始日', description: 'プロジェクト開始日' },
        { key: 'endDate', name: '📅 終了日', description: 'プロジェクト終了日' },
        { key: 'priority', name: '🎯 優先度', description: '重要度レベル' },
        { key: 'status', name: '📊 ステータス', description: 'プロジェクト状況' },
        { key: 'members', name: '👥 メンバー', description: 'チーム構成' },
        { key: 'goals', name: '🎯 目標', description: '目標や成果物' }
      ]
    },
    contact: {
      title: '👤 人脈の詳細入力',
      description: '追加したい項目を選択してください',
      fields: [
        { key: 'title', name: '📋 タイトル', description: '人脈のタイトル' },
        { key: 'name', name: '👤 氏名', description: '相手の名前' },
        { key: 'date', name: '📅 日付', description: 'いつ出会ったか' },
        { key: 'location', name: '📍 場所', description: 'どこで出会ったか' },
        { key: 'type', name: '🏷️ 種類', description: '人脈の種類' },
        { key: 'company', name: '🏢 会社名', description: '所属会社' },
        { key: 'position', name: '💼 役職', description: '部署や役職' },
        { key: 'contact', name: '📞 連絡先', description: 'メールや電話' },
        { key: 'relation', name: '🤝 関係性', description: 'どんな関係か' }
      ]
    },
    memo: {
      title: '📝 メモの詳細入力',
      description: '追加したい項目を選択してください',
      fields: [
        { key: 'title', name: '📋 タイトル', description: 'メモのタイトル' },
        { key: 'category', name: '📂 カテゴリ', description: 'メモの分類' },
        { key: 'content', name: '📝 内容', description: '詳しい内容' },
        { key: 'author', name: '✍️ 著者', description: '作成者' },
        { key: 'tags', name: '🏷️ タグ', description: '検索用タグ' }
      ]
    }
  };

  const config = flowConfigs[type as keyof typeof flowConfigs];
  if (!config) {
    return await sendReplyMessage(replyToken, 'サポートされていないタイプです');
  }

  const flexContent = {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: config.title,
          weight: 'bold',
          size: 'xl',
          margin: 'md'
        },
        {
          type: 'text',
          text: config.description,
          wrap: true,
          color: '#666666',
          size: 'sm',
          margin: 'md'
        },
        {
          type: 'separator',
          margin: 'md'
        },
        {
          type: 'text',
          text: '🎯 追加可能な項目',
          weight: 'bold',
          size: 'md',
          margin: 'md'
        }
      ]
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        ...config.fields.map(field => ({
          type: 'button',
          style: 'secondary',
          height: 'sm',
          action: {
            type: 'postback',
            label: field.name,
            data: `add_field_${type}_${field.key}`
          }
        })),
        {
          type: 'separator',
          margin: 'md'
        },
        {
          type: 'box',
          layout: 'horizontal',
          spacing: 'sm',
          contents: [
            {
              type: 'button',
              style: 'primary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '💾 保存',
                data: `save_partial_${type}`
              },
              flex: 1
            },
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '❌ キャンセル',
                data: 'cancel_detailed_input'
              },
              flex: 1
            }
          ]
        }
      ]
    }
  };

  try {
    return await sendFlexMessage(replyToken, '詳細入力', flexContent);
  } catch (error) {
    console.error('Flex message failed, sending simple message:', error);
    // フォールバック: シンプルなテキストメッセージ
    await sendReplyMessage(replyToken, `📝 ${config.title}\n\n追加したい項目があれば、詳細を入力してください。\n\n完了したら「保存」と送信してください。`);
    return true;
  }
}

// 質問フロー用のメッセージ
export async function createQuestionMessage(replyToken: string, type: string, questionIndex: number): Promise<boolean> {
  const questionConfigs = {
    schedule: [
      { question: '📅 いつの予定ですか？', placeholder: '例: 明日14時、来週火曜日15:30' },
      { question: '📍 どこで行いますか？', placeholder: '例: 会議室A、オンライン、渋谷オフィス' },
      { question: '👥 誰が参加しますか？', placeholder: '例: 田中さん、営業チーム' },
      { question: '📝 どんな内容ですか？', placeholder: '例: 月次売上会議、プロジェクト進捗確認' }
    ],
    task: [
      { question: '⏰ いつまでに完了しますか？', placeholder: '例: 来週金曜まで、12月末' },
      { question: '🎯 優先度はどのくらいですか？', placeholder: '例: 高、中、低' },
      { question: '👤 誰が担当しますか？', placeholder: '例: 自分、田中さん、チーム全体' },
      { question: '📄 詳しい内容を教えてください', placeholder: '例: 企画書を10ページで作成' }
    ],
    project: [
      { question: '📆 プロジェクト期間はどのくらいですか？', placeholder: '例: 3ヶ月、来年3月まで' },
      { question: '👥 メンバーは何名くらいですか？', placeholder: '例: 5名、開発チーム' },
      { question: '💰 予算はどのくらいですか？', placeholder: '例: 100万円、未定' },
      { question: '🎯 目標や成果物は何ですか？', placeholder: '例: 売上20%向上、新機能リリース' }
    ],
    contact: [
      { question: '🏢 どちらの会社の方ですか？', placeholder: '例: ABC商事、フリーランス' },
      { question: '💼 部署や役職を教えてください', placeholder: '例: 営業部長、代表取締役' },
      { question: '📞 連絡先はありますか？', placeholder: '例: メール、電話番号' },
      { question: '🤝 どのような関係性ですか？', placeholder: '例: 取引先、友人、元同僚' }
    ],
    memo: [
      { question: '📂 どのカテゴリのメモですか？', placeholder: '例: 議事録、アイデア、学習' },
      { question: '⭐ 重要度はどのくらいですか？', placeholder: '例: 高、中、低' },
      { question: '🏷️ タグがあれば教えてください', placeholder: '例: 営業、開発、個人' },
      { question: '📝 詳しい内容を教えてください', placeholder: '例: 具体的な内容や背景' }
    ]
  };

  const questions = questionConfigs[type as keyof typeof questionConfigs];
  if (!questions || questionIndex >= questions.length) {
    // 全質問完了
    return await sendReplyMessage(replyToken, '✅ すべての質問が完了しました！データを保存しています...');
  }

  const currentQuestion = questions[questionIndex];
  const progress = `${questionIndex + 1}/${questions.length}`;

  const flexContent = {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: `質問 ${progress}`,
              size: 'sm',
              color: '#999999',
              flex: 1
            },
            {
              type: 'text',
              text: `進捗: ${Math.round(((questionIndex + 1) / questions.length) * 100)}%`,
              size: 'sm',
              color: '#999999',
              align: 'end',
              flex: 1
            }
          ]
        },
        {
          type: 'separator',
          margin: 'md'
        },
        {
          type: 'text',
          text: currentQuestion.question,
          weight: 'bold',
          size: 'lg',
          wrap: true,
          margin: 'md'
        },
        {
          type: 'text',
          text: currentQuestion.placeholder,
          wrap: true,
          color: '#666666',
          size: 'sm',
          margin: 'sm'
        },
        {
          type: 'separator',
          margin: 'md'
        },
        {
          type: 'text',
          text: '💬 回答をメッセージで送信するか、スキップしてください',
          wrap: true,
          color: '#999999',
          size: 'xs',
          margin: 'md'
        }
      ]
    },
    footer: {
      type: 'box',
      layout: 'horizontal',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          style: 'secondary',
          height: 'sm',
          action: {
            type: 'postback',
            label: '⏭️ スキップ',
            data: `skip_question_${type}_${questionIndex}`
          }
        },
        {
          type: 'button',
          style: 'primary',
          height: 'sm',
          action: {
            type: 'postback',
            label: '✅ 完了',
            data: `finish_questions_${type}`
          }
        }
      ]
    }
  };

  return await sendFlexMessage(replyToken, `質問 ${progress}`, flexContent);
}

// 単一項目入力メッセージ
export async function createFieldInputMessage(replyToken: string, type: string, fieldKey: string): Promise<boolean> {
  const fieldConfigs: Record<string, Record<string, { question: string; placeholder: string; examples: string[] }>> = {
    schedule: {
      datetime: {
        question: '📅 予定の日時を教えてください',
        placeholder: '日時を入力してください',
        examples: ['明日14時', '来週火曜日15:30', '12月25日 10:00']
      },
      location: {
        question: '📍 開催場所を教えてください',
        placeholder: '場所を入力してください',
        examples: ['会議室A', 'オンライン', '渋谷オフィス']
      },
      attendees: {
        question: '👥 参加者を教えてください',
        placeholder: '参加者を入力してください',
        examples: ['田中さん', '営業チーム', '5名']
      },
      description: {
        question: '📝 会議の内容を教えてください',
        placeholder: '内容を入力してください',
        examples: ['月次売上会議', 'プロジェクト進捗確認', '新商品企画']
      }
    },
    task: {
      deadline: {
        question: '⏰ 完了期限を教えてください',
        placeholder: '期限を入力してください',
        examples: ['来週金曜まで', '12月末', '明日中']
      },
      priority: {
        question: '🎯 優先度を教えてください',
        placeholder: '優先度を入力してください',
        examples: ['高', '中', '低']
      },
      assignee: {
        question: '👤 担当者を教えてください',
        placeholder: '担当者を入力してください',
        examples: ['自分', '田中さん', 'チーム全体']
      },
      description: {
        question: '📄 詳しい作業内容を教えてください',
        placeholder: '詳細を入力してください',
        examples: ['企画書を10ページで作成', '資料をまとめる', 'システム設計']
      }
    },
    project: {
      duration: {
        question: '📆 プロジェクト期間を教えてください',
        placeholder: '期間を入力してください',
        examples: ['3ヶ月', '来年3月まで', '半年間']
      },
      members: {
        question: '👥 チームメンバーを教えてください',
        placeholder: 'メンバーを入力してください',
        examples: ['5名', '開発チーム', '田中さん、佐藤さん']
      },
      budget: {
        question: '💰 予算規模を教えてください',
        placeholder: '予算を入力してください',
        examples: ['100万円', '未定', '中規模']
      },
      goals: {
        question: '🎯 目標や成果物を教えてください',
        placeholder: '目標を入力してください',
        examples: ['売上20%向上', '新機能リリース', 'システム導入']
      }
    },
    contact: {
      company: {
        question: '🏢 会社名を教えてください',
        placeholder: '会社名を入力してください',
        examples: ['ABC商事', 'フリーランス', '株式会社○○']
      },
      position: {
        question: '💼 部署や役職を教えてください',
        placeholder: '部署・役職を入力してください',
        examples: ['営業部長', '代表取締役', 'エンジニア']
      },
      contact: {
        question: '📞 連絡先を教えてください',
        placeholder: '連絡先を入力してください',
        examples: ['メールアドレス', '電話番号', 'LINE ID']
      },
      relation: {
        question: '🤝 関係性を教えてください',
        placeholder: '関係性を入力してください',
        examples: ['取引先', '友人', '元同僚']
      }
    },
    memo: {
      category: {
        question: '📂 メモのカテゴリを教えてください',
        placeholder: 'カテゴリを入力してください',
        examples: ['議事録', 'アイデア', '学習メモ']
      },
      importance: {
        question: '⭐ 重要度を教えてください',
        placeholder: '重要度を入力してください',
        examples: ['高', '中', '低']
      },
      tags: {
        question: '🏷️ タグを教えてください',
        placeholder: 'タグを入力してください',
        examples: ['営業', '開発', '個人']
      },
      details: {
        question: '📝 詳しい内容を教えてください',
        placeholder: '詳細内容を入力してください',
        examples: ['会議で決まったこと', '新しいアイデア', '学んだこと']
      }
    }
  };

  const fieldConfig = fieldConfigs[type]?.[fieldKey];
  if (!fieldConfig) {
    return await sendReplyMessage(replyToken, '項目が見つかりません');
  }

  const flexContent = {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: fieldConfig.question,
          weight: 'bold',
          size: 'lg',
          wrap: true,
          margin: 'md'
        },
        {
          type: 'text',
          text: fieldConfig.placeholder,
          wrap: true,
          color: '#666666',
          size: 'sm',
          margin: 'sm'
        },
        {
          type: 'separator',
          margin: 'md'
        },
        {
          type: 'text',
          text: '💡 入力例',
          weight: 'bold',
          size: 'sm',
          margin: 'md'
        },
        ...fieldConfig.examples.map(example => ({
          type: 'text',
          text: `• ${example}`,
          size: 'xs',
          color: '#999999',
          margin: 'xs'
        })),
        {
          type: 'separator',
          margin: 'md'
        },
        {
          type: 'text',
          text: '💬 上記を参考に、メッセージで回答してください',
          wrap: true,
          color: '#999999',
          size: 'xs',
          margin: 'md'
        }
      ]
    },
    footer: {
      type: 'box',
      layout: 'horizontal',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          style: 'secondary',
          height: 'sm',
          action: {
            type: 'postback',
            label: '⏭️ スキップ',
            data: `skip_field_${type}_${fieldKey}`
          }
        },
        {
          type: 'button',
          style: 'primary',
          height: 'sm',
          action: {
            type: 'postback',
            label: '🔙 戻る',
            data: `back_to_selection_${type}`
          }
        }
      ]
    }
  };

  return await sendFlexMessage(replyToken, '項目入力', flexContent);
}