"use client";

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
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
import { Task } from '@/lib/types';
import { useKanbanMove, createTaskMoveRequest } from '@/lib/hooks/useKanbanMove';
import { 
  Target, 
  Lightbulb, 
  Play, 
  AlertTriangle, 
  CheckCircle, 
  Brain,
  Calendar,
  User,
  Edit,
  Clock,
  Flag
} from 'lucide-react';
import DueDateModal from './DueDateModal';
import TaskUpdateModal from './TaskUpdateModal';
import CompletionModal from './CompletionModal';
import SummaryModal from './SummaryModal';

interface EnhancedTaskKanbanProps {
  tasks: Task[];
  onTaskMove: (taskId: string, newStatus: Task['status']) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  currentTab?: 'status' | 'user' | 'project';
  users?: Array<{id: string; name: string}>;
  projects?: Array<{id: string; name: string}>;
}

interface ModalState {
  isOpen: boolean;
  taskId: string;
  targetStatus?: Task['status'];
  type?: 'dueDate' | 'update' | 'completion' | 'summary';
  fromStatus?: Task['status'];
}

interface Column {
  id: Task['status'];
  title: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

// DELETEカンバンを完全に廃止し、6つのカンバンに統一
const columns: Column[] = [
  { id: 'IDEA', title: 'アイデア', color: 'bg-gray-100', icon: Target },
  { id: 'PLAN', title: '計画中', color: 'bg-blue-100', icon: Lightbulb },
  { id: 'DO', title: '実行中', color: 'bg-yellow-100', icon: Play },
  { id: 'CHECK', title: '課題・改善', color: 'bg-orange-100', icon: AlertTriangle },
  { id: 'COMPLETE', title: '完了', color: 'bg-green-100', icon: CheckCircle },
  { id: 'KNOWLEDGE', title: 'ナレッジ昇華', color: 'bg-purple-100', icon: Brain },
];

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onUpdate: () => void;
}

function TaskCard({ task, onEdit, onUpdate }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'A': return 'bg-red-100 text-red-800 border-red-200';
      case 'B': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'C': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'D': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-50 rotate-5 bg-white rounded-lg border-2 border-dashed border-gray-300 p-4"
      >
        <div className="h-20"></div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing relative group"
    >
      {/* 更新アイコン（右上） */}
      <button
        onClick={onUpdate}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-gray-100 rounded"
        title="タスクを更新"
      >
        <Edit className="w-4 h-4 text-gray-500" />
      </button>

      {/* 優先度ラベル */}
      <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)} mb-2`}>
        <Flag className="w-3 h-3 inline mr-1" />
        {task.priority}
      </div>

      {/* タスクタイトル */}
      <h3 
        className="font-medium text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
        onClick={() => onEdit(task)}
      >
        {task.title}
      </h3>

      {/* タスク詳細情報 */}
      <div className="space-y-2">
        {task.dueDate && (
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>{new Date(task.dueDate).toLocaleDateString('ja-JP')}</span>
          </div>
        )}

        {task.assignedTo && (
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <User className="w-3 h-3" />
            <span>{task.assignedTo}</span>
          </div>
        )}

        {task.estimatedTime && (
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{task.estimatedTime}時間</span>
          </div>
        )}
      </div>

      {/* サマリー */}
      {task.summary && (
        <p className="text-xs text-gray-600 mt-2 line-clamp-2">
          {task.summary}
        </p>
      )}
    </div>
  );
}

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  onTaskEdit: (task: Task) => void;
  onTaskUpdate: (taskId: string) => void;
}

function KanbanColumn({ column, tasks, onTaskEdit, onTaskUpdate }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const IconComponent = column.icon;

  return (
    <div className="bg-gray-50 rounded-lg p-4 min-h-96 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <IconComponent className="w-5 h-5 text-gray-600" />
          <h2 className="font-semibold text-gray-800">{column.title}</h2>
          <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </div>
        
        {/* ドロップ時のヒント */}
        {isOver && (
          <span className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded">
            移動
          </span>
        )}
      </div>

      <div 
        ref={setNodeRef} 
        className={`
          flex-1 space-y-3 transition-all duration-200
          ${isOver ? 'bg-blue-100 ring-2 ring-blue-300 border-blue-400 border-2 border-dashed rounded-lg' : ''}
        `}
      >
        <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onTaskEdit}
              onUpdate={() => onTaskUpdate(task.id)}
            />
          ))}
        </SortableContext>
        
        {/* 空のカラムへのドロップヒント */}
        {isOver && tasks.length === 0 && (
          <div className="flex items-center justify-center h-32 text-blue-500 text-sm bg-blue-50 bg-opacity-75 rounded-lg border-2 border-dashed border-blue-300">
            タスクをドロップ
          </div>
        )}
      </div>
    </div>
  );
}

export default function EnhancedTaskKanban({
  tasks,
  onTaskMove,
  onTaskEdit,
  onTaskDelete,
  onTaskUpdate,
  currentTab = 'status',
  users = [],
  projects = []
}: EnhancedTaskKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dueDateModal, setDueDateModal] = useState<ModalState>({ isOpen: false, taskId: '' });
  const [updateModal, setUpdateModal] = useState<ModalState>({ isOpen: false, taskId: '' });
  const [completionModal, setCompletionModal] = useState<ModalState>({ isOpen: false, taskId: '' });
  const [summaryModal, setSummaryModal] = useState<ModalState>({ isOpen: false, taskId: '' });

  // 新しいカンバンAPI移動フック
  const { moveItem, isMoving, dragLoading, rollbackLastMove, canRollback } = useKanbanMove({
    enableOptimisticUpdate: true,
    showToastMessages: true,
    debounceDelay: 300,
    onSuccess: (data) => {
      console.log('タスク移動成功:', data);
    },
    onError: (error) => {
      console.error('タスク移動エラー:', error);
    }
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const task = tasks.find(t => t.id === active.id);
    if (!task) return;

    console.log('ドラッグエンド:', { activeId: active.id, overId: over.id, overData: over.data });
    
    // over.idがタスクIDの場合は、そのタスクのステータスを取得
    let newStatus: Task['status'];
    if (typeof over.id === 'string' && over.id.startsWith('task_')) {
      // タスクの上にドロップした場合、そのタスクのステータスを取得
      const targetTask = tasks.find(t => t.id === over.id);
      if (targetTask) {
        newStatus = targetTask.status;
      } else {
        console.error('ターゲットタスクが見つかりません:', over.id);
        return;
      }
    } else {
      // カラムの上にドロップした場合
      newStatus = over.id as Task['status'];
    }
    
    console.log('移動先ステータス:', newStatus);
    
    // ステータス移動フロー制御
    handleStatusChange(task, newStatus);
  };

  const handleStatusChange = async (task: Task, newValue: string) => {
    let moveRequest: any;
    
    // タブの種類に応じて移動リクエストを作成
    switch (currentTab) {
      case 'status':
        // ステータス変更（現在の実装）
        const newStatus = newValue as Task['status'];
        const transitionKey = `${task.status}_TO_${newStatus}`;
        
        // 既存のフロー制御ロジックを保持
        switch (transitionKey) {
          case 'IDEA_TO_PLAN':
            moveRequest = createTaskMoveRequest(task.id, newStatus, task.status);
            break;
          case 'PLAN_TO_DO':
            if (!task.dueDate) {
              setDueDateModal({
                isOpen: true,
                taskId: task.id,
                targetStatus: 'DO',
                type: 'dueDate'
              });
              return;
            }
            moveRequest = createTaskMoveRequest(task.id, newStatus, task.status);
            break;
          case 'DO_TO_CHECK':
            moveRequest = createTaskMoveRequest(task.id, newStatus, task.status);
            break;
          case 'CHECK_TO_COMPLETE':
            setCompletionModal({
              isOpen: true,
              taskId: task.id,
              type: 'completion'
            });
            return;
          case 'CHECK_TO_DO':
            setSummaryModal({
              isOpen: true,
              taskId: task.id,
              fromStatus: 'CHECK',
              type: 'summary'
            });
            return;
          case 'COMPLETE_TO_KNOWLEDGE':
            moveRequest = createTaskMoveRequest(task.id, newStatus, task.status);
            break;
          default:
            moveRequest = createTaskMoveRequest(task.id, newStatus, task.status);
            break;
        }
        await moveItem(moveRequest);
        onTaskMove(task.id, newStatus);
        break;
        
      case 'user':
        // 担当者変更
        moveRequest = {
          itemType: 'task' as const,
          itemId: task.id,
          sourceColumn: task.assignedTo || 'unassigned',
          targetColumn: newValue || 'unassigned',
          kanbanType: 'user' as const
        };
        await moveItem(moveRequest);
        onTaskUpdate(task.id, { assignedTo: newValue });
        break;
        
      case 'project':
        // プロジェクト移動
        moveRequest = {
          itemType: 'task' as const,
          itemId: task.id,
          sourceColumn: task.projectId || 'no_project',
          targetColumn: newValue || 'no_project',
          kanbanType: 'project' as const
        };
        await moveItem(moveRequest);
        onTaskUpdate(task.id, { projectId: newValue });
        break;
        
      default:
        console.error('未対応のタブタイプ:', currentTab);
        return;
    }
  };

  const handleTaskUpdateClick = (taskId: string) => {
    setUpdateModal({
      isOpen: true,
      taskId,
      type: 'update'
    });
  };

  const handleDueDateSet = (taskId: string, dueDate: string, priority?: Task['priority']) => {
    onTaskUpdate(taskId, { 
      dueDate, 
      ...(priority && { priority }),
      status: dueDateModal.targetStatus || 'DO'
    });
    setDueDateModal({ isOpen: false, taskId: '' });
  };

  const handleTaskUpdateAction = (taskId: string, action: 'reschedule' | 'improve' | 'delete', data?: any) => {
    switch (action) {
      case 'reschedule':
        onTaskUpdate(taskId, { dueDate: undefined, status: 'IDEA' });
        break;
      case 'improve':
        onTaskUpdate(taskId, { summary: data.improvements, status: 'DO' });
        break;
      case 'delete':
        onTaskDelete(taskId);
        break;
    }
    setUpdateModal({ isOpen: false, taskId: '' });
  };

  const handleCompletion = async (taskId: string, action: 'archive' | 'knowledge') => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const targetStatus = action === 'archive' ? 'COMPLETE' : 'KNOWLEDGE';
    const moveRequest = createTaskMoveRequest(taskId, targetStatus, task.status);
    await moveItem(moveRequest);
    
    // フォールバックとして従来のコールバックも呼び出し
    onTaskMove(taskId, targetStatus);
    setCompletionModal({ isOpen: false, taskId: '' });
  };

  const handleSummarySubmit = (taskId: string, summary: string) => {
    onTaskUpdate(taskId, { summary, status: 'DO' });
    setSummaryModal({ isOpen: false, taskId: '' });
  };

  const activeTask = activeId ? tasks.find(task => task.id === activeId) : null;

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(task => task.status === status);
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="relative">
          {/* ドラッグローディング表示 */}
          {dragLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50 rounded-lg">
              <div className="bg-white px-4 py-2 rounded-lg shadow-md flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                <span className="text-sm text-gray-700">タスクを移動中...</span>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {columns.map(column => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={getTasksByStatus(column.id)}
                onTaskEdit={onTaskEdit}
                onTaskUpdate={handleTaskUpdateClick}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeTask && (
            <TaskCard
              task={activeTask}
              onEdit={() => {}}
              onUpdate={() => {}}
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* モーダル群 */}
      <DueDateModal
        isOpen={dueDateModal.isOpen}
        onClose={() => setDueDateModal({ isOpen: false, taskId: '' })}
        onSubmit={handleDueDateSet}
        taskId={dueDateModal.taskId}
      />

      <TaskUpdateModal
        isOpen={updateModal.isOpen}
        onClose={() => setUpdateModal({ isOpen: false, taskId: '' })}
        onSubmit={handleTaskUpdateAction}
        taskId={updateModal.taskId}
      />

      <CompletionModal
        isOpen={completionModal.isOpen}
        onClose={() => setCompletionModal({ isOpen: false, taskId: '' })}
        onSubmit={handleCompletion}
        taskId={completionModal.taskId}
      />

      <SummaryModal
        isOpen={summaryModal.isOpen}
        onClose={() => setSummaryModal({ isOpen: false, taskId: '' })}
        onSubmit={handleSummarySubmit}
        taskId={summaryModal.taskId}
        fromStatus={summaryModal.fromStatus}
      />
    </>
  );
}