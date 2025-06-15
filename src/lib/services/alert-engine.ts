import { prismaDataService } from '@/lib/database/prisma-service';
import { ProjectAlert, UserAlert, Project, Task, User } from '@/lib/types';

export class AlertEngine {
  
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
      
      const projects = await prismaDataService.getProjects();
      for (const project of projects) {
        const projectAlerts = await this.checkProjectAlerts(project.id);
        allProjectAlerts.push(...projectAlerts);
      }
      
      const users = await prismaDataService.getUsers();
      for (const user of users) {
        const userAlerts = await this.checkUserAlerts(user.id);
        allUserAlerts.push(...userAlerts);
      }
      
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

  async checkProjectAlerts(projectId: string): Promise<ProjectAlert[]> {
    try {
      const alerts: ProjectAlert[] = [];
      
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
      
      for (const alert of alerts) {
        await this.createProjectAlert(alert);
      }
      
      return alerts;
    } catch (error) {
      console.error(`Failed to check project alerts for ${projectId}:`, error);
      return [];
    }
  }

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
          severity: severity as 'low' | 'medium' | 'high' | 'critical',
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

  async checkProgressStagnation(projectId: string): Promise<ProjectAlert[]> {
    try {
      const project = await prismaDataService.getProjectById(projectId);
      const tasks = await prismaDataService.getTasksByProjectId(projectId);
      
      if (!project || tasks.length === 0) return [];

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
          severity: severity as 'low' | 'medium' | 'high' | 'critical',
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
          severity: severity as 'low' | 'medium' | 'high' | 'critical',
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

  async checkUserAlerts(userId: string): Promise<UserAlert[]> {
    try {
      const alerts: UserAlert[] = [];
      
      const [
        workloadAlerts,
        priorityAlerts
      ] = await Promise.all([
        this.checkUserWorkloadRisk(userId),
        this.checkLowPriorityTaskOverload(userId)
      ]);
      
      alerts.push(...workloadAlerts, ...priorityAlerts);
      
      for (const alert of alerts) {
        await this.createUserAlert(alert);
      }
      
      return alerts;
    } catch (error) {
      console.error(`Failed to check user alerts for ${userId}:`, error);
      return [];
    }
  }

  async checkUserWorkloadRisk(userId: string): Promise<UserAlert[]> {
    try {
      const user = await prismaDataService.getUserById(userId);
      const tasks = await prismaDataService.getTasksByUserId(userId);
      
      if (!user || tasks.length === 0) return [];

      const activeTasks = tasks.filter(t => 
        t.status !== 'COMPLETE' && t.status !== 'DELETE'
      );
      
      const totalWeight = activeTasks.reduce((sum, task) => sum + (task.resourceWeight || 1), 0);
      const qolWeight = user.preferences?.qol_weight || 1.0;
      const adjustedLoad = totalWeight / qolWeight;
      
      if (adjustedLoad > 40) {
        const severity = adjustedLoad > 80 ? 'critical' : 
                        adjustedLoad > 60 ? 'high' : 'medium';
        
        return [{
          id: this.generateId(),
          userId,
          alertType: 'workload_risk',
          severity: severity as 'low' | 'medium' | 'high' | 'critical',
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

  private async createProjectAlert(alert: ProjectAlert): Promise<void> {
    try {
      const existingAlerts = await prismaDataService.getProjectAlerts(alert.projectId);
      const duplicateAlert = existingAlerts.find(a => 
        a.alertType === alert.alertType && 
        !a.isResolved &&
        this.getDaysSince(a.createdAt) < 1
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