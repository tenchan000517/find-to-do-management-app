export interface User {
  id: string;
  name: string;
  email?: string;
  lineUserId?: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  skills?: UserSkills;
  preferences?: UserPreferences;
  workStyle?: WorkStyle;
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
  phase?: string;
  kgi?: string;
  successProbability?: number;
  activityScore?: number;
  connectionPower?: number;
  lastActivityDate?: string;
  phaseChangeDate?: string;
  // 担当者システム統合
  createdBy?: string | null;
  assignedTo?: string | null; // プロジェクトマネージャー
  creator?: User;
  manager?: User;
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
  userId: string; // Legacy field for backward compatibility
  user?: User; // Legacy relation
  collaborators?: TaskCollaborator[];
  status: 'IDEA' | 'PLAN' | 'DO' | 'CHECK' | 'COMPLETE' | 'KNOWLEDGE' | 'DELETE';
  priority: 'A' | 'B' | 'C' | 'D';
  dueDate?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  estimatedHours?: number;
  actualHours?: number;
  estimatedTime?: number; // Added for enhanced kanban
  summary?: string; // Added for enhanced kanban workflow
  difficultyScore?: number;
  aiIssueLevel?: 'A' | 'B' | 'C' | 'D';
  resourceWeight?: number;
  // 担当者システム統合
  createdBy?: string | null;
  assignedTo?: string | null; // タスク担当者
  creator?: User;
  assignee?: User;
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
  // 担当者システム統合
  createdBy?: string | null;
  assignedTo?: string | null; // 関係構築担当者
  creator?: User;
  assignee?: User;
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
  // 担当者システム統合
  createdBy?: string | null;
  assignedTo?: string | null; // イベント責任者
  creator?: User;
  assignee?: User;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  category: 'industry' | 'sales' | 'technical' | 'business';
  content: string;
  authorId: string; // Legacy field for backward compatibility
  author: string; // Legacy field for backward compatibility
  tags: string[];
  likes: number;
  createdAt: string;
  updatedAt: string;
  // 担当者システム統合
  createdBy?: string | null;
  assignedTo?: string | null; // 管理担当者
  creator?: User;
  assignee?: User;
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
  assignedToId: string; // Legacy field for backward compatibility
  createdAt: string;
  updatedAt: string;
  // 担当者システム統合
  createdBy?: string | null;
  assignedTo?: string | null; // 営業担当者
  creator?: User;
  assignee?: User;
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

// 新規インターフェース（既存は変更しない）

export interface UserSkills {
  engineering: number;  // 1-10
  sales: number;
  creative: number;
  marketing: number;
  management: number;
  pr: number;
}

export interface UserPreferences {
  qol_weight: number;  // 0.5-2.0
  target_areas: string[];
  strengths: string[];
  weaknesses: string[];
}

export interface WorkStyle {
  focus_time: 'morning' | 'afternoon' | 'evening' | 'night';
  collaboration_preference: 'low' | 'medium' | 'high';
  stress_tolerance: 'low' | 'medium' | 'high';
}

export interface ProjectAlert {
  id: string;
  projectId: string;
  alertType: 'progress_stagnation' | 'activity_stagnation' | 'phase_stagnation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  isRead: boolean;
  isResolved: boolean;
  triggeredAt: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface UserAlert {
  id: string;
  userId: string;
  alertType: 'workload_risk' | 'low_priority_overload';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface PersonalSchedule {
  id: string;
  title: string;
  date: string;
  time: string;
  endTime?: string;
  description: string;
  location?: string;
  priority: 'A' | 'B' | 'C' | 'D';
  isAllDay: boolean;
  userId: string; // 個人予定は所有者固定
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface AIContentAnalysis {
  id: string;
  sourceType: string;
  sourceId: string;
  analysisType: string;
  result: any;
  confidence: number;
  modelVersion: string;
  createdAt: string;
  updatedAt: string;
  // 担当者システム統合
  createdBy?: string | null;
  assignedTo?: string | null; // レビュー担当者
  creator?: User;
  assignee?: User;
}

export interface AIEvaluation {
  id: string;
  entityType: string;
  entityId: string;
  evaluationType: 'resource_weight' | 'success_probability' | 'issue_level';
  score: number;
  reasoning?: string;
  confidence: number;
  modelVersion: string;
  createdAt: string;
}