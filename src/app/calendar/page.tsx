'use client';

import { CalendarView } from '@/components/calendar/CalendarView';

export default function CalendarPage() {
  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden p-4">
      {/* カレンダーコンポーネント */}
      <CalendarView className="flex-1" />
    </div>
  );
}