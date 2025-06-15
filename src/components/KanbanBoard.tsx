"use client";

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Task, TASK_STATUS_LABELS, PRIORITY_LABELS } from '@/lib/types';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskMove: (taskId: string, newStatus: Task['status']) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onQuickAction?: (taskId: string, action: string, value?: any) => void;
}

interface Column {
  id: Task['status'];
  title: string;
  color: string;
}

const columns: Column[] = [
  { id: 'IDEA', title: 'アイデア', color: 'bg-gray-100' },
  { id: 'PLAN', title: '計画中', color: 'bg-blue-100' },
  { id: 'DO', title: '実行中', color: 'bg-yellow-100' },
  { id: 'CHECK', title: '課題・改善', color: 'bg-orange-100' },
  { id: 'COMPLETE', title: '完了', color: 'bg-green-100' },
  { id: 'KNOWLEDGE', title: 'ナレッジ昇華', color: 'bg-purple-100' },
  { id: 'DELETE', title: 'リスケ', color: 'bg-red-100' },
];

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onQuickAction?: (taskId: string, action: string, value?: any) => void;
}

function TaskCard({ task, onEdit, onDelete, onQuickAction }: TaskCardProps) {
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
      className={`bg-white rounded-lg shadow-sm border-l-4 ${getPriorityColor(task.priority)} p-4 cursor-grab hover:shadow-md transition-shadow`}
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
      
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span className="truncate">{task.user?.name || task.userId}</span>
        {task.dueDate && <span>{new Date(task.dueDate).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}</span>}
      </div>
      
      <div className="flex justify-between items-center mt-2">
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          task.priority === 'A' ? 'bg-red-100 text-red-800' :
          task.priority === 'B' ? 'bg-yellow-100 text-yellow-800' :
          task.priority === 'C' ? 'bg-orange-100 text-orange-800' :
          'bg-green-100 text-green-800'
        }`}>
          {PRIORITY_LABELS[task.priority]}
        </div>
        
        {/* クイックアクションボタン */}
        {onQuickAction && (
          <div className="flex gap-1">
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
    </div>
  );
}

interface ColumnProps {
  column: Column;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onQuickAction?: (taskId: string, action: string, value?: any) => void;
}

function Column({ column, tasks, onEdit, onDelete, onQuickAction }: ColumnProps) {
  const taskIds = tasks.map(task => task.id);
  
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: {
      type: 'column',
      column,
    },
  });

  return (
    <div 
      ref={setNodeRef}
      className={`${column.color} rounded-lg p-4 min-h-96 transition-colors ${
        isOver ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900">{column.title}</h3>
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
              onQuickAction={onQuickAction}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export default function KanbanBoard({ tasks, onTaskMove, onTaskEdit, onTaskDelete, onQuickAction }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  
  // ユーザー一覧を取得
  const users = Array.from(new Set(
    tasks.map(task => task.user?.name || task.userId || 'Unassigned')
  )).sort();
  
  // 選択されたユーザーのタスクをフィルタリング
  const filteredTasks = selectedUser === 'all' 
    ? tasks 
    : tasks.filter(task => 
        (task.user?.name || task.userId || 'Unassigned') === selectedUser
      );
  
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
    
    let newStatus: Task['status'] | null = null;
    
    if (over.data.current?.type === 'column') {
      // Dropped directly on a column
      const column = over.data.current.column as Column;
      newStatus = column.id;
    } else if (over.data.current?.type === 'task') {
      // Dropped on another task - use that task's status
      const targetTask = over.data.current.task as Task;
      newStatus = targetTask.status;
    }
    
    if (newStatus !== null && activeTask.status !== newStatus) {
      onTaskMove(activeTask.id, newStatus);
    }
    
    setActiveTask(null);
  };

  const getTasksByStatus = (status: Task['status']) => {
    return filteredTasks.filter(task => task.status === status);
  };

  return (
    <div>
      {/* ユーザータブ */}
      <div className="mb-6">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedUser('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedUser === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            すべて ({tasks.length})
          </button>
          {users.map((user) => {
            const userTaskCount = tasks.filter(task => 
              (task.user?.name || task.userId || 'Unassigned') === user
            ).length;
            
            return (
              <button
                key={user}
                onClick={() => setSelectedUser(user)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedUser === user 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {user} ({userTaskCount})
              </button>
            );
          })}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        collisionDetection={closestCorners}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              tasks={getTasksByStatus(column.id)}
              onEdit={onTaskEdit}
              onDelete={onTaskDelete}
              onQuickAction={onQuickAction}
            />
          ))}
        </div>
        
        <DragOverlay>
          {activeTask ? (
            <div className="bg-white rounded-lg shadow-lg border-l-4 border-l-blue-400 p-4 rotate-3">
              <h4 className="text-sm font-medium text-gray-900">
                {activeTask.title}
              </h4>
              <p className="text-xs text-gray-600 mt-1">
                {activeTask.description}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}