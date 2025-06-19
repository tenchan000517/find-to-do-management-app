import { getJSTNow, getJSTTimestampForID } from '@/lib/utils/datetime-jst';
import { convertPriority } from '@/lib/utils/line-helpers';

export async function saveClassifiedData(
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
          const { dateTimeParser } = await import('./datetime-parser');
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
          const { dateTimeParser } = await import('./datetime-parser');
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
          const { dateTimeParser } = await import('./datetime-parser');
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

export async function updateExistingRecord(
  recordId: string,
  sessionInfo: { type: string; data: Record<string, any> },
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
          const { dateTimeParser } = await import('./datetime-parser');
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
          const { dateTimeParser } = await import('./datetime-parser');
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
          const { dateTimeParser } = await import('./datetime-parser');
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