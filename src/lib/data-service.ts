import { 
  Project, 
  Task, 
  Connection, 
  CalendarEvent, 
  KnowledgeItem, 
  Appointment 
} from './types';
import { prismaDataService } from './database/prisma-service';

export class DataService {
  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async getProjects(): Promise<Project[]> {
    return prismaDataService.getProjects();
  }

  async addProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    return prismaDataService.addProject(project);
  }

  async updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>): Promise<Project | null> {
    return prismaDataService.updateProject(id, updates);
  }

  async deleteProject(id: string): Promise<boolean> {
    return prismaDataService.deleteProject(id);
  }

  async getTasks(): Promise<Task[]> {
    return prismaDataService.getTasks();
  }

  async addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    return prismaDataService.addTask(task);
  }

  async updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task | null> {
    return prismaDataService.updateTask(id, updates);
  }

  async deleteTask(id: string): Promise<boolean> {
    return prismaDataService.deleteTask(id);
  }

  async getConnections(): Promise<Connection[]> {
    return prismaDataService.getConnections();
  }

  async addConnection(connection: Omit<Connection, 'id' | 'createdAt' | 'updatedAt'>): Promise<Connection> {
    return prismaDataService.addConnection(connection);
  }

  async updateConnection(id: string, updates: Partial<Omit<Connection, 'id' | 'createdAt'>>): Promise<Connection | null> {
    return prismaDataService.updateConnection(id, updates);
  }

  async deleteConnection(id: string): Promise<boolean> {
    return prismaDataService.deleteConnection(id);
  }

  async getCalendarEvents(): Promise<CalendarEvent[]> {
    return prismaDataService.getCalendarEvents();
  }

  async addCalendarEvent(event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<CalendarEvent> {
    return prismaDataService.addCalendarEvent(event);
  }

  async updateCalendarEvent(id: string, updates: Partial<Omit<CalendarEvent, 'id' | 'createdAt'>>): Promise<CalendarEvent | null> {
    return prismaDataService.updateCalendarEvent(id, updates);
  }

  async deleteCalendarEvent(id: string): Promise<boolean> {
    return prismaDataService.deleteCalendarEvent(id);
  }

  async getKnowledge(): Promise<KnowledgeItem[]> {
    return prismaDataService.getKnowledge();
  }

  async addKnowledge(knowledge: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt' | 'likes'>): Promise<KnowledgeItem> {
    return prismaDataService.addKnowledge(knowledge);
  }

  async updateKnowledge(id: string, updates: Partial<Omit<KnowledgeItem, 'id' | 'createdAt'>>): Promise<KnowledgeItem | null> {
    return prismaDataService.updateKnowledge(id, updates);
  }

  async deleteKnowledge(id: string): Promise<boolean> {
    return prismaDataService.deleteKnowledge(id);
  }

  async getAppointments(): Promise<Appointment[]> {
    return prismaDataService.getAppointments();
  }

  async addAppointment(appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Appointment> {
    return prismaDataService.addAppointment(appointment);
  }

  async updateAppointment(id: string, updates: Partial<Omit<Appointment, 'id' | 'createdAt'>>): Promise<Appointment | null> {
    return prismaDataService.updateAppointment(id, updates);
  }

  async deleteAppointment(id: string): Promise<boolean> {
    return prismaDataService.deleteAppointment(id);
  }
}

export const dataService = new DataService();