'use client';

import { CalendarView } from '@/components/calendar/CalendarView';

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* ページヘッダー */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">カレンダー</h1>
          <p className="text-gray-600 mt-2">
            スケジュール管理・予定確認・アポイントメント表示
          </p>
        </div>

        {/* カレンダーコンポーネント */}
        <CalendarView className="max-w-full" />
      </div>
    </div>
  );
}