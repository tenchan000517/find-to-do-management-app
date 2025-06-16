'use client';

import { CalendarEvent, ColorMode } from '@/types/calendar';
import { EventCard } from './EventCard';
import { getJSTDate, getJSTDateString, isToday } from '@/lib/utils/datetime-jst';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
  colorMode: ColorMode;
}

export function WeekView({ currentDate, events, onDateSelect, colorMode }: WeekViewProps) {
  // 週の開始日（日曜日）と各日を取得
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  // 時間スロット（6:00-24:00）
  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 23; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
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

  const weekDays = getWeekDays();
  const timeSlots = getTimeSlots();
  const weekDayLabels = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="p-4">
      {/* 週表示ヘッダー */}
      <div className="grid grid-cols-8 gap-2 mb-4">
        {/* 時間列のヘッダー */}
        <div className="p-2"></div>
        
        {/* 各日のヘッダー */}
        {weekDays.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          const isTodayDay = isTodayJST(date);
          
          return (
            <div
              key={date.toISOString()}
              className={`p-3 text-center border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                isTodayDay ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
              }`}
              onClick={() => onDateSelect(date)}
            >
              <div className={`text-sm font-medium ${
                index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
              }`}>
                {weekDayLabels[index]}
              </div>
              <div className={`text-lg font-bold ${
                isTodayDay ? 'text-blue-600' : 'text-gray-900'
              }`}>
                {date.getDate()}
              </div>
              {dayEvents.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {dayEvents.length}件
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 週表示グリッド */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {timeSlots.map((time) => (
          <div key={time} className="grid grid-cols-8 border-b border-gray-100 last:border-b-0">
            {/* 時間表示 */}
            <div className="p-2 bg-gray-50 border-r border-gray-200 text-xs text-gray-600 font-medium text-center">
              {time}
            </div>
            
            {/* 各日のタイムスロット */}
            {weekDays.map((date) => {
              const dayEvents = getEventsForDate(date);
              const timeEvents = dayEvents.filter(event => {
                const eventHour = event.time.split(':')[0].padStart(2, '0');
                return `${eventHour}:00` === time;
              });
              
              return (
                <div
                  key={`${date.toISOString()}-${time}`}
                  className="p-1 border-r border-gray-100 last:border-r-0 min-h-[60px] hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => {
                    // TODO: この時間帯でイベント作成
                  }}
                >
                  {timeEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      compact={true}
                      showTime={true}
                      colorMode={colorMode}
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: イベント詳細表示
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* 終日イベント表示（時間指定なし） */}
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">終日・時間未指定</h3>
        <div className="grid grid-cols-8 gap-2">
          <div className="p-2"></div>
          {weekDays.map((date) => {
            const dayEvents = getEventsForDate(date);
            const allDayEvents = dayEvents.filter(event => 
              event.isAllDay || !event.time || event.time === '00:00'
            );
            
            return (
              <div
                key={`allday-${date.toISOString()}`}
                className="p-2 bg-gray-50 rounded-lg min-h-[40px]"
              >
                {allDayEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    compact={true}
                    showTime={false}
                    colorMode={colorMode}
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: イベント詳細表示
                    }}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}