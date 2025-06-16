'use client';

import { CalendarEvent, ColorMode } from '@/types/calendar';
import { EventCard } from './EventCard';
import { getJSTDate, getJSTDateString } from '@/lib/utils/datetime-jst';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  colorMode: ColorMode;
}

export function DayView({ currentDate, events, colorMode }: DayViewProps) {
  // 時間スロット（6:00-24:00、30分間隔）
  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 23; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  // 当日のイベントを取得
  const getDayEvents = () => {
    const dateStr = getJSTDateString(currentDate);
    return events.filter(event => event.date === dateStr);
  };

  // 特定時間のイベントを取得
  const getEventsForTime = (timeSlot: string) => {
    return dayEvents.filter(event => {
      if (event.isAllDay) return false;
      
      const eventTime = event.time;
      const slotHour = parseInt(timeSlot.split(':')[0]);
      const slotMinute = parseInt(timeSlot.split(':')[1]);
      
      const eventHour = parseInt(eventTime.split(':')[0]);
      const eventMinute = parseInt(eventTime.split(':')[1]);
      
      // 30分スロット内かどうかチェック
      const eventTotalMinutes = eventHour * 60 + eventMinute;
      const slotTotalMinutes = slotHour * 60 + slotMinute;
      
      return eventTotalMinutes >= slotTotalMinutes && 
             eventTotalMinutes < slotTotalMinutes + 30;
    });
  };

  // 現在時刻を取得（ハイライト用）
  const getCurrentTimeSlot = () => {
    const now = getJSTDate();
    if (getJSTDateString(now) !== getJSTDateString(currentDate)) return null;
    
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    if (hour < 6 || hour > 23) return null;
    
    const roundedMinute = minute < 30 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${roundedMinute}`;
  };

  const timeSlots = getTimeSlots();
  const dayEvents = getDayEvents();
  const allDayEvents = dayEvents.filter(event => event.isAllDay || !event.time);
  const currentTimeSlot = getCurrentTimeSlot();

  return (
    <div className="p-4">
      {/* 日付ヘッダー */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-900">
          {currentDate.toLocaleDateString('ja-JP', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
          })}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {dayEvents.length}件のイベント
        </p>
      </div>

      {/* 終日イベント */}
      {allDayEvents.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">終日</h3>
          <div className="space-y-2">
            {allDayEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                compact={false}
                showTime={false}
                colorMode={colorMode}
                onClick={() => {
                  // TODO: イベント詳細表示
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* 時間別イベント表示 */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {timeSlots.map((timeSlot) => {
          const timeEvents = getEventsForTime(timeSlot);
          const isCurrentTime = timeSlot === currentTimeSlot;
          const isHourMark = timeSlot.endsWith(':00');
          
          return (
            <div
              key={timeSlot}
              className={`grid grid-cols-12 border-b border-gray-100 last:border-b-0 ${
                isCurrentTime ? 'bg-blue-50' : ''
              } ${isHourMark ? 'border-b-gray-200' : 'border-b-gray-50'}`}
            >
              {/* 時間表示 */}
              <div className={`col-span-2 p-3 bg-gray-50 border-r border-gray-200 text-center ${
                isHourMark ? 'border-b-gray-200' : ''
              }`}>
                <div className={`text-sm font-medium ${
                  isCurrentTime ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {timeSlot}
                </div>
                {isCurrentTime && (
                  <div className="text-xs text-blue-500 mt-1">現在</div>
                )}
              </div>
              
              {/* イベント表示エリア */}
              <div className="col-span-10 p-2 min-h-[60px] hover:bg-gray-50 transition-colors cursor-pointer">
                {timeEvents.length > 0 ? (
                  <div className="space-y-1">
                    {timeEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        compact={false}
                        showTime={true}
                        colorMode={colorMode}
                        onClick={() => {
                          // TODO: イベント詳細表示
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    className="h-full w-full flex items-center justify-center text-gray-400 text-sm opacity-0 hover:opacity-100 transition-opacity"
                    onClick={() => {
                      // TODO: この時間でイベント作成
                    }}
                  >
                    + イベントを追加
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 夜間の簡易表示（24:00-06:00） */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">深夜・早朝（0:00-6:00）</h3>
        <div className="space-y-1">
          {dayEvents
            .filter(event => {
              if (event.isAllDay || !event.time) return false;
              const hour = parseInt(event.time.split(':')[0]);
              return hour >= 0 && hour < 6;
            })
            .map((event) => (
              <EventCard
                key={event.id}
                event={event}
                compact={true}
                showTime={true}
                colorMode={colorMode}
                onClick={() => {
                  // TODO: イベント詳細表示
                }}
              />
            ))}
        </div>
      </div>
    </div>
  );
}