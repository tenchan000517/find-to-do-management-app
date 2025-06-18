'use client';

import React, { useMemo, useCallback, useState } from 'react';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners
} from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';

import { 
  UniversalKanbanProps, 
  KanbanItem, 
  KanbanColumn, 
  KanbanViewType,
  KanbanMoveRequest,
  KANBAN_COLUMN_CONFIGS 
} from '@/lib/types/kanban-types';
import { User, Project, Task, Appointment } from '@/lib/types';
import { useKanbanMove } from '@/lib/hooks/useKanbanMove';
import { KanbanColumnComponent } from './KanbanColumn';
import { KanbanItemCard } from './KanbanItemCard';
import { KanbanDataTransformer } from '@/lib/utils/kanban-data-transformer';

export function UniversalKanban({
  itemType,
  viewType,
  items,
  users = [],
  projects = [],
  filter,
  configuration,
  onItemMove,
  onItemClick,
  onQuickAction,
  className = ''
}: UniversalKanbanProps) {
  const [activeItem, setActiveItem] = useState<KanbanItem | null>(null);
  const [dragStartColumn, setDragStartColumn] = useState<string | null>(null);

  // カンバン移動フック
  const { 
    moveItem, 
    isLoading, 
    error 
  } = useKanbanMove({
    itemType,
    onMoveComplete: onItemMove,
    enableOptimisticUpdate: configuration?.enableOptimisticUpdates ?? true,
    debounceDelay: 300
  });

  // データ変換器
  const dataTransformer = useMemo(() => new KanbanDataTransformer(), []);

  // フィルター済みアイテム
  const filteredItems = useMemo(() => {
    if (!filter) return items;
    return dataTransformer.filterItems(items, filter);
  }, [items, filter, dataTransformer]);

  // カラム生成とアイテムのグループ化
  const columns = useMemo(() => {
    const baseColumns = dataTransformer.groupItemsByColumn(
      filteredItems, 
      viewType, 
      users, 
      projects
    );

    // 各カラム内でアイテムをソート
    return baseColumns.map(column => ({
      ...column,
      items: dataTransformer.sortItemsInColumn(column.items, 'priority')
    }));
  }, [filteredItems, viewType, users, projects, dataTransformer]);

  // ドラッグ&ドロップセンサー
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // 3px移動後にドラッグ開始
      },
    })
  );

  // ドラッグ開始ハンドラー
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activeItemData = active.data.current;
    
    if (activeItemData?.type === 'kanban-item') {
      setActiveItem(activeItemData.item);
      setDragStartColumn(activeItemData.columnId);
    }
  }, []);

  // ドラッグ終了ハンドラー
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveItem(null);
    setDragStartColumn(null);

    if (!over || !activeItem) return;

    const overData = over.data.current;
    const targetColumn = overData?.columnId || over.id;
    
    // 同じカラム内での移動は無視
    if (dragStartColumn === targetColumn) return;

    // 移動リクエスト作成
    const moveRequest: KanbanMoveRequest = {
      itemType,
      itemId: activeItem.id,
      sourceColumn: dragStartColumn!,
      targetColumn: targetColumn as string,
      kanbanType: viewType
    };

    // ユーザータブでの移動の場合、assignedTo を設定
    if (viewType === 'user' && targetColumn !== 'unassigned') {
      const targetUser = users.find(user => user.id === targetColumn);
      if (targetUser) {
        moveRequest.newAssignee = targetUser.id;
      }
    }

    // プロジェクトタブでの移動の場合
    if (viewType === 'project' && targetColumn !== 'no_project') {
      const targetProject = projects.find(project => project.id === targetColumn);
      if (targetProject) {
        moveRequest.projectId = targetProject.id;
      }
    }

    // ステータスタブでの移動の場合
    if (viewType === 'status') {
      moveRequest.newStatus = targetColumn;
    }

    try {
      await moveItem(moveRequest);
    } catch (error) {
      console.error('カンバン移動エラー:', error);
    }
  }, [
    activeItem, 
    dragStartColumn, 
    itemType, 
    viewType, 
    users, 
    projects, 
    moveItem
  ]);

  // アイテムクリックハンドラー
  const handleItemClick = useCallback((item: KanbanItem) => {
    onItemClick?.(item);
  }, [onItemClick]);

  // クイックアクションハンドラー
  const handleQuickAction = useCallback((action: string, item: KanbanItem) => {
    onQuickAction?.(action, item);
  }, [onQuickAction]);

  // カラムの動的配色
  const getColumnColor = useCallback((columnId: string, viewType: KanbanViewType) => {
    const config = KANBAN_COLUMN_CONFIGS[viewType]?.find(col => col.id === columnId);
    return config?.color || '#f3f4f6';
  }, []);

  // ローディング表示
  if (isLoading && filteredItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className={`universal-kanban ${className}`}>
      {/* エラー表示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800 text-sm">{error}</div>
        </div>
      )}

      {/* カンバンボード */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board flex gap-6 overflow-x-auto pb-6">
          <SortableContext items={columns.map(col => col.id)}>
            {columns.map(column => (
              <KanbanColumnComponent
                key={column.id}
                column={column}
                viewType={viewType}
                onItemMove={moveItem}
                onItemClick={handleItemClick}
                onQuickAction={handleQuickAction}
                isLoading={isLoading}
                color={getColumnColor(column.id, viewType)}
              />
            ))}
          </SortableContext>
        </div>

        {/* ドラッグオーバーレイ */}
        <DragOverlay>
          {activeItem && (
            <div className="rotate-5 opacity-90">
              <KanbanItemCard
                item={activeItem}
                viewType={viewType}
                onItemClick={handleItemClick}
                onQuickAction={handleQuickAction}
                isDragging={true}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* 統計情報 */}
      {configuration?.showItemCounts && (
        <div className="mt-6 flex gap-4 text-sm text-gray-600">
          <span>総アイテム数: {filteredItems.length}</span>
          <span>カラム数: {columns.length}</span>
          {filter && (
            <span className="text-blue-600">フィルター適用中</span>
          )}
        </div>
      )}
    </div>
  );
}