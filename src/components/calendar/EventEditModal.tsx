'use client';

import { useState, useEffect } from 'react';
import { CalendarEvent, UnifiedCalendarEvent, EventCategory, PriorityLevel } from '@/types/calendar';

interface EventEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | UnifiedCalendarEvent | null;
  onSave?: (event: CalendarEvent | UnifiedCalendarEvent) => void;
  onDataRefresh?: () => void;
  onDelete?: (eventId: string) => void;
}

export function EventEditModal({
  isOpen,
  onClose,
  event,
  onSave,
  onDataRefresh,
  onDelete
}: EventEditModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    endTime: '',
    category: 'EVENT' as EventCategory,
    priority: 'C' as PriorityLevel,
    description: '',
    location: '',
    isAllDay: false
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        date: event.date || '',
        time: event.time || '',
        endTime: event.endTime || '',
        category: event.category || 'EVENT',
        priority: event.priority || event.tasks?.priority || event.appointments?.priority || 'C',
        description: event.description || '',
        location: event.location || '',
        isAllDay: event.isAllDay || false
      });
    }
  }, [event]);

  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!event) return;

    setIsLoading(true);
    try {
      // 統合API方針: イベントソース別に適切なAPIを決定
      const { apiUrl, requestBody } = getApiConfig(event, formData);

      // API呼び出しで更新
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const savedEvent = await response.json();
      
      onSave?.(savedEvent);
      onDataRefresh?.();
      onClose();
    } catch (error) {
      console.error('Failed to save event:', error);
      alert('イベントの保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  // 統合API方針: イベントソース別API設定
  const getApiConfig = (event: CalendarEvent | UnifiedCalendarEvent, formData: any) => {
    const eventSource = (event as UnifiedCalendarEvent).source;
    
    switch (eventSource) {
      case 'personal_schedules':
        // 個人予定: ps_プレフィックスは実際のIDなのでそのまま使用、personal_プレフィックスのみ除去
        const personalId = event.id.startsWith('personal_') 
          ? event.id.replace('personal_', '') 
          : event.id; // ps_プレフィックスの場合はそのまま使用
        return {
          apiUrl: `/api/schedules/${personalId}`,
          requestBody: {
            title: formData.title,
            date: formData.date,
            time: formData.time,
            endTime: formData.endTime || null,
            description: formData.description,
            location: formData.location,
            priority: formData.priority,
            isAllDay: formData.isAllDay
          }
        };
      
      case 'tasks':
        // タスク期限: task_プレフィックス
        const taskId = event.id.replace(/^task_/, '');
        return {
          apiUrl: `/api/tasks/${taskId}`,
          requestBody: {
            title: formData.title.replace(/^📋 /, ''), // 絵文字を除去
            dueDate: formData.date,
            description: formData.description,
            priority: formData.priority
          }
        };
      
      case 'appointments':
        // アポイントメント: appointment_プレフィックス
        const appointmentMatch = event.id.match(/^appointment_(\d+)_(.+)$/);
        if (appointmentMatch) {
          const [, appointmentId, calendarEventId] = appointmentMatch;
          return {
            apiUrl: `/api/calendar/events/${calendarEventId}`,
            requestBody: {
              title: formData.title.replace(/^🤝 /, ''), // 絵文字を除去
              date: formData.date,
              time: formData.time,
              endTime: formData.endTime || null,
              description: formData.description,
              location: formData.location,
              appointmentId: parseInt(appointmentId)
            }
          };
        }
        break;
      
      case 'calendar_events':
      default:
        // 通常のカレンダーイベント
        return {
          apiUrl: `/api/calendar/events/${event.id}`,
          requestBody: {
            title: formData.title,
            date: formData.date,
            time: formData.time,
            endTime: formData.endTime || null,
            category: formData.category,
            description: formData.description,
            location: formData.location,
            importance: formData.priority === 'A' ? 0.9 : formData.priority === 'B' ? 0.7 : formData.priority === 'C' ? 0.5 : 0.3,
            isAllDay: formData.isAllDay
          }
        };
    }
    
    // フォールバック
    return {
      apiUrl: `/api/calendar/events/${event.id}`,
      requestBody: {
        title: formData.title,
        date: formData.date,
        time: formData.time,
        endTime: formData.endTime || null,
        category: formData.category,
        description: formData.description,
        location: formData.location,
        importance: formData.priority === 'A' ? 0.9 : formData.priority === 'B' ? 0.7 : formData.priority === 'C' ? 0.5 : 0.3,
        isAllDay: formData.isAllDay
      }
    };
  };

  if (!isOpen || !event) return null;

  const categoryLabels: Record<EventCategory, string> = {
    APPOINTMENT: 'アポイントメント',
    TASK_DUE: 'タスク期限',
    PROJECT: 'プロジェクト',
    EVENT: 'イベント',
    PERSONAL: '個人予定'
  };

  const priorityLabels: Record<PriorityLevel, string> = {
    A: 'A項目（緊急）',
    B: 'B項目（重要）', 
    C: 'C項目（最優先）',
    D: 'D項目（要検討）'
  };

  const getEventTypeName = () => {
    if (event.tasks) return 'タスク';
    if (event.appointments) return 'アポイントメント';
    return 'イベント';
  };

  return (
    <>
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 bg-gray-700/80 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        {/* モーダル */}
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {getEventTypeName()}編集
            </h2>
            <div className="flex items-center space-x-2">
              {onDelete && (
                <button
                  onClick={() => {
                    if (window.confirm(`${getEventTypeName()}を削除してもよろしいですか？`)) {
                      onDelete(event!.id);
                      onClose();
                    }
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="削除"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="閉じる"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* コンテンツ */}
          <div className="p-4 overflow-y-auto max-h-[60vh] sm:max-h-[70vh] space-y-4">
            {/* タイトル */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                タイトル
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="イベントタイトル"
              />
            </div>

            {/* 日付と時刻 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  日付
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  開始時刻
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  disabled={formData.isAllDay}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
            </div>

            {/* 終了時刻と終日 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  終了時刻
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  disabled={formData.isAllDay}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isAllDay}
                    onChange={(e) => setFormData({ ...formData, isAllDay: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">終日</span>
                </label>
              </div>
            </div>

            {/* カテゴリ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                カテゴリ
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as EventCategory })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* 優先度 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                優先度
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as PriorityLevel })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* 場所 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                場所
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="場所を入力"
              />
            </div>

            {/* 説明 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                説明
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="詳細な説明..."
              />
            </div>
          </div>

          {/* フッター */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}