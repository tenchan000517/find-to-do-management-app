import { NextRequest, NextResponse } from 'next/server';
import { AlertEngine } from '@/lib/services/alert-engine';
import { NotificationService } from '@/lib/services/notification-service';
import { prismaDataService } from '@/lib/database/prisma-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    let projectAlerts = [];
    let userAlerts = [];

    if (type === 'project' || type === 'all') {
      if (projectId) {
        projectAlerts = await prismaDataService.getProjectAlerts(projectId);
      } else {
        const projects = await prismaDataService.getProjects();
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
        const users = await prismaDataService.getUsers();
        for (const user of users) {
          const alerts = await prismaDataService.getUserAlerts(user.id);
          userAlerts.push(...alerts);
        }
      }
    }

    if (unreadOnly) {
      projectAlerts = projectAlerts.filter(a => !a.isRead);
      userAlerts = userAlerts.filter(a => !a.isRead);
    }

    const severityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    projectAlerts.sort((a, b) => (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0));
    userAlerts.sort((a, b) => (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0));

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