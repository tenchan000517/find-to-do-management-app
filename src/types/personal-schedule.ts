export interface PersonalSchedule {
  id: string;
  title: string;
  date: string;          // YYYY-MM-DD
  time: string;          // HH:mm
  endTime?: string;      // HH:mm
  description?: string;
  location?: string;
  userId: string;
  priority: PriorityLevel;
  isAllDay: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PriorityLevel = 'A' | 'B' | 'C' | 'D';

export interface CreateScheduleRequest {
  title: string;
  date: string;          // YYYY-MM-DD
  time: string;          // HH:mm
  endTime?: string;      // HH:mm
  description?: string;
  location?: string;
  userId: string;
  priority?: PriorityLevel;
  isAllDay?: boolean;
}

export interface UpdateScheduleRequest {
  id: string;
  title?: string;
  date?: string;
  time?: string;
  endTime?: string;
  description?: string;
  location?: string;
  priority?: PriorityLevel;
  isAllDay?: boolean;
}

export interface ScheduleListQuery {
  startDate?: string;    // YYYY-MM-DD
  endDate?: string;      // YYYY-MM-DD
  userId?: string;
  priority?: PriorityLevel;
}

export interface ScheduleListResponse {
  schedules: PersonalSchedule[];
  totalCount: number;
}

export interface CreateScheduleResponse {
  schedule: PersonalSchedule;
}

export interface ScheduleDetailResponse {
  schedule: PersonalSchedule;
}

export interface DeleteResponse {
  success: boolean;
}