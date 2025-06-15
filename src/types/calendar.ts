// カレンダー機能の型定義

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;      // YYYY-MM-DD
  time: string;      // HH:mm
  endTime?: string;  // HH:mm
  type: EventType;
  userId: string;
  projectId?: string;
  taskId?: string;
  appointmentId?: string;
  category: EventCategory;
  importance: number; // 0.0-1.0
  isRecurring: boolean;
  recurringPattern?: string;
  colorCode?: string;
  isAllDay: boolean;
  description?: string;
  participants?: string[];
  location?: string;
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
  | 'GENERAL'
  | 'MEETING'
  | 'APPOINTMENT'
  | 'TASK_DUE'
  | 'PROJECT'
  | 'PERSONAL'
  | 'TEAM';

export type EventType =
  | 'MEETING'
  | 'EVENT'
  | 'DEADLINE';

// Prismaから返される型をより正確に定義
export interface PrismaCalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  endTime: string | null;
  type: string;
  userId: string;
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
  users?: {
    id: string;
    name: string;
    color: string;
  };
  projects?: {
    id: string;
    name: string;
  } | null;
  tasks?: {
    id: string;
    title: string;
    status: string;
  } | null;
  appointments?: {
    id: string;
    companyName: string;
    contactName: string;
  } | null;
  recurring_rules?: any | null;
}

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
  projectId?: string;
  taskId?: string;
  appointmentId?: string;
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {
  updateSeries?: boolean; // 繰り返し全体を更新
}

// カラーマップ
export const CATEGORY_COLORS = {
  GENERAL: '#6B7280',      // グレー
  MEETING: '#3B82F6',      // 青
  APPOINTMENT: '#10B981',  // 緑
  TASK_DUE: '#F59E0B',     // オレンジ
  PROJECT: '#8B5CF6',      // 紫
  PERSONAL: '#EC4899',     // ピンク
  TEAM: '#06B6D4'         // シアン
} as const;

export const IMPORTANCE_COLORS = {
  HIGH: '#EF4444',    // 赤
  MEDIUM: '#F59E0B',  // オレンジ
  LOW: '#10B981'      // 緑
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
}