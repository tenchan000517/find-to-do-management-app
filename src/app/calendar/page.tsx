'use client';

import { CalendarView } from '@/components/calendar/CalendarView';

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-4 pb-20 md:pb-4">
      {/* カレンダーコンポーネント */}
      <CalendarView className="flex-1" />
    </div>
  );
}