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
        onItemClick={handleItemClick}
        onQuickAction={handleQuickAction}
        className="universal-task-kanban-board"
      />
    </div>
  );
}

export default UniversalTaskKanban;