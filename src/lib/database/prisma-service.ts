import prisma from './prisma';
import { 
  Project, 
  Task, 
  User,
  Connection, 
  CalendarEvent, 
  KnowledgeItem, 
  Appointment 
} from '../types';

// Enum mapping helpers
const projectStatusMap = {
  'planning': 'PLANNING',
  'active': 'ACTIVE', 
  'on_hold': 'ON_HOLD',
  'completed': 'COMPLETED'
} as const;

// New task status mapping
export const TASK_STATUS_TO_PRISMA = {
  'IDEA': 'IDEA',
  'PLAN': 'PLAN', 
  'DO': 'DO',
  'CHECK': 'CHECK',
  'COMPLETE': 'COMPLETE',
  'KNOWLEDGE': 'KNOWLEDGE',
  'DELETE': 'DELETE'
} as const;

export const PRISMA_TO_TASK_STATUS = {
  'IDEA': 'IDEA',
  'PLAN': 'PLAN',
  'DO': 'DO', 
  'CHECK': 'CHECK',
  'COMPLETE': 'COMPLETE',
  'KNOWLEDGE': 'KNOWLEDGE',
  'DELETE': 'DELETE'
} as const;

// Priority mapping
export const PRIORITY_TO_PRISMA = {
  'A': 'A',
  'B': 'B',
  'C': 'C', 
  'D': 'D'
} as const;

const priorityMap = {
  'A': 'A',
  'B': 'B',
  'C': 'C',
  'D': 'D'
} as const;

const connectionTypeMap = {
  'student': 'STUDENT',
  'company': 'COMPANY'
} as const;

const eventTypeMap = {
  'meeting': 'MEETING',
  'event': 'EVENT',
  'deadline': 'DEADLINE'
} as const;

const knowledgeCategoryMap = {
  'industry': 'INDUSTRY',
  'sales': 'SALES',
  'technical': 'TECHNICAL',
  'business': 'BUSINESS'
} as const;

const appointmentStatusMap = {
  'pending': 'PENDING',
  'contacted': 'CONTACTED',
  'interested': 'INTERESTED',
  'not_interested': 'NOT_INTERESTED',
  'scheduled': 'SCHEDULED'
} as const;

// Reverse mapping helpers
const reverseProjectStatusMap = Object.fromEntries(
  Object.entries(projectStatusMap).map(([k, v]) => [v, k])
) as Record<string, Project['status']>;

const reversePriorityMap = Object.fromEntries(
  Object.entries(priorityMap).map(([k, v]) => [v, k])
) as Record<string, 'A' | 'B' | 'C' | 'D'>;

const reverseConnectionTypeMap = Object.fromEntries(
  Object.entries(connectionTypeMap).map(([k, v]) => [v, k])
) as Record<string, Connection['type']>;

const reverseEventTypeMap = Object.fromEntries(
  Object.entries(eventTypeMap).map(([k, v]) => [v, k])
) as Record<string, CalendarEvent['type']>;

const reverseKnowledgeCategoryMap = Object.fromEntries(
  Object.entries(knowledgeCategoryMap).map(([k, v]) => [v, k])
) as Record<string, KnowledgeItem['category']>;

const reverseAppointmentStatusMap = Object.fromEntries(
  Object.entries(appointmentStatusMap).map(([k, v]) => [v, k])
) as Record<string, Appointment['status']>;

class PrismaDataService {
  // Projects
  async getProjects(): Promise<Project[]> {
    try {
      const projects = await prisma.projects.findMany({
        orderBy: { updatedAt: 'desc' }
      });
      
      return projects.map((p: Awaited<ReturnType<typeof prisma.projects.findMany>>[0]) => ({
        ...p,
        status: reverseProjectStatusMap[p.status] || 'planning',
        priority: reversePriorityMap[p.priority] || 'C',
        startDate: p.startDate,
        endDate: p.endDate || undefined,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        lastActivityDate: p.lastActivityDate?.toISOString(),
        phaseChangeDate: p.phaseChangeDate?.toISOString()
      }));
    } catch (error) {
      console.error('Failed to get projects:', error);
      return [];
    }
  }

  async addProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const newProject = await prisma.projects.create({
      data: {
        id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...project,
        status: projectStatusMap[project.status],
        priority: priorityMap[project.priority],
        updatedAt: new Date()
      }
    });

    return {
      ...newProject,
      status: reverseProjectStatusMap[newProject.status] || 'planning',
      priority: reversePriorityMap[newProject.priority] || 'C',
      startDate: newProject.startDate,
      endDate: newProject.endDate || undefined,
      createdAt: newProject.createdAt.toISOString(),
      updatedAt: newProject.updatedAt.toISOString(),
      lastActivityDate: newProject.lastActivityDate?.toISOString(),
      phaseChangeDate: newProject.phaseChangeDate?.toISOString()
    };
  }

  async updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>): Promise<Project | null> {
    try {
      const updateData: any = { ...updates };
      if (updates.status) updateData.status = projectStatusMap[updates.status];
      if (updates.priority) updateData.priority = priorityMap[updates.priority];
      
      const updatedProject = await prisma.projects.update({
        where: { id },
        data: updateData
      });

      return {
        ...updatedProject,
        status: reverseProjectStatusMap[updatedProject.status] || 'planning',
        priority: reversePriorityMap[updatedProject.priority] || 'medium',
        startDate: updatedProject.startDate,
        endDate: updatedProject.endDate || undefined,
        createdAt: updatedProject.createdAt.toISOString(),
        updatedAt: updatedProject.updatedAt.toISOString(),
        lastActivityDate: updatedProject.lastActivityDate?.toISOString(),
        phaseChangeDate: updatedProject.phaseChangeDate?.toISOString()
      };
    } catch (error) {
      console.error('Failed to update project:', error);
      return null;
    }
  }

  async deleteProject(id: string): Promise<boolean> {
    try {
      await prisma.projects.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error('Failed to delete project:', error);
      return false;
    }
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    try {
      const tasks = await prisma.tasks.findMany({
        where: {
          isArchived: false
        },
        include: {
          projects: true,
          users: true,
          task_collaborators: {
            include: {
              users: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });
      
      return tasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: PRISMA_TO_TASK_STATUS[t.status as keyof typeof PRISMA_TO_TASK_STATUS] || 'IDEA',
        priority: reversePriorityMap[t.priority] || 'C',
        projectId: t.projectId || undefined,
        project: t.projects || undefined,
        userId: t.userId,
        user: t.users || undefined,
        collaborators: t.task_collaborators.map((c: any) => ({
          id: c.id,
          taskId: c.taskId,
          userId: c.userId,
          user: c.users,
          createdAt: c.createdAt.toISOString()
        })),
        dueDate: t.dueDate || undefined,
        isArchived: t.isArchived,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('Failed to get tasks:', error);
      return [];
    }
  }

  async addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const newTask = await prisma.tasks.create({
      data: {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: task.title,
        description: task.description,
        status: TASK_STATUS_TO_PRISMA[task.status],
        priority: PRIORITY_TO_PRISMA[task.priority],
        projectId: task.projectId || null,
        userId: task.userId,
        dueDate: task.dueDate || null,
        isArchived: task.isArchived || false,
        updatedAt: new Date()
      },
      include: {
        projects: true,
        users: true,
        task_collaborators: {
          include: {
            users: true
          }
        }
      }
    });

    const taskWithRelations = newTask as any;
    return {
      id: taskWithRelations.id,
      title: taskWithRelations.title,
      description: taskWithRelations.description,
      status: PRISMA_TO_TASK_STATUS[taskWithRelations.status as keyof typeof PRISMA_TO_TASK_STATUS] || 'IDEA',
      priority: reversePriorityMap[taskWithRelations.priority] || 'C',
      projectId: taskWithRelations.projectId || undefined,
      project: taskWithRelations.projects || undefined,
      userId: taskWithRelations.userId,
      user: taskWithRelations.users || undefined,
      collaborators: (taskWithRelations.task_collaborators || []).map((c: any) => ({
        id: c.id,
        taskId: c.taskId,
        userId: c.userId,
        user: c.user,
        createdAt: c.createdAt.toISOString()
      })),
      dueDate: taskWithRelations.dueDate || undefined,
      isArchived: taskWithRelations.isArchived,
      createdAt: taskWithRelations.createdAt.toISOString(),
      updatedAt: taskWithRelations.updatedAt.toISOString()
    };
  }

  async updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task | null> {
    try {
      const updateData: any = { ...updates };
      if (updates.status !== undefined) updateData.status = TASK_STATUS_TO_PRISMA[updates.status];
      if (updates.priority) updateData.priority = PRIORITY_TO_PRISMA[updates.priority];
      
      // Remove fields that don't exist in the database
      delete updateData.user;
      delete updateData.collaborators;
      delete updateData.project;
      
      const updatedTask = await prisma.tasks.update({
        where: { id },
        data: updateData,
        include: {
          projects: true,
          users: true,
          task_collaborators: {
            include: {
              users: true
            }
          }
        }
      });

      const taskWithRelations = updatedTask as any;
      return {
        id: taskWithRelations.id,
        title: taskWithRelations.title,
        description: taskWithRelations.description,
        status: PRISMA_TO_TASK_STATUS[taskWithRelations.status as keyof typeof PRISMA_TO_TASK_STATUS] || 'IDEA',
        priority: reversePriorityMap[taskWithRelations.priority] || 'C',
        projectId: taskWithRelations.projectId || undefined,
        project: taskWithRelations.projects || undefined,
        userId: taskWithRelations.userId,
        user: taskWithRelations.users || undefined,
        collaborators: (taskWithRelations.task_collaborators || []).map((c: any) => ({
          id: c.id,
          taskId: c.taskId,
          userId: c.userId,
          user: c.users,
          createdAt: c.createdAt.toISOString()
        })),
        dueDate: taskWithRelations.dueDate || undefined,
        isArchived: taskWithRelations.isArchived,
        createdAt: taskWithRelations.createdAt.toISOString(),
        updatedAt: taskWithRelations.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Failed to update task:', error);
      return null;
    }
  }

  async deleteTask(id: string): Promise<boolean> {
    try {
      // Archive the task instead of deleting
      await prisma.tasks.update({
        where: { id },
        data: { isArchived: true }
      });
      return true;
    } catch (error) {
      console.error('Failed to archive task:', error);
      return false;
    }
  }

  // Add methods for user management
  async getUsers(): Promise<User[]> {
    try {
      const users = await prisma.users.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      });
      
      return users.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email || undefined,
        lineUserId: u.lineUserId || undefined,
        color: u.color,
        isActive: u.isActive,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
        skills: u.skills as any || undefined,
        preferences: u.preferences as any || undefined,
        workStyle: u.workStyle as any || undefined
      }));
    } catch (error) {
      console.error('Failed to get users:', error);
      return [];
    }
  }

  async getUserByLineId(lineId: string): Promise<User | null> {
    try {
      const user = await prisma.users.findUnique({
        where: { lineUserId: lineId }
      });
      
      if (!user) return null;
      
      return {
        id: user.id,
        name: user.name,
        email: user.email || undefined,
        lineUserId: user.lineUserId || undefined,
        color: user.color,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        skills: user.skills as any || undefined,
        preferences: user.preferences as any || undefined,
        workStyle: user.workStyle as any || undefined
      };
    } catch (error) {
      console.error('Failed to get user by line ID:', error);
      return null;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const user = await prisma.users.findUnique({
        where: { id }
      });
      
      if (!user) return null;
      
      return {
        id: user.id,
        name: user.name,
        email: user.email || undefined,
        lineUserId: user.lineUserId || undefined,
        color: user.color,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        skills: user.skills as any || undefined,
        preferences: user.preferences as any || undefined,
        workStyle: user.workStyle as any || undefined
      };
    } catch (error) {
      console.error('Failed to get user by ID:', error);
      return null;
    }
  }

  async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
    try {
      const updateData: any = {};
      
      // Copy regular fields
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.lineUserId !== undefined) updateData.lineUserId = updates.lineUserId;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
      
      // Handle JSON fields
      if (updates.skills !== undefined) updateData.skills = updates.skills;
      if (updates.preferences !== undefined) updateData.preferences = updates.preferences;
      if (updates.workStyle !== undefined) updateData.workStyle = updates.workStyle;
      
      updateData.updatedAt = new Date();
      
      const updatedUser = await prisma.users.update({
        where: { id },
        data: updateData
      });
      
      return {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email || undefined,
        lineUserId: updatedUser.lineUserId || undefined,
        color: updatedUser.color,
        isActive: updatedUser.isActive,
        createdAt: updatedUser.createdAt.toISOString(),
        updatedAt: updatedUser.updatedAt.toISOString(),
        skills: updatedUser.skills as any || undefined,
        preferences: updatedUser.preferences as any || undefined,
        workStyle: updatedUser.workStyle as any || undefined
      };
    } catch (error) {
      console.error('Failed to update user:', error);
      return null;
    }
  }

  // Connections
  async getConnections(): Promise<Connection[]> {
    try {
      const connections = await prisma.connections.findMany({
        orderBy: { updatedAt: 'desc' }
      });
      
      return connections.map((c: Awaited<ReturnType<typeof prisma.connections.findMany>>[0]) => ({
        ...c,
        type: reverseConnectionTypeMap[c.type] || 'company',
        businessCard: c.businessCard || undefined,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('Failed to get connections:', error);
      return [];
    }
  }

  async addConnection(connection: Omit<Connection, 'id' | 'createdAt' | 'updatedAt'>): Promise<Connection> {
    const newConnection = await prisma.connections.create({
      data: {
        id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...connection,
        type: connectionTypeMap[connection.type],
        updatedAt: new Date()
      }
    });

    return {
      ...newConnection,
      type: reverseConnectionTypeMap[newConnection.type] || 'company',
      businessCard: newConnection.businessCard || undefined,
      createdAt: newConnection.createdAt.toISOString(),
      updatedAt: newConnection.updatedAt.toISOString()
    };
  }

  async updateConnection(id: string, updates: Partial<Omit<Connection, 'id' | 'createdAt'>>): Promise<Connection | null> {
    try {
      const updateData: any = { ...updates };
      if (updates.type) updateData.type = connectionTypeMap[updates.type];
      
      const updatedConnection = await prisma.connections.update({
        where: { id },
        data: updateData
      });

      return {
        ...updatedConnection,
        type: reverseConnectionTypeMap[updatedConnection.type] || 'company',
        businessCard: updatedConnection.businessCard || undefined,
        createdAt: updatedConnection.createdAt.toISOString(),
        updatedAt: updatedConnection.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Failed to update connection:', error);
      return null;
    }
  }

  async deleteConnection(id: string): Promise<boolean> {
    try {
      await prisma.connections.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error('Failed to delete connection:', error);
      return false;
    }
  }

  // Calendar Events
  async getCalendarEvents(): Promise<CalendarEvent[]> {
    try {
      const events = await prisma.calendar_events.findMany({
        orderBy: { date: 'asc' }
      });
      
      return events.map((e: Awaited<ReturnType<typeof prisma.calendar_events.findMany>>[0]) => ({
        ...e,
        type: reverseEventTypeMap[e.type] || 'meeting',
        location: e.location || undefined,
        startTime: e.date,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('Failed to get calendar events:', error);
      return [];
    }
  }

  async addCalendarEvent(event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<CalendarEvent> {
    const { startTime, ...eventData } = event;
    const newEvent = await prisma.calendar_events.create({
      data: {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...eventData,
        date: startTime,
        time: new Date(startTime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        participants: [],
        type: eventTypeMap[event.type],
        updatedAt: new Date()
      }
    });

    return {
      ...newEvent,
      type: reverseEventTypeMap[newEvent.type] || 'meeting',
      location: newEvent.location || undefined,
      startTime: newEvent.date,
      createdAt: newEvent.createdAt.toISOString(),
      updatedAt: newEvent.updatedAt.toISOString()
    };
  }

  async updateCalendarEvent(id: string, updates: Partial<Omit<CalendarEvent, 'id' | 'createdAt'>>): Promise<CalendarEvent | null> {
    try {
      const updateData: any = { ...updates };
      if (updates.type) updateData.type = eventTypeMap[updates.type];
      if (updates.startTime) {
        updateData.date = updates.startTime;
        updateData.time = new Date(updates.startTime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
        delete updateData.startTime;
      }
      
      const updatedEvent = await prisma.calendar_events.update({
        where: { id },
        data: updateData
      });

      return {
        ...updatedEvent,
        type: reverseEventTypeMap[updatedEvent.type] || 'meeting',
        location: updatedEvent.location || undefined,
        startTime: updatedEvent.date,
        createdAt: updatedEvent.createdAt.toISOString(),
        updatedAt: updatedEvent.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Failed to update calendar event:', error);
      return null;
    }
  }

  async deleteCalendarEvent(id: string): Promise<boolean> {
    try {
      await prisma.calendar_events.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error('Failed to delete calendar event:', error);
      return false;
    }
  }

  // Knowledge Items
  async getKnowledge(): Promise<KnowledgeItem[]> {
    try {
      const knowledge = await prisma.knowledge_items.findMany({
        orderBy: { updatedAt: 'desc' }
      });
      
      return knowledge.map((k: Awaited<ReturnType<typeof prisma.knowledge_items.findMany>>[0]) => ({
        ...k,
        authorId: k.author, // Map author to authorId for compatibility
        category: reverseKnowledgeCategoryMap[k.category] || 'business',
        createdAt: k.createdAt.toISOString(),
        updatedAt: k.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('Failed to get knowledge:', error);
      return [];
    }
  }

  async addKnowledge(knowledge: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt' | 'likes'>): Promise<KnowledgeItem> {
    const { author, ...knowledgeData } = knowledge;
    const newKnowledge = await prisma.knowledge_items.create({
      data: {
        id: `knowledge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...knowledgeData,
        category: knowledgeCategoryMap[knowledge.category],
        author: author || 'Unknown',
        updatedAt: new Date()
      }
    });

    return {
      ...newKnowledge,
      authorId: newKnowledge.author, // Map author to authorId for compatibility
      category: reverseKnowledgeCategoryMap[newKnowledge.category] || 'business',
      createdAt: newKnowledge.createdAt.toISOString(),
      updatedAt: newKnowledge.updatedAt.toISOString()
    };
  }

  async updateKnowledge(id: string, updates: Partial<Omit<KnowledgeItem, 'id' | 'createdAt'>>): Promise<KnowledgeItem | null> {
    try {
      const updateData: any = { ...updates };
      if (updates.category) updateData.category = knowledgeCategoryMap[updates.category];
      
      const updatedKnowledge = await prisma.knowledge_items.update({
        where: { id },
        data: updateData
      });

      return {
        ...updatedKnowledge,
        authorId: updatedKnowledge.author, // Map author to authorId for compatibility
        category: reverseKnowledgeCategoryMap[updatedKnowledge.category] || 'business',
        createdAt: updatedKnowledge.createdAt.toISOString(),
        updatedAt: updatedKnowledge.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Failed to update knowledge:', error);
      return null;
    }
  }

  async deleteKnowledge(id: string): Promise<boolean> {
    try {
      await prisma.knowledge_items.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error('Failed to delete knowledge:', error);
      return false;
    }
  }

  // Appointments
  async getAppointments(): Promise<Appointment[]> {
    try {
      const appointments = await prisma.appointments.findMany({
        orderBy: { updatedAt: 'desc' }
      });
      
      return appointments.map((a: Awaited<ReturnType<typeof prisma.appointments.findMany>>[0]) => ({
        ...a,
        assignedToId: '', // Add default assignedToId for compatibility
        status: reverseAppointmentStatusMap[a.status] || 'pending',
        priority: reversePriorityMap[a.priority] || 'medium',
        lastContact: a.lastContact || undefined,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('Failed to get appointments:', error);
      return [];
    }
  }

  async addAppointment(appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Appointment> {
    const newAppointment = await prisma.appointments.create({
      data: {
        id: `appt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...appointment,
        status: appointmentStatusMap[appointment.status],
        priority: priorityMap[appointment.priority],
        updatedAt: new Date()
      }
    });

    return {
      ...newAppointment,
      assignedToId: appointment.assignedToId || '', // Include assignedToId
      status: reverseAppointmentStatusMap[newAppointment.status] || 'pending',
      priority: reversePriorityMap[newAppointment.priority] || 'medium',
      lastContact: newAppointment.lastContact || undefined,
      createdAt: newAppointment.createdAt.toISOString(),
      updatedAt: newAppointment.updatedAt.toISOString()
    };
  }

  async updateAppointment(id: string, updates: Partial<Omit<Appointment, 'id' | 'createdAt'>>): Promise<Appointment | null> {
    try {
      const updateData: any = { ...updates };
      if (updates.status) updateData.status = appointmentStatusMap[updates.status];
      if (updates.priority) updateData.priority = priorityMap[updates.priority];
      
      const updatedAppointment = await prisma.appointments.update({
        where: { id },
        data: updateData
      });

      return {
        ...updatedAppointment,
        assignedToId: '', // Add default assignedToId for compatibility
        status: reverseAppointmentStatusMap[updatedAppointment.status] || 'pending',
        priority: reversePriorityMap[updatedAppointment.priority] || 'medium',
        lastContact: updatedAppointment.lastContact || undefined,
        createdAt: updatedAppointment.createdAt.toISOString(),
        updatedAt: updatedAppointment.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Failed to update appointment:', error);
      return null;
    }
  }

  async deleteAppointment(id: string): Promise<boolean> {
    try {
      await prisma.appointments.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error('Failed to delete appointment:', error);
      return false;
    }
  }
}

export const prismaDataService = new PrismaDataService();