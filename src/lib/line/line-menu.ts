/**
 * LINE ボット メニュー・フォーム生成
 * 
 * 複雑なメニューUIとフォーム要素の生成を担当
 * notification.tsから分離・メニュー関連機能に特化
 */

import { sendFlexMessage, sendReplyMessage } from './line-sender';
import { getTypeDisplayName } from '@/lib/constants/line-types';

/**
 * 詳細入力開始メッセージ - 項目選択式
 * @param replyToken 返信トークン
 * @param type データタイプ
 * @returns 送信成功フラグ
 */
export async function startDetailedInputFlow(replyToken: string, type: string): Promise<boolean> {
  console.log(`🚀 Starting detailed input flow for type: ${type}`);

  const flowConfigs = {
    personal_schedule: {
      title: '📅 個人予定の詳細入力',
      description: '追加したい項目を選択してください',
      fields: [
        { key: 'title', name: '📋 タイトル', description: '予定のタイトル' },
        { key: 'datetime', name: '📅 日時', description: '予定の日時' },
        { key: 'location', name: '📍 場所', description: '開催場所' },
        { key: 'description', name: '📝 内容', description: '詳細説明' },
        { key: 'priority', name: '🎯 優先度', description: '重要度レベル' }
      ]
    },
    personal: {
      // personal_scheduleの別名として処理
      title: '📅 個人予定の詳細入力',
      description: '追加したい項目を選択してください',
      fields: [
        { key: 'title', name: '📋 タイトル', description: '予定のタイトル' },
        { key: 'datetime', name: '📅 日時', description: '予定の日時' },
        { key: 'location', name: '📍 場所', description: '開催場所' },
        { key: 'description', name: '📝 内容', description: '詳細説明' },
        { key: 'priority', name: '🎯 優先度', description: '重要度レベル' }
      ]
    },
    schedule: {
      title: '📅 予定の詳細入力',
      description: '追加したい項目を選択してください',
      fields: [
        { key: 'title', name: '📋 タイトル', description: '予定のタイトル' },
        { key: 'eventType', name: '📝 種類', description: '予定の種類（会議/イベント/締切）' },
        { key: 'datetime', name: '📅 日時', description: '会議や予定の日時' },
        { key: 'location', name: '📍 場所', description: '開催場所や会議室' },
        { key: 'attendees', name: '👥 参加者', description: '参加メンバー' },
        { key: 'description', name: '📝 内容', description: '詳細説明やアジェンダ' },
        { key: 'assignee', name: '👤 担当者', description: 'イベント担当者' }
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
        { key: 'goals', name: '🎯 目標', description: '目標や成果物' },
        { key: 'assignee', name: '👤 プロジェクトマネージャー', description: 'プロジェクト責任者' }
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
        { key: 'relation', name: '🤝 関係性', description: 'どんな関係か' },
        { key: 'assignee', name: '👤 担当者', description: '人脈管理担当者' }
      ]
    },
    appointment: {
      title: '📅 アポイントメントの詳細入力',
      description: '追加したい項目を選択してください',
      fields: [
        { key: 'companyName', name: '🏢 会社名', description: '訪問先会社名' },
        { key: 'contactName', name: '👤 担当者名', description: '先方担当者名' },
        { key: 'phone', name: '📞 電話番号', description: '連絡先電話番号' },
        { key: 'email', name: '📧 メールアドレス', description: '連絡先メール' },
        { key: 'nextAction', name: '📋 アクション', description: '面談内容・目的' },
        { key: 'notes', name: '📝 備考', description: '詳細や特記事項' },
        { key: 'priority', name: '🎯 優先度', description: '重要度レベル' },
        { key: 'assignee', name: '👤 営業担当', description: '営業担当者' }
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
    console.error(`❌ Unsupported type: ${type}`);
    return await sendReplyMessage(replyToken, 'サポートされていないタイプです');
  }

  console.log(`📋 Using config for ${type}:`, {
    title: config.title,
    fieldCount: config.fields.length,
    fieldKeys: config.fields.map(f => f.key)
  });

  // Validate field data for potentially problematic characters
  console.log('🔍 Validating field data for LINE API compatibility...');
  config.fields.forEach((field, index) => {
    const postbackData = `add_field_${type}_${field.key}`;
    if (postbackData.length > 300) {
      console.warn(`⚠️ Field ${index} postback data might be too long: ${postbackData.length} chars`);
    }

    // Check for problematic characters
    const problematicChars = ['\n', '\r', '\t', '"', '\\'];
    problematicChars.forEach(char => {
      if (field.name.includes(char) || field.key.includes(char)) {
        console.warn(`⚠️ Field ${index} contains potentially problematic character: ${char}`);
      }
    });
  });

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
        // Split buttons into groups to avoid LINE's button limits
        ...config.fields.slice(0, 3).map(field => ({
          type: 'button',
          style: 'secondary',
          height: 'sm',
          action: {
            type: 'postback',
            label: field.name,
            data: `add_field_${type}_${field.key}`
          }
        })),
        // Add remaining buttons if more than 3
        ...(config.fields.length > 3 ? [
          {
            type: 'separator',
            margin: 'xs'
          },
          ...config.fields.slice(3, 6).map(field => ({
            type: 'button',
            style: 'secondary',
            height: 'sm',
            action: {
              type: 'postback',
              label: field.name,
              data: `add_field_${type}_${field.key}`
            }
          }))
        ] : []),
        // Add a third group if more than 6 buttons
        ...(config.fields.length > 6 ? [
          {
            type: 'separator',
            margin: 'xs'
          },
          ...config.fields.slice(6).map(field => ({
            type: 'button',
            style: 'secondary',
            height: 'sm',
            action: {
              type: 'postback',
              label: field.name,
              data: `add_field_${type}_${field.key}`
            }
          }))
        ] : []),
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
    console.log('🚀 Attempting to send Flex message...');
    const result = await sendFlexMessage(replyToken, '詳細入力', flexContent);
    if (result) {
      console.log('✅ Flex message sent successfully');
      return true;
    } else {
      throw new Error('sendFlexMessage returned false');
    }
  } catch (error) {
    console.error('❌ Flex message failed, sending simple fallback message:', error);

    // Enhanced error logging
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 500)
      });
    }

    // フォールバック: シンプルなテキストメッセージ
    try {
      await sendReplyMessage(replyToken, `📝 ${config.title}\n\n追加したい項目があれば、詳細を入力してください。\n\n完了したら「保存」と送信してください。`);
      console.log('✅ Fallback text message sent successfully');
    } catch (fallbackError) {
      console.error('❌ Even fallback message failed:', fallbackError);
    }
    return true;
  }
}

/**
 * メニューUIメッセージ
 * @param replyToken 返信トークン
 * @returns 送信成功フラグ
 */
export async function createMenuMessage(replyToken: string): Promise<boolean> {
  const flexContent = {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '📋 FIND to DO メニュー',
          weight: 'bold',
          size: 'xl',
          color: '#333333',
          align: 'center'
        },
        {
          type: 'text',
          text: '作成したいデータの種類を選択してください',
          size: 'sm',
          color: '#666666',
          align: 'center',
          margin: 'md'
        },
        {
          type: 'separator',
          margin: 'lg'
        },
        {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          margin: 'lg',
          contents: [
            {
              type: 'button',
              style: 'primary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '📅 個人予定',
                data: 'start_classification_personal_schedule'
              },
              color: '#4A90E2'
            },
            {
              type: 'button',
              style: 'primary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '🎯 イベント・予定',
                data: 'start_classification_schedule'
              },
              color: '#7ED321'
            },
            {
              type: 'button',
              style: 'primary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '📋 タスク',
                data: 'start_classification_task'
              },
              color: '#F5A623'
            },
            {
              type: 'button',
              style: 'primary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '📊 プロジェクト',
                data: 'start_classification_project'
              },
              color: '#BD10E0'
            },
            {
              type: 'button',
              style: 'primary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '📅 アポイントメント',
                data: 'start_classification_appointment'
              },
              color: '#B8E986'
            },
            {
              type: 'button',
              style: 'primary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '👤 人脈・コネクション',
                data: 'start_classification_contact'
              },
              color: '#50E3C2'
            },
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '📝 メモ・ナレッジ',
                data: 'start_classification_memo'
              },
              color: '#F7ADC3'
            }
          ]
        },
        {
          type: 'separator',
          margin: 'lg'
        },
        {
          type: 'box',
          layout: 'horizontal',
          spacing: 'sm',
          margin: 'md',
          contents: [
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '🔚 セッション終了',
                data: 'end_menu_session'
              },
              flex: 1
            }
          ]
        },
        {
          type: 'text',
          text: '💡 ヒント: メニューセッション中はメンション不要で登録が行えます\n\n途中で終わる場合はセッション終了するか２分でタイムアウトします',
          size: 'xs',
          color: '#999999',
          wrap: true,
          margin: 'md'
        }
      ]
    }
  };

  return await sendFlexMessage(replyToken, 'メニュー', flexContent);
}

/**
 * 担当者選択UIメッセージ
 * @param replyToken 返信トークン
 * @param type データタイプ
 * @returns 送信成功フラグ
 */
export async function createAssigneeSelectionMessage(replyToken: string, type: string): Promise<boolean> {
  try {
    // 既存ユーザーを取得
    const { prismaDataService } = await import('@/lib/database/prisma-service');
    const users = await prismaDataService.getUsers();

    if (users.length === 0) {
      return await sendReplyMessage(replyToken, '❌ 登録済みユーザーが見つかりません。');
    }

    // ユーザー選択ボタンを作成（最大6名まで表示）
    const userButtons = users.slice(0, 6).map(user => ({
      type: 'button',
      style: 'primary',
      height: 'sm',
      action: {
        type: 'postback',
        label: `👤 ${user.name}`,
        data: `select_assignee_${type}_${user.id}`
      }
    }));

    // 縦1列レイアウトでボタンを配置（間隔付き）
    const buttonContents: any[] = [
      {
        type: 'text',
        text: '👤 担当者を選択',
        weight: 'bold',
        size: 'lg',
        color: '#333333'
      },
      {
        type: 'text',
        text: '担当者を選択してください',
        size: 'sm',
        color: '#666666',
        margin: 'sm'
      },
      {
        type: 'separator',
        margin: 'md'
      }
    ];

    // ボタンを間隔をあけて追加
    userButtons.forEach((button, index) => {
      buttonContents.push({
        ...button,
        margin: index === 0 ? 'md' : 'sm'
      });
    });

    buttonContents.push(
      {
        type: 'separator',
        margin: 'md'
      },
      {
        type: 'button',
        style: 'secondary',
        action: {
          type: 'postback',
          label: '⏭️ スキップ',
          data: `skip_assignee_${type}`
        }
      }
    );

    const flexContent = {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: buttonContents
      }
    };

    return await sendFlexMessage(replyToken, '担当者選択', flexContent);
  } catch (error) {
    console.error('Error creating assignee selection message:', error);
    return await sendReplyMessage(replyToken, '❌ 担当者選択画面の作成に失敗しました。');
  }
}

/**
 * 質問メッセージ作成
 * @param replyToken 返信トークン
 * @param type データタイプ
 * @param questionIndex 質問番号
 * @returns 送信成功フラグ
 */
export async function createQuestionMessage(replyToken: string, type: string, questionIndex: number): Promise<boolean> {
  const questionConfigs = {
    schedule: [
      { question: '📅 いつの予定ですか？', placeholder: '例: 明日14時、来週火曜日15:30' },
      { question: '📍 どこで行いますか？', placeholder: '例: 会議室A、オンライン、渋谷オフィス' },
      { question: '👥 誰が参加しますか？', placeholder: '例: 田中さん、営業チーム' },
      { question: '📝 詳細を教えてください', placeholder: '例: 新プロジェクトの打ち合わせ' }
    ],
    task: [
      { question: '📋 どんなタスクですか？', placeholder: '例: 企画書作成、資料整理' },
      { question: '⏰ いつまでに完了ですか？', placeholder: '例: 来週金曜まで、今月末' },
      { question: '🎯 優先度はどのくらいですか？', placeholder: '例: 高、中、低' }
    ],
    project: [
      { question: '📊 プロジェクト名は？', placeholder: '例: 新商品開発、Webサイトリニューアル' },
      { question: '📅 いつ開始予定ですか？', placeholder: '例: 来月、4月1日から' },
      { question: '👥 誰が参加しますか？', placeholder: '例: 開発チーム、田中さん' }
    ],
    contact: [
      { question: '👤 お名前は？', placeholder: '例: 田中太郎' },
      { question: '🏢 どちらの会社ですか？', placeholder: '例: ABC商事、フリーランス' },
      { question: '📍 どこでお会いしましたか？', placeholder: '例: 展示会、紹介' },
      { question: '💼 どんなお仕事ですか？', placeholder: '例: 営業部長、エンジニア' }
    ],
    appointment: [
      { question: '🏢 どちらの会社ですか？', placeholder: '例: ABC商事' },
      { question: '👤 担当者さんのお名前は？', placeholder: '例: 田中太郎' },
      { question: '📞 連絡先を教えてください', placeholder: '例: 03-1234-5678' },
      { question: '📝 面談の目的は？', placeholder: '例: 商品説明、契約相談' }
    ],
    memo: [
      { question: '📝 何についてのメモですか？', placeholder: '例: 会議の気づき、アイデア' },
      { question: '📂 カテゴリはありますか？', placeholder: '例: ビジネス、技術、個人' }
    ]
  };

  const config = questionConfigs[type as keyof typeof questionConfigs];
  if (!config || questionIndex >= config.length) {
    return await sendReplyMessage(replyToken, '質問が見つかりません。');
  }

  const currentQuestion = config[questionIndex];
  
  const flexContent = {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `質問 ${questionIndex + 1}/${config.length}`,
          size: 'sm',
          color: '#666666'
        },
        {
          type: 'text',
          text: currentQuestion.question,
          weight: 'bold',
          size: 'lg',
          margin: 'md'
        },
        {
          type: 'text',
          text: currentQuestion.placeholder,
          size: 'sm',
          color: '#999999',
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
          },
          flex: 1
        }
      ]
    }
  };

  return await sendFlexMessage(replyToken, '質問', flexContent);
}

/**
 * フィールド入力メッセージ
 * @param replyToken 返信トークン
 * @param type データタイプ
 * @param fieldKey フィールドキー
 * @returns 送信成功フラグ
 */
export async function createFieldInputMessage(replyToken: string, type: string, fieldKey: string): Promise<boolean> {
  const fieldConfigs: { [key: string]: { name: string; placeholder: string; hint: string } } = {
    title: { name: 'タイトル', placeholder: '例: 企画書作成、田中さんとの会議', hint: '分かりやすい名前を付けてください' },
    description: { name: '詳細説明', placeholder: '例: 新商品の企画書を作成する', hint: '具体的な内容を入力してください' },
    datetime: { name: '日時', placeholder: '例: 明日14時、2024/12/25 10:00', hint: '日付と時刻を指定してください' },
    location: { name: '場所', placeholder: '例: 会議室A、オンライン、渋谷オフィス', hint: '開催場所を入力してください' },
    priority: { name: '優先度', placeholder: '例: 高、中、低', hint: 'A, B, C, D または 高, 中, 低' },
    deadline: { name: '期限', placeholder: '例: 来週金曜、2024/12/31', hint: '完了期限を入力してください' },
    estimatedHours: { name: '工数', placeholder: '例: 2時間、0.5日', hint: '予想作業時間を入力してください' },
    assignee: { name: '担当者', placeholder: '例: 田中さん、営業チーム', hint: '責任者や担当者を指定してください' }
  };

  const config = fieldConfigs[fieldKey] || { name: fieldKey, placeholder: '値を入力してください', hint: '' };
  
  const flexContent = {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `📝 ${config.name}を入力`,
          weight: 'bold',
          size: 'lg'
        },
        {
          type: 'text',
          text: config.placeholder,
          size: 'sm',
          color: '#999999',
          margin: 'md'
        },
        ...(config.hint ? [{
          type: 'text',
          text: `💡 ${config.hint}`,
          size: 'xs',
          color: '#666666',
          margin: 'sm'
        }] : [])
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
            data: 'cancel_field_input'
          },
          flex: 1
        }
      ]
    }
  };

  return await sendFlexMessage(replyToken, 'フィールド入力', flexContent);
}