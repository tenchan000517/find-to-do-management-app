'use client';

import React, { useState, useMemo } from 'react';
import { 
  UniversalKanban, 
  KanbanViewType, 
  KanbanFilter,
  KanbanConfiguration 
} from '@/components/kanban/UniversalKanban';
import { KanbanDataTransformer } from '@/lib/utils/kanban-data-transformer';
import { Task, User, Project } from '@/lib/types';

interface UniversalTaskKanbanProps {
  tasks: Task[];
  users: User[];
  projects: Project[];
  defaultView?: KanbanViewType;
  onTaskClick?: (task: Task) => void;
  onQuickAction?: (action: string, task: Task) => void;
  className?: string;
}

export function UniversalTaskKanban({
  tasks,
  users,
  projects,
  defaultView = 'status',
  onTaskClick,
  onQuickAction,
  className
}: UniversalTaskKanbanProps) {
  const [activeView, setActiveView] = useState<KanbanViewType>(defaultView);
  const [filter, setFilter] = useState<KanbanFilter>({});

  // データ変換器
  const dataTransformer = useMemo(() => new KanbanDataTransformer(), []);

  // タスクをKanbanItemに変換
  const kanbanItems = useMemo(() => {
    return dataTransformer.transformToKanbanItems(tasks);
  }, [tasks, dataTransformer]);

  // カンバン設定
  const kanbanConfig = useMemo((): KanbanConfiguration => ({
    viewType: activeView,
    itemType: 'task',
    columns: [],
    allowCrossColumnMove: true,
    enableOptimisticUpdates: true,
    enableDragAndDrop: true,
    showQuickActions: true,
    showItemCounts: true
  }), [activeView]);

  // アイテムクリックハンドラー
  const handleItemClick = (item: any) => {
    if (item.type === 'task' && onTaskClick) {
      // KanbanItemからTaskに変換
      const task = tasks.find(t => t.id === item.id);
      if (task) {
        onTaskClick(task);
      }
    }
  };

  // クイックアクションハンドラー
  const handleQuickAction = (action: string, item: any) => {
    if (item.type === 'task' && onQuickAction) {
      const task = tasks.find(t => t.id === item.id);
      if (task) {
        onQuickAction(action, task);
      }
    }
  };

  // ビュー切り替えボタン
  const viewButtons: Array<{ key: KanbanViewType; label: string; icon: string }> = [
    { key: 'status', label: 'ステータス', icon: '📊' },
    { key: 'user', label: 'ユーザー', icon: '👥' },
    { key: 'project', label: 'プロジェクト', icon: '📁' },
    { key: 'deadline', label: '期限', icon: '⏰' }
  ];

  // フィルター制御
  const updateFilter = (newFilter: Partial<KanbanFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  };

  return (
    <div className={`universal-task-kanban ${className || ''}`}>
      {/* ヘッダー */}
      <div className="kanban-header mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">タスク管理</h2>
          
          {/* ビュー切り替え */}
          <div className="flex items-center gap-2">
            {viewButtons.map(button => (
              <button
                key={button.key}
                onClick={() => setActiveView(button.key)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  activeView === button.key
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{button.icon}</span>
                <span className="text-sm font-medium">{button.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* フィルター */}
        <div className="flex items-center gap-4 text-sm">
          {/* 優先度フィルター */}
          <div className="flex items-center gap-2">
            <label className="text-gray-600">優先度:</label>
            <select
              value={filter.priorities?.join(',') || ''}
              onChange={(e) => {
                const priorities = e.target.value ? e.target.value.split(',') as ('A' | 'B' | 'C' | 'D')[] : undefined;
                updateFilter({ priorities });
              }}
              className="border border-gray-300 rounded px-2 py-1"
            >
              <option value="">すべて</option>
              <option value="A">最優先</option>
              <option value="B">重要</option>
              <option value="C">緊急</option>
              <option value="D">要検討</option>
            </select>
          </div>

          {/* ユーザーフィルター */}
          {activeView !== 'user' && (
            <div className="flex items-center gap-2">
              <label className="text-gray-600">担当者:</label>
              <select
                value={filter.users?.join(',') || ''}
                onChange={(e) => {
                  const userIds = e.target.value ? e.target.value.split(',') : undefined;
                  updateFilter({ users: userIds });
                }}
                className="border border-gray-300 rounded px-2 py-1"
              >
                <option value="">すべて</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* プロジェクトフィルター */}
          {activeView !== 'project' && (
            <div className="flex items-center gap-2">
              <label className="text-gray-600">プロジェクト:</label>
              <select
                value={filter.projects?.join(',') || ''}
                onChange={(e) => {
                  const projectIds = e.target.value ? e.target.value.split(',') : undefined;
                  updateFilter({ projects: projectIds });
                }}
                className="border border-gray-300 rounded px-2 py-1"
              >
                <option value="">すべて</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* 検索 */}
          <div className="flex items-center gap-2">
            <label className="text-gray-600">検索:</label>
            <input
              type="text"
              value={filter.searchQuery || ''}
              onChange={(e) => updateFilter({ searchQuery: e.target.value || undefined })}
              placeholder="タイトル・説明で検索"
              className="border border-gray-300 rounded px-2 py-1 w-48"
            />
          </div>

          {/* フィルタークリア */}
          {Object.keys(filter).length > 0 && (
            <button
              onClick={() => setFilter({})}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              フィルター解除
            </button>
          )}
        </div>
      </div>

      {/* カンバンボード */}
      <UniversalKanban
        itemType="task"
        viewType={activeView}
        items={kanbanItems}
        users={users}
        projects={projects}
        filter={filter}
        configuration={kanbanConfig}
        onItemClick={handleItemClick}
        onQuickAction={handleQuickAction}
        className="universal-task-kanban-board"
      />
    </div>
  );
}

export default UniversalTaskKanban;