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
import TaskModal from '@/components/TaskModal';
import ProjectDetailModal from '@/components/ProjectDetailModal';
import { AppointmentEditModal } from './AppointmentEditModal';
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
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<UnifiedCalendarEvent | null>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
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
    switch (event.source) {
      case 'tasks':
        // タスクの場合は専用モーダルを開く
        const taskData = {
          id: event.taskId || event.id.replace(/^task_/, ''),
          title: event.title.replace(/^📋 /, ''),
          description: event.description || '',
          dueDate: event.date,
          priority: event.priority || 'C',
          status: 'IDEA',
          userId: event.userId,
          projectId: event.projectId,
          assignedTo: event.userId,
          isArchived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setEditingTask(taskData);
        setShowTaskModal(true);
        break;
      
      case 'appointments':
        // アポイントメントの場合は専用モーダルを開く
        setEditingAppointment(event);
        setShowAppointmentModal(true);
        break;
      
      default:
        // その他のイベントは今まで通り統合モーダルを使用
        setEditingEvent(event);
        setShowEditModal(true);
        break;
    }
  };

  const handleEventDelete = async (eventId: string) => {
    try {
      setLoading(true);
      
      // イベントのソースを特定して適切なAPIエンドポイントを決定
      const event = events.find(e => e.id === eventId);
      if (!event) return;
      
      let apiUrl = '';
      
      switch (event.source) {
        case 'personal_schedules':
          const personalId = event.id.startsWith('personal_') 
            ? event.id.replace('personal_', '') 
            : event.id;
          apiUrl = `/api/schedules/${personalId}`;
          break;
        case 'tasks':
          // タスクの削除はタスクページでのみ可能
          alert('タスクの期限削除はタスクページで行ってください。');
          setLoading(false);
          return;
        case 'appointments':
          const appointmentMatch = event.id.match(/^appointment_(\d+)_(.+)$/);
          if (appointmentMatch) {
            const [, appointmentId] = appointmentMatch;
            apiUrl = `/api/appointments/${appointmentId}`;
          }
          break;
        case 'calendar_events':
        default:
          apiUrl = `/api/calendar/events/${event.id}`;
          break;
      }
      
      const response = await fetch(apiUrl, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // イベントリストから削除
      setEvents(prevEvents => prevEvents.filter(e => e.id !== eventId));
      
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('イベントの削除に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
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

  // タスク保存処理
  const handleTaskSave = async (taskData: any) => {
    try {
      const response = await fetch(`/api/tasks`, {
        method: editingTask?.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingTask?.id ? { id: editingTask.id, ...taskData } : taskData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // カレンダーデータを再取得
      await fetchEvents();
      
      // モーダルを閉じる
      setShowTaskModal(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to save task:', error);
      alert('タスクの保存に失敗しました。もう一度お試しください。');
    }
  };


  const { userCounts, categoryCounts, priorityCounts, importanceCounts } = getColorStats();

  // フィルタリングされたイベント
  const filteredEvents = events.filter(event => {
    if (!selectedFilter) return true;

    switch (colorMode) {
      case 'user':
        // ユーザー別の場合はカテゴリ色を使用
        return event.userId === selectedFilter;
      case 'category':
        // カテゴリ別の場合はユーザー色を使用
        return event.category === selectedFilter;
      case 'importance':
        // 重要度別の場合はユーザー色を使用
        const priority = event.priority || 'C';
        return priority === selectedFilter;
      default:
        return true;
    }
  });

  return (
    <div className={`${className} flex flex-col h-screen overflow-hidden`}>
      {/* 統合ヘッダー: 色分けタブ + 日付ナビ + 表示モード */}
      <div className="flex-shrink-0">
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
      </div>

      {/* カレンダー本体 */}
      <div className="flex-1 relative overflow-hidden">
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
        onEventDelete={handleEventDelete}
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

      {/* タスク編集モーダル */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
        }}
        editingTask={editingTask}
        users={users}
        projects={[]}
        onSubmit={handleTaskSave}
        onDataRefresh={fetchEvents}
      />

      {/* アポイントメント編集モーダル */}
      <AppointmentEditModal
        isOpen={showAppointmentModal}
        onClose={() => {
          setShowAppointmentModal(false);
          setEditingAppointment(null);
        }}
        event={editingAppointment}
        onSave={() => {}}
        onDataRefresh={fetchEvents}
      />
    </div>
  );
}