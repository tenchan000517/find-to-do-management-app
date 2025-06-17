'use client';

import { useEffect, useState } from 'react';
import { CalendarEvent, UnifiedCalendarEvent, ColorMode } from '@/types/calendar';
import { EventCard } from './EventCard';
import { getJSTDate, getJSTDateString } from '@/lib/utils/datetime-jst';

interface WeeklyPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  colorMode: ColorMode;
  selectedFilter?: string | null;
  onEventEdit?: (event: UnifiedCalendarEvent) => void;
}

export function WeeklyPreview({
  isOpen,
  onClose,
  colorMode,
  selectedFilter,
  onEventEdit
}: WeeklyPreviewProps) {
  const [events, setEvents] = useState<UnifiedCalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // 今後一週間の統合イベント取得
  const fetchWeeklyEvents = async () => {
    try {
      setLoading(true);
      const today = getJSTDate();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      const params = new URLSearchParams({
        startDate: getJSTDateString(today),
        endDate: getJSTDateString(nextWeek),
        includePersonal: 'true',
        includePublic: 'true'
      });

      const response = await fetch(`/api/calendar/unified?${params}`);
      if (!response.ok) {
        throw new Error('統合カレンダーの取得に失敗しました');
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Unified weekly events fetch error:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // フィルタリング済みイベント
  const filteredEvents = events.filter(event => {
    if (!selectedFilter) return true;

    switch (colorMode) {
      case 'user':
        return event.userId === selectedFilter;
      case 'category':
        return event.category === selectedFilter;
      case 'importance':
        const priority = event.priority || event.tasks?.priority || event.appointments?.priority || 'C';
        return priority === selectedFilter;
      default:
        return true;
    }
  });

  // 日付別にグループ化
  const groupedEvents = filteredEvents.reduce((groups, event) => {
    const date = event.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {} as { [date: string]: CalendarEvent[] });

  // 日付をソート
  const sortedDates = Object.keys(groupedEvents).sort();

  // 日付フォーマット
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (dateStr === today.toISOString().split('T')[0]) {
      return '今日';
    } else if (dateStr === tomorrow.toISOString().split('T')[0]) {
      return '明日';
    } else {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const weekDay = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
      return `${month}/${day}(${weekDay})`;
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchWeeklyEvents();
    }
  }, [isOpen]);

  return (
    <>
      {/* サイドバー */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-[60] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">今後一週間の予定</h2>
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
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-2 text-gray-600">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-sm">読み込み中...</span>
              </div>
            </div>
          ) : sortedDates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>今後一週間の予定はありません</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedDates.map(date => (
                <div key={date} className="space-y-2">
                  {/* 日付ヘッダー */}
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-medium text-gray-700">
                      {formatDate(date)}
                    </h3>
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <span className="text-xs text-gray-500">
                      {groupedEvents[date].length}件
                    </span>
                  </div>

                  {/* イベントリスト */}
                  <div className="space-y-1">
                    {groupedEvents[date]
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map(event => (
                        <EventCard
                          key={event.id}
                          event={event}
                          compact={true}
                          showTime={true}
                          colorMode={colorMode}
                          onEventEdit={onEventEdit}
                        />
                      ))
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}