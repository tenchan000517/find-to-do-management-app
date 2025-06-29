import { LineWebhookEvent } from './webhook-validator';
import { sendReplyMessage } from './notification';
import sessionManager from './session-manager';
import { getTypeDisplayName } from '@/lib/constants/line-types';

import { saveClassifiedData, updateExistingRecord } from './data-saver';

export async function handlePostback(event: LineWebhookEvent): Promise<void> {
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
    if (data === 'confirm_yes') {
      if (event.replyToken) {
        await sendReplyMessage(event.replyToken, '✅ 確認いただき、ありがとうございます。');
      }
    } else if (data === 'confirm_no') {
      if (event.replyToken) {
        await sendReplyMessage(event.replyToken, '❌ キャンセルされました。');
      }
    } else if (data.startsWith('start_classification_')) {
      // メニューからの分類選択
      const type = data.replace('start_classification_', '');
      console.log('📋 Menu classification selected:', type);
      
      // 直接データセッションを開始（既存セッションがあれば変換、なければ新規作成）
      const existingSession = sessionManager.getSession(event.source.userId, event.source.groupId);
      if (existingSession && existingSession.isMenuSession) {
        sessionManager.convertToDataSession(event.source.userId, event.source.groupId, type);
      } else {
        sessionManager.startSession(event.source.userId, event.source.groupId, type);
      }
      
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
            const { createCompletionMessage } = await import('./notification');
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
          const { createReclassificationMessage } = await import('./notification');
          await createReclassificationMessage(event.replyToken);
        }
      }
    } else if (data === 'show_modification_ui') {
      // 修正UIカルーセル表示
      if (event.replyToken) {
        const { createDetailedModificationMenu } = await import('./notification');
        const sessionInfo = sessionManager.getSessionInfo(userId, groupId);
        if (sessionInfo) {
          const sessionData = {
            currentType: sessionInfo.type,
            pendingItem: sessionInfo.data || {}
          };
          console.log('🎯 Creating detailed modification menu for:', sessionData);
          await createDetailedModificationMenu(event.replyToken, sessionData);
        } else {
          console.error('❌ No session found for modification UI');
          await sendReplyMessage(event.replyToken, '❌ セッション情報が見つかりません。もう一度お試しください。');
        }
      }
    } else if (data === 'classification_change') {
      // 種類選択画面表示
      if (event.replyToken) {
        const { createReclassificationMessage } = await import('./notification');
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
        const session = sessionManager.getSession(userId, groupId);
        await saveClassifiedData(null, sessionInfo, userId, session?.originalMessage);
        
        // セッションを終了
        sessionManager.endSession(userId, groupId);
        console.log('🏁 Session ended after successful reclassification save');
        
        if (event.replyToken) {
          const { createCompletionMessage } = await import('./notification');
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
        const { startDetailedInputFlow } = await import('./notification');
        await startDetailedInputFlow(event.replyToken, actualType);
      }
    } else if (data.startsWith('start_questions_')) {
      // 質問開始
      const [, , type, indexStr] = data.split('_');
      const questionIndex = parseInt(indexStr);
      if (event.replyToken) {
        const { createQuestionMessage } = await import('./notification');
        await createQuestionMessage(event.replyToken, type, questionIndex);
      }
    } else if (data.startsWith('skip_question_')) {
      // 質問スキップ
      const [, , type, indexStr] = data.split('_');
      const nextIndex = parseInt(indexStr) + 1;
      if (event.replyToken) {
        const { createQuestionMessage } = await import('./notification');
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
    } else if (data.startsWith('modify_field_')) {
      // 項目修正
      const parts = data.split('_');
      const fieldKey = parts[parts.length - 1]; // 最後の要素がfieldKey
      const type = parts.slice(2, -1).join('_'); // modify_field_の後から最後の要素までがtype
      
      // 担当者フィールドの場合は専用UI表示
      if (fieldKey === 'assignee') {
        if (event.replyToken) {
          const { createAssigneeSelectionMessage } = await import('./notification');
          await createAssigneeSelectionMessage(event.replyToken, type);
        }
      } else if (fieldKey === 'priority') {
        // 優先度フィールドの場合は専用UI表示
        if (event.replyToken) {
          const { createPrioritySelectionMessage } = await import('./notification');
          await createPrioritySelectionMessage(event.replyToken, type);
        }
      } else {
        // 通常のフィールド入力
        sessionManager.setCurrentField(event.source.userId, event.source.groupId, fieldKey);
        if (event.replyToken) {
          const { createFieldInputMessage } = await import('./notification');
          await createFieldInputMessage(event.replyToken, type, fieldKey);
        }
      }
    } else if (data.startsWith('add_field_')) {
      // 項目追加
      const parts = data.split('_');
      const fieldKey = parts[parts.length - 1]; // 最後の要素がfieldKey
      const type = parts.slice(2, -1).join('_'); // add_field_の後から最後の要素までがtype
      
      // 担当者フィールドの場合は専用UI表示
      if (fieldKey === 'assignee') {
        if (event.replyToken) {
          const { createAssigneeSelectionMessage } = await import('./notification');
          await createAssigneeSelectionMessage(event.replyToken, type);
        }
      } else if (fieldKey === 'priority') {
        // 優先度フィールドの場合は専用UI表示
        if (event.replyToken) {
          const { createPrioritySelectionMessage } = await import('./notification');
          await createPrioritySelectionMessage(event.replyToken, type);
        }
      } else {
        // 現在入力中フィールドを設定
        sessionManager.setCurrentField(event.source.userId, event.source.groupId, fieldKey);
        
        if (event.replyToken) {
          const { createFieldInputMessage } = await import('./notification');
          await createFieldInputMessage(event.replyToken, type, fieldKey);
        }
      }
    } else if (data.startsWith('skip_field_')) {
      // 項目スキップ
      const parts = data.split('_');
      const fieldKey = parts[parts.length - 1]; // 最後の要素がfieldKey
      const type = parts.slice(2, -1).join('_'); // skip_field_の後から最後の要素までがtype
      if (event.replyToken) {
        // フィールド名の日本語マッピング
        const fieldLabels: Record<string, string> = {
          title: 'タイトル',
          description: '詳細',
          assignee: '担当者',
          deadline: '期限',
          estimatedHours: '工数',
          location: '場所',
          datetime: '日時'
        };
        const fieldLabel = fieldLabels[fieldKey] || fieldKey;
        
        // ボタン付きのスキップ完了メッセージを送信
        const { sendFlexMessage } = await import('./line-sender');
        const flexContent = {
          type: 'bubble',
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: `⏭️ ${fieldLabel}をスキップ`,
                weight: 'bold',
                size: 'lg',
                color: '#FFA500'
              },
              {
                type: 'text',
                text: `${fieldLabel}の設定をスキップしました。`,
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
                  label: '➕ 追加入力',
                  data: `start_detailed_input_${type}`
                },
                flex: 1
              }
            ]
          }
        };
        
        await sendFlexMessage(event.replyToken, 'スキップ完了', flexContent);
      }
    } else if (data.startsWith('back_to_selection_')) {
      // 項目選択に戻る
      const type = data.replace('back_to_selection_', '');
      if (event.replyToken) {
        const { startDetailedInputFlow } = await import('./notification');
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
              const internalFields = ['confidence', 'method', 'id', 'createdAt', 'updatedAt', 'userId', 'createdBy', 'assignedTo', 'projectId', 'estimatedHours', 'resourceWeight', 'aiIssueLevel', 'difficultyScore'];
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
        
        const typeText = getTypeDisplayName(type, type);
        const title = sessionData?.data?.title || sessionData?.data?.name || sessionData?.data?.summary || '';
        const itemName = title ? `「${title}」` : '';
        
        // エンティティ別ダッシュボードURL生成
        const getDashboardUrl = (entityType: string): string => {
          const baseUrl = 'https://find-to-do-management-app.vercel.app';
          switch (entityType) {
            case 'personal_schedule':
            case 'calendar_event':
              return `${baseUrl}/calendar`;
            case 'task':
              return `${baseUrl}/tasks`;
            case 'appointment':
              return `${baseUrl}/appointments`;
            case 'project':
              return `${baseUrl}/projects`;
            case 'connection':
              return `${baseUrl}/connections`;
            case 'knowledge_item':
              return `${baseUrl}/knowledge`;
            default:
              return baseUrl;
          }
        };
        
        // ボタン付きの完了メッセージを送信
        const { sendFlexMessage } = await import('./line-sender');
        const flexContent = {
          type: 'bubble',
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '✅ 保存完了',
                weight: 'bold',
                size: 'xl',
                color: '#00C851',
                margin: 'md'
              },
              {
                type: 'text',
                text: `${typeText}${itemName}を保存しました！${savedFields}`,
                wrap: true,
                color: '#333333',
                size: 'md',
                margin: 'md'
              },
              {
                type: 'text',
                text: '追加で詳細を編集したい場合は、ダッシュボードからお気軽にどうぞ。',
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
                color: '#1E90FF',
                action: {
                  type: 'uri',
                  label: '📊 ダッシュボード',
                  uri: getDashboardUrl(type)
                },
                flex: 1
              }
            ]
          }
        };
        
        await sendFlexMessage(event.replyToken, '保存完了', flexContent);
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
        
        // ボタン付きの設定完了メッセージを送信
        const { sendFlexMessage } = await import('./line-sender');
        const flexContent = {
          type: 'bubble',
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '✅ 担当者設定完了',
                weight: 'bold',
                size: 'lg',
                color: '#00C851'
              },
              {
                type: 'text',
                text: `担当者「${userName}」を設定しました！`,
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
                  label: '➕ 追加入力',
                  data: `start_detailed_input_${type}`
                },
                flex: 1
              }
            ]
          }
        };
        
        await sendFlexMessage(event.replyToken, '設定完了', flexContent);
      }
    } else if (data.startsWith('select_priority_')) {
      // 優先度選択
      const parts = data.split('_');
      const priorityLevel = parts[parts.length - 1]; // 最後の要素が優先度レベル
      const type = parts.slice(2, -1).join('_'); // select_priority_の後から最後の要素までがtype
      
      // セッションに優先度を保存
      sessionManager.saveFieldData(event.source.userId, event.source.groupId, 'priority', priorityLevel);
      
      if (event.replyToken) {
        const priorityLabels: Record<string, string> = { 'A': '高', 'B': '中', 'C': '低', 'D': '最低' };
        const priorityLabel = priorityLabels[priorityLevel] || priorityLevel;
        
        // ボタン付きの設定完了メッセージを送信
        const { sendFlexMessage } = await import('./line-sender');
        const flexContent = {
          type: 'bubble',
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '✅ 優先度設定完了',
                weight: 'bold',
                size: 'lg',
                color: '#00C851'
              },
              {
                type: 'text',
                text: `優先度「${priorityLabel}」を設定しました！`,
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
                  label: '➕ 追加入力',
                  data: `start_detailed_input_${type}`
                },
                flex: 1
              }
            ]
          }
        };
        
        await sendFlexMessage(event.replyToken, '設定完了', flexContent);
      }
    } else if (data.startsWith('skip_priority_')) {
      // 優先度スキップ
      const type = data.replace('skip_priority_', '');
      
      if (event.replyToken) {
        // ボタン付きのスキップ完了メッセージを送信
        const { sendFlexMessage } = await import('./line-sender');
        const flexContent = {
          type: 'bubble',
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '⏭️ 優先度をスキップ',
                weight: 'bold',
                size: 'lg',
                color: '#FFA500'
              },
              {
                type: 'text',
                text: '優先度の設定をスキップしました。',
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
                  label: '➕ 追加入力',
                  data: `start_detailed_input_${type}`
                },
                flex: 1
              }
            ]
          }
        };
        
        await sendFlexMessage(event.replyToken, 'スキップ完了', flexContent);
      }
    } else if (data.startsWith('skip_assignee_')) {
      // 担当者スキップ
      const type = data.replace('skip_assignee_', '');
      
      if (event.replyToken) {
        // ボタン付きのスキップ完了メッセージを送信
        const { sendFlexMessage } = await import('./line-sender');
        const flexContent = {
          type: 'bubble',
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '⏭️ 担当者をスキップ',
                weight: 'bold',
                size: 'lg',
                color: '#FFA500'
              },
              {
                type: 'text',
                text: '担当者の設定をスキップしました。',
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
                  label: '➕ 追加入力',
                  data: `start_detailed_input_${type}`
                },
                flex: 1
              }
            ]
          }
        };
        
        await sendFlexMessage(event.replyToken, 'スキップ完了', flexContent);
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
    } else if (data.startsWith('confirm_save_')) {
      // 保存確認
      const type = data.replace('confirm_save_', '');
      
      // セッション情報を取得（終了前）
      const sessionInfo = sessionManager.getSessionInfo(event.source.userId, event.source.groupId);
      
      if (sessionInfo) {
        // 🔧 FIX: 保存済みかチェック
        if (sessionInfo.savedToDb) {
          console.log('📝 既に保存済みデータを更新:', sessionInfo.dbRecordId);
          await updateExistingRecord(sessionInfo.dbRecordId!, sessionInfo, event.source.userId);
        } else {
          console.log('💾 新規データを保存');
          const recordId = await saveClassifiedData(null, sessionInfo, event.source.userId);
          if (recordId) {
            sessionManager.markAsSaved(event.source.userId, event.source.groupId, recordId);
          }
        }
        
        // セッション終了
        sessionManager.endSession(event.source.userId, event.source.groupId);
        
        if (event.replyToken) {
          const { createCompletionMessage } = await import('./notification');
          await createCompletionMessage(event.replyToken, type, { title: sessionInfo.data.title || sessionInfo.data.name || sessionInfo.data.summary });
        }
      } else {
        console.error('❌ No session found for save confirmation');
        if (event.replyToken) {
          await sendReplyMessage(event.replyToken, '❌ データの保存に失敗しました。セッション情報が見つかりません。');
        }
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