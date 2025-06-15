'use client';

import { useState, useEffect } from 'react';
import { CalendarEvent, EventCategory, PriorityLevel } from '@/types/calendar';

interface EventEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  onSave?: (event: CalendarEvent) => void;
}

export function EventEditModal({
  isOpen,
  onClose,
  event,
  onSave
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

  const handleSave = async () => {
    if (!event) return;

    try {
      const updatedEvent: CalendarEvent = {
        ...event,
        ...formData
      };

      // API呼び出しで更新
      const response = await fetch(`/api/calendar/events/${event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          date: formData.date,
          time: formData.time,
          endTime: formData.endTime || null,
          category: formData.category,
          description: formData.description,
          location: formData.location,
          importance: formData.priority === 'A' ? 0.9 : formData.priority === 'B' ? 0.7 : formData.priority === 'C' ? 0.5 : 0.3
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const savedEvent = await response.json();
      
      onSave?.(savedEvent);
      onClose();
    } catch (error) {
      console.error('Failed to save event:', error);
      alert('イベントの保存に失敗しました。もう一度お試しください。');
    }
  };

  if (!isOpen || !event) return null;

  const categoryLabels: Record<EventCategory, string> = {
    APPOINTMENT: 'アポイントメント',
    TASK_DUE: 'タスク期限',
    PROJECT: 'プロジェクト',
    EVENT: 'イベント'
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
        className="fixed inset-0 z-[80] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* モーダル */}
        <div
          className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden relative z-[81]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {getEventTypeName()}編集
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
          <div className="p-4 overflow-y-auto max-h-[70vh] space-y-4">
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
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}