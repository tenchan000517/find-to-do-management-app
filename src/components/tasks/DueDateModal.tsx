"use client";

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Calendar, Clock, AlertTriangle, Flag } from 'lucide-react';
import { Task } from '@/lib/types';

interface DueDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskId: string, dueDate: string, priority?: Task['priority']) => void;
  taskId: string;
}

export default function DueDateModal({ isOpen, onClose, onSubmit, taskId }: DueDateModalProps) {
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Task['priority'] | ''>('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dueDate) {
      setError('期日を設定してください');
      return;
    }

    const selectedDate = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      setError('期日は今日以降の日付を選択してください');
      return;
    }

    setError('');
    onSubmit(taskId, dueDate, priority as Task['priority'] || undefined);
    handleClose();
  };

  const handleClose = () => {
    setDueDate('');
    setPriority('');
    setError('');
    onClose();
  };

  const getQuickDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  const priorityOptions: { value: Task['priority']; label: string; color: string }[] = [
    { value: 'A', label: '最優先', color: 'bg-red-100 text-red-800 border-red-200' },
    { value: 'B', label: '高優先', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { value: 'C', label: '中優先', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    { value: 'D', label: '低優先', color: 'bg-green-100 text-green-800 border-green-200' },
  ];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title="期日設定が必要です"
      size="md"
    >

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 説明文 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 font-medium mb-1">
                  実行段階への移行には期日設定が必要です
                </p>
                <p className="text-xs text-blue-600">
                  タスクの期限を設定することで、効率的な進捗管理が可能になります。
                </p>
              </div>
            </div>
          </div>

          {/* 期日設定 */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              <Calendar className="w-4 h-4 inline mr-1" />
              期日 <span className="text-red-500">*</span>
            </label>
            
            {/* クイック設定ボタン */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setDueDate(getQuickDate(0))}
                className="text-xs"
              >
                今日
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setDueDate(getQuickDate(1))}
                className="text-xs"
              >
                明日
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setDueDate(getQuickDate(7))}
                className="text-xs"
              >
                来週
              </Button>
            </div>

            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* 優先度設定（オプション） */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              <Flag className="w-4 h-4 inline mr-1" />
              優先度（任意）
            </label>
            <div className="grid grid-cols-2 gap-2">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPriority(priority === option.value ? '' : option.value)}
                  className={`px-3 py-2 rounded-md border text-sm font-medium transition-all ${
                    priority === option.value
                      ? option.color
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleClose}>
              キャンセル
            </Button>
            <Button type="submit">
              期日を設定して実行開始
            </Button>
          </div>
        </form>
    </Modal>
  );
}