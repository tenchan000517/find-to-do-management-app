"use client";

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { 
  Edit, 
  RefreshCw, 
  Target, 
  Trash2, 
  AlertCircle, 
  FileEdit,
  Clock
} from 'lucide-react';

interface TaskUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskId: string, action: 'reschedule' | 'improve' | 'delete', data?: any) => void;
  taskId: string;
}

export default function TaskUpdateModal({ isOpen, onClose, onSubmit, taskId }: TaskUpdateModalProps) {
  const [selectedAction, setSelectedAction] = useState<'reschedule' | 'improve' | 'delete' | null>(null);
  const [improvements, setImprovements] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSubmit = () => {
    if (!selectedAction) return;

    switch (selectedAction) {
      case 'reschedule':
        onSubmit(taskId, 'reschedule');
        break;
      case 'improve':
        if (!improvements.trim()) {
          alert('改善項目を入力してください');
          return;
        }
        onSubmit(taskId, 'improve', { improvements: improvements.trim() });
        break;
      case 'delete':
        if (!confirmDelete) {
          alert('削除を確認してください');
          return;
        }
        onSubmit(taskId, 'delete');
        break;
    }
    handleClose();
  };

  const handleClose = () => {
    setSelectedAction(null);
    setImprovements('');
    setConfirmDelete(false);
    onClose();
  };

  const actionOptions = [
    {
      id: 'reschedule' as const,
      title: '期日をリセット',
      description: '期日をクリアしてアイデア段階に戻す',
      icon: RefreshCw,
      color: 'border-blue-200 hover:bg-blue-50',
      selectedColor: 'border-blue-400 bg-blue-50',
    },
    {
      id: 'improve' as const,
      title: '改善して実行',
      description: '改善項目を記録して実行段階に移行',
      icon: Target,
      color: 'border-green-200 hover:bg-green-50',
      selectedColor: 'border-green-400 bg-green-50',
    },
    {
      id: 'delete' as const,
      title: 'タスクを削除',
      description: 'このタスクを完全に削除する',
      icon: Trash2,
      color: 'border-red-200 hover:bg-red-50',
      selectedColor: 'border-red-400 bg-red-50',
    },
  ];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title="タスク更新"
      size="lg"
    >

        <div className="space-y-6">
          {/* 説明文 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800 font-medium mb-1">
                  タスクの状態を更新してください
                </p>
                <p className="text-xs text-yellow-600">
                  DELETEカンバンの代わりに、より具体的なアクションを選択できます。
                </p>
              </div>
            </div>
          </div>

          {/* アクション選択 */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              実行するアクションを選択してください
            </label>
            
            <div className="space-y-3">
              {actionOptions.map((option) => {
                const IconComponent = option.icon;
                const isSelected = selectedAction === option.id;
                
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedAction(option.id)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      isSelected ? option.selectedColor : option.color
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <IconComponent className={`w-5 h-5 mt-0.5 ${
                        option.id === 'delete' ? 'text-red-500' : 
                        option.id === 'improve' ? 'text-green-500' : 'text-blue-500'
                      }`} />
                      <div>
                        <h3 className="font-medium text-gray-900 mb-1">
                          {option.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 改善項目入力（改善して実行が選択された場合） */}
          {selectedAction === 'improve' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                <FileEdit className="w-4 h-4 inline mr-1" />
                改善項目 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
                placeholder="どのような改善を行いますか？具体的に記述してください..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                required
              />
              <p className="text-xs text-gray-500">
                改善項目はタスクのサマリーとして保存され、今後の参考になります。
              </p>
            </div>
          )}

          {/* 削除確認（削除が選択された場合） */}
          {selectedAction === 'delete' && (
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-800 font-medium mb-2">
                      警告: この操作は取り消せません
                    </p>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="confirmDelete"
                        checked={confirmDelete}
                        onChange={(e) => setConfirmDelete(e.target.checked)}
                        className="w-4 h-4 text-red-600"
                      />
                      <label htmlFor="confirmDelete" className="text-sm text-red-700">
                        本当にこのタスクを削除することを確認しました
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 期日リセット説明（期日リセットが選択された場合） */}
          {selectedAction === 'reschedule' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium mb-1">
                    期日をリセットします
                  </p>
                  <p className="text-xs text-blue-600">
                    タスクはアイデア段階に戻り、再度計画を立て直すことができます。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleClose}>
              キャンセル
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!selectedAction}
              variant={selectedAction === 'delete' ? 'danger' : 'primary'}
            >
              {selectedAction === 'reschedule' && '期日をリセット'}
              {selectedAction === 'improve' && '改善して実行'}
              {selectedAction === 'delete' && 'タスクを削除'}
              {!selectedAction && 'アクションを選択'}
            </Button>
          </div>
        </div>
    </Modal>
  );
}