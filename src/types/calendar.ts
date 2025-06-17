// カレンダー機能の型定義

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;      // YYYY-MM-DD
  time: string;      // HH:mm
  endTime?: string;  // HH:mm
  type: EventType;
  userId?: string;
  projectId?: string;
  taskId?: string;
  appointmentId?: string;
  category: EventCategory;
  importance: number; // 0.0-1.0 (legacy)
  priority?: PriorityLevel; // A/B/C/D system
  isRecurring: boolean;
  recurringPattern?: string;
  colorCode?: string;
  isAllDay: boolean;
  description?: string;
  participants?: string[];
  location?: string;
  // 担当者システム統合
  createdBy?: string | null;
  assignedTo?: string | null; // イベント責任者
  creator?: {
    id: string;
    name: string;
    color: string;
  };
  assignee?: {
    id: string;
    name: string;
    color: string;
  };
  // リレーションデータ
  users?: {
    id: string;
    name: string;
    color: string;
  };
  projects?: {
    id: string;
    name: string;
    priority?: PriorityLevel;
  };
  tasks?: {
    id: string;
    title: string;
    status: string;
    priority?: PriorityLevel;
  };
  appointments?: {
    id: string;
    companyName: string;
    contactName: string;
    priority?: PriorityLevel;
  };
}

export interface RecurringRule {
  id: string;
  ruleName: string;
  recurrenceType: RecurrenceType;
  weekdays: number[];     // 0-6
  monthDay?: number;      // 1-31
  monthWeek?: number;     // 1-5
  monthWeekday?: number;  // 0-6
  interval: number;
  startDate: string;
  endDate?: string;
  maxOccurrences?: number;
  excludeDates: string[];
}

export type EventCategory = 
  | 'APPOINTMENT'
  | 'TASK_DUE'
  | 'PROJECT'
  | 'EVENT'
  | 'PERSONAL';

export type EventType =
  | 'MEETING'
  | 'EVENT'
  | 'DEADLINE'
  | 'PERSONAL';

// Prismaから返される型をより正確に定義
export interface PrismaCalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  endTime: string | null;
  type: string;
  userId: string | null;
  projectId: string | null;
  taskId: string | null;
  appointmentId: string | null;
  category: string;
  importance: number;
  isRecurring: boolean;
  recurringPattern: string | null;
  colorCode: string | null;
  isAllDay: boolean;
  description: string;
  participants: string[];
  location: string | null;
  // 担当者システム統合
  createdBy: string | null;
  assignedTo: string | null;
  creator: {
    id: string;
    name: string;
    color: string;
  } | null;
  assignee: {
    id: string;
    name: string;
    color: string;
  } | null;
  users: {
    id: string;
    name: string;
    color: string;
  } | null;
  projects: {
    id: string;
    name: string;
  } | null;
  tasks: {
    id: string;
    title: string;
    status: string;
    priority?: string;
  } | null;
  appointments: {
    id: string;
    companyName: string;
    contactName: string;
    priority?: string;
  } | null;
  recurring_rules?: any | null;
}

export type PriorityLevel = 'A' | 'B' | 'C' | 'D';

export type RecurrenceType =
  | 'DAILY'
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'CUSTOM';

export type ViewMode = 'month' | 'week' | 'day';
export type ColorMode = 'user' | 'category' | 'importance';

// API レスポンス型
export interface GetEventsResponse {
  events: CalendarEvent[];
  totalCount: number;
}

export interface CreateEventRequest {
  title: string;
  date: string;
  time: string;
  endTime?: string;
  category: EventCategory;
  importance?: number;
  recurringRule?: Partial<RecurringRule>;
  description?: string;
  participants?: string[];
  location?: string;
  userId?: string;
  projectId?: string;
  taskId?: string;
  appointmentId?: string;
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {
  updateSeries?: boolean; // 繰り返し全体を更新
}

// カラーマップ
export const CATEGORY_COLORS = {
  APPOINTMENT: '#10B981',  // 緑 - アポイントメント
  TASK_DUE: '#F59E0B',     // オレンジ - タスク期限
  PROJECT: '#8B5CF6',      // 紫 - プロジェクト
  EVENT: '#3B82F6',        // 青 - イベント
  PERSONAL: '#EC4899'      // ピンク - 個人予定
} as const;

export const PRIORITY_COLORS = {
  A: '#EF4444',    // 赤 - 緊急
  B: '#F59E0B',    // オレンジ - 重要
  C: '#3B82F6',    // 青 - 最優先
  D: '#10B981'     // 緑 - 要検討
} as const;

export const IMPORTANCE_COLORS = {
  HIGH: '#EF4444',    // 赤
  MEDIUM: '#F59E0B',  // オレンジ
  LOW: '#10B981'      // 緑
} as const;

// 統合カレンダーイベント型
export interface UnifiedCalendarEvent {
  // 既存のCalendarEventフィールド
  id: string;
  title: string;
  date: string;
  time: string;
  endTime?: string;
  type: EventType;
  category: EventCategory;
  description?: string;
  location?: string;
  
  // 新規フィールド
  source: 'calendar_events' | 'personal_schedules' | 'tasks' | 'appointments';
  isPersonal: boolean;
  priority?: PriorityLevel;
  
  // CalendarEventとの互換性
  isRecurring?: boolean;
  recurringPattern?: string;
  participants?: string[];
  
  // ソース特定フィールド
  userId?: string;
  projectId?: string;
  taskId?: string;
  appointmentId?: string;
  
  // 担当者システム
  createdBy?: string | null;
  assignedTo?: string | null;
  creator?: {
    id: string;
    name: string;
    color: string;
  };
  assignee?: {
    id: string;
    name: string;
    color: string;
  };
  
  // 関連データ
  users?: {
    id: string;
    name: string;
    color: string;
  };
  projects?: {
    id: string;
    name: string;
    priority?: PriorityLevel;
  };
  tasks?: {
    id: string;
    title: string;
    status: string;
    priority?: PriorityLevel;
  };
  appointments?: {
    id: string;
    companyName: string;
    contactName: string;
    priority?: PriorityLevel;
  };
  
  // 表示設定
  colorCode?: string;
  isAllDay?: boolean;
  importance: number;
}

export type EventSource = 'all' | 'personal' | 'public' | 'tasks' | 'appointments';

// 統合カレンダーAPI
export interface UnifiedCalendarQuery {
  startDate: string;     // YYYY-MM-DD
  endDate: string;       // YYYY-MM-DD
  userId?: string;       // フィルター用
  includePersonal?: boolean;  // デフォルト: true
  includePublic?: boolean;    // デフォルト: true
}

export interface UnifiedCalendarResponse {
  events: UnifiedCalendarEvent[];
  totalCount: number;
  sources: {
    calendar_events: number;
    personal_schedules: number;
    tasks: number;
    appointments: number;
  };
}

// 個人予定用カラーパレット
export const PERSONAL_SCHEDULE_COLORS = {
  A: '#EF4444',    // 赤 - 最重要
  B: '#F59E0B',    // オレンジ - 重要
  C: '#3B82F6',    // 青 - 普通
  D: '#10B981'     // 緑 - 低優先度
} as const;

// ソース別カラー
export const SOURCE_COLORS = {
  personal_schedules: '#3B82F6',  // 青
  calendar_events: '#8B5CF6',     // 紫
  tasks: '#F59E0B',               // オレンジ
  appointments: '#10B981'         // 緑
} as const;

// フィルター型
export interface CalendarFilters {
  startDate: string;
  endDate: string;
  userId?: string;
  projectId?: string;
  category?: EventCategory;
  includeRecurring?: boolean;
  colorMode?: ColorMode;
  source?: EventSource;
}