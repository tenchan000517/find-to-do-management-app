'use client';

import { CalendarEvent, UnifiedCalendarEvent, ColorMode } from '@/types/calendar';
import { EventCard } from './EventCard';
import { getJSTDate, getJSTDateString, isToday } from '@/lib/utils/datetime-jst';

interface MonthViewProps {
  currentDate: Date;
  events: UnifiedCalendarEvent[];
  onDateSelect: (date: Date) => void;
  colorMode: ColorMode;
  onEventEdit?: (event: UnifiedCalendarEvent) => void;
}

export function MonthView({ currentDate, events, onDateSelect, colorMode, onEventEdit }: MonthViewProps) {
  // 月の開始日と終了日を取得
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // 月の最初の日
    const firstDay = new Date(year, month, 1);
    // 月の最後の日
    const lastDay = new Date(year, month + 1, 0);
    
    // カレンダーグリッドの開始日（前月の日曜日）
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    // カレンダーグリッドの終了日（翌月の土曜日）
    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  // 特定の日付のイベントを取得
  const getEventsForDate = (date: Date) => {
    const dateStr = getJSTDateString(date);
    return events.filter(event => event.date === dateStr);
  };

  // 今日かどうかを判定（JST基準）
  const isTodayJST = (date: Date) => {
    return isToday(getJSTDateString(date));
  };

  // 現在の月かどうかを判定
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const days = getMonthDays();
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="p-4">
      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={`p-2 text-sm font-medium text-center ${
              index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          const isCurrentMonthDay = isCurrentMonth(date);
          const isTodayDay = isTodayJST(date);
          
          return (
            <div
              key={date.toISOString()}
              className={`min-h-[120px] p-2 border border-gray-200 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                !isCurrentMonthDay ? 'bg-gray-50' : 'bg-white'
              } ${isTodayDay ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => onDateSelect(date)}
            >
              {/* 日付 */}
              <div className="flex justify-between items-start mb-1">
                <span
                  className={`text-sm font-medium ${
                    !isCurrentMonthDay
                      ? 'text-gray-400'
                      : isTodayDay
                      ? 'text-blue-600 font-bold'
                      : index % 7 === 0
                      ? 'text-red-600'
                      : index % 7 === 6
                      ? 'text-blue-600'
                      : 'text-gray-900'
                  }`}
                >
                  {date.getDate()}
                </span>
                
                {/* イベント数表示 */}
                {dayEvents.length > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded-full">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              {/* イベントリスト */}
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    compact={true}
                    colorMode={colorMode}
                    onEventEdit={onEventEdit}
                  />
                ))}
                
                {/* 3件を超える場合の表示 */}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 text-center py-1">
                    +{dayEvents.length - 3}件
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}