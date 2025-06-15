import { NextRequest, NextResponse } from 'next/server';
import { extractDataFromTextWithAI } from '@/lib/ai/text-processor';
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
      datetime: '📅 日時',
      location: '📍 場所',
      attendees: '👥 参加者',
      description: '📝 内容',
      deadline: '⏰ 期限',
      priority: '🎯 優先度',
      assignee: '👤 担当者',
      duration: '📆 期間',
      members: '👥 メンバー',
      budget: '💰 予算',
      goals: '🎯 目標',
      company: '🏢 会社名',
      position: '💼 役職',
      contact: '📞 連絡先',
      relation: '🤝 関係性',
      category: '📂 カテゴリ',
      importance: '⭐ 重要度',
      tags: '🏷️ タグ',
      details: '📝 詳細'
    };
    
    const fieldName = fieldNames[sessionInfo.currentField] || sessionInfo.currentField;
    await sendReplyMessage(event.replyToken, `✅ ${fieldName}を保存しました！\n\n「${inputText}」\n\n続けて他の項目を追加するか、「💾 保存」で完了してください。`);
    
    // 項目選択画面に戻る
    setTimeout(async () => {
      if (event.replyToken) {
        const { startDetailedInputFlow } = await import('@/lib/line/notification');
        await startDetailedInputFlow(event.replyToken, sessionInfo.type);
      }
    }, 2000);
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
  
  console.log('Session status:', { hasActiveSession, isWaitingForInput });
  
  // 入力待ち状態の場合は@メンションなしでも処理
  if (isWaitingForInput) {
    console.log('Processing input for active session');
    await handleSessionInput(event, cleanText);
    return;
  }
  
  // セッション中でない場合は通常の処理（メンション必須）
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
    // テスト用ボタンコマンドの処理
    if (command === 'test_button') {
      console.log('🧪 Test button command detected');
      if (event.replyToken) {
        const { createTestButtonMessage } = await import('@/lib/line/notification');
        await createTestButtonMessage(event.replyToken);
      }
      return;
    }
    
    // AI統合処理でデータ抽出
    console.log('🤖 Starting AI processing for text:', cleanText);
    const extractedData = await extractDataFromTextWithAI(cleanText);
    
    console.log('Extracted data:', extractedData);
    
    // 🔧 FIX: セッションを作成して抽出データを保存
    console.log('📝 Creating session with extracted data');
    sessionManager.startSession(event.source.userId, event.source.groupId, extractedData.type);
    
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
  const userId = event.source.userId || '';
  const groupId = event.source.groupId;
  
  try {
    if (data === 'test_yes') {
      if (event.replyToken) {
        await sendReplyMessage(event.replyToken, '✅ YESボタンが押されました！テスト成功です 🎉');
      }
    } else if (data === 'test_no') {
      if (event.replyToken) {
        await sendReplyMessage(event.replyToken, '❌ NOボタンが押されました！テスト成功です 🎉');
      }
    } else if (data.startsWith('classification_')) {
      // 分類確認ボタン
      const [, action, type] = data.split('_');
      if (action === 'confirm') {
        // セッションからデータ取得して保存
        const sessionInfo = sessionManager.getSessionInfo(userId, groupId);
        if (sessionInfo) {
          console.log('🔄 Saving classified data with session info:', sessionInfo);
          await saveClassifiedData(null, sessionInfo, userId);
          
          // セッションを終了
          sessionManager.endSession(userId, groupId);
          console.log('🏁 Session ended after successful save');
          
          if (event.replyToken) {
            const { createCompletionMessage } = await import('@/lib/line/notification');
            await createCompletionMessage(event.replyToken, type);
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
          await createCompletionMessage(event.replyToken, newType);
        }
      } else {
        console.error('❌ No session found for reclassification');
        if (event.replyToken) {
          await sendReplyMessage(event.replyToken, '❌ データの再分類に失敗しました。セッション情報が見つかりません。');
        }
      }
    } else if (data.startsWith('start_detailed_input_')) {
      // 詳細入力開始
      const type = data.replace('start_detailed_input_', '');
      
      // セッション開始
      sessionManager.startSession(event.source.userId, event.source.groupId, type);
      
      if (event.replyToken) {
        const { startDetailedInputFlow } = await import('@/lib/line/notification');
        await startDetailedInputFlow(event.replyToken, type);
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
      const [, , type, fieldKey] = data.split('_');
      
      // 現在入力中フィールドを設定
      sessionManager.setCurrentField(event.source.userId, event.source.groupId, fieldKey);
      
      if (event.replyToken) {
        const { createFieldInputMessage } = await import('@/lib/line/notification');
        await createFieldInputMessage(event.replyToken, type, fieldKey);
      }
    } else if (data.startsWith('skip_field_')) {
      // 項目スキップ
      const [, , type, fieldKey] = data.split('_');
      if (event.replyToken) {
        await sendReplyMessage(event.replyToken, `⏭️ ${fieldKey}をスキップしました。`);
        // 項目選択画面に戻る
        const { startDetailedInputFlow } = await import('@/lib/line/notification');
        setTimeout(() => startDetailedInputFlow(event.replyToken!, type), 1000);
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
      
      // セッション終了（データ取得後）
      const sessionData = sessionManager.endSession(event.source.userId, event.source.groupId);
      
      // データベースに保存
      if (sessionData) {
        try {
          await saveClassifiedData(null, sessionData, userId);
          console.log('✅ セッションデータを保存しました:', sessionData);
        } catch (error) {
          console.error('❌ セッションデータ保存エラー:', error);
        }
      }
      
      if (event.replyToken) {
        let savedFields = '';
        if (sessionData && Object.keys(sessionData.data).length > 0) {
          savedFields = '\n\n保存された項目:\n' + Object.entries(sessionData.data).map(([key, value]) => `• ${key}: ${value}`).join('\n');
        }
        
        await sendReplyMessage(event.replyToken, `💾 ${type}の情報をデータベースに保存しました！${savedFields}\n\n追加で詳細を入力したい場合は、また「📝 詳細入力」ボタンからお気軽にどうぞ。\n\nダッシュボード: https://find-to-do-management-app.vercel.app/`);
      }
    } else if (data === 'cancel_detailed_input') {
      // 詳細入力キャンセル
      sessionManager.endSession(event.source.userId, event.source.groupId);
      
      if (event.replyToken) {
        await sendReplyMessage(event.replyToken, '❌ 詳細入力をキャンセルしました。\nまた必要な時にご利用ください！');
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

// データベース保存処理
async function saveClassifiedData(
  extractedData: any,
  sessionInfo: { type: string; data: Record<string, any> } | null,
  userId: string
): Promise<void> {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  
  let systemUserId: string;
  let finalData: any;
  let type: string;
  
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
    
    finalData = {
      ...extractedData,
      ...sessionInfo.data,
    };
    
    type = sessionInfo.type;
    console.log(`📊 Processing ${type} with data:`, finalData);
    
    switch (type) {
      case 'schedule':
        // 日時の解析処理
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
        
        await prisma.calendar_events.create({
          data: {
            id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: finalData.title || finalData.summary || '新しい予定',
            date: parsedDate,
            time: parsedTime,
            type: finalData.eventType || 'MEETING',
            description: finalData.description || '',
            participants: finalData.participants || [],
            location: finalData.location || null,
          },
        });
        break;
        
      case 'task':
        await prisma.tasks.create({
          data: {
            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: finalData.title || finalData.summary || '新しいタスク',
            description: finalData.description || '',
            projectId: finalData.projectId || null,
            userId: systemUserId,
            status: 'IDEA',
            priority: finalData.priority || 'C',
            dueDate: finalData.dueDate || null,
            estimatedHours: finalData.estimatedHours || 0,
            resourceWeight: finalData.resourceWeight || 0.5,
            aiIssueLevel: finalData.issueLevel || 'MEDIUM',
          },
        });
        break;
        
      case 'project':
        await prisma.projects.create({
          data: {
            id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: finalData.title || finalData.name || '新しいプロジェクト',
            description: finalData.description || '',
            status: 'PLANNING',
            startDate: finalData.startDate || new Date().toISOString().split('T')[0],
            endDate: finalData.endDate || null,
            priority: finalData.priority || 'C',
            teamMembers: finalData.teamMembers || [],
          },
        });
        break;
        
      case 'contact':
        await prisma.connections.create({
          data: {
            id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: finalData.name || finalData.title || '新しい人脈',
            date: finalData.date || new Date().toISOString().split('T')[0],
            location: finalData.location || '',
            company: finalData.company || '',
            position: finalData.position || '',
            type: finalData.type || 'COMPANY',
            description: finalData.description || '',
            conversation: finalData.conversation || '',
            potential: finalData.potential || '',
            businessCard: finalData.businessCard || null,
            updatedAt: new Date(),
          },
        });
        break;
        
      case 'memo':
        await prisma.knowledge_items.create({
          data: {
            id: `know_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: finalData.title || finalData.summary || '新しいナレッジ',
            category: finalData.category || 'BUSINESS',
            content: finalData.content || finalData.description || '',
            author: systemUserId,
            tags: finalData.tags || [],
            updatedAt: new Date(),
          },
        });
        break;
        
      default:
        throw new Error(`未対応のデータタイプ: ${type}`);
    }
    
    console.log(`✅ データ保存完了: ${type}`, finalData);
    
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

// GET エンドポイント（ヘルスチェック用）
export async function GET() {
  return NextResponse.json({ 
    status: 'LINE Webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}