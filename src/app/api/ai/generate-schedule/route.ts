import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { 
  DEMO_TASKS, 
  DEMO_EVENTS, 
  DEMO_USER_PREFERENCES 
} from '@/lib/demo/demo-data';

interface Task {
  id: string;
  title: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate?: string;
  estimatedHours?: number;
  status: string;
}

interface Event {
  id: string;
  title: string;
  startTime: string;
  endTime?: string;
}

interface UserPreferences {
  workStartTime: string;
  workEndTime: string;
  lunchTime: string;
  focusBlocks: boolean;
  breakInterval: number;
  personalityType: 'morning' | 'afternoon' | 'balanced';
}

interface ScheduleBlock {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  type: 'task' | 'meeting' | 'break' | 'focus';
  priority: 'high' | 'medium' | 'low';
  estimatedProductivity: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let { tasks, events, preferences, date } = await request.json();

    // デモモード処理: 未ログイン時またはデータが空の場合
    const isDemoMode = !session || !tasks || tasks.length === 0;
    
    if (isDemoMode) {
      // デモデータを使用
      tasks = tasks?.length > 0 ? tasks : DEMO_TASKS;
      events = events?.length > 0 ? events : DEMO_EVENTS;
      preferences = preferences || DEMO_USER_PREFERENCES;
    }

    if (!tasks || !Array.isArray(tasks)) {
      return NextResponse.json({ error: 'Tasks array is required' }, { status: 400 });
    }

    const schedule = await generateOptimalSchedule(tasks, events || [], preferences);

    return NextResponse.json({
      success: true,
      schedule,
      date,
      isDemoMode,
      metadata: {
        totalTasks: tasks.length,
        scheduledTasks: schedule.filter(s => s.type === 'task').length,
        estimatedProductivity: Math.round(
          schedule.reduce((sum, s) => sum + s.estimatedProductivity, 0) / schedule.length
        ),
        message: isDemoMode ? 'デモデータを使用したスケジュールです' : null
      }
    });

  } catch (error) {
    console.error('Schedule generation error:', error);
    return NextResponse.json({
      success: false,
      error: 'スケジュール生成中にエラーが発生しました'
    }, { status: 500 });
  }
}

async function generateOptimalSchedule(
  tasks: Task[], 
  events: Event[], 
  preferences: UserPreferences
): Promise<ScheduleBlock[]> {
  const schedule: ScheduleBlock[] = [];
  
  // Parse work hours
  const workStart = parseTimeToMinutes(preferences.workStartTime);
  const workEnd = parseTimeToMinutes(preferences.workEndTime);
  const lunchTime = parseTimeToMinutes(preferences.lunchTime);

  // Add existing meetings to schedule
  events.forEach(event => {
    const startTime = new Date(event.startTime);
    const endTime = event.endTime ? new Date(event.endTime) : new Date(startTime.getTime() + 60 * 60 * 1000);
    
    schedule.push({
      id: `meeting-${event.id}`,
      startTime: formatTime(startTime.getHours(), startTime.getMinutes()),
      endTime: formatTime(endTime.getHours(), endTime.getMinutes()),
      title: event.title,
      type: 'meeting',
      priority: 'high',
      estimatedProductivity: 85
    });
  });

  // Generate productivity curve based on personality type
  const productivityCurve = generateProductivityCurve(preferences.personalityType, workStart, workEnd);

  // Sort tasks by priority and urgency
  const sortedTasks = prioritizeTasks(tasks);

  // Generate time slots
  const availableSlots = generateTimeSlots(workStart, workEnd, lunchTime, schedule, preferences);

  // Assign tasks to optimal time slots
  let slotIndex = 0;
  for (const task of sortedTasks.slice(0, 8)) { // Limit to 8 tasks per day
    if (slotIndex >= availableSlots.length) break;

    const slot = availableSlots[slotIndex];
    const estimatedMinutes = (task.estimatedHours || 1) * 60;
    const endTime = slot.start + estimatedMinutes;

    // Check if task fits in the slot
    if (endTime <= slot.end) {
      schedule.push({
        id: `task-${task.id}`,
        startTime: minutesToTime(slot.start),
        endTime: minutesToTime(endTime),
        title: task.title,
        type: 'task',
        priority: task.priority.toLowerCase() as 'high' | 'medium' | 'low',
        estimatedProductivity: getProductivityAtTime(slot.start, productivityCurve)
      });

      // Add break if needed
      if (estimatedMinutes > 90 && slotIndex < availableSlots.length - 1) {
        const breakEnd = endTime + 15;
        schedule.push({
          id: `break-${task.id}`,
          startTime: minutesToTime(endTime),
          endTime: minutesToTime(breakEnd),
          title: '休憩',
          type: 'break',
          priority: 'low',
          estimatedProductivity: 0
        });
      }

      slotIndex++;
    }
  }

  // Add focus blocks if enabled
  if (preferences.focusBlocks) {
    addFocusBlocks(schedule, workStart, workEnd, productivityCurve);
  }

  return schedule.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

function prioritizeTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // Priority scoring
    const getPriorityScore = (task: Task) => {
      switch (task.priority) {
        case 'HIGH': return 3;
        case 'MEDIUM': return 2;
        case 'LOW': return 1;
        default: return 1;
      }
    };

    // Urgency scoring (days until deadline)
    const getUrgencyScore = (task: Task) => {
      if (!task.dueDate) return 0;
      const today = new Date();
      const dueDate = new Date(task.dueDate);
      const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntil <= 0) return 5; // Overdue
      if (daysUntil <= 1) return 4; // Due today/tomorrow
      if (daysUntil <= 3) return 3; // Due within 3 days
      if (daysUntil <= 7) return 2; // Due within a week
      return 1; // Future deadline
    };

    const scoreA = getPriorityScore(a) + getUrgencyScore(a);
    const scoreB = getPriorityScore(b) + getUrgencyScore(b);

    return scoreB - scoreA;
  });
}

function generateProductivityCurve(
  personalityType: string, 
  workStart: number, 
  workEnd: number
): { time: number; productivity: number }[] {
  const curve = [];
  
  for (let time = workStart; time <= workEnd; time += 30) {
    let productivity = 70; // Base productivity
    
    switch (personalityType) {
      case 'morning':
        if (time < workStart + 180) productivity = 90; // First 3 hours
        else if (time > workEnd - 120) productivity = 60; // Last 2 hours
        break;
      case 'afternoon':
        if (time > workStart + 240) productivity = 90; // After 4 hours
        else if (time < workStart + 120) productivity = 60; // First 2 hours
        break;
      case 'balanced':
      default:
        if (time > workStart + 60 && time < workStart + 240) productivity = 85; // Mid-morning
        if (time > workStart + 360 && time < workStart + 480) productivity = 80; // Mid-afternoon
        break;
    }

    // Post-lunch dip
    if (time > parseTimeToMinutes('13:00') && time < parseTimeToMinutes('14:30')) {
      productivity *= 0.8;
    }

    curve.push({ time, productivity });
  }
  
  return curve;
}

function generateTimeSlots(
  workStart: number,
  workEnd: number,
  lunchTime: number,
  existingSchedule: ScheduleBlock[],
  preferences: UserPreferences
): { start: number; end: number }[] {
  const slots = [];
  const busyTimes = existingSchedule
    .filter(item => item.type === 'meeting')
    .map(item => ({
      start: parseTimeToMinutes(item.startTime),
      end: parseTimeToMinutes(item.endTime)
    }))
    .sort((a, b) => a.start - b.start);

  // Add lunch break
  busyTimes.push({ start: lunchTime, end: lunchTime + 60 });
  busyTimes.sort((a, b) => a.start - b.start);

  let currentTime = workStart;
  
  for (const busyTime of busyTimes) {
    if (currentTime < busyTime.start) {
      slots.push({ start: currentTime, end: busyTime.start });
    }
    currentTime = Math.max(currentTime, busyTime.end);
  }

  // Add remaining time until work end
  if (currentTime < workEnd) {
    slots.push({ start: currentTime, end: workEnd });
  }

  return slots.filter(slot => slot.end - slot.start >= 30); // Minimum 30 minutes
}

function addFocusBlocks(
  schedule: ScheduleBlock[],
  workStart: number,
  workEnd: number,
  productivityCurve: { time: number; productivity: number }[]
) {
  const focusSlots = productivityCurve
    .filter(point => point.productivity >= 85)
    .slice(0, 2); // Maximum 2 focus blocks

  focusSlots.forEach((slot, index) => {
    schedule.push({
      id: `focus-${index}`,
      startTime: minutesToTime(slot.time),
      endTime: minutesToTime(slot.time + 90),
      title: '集中時間',
      type: 'focus',
      priority: 'high',
      estimatedProductivity: slot.productivity
    });
  });
}

function getProductivityAtTime(
  time: number, 
  curve: { time: number; productivity: number }[]
): number {
  const closest = curve.reduce((prev, curr) => 
    Math.abs(curr.time - time) < Math.abs(prev.time - time) ? curr : prev
  );
  return closest.productivity;
}

// Utility functions
function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function formatTime(hours: number, minutes: number): string {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}