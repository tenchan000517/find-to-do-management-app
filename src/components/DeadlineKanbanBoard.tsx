"use client";

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Task, TASK_STATUS_LABELS, PRIORITY_LABELS } from '@/lib/types';

interface DeadlineKanbanBoardProps {
  tasks: Task[];
  onTaskMove: (taskId: string, newDueDate: string) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onQuickAction?: (taskId: string, action: string, value?: any) => void;
}

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  showDeadlineWarning?: boolean;
  onQuickAction?: (taskId: string, action: string, value?: any) => void;
}

function TaskCard({ task, onEdit, onDelete, showDeadlineWarning, onQuickAction }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'A': return 'border-l-red-400';
      case 'B': return 'border-l-yellow-400';
      case 'C': return 'border-l-orange-400';
      case 'D': return 'border-l-green-400';
      default: return 'border-l-gray-400';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'IDEA': return 'bg-gray-100 text-gray-800';
      case 'PLAN': return 'bg-blue-100 text-blue-800';
      case 'DO': return 'bg-yellow-100 text-yellow-800';
      case 'CHECK': return 'bg-orange-100 text-orange-800';
      case 'COMPLETE': return 'bg-green-100 text-green-800';
      case 'KNOWLEDGE': return 'bg-purple-100 text-purple-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysUntilDeadline = (dueDate: string | undefined) => {
    if (!dueDate) return null;
    const now = new Date();
    const deadline = new Date(dueDate);
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDeadline = task.dueDate ? getDaysUntilDeadline(task.dueDate) : null;

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 h-24 opacity-50"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg shadow-sm border-l-4 ${getPriorityColor(task.priority)} p-4 cursor-grab hover:shadow-md transition-shadow ${
        showDeadlineWarning ? 'ring-2 ring-red-300' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
          {task.title}
        </h4>
        <div className="flex gap-1 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="text-xs text-gray-400 hover:text-blue-600"
          >
            ✏️
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="text-xs text-gray-400 hover:text-red-600"
          >
            🗑️
          </button>
        </div>
      </div>
      
      {task.description && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
          {task.description}
        </p>
      )}
      
      <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
        <span className="truncate">{task.user?.name || task.userId}</span>
        {task.dueDate && (
          <div className="flex items-center gap-1">
            {daysUntilDeadline !== null && (
              <span className={`font-medium ${
                daysUntilDeadline < 0 ? 'text-red-600' :
                daysUntilDeadline === 0 ? 'text-orange-600' :
                daysUntilDeadline <= 3 ? 'text-yellow-600' :
                'text-gray-600'
              }`}>
                {daysUntilDeadline < 0 ? `${Math.abs(daysUntilDeadline)}日遅延` :
                 daysUntilDeadline === 0 ? '今日' :
                 `あと${daysUntilDeadline}日`}
              </span>
            )}
            <span>{new Date(task.dueDate).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}</span>
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center">
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
          {TASK_STATUS_LABELS[task.status]}
        </div>
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          task.priority === 'A' ? 'bg-red-100 text-red-800' :
          task.priority === 'B' ? 'bg-yellow-100 text-yellow-800' :
          task.priority === 'C' ? 'bg-orange-100 text-orange-800' :
          'bg-green-100 text-green-800'
        }`}>
          {PRIORITY_LABELS[task.priority]}
        </div>
      </div>
      
      {/* クイックアクションボタン */}
      {onQuickAction && (
        <div className="flex gap-1 mt-2">
          {task.status !== 'COMPLETE' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickAction(task.id, 'complete');
              }}
              className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded"
              title="完了にする"
            >
              ✓
            </button>
          )}
          
          {task.dueDate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                onQuickAction(task.id, 'extendDeadline', tomorrow.toISOString().split('T')[0]);
              }}
              className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-2 py-1 rounded"
              title="期限を1日延長"
            >
              +1
            </button>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              const nextPriority = task.priority === 'A' ? 'B' : task.priority === 'B' ? 'C' : task.priority === 'C' ? 'D' : 'A';
              onQuickAction(task.id, 'changePriority', nextPriority);
            }}
            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
            title="優先度を変更"
          >
            ↕
          </button>
        </div>
      )}
    </div>
  );
}

interface DeadlineColumnProps {
  title: string;
  icon: string;
  tasks: Task[];
  columnId: string;
  color: string;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  showWarning?: boolean;
  onQuickAction?: (taskId: string, action: string, value?: any) => void;
}

function DeadlineColumn({ title, icon, tasks, columnId, color, onEdit, onDelete, showWarning, onQuickAction }: DeadlineColumnProps) {
  const taskIds = tasks.map(task => task.id);
  
  const { setNodeRef, isOver } = useDroppable({
    id: `deadline-${columnId}`,
    data: {
      type: 'deadline',
      columnId,
    },
  });

  return (
    <div 
      ref={setNodeRef}
      className={`${color} rounded-lg p-4 min-h-96 transition-colors ${
        isOver ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <span className="text-lg mr-2">{icon}</span>
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        <span className="bg-white rounded-full px-2 py-1 text-xs font-medium text-gray-600">
          {tasks.length}
        </span>
      </div>
      
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              showDeadlineWarning={showWarning}
              onQuickAction={onQuickAction}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export default function DeadlineKanbanBoard({ tasks, onTaskMove, onTaskEdit, onTaskDelete, onQuickAction }: DeadlineKanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = active.data.current?.task;
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveTask(null);
      return;
    }
    
    const activeTask = active.data.current?.task as Task;
    
    if (!activeTask) {
      setActiveTask(null);
      return;
    }
    
    if (over.data.current?.type === 'deadline') {
      const columnId = over.data.current.columnId as string;
      
      // カラムに基づいて期限を自動設定
      let newDueDate = '';
      const today = new Date();
      
      switch (columnId) {
        case 'overdue':
          // 期限切れ → 今日に設定
          newDueDate = today.toISOString().split('T')[0];
          break;
        case 'today':
          newDueDate = today.toISOString().split('T')[0];
          break;
        case 'thisWeek':
          const nextWeek = new Date(today);
          nextWeek.setDate(today.getDate() + 7);
          newDueDate = nextWeek.toISOString().split('T')[0];
          break;
        case 'thisMonth':
          const nextMonth = new Date(today);
          nextMonth.setMonth(today.getMonth() + 1);
          newDueDate = nextMonth.toISOString().split('T')[0];
          break;
        case 'later':
          const laterDate = new Date(today);
          laterDate.setMonth(today.getMonth() + 3);
          newDueDate = laterDate.toISOString().split('T')[0];
          break;
        case 'noDeadline':
          newDueDate = '';
          break;
      }
      
      if (activeTask.dueDate !== newDueDate) {
        onTaskMove(activeTask.id, newDueDate);
      }
    }
    
    setActiveTask(null);
  };

  const categorizeTasksByDeadline = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    return {
      overdue: tasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today && task.status !== 'COMPLETE';
      }),
      today: tasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === today.getTime();
      }),
      thisWeek: tasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate > today && dueDate <= nextWeek;
      }),
      thisMonth: tasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate > nextWeek && dueDate <= nextMonth;
      }),
      later: tasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate > nextMonth;
      }),
      noDeadline: tasks.filter(task => !task.dueDate || task.dueDate === '')
    };
  };

  const categorizedTasks = categorizeTasksByDeadline();

  const columns = [
    {
      id: 'overdue',
      title: '期限切れ',
      icon: '🚨',
      tasks: categorizedTasks.overdue,
      color: 'bg-red-100',
      showWarning: true
    },
    {
      id: 'today',
      title: '今日',
      icon: '📅',
      tasks: categorizedTasks.today,
      color: 'bg-orange-100'
    },
    {
      id: 'thisWeek',
      title: '今週',
      icon: '📆',
      tasks: categorizedTasks.thisWeek,
      color: 'bg-yellow-100'
    },
    {
      id: 'thisMonth',
      title: '今月',
      icon: '🗓️',
      tasks: categorizedTasks.thisMonth,
      color: 'bg-blue-100'
    },
    {
      id: 'later',
      title: 'それ以降',
      icon: '⏰',
      tasks: categorizedTasks.later,
      color: 'bg-green-100'
    },
    {
      id: 'noDeadline',
      title: '期限なし',
      icon: '♾️',
      tasks: categorizedTasks.noDeadline,
      color: 'bg-gray-100'
    }
  ];

  return (
    <div>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        collisionDetection={closestCorners}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {columns.map((column) => (
            <DeadlineColumn
              key={column.id}
              title={column.title}
              icon={column.icon}
              tasks={column.tasks}
              columnId={column.id}
              color={column.color}
              onEdit={onTaskEdit}
              onDelete={onTaskDelete}
              showWarning={column.showWarning}
              onQuickAction={onQuickAction}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}