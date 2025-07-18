'use client';

import { CalendarEvent, UnifiedCalendarEvent, ColorMode } from '@/types/calendar';
import { EventCard } from './EventCard';
import { convertToJST } from '@/lib/utils/datetime-jst';

interface DayEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  events: UnifiedCalendarEvent[];
  colorMode: ColorMode;
  onEventEdit?: (event: UnifiedCalendarEvent) => void;
  onEventDelete?: (eventId: string) => void;
}

export function DayEventsModal({
  isOpen,
  onClose,
  date,
  events,
  colorMode,
  onEventEdit,
  onEventDelete
}: DayEventsModalProps) {
  if (!isOpen) return null;

  // 日付フォーマット（JST基準）
  const formatDate = (date: Date) => {
    const jstDate = convertToJST(date);
    const year = jstDate.getFullYear();
    const month = jstDate.getMonth() + 1;
    const day = jstDate.getDate();
    const weekDay = ['日', '月', '火', '水', '木', '金', '土'][jstDate.getDay()];
    return `${year}年${month}月${day}日(${weekDay})`;
  };

  // 時間順にソート
  const sortedEvents = [...events].sort((a, b) => {
    if (a.isAllDay && !b.isAllDay) return -1;
    if (!a.isAllDay && b.isAllDay) return 1;
    return a.time.localeCompare(b.time);
  });

  return (
    <>
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 bg-gray-700/80 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        {/* モーダル */}
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto max-h-[95vh] sm:max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {formatDate(date)}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* コンテンツ */}
          <div className="p-4 overflow-y-auto max-h-[60vh]">
            {sortedEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>この日の予定はありません</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* 終日イベント */}
                {sortedEvents.filter(event => event.isAllDay).length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-1">
                      終日
                    </h3>
                    {sortedEvents
                      .filter(event => event.isAllDay)
                      .map(event => (
                        <EventCard
                          key={event.id}
                          event={event}
                          compact={false}
                          showTime={false}
                          colorMode={colorMode}
                          onEventEdit={onEventEdit}
                          onEventDelete={onEventDelete}
                          isModal={true}
                        />
                      ))
                    }
                  </div>
                )}

                {/* 時間指定イベント */}
                {sortedEvents.filter(event => !event.isAllDay).length > 0 && (
                  <div className="space-y-2">
                    {sortedEvents.filter(event => event.isAllDay).length > 0 && (
                      <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-1">
                        時間指定
                      </h3>
                    )}
                    {sortedEvents
                      .filter(event => !event.isAllDay)
                      .map(event => (
                        <EventCard
                          key={event.id}
                          event={event}
                          compact={false}
                          showTime={true}
                          colorMode={colorMode}
                          onEventEdit={onEventEdit}
                          onEventDelete={onEventDelete}
                          isModal={true}
                        />
                      ))
                    }
                  </div>
                )}
              </div>
            )}
          </div>

          {/* フッター */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>合計 {events.length} 件の予定</span>
              <button
                onClick={onClose}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}