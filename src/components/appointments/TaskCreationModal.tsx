"use client";

import { useState } from 'react';
import { Appointment } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';

interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  priority: 'A' | 'B' | 'C' | 'D';
  estimatedDays: number;
}

const TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'document_creation',
    title: '資料作成',
    description: '${companyName}様向けの提案資料・企画書を作成',
    priority: 'A',
    estimatedDays: 3
  },
  {
    id: 'schedule_coordination',
    title: '日程調整',
    description: '${companyName}様との次回ミーティング日程調整',
    priority: 'B',
    estimatedDays: 1
  },
  {
    id: 'internal_meeting',
    title: '社内持ち帰りMTG',
    description: '${companyName}様案件の社内検討会議・方針決定',
    priority: 'A',
    estimatedDays: 2
  }
];

interface TaskCreationModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  targetRelationshipStatus: string | null;
  onClose: () => void;
  onSubmit: (tasks: any[]) => Promise<void>;
}

export default function TaskCreationModal({
  isOpen,
  appointment,
  targetRelationshipStatus,
  onClose,
  onSubmit
}: TaskCreationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [customTasks, setCustomTasks] = useState<Array<{
    title: string;
    description: string;
    priority: 'A' | 'B' | 'C' | 'D';
    dueDate: string;
  }>>([]);

  if (!isOpen || !appointment) return null;

  const handleTemplateToggle = (templateId: string) => {
    setSelectedTemplates(prev => 
      prev.includes(templateId) 
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  const addCustomTask = () => {
    setCustomTasks(prev => [...prev, {
      title: '',
      description: '',
      priority: 'B',
      dueDate: ''
    }]);
  };

  const updateCustomTask = (index: number, field: string, value: string) => {
    setCustomTasks(prev => prev.map((task, i) => 
      i === index ? { ...task, [field]: value } : task
    ));
  };

  const removeCustomTask = (index: number) => {
    setCustomTasks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTemplates.length === 0 && customTasks.length === 0) return;

    setIsSubmitting(true);
    try {
      const tasksToCreate: any[] = [];

      // テンプレートタスク
      selectedTemplates.forEach(templateId => {
        const template = TASK_TEMPLATES.find(t => t.id === templateId);
        if (template) {
          tasksToCreate.push({
            title: template.title.replace('${companyName}', appointment.companyName),
            description: template.description.replace('${companyName}', appointment.companyName),
            priority: template.priority,
            dueDate: new Date(Date.now() + template.estimatedDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'PLAN',
            relatedAppointmentId: appointment.id,
            tags: ['フォローアップ', appointment.companyName]
          });
        }
      });

      // カスタムタスク
      customTasks.forEach(task => {
        if (task.title.trim()) {
          tasksToCreate.push({
            ...task,
            status: 'PLAN',
            relatedAppointmentId: appointment.id,
            tags: ['フォローアップ', appointment.companyName]
          });
        }
      });

      await onSubmit(tasksToCreate);
      setSelectedTemplates([]);
      setCustomTasks([]);
      onClose();
    } catch (error) {
      console.error('Failed to create tasks:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                フォローアップタスク作成
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {appointment.companyName} - {appointment.contactName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* テンプレートタスク */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">テンプレートから選択</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {TASK_TEMPLATES.map(template => (
                  <div 
                    key={template.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedTemplates.includes(template.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleTemplateToggle(template.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{template.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {template.description.replace('${companyName}', appointment.companyName)}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            template.priority === 'A' ? 'bg-red-100 text-red-800' :
                            template.priority === 'B' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            優先度{template.priority}
                          </span>
                          <span className="text-xs text-gray-500">
                            {template.estimatedDays}日後期限
                          </span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedTemplates.includes(template.id)}
                        onChange={() => handleTemplateToggle(template.id)}
                        className="ml-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* カスタムタスク */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">カスタムタスク</h3>
                <button
                  type="button"
                  onClick={addCustomTask}
                  className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
                >
                  + タスク追加
                </button>
              </div>
              
              {customTasks.map((task, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <input
                        type="text"
                        placeholder="タスク名"
                        value={task.title}
                        onChange={(e) => updateCustomTask(index, 'title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                      <textarea
                        placeholder="詳細説明"
                        value={task.description}
                        onChange={(e) => updateCustomTask(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows={2}
                      />
                      <div className="flex space-x-3">
                        <select
                          value={task.priority}
                          onChange={(e) => updateCustomTask(index, 'priority', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="A">最優先</option>
                          <option value="B">重要</option>
                          <option value="C">緊急</option>
                          <option value="D">要検討</option>
                        </select>
                        <input
                          type="date"
                          value={task.dueDate}
                          onChange={(e) => updateCustomTask(index, 'dueDate', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCustomTask(index)}
                      className="ml-3 text-red-500 hover:text-red-700"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* アクションボタン */}
            <div className="flex space-x-3 pt-6 border-t">
              <button
                type="submit"
                disabled={isSubmitting || (selectedTemplates.length === 0 && customTasks.length === 0)}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner />
                    <span>作成中...</span>
                  </>
                ) : (
                  <span>
                    タスク作成してフォローアップへ移動
                    ({selectedTemplates.length + customTasks.filter(t => t.title.trim()).length}件)
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}