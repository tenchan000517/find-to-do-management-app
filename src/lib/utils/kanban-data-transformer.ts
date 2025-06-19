// カンバンデータ変換ユーティリティ

import { 
  KanbanItem, 
  KanbanColumn, 
  KanbanViewType, 
  KanbanFilter,
  TaskKanbanItem,
  AppointmentKanbanItem,
  ProjectKanbanItem,
  KANBAN_COLUMN_CONFIGS
} from '@/lib/types/kanban-types';
import { Task, Appointment, Project, User } from '@/lib/types';

export class KanbanDataTransformer {
  
  // 生データをKanbanItemに変換
  transformToKanbanItems(rawData: (Task | Appointment | Project)[]): KanbanItem[] {
    return rawData.map(item => {
      // アイテムタイプの判定
      if ('status' in item && ['IDEA', 'PLAN', 'DO', 'CHECK', 'COMPLETE', 'KNOWLEDGE', 'DELETE'].includes(item.status)) {
        return this.transformTaskToKanbanItem(item as Task);
      }
      
      if ('companyName' in item) {
        return this.transformAppointmentToKanbanItem(item as Appointment);
      }
      
      if ('name' in item && 'progress' in item) {
        return this.transformProjectToKanbanItem(item as Project);
      }
      
      throw new Error(`Unknown item type: ${JSON.stringify(item)}`);
    });
  }

  // タスクをKanbanItemに変換
  private transformTaskToKanbanItem(task: Task): TaskKanbanItem {
    return {
      id: task.id,
      type: 'task',
      title: task.title,
      description: task.description,
      priority: task.priority,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      
      // 統一担当者システム
      createdBy: task.createdBy,
      assignedTo: task.assignedTo,
      creator: task.creator,
      assignee: task.assignee,
      
      // Legacy fields
      userId: task.userId,
      user: task.user,
      
      // タスク固有フィールド
      status: task.status,
      projectId: task.projectId,
      project: task.project,
      dueDate: task.dueDate,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      difficultyScore: task.difficultyScore,
      aiIssueLevel: task.aiIssueLevel,
      summary: task.summary,
      collaborators: task.collaborators
    };
  }

  // アポイントメントをKanbanItemに変換
  private transformAppointmentToKanbanItem(appointment: Appointment): AppointmentKanbanItem {
    return {
      id: appointment.id,
      type: 'appointment',
      title: appointment.companyName,
      description: `${appointment.contactName} - ${appointment.nextAction}`,
      priority: appointment.priority,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
      
      // 統一担当者システム
      createdBy: appointment.createdBy,
      assignedTo: appointment.assignedTo,
      creator: appointment.creator,
      assignee: appointment.assignee,
      
      // Legacy fields
      assignedToId: appointment.assignedToId,
      
      // アポイントメント固有フィールド
      companyName: appointment.companyName,
      contactName: appointment.contactName,
      phone: appointment.phone,
      email: appointment.email,
      status: appointment.status,
      lastContact: appointment.lastContact,
      nextAction: appointment.nextAction,
      notes: appointment.notes,
      
      // 拡張フィールド
      processingStatus: appointment.details?.processingStatus,
      relationshipStatus: appointment.details?.relationshipStatus,
      salesPhase: appointment.details?.phaseStatus,
      sourceType: appointment.details?.sourceType,
      scheduledDate: appointment.scheduledDate,
      scheduledTime: appointment.scheduledTime,
      meetingLocation: appointment.meetingLocation,
      contractAmount: appointment.contractAmount,
      contractStatus: appointment.contractStatus
    };
  }

  // プロジェクトをKanbanItemに変換
  private transformProjectToKanbanItem(project: Project): ProjectKanbanItem {
    return {
      id: project.id,
      type: 'project',
      title: project.name,
      description: project.description,
      priority: project.priority,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      
      // 統一担当者システム
      createdBy: project.createdBy,
      assignedTo: project.assignedTo,
      creator: project.creator,
      assignee: project.manager,
      
      // プロジェクト固有フィールド
      name: project.name,
      status: project.status,
      progress: project.progress,
      startDate: project.startDate,
      endDate: project.endDate,
      teamMembers: project.teamMembers,
      phase: project.phase,
      kgi: project.kgi,
      successProbability: project.successProbability,
      activityScore: project.activityScore
    };
  }

  // ビュータイプ別にアイテムをカラムにグループ化
  groupItemsByColumn(
    items: KanbanItem[], 
    viewType: KanbanViewType, 
    users: User[] = [], 
    projects: Project[] = []
  ): KanbanColumn[] {
    
    switch (viewType) {
      case 'status':
        return this.groupByStatus(items);
        
      case 'user':
        return this.groupByUser(items, users);
        
      case 'project':
        return this.groupByProject(items, projects);
        
      case 'deadline':
        return this.groupByDeadline(items);
        
      case 'processing':
        return this.groupByProcessingStatus(items);
        
      case 'relationship':
        return this.groupByRelationshipStatus(items);
        
      case 'phase':
        return this.groupByPhase(items);
        
      case 'source':
        return this.groupBySource(items);
        
      default:
        throw new Error(`Unsupported view type: ${viewType}`);
    }
  }

  // ステータス別グループ化
  private groupByStatus(items: KanbanItem[]): KanbanColumn[] {
    const statusConfig = KANBAN_COLUMN_CONFIGS.status;
    
    return statusConfig.map(config => ({
      id: config.id,
      title: config.title,
      color: config.color,
      icon: config.icon,
      items: items.filter(item => 
        item.type === 'task' && 
        (item as TaskKanbanItem).status === config.id
      )
    }));
  }

  // ユーザー別グループ化
  private groupByUser(items: KanbanItem[], users: User[]): KanbanColumn[] {
    const columns: KanbanColumn[] = [];
    
    // 未割り当てカラム
    columns.push({
      id: 'unassigned',
      title: '未割り当て',
      color: '#f3f4f6',
      icon: '👤',
      items: items.filter(item => !item.assignedTo && !item.userId)
    });
    
    // 各ユーザーのカラム
    users.filter(user => user.isActive).forEach(user => {
      columns.push({
        id: user.id,
        title: user.name,
        color: user.color,
        user: user,
        items: items.filter(item => 
          item.assignedTo === user.id || 
          item.userId === user.id
        )
      });
    });
    
    return columns;
  }

  // プロジェクト別グループ化
  private groupByProject(items: KanbanItem[], projects: Project[]): KanbanColumn[] {
    const columns: KanbanColumn[] = [];
    
    // プロジェクトなしカラム
    columns.push({
      id: 'no_project',
      title: 'プロジェクトなし',
      color: '#f3f4f6',
      icon: '📁',
      items: items.filter(item => 
        item.type === 'task' && 
        !(item as TaskKanbanItem).projectId
      )
    });
    
    // 各プロジェクトのカラム
    projects.forEach(project => {
      columns.push({
        id: project.id,
        title: project.name,
        color: this.getProjectStatusColor(project.status),
        project: project,
        items: items.filter(item => {
          if (item.type === 'task') {
            return (item as TaskKanbanItem).projectId === project.id;
          }
          if (item.type === 'project') {
            return item.id === project.id;
          }
          return false;
        })
      });
    });
    
    return columns;
  }

  // 期限別グループ化
  private groupByDeadline(items: KanbanItem[]): KanbanColumn[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const taskItems = items.filter(item => item.type === 'task') as TaskKanbanItem[];
    
    return [
      {
        id: 'overdue',
        title: '期限切れ',
        color: '#fecaca',
        icon: '🚨',
        items: taskItems.filter(item => 
          item.dueDate && new Date(item.dueDate) < today
        )
      },
      {
        id: 'today',
        title: '今日',
        color: '#fed7aa',
        icon: '📅',
        items: taskItems.filter(item => 
          item.dueDate && 
          new Date(item.dueDate).toDateString() === today.toDateString()
        )
      },
      {
        id: 'this_week',
        title: '今週',
        color: '#fef3c7',
        icon: '📆',
        items: taskItems.filter(item => 
          item.dueDate && 
          new Date(item.dueDate) > today && 
          new Date(item.dueDate) <= weekEnd
        )
      },
      {
        id: 'this_month',
        title: '今月',
        color: '#dbeafe',
        icon: '🗓️',
        items: taskItems.filter(item => 
          item.dueDate && 
          new Date(item.dueDate) > weekEnd && 
          new Date(item.dueDate) <= monthEnd
        )
      },
      {
        id: 'later',
        title: 'それ以降',
        color: '#e0e7ff',
        icon: '⏰',
        items: taskItems.filter(item => 
          item.dueDate && new Date(item.dueDate) > monthEnd
        )
      },
      {
        id: 'no_deadline',
        title: '期限なし',
        color: '#f3f4f6',
        icon: '♾️',
        items: taskItems.filter(item => !item.dueDate)
      }
    ];
  }

  // 処理状況別グループ化
  private groupByProcessingStatus(items: KanbanItem[]): KanbanColumn[] {
    const processingConfig = KANBAN_COLUMN_CONFIGS.processing;
    const appointmentItems = items.filter(item => item.type === 'appointment') as AppointmentKanbanItem[];
    
    return processingConfig.map(config => ({
      id: config.id,
      title: config.title,
      color: config.color,
      icon: config.icon,
      items: appointmentItems.filter(item => 
        item.processingStatus === config.id
      )
    }));
  }

  // 関係性別グループ化
  private groupByRelationshipStatus(items: KanbanItem[]): KanbanColumn[] {
    const relationshipConfig = KANBAN_COLUMN_CONFIGS.relationship;
    const appointmentItems = items.filter(item => item.type === 'appointment') as AppointmentKanbanItem[];
    
    return relationshipConfig.map(config => ({
      id: config.id,
      title: config.title,
      color: config.color,
      icon: config.icon,
      items: appointmentItems.filter(item => 
        item.relationshipStatus === config.id
      )
    }));
  }

  // フェーズ別グループ化
  private groupByPhase(items: KanbanItem[]): KanbanColumn[] {
    const phaseConfig = KANBAN_COLUMN_CONFIGS.phase;
    const appointmentItems = items.filter(item => item.type === 'appointment') as AppointmentKanbanItem[];
    
    return phaseConfig.map(config => ({
      id: config.id,
      title: config.title,
      color: config.color,
      icon: config.icon,
      items: appointmentItems.filter(item => 
        item.salesPhase === config.id
      )
    }));
  }

  // 獲得元別グループ化
  private groupBySource(items: KanbanItem[]): KanbanColumn[] {
    const sourceConfig = KANBAN_COLUMN_CONFIGS.source;
    const appointmentItems = items.filter(item => item.type === 'appointment') as AppointmentKanbanItem[];
    
    return sourceConfig.map(config => ({
      id: config.id,
      title: config.title,
      color: config.color,
      icon: config.icon,
      items: appointmentItems.filter(item => 
        item.sourceType === config.id
      )
    }));
  }

  // フィルター適用
  filterItems(items: KanbanItem[], filter: KanbanFilter): KanbanItem[] {
    return items.filter(item => {
      // ユーザーフィルター
      if (filter.users && filter.users.length > 0) {
        const itemUserId = item.assignedTo || item.userId;
        if (!itemUserId || !filter.users.includes(itemUserId)) {
          return false;
        }
      }
      
      // プロジェクトフィルター
      if (filter.projects && filter.projects.length > 0) {
        if (item.type === 'task') {
          const projectId = (item as TaskKanbanItem).projectId;
          if (!projectId || !filter.projects.includes(projectId)) {
            return false;
          }
        }
      }
      
      // 優先度フィルター
      if (filter.priorities && filter.priorities.length > 0) {
        if (!filter.priorities.includes(item.priority)) {
          return false;
        }
      }
      
      // ステータスフィルター
      if (filter.statuses && filter.statuses.length > 0) {
        let itemStatus: string | undefined;
        if (item.type === 'task') {
          itemStatus = (item as TaskKanbanItem).status;
        } else if (item.type === 'appointment') {
          itemStatus = (item as AppointmentKanbanItem).status;
        } else if (item.type === 'project') {
          itemStatus = (item as ProjectKanbanItem).status;
        }
        
        if (!itemStatus || !filter.statuses.includes(itemStatus)) {
          return false;
        }
      }
      
      // 期間フィルター
      if (filter.dateRange) {
        const startDate = new Date(filter.dateRange.start);
        const endDate = new Date(filter.dateRange.end);
        const itemDate = new Date(item.createdAt);
        
        if (itemDate < startDate || itemDate > endDate) {
          return false;
        }
      }
      
      // 検索クエリフィルター
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        const title = item.title.toLowerCase();
        const description = item.description?.toLowerCase() || '';
        
        if (!title.includes(query) && !description.includes(query)) {
          return false;
        }
      }
      
      return true;
    });
  }

  // カラム内アイテムソート
  sortItemsInColumn(items: KanbanItem[], sortBy: 'priority' | 'dueDate' | 'createdAt' | 'title'): KanbanItem[] {
    return [...items].sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { A: 0, B: 1, C: 2, D: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
          
        case 'dueDate':
          if (a.type === 'task' && b.type === 'task') {
            const aDue = (a as TaskKanbanItem).dueDate;
            const bDue = (b as TaskKanbanItem).dueDate;
            
            if (!aDue && !bDue) return 0;
            if (!aDue) return 1;
            if (!bDue) return -1;
            
            return new Date(aDue).getTime() - new Date(bDue).getTime();
          }
          return 0;
          
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          
        case 'title':
          return a.title.localeCompare(b.title, 'ja');
          
        default:
          return 0;
      }
    });
  }

  // プロジェクトステータス色の取得
  private getProjectStatusColor(status: string): string {
    const colors = {
      planning: '#dbeafe',
      active: '#dcfce7',
      on_hold: '#fed7aa',
      completed: '#e0e7ff'
    };
    return colors[status as keyof typeof colors] || '#f3f4f6';
  }
}