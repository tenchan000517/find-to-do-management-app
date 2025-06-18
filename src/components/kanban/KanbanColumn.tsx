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
import { LoadingInline } from '@/components/ui/Loading';

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

  // 点線ドロップゾーン専用
  const { setNodeRef: setDropZoneRef, isOver: isDropZoneOver } = useDroppable({
    id: `${column.id}-dropzone`,
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

  // ステータス別ドロップゾーン色分け
  const getDropZoneStyle = () => {
    if (!isOver) return { backgroundColor: color };
    
    const statusColors = {
      'IDEA': { ring: 'ring-gray-400', bg: 'rgba(156, 163, 175, 0.1)' },
      'PLAN': { ring: 'ring-blue-400', bg: 'rgba(59, 130, 246, 0.1)' },
      'DO': { ring: 'ring-yellow-400', bg: 'rgba(245, 158, 11, 0.1)' },
      'CHECK': { ring: 'ring-orange-400', bg: 'rgba(249, 115, 22, 0.1)' },
      'COMPLETE': { ring: 'ring-green-400', bg: 'rgba(34, 197, 94, 0.1)' },
      'KNOWLEDGE': { ring: 'ring-purple-400', bg: 'rgba(147, 51, 234, 0.1)' },
      'DELETE': { ring: 'ring-red-400', bg: 'rgba(239, 68, 68, 0.1)' }
    };
    
    const statusColor = statusColors[column.id as keyof typeof statusColors];
    return {
      backgroundColor: statusColor?.bg || `${color}20`
    };
  };

  const getDropZoneClass = () => {
    if (!isOver) return '';
    
    const statusColors = {
      'IDEA': 'ring-2 ring-gray-400',
      'PLAN': 'ring-2 ring-blue-400', 
      'DO': 'ring-2 ring-yellow-400',
      'CHECK': 'ring-2 ring-orange-400',
      'COMPLETE': 'ring-2 ring-green-400',
      'KNOWLEDGE': 'ring-2 ring-purple-400',
      'DELETE': 'ring-2 ring-red-400'
    };
    
    return statusColors[column.id as keyof typeof statusColors] || 'ring-2 ring-blue-400';
  };

  return (
    <div 
      ref={setNodeRef}
      className={`kanban-column flex-1 min-w-[240px] max-w-[300px] transition-all duration-200 ${getDropZoneClass()}`}
      style={getDropZoneStyle()}
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
              <LoadingInline 
                text="" 
                size="sm" 
                className="text-blue-600"
              />
            )}
          </div>
        </div>
        {renderColumnMeta()}
        {column.description && (
          <div className="text-xs text-gray-600 mt-2">{column.description}</div>
        )}
      </div>

      {/* カラムコンテンツ */}
      <div className="column-content p-4 min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto">
        <SortableContext 
          items={column.items.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
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
          
          {/* ドロップゾーン（常に表示） */}
          <div 
            ref={setDropZoneRef}
            className={`mt-4 min-h-[120px] border-2 border-dashed rounded-lg flex items-center justify-center transition-all duration-200 ${
              isDropZoneOver 
                ? 'border-blue-500 bg-blue-100 scale-105 shadow-lg' 
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <div className="text-center text-gray-400">
              <div className="text-2xl mb-2">⬇️</div>
              <div className="text-sm">
                {column.items.length === 0 ? 'アイテムなし' : 'ここにドロップ'}
              </div>
              {viewType !== 'deadline' && (
                <div className="text-xs mt-1 text-gray-300">
                  ドラッグ＆ドロップでステータス変更
                </div>
              )}
            </div>
          </div>
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