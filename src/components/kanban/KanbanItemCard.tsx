'use client';

import React, { useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { 
  KanbanItem, 
  KanbanViewType, 
  TaskKanbanItem, 
  AppointmentKanbanItem, 
  ProjectKanbanItem 
} from '@/lib/types/kanban-types';
import { TASK_STATUS_LABELS, PRIORITY_LABELS } from '@/lib/types';

interface KanbanItemCardProps {
  item: KanbanItem;
  viewType: KanbanViewType;
  onItemClick?: (item: KanbanItem) => void;
  onQuickAction?: (action: string, item: KanbanItem) => void;
  isDragging?: boolean;
  columnId?: string;
}

export function KanbanItemCard({
  item,
  viewType,
  onItemClick,
  onQuickAction,
  isDragging = false,
  columnId
}: KanbanItemCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    active
  } = useSortable({
    id: item.id,
    data: {
      type: 'kanban-item',
      item,
      columnId
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: active?.id === item.id ? 0.5 : 1
  };

  const handleClick = useCallback(() => {
    onItemClick?.(item);
  }, [item, onItemClick]);

  const handleQuickAction = useCallback((action: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onQuickAction?.(action, item);
  }, [item, onQuickAction]);

  // 優先度の色
  const getPriorityColor = (priority: 'A' | 'B' | 'C' | 'D') => {
    const colors = {
      A: 'bg-red-100 text-red-800 border-red-200',
      B: 'bg-orange-100 text-orange-800 border-orange-200',
      C: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      D: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[priority];
  };

  // 期限の表示とスタイル
  const getDueDateDisplay = (dueDate?: string) => {
    if (!dueDate) return null;
    
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    let className = 'text-xs px-2 py-1 rounded ';
    let label = '';
    
    if (diffDays < 0) {
      className += 'bg-red-100 text-red-800';
      label = `${Math.abs(diffDays)}日遅れ`;
    } else if (diffDays === 0) {
      className += 'bg-orange-100 text-orange-800';
      label = '今日';
    } else if (diffDays <= 3) {
      className += 'bg-yellow-100 text-yellow-800';
      label = `${diffDays}日後`;
    } else {
      className += 'bg-gray-100 text-gray-600';
      label = due.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
    }
    
    return <span className={className}>{label}</span>;
  };

  // アイテムタイプ別の内容レンダリング
  const renderItemContent = () => {
    switch (item.type) {
      case 'task':
        const task = item as TaskKanbanItem;
        return (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(task.priority)}`}>
                {PRIORITY_LABELS[task.priority]}
              </span>
              {task.dueDate && getDueDateDisplay(task.dueDate)}
            </div>
            
            <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
              {task.title}
            </h4>
            
            {task.description && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {task.description}
              </p>
            )}
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-2">
                {task.project && (
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    📁 {task.project.name}
                  </span>
                )}
                {task.estimatedHours && (
                  <span>⏱️ {task.estimatedHours}h</span>
                )}
              </div>
              
              {viewType !== 'user' && task.assignee && (
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: task.assignee.color }}
                  title={task.assignee.name}
                >
                  {task.assignee.name.charAt(0)}
                </div>
              )}
            </div>
          </>
        );

      case 'appointment':
        const appointment = item as AppointmentKanbanItem;
        return (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(appointment.priority)}`}>
                {PRIORITY_LABELS[appointment.priority]}
              </span>
              {appointment.scheduledDate && getDueDateDisplay(appointment.scheduledDate)}
            </div>
            
            <h4 className="font-medium text-gray-900 mb-1">
              {appointment.companyName}
            </h4>
            
            <p className="text-sm text-gray-600 mb-2">
              {appointment.contactName}
            </p>
            
            <div className="text-xs text-gray-500 space-y-1">
              {appointment.phone && (
                <div>📞 {appointment.phone}</div>
              )}
              {appointment.nextAction && (
                <div className="bg-blue-50 px-2 py-1 rounded">
                  📝 {appointment.nextAction}
                </div>
              )}
            </div>
            
            {viewType !== 'user' && appointment.assignee && (
              <div className="flex items-center justify-end mt-2">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: appointment.assignee.color }}
                  title={appointment.assignee.name}
                >
                  {appointment.assignee.name.charAt(0)}
                </div>
              </div>
            )}
          </>
        );

      case 'project':
        const project = item as ProjectKanbanItem;
        return (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(project.priority)}`}>
                {PRIORITY_LABELS[project.priority]}
              </span>
              {project.endDate && getDueDateDisplay(project.endDate)}
            </div>
            
            <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
              {project.name}
            </h4>
            
            {project.description && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {project.description}
              </p>
            )}
            
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>進捗</span>
                <span>{project.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>👥 {project.teamMembers.length}人</span>
              {viewType !== 'user' && project.assignee && (
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: project.assignee.color }}
                  title={project.assignee.name}
                >
                  {project.assignee.name.charAt(0)}
                </div>
              )}
            </div>
          </>
        );

      default:
        return (
          <div className="text-sm text-gray-500">
            不明なアイテムタイプ
          </div>
        );
    }
  };

  // クイックアクションボタン
  const renderQuickActions = () => {
    const actions = [];
    
    if (item.type === 'task') {
      const task = item as TaskKanbanItem;
      if (task.status !== 'COMPLETE') {
        actions.push(
          <button
            key="complete"
            onClick={(e) => handleQuickAction('complete', e)}
            className="p-1 text-green-600 hover:bg-green-50 rounded"
            title="完了"
          >
            ✅
          </button>
        );
      }
      if (task.status === 'DO') {
        actions.push(
          <button
            key="extend"
            onClick={(e) => handleQuickAction('extend_deadline', e)}
            className="p-1 text-orange-600 hover:bg-orange-50 rounded"
            title="期限延長"
          >
            ⏰
          </button>
        );
      }
    }
    
    if (item.type === 'appointment') {
      actions.push(
        <button
          key="schedule"
          onClick={(e) => handleQuickAction('schedule', e)}
          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
          title="スケジュール"
        >
          📅
        </button>
      );
    }
    
    return actions.length > 0 ? (
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {actions}
      </div>
    ) : null;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`kanban-item-card group bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
        isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {renderItemContent()}
        </div>
        
        {renderQuickActions()}
      </div>
    </div>
  );
}