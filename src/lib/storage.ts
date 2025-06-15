import { 
  Project, 
  Task, 
  Connection, 
  CalendarEvent, 
  KnowledgeItem, 
  Appointment 
} from './types';

const STORAGE_KEYS = {
  PROJECTS: 'find-to-do-projects',
  TASKS: 'find-to-do-tasks',
  CONNECTIONS: 'find-to-do-connections',
  CALENDAR_EVENTS: 'find-to-do-calendar-events',
  KNOWLEDGE: 'find-to-do-knowledge',
  APPOINTMENTS: 'find-to-do-appointments',
} as const;

class LocalStorage {
  private isClient = typeof window !== 'undefined';

  private get<T>(key: string): T[] {
    if (!this.isClient) return [];
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private set<T>(key: string, data: T[]): void {
    if (!this.isClient) return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  getProjects(): Project[] {
    return this.get<Project>(STORAGE_KEYS.PROJECTS);
  }

  setProjects(projects: Project[]): void {
    this.set(STORAGE_KEYS.PROJECTS, projects);
  }

  getTasks(): Task[] {
    return this.get<Task>(STORAGE_KEYS.TASKS);
  }

  setTasks(tasks: Task[]): void {
    this.set(STORAGE_KEYS.TASKS, tasks);
  }

  getConnections(): Connection[] {
    return this.get<Connection>(STORAGE_KEYS.CONNECTIONS);
  }

  setConnections(connections: Connection[]): void {
    this.set(STORAGE_KEYS.CONNECTIONS, connections);
  }

  getCalendarEvents(): CalendarEvent[] {
    return this.get<CalendarEvent>(STORAGE_KEYS.CALENDAR_EVENTS);
  }

  setCalendarEvents(events: CalendarEvent[]): void {
    this.set(STORAGE_KEYS.CALENDAR_EVENTS, events);
  }

  getKnowledge(): KnowledgeItem[] {
    return this.get<KnowledgeItem>(STORAGE_KEYS.KNOWLEDGE);
  }

  setKnowledge(knowledge: KnowledgeItem[]): void {
    this.set(STORAGE_KEYS.KNOWLEDGE, knowledge);
  }

  getAppointments(): Appointment[] {
    return this.get<Appointment>(STORAGE_KEYS.APPOINTMENTS);
  }

  setAppointments(appointments: Appointment[]): void {
    this.set(STORAGE_KEYS.APPOINTMENTS, appointments);
  }
}

export const storage = new LocalStorage();