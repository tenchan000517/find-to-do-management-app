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
    const { creator, manager, ...projectData } = project;
    const newProject = await prisma.projects.create({
      data: {
        id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...projectData,
        status: projectStatusMap[project.status],
        priority: priorityMap[project.priority],
        updatedAt: new Date(),
        createdBy: project.createdBy || null,
        assignedTo: project.assignedTo || null
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
        priority: reversePriorityMap[updatedProject.priority] || 'C',
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
        email: c.email || undefined,
        phone: c.phone || undefined,
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
    const { creator, assignee, ...connectionData } = connection;
    const newConnection = await prisma.connections.create({
      data: {
        id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...connectionData,
        type: connectionTypeMap[connection.type],
        updatedAt: new Date(),
        createdBy: connection.createdBy || null,
        assignedTo: connection.assignedTo || null
      }
    });

    return {
      ...newConnection,
      type: reverseConnectionTypeMap[newConnection.type] || 'company',
      email: newConnection.email || undefined,
      phone: newConnection.phone || undefined,
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
        email: updatedConnection.email || undefined,
        phone: updatedConnection.phone || undefined,
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
        meetingUrl: e.meetingUrl || undefined,
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
    const { startTime, creator, assignee, ...eventData } = event;
    const newEvent = await prisma.calendar_events.create({
      data: {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...eventData,
        date: startTime,
        time: new Date(startTime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        participants: [],
        type: eventTypeMap[event.type],
        updatedAt: new Date(),
        createdBy: eventData.createdBy || null,
        assignedTo: eventData.assignedTo || null
      }
    });

    return {
      ...newEvent,
      type: reverseEventTypeMap[newEvent.type] || 'meeting',
      location: newEvent.location || undefined,
      meetingUrl: newEvent.meetingUrl || undefined,
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
        meetingUrl: updatedEvent.meetingUrl || undefined,
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
    const { author, creator, assignee, assigneeId, ...knowledgeData } = knowledge as any;
    const newKnowledge = await prisma.knowledge_items.create({
      data: {
        id: `knowledge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...knowledgeData,
        category: knowledgeCategoryMap[knowledge.category],
        author: author || 'Unknown',
        updatedAt: new Date(),
        createdBy: knowledgeData.createdBy || null,
        assignedTo: assigneeId || knowledgeData.assignedTo || null
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
      const { assigneeId, authorId, creator, assignee, updatedAt, ...validUpdates } = updates as any;
      const updateData: any = { ...validUpdates };
      
      if (updates.category) updateData.category = knowledgeCategoryMap[updates.category];
      if (assigneeId !== undefined) updateData.assignedTo = assigneeId || null;
      
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
        include: {
          details: true,
          creator: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } }
        },
        orderBy: { updatedAt: 'desc' }
      });
      
      return appointments.map((a: any) => ({
        ...a,
        assignedToId: a.assignedTo || '', // Use actual assignedTo value
        status: reverseAppointmentStatusMap[a.status] || 'pending',
        priority: reversePriorityMap[a.priority] || 'C',
        lastContact: a.lastContact || undefined,
        meetingUrl: a.meetingUrl || undefined,
        informationUrl: a.informationUrl || undefined,
        details: a.details || undefined,
        creator: a.creator || undefined,
        assignee: a.assignee || undefined,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('Failed to get appointments:', error);
      return [];
    }
  }

  async addAppointment(appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Appointment> {
    const { creator, assignee, assignedToId, details, ...appointmentData } = appointment;
    const newAppointment = await prisma.appointments.create({
      data: {
        id: `appt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        companyName: appointment.companyName,
        contactName: appointment.contactName,
        phone: appointment.phone,
        email: appointment.email,
        lastContact: appointment.lastContact,
        nextAction: appointment.nextAction,
        notes: appointment.notes,
        status: appointmentStatusMap[appointment.status],
        priority: priorityMap[appointment.priority],
        updatedAt: new Date(),
        createdBy: appointment.createdBy || null,
        assignedTo: appointment.assignedTo || null
      }
    });

    return {
      ...newAppointment,
      assignedToId: appointment.assignedToId || '', // Include assignedToId
      status: reverseAppointmentStatusMap[newAppointment.status] || 'pending',
      priority: reversePriorityMap[newAppointment.priority] || 'C',
      lastContact: newAppointment.lastContact || undefined,
      meetingUrl: newAppointment.meetingUrl || undefined,
      informationUrl: newAppointment.informationUrl || undefined,
      createdAt: newAppointment.createdAt.toISOString(),
      updatedAt: newAppointment.updatedAt.toISOString()
    };
  }

  async updateAppointment(id: string, updates: Partial<Omit<Appointment, 'id' | 'createdAt'>>): Promise<Appointment | null> {
    try {
      const updateData: any = { ...updates };
      if (updates.status) updateData.status = appointmentStatusMap[updates.status];
      if (updates.priority) updateData.priority = priorityMap[updates.priority];
      
      // Remove fields that don't exist in the database schema or are handled separately
      delete updateData.assignedToId;
      delete updateData.details;
      
      const updatedAppointment = await prisma.appointments.update({
        where: { id },
        data: updateData
      });

      return {
        ...updatedAppointment,
        assignedToId: updatedAppointment.assignedTo || '', // Map assignedTo to assignedToId for compatibility
        status: reverseAppointmentStatusMap[updatedAppointment.status] || 'pending',
        priority: reversePriorityMap[updatedAppointment.priority] || 'C',
        lastContact: updatedAppointment.lastContact || undefined,
        meetingUrl: updatedAppointment.meetingUrl || undefined,
        informationUrl: updatedAppointment.informationUrl || undefined,
        createdAt: updatedAppointment.createdAt.toISOString(),
        updatedAt: updatedAppointment.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Failed to update appointment:', error);
      return null;
    }
  }

  async getAppointmentById(id: string): Promise<Appointment | null> {
    try {
      const appointment = await prisma.appointments.findUnique({
        where: { id },
        include: {
          details: true,
          calendar_events: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              date: true,
              time: true,
              location: true,
              description: true,
              participants: true,
              createdAt: true
            }
          }
        }
      });
      
      if (!appointment) return null;
      
      return {
        ...appointment,
        assignedToId: '', // Add default assignedToId for compatibility
        status: reverseAppointmentStatusMap[appointment.status] || 'pending',
        priority: reversePriorityMap[appointment.priority] || 'C',
        lastContact: appointment.lastContact || undefined,
        meetingUrl: appointment.meetingUrl || undefined,
        informationUrl: appointment.informationUrl || undefined,
        calendar_events: appointment.calendar_events || [],
        details: appointment.details || undefined,
        createdAt: appointment.createdAt.toISOString(),
        updatedAt: appointment.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Failed to get appointment by ID:', error);
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

  // AI evaluation methods
  async getProjectById(id: string): Promise<any | null> {
    try {
      const project = await prisma.projects.findUnique({
        where: { id }
      });
      
      if (!project) return null;
      
      return {
        ...project,
        status: reverseProjectStatusMap[project.status] || 'planning',
        priority: reversePriorityMap[project.priority] || 'C',
        startDate: project.startDate,
        endDate: project.endDate || undefined,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        lastActivityDate: project.lastActivityDate?.toISOString(),
        phaseChangeDate: project.phaseChangeDate?.toISOString()
      };
    } catch (error) {
      console.error('Failed to get project by ID:', error);
      return null;
    }
  }

  async getTaskById(id: string): Promise<Task | null> {
    try {
      const task = await prisma.tasks.findUnique({
        where: { id },
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
      
      if (!task) return null;
      
      const taskWithRelations = task as any;
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
        updatedAt: taskWithRelations.updatedAt.toISOString(),
        estimatedHours: taskWithRelations.estimatedHours || undefined,
        actualHours: taskWithRelations.actualHours || undefined,
        difficultyScore: taskWithRelations.difficultyScore || undefined,
        aiIssueLevel: taskWithRelations.aiIssueLevel || undefined,
        resourceWeight: taskWithRelations.resourceWeight || undefined
      };
    } catch (error) {
      console.error('Failed to get task by ID:', error);
      return null;
    }
  }

  async getTasksByUserId(userId: string): Promise<Task[]> {
    try {
      const tasks = await prisma.tasks.findMany({
        where: {
          userId,
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
        updatedAt: t.updatedAt.toISOString(),
        estimatedHours: t.estimatedHours || undefined,
        actualHours: t.actualHours || undefined,
        difficultyScore: t.difficultyScore || undefined,
        aiIssueLevel: t.aiIssueLevel || undefined,
        resourceWeight: t.resourceWeight || undefined
      }));
    } catch (error) {
      console.error('Failed to get tasks by user ID:', error);
      return [];
    }
  }

  async getTasksByProjectId(projectId: string): Promise<Task[]> {
    try {
      const tasks = await prisma.tasks.findMany({
        where: {
          projectId,
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
        updatedAt: t.updatedAt.toISOString(),
        estimatedHours: t.estimatedHours || undefined,
        actualHours: t.actualHours || undefined,
        difficultyScore: t.difficultyScore || undefined,
        aiIssueLevel: t.aiIssueLevel || undefined,
        resourceWeight: t.resourceWeight || undefined
      }));
    } catch (error) {
      console.error('Failed to get tasks by project ID:', error);
      return [];
    }
  }

  async getAllTasks(): Promise<Task[]> {
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
        updatedAt: t.updatedAt.toISOString(),
        estimatedHours: t.estimatedHours || undefined,
        actualHours: t.actualHours || undefined,
        difficultyScore: t.difficultyScore || undefined,
        aiIssueLevel: t.aiIssueLevel || undefined,
        resourceWeight: t.resourceWeight || undefined
      }));
    } catch (error) {
      console.error('Failed to get all tasks:', error);
      return [];
    }
  }

  async createAIEvaluation(evaluation: {
    entityType: string;
    entityId: string;
    evaluationType: string;
    score: number;
    reasoning: string;
    confidence: number;
  }): Promise<any> {
    try {
      const newEvaluation = await prisma.ai_evaluations.create({
        data: {
          id: `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...evaluation
        }
      });
      
      return newEvaluation;
    } catch (error) {
      console.error('Failed to create AI evaluation:', error);
      return null;
    }
  }

  // Project Relationships Methods
  async createProjectRelationship(relationship: {
    projectId: string;
    relatedType: string;
    relatedId: string;
    relationshipStrength: number;
  }): Promise<any> {
    try {
      const newRelationship = await prisma.project_relationships.create({
        data: {
          id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...relationship
        }
      });
      
      return newRelationship;
    } catch (error) {
      console.error('Failed to create project relationship:', error);
      return null;
    }
  }

  async getProjectRelationships(projectId: string): Promise<any[]> {
    try {
      const relationships = await prisma.project_relationships.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' }
      });
      
      return relationships;
    } catch (error) {
      console.error('Failed to get project relationships:', error);
      return [];
    }
  }

  // Project Alerts Methods
  async getProjectAlerts(projectId: string): Promise<any[]> {
    try {
      const alerts = await prisma.project_alerts.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' }
      });
      
      return alerts;
    } catch (error) {
      console.error('Failed to get project alerts:', error);
      return [];
    }
  }

  async createProjectAlert(alert: {
    id: string;
    projectId: string;
    alertType: string;
    severity: string;
    message: string;
    isRead?: boolean;
    isResolved?: boolean;
    triggeredAt: string;
    createdAt: string;
  }): Promise<any> {
    try {
      const newAlert = await prisma.project_alerts.create({
        data: {
          id: alert.id,
          projectId: alert.projectId,
          alertType: alert.alertType,
          severity: alert.severity,
          message: alert.message,
          isRead: alert.isRead || false,
          isResolved: alert.isResolved || false,
          triggeredAt: new Date(alert.triggeredAt),
          createdAt: new Date(alert.createdAt)
        }
      });
      
      return newAlert;
    } catch (error) {
      console.error('Failed to create project alert:', error);
      return null;
    }
  }

  async updateProjectAlert(alertId: string, updates: {
    isRead?: boolean;
    isResolved?: boolean;
    resolvedAt?: string;
  }): Promise<any> {
    try {
      const updateData: any = {};
      if (updates.isRead !== undefined) updateData.isRead = updates.isRead;
      if (updates.isResolved !== undefined) updateData.isResolved = updates.isResolved;
      if (updates.resolvedAt) updateData.resolvedAt = new Date(updates.resolvedAt);

      const updatedAlert = await prisma.project_alerts.update({
        where: { id: alertId },
        data: updateData
      });
      
      return updatedAlert;
    } catch (error) {
      console.error('Failed to update project alert:', error);
      return null;
    }
  }

  async getUserAlerts(userId: string): Promise<any[]> {
    try {
      const alerts = await prisma.user_alerts.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
      
      return alerts;
    } catch (error) {
      console.error('Failed to get user alerts:', error);
      return [];
    }
  }

  async createUserAlert(alert: {
    id: string;
    userId: string;
    alertType: string;
    severity: string;
    message: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    isRead?: boolean;
    createdAt: string;
  }): Promise<any> {
    try {
      const newAlert = await prisma.user_alerts.create({
        data: {
          id: alert.id,
          userId: alert.userId,
          alertType: alert.alertType,
          severity: alert.severity,
          message: alert.message,
          relatedEntityType: alert.relatedEntityType,
          relatedEntityId: alert.relatedEntityId,
          isRead: alert.isRead || false,
          createdAt: new Date(alert.createdAt)
        }
      });
      
      return newAlert;
    } catch (error) {
      console.error('Failed to create user alert:', error);
      return null;
    }
  }

  async updateUserAlert(alertId: string, updates: {
    isRead?: boolean;
  }): Promise<any> {
    try {
      const updateData: any = {};
      if (updates.isRead !== undefined) updateData.isRead = updates.isRead;

      const updatedAlert = await prisma.user_alerts.update({
        where: { id: alertId },
        data: updateData
      });
      
      return updatedAlert;
    } catch (error) {
      console.error('Failed to update user alert:', error);
      return null;
    }
  }

  // Project Phase History Methods
  async getProjectPhaseHistory(projectId: string): Promise<any[]> {
    try {
      const history = await prisma.project_phase_history.findMany({
        where: { projectId },
        include: { users: true },
        orderBy: { createdAt: 'desc' }
      });
      
      return history;
    } catch (error) {
      console.error('Failed to get project phase history:', error);
      return [];
    }
  }

  // Additional entity getters needed by RelationshipService

  async getCalendarEventById(id: string): Promise<any> {
    try {
      const event = await prisma.calendar_events.findUnique({
        where: { id }
      });
      
      return event;
    } catch (error) {
      console.error('Failed to get calendar event by ID:', error);
      return null;
    }
  }

  async getConnectionById(id: string): Promise<any> {
    try {
      const connection = await prisma.connections.findUnique({
        where: { id }
      });
      
      return connection;
    } catch (error) {
      console.error('Failed to get connection by ID:', error);
      return null;
    }
  }
}

export const prismaDataService = new PrismaDataService();