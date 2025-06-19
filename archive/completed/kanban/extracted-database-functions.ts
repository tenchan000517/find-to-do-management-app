// ==================================================
// DATABASE OPERATION FUNCTIONS EXTRACTED FROM route.ts
// Lines 991-1439 (448 lines total)
// ==================================================

import { PrismaClient } from '@prisma/client';
import { getJSTISOString, getJSTNow, getJSTTimestampForID } from '@/lib/utils/datetime-jst';
import { convertPriority } from '@/lib/utils/line-helpers';

// ==================================================
// saveClassifiedData function (lines 991-1261, 271 lines)
// ==================================================

/**
 * データベース保存処理
 * LINEボットから抽出されたデータをPrismaを使ってデータベースに保存する
 * 
 * @param extractedData - AI抽出データ（使用されていない）
 * @param sessionInfo - セッション情報（タイプとデータを含む）
 * @param userId - LINEユーザーID
 * @returns 作成されたレコードのID（成功）またはnull（失敗）
 */
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
            userId: systemUserId, // 個人予定は所有者固定
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
            // 担当者中心設計: 作成者は常に記録、担当者は作成者がデフォルト
            createdBy: systemUserId,
            assignedTo: (finalData.assignee && finalData.assignee !== 'null') ? 
                       (finalData.assignee.startsWith('user_') ? finalData.assignee : `user_${finalData.assignee}`)
                       : systemUserId, // デフォルト：作成者が担当者
            // Legacy field（後方互換性）
            userId: null,
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
            status: 'IDEA',
            priority: (finalData.priority === 'null' || !finalData.priority) ? 'C' : convertPriority(finalData.priority),
            dueDate: taskParsedDueDate,
            estimatedHours: finalData.estimatedHours || 0,
            resourceWeight: finalData.resourceWeight || 0.5,
            aiIssueLevel: finalData.issueLevel || 'MEDIUM',
            // 担当者中心設計: 作成者は常に記録、担当者は作成者がデフォルト
            createdBy: systemUserId,
            assignedTo: (finalData.assignee && finalData.assignee !== 'null') ? 
                       (finalData.assignee.startsWith('user_') ? finalData.assignee : `user_${finalData.assignee}`)
                       : systemUserId, // デフォルト：作成者が担当者
            // Legacy field（後方互換性）
            userId: systemUserId,
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
            // 担当者中心設計: 作成者は常に記録、担当者は作成者がデフォルト
            createdBy: systemUserId,
            assignedTo: (finalData.assignee && finalData.assignee !== 'null') ? 
                       (finalData.assignee.startsWith('user_') ? finalData.assignee : `user_${finalData.assignee}`)
                       : systemUserId, // デフォルト：作成者がプロジェクトマネージャー
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
            // 担当者中心設計: 作成者は常に記録、担当者は作成者がデフォルト
            createdBy: systemUserId,
            assignedTo: (finalData.assignee && finalData.assignee !== 'null') ? 
                       (finalData.assignee.startsWith('user_') ? finalData.assignee : `user_${finalData.assignee}`)
                       : systemUserId, // デフォルト：作成者が関係構築担当者
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
            // 担当者中心設計: 作成者は常に記録、担当者は作成者がデフォルト
            createdBy: systemUserId,
            assignedTo: (finalData.assignee && finalData.assignee !== 'null') ? 
                       (finalData.assignee.startsWith('user_') ? finalData.assignee : `user_${finalData.assignee}`)
                       : systemUserId, // デフォルト：作成者が営業担当者
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
            tags: finalData.tags || [],
            updatedAt: new Date(getJSTNow()),
            // 担当者中心設計: 作成者は常に記録、担当者は作成者がデフォルト
            createdBy: systemUserId,
            assignedTo: (finalData.assignee && finalData.assignee !== 'null') ? 
                       (finalData.assignee.startsWith('user_') ? finalData.assignee : `user_${finalData.assignee}`)
                       : systemUserId, // デフォルト：作成者が管理担当者
            // Legacy field（後方互換性）
            author: systemUserId,
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

// ==================================================
// updateExistingRecord function (lines 1263-1439, 177 lines)
// ==================================================

/**
 * 既存レコード更新処理
 * 既存のデータベースレコードを新しいセッション情報で更新する
 * 
 * @param recordId - 更新対象のレコードID
 * @param sessionInfo - セッション情報（タイプとデータを含む）
 * @param _userId - LINEユーザーID（未使用）
 */
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

// ==================================================
// HELPER FUNCTIONS AND UTILITIES
// ==================================================

/**
 * データベースレコード取得のヘルパー関数
 * Postbackイベント処理から抽出されたデータ取得ロジック
 */
async function getRecordById(recordId: string): Promise<any | null> {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    console.log('📊 実際のデータ取得開始:', recordId);
    
    let actualSavedData = null;
    
    // recordIdからタイプを推定してデータを取得
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
    return actualSavedData;
    
  } catch (error) {
    console.error('❌ 保存されたデータ取得エラー:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * フィールド名の日本語マッピング
 * データ表示用のフィールド名変換マップ
 */
const FIELD_NAMES_JP: Record<string, string> = {
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

/**
 * 優先度マッピング
 * 優先度の日本語表示用マップ
 */
const PRIORITY_MAP_JP: Record<string, string> = { 
  'A': '高', 
  'B': '中', 
  'C': '低', 
  'D': '最低' 
};

/**
 * データ表示フォーマット用ヘルプ関数
 * セッションデータと保存データを組み合わせて表示用にフォーマット
 */
function formatDataForDisplay(sessionData: Record<string, any>, actualSavedData?: any): string {
  // 表示用データ（セッションデータ優先、保存データをフォールバック）
  const displayData = { 
    ...(actualSavedData || {}), 
    ...sessionData  // セッションデータで上書き
  };
  
  if (Object.keys(displayData).length === 0) {
    return '';
  }
  
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
      const displayName = FIELD_NAMES_JP[key] || key;
      
      // 値の表示形式を調整
      let displayValue = value;
      if (key === 'priority' && typeof value === 'string') {
        // 優先度を日本語に変換
        displayValue = PRIORITY_MAP_JP[value] || value;
      } else if (key === 'isAllDay' && typeof value === 'boolean') {
        displayValue = value ? '終日' : '時間指定';
      }
      
      return `• ${displayName}: ${displayValue}`;
    });
  
  if (meaningfulFields.length > 0) {
    return '\n\n保存された項目:\n' + meaningfulFields.join('\n');
  }
  
  return '';
}

// ==================================================
// EXPORT STATEMENTS
// ==================================================

export {
  saveClassifiedData,
  updateExistingRecord,
  getRecordById,
  formatDataForDisplay,
  FIELD_NAMES_JP,
  PRIORITY_MAP_JP
};

// ==================================================
// SUPPORTED DATA TYPES DOCUMENTATION
// ==================================================

/**
 * サポートされているデータタイプ:
 * 
 * 1. personal_schedule / personal - 個人予定
 *    - personal_schedules テーブル
 *    - フィールド: title, date, time, endTime, description, location, userId, priority, isAllDay
 * 
 * 2. schedule - パブリック予定・イベント
 *    - calendar_events テーブル  
 *    - フィールド: title, date, time, type, description, participants, location, createdBy, assignedTo
 * 
 * 3. task - タスク
 *    - tasks テーブル
 *    - フィールド: title, description, projectId, status, priority, dueDate, estimatedHours, resourceWeight, aiIssueLevel, createdBy, assignedTo, userId
 * 
 * 4. project - プロジェクト
 *    - projects テーブル
 *    - フィールド: name, description, status, startDate, endDate, priority, teamMembers, createdBy, assignedTo
 * 
 * 5. contact - 人脈・コネクション
 *    - connections テーブル
 *    - フィールド: name, date, location, company, position, type, description, conversation, potential, businessCard, createdBy, assignedTo
 * 
 * 6. appointment - アポイントメント
 *    - appointments テーブル
 *    - フィールド: companyName, contactName, phone, email, nextAction, notes, priority, createdBy, assignedTo
 * 
 * 7. memo - メモ・ナレッジ
 *    - knowledge_items テーブル
 *    - フィールド: title, category, content, tags, createdBy, assignedTo, author
 */