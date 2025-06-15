'use client';

import { useState, useEffect } from 'react';
import { CalendarEvent, ViewMode, ColorMode } from '@/types/calendar';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { ColorTabs } from './ColorTabs';

interface CalendarViewProps {
  className?: string;
}

export function CalendarView({ className = '' }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [colorMode, setColorMode] = useState<ColorMode>('category');
  const [users, setUsers] = useState<Array<{ id: string; name: string; color: string }>>([]);

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
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  // イベントデータ取得
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();
      
      const params = new URLSearchParams({
        startDate,
        endDate,
        includeRecurring: 'true'
      });

      const response = await fetch(`/api/calendar/events?${params}`);
      if (!response.ok) {
        throw new Error('イベントの取得に失敗しました');
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Events fetch error:', error);
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
      setUsers(data.users || []);
    } catch (error) {
      console.error('Users fetch error:', error);
      setUsers([]);
    }
  };

  // 統計データ計算
  const getColorStats = () => {
    const userCounts: { [userId: string]: number } = {};
    const categoryCounts: { [category: string]: number } = {};
    const importanceCounts = { high: 0, medium: 0, low: 0 };

    events.forEach(event => {
      // ユーザー別カウント
      userCounts[event.userId] = (userCounts[event.userId] || 0) + 1;
      
      // カテゴリ別カウント
      categoryCounts[event.category] = (categoryCounts[event.category] || 0) + 1;
      
      // 重要度別カウント
      if (event.importance >= 0.7) {
        importanceCounts.high++;
      } else if (event.importance >= 0.4) {
        importanceCounts.medium++;
      } else {
        importanceCounts.low++;
      }
    });

    return { userCounts, categoryCounts, importanceCounts };
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
    setCurrentDate(new Date());
  };

  // 日付フォーマット
  const formatDate = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    
    switch (viewMode) {
      case 'month':
        return `${year}年${month}月`;
      case 'week':
        const weekStart = new Date(currentDate);
        const dayOfWeek = weekStart.getDay();
        weekStart.setDate(weekStart.getDate() - dayOfWeek);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.getMonth() + 1}/${weekStart.getDate()} - ${weekEnd.getMonth() + 1}/${weekEnd.getDate()}, ${year}`;
      case 'day':
        return `${year}年${month}月${currentDate.getDate()}日`;
    }
  };

  const { userCounts, categoryCounts, importanceCounts } = getColorStats();

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* 色分けタブ */}
      <ColorTabs
        selectedMode={colorMode}
        onModeChange={setColorMode}
        userCounts={userCounts}
        categoryCounts={categoryCounts}
        importanceCounts={importanceCounts}
        users={users}
      />
      
      {/* ヘッダー */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {/* 左側: 日付ナビゲーション */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={loading}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <h2 className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
                {formatDate()}
              </h2>
              
              <button
                onClick={() => navigateDate('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={loading}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              今日
            </button>
          </div>

          {/* 右側: 表示モード切り替え */}
          <div className="flex items-center space-x-2">
            {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === mode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                disabled={loading}
              >
                {mode === 'month' ? '月' : mode === 'week' ? '週' : '日'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* カレンダー本体 */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
            <div className="flex items-center space-x-2 text-gray-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-sm">読み込み中...</span>
            </div>
          </div>
        )}

        {viewMode === 'month' && (
          <MonthView 
            currentDate={currentDate} 
            events={events} 
            onDateSelect={setCurrentDate}
            colorMode={colorMode}
          />
        )}
        
        {viewMode === 'week' && (
          <WeekView 
            currentDate={currentDate} 
            events={events}
            onDateSelect={setCurrentDate}
            colorMode={colorMode}
          />
        )}
        
        {viewMode === 'day' && (
          <DayView 
            currentDate={currentDate} 
            events={events}
            colorMode={colorMode}
          />
        )}
      </div>
    </div>
  );
}