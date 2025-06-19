'use client';

import { useState } from 'react';
import { TaskKanbanItem } from '@/lib/types/kanban-types';
import { Modal } from '@/components/ui/Modal';

interface DueDateResetModalProps {
  isOpen: boolean;
  task: TaskKanbanItem | null;
  onConfirm: (resetDueDate: boolean) => Promise<void>;
  onCancel: () => void;
}

export default function DueDateResetModal({
  isOpen,
  task,
  onConfirm,
  onCancel
}: DueDateResetModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!task) return null;

  const handleConfirm = async (resetDueDate: boolean) => {
    setIsSubmitting(true);
    try {
      await onConfirm(resetDueDate);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      size="sm"
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              期限のリセット確認
            </h3>
            <p className="text-sm text-gray-600">
              {task.title}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-3">
            このタスクは現在期限が設定されています：
          </p>
          <div className="bg-gray-50 p-3 rounded-lg mb-4">
            <div className="text-sm text-gray-600">現在の期限</div>
            <div className="font-medium text-gray-900">
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString('ja-JP') : ''}
            </div>
          </div>
          <p className="text-gray-700">
            ステータスを変更する際、期限をリセットしますか？
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handleConfirm(true)}
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded-md font-medium transition-colors"
          >
            {isSubmitting ? '処理中...' : 'はい、期限をリセット'}
          </button>
          <button
            onClick={() => handleConfirm(false)}
            disabled={isSubmitting}
            className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-800 py-2 px-4 rounded-md font-medium transition-colors"
          >
            いいえ、期限を保持
          </button>
        </div>

        <div className="mt-3">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full bg-white hover:bg-gray-50 disabled:bg-gray-50 disabled:cursor-not-allowed border border-gray-300 text-gray-700 py-2 px-4 rounded-md font-medium transition-colors"
          >
            キャンセル
          </button>
        </div>
      </div>
    </Modal>
  );
}