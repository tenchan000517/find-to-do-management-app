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

  startScheduledJobs(): void {
    try {
      const alertCheckInterval = setInterval(async () => {
        try {
          console.log('Running scheduled alert check...');
          await this.alertEngine.runComprehensiveAlertCheck();
          console.log('Scheduled alert check completed');
        } catch (error) {
          console.error('Scheduled alert check failed:', error);
        }
      }, 4 * 60 * 60 * 1000);
      
      const notificationInterval = setInterval(async () => {
        try {
          console.log('Running scheduled notifications...');
          await this.notificationService.sendAlertNotifications();
          console.log('Scheduled notifications completed');
        } catch (error) {
          console.error('Scheduled notifications failed:', error);
        }
      }, 60 * 60 * 1000);
      
      const reminderInterval = setInterval(async () => {
        try {
          console.log('Running scheduled reminders...');
          await this.notificationService.sendScheduledReminders();
          console.log('Scheduled reminders completed');
        } catch (error) {
          console.error('Scheduled reminders failed:', error);
        }
      }, 30 * 60 * 1000);

      this.intervals.push(alertCheckInterval, notificationInterval, reminderInterval);
      
      console.log('Alert scheduler started with 3 scheduled jobs');
    } catch (error) {
      console.error('Failed to start scheduled jobs:', error);
    }
  }

  stopScheduledJobs(): void {
    try {
      this.intervals.forEach(interval => clearInterval(interval));
      this.intervals = [];
      console.log('Alert scheduler stopped');
    } catch (error) {
      console.error('Failed to stop scheduled jobs:', error);
    }
  }

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

export const alertScheduler = new AlertScheduler();

if (process.env.NODE_ENV === 'development') {
  alertScheduler.startScheduledJobs();
}