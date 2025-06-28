# Phase 4: アラート・通知システム - 実装ガイド

**実装期間:** 2週間  
**目標:** インテリジェントアラートシステム実装  
**前提条件:** Phase 3完了、プロジェクト関係性マッピング動作確認済み

---

## 🎯 Phase 4の実装目標

1. **アラートエンジン実装** - 進捗・活動・フェーズ監視
2. **通知配信システム** - LINE・UI統合通知
3. **ユーザーワークロード監視** - QOL考慮アラート
4. **アラート管理UI** - 読み状態・解決管理
5. **自動リマインドシステム** - 定期実行ジョブ

---

## 📋 Phase 4開始前チェックリスト

- [ ] Phase 3完了確認: `docs/PHASE3_PROJECT_RELATIONSHIPS.md` チェックリスト✅
- [ ] 関係性マッピング動作確認: `RelationshipService` テスト実行
- [ ] AI評価エンジン動作確認: `/api/ai/evaluate` テスト
- [ ] アラートテーブル存在確認: `SELECT COUNT(*) FROM project_alerts, user_alerts;`
- [ ] LINE Bot動作確認: 通知送信テスト

---

## 🚨 アラートエンジン実装

### **4.1 総合アラートエンジン**

**src/lib/services/alert-engine.ts（新規作成）:**
```typescript
import { prismaDataService } from '@/lib/database/prisma-service';
import { ProjectAlert, UserAlert, Project, Task, User } from '@/lib/types';

export class AlertEngine {
  
  /**
   * 全プロジェクトのアラートを総合チェック
   */
  async runComprehensiveAlertCheck(): Promise<{
    projectAlerts: ProjectAlert[];
    userAlerts: UserAlert[];
    summary: {
      totalAlerts: number;
      criticalAlerts: number;
      projectsAtRisk: number;
      usersAtRisk: number;
    };
  }> {
    try {
      const allProjectAlerts: ProjectAlert[] = [];
      const allUserAlerts: UserAlert[] = [];
      
      // 1. プロジェクトアラートチェック
      const projects = await prismaDataService.getAllProjects();
      for (const project of projects) {
        const projectAlerts = await this.checkProjectAlerts(project.id);
        allProjectAlerts.push(...projectAlerts);
      }
      
      // 2. ユーザーアラートチェック
      const users = await prismaDataService.getAllUsers();
      for (const user of users) {
        const userAlerts = await this.checkUserAlerts(user.id);
        allUserAlerts.push(...userAlerts);
      }
      
      // 3. サマリー計算
      const summary = {
        totalAlerts: allProjectAlerts.length + allUserAlerts.length,
        criticalAlerts: [...allProjectAlerts, ...allUserAlerts].filter(a => a.severity === 'critical').length,
        projectsAtRisk: new Set(allProjectAlerts.map(a => a.projectId || '')).size,
        usersAtRisk: new Set(allUserAlerts.map(a => a.userId)).size
      };
      
      return {
        projectAlerts: allProjectAlerts,
        userAlerts: allUserAlerts,
        summary
      };
    } catch (error) {
      console.error('Comprehensive alert check failed:', error);
      throw error;
    }
  }

  /**
   * プロジェクト個別アラートチェック
   */
  async checkProjectAlerts(projectId: string): Promise<ProjectAlert[]> {
    try {
      const alerts: ProjectAlert[] = [];
      
      // 並行してチェック実行
      const [
        activityAlerts,
        progressAlerts,
        phaseAlerts
      ] = await Promise.all([
        this.checkActivityStagnation(projectId),
        this.checkProgressStagnation(projectId),
        this.checkPhaseStagnation(projectId)
      ]);
      
      alerts.push(...activityAlerts, ...progressAlerts, ...phaseAlerts);
      
      // アラートをDBに保存
      for (const alert of alerts) {
        await this.createProjectAlert(alert);
      }
      
      return alerts;
    } catch (error) {
      console.error(`Failed to check project alerts for ${projectId}:`, error);
      return [];
    }
  }

  /**
   * アクティビティ停滞チェック
   */
  async checkActivityStagnation(projectId: string): Promise<ProjectAlert[]> {
    try {
      const project = await prismaDataService.getProjectById(projectId);
      if (!project) return [];

      const daysSinceActivity = this.getDaysSince(project.lastActivityDate || project.updatedAt);
      const expectedInterval = this.getExpectedActivityInterval(project);
      
      if (daysSinceActivity > expectedInterval) {
        const severity = daysSinceActivity > expectedInterval * 2 ? 'critical' : 
                        daysSinceActivity > expectedInterval * 1.5 ? 'high' : 'medium';
        
        return [{
          id: this.generateId(),
          projectId,
          alertType: 'activity_stagnation',
          severity,
          message: `${daysSinceActivity}日間アクティビティがありません（期待間隔: ${expectedInterval}日）`,
          isRead: false,
          isResolved: false,
          triggeredAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }];
      }
      
      return [];
    } catch (error) {
      console.error('Activity stagnation check failed:', error);
      return [];
    }
  }

  /**
   * 進捗停滞チェック
   */
  async checkProgressStagnation(projectId: string): Promise<ProjectAlert[]> {
    try {
      const project = await prismaDataService.getProjectById(projectId);
      const tasks = await prismaDataService.getTasksByProjectId(projectId);
      
      if (!project || tasks.length === 0) return [];

      // 最近の進捗変化チェック
      const recentProgressChanges = tasks.filter(task => {
        const daysSinceUpdate = this.getDaysSince(task.updatedAt);
        return daysSinceUpdate <= 7 && task.status !== 'IDEA';
      });

      const stagnationDays = this.getDaysSince(project.updatedAt);
      const expectedProgressInterval = this.getExpectedProgressInterval(project);
      
      if (stagnationDays > expectedProgressInterval && recentProgressChanges.length === 0) {
        const severity = stagnationDays > expectedProgressInterval * 2 ? 'critical' :
                        stagnationDays > expectedProgressInterval * 1.5 ? 'high' : 'medium';
        
        return [{
          id: this.generateId(),
          projectId,
          alertType: 'progress_stagnation',
          severity,
          message: `${stagnationDays}日間進捗更新がありません（期待間隔: ${expectedProgressInterval}日）`,
          isRead: false,
          isResolved: false,
          triggeredAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }];
      }
      
      return [];
    } catch (error) {
      console.error('Progress stagnation check failed:', error);
      return [];
    }
  }

  /**
   * フェーズ停滞チェック
   */
  async checkPhaseStagnation(projectId: string): Promise<ProjectAlert[]> {
    try {
      const project = await prismaDataService.getProjectById(projectId);
      if (!project) return [];

      const daysSincePhaseChange = this.getDaysSince(project.phaseChangeDate || project.createdAt);
      const expectedPhaseDuration = this.getExpectedPhaseDuration(project.phase || 'concept');
      
      if (daysSincePhaseChange > expectedPhaseDuration) {
        const severity = daysSincePhaseChange > expectedPhaseDuration * 2 ? 'critical' : 'high';
        
        return [{
          id: this.generateId(),
          projectId,
          alertType: 'phase_stagnation',
          severity,
          message: `${project.phase}フェーズが${daysSincePhaseChange}日継続中（期待期間: ${expectedPhaseDuration}日）`,
          isRead: false,
          isResolved: false,
          triggeredAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }];
      }
      
      return [];
    } catch (error) {
      console.error('Phase stagnation check failed:', error);
      return [];
    }
  }

  /**
   * ユーザー個別アラートチェック
   */
  async checkUserAlerts(userId: string): Promise<UserAlert[]> {
    try {
      const alerts: UserAlert[] = [];
      
      // 並行してチェック実行
      const [
        workloadAlerts,
        priorityAlerts
      ] = await Promise.all([
        this.checkUserWorkloadRisk(userId),
        this.checkLowPriorityTaskOverload(userId)
      ]);
      
      alerts.push(...workloadAlerts, ...priorityAlerts);
      
      // アラートをDBに保存
      for (const alert of alerts) {
        await this.createUserAlert(alert);
      }
      
      return alerts;
    } catch (error) {
      console.error(`Failed to check user alerts for ${userId}:`, error);
      return [];
    }
  }

  /**
   * ユーザーワークロードリスクチェック
   */
  async checkUserWorkloadRisk(userId: string): Promise<UserAlert[]> {
    try {
      const user = await prismaDataService.getUserById(userId);
      const tasks = await prismaDataService.getTasksByUserId(userId);
      
      if (!user || tasks.length === 0) return [];

      // アクティブタスクの総負荷計算
      const activeTasks = tasks.filter(t => 
        t.status !== 'COMPLETE' && t.status !== 'DELETE'
      );
      
      const totalWeight = activeTasks.reduce((sum, task) => sum + (task.resourceWeight || 1), 0);
      const qolWeight = user.preferences?.qol_weight || 1.0;
      const adjustedLoad = totalWeight / qolWeight;
      
      // 週40時間を基準とした負荷評価
      if (adjustedLoad > 40) {
        const severity = adjustedLoad > 80 ? 'critical' : 
                        adjustedLoad > 60 ? 'high' : 'medium';
        
        return [{
          id: this.generateId(),
          userId,
          alertType: 'workload_risk',
          severity,
          message: `推定ワークロード: ${adjustedLoad.toFixed(1)}時間/週 (QOL調整済み)`,
          relatedEntityType: 'user',
          relatedEntityId: userId,
          isRead: false,
          createdAt: new Date().toISOString()
        }];
      }
      
      return [];
    } catch (error) {
      console.error('Workload risk check failed:', error);
      return [];
    }
  }

  /**
   * C/D項目過多チェック
   */
  async checkLowPriorityTaskOverload(userId: string): Promise<UserAlert[]> {
    try {
      const tasks = await prismaDataService.getTasksByUserId(userId);
      const activeTasks = tasks.filter(t => 
        t.status !== 'COMPLETE' && t.status !== 'DELETE'
      );
      
      if (activeTasks.length === 0) return [];
      
      const lowPriorityTasks = activeTasks.filter(t => 
        t.priority === 'C' || t.priority === 'D' || 
        t.aiIssueLevel === 'C' || t.aiIssueLevel === 'D'
      );
      
      const lowPriorityRatio = lowPriorityTasks.length / activeTasks.length;
      
      if (lowPriorityRatio > 0.7 && activeTasks.length > 5) {
        return [{
          id: this.generateId(),
          userId,
          alertType: 'low_priority_overload',
          severity: 'medium',
          message: `アクティブタスクの${Math.round(lowPriorityRatio * 100)}%がC/D項目です (${lowPriorityTasks.length}/${activeTasks.length}件)`,
          relatedEntityType: 'user',
          relatedEntityId: userId,
          isRead: false,
          createdAt: new Date().toISOString()
        }];
      }
      
      return [];
    } catch (error) {
      console.error('Low priority task overload check failed:', error);
      return [];
    }
  }

  // ===== プライベートメソッド =====

  private async createProjectAlert(alert: ProjectAlert): Promise<void> {
    try {
      // 重複チェック（同じタイプのアラートが既に存在するか）
      const existingAlerts = await prismaDataService.getProjectAlerts(alert.projectId);
      const duplicateAlert = existingAlerts.find(a => 
        a.alertType === alert.alertType && 
        !a.isResolved &&
        this.getDaysSince(a.createdAt) < 1 // 1日以内の重複をチェック
      );
      
      if (!duplicateAlert) {
        await prismaDataService.createProjectAlert(alert);
      }
    } catch (error) {
      console.error('Failed to create project alert:', error);
    }
  }

  private async createUserAlert(alert: UserAlert): Promise<void> {
    try {
      // 重複チェック
      const existingAlerts = await prismaDataService.getUserAlerts(alert.userId);
      const duplicateAlert = existingAlerts.find(a => 
        a.alertType === alert.alertType &&
        this.getDaysSince(a.createdAt) < 1
      );
      
      if (!duplicateAlert) {
        await prismaDataService.createUserAlert(alert);
      }
    } catch (error) {
      console.error('Failed to create user alert:', error);
    }
  }

  private getExpectedActivityInterval(project: any): number {
    const intervals: Record<string, number> = {
      concept: 7,
      planning: 5,
      negotiation: 3,
      proposal: 2,
      closing: 1,
      execution: 3,
      monitoring: 7,
      completion: 14
    };
    return intervals[project.phase] || 7;
  }

  private getExpectedProgressInterval(project: any): number {
    const intervals: Record<string, number> = {
      concept: 14,
      planning: 10,
      negotiation: 7,
      proposal: 5,
      closing: 3,
      execution: 7,
      monitoring: 14,
      completion: 30
    };
    return intervals[project.phase] || 10;
  }

  private getExpectedPhaseDuration(phase: string): number {
    const durations: Record<string, number> = {
      concept: 14,
      planning: 21,
      negotiation: 30,
      proposal: 14,
      closing: 7,
      execution: 90,
      monitoring: 60,
      completion: 7
    };
    return durations[phase] || 30;
  }

  private getDaysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}
```

### **4.2 通知配信システム**

**src/lib/services/notification-service.ts（新規作成）:**
```typescript
import { AlertEngine } from './alert-engine';
import { prismaDataService } from '@/lib/database/prisma-service';
import { ProjectAlert, UserAlert, Project, User } from '@/lib/types';

export class NotificationService {
  private alertEngine: AlertEngine;
  
  constructor() {
    this.alertEngine = new AlertEngine();
  }
  
  /**
   * アラートに基づく通知配信（メイン処理）
   */
  async sendAlertNotifications(): Promise<{
    processed: number;
    lineSent: number;
    uiUpdated: number;
    errors: string[];
  }> {
    try {
      const results = {
        processed: 0,
        lineSent: 0,
        uiUpdated: 0,
        errors: [] as string[]
      };

      // 1. 全アラートチェック実行
      const alertData = await this.alertEngine.runComprehensiveAlertCheck();
      
      // 2. プロジェクトアラート処理
      for (const alert of alertData.projectAlerts) {
        try {
          results.processed++;
          const project = await prismaDataService.getProjectById(alert.projectId);
          if (project) {
            await this.sendProjectAlert(project, alert);
            results.lineSent++;
            results.uiUpdated++;
          }
        } catch (error) {
          results.errors.push(`Project alert ${alert.id}: ${error}`);
        }
      }
      
      // 3. ユーザーアラート処理
      for (const alert of alertData.userAlerts) {
        try {
          results.processed++;
          const user = await prismaDataService.getUserById(alert.userId);
          if (user) {
            await this.sendUserAlert(user, alert);
            results.lineSent++;
            results.uiUpdated++;
          }
        } catch (error) {
          results.errors.push(`User alert ${alert.id}: ${error}`);
        }
      }

      return results;
    } catch (error) {
      console.error('Alert notification process failed:', error);
      throw error;
    }
  }

  /**
   * プロジェクトアラート通知
   */
  private async sendProjectAlert(project: Project, alert: ProjectAlert): Promise<void> {
    try {
      const message = this.buildProjectAlertMessage(project, alert);
      
      // プロジェクトメンバーに通知
      for (const memberId of project.teamMembers) {
        const user = await prismaDataService.getUserById(memberId);
        if (user?.lineUserId) {
          await this.sendLineNotification(user.lineUserId, message);
        }
      }
      
      // UI通知用にアラートステータス更新
      await this.updateAlertStatus(alert.id, 'project');
    } catch (error) {
      console.error('Failed to send project alert:', error);
      throw error;
    }
  }

  /**
   * ユーザーアラート通知
   */
  private async sendUserAlert(user: User, alert: UserAlert): Promise<void> {
    try {
      const message = this.buildUserAlertMessage(user, alert);
      
      if (user.lineUserId) {
        await this.sendLineNotification(user.lineUserId, message);
      }
      
      // UI通知用にアラートステータス更新
      await this.updateAlertStatus(alert.id, 'user');
    } catch (error) {
      console.error('Failed to send user alert:', error);
      throw error;
    }
  }

  /**
   * LINE通知送信
   */
  private async sendLineNotification(lineUserId: string, message: string): Promise<void> {
    try {
      if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
        console.warn('LINE_CHANNEL_ACCESS_TOKEN not set, skipping LINE notification');
        return;
      }

      const response = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          to: lineUserId,
          messages: [{
            type: 'text',
            text: message
          }]
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('LINE notification failed:', errorText);
        throw new Error(`LINE API error: ${response.status}`);
      }
    } catch (error) {
      console.error('LINE notification error:', error);
      throw error;
    }
  }

  /**
   * スケジュールされたリマインド送信
   */
  async sendScheduledReminders(): Promise<void> {
    try {
      // 1. 期限が近いタスクをチェック
      const urgentTasks = await this.getUrgentTasks();
      
      for (const task of urgentTasks) {
        const user = await prismaDataService.getUserById(task.userId);
        if (user?.lineUserId) {
          const message = this.buildTaskReminderMessage(task);
          await this.sendLineNotification(user.lineUserId, message);
        }
      }

      // 2. 重要なミーティングをチェック
      const upcomingMeetings = await this.getUpcomingMeetings();
      
      for (const meeting of upcomingMeetings) {
        for (const participantId of meeting.participants) {
          const user = await prismaDataService.getUserById(participantId);
          if (user?.lineUserId) {
            const message = this.buildMeetingReminderMessage(meeting);
            await this.sendLineNotification(user.lineUserId, message);
          }
        }
      }
    } catch (error) {
      console.error('Scheduled reminder sending failed:', error);
    }
  }

  // ===== メッセージ構築メソッド =====

  private buildProjectAlertMessage(project: Project, alert: ProjectAlert): string {
    const severityEmoji = this.getSeverityEmoji(alert.severity);
    const alertTypeText = this.getAlertTypeText(alert.alertType);
    
    return `${severityEmoji} プロジェクトアラート

📁 プロジェクト: ${project.name}
⚠️ アラート: ${alertTypeText}
📝 詳細: ${alert.message}
🔗 重要度: ${alert.severity.toUpperCase()}

対応が必要です。プロジェクト管理画面で詳細を確認してください。`;
  }

  private buildUserAlertMessage(user: User, alert: UserAlert): string {
    const severityEmoji = this.getSeverityEmoji(alert.severity);
    const alertTypeText = this.getAlertTypeText(alert.alertType);
    
    return `${severityEmoji} ワークロードアラート

👤 対象: ${user.name}さん
⚠️ アラート: ${alertTypeText}
📝 詳細: ${alert.message}
🔗 重要度: ${alert.severity.toUpperCase()}

作業負荷の調整を検討してください。`;
  }

  private buildTaskReminderMessage(task: any): string {
    const daysToDeadline = this.getDaysToDeadline(task.dueDate);
    
    return `⏰ タスクリマインド

📋 タスク: ${task.title}
📅 期限: ${task.dueDate} (あと${daysToDeadline}日)
🔥 優先度: ${task.priority}

期限が近づいています。進捗の確認をお願いします。`;
  }

  private buildMeetingReminderMessage(meeting: any): string {
    return `📅 ミーティングリマインド

🏢 会議: ${meeting.title}
📅 日時: ${meeting.date} ${meeting.time}
📍 場所: ${meeting.location || 'オンライン'}

1時間前のリマインドです。準備をお願いします。`;
  }

  // ===== ユーティリティメソッド =====

  private getSeverityEmoji(severity: string): string {
    const emojis: Record<string, string> = {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      critical: '🔴'
    };
    return emojis[severity] || '🟡';
  }

  private getAlertTypeText(alertType: string): string {
    const texts: Record<string, string> = {
      progress_stagnation: '進捗停滞',
      activity_stagnation: 'アクティビティ停滞',
      phase_stagnation: 'フェーズ停滞',
      workload_risk: 'ワークロード過多',
      low_priority_overload: 'C/D項目過多'
    };
    return texts[alertType] || alertType;
  }

  private async getUrgentTasks(): Promise<any[]> {
    const allTasks = await prismaDataService.getAllTasks();
    const now = new Date();
    
    return allTasks.filter(task => {
      if (!task.dueDate || task.status === 'COMPLETE') return false;
      
      const dueDate = new Date(task.dueDate);
      const daysToDeadline = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      return daysToDeadline <= 3 && daysToDeadline > 0; // 3日以内
    });
  }

  private async getUpcomingMeetings(): Promise<any[]> {
    const allEvents = await prismaDataService.getAllCalendarEvents();
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    
    return allEvents.filter(event => {
      if (event.type !== 'meeting') return false;
      
      const eventDate = new Date(`${event.date} ${event.time}`);
      return eventDate > now && eventDate <= oneHourLater;
    });
  }

  private getDaysToDeadline(dueDateString: string): number {
    const dueDate = new Date(dueDateString);
    const now = new Date();
    return Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  private async updateAlertStatus(alertId: string, type: 'project' | 'user'): Promise<void> {
    try {
      if (type === 'project') {
        await prismaDataService.updateProjectAlert(alertId, { isRead: false }); // UI側で既読管理
      } else {
        await prismaDataService.updateUserAlert(alertId, { isRead: false });
      }
    } catch (error) {
      console.error('Failed to update alert status:', error);
    }
  }
}
```

### **4.3 アラート管理API**

**src/app/api/alerts/route.ts（新規作成）:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { AlertEngine } from '@/lib/services/alert-engine';
import { NotificationService } from '@/lib/services/notification-service';
import { prismaDataService } from '@/lib/database/prisma-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'project' | 'user' | 'all'
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    let projectAlerts = [];
    let userAlerts = [];

    if (type === 'project' || type === 'all') {
      if (projectId) {
        projectAlerts = await prismaDataService.getProjectAlerts(projectId);
      } else {
        // 全プロジェクトのアラートを取得
        const projects = await prismaDataService.getAllProjects();
        for (const project of projects) {
          const alerts = await prismaDataService.getProjectAlerts(project.id);
          projectAlerts.push(...alerts);
        }
      }
    }

    if (type === 'user' || type === 'all') {
      if (userId) {
        userAlerts = await prismaDataService.getUserAlerts(userId);
      } else {
        // 全ユーザーのアラートを取得
        const users = await prismaDataService.getAllUsers();
        for (const user of users) {
          const alerts = await prismaDataService.getUserAlerts(user.id);
          userAlerts.push(...alerts);
        }
      }
    }

    // 未読のみフィルタ
    if (unreadOnly) {
      projectAlerts = projectAlerts.filter(a => !a.isRead);
      userAlerts = userAlerts.filter(a => !a.isRead);
    }

    // 重要度でソート
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    projectAlerts.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);
    userAlerts.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);

    return NextResponse.json({
      projectAlerts,
      userAlerts,
      summary: {
        totalAlerts: projectAlerts.length + userAlerts.length,
        unreadAlerts: [...projectAlerts, ...userAlerts].filter(a => !a.isRead).length,
        criticalAlerts: [...projectAlerts, ...userAlerts].filter(a => a.severity === 'critical').length
      }
    });
  } catch (error) {
    console.error('Failed to get alerts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'check_all':
        return await handleCheckAllAlerts();
      case 'send_notifications':
        return await handleSendNotifications();
      case 'send_reminders':
        return await handleSendReminders();
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Alert action failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleCheckAllAlerts() {
  const alertEngine = new AlertEngine();
  const results = await alertEngine.runComprehensiveAlertCheck();
  
  return NextResponse.json({
    success: true,
    results: {
      projectAlertsGenerated: results.projectAlerts.length,
      userAlertsGenerated: results.userAlerts.length,
      summary: results.summary
    }
  });
}

async function handleSendNotifications() {
  const notificationService = new NotificationService();
  const results = await notificationService.sendAlertNotifications();
  
  return NextResponse.json({
    success: true,
    results
  });
}

async function handleSendReminders() {
  const notificationService = new NotificationService();
  await notificationService.sendScheduledReminders();
  
  return NextResponse.json({
    success: true,
    message: 'Scheduled reminders sent'
  });
}
```

**src/app/api/alerts/[id]/route.ts（新規作成）:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prismaDataService } from '@/lib/database/prisma-service';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action, type } = await request.json(); // action: 'mark_read' | 'resolve', type: 'project' | 'user'

    if (!type || !['project', 'user'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Must be project or user' }, { status: 400 });
    }

    switch (action) {
      case 'mark_read':
        if (type === 'project') {
          await prismaDataService.updateProjectAlert(id, { isRead: true });
        } else {
          await prismaDataService.updateUserAlert(id, { isRead: true });
        }
        break;
        
      case 'resolve':
        if (type === 'project') {
          await prismaDataService.updateProjectAlert(id, { 
            isResolved: true, 
            resolvedAt: new Date().toISOString() 
          });
        } else {
          // ユーザーアラートは解決概念がないため、既読にする
          await prismaDataService.updateUserAlert(id, { isRead: true });
        }
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update alert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### **4.4 自動実行ジョブシステム**

**src/lib/jobs/alert-scheduler.ts（新規作成）:**
```typescript
import { NotificationService } from '@/lib/services/notification-service';
import { AlertEngine } from '@/lib/services/alert-engine';

export class AlertScheduler {
  private notificationService: NotificationService;
  private alertEngine: AlertEngine;
  private intervals: NodeJS.Timeout[] = [];

  constructor() {
    this.notificationService = new NotificationService();
    this.alertEngine = new AlertEngine();
  }

  /**
   * 定期アラートチェックを開始
   */
  startScheduledJobs(): void {
    try {
      // 1. アラートチェック（4時間ごと）
      const alertCheckInterval = setInterval(async () => {
        try {
          console.log('Running scheduled alert check...');
          await this.alertEngine.runComprehensiveAlertCheck();
          console.log('Scheduled alert check completed');
        } catch (error) {
          console.error('Scheduled alert check failed:', error);
        }
      }, 4 * 60 * 60 * 1000); // 4時間
      
      // 2. 通知配信（1時間ごと）
      const notificationInterval = setInterval(async () => {
        try {
          console.log('Running scheduled notifications...');
          await this.notificationService.sendAlertNotifications();
          console.log('Scheduled notifications completed');
        } catch (error) {
          console.error('Scheduled notifications failed:', error);
        }
      }, 60 * 60 * 1000); // 1時間
      
      // 3. リマインド送信（30分ごと）
      const reminderInterval = setInterval(async () => {
        try {
          console.log('Running scheduled reminders...');
          await this.notificationService.sendScheduledReminders();
          console.log('Scheduled reminders completed');
        } catch (error) {
          console.error('Scheduled reminders failed:', error);
        }
      }, 30 * 60 * 1000); // 30分

      this.intervals.push(alertCheckInterval, notificationInterval, reminderInterval);
      
      console.log('Alert scheduler started with 3 scheduled jobs');
    } catch (error) {
      console.error('Failed to start scheduled jobs:', error);
    }
  }

  /**
   * 定期実行を停止
   */
  stopScheduledJobs(): void {
    try {
      this.intervals.forEach(interval => clearInterval(interval));
      this.intervals = [];
      console.log('Alert scheduler stopped');
    } catch (error) {
      console.error('Failed to stop scheduled jobs:', error);
    }
  }

  /**
   * 手動でのアラートチェック・通知実行
   */
  async runManualCheck(): Promise<{
    alertResults: any;
    notificationResults: any;
  }> {
    try {
      console.log('Running manual alert check...');
      
      const alertResults = await this.alertEngine.runComprehensiveAlertCheck();
      const notificationResults = await this.notificationService.sendAlertNotifications();
      
      console.log('Manual alert check completed');
      
      return {
        alertResults,
        notificationResults
      };
    } catch (error) {
      console.error('Manual alert check failed:', error);
      throw error;
    }
  }
}

// スケジューラーのシングルトンインスタンス
export const alertScheduler = new AlertScheduler();

// Next.js開発環境でのスケジューラー自動開始
if (process.env.NODE_ENV === 'development') {
  alertScheduler.startScheduledJobs();
}
```

**src/app/api/alerts/scheduler/route.ts（新規作成）:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { alertScheduler } from '@/lib/jobs/alert-scheduler';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'start':
        alertScheduler.startScheduledJobs();
        return NextResponse.json({ success: true, message: 'Scheduler started' });
        
      case 'stop':
        alertScheduler.stopScheduledJobs();
        return NextResponse.json({ success: true, message: 'Scheduler stopped' });
        
      case 'run_manual':
        const results = await alertScheduler.runManualCheck();
        return NextResponse.json({ success: true, results });
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Scheduler action failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    // スケジューラーの状態を返す（実装は簡略化）
    return NextResponse.json({
      status: 'running', // 実際の状態チェックは省略
      nextCheck: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    console.error('Failed to get scheduler status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## ✅ Phase 4完了検証

### **必須チェックリスト:**
- [ ] アラートエンジン実装完了
  - [ ] `AlertEngine` 全メソッド動作確認
  - [ ] プロジェクト・ユーザーアラート生成テスト
  - [ ] 重複チェック機能動作確認
- [ ] 通知配信システム動作確認
  - [ ] `NotificationService` 実装完了
  - [ ] LINE通知送信テスト実行
  - [ ] スケジュールリマインド機能テスト
- [ ] アラート管理API動作確認
  - [ ] `GET /api/alerts` テスト（各パラメータ）
  - [ ] `POST /api/alerts` アクション実行テスト
  - [ ] `PUT /api/alerts/[id]` 更新テスト
- [ ] スケジューラー動作確認
  - [ ] `AlertScheduler` 起動・停止テスト
  - [ ] 手動実行テスト
  - [ ] `/api/alerts/scheduler` 操作確認
- [ ] データベース整合性確認
  - [ ] アラートテーブルデータ保存確認
  - [ ] 既存データへの影響なし確認
- [ ] 既存機能無影響確認
  - [ ] 全ページ正常動作
  - [ ] AI評価・関係性マッピング継続動作

### **Phase 4動作確認方法:**
```bash
# アラートチェック実行
curl -X POST "http://localhost:3000/api/alerts" \
  -H "Content-Type: application/json" \
  -d '{"action":"check_all"}'

# 通知送信実行
curl -X POST "http://localhost:3000/api/alerts" \
  -H "Content-Type: application/json" \
  -d '{"action":"send_notifications"}'

# アラート取得
curl "http://localhost:3000/api/alerts?type=all&unreadOnly=true"

# スケジューラー手動実行
curl -X POST "http://localhost:3000/api/alerts/scheduler" \
  -H "Content-Type: application/json" \
  -d '{"action":"run_manual"}'
```

### **Phase 4完了報告テンプレート:**
```markdown
## Phase 4実装完了報告

### 実装内容
✅ アラートエンジン: AlertEngine（3種類のプロジェクトアラート、2種類のユーザーアラート）
✅ 通知配信システム: NotificationService（LINE統合、リマインド機能）
✅ アラート管理API: /api/alerts（CRUD、状態管理）
✅ 自動実行ジョブ: AlertScheduler（定期チェック、通知配信）

### 検証結果
✅ アラート生成: XX件のプロジェクト、XX件のユーザーアラート生成
✅ LINE通知: XX件の通知正常送信確認
✅ スケジューラー: 定期実行（4h/1h/30m間隔）動作確認
✅ 既存機能無影響: 全機能正常動作確認

### パフォーマンス
✅ アラートチェック処理時間: 平均XXms
✅ 通知送信処理時間: 平均XXms/件
✅ メモリ使用量: 正常範囲内

### 次Phase準備状況
✅ Phase 5開始準備完了
次回実装: docs/PHASE5_UI_UX_ENHANCEMENT.md 参照
```

---

**Phase 4完了後、`docs/PHASE5_UI_UX_ENHANCEMENT.md` に進んでください。**