import { LineMessage, LineWebhookEvent } from './webhook-validator';
import { extractDataFromTextWithAI } from '@/lib/ai/text-processor';
import sessionManager from './session-manager';
import { sendReplyMessage, createHelpMessage } from './notification';

export function isMentioned(message: LineMessage): boolean {
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

export function cleanMessageText(message: LineMessage): string {
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

export function extractCommand(text: string): string | undefined {
  // メニューコマンド（完全一致または単語として）
  if (text.trim() === 'メニュー' || text.trim() === 'menu' || text.trim() === 'Menu') {
    return 'menu';
  }
  
  // テスト用コマンド追加
  if (text.includes('@コマンド') || text.includes('@command')) {
    return 'test_button';
  }
  
  // その他のコマンドパターンは削除（AI処理で適切に分類されるため）
  return undefined;
}

export async function handleSessionInput(event: LineWebhookEvent, inputText: string): Promise<void> {
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
    
    // 新しいFlexメッセージ形式で送信
    const { sendFlexMessage } = await import('./line-sender');
    const flexContent = {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `✅ ${fieldName}設定完了`,
            weight: 'bold',
            size: 'lg',
            color: '#00C851'
          },
          {
            type: 'text',
            text: `${fieldName}を「${inputText}」に設定しました！`,
            wrap: true,
            color: '#333333',
            size: 'md',
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
              label: '💾 保存',
              data: `save_partial_${sessionInfo.type}`
            },
            flex: 1
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'sm',
            action: {
              type: 'postback',
              label: '➕ 追加入力',
              data: `start_detailed_input_${sessionInfo.type}`
            },
            flex: 1
          }
        ]
      }
    };
    
    await sendFlexMessage(event.replyToken, '設定完了', flexContent);
  }
}

export async function processTextMessage(event: LineWebhookEvent, cleanText: string): Promise<void> {
  console.log('🤖 Starting AI processing for:', cleanText);
  
  try {
    // 既存セッション確認
    const existingSession = sessionManager.getSessionInfo(event.source.userId, event.source.groupId);
    
    if (existingSession) {
      // メニューで分類選択済みの場合：データ抽出のみ行い直接保存
      console.log(`📝 Menu-selected session active: ${existingSession.type}`);
      
      const extracted = await extractDataFromTextWithAI(cleanText);
      console.log('🧠 AI Data Extraction Result:', JSON.stringify(extracted, null, 2));
      
      if (!extracted) {
        console.log('❌ AI extraction failed');
        if (event.replyToken) {
          await sendReplyMessage(event.replyToken, '申し訳ありません。データの解析に失敗しました。もう一度お試しください。');
        }
        return;
      }

      // AIの分析結果をセッションデータにマージ（分類は既存セッションを使用）
      Object.entries(extracted).forEach(([key, value]) => {
        if (key !== 'type' && value !== null && value !== undefined) {
          sessionManager.saveFieldData(event.source.userId, event.source.groupId, key, value);
        }
      });

      // メニュー選択時も分類確認パネルを表示して詳細入力の機会を提供
      const sessionInfo = sessionManager.getSessionInfo(event.source.userId, event.source.groupId);
      
      if (sessionInfo && event.replyToken) {
        console.log('📝 Menu session: showing classification confirmation for detailed input opportunity');
        
        // 分類確認メッセージを表示（詳細入力の機会を提供）
        const { createClassificationConfirmMessage } = await import('./line-flex-ui');
        const extractedData = {
          type: sessionInfo.type,
          title: sessionInfo.data.title,
          description: sessionInfo.data.description,
          ...sessionInfo.data
        };
        
        await createClassificationConfirmMessage(
          event.replyToken,
          extractedData,
          sessionInfo.type,
          true // メニューセッションフラグ
        );
      }
    } else {
      // 通常の分類処理（@メンション時など）
      const extracted = await extractDataFromTextWithAI(cleanText);
      console.log('🧠 AI Analysis Result:', JSON.stringify(extracted, null, 2));
      
      if (!extracted) {
        console.log('❌ AI extraction failed');
        if (event.replyToken) {
          await sendReplyMessage(event.replyToken, '申し訳ありません。メッセージの解析に失敗しました。もう一度お試しください。');
        }
        return;
      }

      // 新規セッション開始
      sessionManager.startSession(
        event.source.userId, 
        event.source.groupId, 
        extracted.type || 'memo'
      );
      console.log('✅ Session started successfully');
      
      // 分類確認メッセージを送信
      if (event.replyToken) {
        const { createClassificationConfirmMessage } = await import('./line-flex-ui');
        await createClassificationConfirmMessage(event.replyToken, extracted, extracted.type, false);
      }
    }
  } catch (error) {
    console.error('❌ Error in AI processing:', error);
    if (event.replyToken) {
      await sendReplyMessage(event.replyToken, 'メッセージの処理中にエラーが発生しました。もう一度お試しください。');
    }
  }
}

export async function handleMessage(event: LineWebhookEvent): Promise<void> {
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
    // メニューコマンドの処理
    if (command === 'menu') {
      console.log('📋 Menu command detected');
      if (event.replyToken) {
        const { createMenuMessage } = await import('./notification');
        await createMenuMessage(event.replyToken);
      }
      return;
    }

    // テスト用ボタンコマンドの処理
    if (command === 'test_button') {
      console.log('🧪 Test button command detected');
      if (event.replyToken) {
        const { createTestButtonMessage } = await import('./notification');
        await createTestButtonMessage(event.replyToken);
      }
      return;
    }

    // AI処理実行
    await processTextMessage(event, cleanText);
    
  } catch (error) {
    console.error('Error in handleMessage:', error);
    if (event.replyToken) {
      await sendReplyMessage(event.replyToken, 'メッセージの処理中にエラーが発生しました。');
    }
  }
}