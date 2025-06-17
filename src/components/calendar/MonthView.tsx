'use client';

import { UnifiedCalendarEvent, ColorMode } from '@/types/calendar';
import { DraggableCalendarCell } from './DraggableCalendarCell';
import { getJSTDateString, getTodayJST } from '@/lib/utils/datetime-jst';

interface MonthViewProps {
  currentDate: Date;
  events: UnifiedCalendarEvent[];
  onDateSelect: (date: Date) => void;
  colorMode: ColorMode;
  onEventEdit?: (event: UnifiedCalendarEvent) => void;
  onEventMove?: (eventId: string, newDate: string) => void;
}

export function MonthView({ currentDate, events, onDateSelect, colorMode, onEventEdit, onEventMove }: MonthViewProps) {
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
    const dateStr = getJSTDateString(date);
    const todayStr = getTodayJST();
    return dateStr === todayStr;
  };

  // 現在の月かどうかを判定
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const days = getMonthDays();
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={`p-3 text-sm font-medium text-center border-r border-gray-200 last:border-r-0 ${
              index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="flex-1 grid grid-rows-6 overflow-hidden">
        {Array.from({ length: 6 }, (_, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-b border-gray-200 last:border-b-0">
            {days.slice(weekIndex * 7, (weekIndex + 1) * 7).map((date, dayIndex) => {
              const dayEvents = getEventsForDate(date);
              const isCurrentMonthDay = isCurrentMonth(date);
              const isTodayDay = isTodayJST(date);
              const cellIndex = weekIndex * 7 + dayIndex;
              
              return (
                <DraggableCalendarCell
                  key={date.toISOString()}
                  date={date}
                  events={dayEvents}
                  isCurrentMonth={isCurrentMonthDay}
                  isToday={isTodayDay}
                  onEventEdit={onEventEdit || (() => {})}
                  onEventMove={onEventMove || (() => {})}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}