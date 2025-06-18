'use client';

import React, { useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { 
  KanbanColumn, 
  KanbanViewType, 
  KanbanMoveRequest, 
  KanbanItem 
} from '@/lib/types/kanban-types';
import { KanbanItemCard } from './KanbanItemCard';

interface KanbanColumnProps {
  column: KanbanColumn;
  viewType: KanbanViewType;
  onItemMove: (request: KanbanMoveRequest) => Promise<any>;
  onItemClick?: (item: KanbanItem) => void;
  onQuickAction?: (action: string, item: KanbanItem) => void;
  isLoading?: boolean;
  color?: string;
}

export function KanbanColumnComponent({
  column,
  viewType,
  onItemMove,
  onItemClick,
  onQuickAction,
  isLoading = false,
  color = '#f3f4f6'
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'kanban-column',
      columnId: column.id,
      accepts: ['kanban-item']
    }
  });

  const handleItemClick = useCallback((item: KanbanItem) => {
    onItemClick?.(item);
  }, [onItemClick]);

  const handleQuickAction = useCallback((action: string, item: KanbanItem) => {
    onQuickAction?.(action, item);
  }, [onQuickAction]);

  // カラムヘッダーアイコン
  const renderColumnIcon = () => {
    if (column.icon) {
      return <span className="text-lg mr-2">{column.icon}</span>;
    }
    
    // ユーザーカラムの場合、アバター表示
    if (viewType === 'user' && column.user) {
      return (
        <div 
          className="w-6 h-6 rounded-full mr-2 flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: column.user.color }}
        >
          {column.user.name.charAt(0)}
        </div>
      );
    }
    
    // プロジェクトカラムの場合
    if (viewType === 'project' && column.project) {
      const statusIcons = {
        planning: '📋',
        active: '🚀',
        on_hold: '⏸️',
        completed: '✅'
      };
      return (
        <span className="text-lg mr-2">
          {statusIcons[column.project.status] || '📁'}
        </span>
      );
    }
    
    return null;
  };

  // カラムの追加情報
  const renderColumnMeta = () => {
    if (viewType === 'user' && column.user) {
      return (
        <div className="text-xs text-gray-500 mt-1">
          {column.user.isActive ? 'アクティブ' : '非アクティブ'}
        </div>
      );
    }
    
    if (viewType === 'project' && column.project) {
      return (
        <div className="text-xs text-gray-500 mt-1">
          進捗: {column.project.progress}%
        </div>
      );
    }
    
    return null;
  };

  return (
    <div 
      ref={setNodeRef}
      className={`kanban-column flex-shrink-0 w-80 ${
        isOver ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
      }`}
      style={{ backgroundColor: isOver ? `${color}20` : color }}
    >
      {/* カラムヘッダー */}
      <div className="column-header p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {renderColumnIcon()}
            <h3 className="font-semibold text-gray-800">{column.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full">
              {column.items.length}
            </span>
            {isLoading && (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
        </div>
        {renderColumnMeta()}
        {column.description && (
          <div className="text-xs text-gray-600 mt-2">{column.description}</div>
        )}
      </div>

      {/* カラムコンテンツ */}
      <div className="column-content p-4 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto">
        <SortableContext 
          items={column.items.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.items.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <div className="text-4xl mb-2">📋</div>
              <div className="text-sm">アイテムなし</div>
              {viewType !== 'deadline' && (
                <div className="text-xs mt-1">
                  ここにドラッグ＆ドロップ
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {column.items.map(item => (
                <KanbanItemCard
                  key={item.id}
                  item={item}
                  viewType={viewType}
                  onItemClick={handleItemClick}
                  onQuickAction={handleQuickAction}
                  columnId={column.id}
                />
              ))}
            </div>
          )}
        </SortableContext>

        {/* カラム制限表示 */}
        {column.maxItems && column.items.length >= column.maxItems && (
          <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            ⚠️ カラムの上限に達しています ({column.maxItems}件)
          </div>
        )}
      </div>
    </div>
  );
}