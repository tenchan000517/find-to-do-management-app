'use client';

import { UnifiedCalendarEvent, ColorMode } from '@/types/calendar';
import { EventCard } from './EventCard';
import { getJSTDate, getJSTDateString, getTodayJST } from '@/lib/utils/datetime-jst';

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
    const dateStr = getJSTDateString(date);
    const todayStr = getTodayJST();
    const jstNow = getJSTDate();
    
    // デバッグログ: 今日の判定情報
    console.log('🕐 今日判定デバッグ:', {
      'チェック対象日付': dateStr,
      '今日(JST)': todayStr,
      '現在時刻(JST)': jstNow.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
      '判定結果': dateStr === todayStr,
      '元Date': date.toISOString(),
      'JST変換後': getJSTDate(date).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
    });
    
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
                <div
                  key={date.toISOString()}
                  className={`p-1 md:p-2 border-r border-gray-200 last:border-r-0 cursor-pointer transition-colors hover:bg-gray-50 flex flex-col min-h-0 ${
                    !isCurrentMonthDay ? 'bg-gray-50' : 'bg-white'
                  } ${isTodayDay ? 'bg-blue-50' : ''}`}
                  onClick={() => onDateSelect(date)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('bg-blue-100');
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('bg-blue-100');
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('bg-blue-100');
                    
                    try {
                      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
                      const { eventId, eventDate } = dragData;
                      const newDate = date.toISOString().split('T')[0];
                      
                      if (eventDate !== newDate) {
                        // イベントの日付を更新
                        const response = await fetch(`/api/calendar/events/${eventId}`, {
                          method: 'PATCH',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({ date: newDate }),
                        });
                        
                        if (response.ok) {
                          // ページをリロードしてイベントを再取得
                          window.location.reload();
                        }
                      }
                    } catch (error) {
                      console.error('Drag and drop failed:', error);
                    }
                  }}
                >
                  {/* 日付 */}
                  <div className="flex justify-between items-start mb-1 flex-shrink-0">
                    {isTodayDay ? (
                      <div className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">
                        {date.getDate()}
                      </div>
                    ) : (
                      <span
                        className={`text-sm font-medium ${
                          !isCurrentMonthDay
                            ? 'text-gray-400'
                            : cellIndex % 7 === 0
                            ? 'text-red-600'
                            : cellIndex % 7 === 6
                            ? 'text-blue-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {date.getDate()}
                      </span>
                    )}
                    
                    {/* イベント数表示 */}
                    {dayEvents.length > 0 && (
                      <span className="hidden md:inline text-xs bg-blue-100 text-blue-800 px-1 rounded-full">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* イベントリスト */}
                  <div className="flex-1 flex flex-col gap-0.5 md:gap-1 min-h-0 overflow-hidden">
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
                      <div className="text-xs text-gray-500 text-center py-0.5 md:py-1 bg-gray-100 rounded">
                        +{dayEvents.length - 3}件
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}