'use client';

import { CalendarView } from '@/components/calendar/CalendarView';

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* カレンダーコンポーネント */}
        <CalendarView className="max-w-full" />
      </div>
    </div>
  );
}