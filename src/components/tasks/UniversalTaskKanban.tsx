'use client';

import React, { useState, useMemo } from 'react';
import { UniversalKanban } from '@/components/kanban/UniversalKanban';
import { 
  KanbanViewType, 
  KanbanFilter,
  KanbanConfiguration 
} from '@/lib/types/kanban-types';
import { KanbanDataTransformer } from '@/lib/utils/kanban-data-transformer';
import { Task, User, Project } from '@/lib/types';

interface UniversalTaskKanbanProps {
  tasks: Task[];
  users: User[];
  projects: Project[];
  defaultView?: KanbanViewType;
  currentView?: KanbanViewType;
  showViewTabs?: boolean;
  onTaskClick?: (task: Task) => void;
  onQuickAction?: (action: string, task: Task) => void;
  onTaskUpdate?: (taskId: string, data: any) => Promise<void>;
  onTaskDelete?: (taskId: string) => Promise<void>;
  className?: string;
}

export function UniversalTaskKanban({
  tasks,
  users,
  projects,
  defaultView = 'status',
  currentView,
  showViewTabs = true,
  onTaskClick,
  onQuickAction,
  onTaskUpdate,
  onTaskDelete,
  className
}: UniversalTaskKanbanProps) {
  const [activeView, setActiveView] = useState<KanbanViewType>(currentView || defaultView);
  const [filter, setFilter] = useState<KanbanFilter>({});

  // 外部からビューが制御される場合は同期
  React.useEffect(() => {
    if (currentView) {
      setActiveView(currentView);
    }
  }, [currentView]);

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

  return (
    <div className={`universal-task-kanban ${className || ''}`}>
      {/* カンバンボード */}
      <UniversalKanban
        itemType="task"
        viewType={activeView}
        items={kanbanItems}
        users={users}
        projects={projects}
        filter={filter}
        configuration={kanbanConfig}
        onItemMove={async (request) => {
          // このハンドラーはUniversalKanbanから呼ばれるため、
          // モーダル表示ロジックが先に実行されてからここに来る
          try {
            const taskId = request.itemId;
            const updateData: any = {};

            // ステータス変更の場合
            if (request.newStatus) {
              updateData.status = request.newStatus;
            }

            // 担当者変更の場合
            if (request.newAssignee) {
              updateData.assignedTo = request.newAssignee;
            }

            // プロジェクト変更の場合
            if (request.projectId !== undefined) {
              updateData.projectId = request.projectId;
            }

            // API呼び出しまたは直接更新
            if (onTaskUpdate) {
              await onTaskUpdate(taskId, updateData);
            }

            return { success: true };
          } catch (error) {
            console.error('Task move failed:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
          }
        }}
        onItemClick={handleItemClick}
        onQuickAction={handleQuickAction}
        onItemUpdate={onTaskUpdate}
        onItemDelete={onTaskDelete}
        className="universal-task-kanban-board"
      />
    </div>
  );
}

export default UniversalTaskKanban;