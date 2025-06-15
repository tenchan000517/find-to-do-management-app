export interface User {
  id: string;
  name: string;
  email?: string;
  lineUserId?: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed';
  progress: number;
  startDate: string;
  endDate?: string;
  teamMembers: string[];
  priority: 'A' | 'B' | 'C' | 'D';
  createdAt: string;
  updatedAt: string;
}

export interface TaskCollaborator {
  id: string;
  taskId: string;
  userId: string;
  user?: User;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId?: string;
  project?: Project;
  userId: string;
  user?: User;
  collaborators?: TaskCollaborator[];
  status: 'IDEA' | 'PLAN' | 'DO' | 'CHECK' | 'COMPLETE' | 'KNOWLEDGE' | 'DELETE';
  priority: 'A' | 'B' | 'C' | 'D';
  dueDate?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Connection {
  id: string;
  date: string;
  location: string;
  company: string;
  name: string;
  position: string;
  type: 'student' | 'company';
  description: string;
  conversation: string;
  potential: string;
  businessCard?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  startTime: string;
  participants: string[];
  type: 'meeting' | 'event' | 'deadline';
  description: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  category: 'industry' | 'sales' | 'technical' | 'business';
  content: string;
  authorId: string;
  author: string;
  tags: string[];
  likes: number;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  status: 'pending' | 'contacted' | 'interested' | 'not_interested' | 'scheduled';
  lastContact?: string;
  nextAction: string;
  notes: string;
  priority: 'A' | 'B' | 'C' | 'D';
  assignedToId: string;
  createdAt: string;
  updatedAt: string;
}

// Display labels
export const TASK_STATUS_LABELS = {
  IDEA: 'アイデア',
  PLAN: '計画中',
  DO: '実行中', 
  CHECK: '課題・改善',
  COMPLETE: '完了',
  KNOWLEDGE: 'ナレッジ昇華',
  DELETE: 'リスケ'
} as const;

export const PRIORITY_LABELS = {
  A: '最優先',
  B: '重要', 
  C: '緊急',
  D: '要検討'
} as const;