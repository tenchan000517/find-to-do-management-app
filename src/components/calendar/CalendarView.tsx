'use client';

import { useState, useEffect } from 'react';
import { CalendarEvent, UnifiedCalendarEvent, ViewMode, ColorMode } from '@/types/calendar';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { ColorTabs } from './ColorTabs';
import { WeeklyPreview } from './WeeklyPreview';
import { DayEventsModal } from './DayEventsModal';
import { EventEditModal } from './EventEditModal';
import { getJSTDate, getJSTDateString } from '@/lib/utils/datetime-jst';
import LoadingSpinner from '@/components/LoadingSpinner';

interface CalendarViewProps {
  className?: string;
}

export function CalendarView({ className = '' }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(getJSTDate());
  const [events, setEvents] = useState<UnifiedCalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [colorMode, setColorMode] = useState<ColorMode>('user');
  const [users, setUsers] = useState<Array<{ id: string; name: string; color: string }>>([]);
  const [showWeeklyPreview, setShowWeeklyPreview] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<UnifiedCalendarEvent | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  // 表示期間を計算
  const getDateRange = () => {
    const startDate = new Date(currentDate);
    const endDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'month':
        startDate.setDate(1);
        endDate.setMonth(endDate.getMonth() + 1, 0);
        break;
      case 'week':
        const dayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - dayOfWeek);
        endDate.setDate(startDate.getDate() + 6);
        break;
      case 'day':
        endDate.setDate(startDate.getDate());
        break;
    }
    
    return {
      startDate: getJSTDateString(startDate),
      endDate: getJSTDateString(endDate)
    };
  };

  // 統合カレンダーデータ取得
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();
      
      const params = new URLSearchParams({
        startDate,
        endDate,
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
      console.error('Unified calendar fetch error:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // ユーザー情報取得
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('ユーザー情報の取得に失敗しました');
      }
      const data = await response.json();
      setUsers(data || []);
    } catch (error) {
      console.error('Users fetch error:', error);
      setUsers([]);
    }
  };

  // 統計データ計算
  const getColorStats = () => {
    const userCounts: { [userId: string]: number } = {};
    const categoryCounts: { [category: string]: number } = {};
    const priorityCounts = { A: 0, B: 0, C: 0, D: 0 };
    const importanceCounts = { high: 0, medium: 0, low: 0 };

    events.forEach(event => {
      // ユーザー別カウント
      if (event.userId) {
        userCounts[event.userId] = (userCounts[event.userId] || 0) + 1;
      }
      
      // カテゴリ別カウント
      categoryCounts[event.category] = (categoryCounts[event.category] || 0) + 1;
      
      // A/B/C/D優先度別カウント
      const priority = event.priority || 'C';
      if (priority in priorityCounts) {
        priorityCounts[priority as keyof typeof priorityCounts]++;
      }
      
      // 重要度別カウント（レガシーサポート）
      const importance = event.importance || 0.5;
      if (importance >= 0.7) {
        importanceCounts.high++;
      } else if (importance >= 0.4) {
        importanceCounts.medium++;
      } else {
        importanceCounts.low++;
      }
    });

    return { userCounts, categoryCounts, priorityCounts, importanceCounts };
  };

  // 初期化とデータ取得
  useEffect(() => {
    fetchUsers();
  }, []);

  // 日付変更時にイベント再取得
  useEffect(() => {
    fetchEvents();
  }, [currentDate, viewMode]);

  // 日付ナビゲーション
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  // 今日に戻る
  const goToToday = () => {
    setCurrentDate(getJSTDate());
  };

  // 日付クリック処理
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setShowDayModal(true);
  };

  // 選択日のイベント取得
  const getEventsForSelectedDate = () => {
    if (!selectedDate) return [];
    const dateStr = getJSTDateString(selectedDate);
    return filteredEvents.filter(event => event.date === dateStr);
  };

  // イベント編集処理
  const handleEventEdit = (event: UnifiedCalendarEvent) => {
    setEditingEvent(event);
    setShowEditModal(true);
  };

  // イベント保存処理
  const handleEventSave = async (updatedEvent: UnifiedCalendarEvent) => {
    try {
      // イベントリストを更新（既にEventEditModalでAPI呼び出し済み）
      setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
      
      // モーダルを閉じる
      setShowEditModal(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  };


  const { userCounts, categoryCounts, priorityCounts, importanceCounts } = getColorStats();

  // フィルタリングされたイベント
  const filteredEvents = events.filter(event => {
    if (!selectedFilter) return true;

    switch (colorMode) {
      case 'user':
        return event.userId === selectedFilter;
      case 'category':
        return event.category === selectedFilter;
      case 'importance':
        const priority = event.priority || 'C';
        return priority === selectedFilter;
      default:
        return true;
    }
  });

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* 統合ヘッダー: 色分けタブ + 日付ナビ + 表示モード */}
      <ColorTabs
        selectedMode={colorMode}
        onModeChange={setColorMode}
        userCounts={userCounts}
        categoryCounts={categoryCounts}
        priorityCounts={priorityCounts}
        importanceCounts={importanceCounts}
        users={users}
        currentDate={currentDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onDateNavigate={navigateDate}
        onTodayClick={goToToday}
        onWeeklyPreviewClick={() => setShowWeeklyPreview(true)}
        loading={loading}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
      />

      {/* カレンダー本体 */}
      <div className="relative">
        {loading && (
          <LoadingSpinner overlay message="カレンダーデータを読み込んでいます..." />
        )}

        {viewMode === 'month' && (
          <MonthView 
            currentDate={currentDate} 
            events={filteredEvents} 
            onDateSelect={handleDayClick}
            colorMode={colorMode}
            onEventEdit={handleEventEdit}
          />
        )}
        
        {viewMode === 'week' && (
          <WeekView 
            currentDate={currentDate} 
            events={filteredEvents}
            onDateSelect={setCurrentDate}
            colorMode={colorMode}
          />
        )}
        
        {viewMode === 'day' && (
          <DayView 
            currentDate={currentDate} 
            events={filteredEvents}
            colorMode={colorMode}
          />
        )}
      </div>

      {/* 今後一週間サイドバー */}
      <WeeklyPreview
        isOpen={showWeeklyPreview}
        onClose={() => setShowWeeklyPreview(false)}
        colorMode={colorMode}
        onEventEdit={handleEventEdit}
      />

      {/* 日別イベントモーダル */}
      <DayEventsModal
        isOpen={showDayModal}
        onClose={() => setShowDayModal(false)}
        date={selectedDate || new Date()}
        events={getEventsForSelectedDate()}
        colorMode={colorMode}
        onEventEdit={handleEventEdit}
      />

      {/* イベント編集モーダル */}
      <EventEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingEvent(null);
        }}
        event={editingEvent}
        onSave={(event: any) => handleEventSave(event)}
        onDataRefresh={fetchEvents}
      />
    </div>
  );
}