'use client';

import { useState } from 'react';
import { Task, TASK_STATUS_LABELS, PRIORITY_LABELS } from '@/lib/types';
import { User } from '@/lib/types';
import { Project } from '@/lib/types';
import { LoadingOverlay } from '@/components/ui/Loading';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTask: Task | null;
  users: User[];
  projects: Project[];
  onSubmit: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onDataRefresh?: () => void;
}

export default function TaskModal({
  isOpen,
  onClose,
  editingTask,
  users,
  projects,
  onSubmit,
  onDataRefresh
}: TaskModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const taskData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        projectId: formData.get('projectId') as string || undefined,
        userId: formData.get('userId') as string,
        status: formData.get('status') as Task['status'],
        priority: formData.get('priority') as Task['priority'],
        dueDate: formData.get('dueDate') as string || undefined,
        isArchived: false,
      };

      await onSubmit(taskData);
      
      // データの再読み込みを実行
      onDataRefresh?.();
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
      alert('タスクの保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto relative">
        {/* ローディングオーバーレイ */}
        <LoadingOverlay 
          isLoading={isLoading}
          message="タスクを保存しています..."
          size="md"
        />
        
        <h2 className="text-xl font-bold mb-4">
          {editingTask ? 'タスク編集' : '新規タスク'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タスク名
            </label>
            <input
              type="text"
              name="title"
              defaultValue={editingTask?.title || ''}
              required
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              説明
            </label>
            <textarea
              name="description"
              defaultValue={editingTask?.description || ''}
              rows={3}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              プロジェクト
            </label>
            <select
              name="projectId"
              defaultValue={editingTask?.projectId || ''}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">なし</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              担当者
            </label>
            <select
              name="userId"
              defaultValue={editingTask?.userId || ''}
              required
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">担当者を選択してください</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ステータス
            </label>
            <select
              name="status"
              defaultValue={editingTask?.status || 'IDEA'}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="IDEA">{TASK_STATUS_LABELS.IDEA}</option>
              <option value="PLAN">{TASK_STATUS_LABELS.PLAN}</option>
              <option value="DO">{TASK_STATUS_LABELS.DO}</option>
              <option value="CHECK">{TASK_STATUS_LABELS.CHECK}</option>
              <option value="COMPLETE">{TASK_STATUS_LABELS.COMPLETE}</option>
              <option value="KNOWLEDGE">{TASK_STATUS_LABELS.KNOWLEDGE}</option>
              <option value="DELETE">{TASK_STATUS_LABELS.DELETE}</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              優先度
            </label>
            <select
              name="priority"
              defaultValue={editingTask?.priority || 'C'}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="A">{PRIORITY_LABELS.A}</option>
              <option value="B">{PRIORITY_LABELS.B}</option>
              <option value="C">{PRIORITY_LABELS.C}</option>
              <option value="D">{PRIORITY_LABELS.D}</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              期限
            </label>
            <input
              type="date"
              name="dueDate"
              defaultValue={editingTask?.dueDate || ''}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? '保存中...' : (editingTask ? '更新' : '作成')}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md font-medium disabled:bg-gray-200 disabled:cursor-not-allowed"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}