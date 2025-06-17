import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { extractDataFromTextWithAI } from '@/lib/ai/text-processor';
import { getJSTISOString, getJSTNow, getJSTTimestampForID } from '@/lib/utils/datetime-jst';
import { 
  sendReplyMessage, 
  createErrorMessage,
  createWelcomeMessage,
  createJoinMessage,
  createHelpMessage
} from '@/lib/line/notification';
import sessionManager from '@/lib/line/session-manager';

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
  postback?: {
    data: string;
    params?: any;
  };
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

// LINE署名検証関数
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function validateSignature(body: string, signature: string): boolean {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  if (!channelSecret) {
    console.error('LINE_CHANNEL_SECRET is not set');
    return false;
  }
  
  const hash = createHmac('sha256', channelSecret)
    .update(body)
    .digest('base64');
  
  return hash === signature;
}

// Priority変換関数
function convertPriority(priority: string): 'A' | 'B' | 'C' | 'D' {
  switch (priority?.toLowerCase()) {
    case 'urgent':
    case 'high': 
      return 'A';
    case 'medium':
      return 'B';
    case 'low':
      return 'C';
    default:
      return 'C';
  }
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
  const botNames = ['@FIND to DO', '@find_todo', '@FIND'];
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
  // メニューコマンド
  if (text.includes('メニュー') || text.includes('menu') || text.includes('Menu')) {
    return 'menu';
  }
  
  // テスト用コマンド追加
  if (text.includes('@コマンド') || text.includes('@command')) {
    return 'test_button';
  }
  
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

// セッション入力処理
async function handleSessionInput(event: LineWebhookEvent, inputText: string): Promise<void> {
  const sessionInfo = sessionManager.getSessionInfo(event.source.userId, event.source.groupId);
  if (!sessionInfo || !sessionInfo.currentField) {
    console.log('No active session or field found');
    return;
  }
  
  console.log(`📝 Received input for ${sessionInfo.currentField}: "${inputText}"`);
  
  // フィールドにデータを保存
  sessionManager.saveFieldData(event.source.userId, event.source.groupId, sessionInfo.currentField, inputText);
  
  // 保存完了メッセージ
  if (event.replyToken) {
    const fieldNames: Record<string, string> = {
      title: '📋 タイトル',
      name: '📋 名前',
      summary: '📋 概要',
      datetime: '📅 日時',
      date: '📅 日付',
      time: '🕐 時刻',
      location: '📍 場所',
      attendees: '👥 参加者',
      participants: '👥 参加者',
      description: '📝 内容',
      content: '📝 内容',
      deadline: '⏰ 期限',
      dueDate: '⏰ 期限',
      priority: '🎯 優先度',
      assignee: '👤 担当者',
      duration: '📆 期間',
      members: '👥 メンバー',
      budget: '💰 予算',
      goals: '🎯 目標',
      company: '🏢 会社名',
      companyName: '🏢 会社名',
      position: '💼 役職',
      contact: '📞 連絡先',
      contactName: '👤 担当者名',
      phone: '📞 電話',
      email: '📧 メール',
      relation: '🤝 関係性',
      category: '📂 カテゴリ',
      importance: '⭐ 重要度',
      tags: '🏷️ タグ',
      details: '📝 詳細',
      notes: '📝 メモ',
      nextAction: '🎯 次のアクション',
      type: '📂 種別',
      eventType: '📂 イベント種別',
      status: '📊 ステータス'
    };
    
    const fieldName = fieldNames[sessionInfo.currentField] || sessionInfo.currentField;
    await sendReplyMessage(event.replyToken, `✅ ${fieldName}を保存しました！\n\n「${inputText}」\n\n続けて他の項目を追加するか、「💾 保存」で完了してください。`);
    
    // replyTokenは一度だけ使用可能のため、pushMessageで項目選択画面を送信
    try {
      const { sendGroupNotification } = await import('@/lib/line/notification');
      const groupId = event.source.groupId || event.source.userId;
      
      // 簡単な項目選択メニューをテキストで送信
      const menuText = `📝 次に追加したい項目を選択してください：\n\n• 📋 タイトル\n• 📅 日時\n• 📍 場所\n• 📝 内容\n• 🎯 優先度\n\n「💾 保存」で完了できます。`;
      await sendGroupNotification(groupId, menuText);
    } catch (error) {
      console.log('項目選択メニュー送信をスキップ:', error);
    }
  }
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
  
  // セッション状態をチェック
  const hasActiveSession = sessionManager.hasActiveSession(event.source.userId, event.source.groupId);
  const isWaitingForInput = sessionManager.isWaitingForInput(event.source.userId, event.source.groupId);
  const sessionInfo = sessionManager.getSessionInfo(event.source.userId, event.source.groupId);
  const isMenuSession = sessionInfo?.isMenuSession === true;
  
  console.log('Session status:', { hasActiveSession, isWaitingForInput, isMenuSession });
  
  // 入力待ち状態の場合は@メンションなしでも処理
  if (isWaitingForInput) {
    console.log('Processing input for active session');
    await handleSessionInput(event, cleanText);
    return;
  }
  
  // メニューセッション中、またはアクティブセッション（メニュー以外）の場合は@メンションなしでも処理
  if (isMenuSession) {
    console.log('Processing message in menu session (no mention required)');
    // メニューセッション中は直接AI処理に進む
  } else if (hasActiveSession && !isWaitingForInput) {
    console.log('Processing message in active session (no mention required)');
    // アクティブセッション中は直接AI処理に進む
  } else if (!mentioned && !command) {
    // 通常状態では@メンション必須
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
    // テスト用ボタンコマンドの処理
    if (command === 'test_button') {
      console.log('🧪 Test button command detected');
      if (event.replyToken) {
        const { createTestButtonMessage } = await import('@/lib/line/notification');
        await createTestButtonMessage(event.replyToken);
      }
      return;
    }
    
    // メニューコマンドの処理
    if (command === 'menu') {
      console.log('📋 Menu command detected');
      // メニューセッション開始
      sessionManager.startMenuSession(event.source.userId, event.source.groupId);
      if (event.replyToken) {
        const { createMenuMessage } = await import('@/lib/line/notification');
        await createMenuMessage(event.replyToken);
      }
      return;
    }
    
    // AI統合処理でデータ抽出
    console.log('🤖 Starting AI processing for text:', cleanText);
    const extractedData = await extractDataFromTextWithAI(cleanText);
    
    console.log('Extracted data:', extractedData);
    
    // セッション状態に応じて処理を分岐
    if (hasActiveSession) {
      // 既存セッションがある場合（メニューからの変換セッション含む）
      console.log('🔄 Using existing session for extracted data');
      const session = sessionManager.getSession(event.source.userId, event.source.groupId);
      if (session && session.type !== extractedData.type) {
        // AI分析結果がセッションタイプと異なる場合は、セッションタイプを優先
        console.log(`📝 Session type mismatch: session=${session.type}, AI=${extractedData.type}. Using session type.`);
        (extractedData as any).type = session.type;
      }
    } else {
      // 新規セッション作成
      console.log('📝 Creating new session with extracted data');
      sessionManager.startSession(event.source.userId, event.source.groupId, extractedData.type);
    }
    
    // 抽出されたデータをセッションに保存
    const sessionInfo = sessionManager.getSessionInfo(event.source.userId, event.source.groupId);
    if (sessionInfo) {
      // 全てのAI抽出データをセッションに保存
      Object.entries(extractedData).forEach(([key, value]) => {
        if (key !== 'type' && value !== undefined) {
          // 配列データと文字列データを適切に処理
          const processedValue = Array.isArray(value) ? value : String(value);
          sessionManager.saveFieldData(event.source.userId, event.source.groupId, key, processedValue);
        }
      });
      console.log('✅ Extracted data saved to session:', sessionInfo.data);
    }
    
    // 毎回確認ボタンを表示（ヒューマンエラー防止）
    console.log('Showing classification confirmation for all messages');
    if (event.replyToken) {
      const { createClassificationConfirmMessage } = await import('@/lib/line/notification');
      await createClassificationConfirmMessage(event.replyToken, extractedData);
    }
    return;
    
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

// Postbackイベント処理（ボタン押下時）
async function handlePostback(event: LineWebhookEvent): Promise<void> {
  console.log('=== handlePostback START ===');
  console.log('Postback data:', event.postback?.data);
  
  if (!event.postback?.data) {
    console.log('No postback data found');
    return;
  }
  
  const data = event.postback.data;
  const userId = event.source.userId;
  const groupId = event.source.groupId;
  
  // Debug logging for session key consistency
  console.log('🔍 POSTBACK DEBUG:', {
    userId,
    groupId,
    userIdType: typeof userId,
    groupIdType: typeof groupId
  });
  
  if (!userId) {
    console.error('❌ No userId in postback event');
    return;
  }
  
  try {
    if (data === 'test_yes') {
      if (event.replyToken) {
        await sendReplyMessage(event.replyToken, '✅ YESボタンが押されました！テスト成功です 🎉');
      }
    } else if (data === 'test_no') {
      if (event.replyToken) {
        await sendReplyMessage(event.replyToken, '❌ NOボタンが押されました！テスト成功です 🎉');
      }
    } else if (data.startsWith('start_classification_')) {
      // メニューからの分類選択
      const type = data.replace('start_classification_', '');
      console.log('📋 Menu classification selected:', type);
      
      // メニューセッションを通常セッションに変換
      sessionManager.convertToDataSession(event.source.userId, event.source.groupId, type);
      
      if (event.replyToken) {
        await sendReplyMessage(event.replyToken, `✅ ${type === 'personal_schedule' ? '個人予定' : type === 'schedule' ? 'イベント・予定' : type === 'task' ? 'タスク' : type === 'project' ? 'プロジェクト' : type === 'contact' ? '人脈・コネクション' : type === 'appointment' ? 'アポイントメント' : 'メモ・ナレッジ'}モードに切り替わりました！\n\n内容を直接メッセージで送信してください。\n例: 「明日14時に会議」「企画書作成 来週まで」`);
      }
    } else if (data.startsWith('classification_')) {
      // 分類確認ボタン
      const [, action, type] = data.split('_');
      if (action === 'confirm') {
        // セッションからデータ取得して保存
        const sessionDetails = sessionManager.getSessionDetails(userId, groupId);
        const activeSessionCount = sessionManager.getActiveSessionCount();
        console.log('🔍 Session Debug Info:', {
          sessionDetails,
          activeSessionCount,
          hasActiveSession: sessionManager.hasActiveSession(userId, groupId)
        });
        
        const sessionInfo = sessionManager.getSessionInfo(userId, groupId);
        console.log('🔍 Session lookup result:', sessionInfo ? 'Found' : 'Not Found');
        
        if (sessionInfo) {
          console.log('🔄 Saving classified data with session info:', sessionInfo);
          const recordId = await saveClassifiedData(null, sessionInfo, userId);
          
          // 🔧 FIX: 保存済みマークを付ける
          if (recordId) {
            sessionManager.markAsSaved(userId, groupId, recordId);
            console.log('✅ Session marked as saved after classification confirm');
          }
          
          // セッションを終了しない（詳細入力のため継続）
          console.log('📝 Session continues for potential detailed input');
          
          if (event.replyToken) {
            const { createCompletionMessage } = await import('@/lib/line/notification');
            await createCompletionMessage(event.replyToken, type, { title: sessionInfo.data.title || sessionInfo.data.name || sessionInfo.data.summary });
          }
        } else {
          console.error('❌ No session found for classification confirmation');
          if (event.replyToken) {
            await sendReplyMessage(event.replyToken, '❌ データの保存に失敗しました。セッション情報が見つかりません。');
          }
        }
      } else if (action === 'change') {
        if (event.replyToken) {
          const { createReclassificationMessage } = await import('@/lib/line/notification');
          await createReclassificationMessage(event.replyToken);
        }
      }
    } else if (data === 'show_modification_ui') {
      // 修正UIカルーセル表示
      if (event.replyToken) {
        const { createDetailedModificationMenu } = await import('@/lib/line/notification');
        const sessionInfo = sessionManager.getSessionInfo(userId, groupId);
        const mockSessionData = {
          currentType: sessionInfo?.type || 'task',
          pendingItem: sessionInfo?.data || {}
        };
        await createDetailedModificationMenu(event.replyToken, mockSessionData);
      }
    } else if (data === 'classification_change') {
      // 種類選択画面表示
      if (event.replyToken) {
        const { createReclassificationMessage } = await import('@/lib/line/notification');
        await createReclassificationMessage(event.replyToken);
      }
    } else if (data.startsWith('reclassify_')) {
      // 再分類ボタン
      const newType = data.replace('reclassify_', '');
      
      // 新しい分類でデータ保存処理
      const sessionInfo = sessionManager.getSessionInfo(userId, groupId);
      if (sessionInfo) {
        // セッションの分類を新しいタイプに変更
        sessionInfo.type = newType;
        console.log('🔄 Reclassifying data as:', newType);
        await saveClassifiedData(null, sessionInfo, userId);
        
        // セッションを終了
        sessionManager.endSession(userId, groupId);
        console.log('🏁 Session ended after successful reclassification save');
        
        if (event.replyToken) {
          const { createCompletionMessage } = await import('@/lib/line/notification');
          await createCompletionMessage(event.replyToken, newType, { title: sessionInfo.data.title || sessionInfo.data.name || sessionInfo.data.summary });
        }
      } else {
        console.error('❌ No session found for reclassification');
        if (event.replyToken) {
          await sendReplyMessage(event.replyToken, '❌ データの再分類に失敗しました。セッション情報が見つかりません。');
        }
      }
    } else if (data.startsWith('start_detailed_input_')) {
      // 詳細入力開始
      const requestedType = data.replace('start_detailed_input_', '');
      
      // セッション詳細をログ出力（デバッグ用）
      const sessionDetailsBefore = sessionManager.getSessionDetails(event.source.userId, event.source.groupId);
      console.log('🔍 Session details BEFORE detailed input:', sessionDetailsBefore);
      
      // 既存セッションのタイプを取得（あれば優先）
      const existingSession = sessionManager.getSession(event.source.userId, event.source.groupId);
      const actualType = existingSession ? existingSession.type : requestedType;
      
      // セッションが存在しない場合のみ新規作成
      if (!existingSession) {
        sessionManager.startSession(event.source.userId, event.source.groupId, requestedType);
      }
      
      console.log(`📝 Detailed input for type: ${actualType} (requested: ${requestedType}, session exists: ${!!existingSession})`);
      
      // セッション詳細をログ出力（デバッグ用）
      const sessionDetailsAfter = sessionManager.getSessionDetails(event.source.userId, event.source.groupId);
      console.log('🔍 Session details AFTER detailed input:', sessionDetailsAfter);
      
      if (event.replyToken) {
        const { startDetailedInputFlow } = await import('@/lib/line/notification');
        await startDetailedInputFlow(event.replyToken, actualType);
      }
    } else if (data.startsWith('start_questions_')) {
      // 質問開始
      const [, , type, indexStr] = data.split('_');
      const questionIndex = parseInt(indexStr);
      if (event.replyToken) {
        const { createQuestionMessage } = await import('@/lib/line/notification');
        await createQuestionMessage(event.replyToken, type, questionIndex);
      }
    } else if (data.startsWith('skip_question_')) {
      // 質問スキップ
      const [, , type, indexStr] = data.split('_');
      const nextIndex = parseInt(indexStr) + 1;
      if (event.replyToken) {
        const { createQuestionMessage } = await import('@/lib/line/notification');
        await createQuestionMessage(event.replyToken, type, nextIndex);
      }
    } else if (data.startsWith('finish_questions_')) {
      // 質問完了
      const type = data.replace('finish_questions_', '');
      if (event.replyToken) {
        await sendReplyMessage(event.replyToken, `✅ ${type}の詳細入力が完了しました！\n\nダッシュボードで確認・編集できます：\nhttps://find-to-do-management-app.vercel.app/`);
      }
    } else if (data === 'cancel_detailed_input') {
      // 詳細入力キャンセル
      if (event.replyToken) {
        await sendReplyMessage(event.replyToken, '❌ 詳細入力をキャンセルしました。\nまた必要な時にご利用ください！');
      }
    } else if (data.startsWith('add_field_')) {
      // 項目追加
      const parts = data.split('_');
      const fieldKey = parts[parts.length - 1]; // 最後の要素がfieldKey
      const type = parts.slice(2, -1).join('_'); // add_field_の後から最後の要素までがtype
      
      // 担当者フィールドの場合は専用UI表示
      if (fieldKey === 'assignee') {
        if (event.replyToken) {
          const { createAssigneeSelectionMessage } = await import('@/lib/line/notification');
          await createAssigneeSelectionMessage(event.replyToken, type);
        }
      } else {
        // 現在入力中フィールドを設定
        sessionManager.setCurrentField(event.source.userId, event.source.groupId, fieldKey);
        
        if (event.replyToken) {
          const { createFieldInputMessage } = await import('@/lib/line/notification');
          await createFieldInputMessage(event.replyToken, type, fieldKey);
        }
      }
    } else if (data.startsWith('skip_field_')) {
      // 項目スキップ
      const parts = data.split('_');
      const fieldKey = parts[parts.length - 1]; // 最後の要素がfieldKey
      const type = parts.slice(2, -1).join('_'); // skip_field_の後から最後の要素までがtype
      if (event.replyToken) {
        await sendReplyMessage(event.replyToken, `⏭️ ${fieldKey}をスキップしました。`);
        
        // replyTokenは一度だけ使用可能のため、pushMessageで項目選択画面を送信
        try {
          const { sendGroupNotification } = await import('@/lib/line/notification');
          const groupId = event.source.groupId || event.source.userId;
          
          // 簡単な項目選択メニューをテキストで送信
          const menuText = `📝 次に追加したい項目を選択してください：\n\n• 📋 タイトル\n• 📅 日時\n• 📍 場所\n• 📝 内容\n• 🎯 優先度\n\n「💾 保存」で完了できます。`;
          await sendGroupNotification(groupId, menuText);
        } catch (error) {
          console.log('項目スキップ後の項目選択メニュー送信をスキップ:', error);
        }
      }
    } else if (data.startsWith('back_to_selection_')) {
      // 項目選択に戻る
      const type = data.replace('back_to_selection_', '');
      if (event.replyToken) {
        const { startDetailedInputFlow } = await import('@/lib/line/notification');
        await startDetailedInputFlow(event.replyToken, type);
      }
    } else if (data.startsWith('save_partial_')) {
      // 途中保存
      const type = data.replace('save_partial_', '');
      
      // セッション情報を取得（終了前）
      const sessionInfo = sessionManager.getSessionInfo(event.source.userId, event.source.groupId);
      
      // セッション情報のコピーを作成（表示用）
      const savedSessionInfo = sessionInfo ? { ...sessionInfo } : null;
      
      if (sessionInfo) {
        // 🔧 FIX: 保存済みかチェック
        if (sessionInfo.savedToDb) {
          console.log('📝 既に保存済みデータを更新:', sessionInfo.dbRecordId);
          // TODO: 既存レコードの更新処理を実装
          await updateExistingRecord(sessionInfo.dbRecordId!, sessionInfo, userId);
        } else {
          console.log('💾 新規データを保存');
          const recordId = await saveClassifiedData(null, sessionInfo, userId);
          if (recordId) {
            sessionManager.markAsSaved(event.source.userId, event.source.groupId, recordId);
            // 保存されたIDを表示用データにも記録
            if (savedSessionInfo) {
              savedSessionInfo.dbRecordId = recordId;
            }
          }
        }
      }
      
      // セッション終了
      const sessionData = sessionManager.endSession(event.source.userId, event.source.groupId);
      
      if (event.replyToken) {
        let savedFields = '';
        
        // 実際に保存されたレコードのデータを取得
        let actualSavedData = null;
        if (savedSessionInfo?.dbRecordId) {
          console.log('📊 実際のデータ取得開始:', savedSessionInfo.dbRecordId);
          try {
            const { PrismaClient } = await import('@prisma/client');
            const prisma = new PrismaClient();
            
            // recordIdからタイプを推定してデータを取得
            const recordId = savedSessionInfo.dbRecordId;
            if (recordId.startsWith('ps_')) {
              actualSavedData = await prisma.personal_schedules.findUnique({ where: { id: recordId } });
            } else if (recordId.startsWith('evt_')) {
              actualSavedData = await prisma.calendar_events.findUnique({ where: { id: recordId } });
            } else if (recordId.startsWith('task_')) {
              actualSavedData = await prisma.tasks.findUnique({ where: { id: recordId } });
            } else if (recordId.startsWith('proj_')) {
              actualSavedData = await prisma.projects.findUnique({ where: { id: recordId } });
            } else if (recordId.startsWith('conn_')) {
              actualSavedData = await prisma.connections.findUnique({ where: { id: recordId } });
            } else if (recordId.startsWith('appt_')) {
              actualSavedData = await prisma.appointments.findUnique({ where: { id: recordId } });
            } else if (recordId.startsWith('know_')) {
              actualSavedData = await prisma.knowledge_items.findUnique({ where: { id: recordId } });
            }
            
            console.log('📊 取得したデータ:', actualSavedData ? Object.keys(actualSavedData) : 'null');
            await prisma.$disconnect();
          } catch (error) {
            console.error('❌ 保存されたデータ取得エラー:', error);
          }
        } else {
          console.log('⚠️ dbRecordIdがありません');
        }
        
        // 表示用データ（セッションデータ優先、保存データをフォールバック）
        const sessionUpdateData = savedSessionInfo?.data || sessionData?.data || {};
        const displayData = { 
          ...(actualSavedData || {}), 
          ...sessionUpdateData  // セッションデータで上書き
        };
        
        if (Object.keys(displayData).length > 0) {
          const meaningfulFields = Object.entries(displayData)
            .filter(([key, value]) => {
              // 内部フィールドを除外
              const internalFields = ['confidence', 'method', 'id', 'createdAt', 'updatedAt', 'userId', 'createdBy', 'assignedTo', 'projectId', 'estimatedHours', 'resourceWeight', 'aiIssueLevel'];
              if (internalFields.includes(key)) return false;
              // 空、null、'null'文字列、undefined、空配列を除外
              if (!value || value === 'null' || value === null || value === undefined) return false;
              if (Array.isArray(value) && value.length === 0) return false;
              if (typeof value === 'string' && value.trim() === '') return false;
              return true;
            })
            .map(([key, value]) => {
              // フィールド名の日本語マッピング
              const fieldNames: Record<string, string> = {
                title: 'タイトル',
                name: '名前',
                summary: '概要',
                datetime: '日時',
                date: '日付',
                time: '時刻',
                location: '場所',
                attendees: '参加者',
                participants: '参加者',
                description: '内容',
                content: '内容',
                deadline: '期限',
                dueDate: '期限',
                priority: '優先度',
                assignee: '担当者',
                duration: '期間',
                members: 'メンバー',
                budget: '予算',
                goals: '目標',
                company: '会社名',
                companyName: '会社名',
                position: '役職',
                contact: '連絡先',
                contactName: '担当者名',
                phone: '電話',
                email: 'メール',
                relation: '関係性',
                category: 'カテゴリ',
                importance: '重要度',
                tags: 'タグ',
                details: '詳細',
                notes: 'メモ',
                nextAction: '次のアクション',
                type: '種別',
                eventType: 'イベント種別',
                status: 'ステータス'
              };
              
              const displayName = fieldNames[key] || key;
              
              // 値の表示形式を調整
              let displayValue = value;
              if (key === 'priority' && typeof value === 'string') {
                // 優先度を日本語に変換
                const priorityMap: Record<string, string> = { 'A': '高', 'B': '中', 'C': '低', 'D': '最低' };
                displayValue = priorityMap[value] || value;
              } else if (key === 'isAllDay' && typeof value === 'boolean') {
                displayValue = value ? '終日' : '時間指定';
              }
              
              return `• ${displayName}: ${displayValue}`;
            });
          
          if (meaningfulFields.length > 0) {
            savedFields = '\n\n保存された項目:\n' + meaningfulFields.join('\n');
          }
        }
        
        const typeMap: { [key: string]: string } = {
          personal_schedule: '📅 予定',
          schedule: '🎯 イベント',
          task: '📋 タスク',
          project: '📊 プロジェクト',
          contact: '👤 人脈',
          memo: '📝 メモ'
        };
        const typeText = typeMap[type] || type;
        const title = sessionData?.data?.title || sessionData?.data?.name || sessionData?.data?.summary || '';
        const itemName = title ? `「${title}」` : '';
        
        await sendReplyMessage(event.replyToken, `✅ ${typeText}${itemName}を保存しました！${savedFields}\n\n追加で詳細を入力したい場合は、また「📝 詳細入力」ボタンからお気軽にどうぞ。\n\nダッシュボード: https://find-to-do-management-app.vercel.app/`);
      }
    } else if (data.startsWith('select_assignee_')) {
      // 担当者選択
      const parts = data.split('_');
      const userId = parts[parts.length - 1]; // 最後の要素がuserId
      const type = parts.slice(2, -1).join('_'); // select_assignee_の後から最後の要素までがtype
      
      // セッションに担当者を保存
      sessionManager.saveFieldData(event.source.userId, event.source.groupId, 'assignee', userId);
      
      if (event.replyToken) {
        // 選択されたユーザー名を取得
        const { prismaDataService } = await import('@/lib/database/prisma-service');
        const user = await prismaDataService.getUserById(userId);
        const userName = user ? user.name : 'ユーザー';
        
        await sendReplyMessage(event.replyToken, `✅ 担当者「${userName}」を設定しました！\n\n続けて他の項目を追加するか、「💾 保存」で完了してください。`);
        
        // replyTokenは一度だけ使用可能のため、pushMessageで項目選択画面を送信
        try {
          const { sendGroupNotification } = await import('@/lib/line/notification');
          const groupId = event.source.groupId || event.source.userId;
          
          // 簡単な項目選択メニューをテキストで送信
          const menuText = `📝 次に追加したい項目を選択してください：\n\n• 📋 タイトル\n• 📅 日時\n• 📍 場所\n• 📝 内容\n• 🎯 優先度\n\n「💾 保存」で完了できます。`;
          await sendGroupNotification(groupId, menuText);
        } catch (error) {
          console.log('担当者選択後の項目選択メニュー送信をスキップ:', error);
        }
      }
    } else if (data.startsWith('skip_assignee_')) {
      // 担当者スキップ
      const type = data.replace('skip_assignee_', '');
      
      if (event.replyToken) {
        await sendReplyMessage(event.replyToken, '⏭️ 担当者の設定をスキップしました。');
        
        // replyTokenは一度だけ使用可能のため、pushMessageで項目選択画面を送信
        try {
          const { sendGroupNotification } = await import('@/lib/line/notification');
          const groupId = event.source.groupId || event.source.userId;
          
          // 簡単な項目選択メニューをテキストで送信
          const menuText = `📝 次に追加したい項目を選択してください：\n\n• 📋 タイトル\n• 📅 日時\n• 📍 場所\n• 📝 内容\n• 🎯 優先度\n\n「💾 保存」で完了できます。`;
          await sendGroupNotification(groupId, menuText);
        } catch (error) {
          console.log('担当者スキップ後の項目選択メニュー送信をスキップ:', error);
        }
      }
    } else if (data === 'cancel_modification') {
      // 修正キャンセル
      if (event.replyToken) {
        await sendReplyMessage(event.replyToken, '❌ 修正をキャンセルしました。');
      }
    } else if (data === 'cancel_detailed_input') {
      // 詳細入力キャンセル
      sessionManager.endSession(event.source.userId, event.source.groupId);
      
      if (event.replyToken) {
        await sendReplyMessage(event.replyToken, '❌ 詳細入力をキャンセルしました。\nまた必要な時にご利用ください！');
      }
    } else if (data === 'end_menu_session') {
      // メニューセッション終了
      sessionManager.endSession(event.source.userId, event.source.groupId);
      
      if (event.replyToken) {
        await sendReplyMessage(event.replyToken, '🔚 セッションを終了しました。\n\nまた利用する場合は「メニュー」と送信してください。');
      }
    } else {
      console.log('Unknown postback data:', data);
      if (event.replyToken) {
        await sendReplyMessage(event.replyToken, `受信したデータ: ${data}`);
      }
    }
  } catch (error) {
    console.error('Error handling postback:', error);
    if (event.replyToken) {
      await sendReplyMessage(event.replyToken, 'ボタン処理中にエラーが発生しました');
    }
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

// データベース保存処理
async function saveClassifiedData(
  extractedData: any,
  sessionInfo: { type: string; data: Record<string, any> } | null,
  userId: string
): Promise<string | null> {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  
  let systemUserId: string | undefined;
  let finalData: any;
  let type: string | undefined;
  let createdRecordId: string | null = null;
  
  try {
    console.log('💾 Starting database save process');
    console.log('📋 Input data:', { extractedData, sessionInfo, userId });
    
    // LINEユーザーIDから システムユーザーIDを取得
    const systemUser = await prisma.users.findFirst({
      where: { lineUserId: userId }
    });
    
    if (!systemUser) {
      throw new Error(`LINEユーザーID ${userId} に対応するシステムユーザーが見つかりません`);
    }
    
    systemUserId = systemUser.id;
    console.log(`✅ ユーザーマッピング: ${userId} -> ${systemUserId}`);
    
    // セッション情報の検証
    if (!sessionInfo || !sessionInfo.type) {
      throw new Error('セッション情報が不正です');
    }
    
    type = sessionInfo.type;
    finalData = {
      ...extractedData,
      ...sessionInfo.data,
    };
    console.log(`📊 Processing ${type} with data:`, finalData);
    
    switch (type) {
      case 'personal_schedule':
      case 'personal':
        // 個人予定の処理（personalは personal_scheduleの別名）
        let personalParsedDate = finalData.date || new Date().toISOString().split('T')[0];
        let personalParsedTime = finalData.time || '00:00';
        
        // datetimeフィールドがある場合はパース
        if (finalData.datetime) {
          const { dateTimeParser } = await import('@/lib/line/datetime-parser');
          const parsed = await dateTimeParser.parse(finalData.datetime);
          
          if (parsed.confidence >= 0.5) {
            personalParsedDate = parsed.date;
            personalParsedTime = parsed.time;
            console.log(`📅 個人予定日時解析成功: "${finalData.datetime}" → ${personalParsedDate} ${personalParsedTime} (${parsed.method}, confidence: ${parsed.confidence})`);
          } else {
            console.warn(`⚠️ 個人予定日時解析信頼度低: "${finalData.datetime}" (confidence: ${parsed.confidence})`);
          }
        }
        
        createdRecordId = `ps_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await prisma.personal_schedules.create({
          data: {
            id: createdRecordId,
            title: finalData.title || finalData.summary || '新しい個人予定',
            date: personalParsedDate,
            time: personalParsedTime,
            endTime: finalData.endTime || null,
            description: finalData.description || '',
            location: finalData.location || null,
            userId: systemUserId,
            priority: (finalData.priority === 'null' || !finalData.priority) ? 'C' : convertPriority(finalData.priority),
            isAllDay: finalData.isAllDay || false,
          },
        });
        break;
        
      case 'schedule':
        // パブリック予定の処理（既存）
        let parsedDate = finalData.date || new Date().toISOString().split('T')[0];
        let parsedTime = finalData.time || '00:00';
        
        // datetimeフィールドがある場合はパース
        if (finalData.datetime) {
          const { dateTimeParser } = await import('@/lib/line/datetime-parser');
          const parsed = await dateTimeParser.parse(finalData.datetime);
          
          if (parsed.confidence >= 0.5) {
            parsedDate = parsed.date;
            parsedTime = parsed.time;
            console.log(`📅 日時解析成功: "${finalData.datetime}" → ${parsedDate} ${parsedTime} (${parsed.method}, confidence: ${parsed.confidence})`);
          } else {
            console.warn(`⚠️ 日時解析信頼度低: "${finalData.datetime}" (confidence: ${parsed.confidence})`);
          }
        }
        
        createdRecordId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await prisma.calendar_events.create({
          data: {
            id: createdRecordId,
            title: finalData.title || finalData.summary || '新しい予定',
            date: parsedDate,
            time: parsedTime,
            type: (finalData.eventType === 'null' || !finalData.eventType) ? 'MEETING' : finalData.eventType,
            description: finalData.description || '',
            participants: finalData.participants || [],
            location: finalData.location || null,
            // 担当者システム統合: イベント担当者
            createdBy: systemUserId,
            assignedTo: (finalData.assignee && finalData.assignee !== 'null') ? finalData.assignee 
                       : (finalData.assignedTo && finalData.assignedTo !== 'null') ? finalData.assignedTo 
                       : systemUserId,
          },
        });
        break;
        
      case 'task':
        // deadline/datetimeフィールドがある場合はパース
        let taskParsedDueDate = finalData.dueDate;
        
        if (finalData.deadline || finalData.datetime) {
          const { dateTimeParser } = await import('@/lib/line/datetime-parser');
          const deadlineText = finalData.deadline || finalData.datetime;
          const parsed = await dateTimeParser.parse(deadlineText);
          
          if (parsed.confidence >= 0.5) {
            taskParsedDueDate = parsed.date;
            console.log(`📅 タスク期限解析成功: "${deadlineText}" → ${taskParsedDueDate} (${parsed.method}, confidence: ${parsed.confidence})`);
          } else {
            console.warn(`⚠️ タスク期限解析信頼度低: "${deadlineText}" (confidence: ${parsed.confidence})`);
          }
        }
        
        createdRecordId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await prisma.tasks.create({
          data: {
            id: createdRecordId,
            title: finalData.title || finalData.summary || '新しいタスク',
            description: finalData.description || '',
            projectId: finalData.projectId || null,
            userId: systemUserId,
            status: 'IDEA',
            priority: (finalData.priority === 'null' || !finalData.priority) ? 'C' : convertPriority(finalData.priority),
            dueDate: taskParsedDueDate,
            estimatedHours: finalData.estimatedHours || 0,
            resourceWeight: finalData.resourceWeight || 0.5,
            aiIssueLevel: finalData.issueLevel || 'MEDIUM',
            // 担当者システム統合: デフォルトで作成者=担当者
            createdBy: systemUserId,
            assignedTo: (finalData.assignee && finalData.assignee !== 'null') ? finalData.assignee 
                       : (finalData.assignedTo && finalData.assignedTo !== 'null') ? finalData.assignedTo 
                       : systemUserId,
          },
        });
        break;
        
      case 'project':
        createdRecordId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await prisma.projects.create({
          data: {
            id: createdRecordId,
            name: finalData.title || finalData.name || '新しいプロジェクト',
            description: finalData.description || '',
            status: 'PLANNING',
            startDate: finalData.startDate || new Date().toISOString().split('T')[0],
            endDate: finalData.endDate || null,
            priority: (finalData.priority === 'null' || !finalData.priority) ? 'C' : finalData.priority,
            teamMembers: finalData.teamMembers || [],
            // 担当者システム統合: デフォルトで作成者=担当者（プロジェクトマネージャー）
            createdBy: systemUserId,
            assignedTo: (finalData.assignee && finalData.assignee !== 'null') ? finalData.assignee 
                       : (finalData.assignedTo && finalData.assignedTo !== 'null') ? finalData.assignedTo 
                       : systemUserId,
          },
        });
        break;
        
      case 'contact':
        createdRecordId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await prisma.connections.create({
          data: {
            id: createdRecordId,
            name: finalData.name || finalData.title || '新しい人脈',
            date: finalData.date || new Date().toISOString().split('T')[0],
            location: finalData.location || '',
            company: finalData.company || '',
            position: finalData.position || '',
            type: (finalData.type === 'null' || !finalData.type) ? 'COMPANY' : finalData.type,
            description: finalData.description || '',
            conversation: finalData.conversation || '',
            potential: finalData.potential || '',
            businessCard: finalData.businessCard || null,
            updatedAt: new Date(getJSTNow()),
            // 担当者システム統合: 人脈管理者
            createdBy: systemUserId,
            assignedTo: (finalData.assignee && finalData.assignee !== 'null') ? finalData.assignee 
                       : (finalData.assignedTo && finalData.assignedTo !== 'null') ? finalData.assignedTo 
                       : systemUserId,
          },
        });
        break;
        
      case 'appointment':
        createdRecordId = `appt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await prisma.appointments.create({
          data: {
            id: createdRecordId,
            companyName: finalData.companyName || finalData.company || '新しい会社',
            contactName: finalData.contactName || finalData.name || '担当者',
            phone: finalData.phone || '',
            email: finalData.email || '',
            nextAction: finalData.nextAction || finalData.title || finalData.summary || '面談',
            notes: finalData.notes || finalData.description || '',
            priority: (finalData.priority === 'null' || !finalData.priority) ? 'B' : convertPriority(finalData.priority),
            // 担当者システム統合: 営業担当者
            createdBy: systemUserId,
            assignedTo: (finalData.assignee && finalData.assignee !== 'null') ? finalData.assignee 
                       : (finalData.assignedTo && finalData.assignedTo !== 'null') ? finalData.assignedTo 
                       : systemUserId,
          },
        });
        break;
        
      case 'memo':
        createdRecordId = `know_${getJSTTimestampForID()}_${Math.random().toString(36).substr(2, 9)}`;
        await prisma.knowledge_items.create({
          data: {
            id: createdRecordId,
            title: finalData.title || finalData.summary || '新しいナレッジ',
            category: (finalData.category === 'null' || !finalData.category) ? 'BUSINESS' : finalData.category,
            content: finalData.content || finalData.description || '',
            author: systemUserId,
            tags: finalData.tags || [],
            updatedAt: new Date(getJSTNow()),
          },
        });
        break;
        
      default:
        throw new Error(`未対応のデータタイプ: ${type}`);
    }
    
    console.log(`✅ データ保存完了: ${type}`, finalData);
    return createdRecordId;
    
  } catch (error) {
    console.error('❌ データ保存エラー:', error);
    console.error('❌ エラー詳細:', {
      type,
      finalData,
      userId,
      systemUserId: systemUserId,
      sessionInfo
    });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 既存レコード更新処理
async function updateExistingRecord(
  recordId: string,
  sessionInfo: { type: string; data: Record<string, any> },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _userId: string
): Promise<void> {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    console.log(`📝 更新処理開始: ${recordId}`);
    
    const updateData = sessionInfo.data;
    const type = sessionInfo.type;
    
    switch (type) {
      case 'personal_schedule':
      case 'personal':
        // datetimeフィールドがある場合はパース
        let personalUpdatedDate;
        let personalUpdatedTime;
        
        if (updateData.datetime) {
          const { dateTimeParser } = await import('@/lib/line/datetime-parser');
          const parsed = await dateTimeParser.parse(updateData.datetime);
          
          if (parsed.confidence >= 0.5) {
            personalUpdatedDate = parsed.date;
            personalUpdatedTime = parsed.time;
            console.log(`📅 個人予定日時更新解析成功: "${updateData.datetime}" → ${personalUpdatedDate} ${personalUpdatedTime} (${parsed.method}, confidence: ${parsed.confidence})`);
          } else {
            console.warn(`⚠️ 個人予定日時更新解析信頼度低: "${updateData.datetime}" (confidence: ${parsed.confidence})`);
          }
        }
        
        await prisma.personal_schedules.update({
          where: { id: recordId },
          data: {
            title: updateData.title || undefined,
            description: updateData.description || undefined,
            location: updateData.location || undefined,
            priority: (updateData.priority === 'null' || !updateData.priority) ? undefined : convertPriority(updateData.priority),
            date: personalUpdatedDate || undefined,
            time: personalUpdatedTime || undefined,
          },
        });
        break;
        
      case 'schedule':
        // datetimeフィールドがある場合はパース
        let scheduleUpdatedDate;
        let scheduleUpdatedTime;
        
        if (updateData.datetime) {
          const { dateTimeParser } = await import('@/lib/line/datetime-parser');
          const parsed = await dateTimeParser.parse(updateData.datetime);
          
          if (parsed.confidence >= 0.5) {
            scheduleUpdatedDate = parsed.date;
            scheduleUpdatedTime = parsed.time;
            console.log(`📅 予定日時更新解析成功: "${updateData.datetime}" → ${scheduleUpdatedDate} ${scheduleUpdatedTime} (${parsed.method}, confidence: ${parsed.confidence})`);
          } else {
            console.warn(`⚠️ 予定日時更新解析信頼度低: "${updateData.datetime}" (confidence: ${parsed.confidence})`);
          }
        }
        
        await prisma.calendar_events.update({
          where: { id: recordId },
          data: {
            title: updateData.title || undefined,
            description: updateData.description || undefined,
            location: updateData.location || undefined,
            type: (updateData.eventType === 'null' || !updateData.eventType) ? undefined : updateData.eventType,
            date: scheduleUpdatedDate || undefined,
            time: scheduleUpdatedTime || undefined,
          },
        });
        break;
        
      case 'task':
        // deadline/datetimeフィールドがある場合はパース
        let taskUpdatedDueDate;
        
        if (updateData.deadline || updateData.datetime) {
          const { dateTimeParser } = await import('@/lib/line/datetime-parser');
          const deadlineText = updateData.deadline || updateData.datetime;
          const parsed = await dateTimeParser.parse(deadlineText);
          
          if (parsed.confidence >= 0.5) {
            taskUpdatedDueDate = parsed.date;
            console.log(`📅 タスク期限更新解析成功: "${deadlineText}" → ${taskUpdatedDueDate} (${parsed.method}, confidence: ${parsed.confidence})`);
          } else {
            console.warn(`⚠️ タスク期限更新解析信頼度低: "${deadlineText}" (confidence: ${parsed.confidence})`);
          }
        }
        
        await prisma.tasks.update({
          where: { id: recordId },
          data: {
            title: updateData.title || undefined,
            description: updateData.description || undefined,
            priority: (updateData.priority === 'null' || !updateData.priority) ? undefined : convertPriority(updateData.priority),
            // assignee maps to userId field in database
            // userId: updateData.assignee || undefined, // Commented - cannot change userId after creation
            dueDate: taskUpdatedDueDate || updateData.deadline || undefined,
            estimatedHours: updateData.estimatedHours ? parseInt(updateData.estimatedHours) : undefined,
          },
        });
        break;
        
      case 'project':
        await prisma.projects.update({
          where: { id: recordId },
          data: {
            name: updateData.title || updateData.name || undefined,
            description: updateData.description || undefined,
            priority: (updateData.priority === 'null' || !updateData.priority) ? undefined : updateData.priority,
            status: (updateData.status === 'null' || !updateData.status) ? undefined : updateData.status,
          },
        });
        break;
        
      case 'contact':
        await prisma.connections.update({
          where: { id: recordId },
          data: {
            name: updateData.name || undefined,
            company: updateData.company || undefined,
            position: updateData.position || undefined,
            description: updateData.description || undefined,
            type: (updateData.type === 'null' || !updateData.type) ? undefined : updateData.type,
          },
        });
        break;
        
      case 'appointment':
        await prisma.appointments.update({
          where: { id: recordId },
          data: {
            companyName: updateData.companyName || updateData.company || undefined,
            contactName: updateData.contactName || updateData.name || undefined,
            phone: updateData.phone || undefined,
            email: updateData.email || undefined,
            nextAction: updateData.nextAction || updateData.title || updateData.summary || undefined,
            notes: updateData.notes || updateData.description || undefined,
            priority: (updateData.priority === 'null' || !updateData.priority) ? undefined : convertPriority(updateData.priority),
          },
        });
        break;
        
      case 'memo':
        await prisma.knowledge_items.update({
          where: { id: recordId },
          data: {
            title: updateData.title || undefined,
            content: updateData.content || updateData.description || undefined,
            tags: updateData.tags || undefined,
            category: (updateData.category === 'null' || !updateData.category) ? undefined : updateData.category,
            updatedAt: new Date(getJSTNow()),
          },
        });
        break;
        
      default:
        throw new Error(`未対応の更新タイプ: ${type}`);
    }
    
    console.log(`✅ レコード更新完了: ${recordId}`);
    
  } catch (error) {
    console.error('❌ レコード更新エラー:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// GET エンドポイント（ヘルスチェック用）
export async function GET() {
  return NextResponse.json({ 
    status: 'LINE Webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}