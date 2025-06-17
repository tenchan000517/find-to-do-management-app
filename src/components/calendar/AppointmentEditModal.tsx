'use client';

import { useState, useEffect } from 'react';
import { UnifiedCalendarEvent } from '@/types/calendar';

interface AppointmentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: UnifiedCalendarEvent | null;
  onSave?: () => void;
  onDataRefresh?: () => void;
}

export function AppointmentEditModal({
  isOpen,
  onClose,
  event,
  onSave,
  onDataRefresh
}: AppointmentEditModalProps) {
  const [appointmentData, setAppointmentData] = useState({
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    status: 'pending',
    priority: 'C',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (event && isOpen) {
      // Extract appointment ID from event.id (format: appointment_123_456)
      const appointmentMatch = event.id.match(/^appointment_(\d+)_(.+)$/);
      if (appointmentMatch) {
        const [, appointmentId] = appointmentMatch;
        fetchAppointmentData(appointmentId);
      }
    }
  }, [event, isOpen]);

  const fetchAppointmentData = async (appointmentId: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`);
      if (response.ok) {
        const data = await response.json();
        setAppointmentData({
          companyName: data.companyName || '',
          contactName: data.contactName || '',
          phone: data.phone || '',
          email: data.email || '',
          status: data.status || 'pending',
          priority: data.priority || 'C',
          notes: data.notes || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch appointment data:', error);
    }
  };

  const handleSave = async () => {
    if (!event) return;

    setIsLoading(true);
    try {
      const appointmentMatch = event.id.match(/^appointment_(\d+)_(.+)$/);
      if (appointmentMatch) {
        const [, appointmentId] = appointmentMatch;
        
        const response = await fetch(`/api/appointments/${appointmentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(appointmentData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        onSave?.();
        onDataRefresh?.();
        onClose();
      }
    } catch (error) {
      console.error('Failed to save appointment:', error);
      alert('アポイントメントの保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-semibold">アポイントメント編集</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              会社名
            </label>
            <input
              type="text"
              value={appointmentData.companyName}
              onChange={(e) => setAppointmentData(prev => ({ ...prev, companyName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              担当者名
            </label>
            <input
              type="text"
              value={appointmentData.contactName}
              onChange={(e) => setAppointmentData(prev => ({ ...prev, contactName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              電話番号
            </label>
            <input
              type="tel"
              value={appointmentData.phone}
              onChange={(e) => setAppointmentData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              value={appointmentData.email}
              onChange={(e) => setAppointmentData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ステータス
            </label>
            <select
              value={appointmentData.status}
              onChange={(e) => setAppointmentData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">未連絡</option>
              <option value="contacted">連絡済み</option>
              <option value="interested">関心あり</option>
              <option value="not_interested">関心なし</option>
              <option value="scheduled">予定済み</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              優先度
            </label>
            <select
              value={appointmentData.priority}
              onChange={(e) => setAppointmentData(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="A">A - 最優先</option>
              <option value="B">B - 重要</option>
              <option value="C">C - 緊急</option>
              <option value="D">D - 要検討</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              備考
            </label>
            <textarea
              rows={3}
              value={appointmentData.notes}
              onChange={(e) => setAppointmentData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isLoading}
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}