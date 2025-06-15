import { AlertEngine } from './alert-engine';
import { prismaDataService } from '@/lib/database/prisma-service';
import { ProjectAlert, UserAlert, Project, User } from '@/lib/types';

export class NotificationService {
  private alertEngine: AlertEngine;
  
  constructor() {
    this.alertEngine = new AlertEngine();
  }
  
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

      const alertData = await this.alertEngine.runComprehensiveAlertCheck();
      
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

  private async sendProjectAlert(project: Project, alert: ProjectAlert): Promise<void> {
    try {
      const message = this.buildProjectAlertMessage(project, alert);
      
      for (const memberId of project.teamMembers) {
        const user = await prismaDataService.getUserById(memberId);
        if (user?.lineUserId) {
          await this.sendLineNotification(user.lineUserId, message);
        }
      }
      
      await this.updateAlertStatus(alert.id, 'project');
    } catch (error) {
      console.error('Failed to send project alert:', error);
      throw error;
    }
  }

  private async sendUserAlert(user: User, alert: UserAlert): Promise<void> {
    try {
      const message = this.buildUserAlertMessage(user, alert);
      
      if (user.lineUserId) {
        await this.sendLineNotification(user.lineUserId, message);
      }
      
      await this.updateAlertStatus(alert.id, 'user');
    } catch (error) {
      console.error('Failed to send user alert:', error);
      throw error;
    }
  }

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

  async sendScheduledReminders(): Promise<void> {
    try {
      const urgentTasks = await this.getUrgentTasks();
      
      for (const task of urgentTasks) {
        const user = await prismaDataService.getUserById(task.userId);
        if (user?.lineUserId) {
          const message = this.buildTaskReminderMessage(task);
          await this.sendLineNotification(user.lineUserId, message);
        }
      }

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
      
      return daysToDeadline <= 3 && daysToDeadline > 0;
    });
  }

  private async getUpcomingMeetings(): Promise<any[]> {
    const allEvents = await prismaDataService.getCalendarEvents();
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
        await prismaDataService.updateProjectAlert(alertId, { isRead: false });
      } else {
        await prismaDataService.updateUserAlert(alertId, { isRead: false });
      }
    } catch (error) {
      console.error('Failed to update alert status:', error);
    }
  }
}